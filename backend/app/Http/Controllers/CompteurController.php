<?php

namespace App\Http\Controllers;

use App\Http\Resources\CompteurResource;
use App\Models\Compteur;
use App\Support\OperatorAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class CompteurController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $limit = min((int) request('limit', 10), 500);
        $query = Compteur::with('client', 'secteur', 'pannes');

        if (OperatorAccess::isOperator($request->user())) {
            OperatorAccess::scopeCompteurs($query, $request->user());
        }

        return CompteurResource::collection($query->paginate($limit));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cadran' => ['required', 'string', 'max:255', Rule::unique('compteurs', 'cadran')],
            'calibre' => ['required', Rule::in(['15', '20'])],
            'marque' => ['nullable', 'string', 'max:255'],
            'index_releve' => ['required', 'numeric', 'min:0'],
            'id_client' => ['required', Rule::exists('clients', 'id')->whereNull('deleted_at')],
            'id_secteur' => ['required', Rule::exists('secteurs', 'id')->whereNull('deleted_at')],
        ]);

        $compteur = Compteur::create($validated);

        return (new CompteurResource($compteur->load('client', 'secteur', 'pannes')))->response()->setStatusCode(201);
    }

    public function show(Request $request, Compteur $compteur): CompteurResource
    {
        abort_if(
            OperatorAccess::isOperator($request->user()) && ! OperatorAccess::canAccessCompteur($compteur, $request->user()),
            403,
            'Forbidden'
        );

        return new CompteurResource($compteur->load('client', 'secteur', 'pannes'));
    }

    public function update(Request $request, Compteur $compteur): JsonResponse
    {
        $validated = $request->validate([
            'cadran' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('compteurs', 'cadran')->ignore($compteur)],
            'calibre' => ['sometimes', 'required', Rule::in(['15', '20'])],
            'marque' => ['nullable', 'string', 'max:255'],
            'index_releve' => ['sometimes', 'required', 'numeric', 'min:0'],
            'id_client' => ['sometimes', 'required', Rule::exists('clients', 'id')->whereNull('deleted_at')],
            'id_secteur' => ['sometimes', 'required', Rule::exists('secteurs', 'id')->whereNull('deleted_at')],
        ]);

        $compteur->update($validated);

        return (new CompteurResource($compteur->load('client', 'secteur', 'pannes')))->response();
    }

    public function destroy(Compteur $compteur): JsonResponse
    {
        $compteur->delete();

        return response()->json(null, 204);
    }
}
