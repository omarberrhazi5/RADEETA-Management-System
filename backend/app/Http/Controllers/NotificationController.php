<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NotificationController extends Controller
{
    private const DIRECTEUR_TYPES = [
        'user_created',
        'sensitive_deletion',
        'critical_intervention',
        'critical_anomaly',
        'rbac_changed',
        'settings_changed',
        'system_alert',
        'high_priority_report',
        'anomaly_created',
        'panne_assigned',
        'intervention_created',
        'intervention_assigned',
        'technician_assigned',
        'repair_completed',
        'client_created',
        'sector_updated',
        'validation_request',
        'delayed_intervention',
        'unassigned_technicians',
        'status_changed',
        'priority_changed',
        'technical_note',
        'monthly_report_available',
        'dashboard_updated',
        'statistics_refreshed',
    ];

    private const RESPONSABLE_TYPES = [
        'anomaly_created',
        'panne_assigned',
        'intervention_created',
        'intervention_assigned',
        'technician_assigned',
        'repair_completed',
        'client_created',
        'sector_updated',
        'validation_request',
        'status_changed',
        'priority_changed',
        'technical_note',
    ];

    private const MANAGER_TYPES = [
        'anomaly_created',
        'pending_anomalies',
        'delayed_intervention',
        'unassigned_technicians',
        'status_changed',
        'validation_request',
        'progress_alert',
        'high_priority_anomaly',
        'intervention_created',
        'intervention_assigned',
        'repair_completed',
    ];

    private const TECHNICIAN_TYPES = [
        'panne_assigned',
        'intervention_assigned',
        'repair_assigned',
        'repair_completed',
        'priority_changed',
        'status_changed',
        'technical_note',
    ];

    private const VIEWER_TYPES = [
        'monthly_report_available',
        'dashboard_updated',
        'statistics_refreshed',
    ];

    private const TECHNICIAN_ASSIGNMENT_TYPES = [
        'panne_assigned',
        'intervention_assigned',
        'repair_assigned',
        'repair_completed',
        'priority_changed',
        'status_changed',
        'technical_note',
    ];

    public function index(Request $request): AnonymousResourceCollection
    {
        $limit = min((int) $request->integer('limit', 15), 50);

        $query = $this->visibleNotifications($request)
            ->latest('created_at')
            ->limit($limit);

        return NotificationResource::collection($query->get())
            ->additional([
                'meta' => [
                    'unread_count' => (clone $this->visibleNotifications($request))->whereNull('read_at')->count(),
                    'realtime_ready' => true,
                ],
            ]);
    }

    public function markAsRead(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);

        $query = $this->visibleNotifications($request)->whereNull('read_at');

        if (is_array($ids) && $ids !== []) {
            $query->whereIn('id', $ids);
        }

        $query->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Notifications marked as read.',
            'unread_count' => (clone $this->visibleNotifications($request))->whereNull('read_at')->count(),
        ]);
    }

    public function markOneAsRead(Request $request, string $id): JsonResponse
    {
        $notification = (clone $this->visibleNotifications($request))->whereKey($id)->firstOrFail();
        $notification->update(['read_at' => $notification->read_at ?? now()]);

        return response()->json([
            'message' => 'Notification marked as read.',
            'unread_count' => (clone $this->visibleNotifications($request))->whereNull('read_at')->count(),
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        (clone $this->visibleNotifications($request))
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Notifications marked as read.',
            'unread_count' => 0,
        ]);
    }

    private function visibleNotifications(Request $request)
    {
        $user = $request->user();
        $role = $user?->role instanceof UserRole ? $user->role->value : $user?->role;
        $query = $user->notifications()->getQuery();
        $allowedTypes = $this->allowedTypesForRole($role);

        if ($allowedTypes !== []) {
            $query->whereIn('data->type', $allowedTypes);
        } else {
            $query->whereRaw('1 = 0');
        }

        if ($role === UserRole::Technician->value) {
            $query->where(function ($scope) use ($user): void {
                $scope
                    ->whereNotIn('data->type', self::TECHNICIAN_ASSIGNMENT_TYPES)
                    ->orWhere('data->meta->technician_id', (string) $user->id)
                    ->orWhere('data->meta->technician_id', $user->id);
            });
        }

        return $query;
    }

    private function allowedTypesForRole(?string $role): array
    {
        return match ($role) {
            UserRole::Directeur->value => self::DIRECTEUR_TYPES,
            UserRole::Responsable->value => self::RESPONSABLE_TYPES,
            UserRole::Manager->value => self::MANAGER_TYPES,
            UserRole::Technician->value => self::TECHNICIAN_TYPES,
            UserRole::Viewer->value => self::VIEWER_TYPES,
            UserRole::Developer->value => app()->isProduction() ? [] : self::DIRECTEUR_TYPES,
            default => [],
        };
    }
}
