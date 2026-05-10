<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Intervention;
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

    public function anomalyCreated(Panne $panne): void
    {
        $panne->loadMissing('compteur.secteur');

        $this->notifyUsers(
            $this->adminsAndManagers(),
            'New anomaly created',
            sprintf('New anomaly #%d was reported for meter %s.', $panne->id, $panne->compteur?->cadran ?? '#'.$panne->id_compteur),
            'anomaly_created',
            [
                'panne_id' => $panne->id,
                'meter_id' => $panne->id_compteur,
                'meter_cadran' => $panne->compteur?->cadran,
                'secteur_id' => $panne->compteur?->id_secteur,
            ],
        );
    }

    public function interventionAssigned(Intervention $intervention): void
    {
        $intervention->loadMissing('panne.compteur.secteur', 'technician');

        $this->notifyUsers(
            $this->adminsAndManagers()->merge($intervention->technician ? collect([$intervention->technician]) : collect()),
            'Intervention assigned',
            sprintf('Intervention #%d was assigned to %s.', $intervention->id, $intervention->technician?->name ?? $intervention->technician?->nom ?? 'a technician'),
            'intervention_assigned',
            [
                'intervention_id' => $intervention->id,
                'panne_id' => $intervention->panne_id,
                'technician_id' => $intervention->technician_id,
                'secteur_id' => $intervention->panne?->compteur?->id_secteur,
            ],
        );
    }

    public function statusChanged(Intervention $intervention, string $previousStatus, string $currentStatus): void
    {
        $intervention->loadMissing('panne.compteur.secteur', 'technician');

        $this->notifyUsers(
            $this->adminsAndManagers()->merge($intervention->technician ? collect([$intervention->technician]) : collect()),
            'Status changed',
            sprintf('Intervention #%d changed from %s to %s.', $intervention->id, $previousStatus, $currentStatus),
            'status_changed',
            [
                'intervention_id' => $intervention->id,
                'previous_status' => $previousStatus,
                'current_status' => $currentStatus,
                'technician_id' => $intervention->technician_id,
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
            $this->directeurs(),
            'New user created',
            sprintf('User %s was created with role %s.', $user->name ?: trim($user->prenom.' '.$user->nom), $user->role instanceof UserRole ? $user->role->value : $user->role),
            'user_created',
            ['user_id' => $user->id],
        );
    }

    public function systemAlert(string $message, array $meta = []): void
    {
        $this->notifyUsers($this->directeurs(), 'System alert', $message, 'system_alert', $meta);
    }

    public function highPriorityReport(string $message, array $meta = []): void
    {
        $this->notifyUsers($this->directeurs(), 'High-priority report', $message, 'high_priority_report', $meta);
    }

    public function validationRequest(string $message, array $meta = []): void
    {
        $this->notifyUsers($this->supervisors(), 'Validation request', $message, 'validation_request', $meta);
    }

    public function dashboardUpdated(string $message = 'Dashboard data was refreshed.', array $meta = []): void
    {
        $this->notifyUsers($this->viewers(), 'Dashboard updated', $message, 'dashboard_updated', $meta);
    }

    public function monthlyReportAvailable(string $message = 'Monthly report is available.', array $meta = []): void
    {
        $this->notifyUsers($this->viewers(), 'Monthly report available', $message, 'monthly_report_available', $meta);
    }

    private function notifyUsers(iterable $users, string $title, string $message, string $type, array $meta = []): void
    {
        $uniqueUsers = collect($users)->filter()->unique('id')->values();

        if ($uniqueUsers->isEmpty()) {
            return;
        }

        Notification::send($uniqueUsers, new UtilityNotification($title, $message, $type, $meta));
    }

    private function directeurs(): Collection
    {
        return User::where('role', UserRole::Directeur->value)->get();
    }

    private function adminsAndManagers(): Collection
    {
        return User::whereIn('role', [UserRole::Directeur->value, UserRole::Responsable->value, UserRole::Manager->value])->get();
    }

    private function supervisors(): Collection
    {
        return User::whereIn('role', [UserRole::Directeur->value, UserRole::Responsable->value, UserRole::Manager->value])->get();
    }

    private function viewers(): Collection
    {
        return User::whereIn('role', [UserRole::Directeur->value, UserRole::Viewer->value])->get();
    }

}
