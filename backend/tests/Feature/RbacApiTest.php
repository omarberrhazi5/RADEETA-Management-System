<?php

namespace Tests\Feature;

use App\Enums\PanneStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Compteur;
use App\Models\Intervention;
use App\Models\Panne;
use App\Models\Releve;
use App\Models\Reparation;
use App\Models\User;
use App\Notifications\UtilityNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RbacApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_operator_cannot_delete_client(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Technician]);
        $client = Client::factory()->create();

        Sanctum::actingAs($operator);

        $this->deleteJson("/api/clients/{$client->id}")->assertForbidden();
    }

    public function test_operator_only_sees_assigned_pannes(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Technician]);
        $otherOperator = User::factory()->create(['role' => UserRole::Technician]);
        $assignedPanne = Panne::factory()->create(['assigned_to' => $operator->id]);
        Panne::factory()->create(['assigned_to' => $otherOperator->id]);

        Sanctum::actingAs($operator);

        $this->getJson('/api/pannes')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $assignedPanne->id);
    }

    public function test_technician_cannot_access_global_business_data(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Technician]);
        $otherOperator = User::factory()->create(['role' => UserRole::Technician]);
        $visibleCompteur = Compteur::factory()->create();
        $hiddenCompteur = Compteur::factory()->create();
        $visiblePanne = Panne::factory()->create(['id_compteur' => $visibleCompteur->id, 'assigned_to' => $operator->id]);
        Panne::factory()->create(['id_compteur' => $hiddenCompteur->id, 'assigned_to' => $otherOperator->id]);

        Releve::create([
            'compteur_id' => $visibleCompteur->id,
            'ancien_index' => 10,
            'nouvel_index' => 20,
            'periode_debut' => now()->startOfMonth()->toDateString(),
            'periode_fin' => now()->endOfMonth()->toDateString(),
            'created_by' => $operator->id,
        ]);

        Releve::create([
            'compteur_id' => $hiddenCompteur->id,
            'ancien_index' => 10,
            'nouvel_index' => 20,
            'periode_debut' => now()->startOfMonth()->toDateString(),
            'periode_fin' => now()->endOfMonth()->toDateString(),
            'created_by' => $otherOperator->id,
        ]);

        Sanctum::actingAs($operator);

        $this->getJson('/api/clients?limit=10')->assertForbidden();
        $this->getJson('/api/compteurs?limit=10')->assertForbidden();
        $this->getJson('/api/secteurs?limit=10')->assertForbidden();
        $this->getJson('/api/releves?limit=10')->assertForbidden();
        $this->getJson("/api/pannes/{$visiblePanne->id}")->assertOk();
        $this->getJson("/api/compteurs/{$hiddenCompteur->id}")->assertForbidden();
    }

    public function test_technician_cannot_create_readings_or_repairs(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Technician]);
        $assignedMeter = Compteur::factory()->create();
        $assignedPanne = Panne::factory()->create(['id_compteur' => $assignedMeter->id, 'assigned_to' => $operator->id]);

        Sanctum::actingAs($operator);

        $this->postJson('/api/releves', [
            'compteur_id' => $assignedMeter->id,
            'ancien_index' => 10,
            'nouvel_index' => 18,
            'periode_debut' => now()->startOfMonth()->toDateString(),
            'periode_fin' => now()->endOfMonth()->toDateString(),
        ])->assertForbidden();

        $this->postJson('/api/reparations', [
            'id_panne' => $assignedPanne->id,
            'id_plombier' => $operator->id,
            'date_reparation' => $assignedPanne->date_panne->toDateString(),
            'description' => 'Technician should not create repairs.',
        ])->assertForbidden();
    }

    public function test_technician_cannot_access_repairs(): void
    {
        $technician = User::factory()->create(['role' => UserRole::Technician]);
        $otherTechnician = User::factory()->create(['role' => UserRole::Technician]);
        $assignedPanne = Panne::factory()->create(['assigned_to' => $technician->id]);
        $otherPanne = Panne::factory()->create(['assigned_to' => $otherTechnician->id]);
        Reparation::factory()->create([
            'id_panne' => $assignedPanne->id,
            'id_plombier' => $technician->id,
            'date_reparation' => $assignedPanne->date_panne->toDateString(),
            'description' => 'Initial repair progress.',
        ]);
        Reparation::factory()->create([
            'id_panne' => $otherPanne->id,
            'id_plombier' => $otherTechnician->id,
        ]);

        Sanctum::actingAs($technician);

        $this->getJson('/api/reparations')->assertForbidden();
        $this->putJson('/api/reparations/1', [
            'description' => 'Unauthorized update.',
        ])->assertForbidden();
    }

    public function test_viewer_has_read_only_access(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Viewer]));

        $this->getJson('/api/clients')->assertOk();
        $this->getJson('/api/compteurs')->assertOk();
        $this->getJson('/api/secteurs')->assertOk();
        $this->getJson('/api/pannes')->assertOk();
        $this->getJson('/api/interventions')->assertOk();
        $this->getJson('/api/reparations')->assertForbidden();
        $this->postJson('/api/clients', [
            'police' => 'POL-910001',
            'nom' => 'Viewer',
        ])->assertForbidden();
    }

    public function test_meter_api_returns_operational_fields_with_fallbacks(): void
    {
        $responsable = User::factory()->create(['role' => UserRole::Responsable]);
        $completeMeter = Compteur::factory()->create([
            'num_contrat' => 'CTR-900001',
            'num_tournee' => 'TR-042',
            'usage' => 'Patente',
        ]);
        $legacyMeter = Compteur::factory()->create([
            'num_contrat' => null,
            'num_tournee' => null,
            'usage' => null,
        ]);

        Sanctum::actingAs($responsable);

        $this->getJson("/api/compteurs/{$completeMeter->id}")
            ->assertOk()
            ->assertJsonPath('data.num_contrat', 'CTR-900001')
            ->assertJsonPath('data.num_tournee', 'TR-042')
            ->assertJsonPath('data.usage', 'Patente');

        $this->getJson("/api/compteurs/{$legacyMeter->id}")
            ->assertOk()
            ->assertJsonPath('data.num_contrat', 'N/A')
            ->assertJsonPath('data.num_tournee', 'N/A')
            ->assertJsonPath('data.usage', 'N/A');
    }

    public function test_directeur_can_access_dashboard_statistics(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Directeur]));

        $this->getJson('/api/dashboard/stats')
            ->assertOk()
            ->assertJsonStructure([
                'total_clients',
                'total_compteurs',
                'pannes_ouvertes',
                'total_interventions',
                'interventions_mois',
                'water_pannes',
                'electricity_pannes',
            ]);
    }

    public function test_authenticated_roles_can_fetch_notifications(): void
    {
        foreach ([UserRole::Directeur, UserRole::Responsable, UserRole::Manager, UserRole::Technician, UserRole::Viewer] as $role) {
            Sanctum::actingAs(User::factory()->create(['role' => $role]));
            $this->getJson('/api/notifications')->assertOk();
        }
    }

    public function test_notifications_are_filtered_by_role_and_assignment(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $technician = User::factory()->create(['role' => UserRole::Technician]);
        $viewer = User::factory()->create(['role' => UserRole::Viewer]);

        $manager->notify(new UtilityNotification('RBAC settings changed', 'Security role matrix updated.', 'rbac_changed'));
        $manager->notify(new UtilityNotification('Delayed intervention', '3 delayed interventions detected.', 'delayed_intervention'));

        $technician->notify(new UtilityNotification('Assigned intervention', 'You have been assigned to intervention #INT-55.', 'intervention_assigned', ['technician_id' => $technician->id]));
        $technician->notify(new UtilityNotification('Other assignment', 'Another technician was assigned.', 'intervention_assigned', ['technician_id' => $technician->id + 999]));
        $technician->notify(new UtilityNotification('System alert', 'Sensitive system alert.', 'system_alert'));

        $viewer->notify(new UtilityNotification('Monthly report available', 'Monthly report available.', 'monthly_report_available'));
        $viewer->notify(new UtilityNotification('Technician assigned', 'Technician assigned to intervention #INT-203.', 'intervention_assigned'));

        Sanctum::actingAs($manager);
        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonMissing(['type' => 'rbac_changed'])
            ->assertJsonFragment(['type' => 'delayed_intervention']);

        Sanctum::actingAs($technician);
        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonMissing(['message' => 'Sensitive system alert.'])
            ->assertJsonMissing(['message' => 'Another technician was assigned.'])
            ->assertJsonFragment(['message' => 'You have been assigned to intervention #INT-55.']);

        Sanctum::actingAs($viewer);
        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonMissing(['type' => 'intervention_assigned'])
            ->assertJsonFragment(['type' => 'monthly_report_available']);
    }

    public function test_only_directeur_can_access_administration_endpoints(): void
    {
        ActivityLog::create([
            'action' => 'Connexion utilisateur',
            'module' => 'Administration',
            'ip_address' => '127.0.0.1',
        ]);

        foreach ([UserRole::Responsable, UserRole::Manager, UserRole::Technician, UserRole::Viewer, UserRole::Developer] as $role) {
            Sanctum::actingAs(User::factory()->create(['role' => $role]));

            $this->getJson('/api/users')->assertForbidden();
            $this->postJson('/api/users', $this->newUserPayload())->assertForbidden();
            $this->getJson('/api/logs')->assertForbidden();
            $this->getJson('/api/settings')->assertForbidden();
            $this->putJson('/api/settings', $this->settingsPayload())->assertForbidden();
        }

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Directeur]));

        $this->getJson('/api/users')->assertOk();
        $this->postJson('/api/users', $this->newUserPayload())->assertCreated();
        $this->getJson('/api/logs')->assertOk();
        $this->getJson('/api/settings')->assertOk();
        $this->putJson('/api/settings', $this->settingsPayload())->assertOk();
    }

    public function test_directeur_user_management_supports_edit_reset_and_delete_with_self_protection(): void
    {
        $directeur = User::factory()->create(['role' => UserRole::Directeur]);
        $managed = User::factory()->create(['role' => UserRole::Viewer, 'nom' => 'Lecteur', 'email' => 'lecteur@srm-fm.test']);

        Sanctum::actingAs($directeur);

        $this->putJson("/api/users/{$managed->id}", [
            'nom' => 'Manager',
            'prenom' => 'Operations',
            'email' => 'manager.ops@srm-fm.test',
            'role' => UserRole::Manager->value,
        ])->assertOk()
            ->assertJsonPath('data.role', UserRole::Manager->value);

        $this->patchJson("/api/users/{$managed->id}/password", [
            'password' => 'NewSecure123',
            'password_confirmation' => 'NewSecure123',
        ])->assertOk();

        $this->assertTrue(Hash::check('NewSecure123', $managed->refresh()->password));

        $this->putJson("/api/users/{$directeur->id}", [
            'role' => UserRole::Viewer->value,
        ])->assertUnprocessable();

        $this->deleteJson("/api/users/{$directeur->id}")->assertUnprocessable();

        $this->deleteJson("/api/users/{$managed->id}")->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $managed->id]);
    }

    public function test_directeur_can_create_repairs_and_responsable_is_read_only(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Technician]);
        $directeurPanne = Panne::factory()->create();
        $responsablePanne = Panne::factory()->create();

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Directeur]));
        $this->postJson('/api/reparations', [
            'id_panne' => $directeurPanne->id,
            'id_plombier' => $operator->id,
            'date_reparation' => $directeurPanne->date_panne->toDateString(),
            'description' => 'Repair created by directeur.',
        ])->assertCreated();

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Responsable]));
        $this->postJson('/api/reparations', [
            'id_panne' => $responsablePanne->id,
            'id_plombier' => $operator->id,
            'date_reparation' => $responsablePanne->date_panne->toDateString(),
            'description' => 'Repair created by responsable.',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Action non autorisée');
    }

    public function test_responsable_and_manager_can_access_reports(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Responsable]));

        $this->getJson('/api/reports/export?type=monthly&format=pdf&content=anomalies&year=2026&month=5')
            ->assertOk();

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Manager]));

        $this->getJson('/api/reports/export?type=monthly&format=pdf&content=anomalies&year=2026&month=5')
            ->assertOk();

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Technician]));

        $this->getJson('/api/reports/export?type=monthly&format=pdf&content=anomalies&year=2026&month=5')
            ->assertForbidden();
    }

    public function test_manager_can_supervise_and_create_interventions_but_cannot_modify_audit_records(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $operator = User::factory()->create(['role' => UserRole::Technician]);
        $panne = Panne::factory()->create();
        $intervention = Intervention::create([
            'panne_id' => $panne->id,
            'technician_id' => $operator->id,
            'started_at' => now(),
            'work_type' => 'inspection',
            'priority' => 'normal',
            'status' => 'en_attente',
        ]);

        Sanctum::actingAs($manager);

        $this->getJson('/api/reparations')->assertOk();
        $this->getJson('/api/interventions')->assertOk();
        $this->postJson('/api/pannes', [
            'id_compteur' => Compteur::factory()->create()->id,
            'date_panne' => now()->toDateString(),
            'anomalie' => 'compteur_bloque',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Action non autorisée');
        $this->postJson('/api/reparations', [
            'id_panne' => $panne->id,
            'id_plombier' => $operator->id,
            'date_reparation' => $panne->date_panne->toDateString(),
            'description' => 'Manager should not create repairs.',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Action non autorisée');
        $this->postJson('/api/interventions', [
            'panne_id' => $panne->id,
            'technician_id' => $operator->id,
            'intervention_at' => now()->format('Y-m-d H:i:s'),
            'work_type' => 'inspection',
            'priority' => 'normal',
            'status' => 'en_cours',
        ])->assertCreated();
        $this->putJson("/api/interventions/{$intervention->id}", [
            'status' => 'en_cours',
            'work_type' => 'manager should not change this',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Action non autorisée');
        $this->assertDatabaseHas('interventions', [
            'id' => $intervention->id,
            'status' => 'en_attente',
            'work_type' => 'inspection',
        ]);
        $this->deleteJson("/api/interventions/{$intervention->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'Action non autorisée');
    }

    public function test_monitoring_roles_cannot_update_or_delete_audit_records(): void
    {
        $technician = User::factory()->create(['role' => UserRole::Technician]);
        $panne = Panne::factory()->create(['assigned_to' => $technician->id]);
        $repair = Reparation::factory()->create([
            'id_panne' => $panne->id,
            'id_plombier' => $technician->id,
            'date_reparation' => $panne->date_panne->toDateString(),
        ]);
        $intervention = Intervention::create([
            'panne_id' => $panne->id,
            'technician_id' => $technician->id,
            'started_at' => now(),
            'work_type' => 'inspection',
            'priority' => 'normal',
            'status' => 'en_attente',
        ]);

        foreach ([UserRole::Responsable, UserRole::Manager] as $role) {
            Sanctum::actingAs(User::factory()->create(['role' => $role]));

            $createAnomalyResponse = $this->postJson('/api/pannes', [
                'id_compteur' => Compteur::factory()->create(['service_type' => 'water'])->id,
                'date_panne' => now()->toDateString(),
                'anomalie' => 'compteur_bloque',
            ]);

            if ($role === UserRole::Responsable) {
                $createAnomalyResponse->assertCreated();
            } else {
                $createAnomalyResponse
                    ->assertForbidden()
                    ->assertJsonPath('message', 'Action non autorisée');
            }

            $this->putJson("/api/pannes/{$panne->id}", ['status' => PanneStatus::Resolved->value])
                ->assertForbidden()
                ->assertJsonPath('message', 'Action non autorisée');
            $this->deleteJson("/api/pannes/{$panne->id}")
                ->assertForbidden()
                ->assertJsonPath('message', 'Action non autorisée');

            $this->postJson('/api/reparations', [
                'id_panne' => $panne->id,
                'id_plombier' => $technician->id,
                'date_reparation' => $panne->date_panne->toDateString(),
                'description' => 'Tamper attempt',
            ])
                ->assertForbidden()
                ->assertJsonPath('message', 'Action non autorisée');
            $this->putJson("/api/reparations/{$repair->id}", ['description' => 'Tamper attempt'])
                ->assertForbidden()
                ->assertJsonPath('message', 'Action non autorisée');
            $this->deleteJson("/api/reparations/{$repair->id}")
                ->assertForbidden()
                ->assertJsonPath('message', 'Action non autorisée');

            $this->putJson("/api/interventions/{$intervention->id}", ['status' => 'en_cours'])
                ->assertForbidden()
                ->assertJsonPath('message', 'Action non autorisée');
            $this->deleteJson("/api/interventions/{$intervention->id}")
                ->assertForbidden()
                ->assertJsonPath('message', 'Action non autorisée');
        }
    }

    public function test_technician_can_update_only_assigned_interventions(): void
    {
        $technician = User::factory()->create(['role' => UserRole::Technician]);
        $assignedPanne = Panne::factory()->create(['assigned_to' => $technician->id]);
        $otherPanne = Panne::factory()->create();
        $assignedIntervention = Intervention::create([
            'panne_id' => $assignedPanne->id,
            'technician_id' => $technician->id,
            'started_at' => now(),
            'work_type' => 'repair',
            'priority' => 'normal',
            'status' => 'en_attente',
        ]);
        $otherIntervention = Intervention::create([
            'panne_id' => $otherPanne->id,
            'technician_id' => User::factory()->create(['role' => UserRole::Technician])->id,
            'started_at' => now(),
            'work_type' => 'inspection',
            'priority' => 'normal',
            'status' => 'en_attente',
        ]);

        Sanctum::actingAs($technician);

        $this->getJson('/api/interventions')->assertOk()->assertJsonCount(1, 'data');
        $this->postJson('/api/interventions', [
            'panne_id' => $assignedPanne->id,
            'technician_id' => $technician->id,
            'intervention_at' => now()->format('Y-m-d H:i:s'),
            'work_type' => 'repair',
            'priority' => 'normal',
            'status' => 'terminee',
        ])->assertForbidden();

        $this->putJson("/api/interventions/{$assignedIntervention->id}", [
            'status' => 'terminee',
            'material_used' => "Joint\nCable",
            'observations' => 'Technical report completed.',
            'latitude' => '34.211100',
            'longitude' => '-4.011100',
            'location_note' => 'Pres du compteur principal',
            'work_type' => 'should be ignored',
        ])->assertOk()
            ->assertJsonPath('data.status', 'terminee')
            ->assertJsonPath('data.latitude', '34.211100')
            ->assertJsonPath('data.longitude', '-4.011100')
            ->assertJsonPath('data.location_note', 'Pres du compteur principal');

        $this->assertDatabaseHas('interventions', [
            'id' => $assignedIntervention->id,
            'status' => 'terminee',
            'work_type' => 'repair',
            'latitude' => '34.211100',
            'longitude' => '-4.011100',
            'location_note' => 'Pres du compteur principal',
        ]);
        $this->assertDatabaseHas('reparations', [
            'id_panne' => $assignedPanne->id,
            'id_plombier' => $technician->id,
            'description' => 'Technical report completed.',
            'latitude' => '34.211100',
            'longitude' => '-4.011100',
            'location_note' => 'Pres du compteur principal',
        ]);
        $this->assertDatabaseHas('pannes', [
            'id' => $assignedPanne->id,
            'status' => PanneStatus::Resolved->value,
        ]);

        $this->putJson("/api/interventions/{$otherIntervention->id}", [
            'status' => 'en_cours',
        ])->assertForbidden();
    }

    public function test_assigned_anomaly_creates_pending_intervention(): void
    {
        $directeur = User::factory()->create(['role' => UserRole::Directeur]);
        $technician = User::factory()->create(['role' => UserRole::Technician]);
        $compteur = Compteur::factory()->create(['service_type' => 'water']);

        Sanctum::actingAs($directeur);

        $response = $this->postJson('/api/pannes', [
            'id_compteur' => $compteur->id,
            'date_panne' => now()->toDateString(),
            'anomalie' => 'fuite_apres_compteur',
            'description' => 'Leak assigned for field repair.',
            'technicien_id' => $technician->id,
            'priorite' => 'urgent',
            'status' => 'open',
        ])->assertCreated();

        $panneId = $response->json('data.id');

        $this->assertDatabaseHas('interventions', [
            'panne_id' => $panneId,
            'technician_id' => $technician->id,
            'meter_id' => $compteur->id,
            'priority' => 'urgent',
            'status' => 'en_attente',
        ]);

        Sanctum::actingAs($technician);

        $this->getJson('/api/interventions')
            ->assertOk()
            ->assertJsonFragment([
                'panne_id' => $panneId,
                'technician_id' => $technician->id,
                'status' => 'en_attente',
            ]);
    }

    public function test_operational_indexes_return_newest_records_first_with_pagination(): void
    {
        $responsable = User::factory()->create(['role' => UserRole::Responsable]);
        $technician = User::factory()->create(['role' => UserRole::Technician]);

        $oldMeter = Compteur::factory()->create(['created_at' => now()->subDays(2)]);
        $newMeter = Compteur::factory()->create(['created_at' => now()]);

        $oldPanne = Panne::factory()->create(['created_at' => now()->subDays(2)]);
        $newPanne = Panne::factory()->create(['created_at' => now()]);

        $oldIntervention = Intervention::create([
            'panne_id' => $oldPanne->id,
            'technician_id' => $technician->id,
            'started_at' => now()->subDays(2),
            'work_type' => 'old inspection',
            'priority' => 'normal',
            'status' => 'en_attente',
        ]);
        $newIntervention = Intervention::create([
            'panne_id' => $newPanne->id,
            'technician_id' => $technician->id,
            'started_at' => now()->subDays(2),
            'work_type' => 'new inspection',
            'priority' => 'normal',
            'status' => 'en_attente',
        ]);
        $oldIntervention->forceFill([
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ])->save();
        $newIntervention->forceFill([
            'created_at' => now(),
            'updated_at' => now(),
        ])->save();

        $oldRepair = Reparation::factory()->create([
            'id_panne' => $oldPanne->id,
            'id_plombier' => $technician->id,
            'created_at' => now()->subDays(2),
        ]);
        $newRepair = Reparation::factory()->create([
            'id_panne' => $newPanne->id,
            'id_plombier' => $technician->id,
            'created_at' => now(),
        ]);

        Sanctum::actingAs($responsable);

        $this->getJson('/api/compteurs?limit=1')
            ->assertOk()
            ->assertJsonPath('data.0.id', $newMeter->id);

        $this->getJson('/api/pannes?limit=1')
            ->assertOk()
            ->assertJsonPath('data.0.id', $newPanne->id);

        $this->getJson('/api/interventions?limit=1')
            ->assertOk()
            ->assertJsonPath('data.0.id', $newIntervention->id);

        $this->getJson('/api/reparations?limit=1')
            ->assertOk()
            ->assertJsonPath('data.0.id', $newRepair->id);
    }

    private function newUserPayload(): array
    {
        return [
            'nom' => 'Controle',
            'prenom' => 'Directeur',
            'identifiant' => 'controle.directeur',
            'email' => 'controle.directeur@srm-fm.ma',
            'agence' => 'SRM-FM Taza',
            'password' => 'password-secret',
            'role' => UserRole::Viewer->value,
        ];
    }

    private function settingsPayload(): array
    {
        return [
            'agency_name' => 'SRM-FM Taza',
            'application_name' => 'SRM-FM',
            'default_language' => 'fr',
            'notification_preferences' => [
                'email' => true,
                'in_app' => true,
                'daily_digest' => false,
            ],
            'dashboard_preferences' => [
                'show_maps' => true,
                'show_charts' => true,
                'compact_cards' => false,
            ],
        ];
    }
}
