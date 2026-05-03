<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Panne;
use App\Models\Reparation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reparation>
 */
class ReparationFactory extends Factory
{
    protected $model = Reparation::class;

    public function definition(): array
    {
        return [
            'id_panne' => Panne::factory(),
            'id_plombier' => User::factory()->state(['role' => UserRole::Operator]),
            'date_reparation' => fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
            'description' => fake()->randomElement([
                'Remplacement du joint et verification de l etancheite.',
                'Deblocage du compteur et controle de l index.',
                'Remplacement du robinet defectueux.',
                'Reprise du plombage apres controle sur site.',
                'Remise en etat du branchement et essai de pression.',
            ]),
        ];
    }
}
