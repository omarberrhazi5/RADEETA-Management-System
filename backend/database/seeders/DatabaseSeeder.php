<?php

namespace Database\Seeders;

use App\Enums\PanneAnomalie;
use App\Enums\PanneStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Compteur;
use App\Models\Panne;
use App\Models\Reparation;
use App\Models\Secteur;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::updateOrCreate([
            'identifiant' => 'admin',
        ], [
            'nom' => 'Admin',
            'prenom' => 'Default',
            'name' => 'Default Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Admin,
        ]);

        $leadTechnician = User::updateOrCreate([
            'identifiant' => 'technician',
        ], [
            'nom' => 'Technician',
            'prenom' => 'Default',
            'name' => 'Default Technician',
            'email' => 'technician@example.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Technician,
        ]);

        $technicians = collect([$leadTechnician])->merge(collect([
            ['identifiant' => 'tech_qods', 'nom' => 'Alaoui', 'prenom' => 'Hamid', 'email' => 'tech.qods@example.com'],
            ['identifiant' => 'tech_medina', 'nom' => 'Bennani', 'prenom' => 'Said', 'email' => 'tech.medina@example.com'],
            ['identifiant' => 'tech_taza_bas', 'nom' => 'El Fassi', 'prenom' => 'Younes', 'email' => 'tech.tazabas@example.com'],
        ])->map(fn (array $technician): User => User::updateOrCreate([
            'identifiant' => $technician['identifiant'],
        ], [
            'nom' => $technician['nom'],
            'prenom' => $technician['prenom'],
            'name' => $technician['prenom'].' '.$technician['nom'],
            'email' => $technician['email'],
            'password' => Hash::make('password'),
            'role' => UserRole::Technician,
        ])));

        $sectorRows = [
            ['nom_secteur' => 'Qods 1', 'emplacement' => 'Taza Haut', 'num_torne' => 'T-001', 'latitude' => 34.2250, 'longitude' => -3.9950],
            ['nom_secteur' => 'Qods 2', 'emplacement' => 'Taza Haut', 'num_torne' => 'T-002', 'latitude' => 34.2270, 'longitude' => -3.9920],
            ['nom_secteur' => 'Taza El-Oulya', 'emplacement' => 'Taza Haut', 'num_torne' => 'T-003', 'latitude' => 34.2120, 'longitude' => -4.0120],
            ['nom_secteur' => 'Sidi Azouz', 'emplacement' => 'Taza Bas', 'num_torne' => 'T-004', 'latitude' => 34.2150, 'longitude' => -4.0150],
            ['nom_secteur' => 'Bin Jradi', 'emplacement' => 'Taza Haut', 'num_torne' => 'T-005', 'latitude' => 34.2210, 'longitude' => -4.0050],
            ['nom_secteur' => 'Hay Essalam', 'emplacement' => 'Taza Bas', 'num_torne' => 'T-006', 'latitude' => 34.2350, 'longitude' => -3.9780],
            ['nom_secteur' => 'Moulay Rachid', 'emplacement' => 'Taza Haut', 'num_torne' => 'T-007', 'latitude' => 34.2280, 'longitude' => -3.9880],
            ['nom_secteur' => 'Zone Industrielle', 'emplacement' => 'Taza Bas', 'num_torne' => 'T-008', 'latitude' => 34.2400, 'longitude' => -3.9700],
            ['nom_secteur' => 'Al Koucha', 'emplacement' => 'Taza Haut', 'num_torne' => 'T-009', 'latitude' => 34.2180, 'longitude' => -4.0020],
            ['nom_secteur' => 'Gare Taza', 'emplacement' => 'Taza Bas', 'num_torne' => 'T-010', 'latitude' => 34.2240, 'longitude' => -4.0110],
        ];

        $secteurs = collect($sectorRows)
            ->map(fn (array $secteur): Secteur => Secteur::updateOrCreate([
                'num_torne' => $secteur['num_torne'],
            ], $secteur));

        $clients = collect(range(0, 19))->map(function (int $index) use ($secteurs): Client {
            $attributes = Client::factory()->make([
                'police' => 'POL-'.str_pad((string) ($index + 100001), 6, '0', STR_PAD_LEFT),
                'adresse' => $secteurs[$index % $secteurs->count()]->nom_secteur.', Taza',
            ])->getAttributes();

            return Client::updateOrCreate([
                'police' => $attributes['police'],
            ], $attributes);
        });

        $compteurs = collect(range(0, 29))->map(function (int $index) use ($clients, $secteurs): Compteur {
            $attributes = Compteur::factory()->make([
                'cadran' => 'CAD-'.str_pad((string) ($index + 200001), 6, '0', STR_PAD_LEFT),
                'id_client' => $clients[$index % $clients->count()]->id,
                'id_secteur' => $secteurs[$index % $secteurs->count()]->id,
            ])->getAttributes();

            return Compteur::updateOrCreate([
                'cadran' => $attributes['cadran'],
            ], $attributes);
        });

        $anomalies = [
            PanneAnomalie::CompteurBloque,
            PanneAnomalie::FuiteAvantCompteur,
            PanneAnomalie::FuiteApresCompteur,
            PanneAnomalie::CompteurCasse,
            PanneAnomalie::CadranIllisible,
            PanneAnomalie::PlombRompu,
            PanneAnomalie::RobinetDefectueux,
        ];

        $existingPannes = Panne::whereIn('id_compteur', $compteurs->pluck('id'))->count();

        if ($existingPannes < 15) {
            Panne::factory()
                ->count(15 - $existingPannes)
                ->sequence(fn ($sequence): array => [
                    'id_compteur' => $compteurs[($existingPannes + $sequence->index) % $compteurs->count()]->id,
                    'anomalie' => $anomalies[($existingPannes + $sequence->index) % count($anomalies)],
                    'status' => ($existingPannes + $sequence->index) < 10 ? PanneStatus::Resolved : PanneStatus::Open,
                    'date_panne' => now()->subDays(45 - (($existingPannes + $sequence->index) * 2))->toDateString(),
                ])
                ->create();
        }

        $pannes = Panne::whereIn('id_compteur', $compteurs->pluck('id'))
            ->oldest('id')
            ->take(15)
            ->get();

        $repairDescriptions = [
            'Remplacement du joint et controle de fuite.',
            'Deblocage du compteur bloque et releve de controle.',
            'Remplacement du compteur casse.',
            'Reprise du plombage et verification sur site.',
            'Reparation du robinet defectueux.',
        ];

        $pannes->take(10)->values()->each(function (Panne $panne, int $index) use ($technicians, $repairDescriptions): void {
            Reparation::updateOrCreate([
                'id_panne' => $panne->id,
            ], [
                'id_panne' => $panne->id,
                'id_plombier' => $technicians[$index % $technicians->count()]->id,
                'date_reparation' => $panne->date_panne->copy()->addDays(fake()->numberBetween(1, 7))->toDateString(),
                'description' => $repairDescriptions[$index % count($repairDescriptions)],
            ]);
        });
    }
}
