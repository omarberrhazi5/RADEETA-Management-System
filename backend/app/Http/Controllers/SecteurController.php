<?php

namespace App\Http\Controllers;

use App\Http\Resources\SecteurResource;
use App\Models\Secteur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class SecteurController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $limit = min((int) request('limit', 10), 500);

        return SecteurResource::collection(Secteur::with('compteurs.client', 'compteurs.pannes')->paginate($limit));
    }

    public function store(Request $request): JsonResponse
    {
        $this->normalizeFrontendPayload($request);

        $validated = $request->validate([
            'nom_secteur' => ['required', 'string', 'max:255'],
            'emplacement' => ['required', Rule::in(['Taza Haut', 'Taza Bas'])],
            'agence' => ['nullable', 'string', 'max:255'],
            'num_torne' => ['required', 'integer', 'between:1,30'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $validated['agence'] ??= $request->user()?->agence ?? 'SRM-FM Taza';

        $secteur = Secteur::create($validated);

        return (new SecteurResource($secteur->load('compteurs')))->response()->setStatusCode(201);
    }

    public function show(Secteur $secteur): SecteurResource
    {
        return new SecteurResource($secteur->load('compteurs.client', 'compteurs.pannes'));
    }

    public function update(Request $request, Secteur $secteur): JsonResponse
    {
        $this->normalizeFrontendPayload($request);

        $validated = $request->validate([
            'nom_secteur' => ['sometimes', 'required', 'string', 'max:255'],
            'emplacement' => ['sometimes', 'required', Rule::in(['Taza Haut', 'Taza Bas'])],
            'agence' => ['sometimes', 'required', 'string', 'max:255'],
            'num_torne' => ['sometimes', 'required', 'integer', 'between:1,30'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
        ]);

        $secteur->update($validated);

        return (new SecteurResource($secteur->load('compteurs.client', 'compteurs.pannes')))->response();
    }

    public function destroy(Secteur $secteur): JsonResponse
    {
        $secteur->delete();

        return response()->json(null, 204);
    }

    private function normalizeFrontendPayload(Request $request): void
    {
        $mapped = [];

        if ($request->has('numero_secteur') && ! $request->has('num_torne')) {
            $mapped['num_torne'] = $request->input('numero_secteur');
        }

        if ($request->has('tour') && ! $request->has('num_torne')) {
            $mapped['num_torne'] = $request->input('tour');
        }

        if ($request->has('adresse') && ! $request->has('nom_secteur')) {
            $mapped['nom_secteur'] = $request->input('adresse');
        }

        if ($request->has('name') && ! $request->has('nom_secteur')) {
            $mapped['nom_secteur'] = $request->input('name');
        }

        if ($request->has('location') && ! $request->has('emplacement')) {
            $mapped['emplacement'] = $request->input('location');
        }

        if ($request->has('agency') && ! $request->has('agence')) {
            $mapped['agence'] = $request->input('agency');
        }

        if ($mapped !== []) {
            $request->merge($mapped);
        }
    }
}
