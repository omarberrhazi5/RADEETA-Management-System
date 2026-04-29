<?php

namespace Database\Factories;

use App\Models\Secteur;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Secteur>
 */
class SecteurFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nom_secteur' => fake()->randomElement([
                'Qods',
                'Medina',
                'Taza Bas',
                'Al Amal',
                'Route de Fes',
                'Bab Jamaa',
                'Hay Massira',
                'Al Qaria',
                'Beni Lent',
                'Sidi Azouz',
            ]),
            'emplacement' => fake()->randomElement(['Taza Haut', 'Taza Bas']),
            'num_torne' => fake()->unique()->bothify('T-###'),
            'latitude' => fake()->randomFloat(8, 34.21, 34.24),
            'longitude' => fake()->randomFloat(8, -4.02, -3.97),
        ];
    }
}
