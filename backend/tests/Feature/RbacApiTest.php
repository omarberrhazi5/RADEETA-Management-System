<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Compteur;
use App\Models\Facture;
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
        $operator = User::factory()->create(['role' => UserRole::Operator]);
        $client = Client::factory()->create();

        Sanctum::actingAs($operator);

        $this->deleteJson("/api/clients/{$client->id}")->assertForbidden();
    }

    public function test_operator_only_sees_assigned_pannes(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Operator]);
        $otherOperator = User::factory()->create(['role' => UserRole::Operator]);
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
        $operator = User::factory()->create(['role' => UserRole::Operator]);
        $otherOperator = User::factory()->create(['role' => UserRole::Operator]);
        $visibleCompteur = Compteur::factory()->create();
        $hiddenCompteur = Compteur::factory()->create();
        $visiblePanne = Panne::factory()->create(['id_compteur' => $visibleCompteur->id, 'assigned_to' => $operator->id]);
        Panne::factory()->create(['id_compteur' => $hiddenCompteur->id, 'assigned_to' => $otherOperator->id]);
        $visibleReleve = Releve::create([
            'compteur_id' => $visibleCompteur->id,
            'ancien_index' => 10,
            'nouvel_index' => 20,
            'periode_debut' => now()->startOfMonth()->toDateString(),
            'periode_fin' => now()->endOfMonth()->toDateString(),
            'created_by' => $operator->id,
        ]);
        $hiddenReleve = Releve::create([
            'compteur_id' => $hiddenCompteur->id,
            'ancien_index' => 10,
            'nouvel_index' => 20,
            'periode_debut' => now()->startOfMonth()->toDateString(),
            'periode_fin' => now()->endOfMonth()->toDateString(),
            'created_by' => $otherOperator->id,
        ]);
        Facture::create([
            'client_id' => $visibleCompteur->id_client,
            'compteur_id' => $visibleCompteur->id,
            'releve_id' => $visibleReleve->id,
            'reference' => 'FAC-OP-VISIBLE',
            'montant_ht' => 100,
            'taxes' => 10,
            'tva' => 7.70,
            'total_ttc' => 117.70,
            'statut' => Facture::STATUT_IMPAYEE,
            'due_date' => now()->addDays(10)->toDateString(),
            'generated_at' => now(),
        ]);
        Facture::create([
            'client_id' => $hiddenCompteur->id_client,
            'compteur_id' => $hiddenCompteur->id,
            'releve_id' => $hiddenReleve->id,
            'reference' => 'FAC-OP-HIDDEN',
            'montant_ht' => 100,
            'taxes' => 10,
            'tva' => 7.70,
            'total_ttc' => 117.70,
            'statut' => Facture::STATUT_IMPAYEE,
            'due_date' => now()->addDays(10)->toDateString(),
            'generated_at' => now(),
        ]);

        Sanctum::actingAs($operator);

        $this->getJson('/api/clients?limit=10')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $visibleCompteur->id_client);

        $this->getJson("/api/pannes/{$visiblePanne->id}")->assertOk();
        $this->getJson("/api/compteurs/{$hiddenCompteur->id}")->assertForbidden();

        $this->getJson('/api/releves?limit=10')
            ->assertOk()
            ->assertJsonMissingPath('data.0.facture.id');

        $this->getJson('/api/factures?limit=10')->assertForbidden();
    }

    public function test_operator_cannot_access_invoices_or_payments(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Operator]);
        $compteur = Compteur::factory()->create();
        $releve = Releve::create([
            'compteur_id' => $compteur->id,
            'ancien_index' => 10,
            'nouvel_index' => 20,
            'periode_debut' => now()->startOfMonth()->toDateString(),
            'periode_fin' => now()->endOfMonth()->toDateString(),
        ]);
        $facture = Facture::create([
            'client_id' => $compteur->id_client,
            'compteur_id' => $compteur->id,
            'releve_id' => $releve->id,
            'reference' => 'FAC-OP-PAYMENT',
            'montant_ht' => 100,
            'taxes' => 10,
            'tva' => 7.70,
            'total_ttc' => 117.70,
            'statut' => Facture::STATUT_IMPAYEE,
            'due_date' => now()->addDays(10)->toDateString(),
            'generated_at' => now(),
        ]);

        Sanctum::actingAs($operator);

        $this->getJson('/api/factures')->assertForbidden();
        $this->getJson("/api/factures/{$facture->id}")->assertForbidden();
        $this->getJson("/api/factures/{$facture->id}/preview")->assertForbidden();
        $this->getJson("/api/factures/{$facture->id}/pdf")->assertForbidden();
        $this->postJson('/api/factures', ['releve_id' => 1])->assertForbidden();
        $this->postJson("/api/factures/{$facture->id}/paiements", [
            'montant' => 50,
            'mode' => 'cash',
            'paid_at' => now()->toDateString(),
        ])->assertForbidden();
        $this->getJson('/api/paiements')->assertForbidden();
    }

    public function test_viewer_keeps_read_only_invoice_access(): void
    {
        $viewer = User::factory()->create(['role' => UserRole::Viewer]);
        $compteur = Compteur::factory()->create();
        $releve = Releve::create([
            'compteur_id' => $compteur->id,
            'ancien_index' => 10,
            'nouvel_index' => 20,
            'periode_debut' => now()->startOfMonth()->toDateString(),
            'periode_fin' => now()->endOfMonth()->toDateString(),
        ]);
        $facture = Facture::create([
            'client_id' => $compteur->id_client,
            'compteur_id' => $compteur->id,
            'releve_id' => $releve->id,
            'reference' => 'FAC-VIEWER-READ',
            'montant_ht' => 100,
            'taxes' => 10,
            'tva' => 7.70,
            'total_ttc' => 117.70,
            'statut' => Facture::STATUT_IMPAYEE,
            'due_date' => now()->addDays(10)->toDateString(),
            'generated_at' => now(),
        ]);

        Sanctum::actingAs($viewer);

        $this->getJson('/api/factures')->assertOk();
        $this->getJson("/api/factures/{$facture->id}")->assertOk();
        $this->postJson('/api/factures', ['releve_id' => $releve->id])->assertForbidden();
    }

    public function test_operator_can_create_reading_for_meter_in_assigned_task_sector_only(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Operator]);
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

    public function test_super_admin_can_access_dashboard_statistics(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::SuperAdmin]));

        $this->getJson('/api/dashboard/stats')
            ->assertOk()
            ->assertJsonStructure([
                'total_clients',
                'total_compteurs',
                'pannes_ouvertes',
                'reparations_mois',
                'total_invoices',
                'unpaid_invoices',
                'total_consumption',
                'monthly_revenue',
                'active_meters',
            ]);
    }

    public function test_unbilled_releves_filter_and_invoice_generation_flow(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Admin]));

        $compteur = Compteur::factory()->create();
        $billedReleve = Releve::create([
            'compteur_id' => $compteur->id,
            'ancien_index' => 100,
            'nouvel_index' => 132,
            'periode_debut' => now()->subMonth()->startOfMonth()->toDateString(),
            'periode_fin' => now()->subMonth()->endOfMonth()->toDateString(),
        ]);
        $unbilledReleve = Releve::create([
            'compteur_id' => $compteur->id,
            'ancien_index' => 132,
            'nouvel_index' => 167,
            'periode_debut' => now()->startOfMonth()->toDateString(),
            'periode_fin' => now()->endOfMonth()->toDateString(),
        ]);

        Facture::create([
            'client_id' => $compteur->id_client,
            'compteur_id' => $compteur->id,
            'releve_id' => $billedReleve->id,
            'reference' => 'FAC-TEST-001',
            'montant_ht' => 100,
            'taxes' => 20,
            'tva' => 16.8,
            'total_ttc' => 136.8,
            'statut' => Facture::STATUT_IMPAYEE,
            'due_date' => now()->addDays(15)->toDateString(),
            'generated_at' => now(),
        ]);

        $this->getJson('/api/releves?unbilled=true&limit=10')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $unbilledReleve->id);

        $this->postJson('/api/factures', [
            'releve_id' => $unbilledReleve->id,
            'due_date' => now()->addDays(15)->toDateString(),
        ])->assertCreated();

        $this->getJson('/api/releves?unbilled=true&limit=10')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
