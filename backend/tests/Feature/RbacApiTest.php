<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Compteur;
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

    public function test_operator_business_data_is_scoped_to_assigned_work(): void
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

        $this->getJson('/api/clients?limit=10')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $visibleCompteur->id_client);

        $this->getJson("/api/pannes/{$visiblePanne->id}")->assertOk();
        $this->getJson("/api/compteurs/{$hiddenCompteur->id}")->assertForbidden();
        $this->getJson('/api/releves?limit=10')->assertOk();
    }

    public function test_operator_can_create_reading_for_meter_in_assigned_task_sector_only(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Technician]);
        $assignedMeter = Compteur::factory()->create();
        $sameSectorMeter = Compteur::factory()->create(['id_secteur' => $assignedMeter->id_secteur]);
        $otherSectorMeter = Compteur::factory()->create();
        Panne::factory()->create(['id_compteur' => $assignedMeter->id, 'assigned_to' => $operator->id]);

        Sanctum::actingAs($operator);

        $this->postJson('/api/releves', [
            'compteur_id' => $sameSectorMeter->id,
            'ancien_index' => 10,
            'nouvel_index' => 18,
            'periode_debut' => now()->startOfMonth()->toDateString(),
            'periode_fin' => now()->endOfMonth()->toDateString(),
        ])
            ->assertCreated()
            ->assertJsonPath('data.compteur_id', $sameSectorMeter->id);

        $this->postJson('/api/releves', [
            'compteur_id' => $otherSectorMeter->id,
            'ancien_index' => 10,
            'nouvel_index' => 18,
            'periode_debut' => now()->startOfMonth()->toDateString(),
            'periode_fin' => now()->endOfMonth()->toDateString(),
        ])->assertForbidden();
    }

    public function test_viewer_has_read_only_access(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Viewer]));

        $this->getJson('/api/clients')->assertOk();
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

    public function test_technician_can_create_intervention_for_assigned_panne(): void
    {
        $technician = User::factory()->create(['role' => UserRole::Technician]);
        $assignedPanne = Panne::factory()->create(['assigned_to' => $technician->id]);
        $otherPanne = Panne::factory()->create();

        Sanctum::actingAs($technician);

        $this->postJson('/api/interventions', [
            'panne_id' => $assignedPanne->id,
            'technician_id' => $technician->id,
            'intervention_at' => now()->format('Y-m-d H:i:s'),
            'work_type' => 'repair',
            'material_used' => "Joint\nCable",
            'observations' => 'Technical report completed.',
            'priority' => 'normal',
            'status' => 'terminee',
        ])->assertCreated()
            ->assertJsonPath('data.panne_id', $assignedPanne->id)
            ->assertJsonPath('data.status', 'terminee');

        $this->postJson('/api/interventions', [
            'panne_id' => $otherPanne->id,
            'technician_id' => $technician->id,
            'intervention_at' => now()->format('Y-m-d H:i:s'),
            'work_type' => 'inspection',
            'priority' => 'normal',
            'status' => 'en_cours',
        ])->assertForbidden();
    }
}
