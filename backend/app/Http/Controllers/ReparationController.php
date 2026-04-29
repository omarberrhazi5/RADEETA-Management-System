<?php

namespace App\Http\Controllers;

use App\Enums\PanneStatus;
use App\Http\Requests\ReparationRequest;
use App\Http\Resources\ReparationResource;
use App\Models\Panne;
use App\Models\Reparation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ReparationController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $limit = min((int) request('limit', 10), 500);

        return ReparationResource::collection(Reparation::with('panne.compteur.client', 'panne.compteur.secteur', 'plombier')->paginate($limit));
    }

    public function store(ReparationRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $reparation = DB::transaction(function () use ($validated): Reparation {
            $reparation = Reparation::create($validated);
            $reparation->panne()->update(['status' => PanneStatus::Resolved->value]);

            return $reparation;
        });

        return (new ReparationResource($reparation->load('panne.compteur.client', 'panne.compteur.secteur', 'plombier')))->response()->setStatusCode(201);
    }

    public function show(Reparation $reparation): ReparationResource
    {
        return new ReparationResource($reparation->load('panne.compteur.client', 'panne.compteur.secteur', 'plombier'));
    }

    public function update(ReparationRequest $request, Reparation $reparation): JsonResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($reparation, $validated): void {
            $oldPanneId = $reparation->id_panne;

            $reparation->update($validated);
            $reparation->panne()->update(['status' => PanneStatus::Resolved->value]);

            if ($oldPanneId !== $reparation->id_panne) {
                $this->reopenPanneIfUnrepaired($oldPanneId);
            }
        });

        return (new ReparationResource($reparation->load('panne.compteur.client', 'panne.compteur.secteur', 'plombier')))->response();
    }

    public function destroy(Reparation $reparation): JsonResponse
    {
        DB::transaction(function () use ($reparation): void {
            $panneId = $reparation->id_panne;

            $reparation->delete();

            $this->reopenPanneIfUnrepaired($panneId);
        });

        return response()->json(null, 204);
    }

    private function reopenPanneIfUnrepaired(int $panneId): void
    {
        $hasActiveRepair = Reparation::where('id_panne', $panneId)->exists();

        if (! $hasActiveRepair) {
            Panne::whereKey($panneId)->update(['status' => PanneStatus::Open->value]);
        }
    }
}
