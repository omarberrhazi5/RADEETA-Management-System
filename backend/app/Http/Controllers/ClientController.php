<?php

namespace App\Http\Controllers;

use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Support\OperatorAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $limit = min((int) request('limit', 10), 500);
        $query = Client::with('compteurs.secteur', 'compteurs.pannes');

        if (OperatorAccess::isOperator($request->user())) {
            OperatorAccess::scopeClients($query, $request->user());
        }

        return ClientResource::collection($query->paginate($limit));
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

    public function show(Request $request, Client $client): ClientResource
    {
        $visibleToOperator = Client::whereKey($client->id);
        if (OperatorAccess::isOperator($request->user())) {
            OperatorAccess::scopeClients($visibleToOperator, $request->user());
        }

        abort_if(
            OperatorAccess::isOperator($request->user()) && ! $visibleToOperator->exists(),
            403,
            'Forbidden'
        );

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
