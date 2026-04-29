<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Compteur;
use App\Models\Secteur;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Compteur>
 */
class CompteurFactory extends Factory
{
    public function definition(): array
    {
        return [
            'cadran' => fake()->unique()->numerify('CAD-######'),
            'calibre' => fake()->randomElement(['15', '20']),
            'marque' => fake()->randomElement(['Elster', 'Itron', 'Sensus', 'Zenner', 'Actaris']),
            'index_releve' => fake()->randomFloat(2, 0, 15000),
            'id_client' => Client::factory(),
            'id_secteur' => Secteur::factory(),
        ];
    }
}
