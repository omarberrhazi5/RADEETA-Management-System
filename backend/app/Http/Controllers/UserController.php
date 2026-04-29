<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(User::latest()->paginate(10));
    }

    public function technicians(): AnonymousResourceCollection
    {
        $limit = min((int) request('limit', 10), 500);

        return UserResource::collection(
            User::where('role', UserRole::Technician->value)->latest()->paginate($limit)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['nullable', 'string', 'max:255'],
            'identifiant' => ['required', 'string', 'max:255', Rule::unique('users', 'identifiant')],
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        $user = User::create($validated);

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['sometimes', 'required', 'string', 'max:255'],
            'prenom' => ['nullable', 'string', 'max:255'],
            'identifiant' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users', 'identifiant')->ignore($user)],
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
            'role' => ['sometimes', 'required', Rule::enum(UserRole::class)],
        ]);

        $user->update($validated);

        return (new UserResource($user))->response();
    }
}
