<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Intervention;
use App\Models\Panne;
use App\Models\User;
use Illuminate\Database\Seeder;

class InterventionSeeder extends Seeder
{
    public function run(): void
    {
        $pannes = Panne::with('compteur')
            ->orderBy('date_panne')
            ->take(18)
            ->get();

        $technicians = User::where('role', UserRole::Technician->value)->get();

        if ($pannes->isEmpty() || $technicians->isEmpty()) {
            return;
        }

        $workTypes = [
            'Diagnostic reseau et securisation',
            'Remise en service compteur',
            'Controle branchement client',
            'Recherche fuite et isolement',
            'Verification tableau electrique',
            'Reprise plombage et controle final',
        ];

        $materials = [
            ['Joint compteur', 'Ruban teflon', 'Collier de serrage'],
            ['Plomb de securite', 'Fil de plombage'],
            ['Vanne 15/20', 'Raccord laiton'],
            ['Multimetre', 'Fusible de protection'],
            ['Manchon PEHD', 'Kit etancheite'],
            ['Etiquette intervention', 'Scelle SRM-FM'],
        ];

        $priorities = ['urgent', 'high', 'normal', 'urgent', 'normal', 'low'];
        $statuses = ['en_cours', 'terminee', 'en_attente', 'en_cours', 'terminee', 'annulee'];

        $pannes->values()->each(function (Panne $panne, int $index) use ($technicians, $workTypes, $materials, $priorities, $statuses): void {
            $compteur = $panne->compteur;
            $startedAt = now()
                ->subDays(86 - ($index * 5))
                ->setTime(8 + ($index % 8), [0, 15, 30, 45][$index % 4]);
            $status = $statuses[$index % count($statuses)];

            Intervention::updateOrCreate([
                'intervention_number' => 'INT-SEED-'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
            ], [
                'panne_id' => $panne->id,
                'client_id' => $compteur?->id_client,
                'meter_id' => $compteur?->id,
                'technician_id' => $panne->assigned_to ?: $technicians[$index % $technicians->count()]->id,
                'service_type' => $compteur?->service_type ?? ($index % 4 === 0 ? 'electricity' : 'water'),
                'work_type' => $workTypes[$index % count($workTypes)],
                'materials_used' => $materials[$index % count($materials)],
                'observations' => $status === 'en_cours'
                    ? 'Intervention terrain en cours, suivi prioritaire par le manager.'
                    : 'Rapport technique saisi et controle operationnel effectue.',
                'priority' => $priorities[$index % count($priorities)],
                'status' => $status,
                'started_at' => $startedAt,
                'completed_at' => $status === 'terminee' ? $startedAt->copy()->addHours(3 + ($index % 3)) : null,
            ]);
        });
    }
}
