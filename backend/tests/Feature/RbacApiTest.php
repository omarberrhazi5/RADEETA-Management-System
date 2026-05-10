<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Compteur;
use App\Models\Intervention;
use App\Models\Panne;
use App\Models\Releve;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_directeur_and_responsable_can_fetch_notifications(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Directeur]));
        $this->getJson('/api/notifications')->assertOk();

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Responsable]));
        $this->getJson('/api/notifications')->assertOk();

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Manager]));
        $this->getJson('/api/notifications')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Technician]));
        $this->getJson('/api/notifications')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Viewer]));
        $this->getJson('/api/notifications')->assertForbidden();
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

    public function test_directeur_and_responsable_can_create_repairs(): void
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
        ])->assertCreated();
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

    public function test_manager_can_supervise_but_cannot_create_or_delete_operational_records(): void
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
        ])->assertForbidden();
        $this->postJson('/api/reparations', [
            'id_panne' => $panne->id,
            'id_plombier' => $operator->id,
            'date_reparation' => $panne->date_panne->toDateString(),
            'description' => 'Manager should not create repairs.',
        ])->assertForbidden();
        $this->postJson('/api/interventions', [
            'panne_id' => $panne->id,
            'technician_id' => $operator->id,
            'intervention_at' => now()->format('Y-m-d H:i:s'),
            'work_type' => 'inspection',
            'priority' => 'normal',
            'status' => 'en_cours',
        ])->assertForbidden();
        $this->putJson("/api/interventions/{$intervention->id}", [
            'status' => 'en_cours',
            'work_type' => 'manager should not change this',
        ])->assertOk();
        $this->assertDatabaseHas('interventions', [
            'id' => $intervention->id,
            'status' => 'en_cours',
            'work_type' => 'inspection',
        ]);
        $this->deleteJson("/api/interventions/{$intervention->id}")->assertForbidden();
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
            'work_type' => 'should be ignored',
        ])->assertOk()
            ->assertJsonPath('data.status', 'terminee');

        $this->assertDatabaseHas('interventions', [
            'id' => $assignedIntervention->id,
            'status' => 'terminee',
            'work_type' => 'repair',
        ]);

        $this->putJson("/api/interventions/{$otherIntervention->id}", [
            'status' => 'en_cours',
        ])->assertForbidden();
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
