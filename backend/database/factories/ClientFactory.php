<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Client>
 */
class ClientFactory extends Factory
{
    public function definition(): array
    {
        return [
            'police' => $this->faker->unique()->numerify('#########'),
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'cin' => fake()->unique()->bothify('??######'),
            'telephone' => fake()->numerify('06########'),
            'adresse' => fake()->randomElement([
                'Qods, Taza',
                'Medina, Taza',
                'Taza Bas',
                'Hay Al Amal, Taza',
                'Route de Fes, Taza',
                'Bab Jamaa, Taza',
                'Hay Massira, Taza',
            ]),
            'type_abonnement' => fake()->randomElement(['Domestique', 'Patente', 'Administration']),
            'service_type' => fake()->randomElement(['water', 'electricity']),
            'abonne' => fake()->boolean(90),
        ];
    }
}
