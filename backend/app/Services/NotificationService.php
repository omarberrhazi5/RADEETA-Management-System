<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Facture;
use App\Models\Paiement;
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
            sprintf('Panne #%d was assigned to %s.', $panne->id, $panne->assignedOperator?->name ?? $panne->assignedOperator?->nom ?? 'an operator'),
            'panne_assigned',
            [
                'panne_id' => $panne->id,
                'operator_id' => $panne->assigned_to,
                'secteur_id' => $panne->compteur?->id_secteur,
            ],
        );
    }

    public function factureGenerated(Facture $facture): void
    {
        $facture->loadMissing('client', 'compteur.secteur');

        $this->notifyUsers(
            $this->adminsManagersViewers(),
            'Invoice generated',
            sprintf('Invoice %s was generated for %s.', $facture->reference, trim(($facture->client?->nom ?? '').' '.($facture->client?->prenom ?? ''))),
            'facture_generated',
            [
                'facture_id' => $facture->id,
                'client_id' => $facture->client_id,
                'compteur_id' => $facture->compteur_id,
                'secteur_id' => $facture->compteur?->id_secteur,
                'total_ttc' => $facture->total_ttc,
            ],
        );
    }

    public function paiementReceived(Paiement $paiement): void
    {
        $paiement->loadMissing('facture.client', 'facture.compteur.secteur');

        $this->notifyUsers(
            $this->adminsManagersViewers(),
            'Payment received',
            sprintf('Payment of %s MAD received for invoice %s.', $paiement->montant, $paiement->facture?->reference),
            'paiement_received',
            [
                'paiement_id' => $paiement->id,
                'facture_id' => $paiement->facture_id,
                'client_id' => $paiement->facture?->client_id,
                'secteur_id' => $paiement->facture?->compteur?->id_secteur,
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
                'operator_id' => $reparation->id_plombier,
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
        return User::whereIn('role', [UserRole::SuperAdmin->value, UserRole::Admin->value])->get();
    }

    private function adminsAndManagers(): Collection
    {
        return User::whereIn('role', [UserRole::SuperAdmin->value, UserRole::Admin->value, UserRole::Manager->value])->get();
    }

    private function adminsManagersViewers(): Collection
    {
        return User::whereIn('role', [UserRole::SuperAdmin->value, UserRole::Admin->value, UserRole::Manager->value, UserRole::Viewer->value])->get();
    }
}
