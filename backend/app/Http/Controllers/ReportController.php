<?php

namespace App\Http\Controllers;

use App\Enums\PanneAnomalie;
use App\Enums\PanneStatus;
use App\Exports\ClientsCompteursExport;
use App\Exports\OperationalReportExport;
use App\Models\Intervention;
use App\Models\Panne;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    public function pannesPdf(Request $request): Response
    {
        $month = (int) $request->integer('month', now()->month);
        $year = (int) $request->integer('year', now()->year);

        $period = CarbonImmutable::create($year, $month, 1);

        $pannes = Panne::with([
            'compteur.client',
            'compteur.secteur',
            'reparations.plombier',
        ])
            ->whereBetween('date_panne', [$period->startOfMonth(), $period->endOfMonth()])
            ->orderBy('date_panne')
            ->get();

        $pdf = Pdf::loadView('reports.pannes-month', [
            'pannes' => $pannes,
            'period' => $period,
            'generatedAt' => now(),
            'statusLabels' => $this->statusLabels(),
            'anomalyLabels' => $this->anomalyLabels(),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('pannes-du-mois-'.$period->format('Y-m').'.pdf');
    }

    public function clientsExcel(): BinaryFileResponse
    {
        return Excel::download(new ClientsCompteursExport(), 'clients-compteurs.xlsx');
    }

    public function export(Request $request): Response|BinaryFileResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['monthly', 'annual'])],
            'format' => ['required', Rule::in(['pdf', 'excel'])],
            'content' => ['required', Rule::in(['anomalies', 'interventions', 'global'])],
            'year' => ['required', 'integer', 'between:2020,2100'],
            'month' => ['nullable', 'required_if:type,monthly', 'integer', 'between:1,12'],
        ]);

        $period = $this->periodBounds($validated['type'], (int) $validated['year'], isset($validated['month']) ? (int) $validated['month'] : null);
        $dataset = $this->reportDataset($validated['content'], $period['start'], $period['end']);
        $periodLabel = $validated['type'] === 'monthly' ? $period['start']->format('Y-m') : (string) $validated['year'];
        $extension = $validated['format'] === 'excel' ? 'xlsx' : 'pdf';
        $filename = implode('-', ['srm-fm', $validated['content'], $validated['type'], $periodLabel]).'.'.$extension;

        if ($validated['format'] === 'excel') {
            return Excel::download(
                new OperationalReportExport($dataset['rows'], $dataset['headings'], $dataset['title']),
                $filename,
            );
        }

        $pdf = Pdf::loadView('reports.operational-export', [
            'title' => $dataset['title'],
            'periodLabel' => $period['label'],
            'generatedAt' => now(),
            'headings' => $dataset['headings'],
            'rows' => $dataset['rows'],
            'summary' => $dataset['summary'],
        ])->setPaper('a4', 'landscape');

        return $pdf->download($filename);
    }

    private function statusLabels(): array
    {
        return [
            PanneStatus::Open->value => 'Nouvelle',
            PanneStatus::Assigned->value => 'Assignee',
            PanneStatus::InProgress->value => 'En cours',
            PanneStatus::Resolved->value => 'Resolue',
        ];
    }

    private function anomalyLabels(): array
    {
        return [
            PanneAnomalie::FuiteAvantCompteur->value => 'Fuite avant compteur',
            PanneAnomalie::FuiteApresCompteur->value => 'Fuite apres compteur',
            PanneAnomalie::CompteurBloque->value => 'Compteur bloque',
            PanneAnomalie::CompteurCasse->value => 'Compteur casse',
            PanneAnomalie::CompteurInverse->value => 'Compteur inverse',
            PanneAnomalie::CadranIllisible->value => 'Cadran illisible',
            PanneAnomalie::AbsenceCompteur->value => 'Absence compteur',
            PanneAnomalie::BranchementIllicite->value => 'Branchement illicite',
            PanneAnomalie::PlombRompu->value => 'Plomb rompu',
            PanneAnomalie::RobinetDefectueux->value => 'Robinet defectueux',
        ];
    }

    private function periodBounds(string $type, int $year, ?int $month): array
    {
        $start = $type === 'monthly'
            ? CarbonImmutable::create($year, $month ?? now()->month, 1)->startOfMonth()
            : CarbonImmutable::create($year, 1, 1)->startOfYear();

        $end = $type === 'monthly' ? $start->endOfMonth() : $start->endOfYear();

        return [
            'start' => $start,
            'end' => $end,
            'label' => $type === 'monthly' ? $start->translatedFormat('F Y') : (string) $year,
        ];
    }

    private function reportDataset(string $content, CarbonImmutable $start, CarbonImmutable $end): array
    {
        return match ($content) {
            'interventions' => $this->interventionsDataset($start, $end),
            'global' => $this->globalDataset($start, $end),
            default => $this->anomaliesDataset($start, $end),
        };
    }

    private function anomaliesDataset(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $pannes = Panne::with(['compteur.client', 'compteur.secteur', 'assignedOperator'])
            ->whereBetween('date_panne', [$start, $end])
            ->orderBy('date_panne')
            ->get();

        $rows = $pannes->map(function (Panne $panne): array {
            $status = $panne->status instanceof PanneStatus ? $panne->status->value : $panne->status;
            $anomaly = $panne->anomalie instanceof PanneAnomalie ? $panne->anomalie->value : $panne->anomalie;

            return [
                'Date' => $panne->date_panne?->format('d/m/Y') ?? '-',
                'Service' => $panne->compteur?->service_type === 'electricity' ? 'Electricite' : 'Eau',
                'Compteur' => $panne->compteur?->cadran ?? '-',
                'Client' => trim(($panne->compteur?->client?->nom ?? '').' '.($panne->compteur?->client?->prenom ?? '')) ?: '-',
                'Secteur' => $panne->compteur?->secteur?->nom_secteur ?? '-',
                'Anomalie' => $this->anomalyLabels()[$anomaly] ?? $anomaly ?? '-',
                'Statut' => $this->statusLabels()[$status] ?? $status ?? '-',
            ];
        });

        return [
            'title' => 'Rapport des anomalies',
            'headings' => ['Date', 'Service', 'Compteur', 'Client', 'Secteur', 'Anomalie', 'Statut'],
            'rows' => $rows,
            'summary' => [
                'Total anomalies' => $pannes->count(),
                'Ouvertes' => $pannes->where('status.value', 'open')->count(),
                'Resolues' => $pannes->where('status.value', 'resolved')->count(),
            ],
        ];
    }

    private function interventionsDataset(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $interventions = Intervention::with(['technician', 'client', 'meter', 'panne'])
            ->whereBetween('started_at', [$start->startOfDay(), $end->endOfDay()])
            ->orderBy('started_at')
            ->get();

        $rows = $interventions->map(fn (Intervention $intervention): array => [
            'Date' => $intervention->started_at?->format('d/m/Y H:i') ?? '-',
            'Numero' => $intervention->intervention_number ?? '-',
            'Service' => $intervention->service_type === 'electricity' ? 'Electricite' : 'Eau',
            'Technicien' => trim(($intervention->technician?->nom ?? '').' '.($intervention->technician?->prenom ?? '')) ?: '-',
            'Client' => trim(($intervention->client?->nom ?? '').' '.($intervention->client?->prenom ?? '')) ?: '-',
            'Priorite' => $intervention->priority ?? '-',
            'Statut' => $intervention->status ?? '-',
            'Type de travail' => $intervention->work_type ?? '-',
        ]);

        return [
            'title' => 'Rapport des interventions',
            'headings' => ['Date', 'Numero', 'Service', 'Technicien', 'Client', 'Priorite', 'Statut', 'Type de travail'],
            'rows' => $rows,
            'summary' => [
                'Total interventions' => $interventions->count(),
                'En cours' => $interventions->where('status', 'en_cours')->count(),
                'Urgentes' => $interventions->where('priority', 'urgent')->count(),
                'Terminees' => $interventions->where('status', 'terminee')->count(),
            ],
        ];
    }

    private function globalDataset(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $anomalies = $this->anomaliesDataset($start, $end);
        $interventions = $this->interventionsDataset($start, $end);

        $rows = collect([
            [
                'Indicateur' => 'Anomalies',
                'Volume' => $anomalies['summary']['Total anomalies'],
                'Details' => 'Reclamations et anomalies client enregistrees',
            ],
            [
                'Indicateur' => 'Interventions',
                'Volume' => $interventions['summary']['Total interventions'],
                'Details' => 'Operations terrain et rapports techniques',
            ],
            [
                'Indicateur' => 'Interventions urgentes',
                'Volume' => $interventions['summary']['Urgentes'],
                'Details' => 'Travaux identifies comme urgents',
            ],
            [
                'Indicateur' => 'Anomalies resolues',
                'Volume' => $anomalies['summary']['Resolues'],
                'Details' => 'Anomalies avec statut resolu',
            ],
        ]);

        return [
            'title' => 'Rapport global d activite',
            'headings' => ['Indicateur', 'Volume', 'Details'],
            'rows' => $rows,
            'summary' => [
                'Total anomalies' => $anomalies['summary']['Total anomalies'],
                'Total interventions' => $interventions['summary']['Total interventions'],
                'Urgences' => $interventions['summary']['Urgentes'],
            ],
        ];
    }
}
