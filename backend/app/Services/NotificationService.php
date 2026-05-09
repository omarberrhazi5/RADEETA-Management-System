<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Panne;
use App\Models\Reparation;
use App\Models\User;
use App\Notifications\UtilityNotification;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Notification;

class NotificationService
{
    public function panneAssigned(Panne $panne): void
    {
        $panne->loadMissing('compteur.secteur', 'assignedOperator');

        $this->notifyUsers(
            $this->adminsAndManagers()->merge($panne->assignedOperator ? collect([$panne->assignedOperator]) : collect()),
            'Panne assigned',
            sprintf('Panne #%d was assigned to %s.', $panne->id, $panne->assignedOperator?->name ?? $panne->assignedOperator?->nom ?? 'a technician'),
            'panne_assigned',
            [
                'panne_id' => $panne->id,
                'technician_id' => $panne->assigned_to,
                'secteur_id' => $panne->compteur?->id_secteur,
            ],
        );
    }

    public function repairCompleted(Reparation $reparation): void
    {
        $reparation->loadMissing('panne.compteur.secteur', 'plombier');

        $this->notifyUsers(
            $this->adminsAndManagers()->merge($reparation->plombier ? collect([$reparation->plombier]) : collect()),
            'Repair completed',
            sprintf('Repair #%d completed for panne #%d.', $reparation->id, $reparation->id_panne),
            'repair_completed',
            [
                'reparation_id' => $reparation->id,
                'panne_id' => $reparation->id_panne,
                'technician_id' => $reparation->id_plombier,
                'secteur_id' => $reparation->panne?->compteur?->id_secteur,
            ],
        );
    }

    public function userCreated(User $user): void
    {
        $this->notifyUsers(
            $this->admins(),
            'New user created',
            sprintf('User %s was created with role %s.', $user->name ?: trim($user->prenom.' '.$user->nom), $user->role instanceof UserRole ? $user->role->value : $user->role),
            'user_created',
            ['user_id' => $user->id],
        );
    }

    private function notifyUsers(iterable $users, string $title, string $message, string $type, array $meta = []): void
    {
        $uniqueUsers = collect($users)->filter()->unique('id')->values();

        if ($uniqueUsers->isEmpty()) {
            return;
        }

        Notification::send($uniqueUsers, new UtilityNotification($title, $message, $type, $meta));
    }

    private function admins(): Collection
    {
        return User::whereIn('role', [UserRole::Directeur->value, UserRole::Responsable->value])->get();
    }

    private function adminsAndManagers(): Collection
    {
        return User::whereIn('role', [UserRole::Directeur->value, UserRole::Responsable->value, UserRole::Manager->value])->get();
    }

}
