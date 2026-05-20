<?php

namespace App\Http\Controllers;

use App\Http\Resources\CompteurResource;
use App\Models\Client;
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
        $query = Compteur::with('client', 'secteur', 'pannes')
            ->latest();

        if (OperatorAccess::isOperator($request->user())) {
            OperatorAccess::scopeCompteurs($query, $request->user());
        }

        return CompteurResource::collection($query->paginate($limit));
    }

    public function store(Request $request): JsonResponse
    {
        $this->hydrateClientDefaults($request);
        $serviceType = $request->input('service_type', 'water');

        $validated = $request->validate([
            'cadran' => ['required', 'string', 'max:255', Rule::unique('compteurs', 'cadran')],
            'num_contrat' => ['required', 'digits:9'],
            'num_tournee' => ['nullable', 'string', 'max:255'],
            'usage' => ['nullable', Rule::in(['Domestique', 'Patente', 'Administration'])],
            'calibre' => ['required', Rule::in($this->calibreOptions($serviceType))],
            'technical_type' => ['required', Rule::in($this->technicalTypeOptions($serviceType))],
            'marque' => ['nullable', 'string', 'max:255'],
            'service_type' => ['required', Rule::in(['water', 'electricity'])],
            'index_releve' => ['required', 'numeric', 'min:0'],
            'id_client' => ['required', Rule::exists('clients', 'id')->whereNull('deleted_at')],
            'id_secteur' => ['required', Rule::exists('secteurs', 'id')->whereNull('deleted_at')],
        ]);

        $this->forceClientContractNumber($validated);

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
        $this->hydrateClientDefaults($request);
        $serviceType = $request->input('service_type', $compteur->service_type);

        $validated = $request->validate([
            'cadran' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('compteurs', 'cadran')->ignore($compteur)],
            'num_contrat' => ['sometimes', 'required', 'digits:9'],
            'num_tournee' => ['nullable', 'string', 'max:255'],
            'usage' => ['nullable', Rule::in(['Domestique', 'Patente', 'Administration'])],
            'calibre' => ['sometimes', 'required', Rule::in($this->calibreOptions($serviceType))],
            'technical_type' => ['sometimes', 'required', Rule::in($this->technicalTypeOptions($serviceType))],
            'marque' => ['nullable', 'string', 'max:255'],
            'service_type' => ['sometimes', 'required', Rule::in(['water', 'electricity'])],
            'index_releve' => ['sometimes', 'required', 'numeric', 'min:0'],
            'id_client' => ['sometimes', 'required', Rule::exists('clients', 'id')->whereNull('deleted_at')],
            'id_secteur' => ['sometimes', 'required', Rule::exists('secteurs', 'id')->whereNull('deleted_at')],
        ]);

        $this->forceClientContractNumber($validated, $compteur);

        $compteur->update($validated);

        return (new CompteurResource($compteur->load('client', 'secteur', 'pannes')))->response();
    }

    public function destroy(Compteur $compteur): JsonResponse
    {
        $compteur->delete();

        return response()->json(null, 204);
    }

    private function hydrateClientDefaults(Request $request): void
    {
        if (! $request->filled('id_client')) {
            return;
        }

        $client = Client::withTrashed()->find($request->input('id_client'));

        if (! $client) {
            return;
        }

        $request->merge([
            'id_secteur' => $request->input('id_secteur') ?: $client->id_secteur,
            'service_type' => $request->input('service_type') ?: $client->service_type,
            'usage' => $request->input('usage') ?: $client->type_abonnement,
        ]);
    }

    private function forceClientContractNumber(array &$validated, ?Compteur $compteur = null): void
    {
        $clientId = $validated['id_client'] ?? $compteur?->id_client;

        if (! $clientId) {
            return;
        }

        $client = Client::withTrashed()->findOrFail($clientId);

        abort_if(
            ! empty($validated['num_contrat']) && $validated['num_contrat'] !== $client->police,
            422,
            'The contract number must match the selected client.'
        );

        $validated['num_contrat'] = $client->police;
    }

    private function calibreOptions(?string $serviceType): array
    {
        return match ($serviceType) {
            'electricity' => ['2 fils', '4 fils'],
            'water' => ['15', '20', '30', '40', '50', '60'],
            default => [],
        };
    }

    private function technicalTypeOptions(?string $serviceType): array
    {
        return match ($serviceType) {
            'electricity' => ['Mécanique', 'Numérique'],
            'water' => ['Mécanique'],
            default => [],
        };
    }
}
