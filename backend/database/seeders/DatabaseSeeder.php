<?php

namespace Database\Seeders;

use App\Enums\PanneAnomalie;
use App\Enums\PanneStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Compteur;
use App\Models\Facture;
use App\Models\Paiement;
use App\Models\Panne;
use App\Models\Releve;
use App\Models\Reparation;
use App\Models\Secteur;
use App\Models\User;
use App\Notifications\UtilityNotification;
use App\Services\BillingService;
use App\Services\TariffService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedTariffs();
        $users = $this->seedUsers();
        $secteurs = $this->seedSecteurs();
        $clients = $this->seedClients($secteurs);
        $compteurs = $this->seedCompteurs($clients, $secteurs);
        $releves = $this->seedReleves($compteurs, $users['operators']);
        $factures = $this->seedFactures($releves);
        $this->seedPaiements($factures, $users['admin']);
        $pannes = $this->seedPannes($compteurs, $users['operators']);
        $this->seedReparations($pannes, $users['operators']);
        $this->seedNotifications($users, $pannes, $factures);
    }

    private function seedTariffs(): void
    {
        $tariffs = app(TariffService::class);
        $tariffs->update($tariffs->defaults());
    }

    private function seedUsers(): array
    {
        $rows = [
            ['key' => 'super_admin', 'nom' => 'Alaoui', 'prenom' => 'Ahmed', 'identifiant' => 'ahmed.alaoui', 'email' => 'ahmed.alaoui@srm-taza.ma', 'role' => UserRole::SuperAdmin],
            ['key' => 'admin', 'nom' => 'Tahiri', 'prenom' => 'Yassine', 'identifiant' => 'yassine.tahiri', 'email' => 'yassine.tahiri@srm-taza.ma', 'role' => UserRole::Admin],
            ['key' => 'manager', 'nom' => 'Idrissi', 'prenom' => 'Salma', 'identifiant' => 'salma.idrissi', 'email' => 'salma.idrissi@srm-taza.ma', 'role' => UserRole::Manager],
            ['key' => 'viewer', 'nom' => 'Benjelloun', 'prenom' => 'Omar', 'identifiant' => 'omar.benjelloun', 'email' => 'omar.benjelloun@srm-taza.ma', 'role' => UserRole::Viewer],
            ['key' => 'op_qods', 'nom' => 'El Fassi', 'prenom' => 'Younes', 'identifiant' => 'younes.elfassi', 'email' => 'younes.elfassi@srm-taza.ma', 'role' => UserRole::Operator],
            ['key' => 'op_taza_haut', 'nom' => 'Bennani', 'prenom' => 'Hamza', 'identifiant' => 'hamza.bennani', 'email' => 'hamza.bennani@srm-taza.ma', 'role' => UserRole::Operator],
            ['key' => 'op_taza_bas', 'nom' => 'Chakir', 'prenom' => 'Nadia', 'identifiant' => 'nadia.chakir', 'email' => 'nadia.chakir@srm-taza.ma', 'role' => UserRole::Operator],
            ['key' => 'op_indus', 'nom' => 'Amrani', 'prenom' => 'Rachid', 'identifiant' => 'rachid.amrani', 'email' => 'rachid.amrani@srm-taza.ma', 'role' => UserRole::Operator],
        ];

        $users = collect($rows)->mapWithKeys(function (array $row): array {
            $user = User::updateOrCreate(['identifiant' => $row['identifiant']], [
                'nom' => $row['nom'],
                'prenom' => $row['prenom'],
                'name' => $row['prenom'].' '.$row['nom'],
                'email' => $row['email'],
                'password' => Hash::make('password'),
                'role' => $row['role'],
            ]);

            return [$row['key'] => $user];
        });

        return [
            ...$users->all(),
            'operators' => $users->only(['op_qods', 'op_taza_haut', 'op_taza_bas', 'op_indus'])->values(),
        ];
    }

    private function seedSecteurs()
    {
        $rows = [
            ['nom_secteur' => 'Taza Haut', 'emplacement' => 'Taza Haut', 'num_torne' => 'SRM-TH-001', 'latitude' => 34.2208, 'longitude' => -4.0082],
            ['nom_secteur' => 'Taza Bas', 'emplacement' => 'Taza Bas', 'num_torne' => 'SRM-TB-002', 'latitude' => 34.2244, 'longitude' => -4.0170],
            ['nom_secteur' => 'Qods 1', 'emplacement' => 'Taza Haut', 'num_torne' => 'SRM-QD1-003', 'latitude' => 34.2261, 'longitude' => -3.9947],
            ['nom_secteur' => 'Qods 2', 'emplacement' => 'Taza Haut', 'num_torne' => 'SRM-QD2-004', 'latitude' => 34.2280, 'longitude' => -3.9918],
            ['nom_secteur' => 'Hay Amal', 'emplacement' => 'Taza Bas', 'num_torne' => 'SRM-HA-005', 'latitude' => 34.2318, 'longitude' => -3.9869],
            ['nom_secteur' => 'Hay Ennahda', 'emplacement' => 'Taza Bas', 'num_torne' => 'SRM-HN-006', 'latitude' => 34.2362, 'longitude' => -3.9799],
            ['nom_secteur' => 'Sidi Azouz', 'emplacement' => 'Taza Bas', 'num_torne' => 'SRM-SA-007', 'latitude' => 34.2147, 'longitude' => -4.0158],
            ['nom_secteur' => 'Moulay Rachid', 'emplacement' => 'Taza Haut', 'num_torne' => 'SRM-MR-008', 'latitude' => 34.2284, 'longitude' => -3.9878],
            ['nom_secteur' => 'Zone Industrielle', 'emplacement' => 'Taza Bas', 'num_torne' => 'SRM-ZI-009', 'latitude' => 34.2401, 'longitude' => -3.9705],
            ['nom_secteur' => 'Gare Taza', 'emplacement' => 'Taza Bas', 'num_torne' => 'SRM-GT-010', 'latitude' => 34.2237, 'longitude' => -4.0112],
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

            return Client::updateOrCreate(['police' => 'SRM-'.str_pad((string) (240000 + $i), 6, '0', STR_PAD_LEFT)], [
                'nom' => $nom,
                'prenom' => $prenom,
                'cin' => $cinPrefix.str_pad((string) (12500 + $i * 37), 6, '0', STR_PAD_LEFT),
                'telephone' => '06'.str_pad((string) (11000000 + $i * 32741), 8, '0', STR_PAD_LEFT),
                'adresse' => $streets[($i - 1) % count($streets)].' n '.$i.', '.$secteur->nom_secteur.', Taza',
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
                'calibre' => $isBusiness ? '20' : '15',
                'marque' => ['Itron', 'Sagemcom', 'Landis+Gyr', 'Elster'][($index) % 4],
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

    private function seedFactures($releves)
    {
        $billing = app(BillingService::class);
        $factures = collect();

        $releves->each(function (Releve $releve, int $index) use ($billing, $factures): void {
            $isLatestReadingForMeter = $index % 6 === 5;
            $meterPosition = intdiv($index, 6);
            $leaveForManualBilling = $isLatestReadingForMeter && $meterPosition % 3 === 0;

            if ($leaveForManualBilling) {
                $releve->facture?->delete();

                return;
            }

            $dueDate = $releve->periode_fin->copy()->addDays(20)->toDateString();
            $facture = $billing->generateInvoice($releve->load('compteur.client'), $dueDate);
            $facture->forceFill([
                'generated_at' => $releve->periode_fin->copy()->addDays(3),
                'created_at' => $releve->periode_fin->copy()->addDays(3),
                'updated_at' => $releve->periode_fin->copy()->addDays(3),
            ])->save();

            $factures->push($facture->refresh());
        });

        return $factures;
    }

    private function seedPaiements($factures, User $collector): void
    {
        $factures->each(function (Facture $facture, int $index) use ($collector): void {
            $mode = ['cash', 'bank_transfer', 'mobile', 'cheque'][$index % 4];

            if ($index % 10 === 0) {
                return;
            }

            $amount = (float) $facture->total_ttc;
            if ($index % 7 === 0) {
                $amount = round($amount * 0.45, 2);
            }

            Paiement::updateOrCreate([
                'facture_id' => $facture->id,
                'reference' => 'PAY-'.$facture->reference,
            ], [
                'montant' => $amount,
                'mode' => $mode,
                'paid_at' => $facture->generated_at?->copy()->addDays(($index % 7) + 2) ?? now(),
                'created_by' => $collector->id,
            ]);
        });
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
                'anomalie' => $anomalies[$i % count($anomalies)],
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

    private function seedNotifications(array $users, $pannes, $factures): void
    {
        $recipients = collect([$users['super_admin'], $users['admin'], $users['manager'], $users['viewer']])->merge($users['operators'])->unique('id')->values();

        $events = collect()
            ->merge($pannes->take(8)->map(fn (Panne $panne): array => ['Panne assigned', 'Panne #'.$panne->id.' assigned in '.$panne->compteur?->secteur?->nom_secteur, 'panne_assigned']))
            ->merge($factures->take(8)->map(fn (Facture $facture): array => ['Invoice generated', 'Invoice '.$facture->reference.' generated for '.$facture->client?->nom, 'facture_generated']))
            ->merge($factures->filter(fn (Facture $facture): bool => (float) $facture->paid_amount > 0)->take(8)->map(fn (Facture $facture): array => ['Payment received', 'Payment recorded for invoice '.$facture->reference, 'paiement_received']));

        $events->values()->each(function (array $event, int $index) use ($recipients): void {
            $recipient = $recipients[$index % $recipients->count()];
            Notification::send($recipient, new UtilityNotification($event[0], $event[1], $event[2], ['seeded' => true]));
        });
    }
}
