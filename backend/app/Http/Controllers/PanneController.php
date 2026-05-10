<?php

namespace App\Http\Controllers;

use App\Enums\PanneAnomalie;
use App\Enums\PanneStatus;
use App\Enums\UserRole;
use App\Http\Resources\PanneResource;
use App\Models\Panne;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class PanneController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $limit = min((int) request('limit', 10), 500);

        $query = Panne::with('compteur.client', 'compteur.secteur', 'reparations.plombier', 'interventions.technician', 'assignedOperator');

        if ($this->isOperator($request)) {
            $query->where('assigned_to', $request->user()->id);
        }

        if (request('sort') === 'recent') {
            $query->latest('date_panne');
        }

        return PanneResource::collection($query->paginate($limit));
    }

    public function store(Request $request, NotificationService $notifications): JsonResponse
    {
        $this->normalizeFrontendPayload($request);

        $validated = $request->validate([
            'id_compteur' => ['required', Rule::exists('compteurs', 'id')->whereNull('deleted_at')],
            'date_panne' => ['required', 'date'],
            'anomalie' => ['required', Rule::enum(PanneAnomalie::class)],
            'status' => ['sometimes', Rule::enum(PanneStatus::class)],
            'assigned_to' => ['nullable', Rule::exists('users', 'id')->where('role', UserRole::Technician->value)],
        ]);

        if ($this->isOperator($request)) {
            $validated['assigned_to'] = $request->user()->id;
        }

        $panne = Panne::create($validated);
        $panne->load('compteur.client', 'compteur.secteur', 'assignedOperator');

        if ($panne->assigned_to) {
            $notifications->panneAssigned($panne);
        }

        return (new PanneResource($panne->load('compteur.client', 'compteur.secteur', 'reparations.plombier', 'interventions.technician', 'assignedOperator')))->response()->setStatusCode(201);
    }

    public function show(Request $request, Panne $panne): PanneResource
    {
        $this->authorizeOperatorPanneAccess($request, $panne);

        return new PanneResource($panne->load('compteur.client', 'compteur.secteur', 'reparations.plombier', 'interventions.technician', 'assignedOperator'));
    }

    public function update(Request $request, Panne $panne, NotificationService $notifications): JsonResponse
    {
        $this->normalizeFrontendPayload($request);

        $validated = $request->validate([
            'id_compteur' => ['sometimes', 'required', Rule::exists('compteurs', 'id')->whereNull('deleted_at')],
            'date_panne' => ['sometimes', 'required', 'date'],
            'anomalie' => ['sometimes', 'required', Rule::enum(PanneAnomalie::class)],
            'status' => ['sometimes', Rule::enum(PanneStatus::class)],
            'assigned_to' => ['sometimes', 'nullable', Rule::exists('users', 'id')->where('role', UserRole::Technician->value)],
        ]);

        $this->authorizeOperatorPanneAccess($request, $panne);

        if ($this->isOperator($request)) {
            $validated = array_intersect_key($validated, array_flip(['status']));
        } elseif ($this->isManager($request)) {
            $validated = array_intersect_key($validated, array_flip(['status', 'assigned_to']));
        }

        $oldAssignedTo = $panne->assigned_to;
        $panne->update($validated);

        if (array_key_exists('assigned_to', $validated) && $validated['assigned_to'] && (int) $validated['assigned_to'] !== (int) $oldAssignedTo) {
            $notifications->panneAssigned($panne->refresh());
        }

        return (new PanneResource($panne->load('compteur.client', 'compteur.secteur', 'reparations.plombier', 'interventions.technician', 'assignedOperator')))->response();
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

    private function isOperator(Request $request): bool
    {
        $role = $request->user()?->role;
        $value = $role instanceof UserRole ? $role->value : $role;

        return $value === UserRole::Technician->value;
    }

    private function isManager(Request $request): bool
    {
        $role = $request->user()?->role;
        $value = $role instanceof UserRole ? $role->value : $role;

        return $value === UserRole::Manager->value;
    }

    private function authorizeOperatorPanneAccess(Request $request, Panne $panne): void
    {
        abort_if(
            $this->isOperator($request) && (int) $panne->assigned_to !== (int) $request->user()->id,
            403,
            'Forbidden'
        );
    }

    private function normalizeAnomalie(?string $anomalie): ?string
    {
        return match ($anomalie) {
            'Fuite côté abonné', 'Fuite après compteur' => PanneAnomalie::FuiteApresCompteur->value,
            'Fuite côté SRM-FM', 'Fuite côté RADEETA', 'Fuite compteur' => PanneAnomalie::FuiteAvantCompteur->value,
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
