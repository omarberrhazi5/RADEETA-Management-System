<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->assertDirecteur($request);

        $limit = min((int) $request->integer('limit', 10), 500);
        $query = User::query()->latest();

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $query->where(function ($searchQuery) use ($search): void {
                $searchQuery
                    ->where('identifiant', 'like', "%{$search}%")
                    ->orWhere('nom', 'like', "%{$search}%")
                    ->orWhere('prenom', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return UserResource::collection($query->paginate($limit));
    }

    public function technicians(): AnonymousResourceCollection
    {
        $limit = min((int) request('limit', 10), 500);

        return UserResource::collection(
            User::where('role', UserRole::Technician->value)->latest()->paginate($limit)
        );
    }

    public function store(Request $request, NotificationService $notifications): JsonResponse
    {
        $this->assertDirecteur($request);

        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['nullable', 'string', 'max:255'],
            'identifiant' => ['required', 'string', 'max:255', Rule::unique('users', 'identifiant')],
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
            'agence' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in($this->assignableRoles())],
        ]);

        $this->preventProductionDeveloper($validated['role']);

        $user = User::create($validated);
        $notifications->userCreated($user);
        ActivityLog::record('Nouvel utilisateur créé', 'Administration', $request, ['user_id' => $user->id]);

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->assertDirecteur($request);

        $validated = $request->validate([
            'nom' => ['sometimes', 'required', 'string', 'max:255'],
            'prenom' => ['nullable', 'string', 'max:255'],
            'identifiant' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users', 'identifiant')->ignore($user)],
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'agence' => ['sometimes', 'required', 'string', 'max:255'],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
            'role' => ['sometimes', 'required', Rule::in($this->assignableRoles())],
        ]);

        if (array_key_exists('role', $validated)) {
            $this->preventProductionDeveloper($validated['role']);
        }

        $beforeRole = $user->role instanceof UserRole ? $user->role->value : $user->role;
        $user->update($validated);
        ActivityLog::record('Utilisateur modifié', 'Administration', $request, [
            'user_id' => $user->id,
            'previous_role' => $beforeRole,
            'current_role' => $user->role instanceof UserRole ? $user->role->value : $user->role,
        ]);

        return (new UserResource($user))->response();
    }

    private function preventProductionDeveloper(UserRole|string $role): void
    {
        $value = $role instanceof UserRole ? $role->value : $role;

        abort_if(
            app()->isProduction() && $value === UserRole::Developer->value,
            422,
            'Developer role cannot be assigned in production.'
        );
    }

    private function assignableRoles(): array
    {
        return [
            UserRole::Directeur->value,
            UserRole::Responsable->value,
            UserRole::Manager->value,
            UserRole::Technician->value,
            UserRole::Viewer->value,
        ];
    }

    private function assertDirecteur(Request $request): void
    {
        $role = $request->user()?->role instanceof UserRole ? $request->user()->role->value : $request->user()?->role;

        abort_if($role !== UserRole::Directeur->value, 403);
    }
}
