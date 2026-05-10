<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Intervention;
use App\Models\User;

class InterventionPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($this->role($user), [
            UserRole::Directeur->value,
            UserRole::Responsable->value,
            UserRole::Manager->value,
            UserRole::Technician->value,
            UserRole::Viewer->value,
            UserRole::Developer->value,
        ], true);
    }

    public function view(User $user, Intervention $intervention): bool
    {
        return $this->viewAny($user)
            && ($this->role($user) !== UserRole::Technician->value || (int) $intervention->technician_id === (int) $user->id);
    }

    public function create(User $user): bool
    {
        return in_array($this->role($user), [
            UserRole::Directeur->value,
            UserRole::Responsable->value,
            UserRole::Developer->value,
        ], true);
    }

    public function update(User $user, Intervention $intervention): bool
    {
        if ($this->role($user) === UserRole::Technician->value) {
            return (int) $intervention->technician_id === (int) $user->id;
        }

        return in_array($this->role($user), [
            UserRole::Directeur->value,
            UserRole::Responsable->value,
            UserRole::Manager->value,
            UserRole::Developer->value,
        ], true);
    }

    public function delete(User $user, Intervention $intervention): bool
    {
        return in_array($this->role($user), [
            UserRole::Directeur->value,
            UserRole::Responsable->value,
            UserRole::Developer->value,
        ], true);
    }

    private function role(User $user): string
    {
        return $user->role instanceof UserRole ? $user->role->value : (string) $user->role;
    }
}
