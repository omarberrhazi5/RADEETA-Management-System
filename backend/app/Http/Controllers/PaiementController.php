<?php

namespace App\Http\Controllers;

use App\Http\Resources\PaiementResource;
use App\Models\Facture;
use App\Models\Paiement;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PaiementController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $limit = min((int) $request->integer('limit', 15), 500);

        $query = Paiement::with('facture.client', 'creator')->latest('paid_at');

        if ($request->filled('facture_id')) {
            $query->where('facture_id', $request->integer('facture_id'));
        }

        return PaiementResource::collection($query->paginate($limit));
    }

    public function store(Request $request, Facture $facture, NotificationService $notifications): JsonResponse
    {
        $validated = $request->validate([
            'montant' => ['required', 'numeric', 'min:0.01'],
            'mode' => ['required', Rule::in(['cash', 'card', 'bank_transfer', 'mobile', 'cheque'])],
            'reference' => ['nullable', 'string', 'max:255'],
            'paid_at' => ['nullable', 'date'],
        ]);

        $paid = (float) $facture->paiements()->sum('montant');
        $remaining = max(0, (float) $facture->total_ttc - $paid);

        if ((float) $validated['montant'] > $remaining) {
            return response()->json([
                'message' => 'Payment amount exceeds the remaining invoice balance.',
                'errors' => ['montant' => ['Payment amount exceeds the remaining invoice balance.']],
            ], 422);
        }

        $paiement = DB::transaction(function () use ($facture, $validated, $request): Paiement {
            return $facture->paiements()->create([
                ...$validated,
                'paid_at' => $validated['paid_at'] ?? now(),
                'created_by' => $request->user()?->id,
            ]);
        });

        $notifications->paiementReceived($paiement);

        return (new PaiementResource($paiement->load('facture.client', 'creator')))->response()->setStatusCode(201);
    }
}
