<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        $role = strtolower(trim((string) ($user?->role instanceof UserRole ? $user->role->value : $user?->role)));

        if ($role === UserRole::Developer->value && app()->isProduction()) {
            return response()->json(['message' => 'Developer access is disabled in production.'], 403);
        }

        if ($role === UserRole::Directeur->value) {
            return $next($request);
        }

        if (! $role || ! in_array($role, $roles, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
