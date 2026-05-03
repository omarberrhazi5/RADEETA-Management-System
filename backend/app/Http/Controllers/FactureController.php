<?php

namespace App\Http\Controllers;

use App\Http\Resources\FactureResource;
use App\Models\Facture;
use App\Models\Releve;
use App\Services\BillingService;
use App\Services\NotificationService;
use App\Support\OperatorAccess;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class FactureController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $limit = min((int) $request->integer('limit', 15), 500);

        $query = Facture::with('client', 'compteur', 'releve', 'paiements')->latest('generated_at');

        if (OperatorAccess::isOperator($request->user())) {
            OperatorAccess::scopeFactures($query, $request->user());
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->integer('client_id'));
        }

        if ($request->filled('secteur_id')) {
            $query->whereHas('compteur', fn ($compteur) => $compteur->where('id_secteur', $request->integer('secteur_id')));
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->input('statut'));
        }

        if ($request->filled('from')) {
            $query->whereDate('generated_at', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('generated_at', '<=', $request->date('to'));
        }

        return FactureResource::collection($query->paginate($limit));
    }

    public function store(Request $request, BillingService $billing, NotificationService $notifications): JsonResponse
    {
        $validated = $request->validate([
            'releve_id' => ['required', Rule::exists('releves', 'id')],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        $alreadyGenerated = Facture::where('releve_id', $validated['releve_id'])->exists();
        $releve = Releve::with('compteur.client')->findOrFail($validated['releve_id']);
        $facture = $billing->generateInvoice($releve, $validated['due_date'] ?? null);

        if (! $alreadyGenerated) {
            $notifications->factureGenerated($facture);
        }

        return (new FactureResource($facture))->response()->setStatusCode(201);
    }

    public function show(Facture $facture): FactureResource
    {
        $request = request();
        $query = Facture::whereKey($facture->id);
        if (OperatorAccess::isOperator($request->user())) {
            OperatorAccess::scopeFactures($query, $request->user());
        }

        abort_if(
            OperatorAccess::isOperator($request->user())
            && ! $query->exists(),
            403,
            'Forbidden'
        );

        return new FactureResource($facture->load('client', 'compteur', 'releve', 'paiements.creator'));
    }

    public function preview(Facture $facture): Response
    {
        return $this->pdf($facture)->stream($facture->reference.'.pdf');
    }

    public function download(Facture $facture): Response
    {
        return $this->pdf($facture)->download($facture->reference.'.pdf');
    }

    private function pdf(Facture $facture): \Barryvdh\DomPDF\PDF
    {
        $request = request();
        $query = Facture::whereKey($facture->id);
        if (OperatorAccess::isOperator($request->user())) {
            OperatorAccess::scopeFactures($query, $request->user());
        }

        abort_if(
            OperatorAccess::isOperator($request->user())
            && ! $query->exists(),
            403,
            'Forbidden'
        );

        $facture->load('client', 'compteur.secteur', 'releve', 'paiements');

        return Pdf::loadView('invoices.facture', [
            'facture' => $facture,
            'paidAmount' => (float) $facture->paiements->sum('montant'),
            'remainingAmount' => max(0, (float) $facture->total_ttc - (float) $facture->paiements->sum('montant')),
        ])->setPaper('a4');
    }
}
