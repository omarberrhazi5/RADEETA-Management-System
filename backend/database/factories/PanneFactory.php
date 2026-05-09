<?php

namespace Database\Factories;

use App\Enums\PanneAnomalie;
use App\Enums\PanneStatus;
use App\Enums\UserRole;
use App\Models\Compteur;
use App\Models\Panne;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Panne>
 */
class PanneFactory extends Factory
{
    protected $model = Panne::class;

    public function definition(): array
    {
        return [
            'id_compteur' => Compteur::factory(),
            'date_panne' => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'anomalie' => fake()->randomElement(PanneAnomalie::cases()),
            'status' => PanneStatus::Open,
            'assigned_to' => User::factory()->state(['role' => UserRole::Technician]),
        ];
    }
}
