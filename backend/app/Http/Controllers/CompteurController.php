<?php

namespace App\Http\Controllers;

use App\Http\Resources\CompteurResource;
use App\Models\Compteur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class CompteurController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $limit = min((int) request('limit', 10), 500);

        return CompteurResource::collection(Compteur::with('client', 'secteur', 'pannes')->paginate($limit));
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

    public function show(Compteur $compteur): CompteurResource
    {
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
