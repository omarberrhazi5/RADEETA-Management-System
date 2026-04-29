<?php

namespace App\Http\Controllers;

use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NotificationController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return NotificationResource::collection(
            Notification::where('is_read', false)
                ->latest('created_at')
                ->limit(5)
                ->get()
        );
    }

    public function markAsRead(): JsonResponse
    {
        Notification::where('is_read', false)->update(['is_read' => true]);

        return response()->json([
            'message' => 'Notifications marked as read.',
        ]);
    }
}
