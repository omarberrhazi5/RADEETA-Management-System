<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identifiant' => ['required', 'string'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::query()
            ->where('identifiant', $validated['identifiant'])
            ->orWhere('email', $validated['identifiant'])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'identifiant' => ['The provided credentials are incorrect.'],
            ]);
        }

        $role = $user->role instanceof UserRole ? $user->role->value : $user->role;

        if ($role === UserRole::Developer->value && app()->isProduction()) {
            return response()->json(['message' => 'Developer access is disabled in production.'], 403);
        }

        $token = $user->createToken($validated['device_name'] ?? 'api-token')->plainTextToken;
        ActivityLog::record('Connexion utilisateur', 'Authentification', $request, ['actor_user_id' => $user->id]);

        return response()->json([
            'token' => $token,
            'role' => $role,
            'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->tokens()->delete();

        return response()->json(null, 204);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user?->role instanceof UserRole ? $user->role->value : $user?->role;

        return response()->json([
            'role' => $role,
            'user' => new UserResource($user),
        ]);
    }

    public function clearTokens(): JsonResponse
    {
        $deleted = PersonalAccessToken::query()->delete();

        return response()->json([
            'message' => 'All active API tokens were cleared.',
            'deleted' => $deleted,
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (! $user || ! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $validated['password']]);
        ActivityLog::record('Mot de passe modifie', 'Profil', $request, ['actor_user_id' => $user->id]);

        return response()->json(['message' => 'Mot de passe mis à jour avec succès !']);
    }
}
