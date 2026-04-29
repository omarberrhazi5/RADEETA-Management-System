<?php

namespace App\Http\Controllers;

use App\Http\Resources\ClientResource;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $limit = min((int) request('limit', 10), 500);

        return ClientResource::collection(Client::with('compteurs.secteur', 'compteurs.pannes')->paginate($limit));
    }

    public function store(Request $request): JsonResponse
    {
        $request->merge([
            'abonne' => $request->input('abonne', $request->input('statut', 'actif') !== 'inactif'),
        ]);

        $validated = $request->validate([
            'police' => ['required', 'string', 'max:255', Rule::unique('clients', 'police')],
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:255'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'abonne' => ['sometimes', 'boolean'],
        ]);

        $client = Client::create($validated);

        return (new ClientResource($client->load('compteurs')))->response()->setStatusCode(201);
    }

    public function show(Client $client): ClientResource
    {
        return new ClientResource($client->load('compteurs.secteur', 'compteurs.pannes'));
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        if ($request->has('statut') && ! $request->has('abonne')) {
            $request->merge(['abonne' => $request->input('statut') !== 'inactif']);
        }

        $validated = $request->validate([
            'police' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('clients', 'police')->ignore($client)],
            'nom' => ['sometimes', 'required', 'string', 'max:255'],
            'prenom' => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:255'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'abonne' => ['sometimes', 'boolean'],
        ]);

        $client->update($validated);

        return (new ClientResource($client->load('compteurs.secteur', 'compteurs.pannes')))->response();
    }

    public function destroy(Client $client): JsonResponse
    {
        $client->delete();

        return response()->json(null, 204);
    }
}
