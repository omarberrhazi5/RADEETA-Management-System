<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Secteur;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_routes_are_protected(): void
    {
        $this->getJson('/api/clients')->assertUnauthorized();

        $this->postJson('/api/clients', [
            'police' => 'POL-900001',
            'nom' => 'Alaoui',
        ])->assertUnauthorized();
    }

    public function test_non_privileged_user_cannot_mutate_clients(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Viewer]));

        $this->postJson('/api/clients', [
            'police' => 'POL-900001',
            'nom' => 'Alaoui',
        ])->assertForbidden();
    }

    public function test_admin_can_manage_clients(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Responsable]));
        $secteur = Secteur::factory()->create(['agence' => 'SRM-FM Taza']);

        $createResponse = $this->postJson('/api/clients', [
            'police' => 'POL-900001',
            'nom' => 'Alaoui',
            'prenom' => 'Youssef',
            'cin' => 'AB123456',
            'telephone' => '0611111111',
            'adresse' => 'Qods 1, Taza',
            'type_abonnement' => 'domestic',
            'service_type' => 'water',
            'id_secteur' => $secteur->id,
            'abonne' => true,
        ])->assertCreated();

        $clientId = $createResponse->json('data.id');

        $this->getJson('/api/clients')
            ->assertOk()
            ->assertJsonPath('data.0.police', 'POL-900001');

        $this->patchJson("/api/clients/{$clientId}", [
            'telephone' => '0699999999',
            'type_abonnement' => 'commercial',
        ])->assertOk()
            ->assertJsonPath('data.telephone', '0699999999')
            ->assertJsonPath('data.type_abonnement', 'commercial');

        $this->deleteJson("/api/clients/{$clientId}")->assertNoContent();

        $this->assertSoftDeleted(Client::class, [
            'id' => $clientId,
        ]);
    }

    public function test_responsable_cannot_create_client_in_another_agency_sector(): void
    {
        Sanctum::actingAs(User::factory()->create([
            'role' => UserRole::Responsable,
            'agence' => 'SRM-FM Taza',
        ]));

        $otherAgencySector = Secteur::factory()->create(['agence' => 'SRM-FM Fes']);

        $this->postJson('/api/clients', [
            'police' => 'POL-900002',
            'nom' => 'Alaoui',
            'adresse' => 'Qods 1, Taza',
            'type_abonnement' => 'domestic',
            'service_type' => 'water',
            'id_secteur' => $otherAgencySector->id,
        ])->assertStatus(422);
    }
}
