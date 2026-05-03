<?php

namespace App\Http\Controllers;

use App\Services\TariffService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TariffSettingController extends Controller
{
    public function show(TariffService $tariffs): JsonResponse
    {
        return response()->json([
            'data' => $tariffs->current(),
        ]);
    }

    public function update(Request $request, TariffService $tariffs): JsonResponse
    {
        $validated = $request->validate([
            'value' => ['required', 'array'],
            'value.agence' => ['nullable', 'string', 'max:255'],
            'value.coefficient' => ['nullable', 'numeric', 'min:0.01', 'max:20'],
            'value.stamp_tax' => ['nullable', 'numeric', 'min:0'],
            'value.water.fixed_fee_ht' => ['nullable', 'numeric', 'min:0'],
            'value.water.tva_rate' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'value.water.tranches' => ['nullable', 'array', 'min:1'],
            'value.sanitation.fixed_fee_ht' => ['nullable', 'numeric', 'min:0'],
            'value.sanitation.tva_rate' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'value.sanitation.tranches' => ['nullable', 'array', 'min:1'],
            'value.meter_diameters' => ['nullable', 'array'],
        ]);

        return response()->json([
            'data' => $tariffs->update($validated['value']),
        ]);
    }
}
