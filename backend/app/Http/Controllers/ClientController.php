<?php

namespace App\Http\Controllers;

use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Models\Secteur;
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
        $query = Client::with('secteur', 'compteurs.secteur', 'compteurs.pannes');

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
            'police' => ['required', 'digits:9', Rule::unique('clients', 'police')],
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['nullable', 'string', 'max:255'],
            'cin' => ['required', 'string', 'max:20', Rule::unique('clients', 'cin')],
            'telephone' => ['nullable', 'string', 'max:255'],
            'adresse' => ['required', 'string', 'max:255'],
            'type_abonnement' => ['required', Rule::in(['Domestique', 'Patente', 'Administration'])],
            'service_type' => ['required', Rule::in(['water', 'electricity'])],
            'id_secteur' => ['required', 'integer', Rule::exists('secteurs', 'id')],
            'abonne' => ['sometimes', 'boolean'],
        ]);

        $this->authorizeSectorAgency($request, (int) $validated['id_secteur']);

        $client = Client::create($validated);

        return (new ClientResource($client->load('secteur', 'compteurs')))->response()->setStatusCode(201);
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

        return new ClientResource($client->load('secteur', 'compteurs.secteur', 'compteurs.pannes'));
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        if ($request->has('statut') && ! $request->has('abonne')) {
            $request->merge(['abonne' => $request->input('statut') !== 'inactif']);
        }

        $validated = $request->validate([
            'police' => ['sometimes', 'required', 'digits:9', Rule::unique('clients', 'police')->ignore($client)],
            'nom' => ['sometimes', 'required', 'string', 'max:255'],
            'prenom' => ['nullable', 'string', 'max:255'],
            'cin' => ['sometimes', 'required', 'string', 'max:20', Rule::unique('clients', 'cin')->ignore($client)],
            'telephone' => ['nullable', 'string', 'max:255'],
            'adresse' => ['sometimes', 'required', 'string', 'max:255'],
            'type_abonnement' => ['sometimes', 'required', Rule::in(['Domestique', 'Patente', 'Administration'])],
            'service_type' => ['sometimes', 'required', Rule::in(['water', 'electricity'])],
            'id_secteur' => ['sometimes', 'required', 'integer', Rule::exists('secteurs', 'id')],
            'abonne' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('id_secteur', $validated)) {
            $this->authorizeSectorAgency($request, (int) $validated['id_secteur']);
        }

        $client->update($validated);

        return (new ClientResource($client->load('secteur', 'compteurs.secteur', 'compteurs.pannes')))->response();
    }

    public function destroy(Client $client): JsonResponse
    {
        $client->delete();

        return response()->json(null, 204);
    }

    private function authorizeSectorAgency(Request $request, int $secteurId): void
    {
        $userAgency = $request->user()?->agence;

        abort_if(! $userAgency, 403, 'User agency is required to add a client.');

        $belongsToAgency = Secteur::query()
            ->whereKey($secteurId)
            ->where('agence', $userAgency)
            ->exists();

        abort_unless($belongsToAgency, 422, 'The selected sector does not belong to your agency.');
    }

}
