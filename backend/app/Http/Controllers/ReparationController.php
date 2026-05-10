<?php

namespace App\Http\Controllers;

use App\Enums\PanneStatus;
use App\Enums\UserRole;
use App\Http\Requests\ReparationRequest;
use App\Http\Resources\ReparationResource;
use App\Models\Panne;
use App\Models\Reparation;
use App\Services\NotificationService;
use App\Support\OperatorAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ReparationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $limit = min((int) request('limit', 10), 500);

        $query = Reparation::with('panne.compteur.client', 'panne.compteur.secteur', 'plombier');

        if (OperatorAccess::isOperator($request->user())) {
            OperatorAccess::scopeReparations($query, $request->user());
        }

        return ReparationResource::collection($query->paginate($limit));
    }

    public function store(ReparationRequest $request, NotificationService $notifications): JsonResponse
    {
        $validated = $request->validated();

        $reparation = DB::transaction(function () use ($validated): Reparation {
            $reparation = Reparation::create($validated);
            $reparation->panne()->update(['status' => PanneStatus::Resolved->value]);

            return $reparation;
        });

        $notifications->repairCompleted($reparation);

        return (new ReparationResource($reparation->load('panne.compteur.client', 'panne.compteur.secteur', 'plombier')))->response()->setStatusCode(201);
    }

    public function show(Request $request, Reparation $reparation): ReparationResource
    {
        $this->authorizeOperatorReparationAccess($request, $reparation);

        return new ReparationResource($reparation->load('panne.compteur.client', 'panne.compteur.secteur', 'plombier'));
    }

    public function update(ReparationRequest $request, Reparation $reparation, NotificationService $notifications): JsonResponse
    {
        $this->authorizeOperatorReparationAccess($request, $reparation);

        $validated = $request->validated();
        $this->limitOperatorUpdatePayload($request, $validated);

        DB::transaction(function () use ($reparation, $validated): void {
            $oldPanneId = $reparation->id_panne;

            $reparation->update($validated);
            $reparation->panne()->update(['status' => PanneStatus::Resolved->value]);

            if ($oldPanneId !== $reparation->id_panne) {
                $this->reopenPanneIfUnrepaired($oldPanneId);
            }
        });

        $notifications->repairCompleted($reparation);

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

    private function isOperator(Request $request): bool
    {
        $role = $request->user()?->role;
        $value = $role instanceof UserRole ? $role->value : $role;

        return $value === UserRole::Technician->value;
    }

    private function authorizeOperatorReparationAccess(Request $request, Reparation $reparation): void
    {
        $query = Reparation::whereKey($reparation->id);
        if (OperatorAccess::isOperator($request->user())) {
            OperatorAccess::scopeReparations($query, $request->user());
        }

        abort_if(
            OperatorAccess::isOperator($request->user()) && ! $query->exists(),
            403,
            'Forbidden'
        );
    }

    private function limitOperatorUpdatePayload(Request $request, array &$validated): void
    {
        if (! OperatorAccess::isOperator($request->user())) {
            return;
        }

        $validated = array_intersect_key($validated, array_flip([
            'date_reparation',
            'description',
            'id_plombier',
        ]));
    }
}
