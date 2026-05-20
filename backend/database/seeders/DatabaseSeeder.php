<?php

namespace Database\Seeders;

use App\Enums\PanneAnomalie;
use App\Enums\PanneStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Compteur;
use App\Models\ActivityLog;
use App\Models\Panne;
use App\Models\Releve;
use App\Models\Reparation;
use App\Models\Secteur;
use App\Models\User;
use App\Notifications\UtilityNotification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $users = $this->seedUsers();
        $secteurs = $this->seedSecteurs();
        $clients = $this->seedClients($secteurs);
        $compteurs = $this->seedCompteurs($clients, $secteurs);
        $this->seedReleves($compteurs, $users['operators']);
        $pannes = $this->seedPannes($compteurs, $users['operators']);
        $this->call(InterventionSeeder::class);
        $this->seedReparations($pannes, $users['operators']);
        $this->seedActivityLogs($users);
        $this->seedNotifications($users, $pannes);
    }

    private function seedUsers(): array
    {
        $rows = [
            ['key' => 'directeur', 'nom' => 'Alaoui', 'prenom' => 'Ahmed', 'identifiant' => 'ahmed.alaoui', 'email' => 'ahmed.alaoui@srm-fm.ma', 'role' => UserRole::Directeur],
            ['key' => 'responsable', 'nom' => 'Tahiri', 'prenom' => 'Yassine', 'identifiant' => 'yassine.tahiri', 'email' => 'yassine.tahiri@srm-fm.ma', 'role' => UserRole::Responsable],
            ['key' => 'manager', 'nom' => 'Idrissi', 'prenom' => 'Salma', 'identifiant' => 'salma.idrissi', 'email' => 'salma.idrissi@srm-taza.ma', 'role' => UserRole::Manager],
            ['key' => 'viewer', 'nom' => 'Benjelloun', 'prenom' => 'Omar', 'identifiant' => 'omar.benjelloun', 'email' => 'omar.benjelloun@srm-taza.ma', 'role' => UserRole::Viewer],
            ['key' => 'tech_qods', 'nom' => 'El Fassi', 'prenom' => 'Younes', 'identifiant' => 'younes.elfassi', 'email' => 'younes.elfassi@srm-fm.ma', 'role' => UserRole::Technician],
            ['key' => 'tech_taza_haut', 'nom' => 'Bennani', 'prenom' => 'Hamza', 'identifiant' => 'hamza.bennani', 'email' => 'hamza.bennani@srm-fm.ma', 'role' => UserRole::Technician],
            ['key' => 'tech_taza_bas', 'nom' => 'Chakir', 'prenom' => 'Nadia', 'identifiant' => 'nadia.chakir', 'email' => 'nadia.chakir@srm-fm.ma', 'role' => UserRole::Technician],
            ['key' => 'tech_indus', 'nom' => 'Amrani', 'prenom' => 'Rachid', 'identifiant' => 'rachid.amrani', 'email' => 'rachid.amrani@srm-fm.ma', 'role' => UserRole::Technician],
        ];

        $users = collect($rows)->mapWithKeys(function (array $row): array {
            $user = User::updateOrCreate(['identifiant' => $row['identifiant']], [
                'nom' => $row['nom'],
                'prenom' => $row['prenom'],
                'name' => $row['prenom'].' '.$row['nom'],
                'email' => $row['email'],
                'agence' => 'SRM-FM Taza',
                'password' => Hash::make('password'),
                'role' => $row['role'],
            ]);

            return [$row['key'] => $user];
        });

        return [
            ...$users->all(),
            'operators' => $users->only(['tech_qods', 'tech_taza_haut', 'tech_taza_bas', 'tech_indus'])->values(),
        ];
    }

    private function seedSecteurs()
    {
        $rows = [
            ['nom_secteur' => 'Taza Haut', 'emplacement' => 'Taza Haut', 'agence' => 'SRM-FM Taza', 'num_torne' => 'SRM-TH-001', 'latitude' => 34.2208, 'longitude' => -4.0082],
            ['nom_secteur' => 'Taza Bas', 'emplacement' => 'Taza Bas', 'agence' => 'SRM-FM Taza', 'num_torne' => 'SRM-TB-002', 'latitude' => 34.2244, 'longitude' => -4.0170],
            ['nom_secteur' => 'Qods 1', 'emplacement' => 'Taza Haut', 'agence' => 'SRM-FM Taza', 'num_torne' => 'SRM-QD1-003', 'latitude' => 34.2261, 'longitude' => -3.9947],
            ['nom_secteur' => 'Qods 2', 'emplacement' => 'Taza Haut', 'agence' => 'SRM-FM Taza', 'num_torne' => 'SRM-QD2-004', 'latitude' => 34.2280, 'longitude' => -3.9918],
            ['nom_secteur' => 'Hay Amal', 'emplacement' => 'Taza Bas', 'agence' => 'SRM-FM Taza', 'num_torne' => 'SRM-HA-005', 'latitude' => 34.2318, 'longitude' => -3.9869],
            ['nom_secteur' => 'Hay Ennahda', 'emplacement' => 'Taza Bas', 'agence' => 'SRM-FM Taza', 'num_torne' => 'SRM-HN-006', 'latitude' => 34.2362, 'longitude' => -3.9799],
            ['nom_secteur' => 'Sidi Azouz', 'emplacement' => 'Taza Bas', 'agence' => 'SRM-FM Taza', 'num_torne' => 'SRM-SA-007', 'latitude' => 34.2147, 'longitude' => -4.0158],
            ['nom_secteur' => 'Moulay Rachid', 'emplacement' => 'Taza Haut', 'agence' => 'SRM-FM Taza', 'num_torne' => 'SRM-MR-008', 'latitude' => 34.2284, 'longitude' => -3.9878],
            ['nom_secteur' => 'Zone Industrielle', 'emplacement' => 'Taza Bas', 'agence' => 'SRM-FM Taza', 'num_torne' => 'SRM-ZI-009', 'latitude' => 34.2401, 'longitude' => -3.9705],
            ['nom_secteur' => 'Gare Taza', 'emplacement' => 'Taza Bas', 'agence' => 'SRM-FM Taza', 'num_torne' => 'SRM-GT-010', 'latitude' => 34.2237, 'longitude' => -4.0112],
        ];

        return collect($rows)->map(fn (array $row): Secteur => Secteur::updateOrCreate(['num_torne' => $row['num_torne']], $row))->values();
    }

    private function seedClients($secteurs)
    {
        $firstNames = ['Ahmed', 'Mohamed', 'Youssef', 'Omar', 'Karim', 'Hassan', 'Rachid', 'Mehdi', 'Nabil', 'Ilyas', 'Salma', 'Fatima', 'Amina', 'Khadija', 'Nadia', 'Hajar', 'Soukaina', 'Meryem', 'Imane', 'Zineb'];
        $lastNames = ['Alaoui', 'Tahiri', 'Idrissi', 'Benjelloun', 'Bennani', 'El Fassi', 'Amrani', 'Chakir', 'Lahlou', 'Berrada', 'Mansouri', 'Tazi', 'El Amrani', 'Sbai', 'Ouazzani', 'Haddad', 'Mernissi', 'Bouazza', 'Kabbaj', 'Radi'];
        $streets = ['Avenue Hassan II', 'Rue Allal El Fassi', 'Boulevard Mohammed V', 'Lotissement Al Qods', 'Rue Ibn Khaldoun', 'Avenue des FAR', 'Quartier Al Amal', 'Rue Moulay Rachid'];

        return collect(range(1, 100))->map(function (int $i) use ($firstNames, $lastNames, $streets, $secteurs): Client {
            $secteur = $secteurs[($i - 1) % $secteurs->count()];
            $prenom = $firstNames[($i - 1) % count($firstNames)];
            $nom = $lastNames[(int) floor(($i - 1) / 2) % count($lastNames)];
            $cinPrefix = ['AB', 'CB', 'D', 'F', 'G', 'H'][($i - 1) % 6];

            return Client::updateOrCreate(['police' => '000'.str_pad((string) (2400000 + $i), 7, '0', STR_PAD_LEFT)], [
                'nom' => $nom,
                'prenom' => $prenom,
                'cin' => $cinPrefix.str_pad((string) (12500 + $i * 37), 6, '0', STR_PAD_LEFT),
                'telephone' => '06'.str_pad((string) (11000000 + $i * 32741), 8, '0', STR_PAD_LEFT),
                'adresse' => $streets[($i - 1) % count($streets)],
                'type_abonnement' => $secteur->nom_secteur === 'Zone Industrielle' ? 'Administration' : (($i % 7 === 0) ? 'Patente' : 'Domestique'),
                'service_type' => $i % 5 === 0 ? 'electricity' : 'water',
                'id_secteur' => $secteur->id,
                'abonne' => $i % 19 !== 0,
            ]);
        })->values();
    }

    private function seedCompteurs($clients, $secteurs)
    {
        return $clients->map(function (Client $client, int $index) use ($secteurs): Compteur {
            $secteur = $secteurs[$index % $secteurs->count()];
            $isBusiness = ($index + 1) % 7 === 0 || $secteur->nom_secteur === 'Zone Industrielle';

            return Compteur::updateOrCreate(['cadran' => 'SRM'.now()->format('y').'TZ'.str_pad((string) ($index + 1), 6, '0', STR_PAD_LEFT)], [
                'num_contrat' => $client->police,
                'num_tournee' => $secteur->num_torne,
                'usage' => $client->type_abonnement,
                'calibre' => $isBusiness ? '20' : '15',
                'technical_type' => $client->service_type === 'electricity' ? ($index % 3 === 0 ? 'Numérique' : 'Mécanique') : 'Mécanique',
                'marque' => ['Itron', 'Sagemcom', 'Landis+Gyr', 'Elster'][($index) % 4],
                'service_type' => $client->service_type,
                'index_releve' => 0,
                'id_client' => $client->id,
                'id_secteur' => $secteur->id,
            ]);
        })->values();
    }

    private function seedReleves($compteurs, $operators)
    {
        $periods = collect(range(5, 0))->map(fn (int $monthsAgo): array => [
            now()->subMonths($monthsAgo)->startOfMonth()->toDateString(),
            now()->subMonths($monthsAgo)->endOfMonth()->toDateString(),
        ]);

        $created = collect();

        $compteurs->each(function (Compteur $compteur, int $meterIndex) use ($periods, $operators, $created): void {
            $ancien = 120 + (($meterIndex * 17) % 900);
            $isBusiness = $compteur->calibre === '20';

            $periods->each(function (array $period, int $periodIndex) use (&$ancien, $compteur, $meterIndex, $isBusiness, $operators, $created): void {
                $base = $isBusiness ? 92 : 24;
                $variation = (($meterIndex * 11 + $periodIndex * 7) % ($isBusiness ? 85 : 36));
                $consumption = $base + $variation;
                $nouvel = $ancien + $consumption;

                $releve = Releve::updateOrCreate([
                    'compteur_id' => $compteur->id,
                    'periode_debut' => $period[0],
                    'periode_fin' => $period[1],
                ], [
                    'ancien_index' => $ancien,
                    'nouvel_index' => $nouvel,
                    'consommation' => $consumption,
                    'created_by' => $operators[($meterIndex + $periodIndex) % $operators->count()]->id,
                    'created_at' => now()->parse($period[1])->addDays(2),
                    'updated_at' => now()->parse($period[1])->addDays(2),
                ]);

                $compteur->update(['index_releve' => $nouvel]);
                $ancien = $nouvel;
                $created->push($releve->refresh());
            });
        });

        return $created;
    }

    private function seedPannes($compteurs, $operators)
    {
        $anomalies = [
            PanneAnomalie::FuiteAvantCompteur,
            PanneAnomalie::FuiteApresCompteur,
            PanneAnomalie::CompteurBloque,
            PanneAnomalie::CompteurCasse,
            PanneAnomalie::CadranIllisible,
            PanneAnomalie::RobinetDefectueux,
            PanneAnomalie::PlombRompu,
            PanneAnomalie::BranchementIllicite,
        ];

        return collect(range(1, 32))->map(function (int $i) use ($compteurs, $operators, $anomalies): Panne {
            $compteur = $compteurs[($i * 3) % $compteurs->count()];
            $resolved = $i <= 22;

            return Panne::updateOrCreate([
                'id_compteur' => $compteur->id,
                'date_panne' => now()->subDays(70 - $i)->toDateString(),
                'anomalie' => $anomalies[$i % count($anomalies)]->value,
            ], [
                'status' => $resolved ? PanneStatus::Resolved : PanneStatus::Open,
                'assigned_to' => $operators[$i % $operators->count()]->id,
            ]);
        })->values();
    }

    private function seedReparations($pannes, $operators): void
    {
        $notes = [
            'Remplacement joint et verification etancheite branchement.',
            'Remplacement compteur defectueux et reprise du plombage.',
            'Reparation robinet avant compteur avec controle pression.',
            'Deblocage compteur et releve contradictoire sur site.',
            'Isolation branchement illicite et rapport transmis au manager.',
        ];

        $pannes->where('status', PanneStatus::Resolved)->values()->each(function (Panne $panne, int $index) use ($operators, $notes): void {
            Reparation::updateOrCreate(['id_panne' => $panne->id], [
                'id_plombier' => $panne->assigned_to ?: $operators[$index % $operators->count()]->id,
                'date_reparation' => $panne->date_panne->copy()->addDays(($index % 4) + 1)->toDateString(),
                'description' => $notes[$index % count($notes)],
            ]);
        });
    }

    private function seedNotifications(array $users, $pannes): void
    {
        $recipients = collect([$users['directeur'], $users['responsable'], $users['manager'], $users['viewer']])->merge($users['operators'])->unique('id')->values();

        $events = collect()
            ->merge($pannes->take(16)->map(fn (Panne $panne): array => ['Panne assigned', 'Panne #'.$panne->id.' assigned in '.$panne->compteur?->secteur?->nom_secteur, 'panne_assigned']));

        $events->values()->each(function (array $event, int $index) use ($recipients): void {
            $recipient = $recipients[$index % $recipients->count()];
            Notification::send($recipient, new UtilityNotification($event[0], $event[1], $event[2], ['seeded' => true]));
        });
    }

    private function seedActivityLogs(array $users): void
    {
        $actors = collect([$users['directeur'], $users['responsable'], $users['manager']])->merge($users['operators'])->values();
        $rows = [
            ['Connexion utilisateur', 'Authentification'],
            ['Intervention assignée', 'Interventions'],
            ['Intervention modifiée', 'Interventions'],
            ['Status modifié', 'Interventions'],
            ['Modification des paramètres', 'Paramètres'],
            ['Utilisateur modifié', 'Administration'],
        ];

        collect($rows)->each(function (array $row, int $index) use ($actors): void {
            ActivityLog::updateOrCreate([
                'action' => $row[0],
                'module' => $row[1],
            ], [
                'user_id' => $actors[$index % $actors->count()]->id,
                'ip_address' => '127.0.0.1',
                'metadata' => ['seeded' => true],
            ]);
        });

        ActivityLog::whereNull('user_id')->update(['user_id' => $users['directeur']->id]);
    }
}
