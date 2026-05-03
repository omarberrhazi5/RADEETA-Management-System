<?php

namespace App\Http\Controllers;

use App\Enums\PanneAnomalie;
use App\Enums\PanneStatus;
use App\Exports\ClientsCompteursExport;
use App\Exports\PaymentsSummaryExport;
use App\Models\Facture;
use App\Models\Panne;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
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

    public function invoicesPdf(Request $request): Response
    {
        $period = $this->periodFromRequest($request);

        $factures = Facture::with('client', 'compteur.secteur', 'paiements')
            ->whereBetween('generated_at', [$period->startOfMonth(), $period->endOfMonth()])
            ->orderBy('generated_at')
            ->get();

        $pdf = Pdf::loadView('reports.invoices-month', [
            'factures' => $factures,
            'period' => $period,
            'generatedAt' => now(),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('factures-'.$period->format('Y-m').'.pdf');
    }

    public function paymentsExcel(Request $request): BinaryFileResponse
    {
        $period = $this->periodFromRequest($request);

        return Excel::download(new PaymentsSummaryExport($period), 'paiements-'.$period->format('Y-m').'.xlsx');
    }

    private function periodFromRequest(Request $request): CarbonImmutable
    {
        $month = (int) $request->integer('month', now()->month);
        $year = (int) $request->integer('year', now()->year);

        return CarbonImmutable::create($year, $month, 1);
    }

    private function statusLabels(): array
    {
        return [
            PanneStatus::Open->value => 'Ouverte',
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
}
