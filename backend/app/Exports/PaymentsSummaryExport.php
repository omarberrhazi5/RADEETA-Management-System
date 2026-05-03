<?php

namespace App\Exports;

use App\Models\Paiement;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class PaymentsSummaryExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithTitle
{
    public function __construct(private readonly CarbonImmutable $period)
    {
    }

    public function collection(): Collection
    {
        return Paiement::with('facture.client')
            ->whereBetween('paid_at', [$this->period->startOfMonth(), $this->period->endOfMonth()])
            ->orderBy('paid_at')
            ->get();
    }

    public function headings(): array
    {
        return ['Reference', 'Invoice', 'Client', 'Amount MAD', 'Mode', 'Paid at'];
    }

    public function map($row): array
    {
        return [
            $row->reference,
            $row->facture?->reference,
            trim(($row->facture?->client?->prenom ?? '').' '.($row->facture?->client?->nom ?? '')),
            $row->montant,
            $row->mode,
            $row->paid_at?->format('Y-m-d H:i'),
        ];
    }

    public function title(): string
    {
        return 'Payments '.$this->period->format('Y-m');
    }
}
