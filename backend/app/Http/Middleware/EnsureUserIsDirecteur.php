<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsDirecteur
{
    public function handle(Request $request, Closure $next): Response
    {
        $role = strtolower(trim((string) ($request->user()?->role instanceof UserRole
            ? $request->user()->role->value
            : $request->user()?->role)));

        if ($role !== UserRole::Directeur->value) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
