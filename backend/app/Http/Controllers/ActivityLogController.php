<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ActivityLogController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $role = $request->user()?->role instanceof UserRole ? $request->user()->role->value : $request->user()?->role;
        abort_if($role !== UserRole::Directeur->value, 403);

        $limit = min((int) $request->integer('limit', 25), 500);
        $query = ActivityLog::with('user')->latest();

        if ($request->filled('module')) {
            $query->where('module', $request->input('module'));
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', '%'.$request->input('action').'%');
        }

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $query->where(function ($searchQuery) use ($search): void {
                $searchQuery
                    ->where('action', 'like', "%{$search}%")
                    ->orWhere('module', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($userQuery) => $userQuery
                        ->where('nom', 'like', "%{$search}%")
                        ->orWhere('prenom', 'like', "%{$search}%")
                        ->orWhere('identifiant', 'like', "%{$search}%"));
            });
        }

        return ActivityLogResource::collection($query->paginate($limit));
    }
}
