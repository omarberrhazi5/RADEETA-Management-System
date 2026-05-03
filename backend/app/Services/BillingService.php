<?php

namespace App\Services;

use App\Models\Facture;
use App\Models\Releve;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BillingService
{
    public function __construct(private readonly TariffService $tariffs)
    {
    }

    public function calculate(Releve $releve): array
    {
        $config = $this->tariffs->current();
        $coefficient = (float) ($config['coefficient'] ?? 1);
        $consumption = round((float) $releve->consommation * $coefficient, 2);

        $waterTva = (float) data_get($config, 'water.tva_rate', 0.07);
        $sanitationTva = (float) data_get($config, 'sanitation.tva_rate', 0.07);

        $waterLines = $this->tariffs->splitConsumption($consumption, data_get($config, 'water.tranches', []), 'water', $waterTva);
        $sanitationLines = $this->tariffs->splitConsumption($consumption, data_get($config, 'sanitation.tranches', []), 'sanitation', $sanitationTva);
        $fixedLines = [
            $this->fixedLine('water', 'Redevance fixe eau', (float) data_get($config, 'water.fixed_fee_ht', 0), $waterTva),
            $this->fixedLine('sanitation', 'Redevance fixe assainissement', (float) data_get($config, 'sanitation.fixed_fee_ht', 0), $sanitationTva),
        ];

        $stampTax = (float) ($config['stamp_tax'] ?? 0);
        $taxLines = $stampTax > 0 ? [[
            'section' => 'taxes',
            'label' => 'Droit de timbre',
            'quantity' => 1,
            'unit_price_ht' => round($stampTax, 2),
            'montant_ht' => round($stampTax, 2),
            'tva_rate' => 0,
            'tva_amount' => 0,
            'total_ttc' => round($stampTax, 2),
        ]] : [];

        $lineItems = array_values(array_filter(
            [...$waterLines, ...$sanitationLines, ...$fixedLines, ...$taxLines],
            fn (array $line): bool => (float) $line['montant_ht'] > 0
        ));
        $montantHt = round(array_sum(array_column($lineItems, 'montant_ht')), 2);
        $tva = round(array_sum(array_column($lineItems, 'tva_amount')), 2);
        $taxes = round(array_sum(array_column($fixedLines, 'montant_ht')) + $stampTax, 2);
        $total = round($montantHt + $tva, 2);

        return [
            'unit_price' => $consumption > 0 ? round(($montantHt - $taxes) / $consumption, 2) : 0,
            'montant_ht' => $montantHt,
            'taxes' => $taxes,
            'tva' => $tva,
            'total_ttc' => $total,
            'montant_especes' => $total,
            'montant_autre_mode' => $total,
            'line_items' => $lineItems,
            'detail_snapshot' => [
                'agence' => $config['agence'] ?? 'SRM Taza/Region',
                'consommation_m3' => $consumption,
                'sections' => [
                    'water' => $this->sectionSummary('Consommation eau', [...$waterLines, $fixedLines[0]]),
                    'sanitation' => $this->sectionSummary('Assainissement', [...$sanitationLines, $fixedLines[1]]),
                    'taxes' => $this->sectionSummary('Taxes', $taxLines),
                ],
                'totals' => [
                    'montant_ht' => $montantHt,
                    'taxes' => $taxes,
                    'tva' => $tva,
                    'total_ttc' => $total,
                ],
            ],
        ];
    }

    public function generateInvoice(Releve $releve, ?string $dueDate = null): Facture
    {
        return DB::transaction(function () use ($releve, $dueDate): Facture {
            $releve->loadMissing('compteur.client', 'compteur.secteur');

            $existing = Facture::where('releve_id', $releve->id)->first();
            if ($existing) {
                if (! $existing->detail_snapshot || ! $existing->line_items) {
                    $existing->forceFill($this->invoiceAttributes($releve, $existing->reference))->save();
                }

                return $existing->load('client', 'compteur', 'releve', 'paiements');
            }

            $reference = $this->nextReference();

            $facture = Facture::create([
                'client_id' => $releve->compteur->id_client,
                'compteur_id' => $releve->compteur_id,
                'releve_id' => $releve->id,
                'reference' => $reference,
                'statut' => Facture::STATUT_IMPAYEE,
                'due_date' => $dueDate ?? now()->addDays(15)->toDateString(),
                'generated_at' => now(),
            ] + $this->invoiceAttributes($releve, $reference));

            return $facture->load('client', 'compteur', 'releve', 'paiements');
        });
    }

    private function invoiceAttributes(Releve $releve, string $reference): array
    {
        $releve->loadMissing('compteur.client', 'compteur.secteur');
        $compteur = $releve->compteur;
        $client = $compteur?->client;
        $secteur = $compteur?->secteur;
        $config = $this->tariffs->current();
        $totals = $this->calculate($releve);
        $coefficient = (float) ($config['coefficient'] ?? 1);
        $usageType = $secteur?->nom_secteur === 'Zone Industrielle'
            ? 'industrial'
            : ((string) $compteur?->calibre === '20' ? 'commercial' : 'domestic');

        return [
            'tournee' => $secteur?->num_torne,
            'numero_client' => $client?->police,
            'client_name' => trim(($client?->prenom ?? '').' '.($client?->nom ?? '')),
            'address' => $client?->adresse,
            'numero_contrat' => $client?->police,
            'usage_type' => $usageType,
            'agence' => $config['agence'] ?? 'SRM Taza/Region - Agence Taza',
            'facture_date' => now()->toDateString(),
            'periode_debut' => $releve->periode_debut,
            'periode_fin' => $releve->periode_fin,
            'numero_facture_eau_assainissement' => str_replace('FAC-', 'EA-', $reference),
            'compteur_number' => $compteur?->cadran,
            'coefficient' => $coefficient,
            'diametre_compteur' => data_get($config, 'meter_diameters.'.$compteur?->calibre, ($compteur?->calibre ? $compteur->calibre.' mm' : null)),
            'ancienne_date_lecture' => $releve->periode_debut,
            'nouvelle_date_lecture' => $releve->periode_fin,
            'ancien_index' => $releve->ancien_index,
            'nouvel_index' => $releve->nouvel_index,
            'consommation_m3' => $totals['detail_snapshot']['consommation_m3'],
            'montant_ht' => $totals['montant_ht'],
            'taxes' => $totals['taxes'],
            'tva' => $totals['tva'],
            'total_ttc' => $totals['total_ttc'],
            'montant_especes' => $totals['montant_especes'],
            'montant_autre_mode' => $totals['montant_autre_mode'],
            'line_items' => $totals['line_items'],
            'detail_snapshot' => $totals['detail_snapshot'],
        ];
    }

    private function fixedLine(string $section, string $label, float $amountHt, float $tvaRate): array
    {
        return [
            'section' => $section,
            'label' => $label,
            'quantity' => 1,
            'unit_price_ht' => round($amountHt, 2),
            'montant_ht' => round($amountHt, 2),
            'tva_rate' => $tvaRate,
            'tva_amount' => round($amountHt * $tvaRate, 2),
            'total_ttc' => round($amountHt + ($amountHt * $tvaRate), 2),
        ];
    }

    private function sectionSummary(string $label, array $lines): array
    {
        $visibleLines = array_values(array_filter($lines, fn (array $line): bool => (float) $line['montant_ht'] > 0));

        return [
            'label' => $label,
            'lines' => $visibleLines,
            'total_ht' => round(array_sum(array_column($visibleLines, 'montant_ht')), 2),
            'total_tva' => round(array_sum(array_column($visibleLines, 'tva_amount')), 2),
            'total_ttc' => round(array_sum(array_column($visibleLines, 'total_ttc')), 2),
        ];
    }

    private function nextReference(): string
    {
        do {
            $reference = 'FAC-'.now()->format('Ym').'-'.Str::upper(Str::random(6));
        } while (Facture::where('reference', $reference)->exists());

        return $reference;
    }
}
