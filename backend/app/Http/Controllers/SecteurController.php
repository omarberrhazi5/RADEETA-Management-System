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
        $validated = $request->validate([
            'nom_secteur' => ['required', 'string', 'max:255'],
            'emplacement' => ['required', Rule::in(['Taza Haut', 'Taza Bas'])],
            'agence' => ['nullable', 'string', 'max:255'],
            'num_torne' => ['required', 'string', 'max:255', Rule::unique('secteurs', 'num_torne')],
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
        $validated = $request->validate([
            'nom_secteur' => ['sometimes', 'required', 'string', 'max:255'],
            'emplacement' => ['sometimes', 'required', Rule::in(['Taza Haut', 'Taza Bas'])],
            'agence' => ['sometimes', 'required', 'string', 'max:255'],
            'num_torne' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('secteurs', 'num_torne')->ignore($secteur)],
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
}
