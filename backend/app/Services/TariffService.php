<?php

namespace App\Services;

use App\Models\TariffSetting;

class TariffService
{
    public const WATER_SANITATION_KEY = 'water_sanitation';

    public function current(): array
    {
        return TariffSetting::firstOrCreate([
            'key' => self::WATER_SANITATION_KEY,
        ], [
            'value' => $this->defaults(),
        ])->value;
    }

    public function update(array $value): array
    {
        $merged = array_replace_recursive($this->defaults(), $value);

        TariffSetting::updateOrCreate([
            'key' => self::WATER_SANITATION_KEY,
        ], [
            'value' => $merged,
        ]);

        return $merged;
    }

    public function splitConsumption(float $quantity, array $tranches, string $section, float $tvaRate): array
    {
        $remaining = max(0, $quantity);
        $lines = [];

        foreach ($tranches as $tranche) {
            if ($remaining <= 0) {
                break;
            }

            $from = (float) ($tranche['from'] ?? 0);
            $to = $tranche['to'] ?? null;
            $capacity = $to === null ? $remaining : max(0, ((float) $to - $from) + 1);
            $lineQuantity = min($remaining, $capacity);

            if ($lineQuantity <= 0) {
                continue;
            }

            $unitPrice = (float) ($tranche['unit_price_ht'] ?? 0);
            $amountHt = round($lineQuantity * $unitPrice, 2);
            $tvaAmount = round($amountHt * $tvaRate, 2);

            $lines[] = [
                'section' => $section,
                'label' => $tranche['label'] ?? 'Tranche',
                'from' => $tranche['from'] ?? null,
                'to' => $tranche['to'] ?? null,
                'quantity' => round($lineQuantity, 2),
                'unit_price_ht' => round($unitPrice, 2),
                'montant_ht' => $amountHt,
                'tva_rate' => $tvaRate,
                'tva_amount' => $tvaAmount,
                'total_ttc' => round($amountHt + $tvaAmount, 2),
            ];

            $remaining -= $lineQuantity;
        }

        return $lines;
    }

    public function defaults(): array
    {
        return [
            'agence' => 'SRM Taza/Region - Agence Taza',
            'coefficient' => 1,
            'water' => [
                'fixed_fee_ht' => 6.00,
                'tva_rate' => 0.07,
                'tranches' => [
                    ['label' => 'Tranche 1', 'from' => 0, 'to' => 6, 'unit_price_ht' => 2.37],
                    ['label' => 'Tranche 2', 'from' => 7, 'to' => 12, 'unit_price_ht' => 7.39],
                    ['label' => 'Tranche 3', 'from' => 13, 'to' => 20, 'unit_price_ht' => 10.98],
                    ['label' => 'Tranche 4', 'from' => 21, 'to' => null, 'unit_price_ht' => 11.03],
                ],
            ],
            'sanitation' => [
                'fixed_fee_ht' => 5.00,
                'tva_rate' => 0.07,
                'tranches' => [
                    ['label' => 'Assainissement T1', 'from' => 0, 'to' => 6, 'unit_price_ht' => 0.75],
                    ['label' => 'Assainissement T2', 'from' => 7, 'to' => 12, 'unit_price_ht' => 2.20],
                    ['label' => 'Assainissement T3', 'from' => 13, 'to' => 20, 'unit_price_ht' => 3.45],
                    ['label' => 'Assainissement T4', 'from' => 21, 'to' => null, 'unit_price_ht' => 4.10],
                ],
            ],
            'meter_diameters' => [
                '15' => '15 mm',
                '20' => '20 mm',
                '25' => '25 mm',
            ],
            'stamp_tax' => 0.25,
        ];
    }
}
