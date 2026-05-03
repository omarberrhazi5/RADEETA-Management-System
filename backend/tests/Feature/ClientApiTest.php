<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Client;
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
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Admin]));

        $createResponse = $this->postJson('/api/clients', [
            'police' => 'POL-900001',
            'nom' => 'Alaoui',
            'prenom' => 'Youssef',
            'telephone' => '0611111111',
            'adresse' => 'Qods 1, Taza',
            'abonne' => true,
        ])->assertCreated();

        $clientId = $createResponse->json('data.id');

        $this->getJson('/api/clients')
            ->assertOk()
            ->assertJsonPath('data.0.police', 'POL-900001');

        $this->patchJson("/api/clients/{$clientId}", [
            'telephone' => '0699999999',
        ])->assertOk()
            ->assertJsonPath('data.telephone', '0699999999');

        $this->deleteJson("/api/clients/{$clientId}")->assertNoContent();

        $this->assertSoftDeleted(Client::class, [
            'id' => $clientId,
        ]);
    }
}
