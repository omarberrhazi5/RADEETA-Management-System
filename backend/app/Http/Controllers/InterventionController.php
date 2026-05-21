<?php

namespace App\Http\Controllers;

use App\Enums\PanneStatus;
use App\Enums\UserRole;
use App\Http\Resources\InterventionResource;
use App\Models\ActivityLog;
use App\Models\Intervention;
use App\Models\Panne;
use App\Models\Reparation;
use App\Policies\InterventionPolicy;
use App\Services\NotificationService;
use App\Support\OperatorAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class InterventionController extends Controller
{
    public function index(Request $request, InterventionPolicy $policy): AnonymousResourceCollection
    {
        abort_unless($policy->viewAny($request->user()), 403, 'Forbidden');

        $limit = min((int) $request->integer('limit', 10), 500);
        $query = Intervention::with('panne.compteur.client', 'panne.compteur.secteur', 'panne.createdByUser', 'client', 'meter.secteur', 'technician')
            ->latest();

        if (OperatorAccess::isOperator($request->user())) {
            $query->where(function ($query) use ($request): void {
                $query->where('technician_id', $request->user()->id)
                    ->orWhereNull('technician_id');
            });
        }

        if ($request->filled('service_type')) {
            $query->where('service_type', $request->input('service_type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $query->where(function ($searchQuery) use ($search): void {
                $searchQuery
                    ->where('intervention_number', 'like', "%{$search}%")
                    ->orWhere('work_type', 'like', "%{$search}%")
                    ->orWhere('observations', 'like', "%{$search}%")
                    ->orWhereHas('technician', fn ($technicianQuery) => $technicianQuery
                        ->where('nom', 'like', "%{$search}%")
                        ->orWhere('prenom', 'like', "%{$search}%")
                        ->orWhere('identifiant', 'like', "%{$search}%"))
                    ->orWhereHas('panne', fn ($panneQuery) => $panneQuery->where('anomalie', 'like', "%{$search}%"));
            });
        }

        return InterventionResource::collection($query->paginate($limit));
    }

    public function store(Request $request, InterventionPolicy $policy, NotificationService $notifications): JsonResponse
    {
        abort_unless($policy->create($request->user()), 403, 'Forbidden');

        $validated = $this->validated($request);
        $this->prepareTechnician($request, $validated);
        $this->hydrateFromPanne($validated);
        $this->authorizeTechnicianPanne($request, (int) ($validated['panne_id'] ?? 0));

        $intervention = Intervention::create($validated);
        ActivityLog::record('Intervention assignée', 'Interventions', $request, ['intervention_id' => $intervention->id]);
        $notifications->interventionAssigned($intervention);

        return (new InterventionResource($intervention->load('panne.compteur.client', 'panne.compteur.secteur', 'panne.createdByUser', 'client', 'meter.secteur', 'technician')))->response()->setStatusCode(201);
    }

    public function show(Request $request, Intervention $intervention, InterventionPolicy $policy): InterventionResource
    {
        abort_unless($policy->view($request->user(), $intervention), 403, 'Forbidden');

        return new InterventionResource($intervention->load('panne.compteur.client', 'panne.compteur.secteur', 'panne.createdByUser', 'client', 'meter.secteur', 'technician'));
    }

    public function update(Request $request, Intervention $intervention, InterventionPolicy $policy, NotificationService $notifications): JsonResponse
    {
        $this->forbidMonitoringRole($request);
        abort_unless($policy->update($request->user(), $intervention), 403, 'Forbidden');

        $validated = $this->validated($request, false);
        $this->prepareTechnician($request, $validated);
        $this->hydrateFromPanne($validated);
        $this->authorizeTechnicianPanne($request, (int) ($validated['panne_id'] ?? $intervention->panne_id ?? 0));
        $this->limitUpdatePayload($request, $validated);

        $previousStatus = $intervention->status;
        $autoRepair = null;

        DB::transaction(function () use ($request, $intervention, $validated, $previousStatus, &$autoRepair): void {
            $intervention->update($validated);

            if ($this->shouldAutoLogRepair($request, $validated, $previousStatus)) {
                $autoRepair = $this->autoLogRepair($intervention);
            }
        });

        if (array_key_exists('status', $validated) && $previousStatus !== $validated['status']) {
            ActivityLog::record('Status modifié', 'Interventions', $request, [
                'intervention_id' => $intervention->id,
                'previous_status' => $previousStatus,
                'current_status' => $validated['status'],
            ]);
            $notifications->statusChanged($intervention, $previousStatus, $validated['status']);
        } else {
            ActivityLog::record('Intervention modifiée', 'Interventions', $request, ['intervention_id' => $intervention->id]);
        }

        if ($autoRepair) {
            ActivityLog::record('Réparation automatique', 'Reparations', $request, [
                'intervention_id' => $intervention->id,
                'reparation_id' => $autoRepair->id,
                'panne_id' => $autoRepair->id_panne,
            ]);
            $notifications->repairCompleted($autoRepair);
        }

        return (new InterventionResource($intervention->load('panne.compteur.client', 'panne.compteur.secteur', 'panne.createdByUser', 'client', 'meter.secteur', 'technician')))->response();
    }

    public function assignSelf(Request $request, Intervention $intervention, NotificationService $notifications): JsonResponse
    {
        abort_unless(OperatorAccess::isOperator($request->user()), 403, 'Forbidden');

        $previousStatus = $intervention->status;

        $intervention = DB::transaction(function () use ($request, $intervention): Intervention {
            $locked = Intervention::query()
                ->whereKey($intervention->id)
                ->whereNull('technician_id')
                ->lockForUpdate()
                ->first();

            abort_unless($locked, 409, 'Intervention already assigned.');

            $locked->update([
                'technician_id' => $request->user()->id,
                'status' => 'en_cours',
            ]);

            if ($locked->panne_id) {
                Panne::whereKey($locked->panne_id)->update([
                    'assigned_to' => $request->user()->id,
                    'status' => PanneStatus::InProgress->value,
                ]);
            }

            return $locked;
        });

        ActivityLog::record('Intervention prise en charge', 'Interventions', $request, [
            'intervention_id' => $intervention->id,
            'technician_id' => $request->user()->id,
        ]);

        $notifications->interventionAssigned($intervention);
        if ($previousStatus !== 'en_cours') {
            $notifications->statusChanged($intervention, $previousStatus, 'en_cours');
        }

        return (new InterventionResource($intervention->load('panne.compteur.client', 'panne.compteur.secteur', 'panne.createdByUser', 'client', 'meter.secteur', 'technician')))->response();
    }

    public function destroy(Request $request, Intervention $intervention, InterventionPolicy $policy): JsonResponse
    {
        $this->forbidMonitoringRole($request);
        abort_unless($policy->delete($request->user(), $intervention), 403, 'Forbidden');

        $intervention->delete();
        ActivityLog::record('Intervention modifiée', 'Interventions', $request, ['intervention_id' => $intervention->id, 'deleted' => true]);

        return response()->json(null, 204);
    }

    private function validated(Request $request, bool $creating = true): array
    {
        $required = $creating ? 'required' : 'sometimes';
        $requiredDate = $creating ? 'required_without:intervention_at' : 'sometimes';

        $validated = $request->validate([
            'panne_id' => [$required, 'integer', Rule::exists('pannes', 'id')->whereNull('deleted_at')],
            'id_panne' => ['sometimes', 'integer', Rule::exists('pannes', 'id')->whereNull('deleted_at')],
            'client_id' => ['nullable', 'integer', Rule::exists('clients', 'id')->whereNull('deleted_at')],
            'meter_id' => ['nullable', 'integer', Rule::exists('compteurs', 'id')->whereNull('deleted_at')],
            'technician_id' => [$creating ? 'nullable' : 'sometimes', 'nullable', 'integer', Rule::exists('users', 'id')->where('role', UserRole::Technician->value)],
            'service_type' => ['nullable', Rule::in(['water', 'electricity'])],
            'started_at' => [$requiredDate, 'date'],
            'intervention_at' => ['sometimes', 'date'],
            'completed_at' => ['nullable', 'date', 'after_or_equal:started_at'],
            'work_type' => [$required, 'string', 'max:255'],
            'materials_used' => ['nullable'],
            'material_used' => ['nullable'],
            'observations' => ['nullable', 'string', 'max:5000'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'location_note' => ['nullable', 'string', 'max:500'],
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'status' => [$required, Rule::in(['en_attente', 'en_cours', 'terminee', 'annulee', 'echouee'])],
        ]);

        if (! array_key_exists('panne_id', $validated) && array_key_exists('id_panne', $validated)) {
            $validated['panne_id'] = $validated['id_panne'];
        }

        unset($validated['id_panne']);

        if (! array_key_exists('started_at', $validated) && array_key_exists('intervention_at', $validated)) {
            $validated['started_at'] = $validated['intervention_at'];
        }

        unset($validated['intervention_at']);

        if (! array_key_exists('materials_used', $validated) && array_key_exists('material_used', $validated)) {
            $validated['materials_used'] = $validated['material_used'];
        }

        unset($validated['material_used']);

        if (($validated['status'] ?? null) === 'echouee') {
            $validated['status'] = 'annulee';
        }

        if (($validated['status'] ?? null) === 'terminee' && empty($validated['completed_at'])) {
            $validated['completed_at'] = now();
        }

        if (array_key_exists('materials_used', $validated) && is_string($validated['materials_used'])) {
            $validated['materials_used'] = collect(explode("\n", $validated['materials_used']))
                ->flatMap(fn (string $line) => explode(',', $line))
                ->map(fn (string $item) => trim($item))
                ->filter()
                ->values()
                ->all();
        }

        return $validated;
    }

    private function prepareTechnician(Request $request, array &$validated): void
    {
        if (OperatorAccess::isOperator($request->user())) {
            $validated['technician_id'] = $request->user()->id;
        }
    }

    private function authorizeTechnicianPanne(Request $request, int $panneId): void
    {
        abort_if(
            OperatorAccess::isOperator($request->user()) && $panneId > 0 && ! Panne::whereKey($panneId)->where('assigned_to', $request->user()->id)->exists(),
            403,
            'Technicians can only report interventions for assigned claims.'
        );
    }

    private function limitUpdatePayload(Request $request, array &$validated): void
    {
        $role = $request->user()?->role;
        $value = $role instanceof UserRole ? $role->value : $role;

        if ($value === UserRole::Manager->value) {
            $validated = array_intersect_key($validated, array_flip(['status', 'technician_id']));
        }

        if ($value === UserRole::Technician->value) {
            $validated = array_intersect_key($validated, array_flip(['status', 'observations', 'materials_used', 'completed_at', 'latitude', 'longitude', 'location_note']));
        }
    }

    private function forbidMonitoringRole(Request $request): void
    {
        $role = $request->user()?->role;
        $value = $role instanceof UserRole ? $role->value : $role;

        abort_if(
            in_array($value, [UserRole::Responsable->value, UserRole::Manager->value], true),
            response()->json(['message' => 'Action non autorisée'], 403)
        );
    }

    private function hydrateFromPanne(array &$validated): void
    {
        if (empty($validated['panne_id'])) {
            return;
        }

        $panne = Panne::with('compteur.client')->findOrFail((int) $validated['panne_id']);

        $validated['meter_id'] = $validated['meter_id'] ?? $panne->id_compteur;
        $validated['client_id'] = $validated['client_id'] ?? $panne->compteur?->id_client;
        $validated['service_type'] = $validated['service_type'] ?? $panne->compteur?->service_type ?? 'water';
    }

    private function shouldAutoLogRepair(Request $request, array $validated, ?string $previousStatus): bool
    {
        return OperatorAccess::isOperator($request->user())
            && ($validated['status'] ?? null) === 'terminee'
            && $previousStatus !== 'terminee';
    }

    private function autoLogRepair(Intervention $intervention): ?Reparation
    {
        if (! $intervention->panne_id || ! $intervention->technician_id) {
            return null;
        }

        if (Reparation::where('id_panne', $intervention->panne_id)->exists()) {
            Panne::whereKey($intervention->panne_id)->update(['status' => PanneStatus::Resolved->value]);

            return null;
        }

        $repair = Reparation::create([
            'id_panne' => $intervention->panne_id,
            'id_plombier' => $intervention->technician_id,
            'date_reparation' => ($intervention->completed_at ?? now())->toDateString(),
            'description' => $intervention->observations,
            'latitude' => $intervention->latitude,
            'longitude' => $intervention->longitude,
            'location_note' => $intervention->location_note,
        ]);

        $repair->panne()->update(['status' => PanneStatus::Resolved->value]);

        return $repair;
    }
}
