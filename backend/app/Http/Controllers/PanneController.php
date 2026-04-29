<?php

namespace App\Http\Controllers;

use App\Enums\PanneAnomalie;
use App\Enums\PanneStatus;
use App\Http\Resources\PanneResource;
use App\Models\Notification;
use App\Models\Panne;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class PanneController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $limit = min((int) request('limit', 10), 500);

        $query = Panne::with('compteur.client', 'compteur.secteur', 'reparations.plombier');

        if (request('sort') === 'recent') {
            $query->latest('date_panne');
        }

        return PanneResource::collection($query->paginate($limit));
    }

    public function store(Request $request): JsonResponse
    {
        $this->normalizeFrontendPayload($request);

        $validated = $request->validate([
            'id_compteur' => ['required', Rule::exists('compteurs', 'id')->whereNull('deleted_at')],
            'date_panne' => ['required', 'date'],
            'anomalie' => ['required', Rule::enum(PanneAnomalie::class)],
            'status' => ['sometimes', Rule::enum(PanneStatus::class)],
        ]);

        $panne = Panne::create($validated);
        $panne->load('compteur.client', 'compteur.secteur');

        Notification::create([
            'title' => 'Nouvelle panne signalée',
            'message' => sprintf(
                'Panne #%d signalée sur le compteur %s%s.',
                $panne->id,
                $panne->compteur?->cadran ?? 'inconnu',
                $panne->compteur?->secteur ? ' - '.$panne->compteur->secteur->nom_secteur : ''
            ),
            'type' => 'panne',
        ]);

        return (new PanneResource($panne->load('compteur.client', 'compteur.secteur', 'reparations.plombier')))->response()->setStatusCode(201);
    }

    public function show(Panne $panne): PanneResource
    {
        return new PanneResource($panne->load('compteur.client', 'compteur.secteur', 'reparations.plombier'));
    }

    public function update(Request $request, Panne $panne): JsonResponse
    {
        $this->normalizeFrontendPayload($request);

        $validated = $request->validate([
            'id_compteur' => ['sometimes', 'required', Rule::exists('compteurs', 'id')->whereNull('deleted_at')],
            'date_panne' => ['sometimes', 'required', 'date'],
            'anomalie' => ['sometimes', 'required', Rule::enum(PanneAnomalie::class)],
            'status' => ['sometimes', Rule::enum(PanneStatus::class)],
        ]);

        $panne->update($validated);

        return (new PanneResource($panne->load('compteur.client', 'compteur.secteur', 'reparations.plombier')))->response();
    }

    public function destroy(Panne $panne): JsonResponse
    {
        $panne->delete();

        return response()->json(null, 204);
    }

    private function normalizeFrontendPayload(Request $request): void
    {
        $mapped = [];

        if ($request->has('statut') && ! $request->has('status')) {
            $mapped['status'] = match ($request->input('statut')) {
                'résolue', 'resolue', 'resolved' => PanneStatus::Resolved->value,
                default => PanneStatus::Open->value,
            };
        }

        if ($request->has('anomalie')) {
            $mapped['anomalie'] = $this->normalizeAnomalie($request->input('anomalie'));
        }

        if ($mapped !== []) {
            $request->merge($mapped);
        }
    }

    private function normalizeAnomalie(?string $anomalie): ?string
    {
        return match ($anomalie) {
            'Fuite côté abonné', 'Fuite après compteur' => PanneAnomalie::FuiteApresCompteur->value,
            'Fuite côté RADEETA', 'Fuite compteur' => PanneAnomalie::FuiteAvantCompteur->value,
            'Compteur bloqué' => PanneAnomalie::CompteurBloque->value,
            'Compteur cassé' => PanneAnomalie::CompteurCasse->value,
            'Compteur posé à l\'envers', 'Compteur mal posé' => PanneAnomalie::CompteurInverse->value,
            'Index illisible' => PanneAnomalie::CadranIllisible->value,
            'Compteur déposé', 'Compteur introuvable' => PanneAnomalie::AbsenceCompteur->value,
            'Fraude', 'Existence by-pass sur CG' => PanneAnomalie::BranchementIllicite->value,
            'Compteur déplombé' => PanneAnomalie::PlombRompu->value,
            default => $anomalie,
        };
    }
}
