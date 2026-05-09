<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReleveResource;
use App\Models\Compteur;
use App\Models\Releve;
use App\Support\OperatorAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ReleveController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $limit = min((int) $request->integer('limit', 15), 500);

        $query = Releve::with('compteur.client', 'compteur.secteur', 'creator')->latest();

        if (OperatorAccess::isOperator($request->user())) {
            OperatorAccess::scopeReleves($query, $request->user());
        }

        if ($request->filled('compteur_id')) {
            $query->where('compteur_id', $request->integer('compteur_id'));
        }

        return ReleveResource::collection($query->paginate($limit));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'compteur_id' => ['required', Rule::exists('compteurs', 'id')->whereNull('deleted_at')],
            'ancien_index' => ['nullable', 'numeric', 'min:0'],
            'nouvel_index' => ['required', 'numeric', 'min:0'],
            'periode_debut' => ['required', 'date'],
            'periode_fin' => ['required', 'date', 'after_or_equal:periode_debut'],
        ]);

        $compteur = Compteur::findOrFail($validated['compteur_id']);
        abort_if(
            OperatorAccess::isOperator($request->user()) && ! OperatorAccess::canAccessCompteur($compteur, $request->user()),
            403,
            'Forbidden'
        );

        $validated['ancien_index'] ??= $compteur->releves()->latest('periode_fin')->value('nouvel_index') ?? $compteur->index_releve ?? 0;

        if ((float) $validated['nouvel_index'] < (float) $validated['ancien_index']) {
            return response()->json([
                'message' => 'The new index must be greater than or equal to the old index.',
                'errors' => ['nouvel_index' => ['The new index must be greater than or equal to the old index.']],
            ], 422);
        }

        $validated['created_by'] = $request->user()?->id;

        $releve = Releve::create($validated);
        $compteur->update(['index_releve' => $releve->nouvel_index]);

        return (new ReleveResource($releve->load('compteur.client', 'compteur.secteur', 'creator')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Releve $releve): JsonResponse
    {
        $this->authorizeOperatorReleveAccess($request, $releve);

        $validated = $request->validate([
            'ancien_index' => ['sometimes', 'required', 'numeric', 'min:0'],
            'nouvel_index' => ['sometimes', 'required', 'numeric', 'min:0'],
            'periode_debut' => ['sometimes', 'required', 'date'],
            'periode_fin' => ['sometimes', 'required', 'date', 'after_or_equal:periode_debut'],
        ]);

        $ancienIndex = $validated['ancien_index'] ?? $releve->ancien_index;
        $nouvelIndex = $validated['nouvel_index'] ?? $releve->nouvel_index;

        if ((float) $nouvelIndex < (float) $ancienIndex) {
            return response()->json([
                'message' => 'The new index must be greater than or equal to the old index.',
                'errors' => ['nouvel_index' => ['The new index must be greater than or equal to the old index.']],
            ], 422);
        }

        $releve->update($validated);
        $releve->compteur?->update(['index_releve' => max((float) $releve->compteur?->index_releve, (float) $releve->nouvel_index)]);

        return (new ReleveResource($releve->load('compteur.client', 'compteur.secteur', 'creator')))->response();
    }

    public function show(Request $request, Releve $releve): ReleveResource
    {
        $this->authorizeOperatorReleveAccess($request, $releve);

        return new ReleveResource($releve->load('compteur.client', 'compteur.secteur', 'creator'));
    }

    private function authorizeOperatorReleveAccess(Request $request, Releve $releve): void
    {
        $query = Releve::whereKey($releve->id);
        if (OperatorAccess::isOperator($request->user())) {
            OperatorAccess::scopeReleves($query, $request->user());
        }

        abort_if(
            OperatorAccess::isOperator($request->user())
            && ! $query->exists(),
            403,
            'Forbidden'
        );
    }
}
