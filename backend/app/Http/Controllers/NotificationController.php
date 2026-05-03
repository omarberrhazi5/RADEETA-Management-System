<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NotificationController extends Controller
{
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

    private function visibleNotifications(Request $request)
    {
        $user = $request->user();
        $role = $user?->role instanceof UserRole ? $user->role->value : $user?->role;

        if (in_array($role, [UserRole::SuperAdmin->value, UserRole::Admin->value], true)) {
            return DatabaseNotification::query();
        }

        return $user->notifications()->getQuery();
    }
}
