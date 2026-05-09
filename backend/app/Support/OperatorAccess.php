<?php

namespace App\Support;

use App\Enums\UserRole;
use App\Models\Compteur;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class OperatorAccess
{
    public static function isOperator(?User $user): bool
    {
        $role = $user?->role;
        $value = $role instanceof UserRole ? $role->value : $role;

        return $value === UserRole::Technician->value;
    }

    public static function scopePannes(Builder $query, User $user): Builder
    {
        return $query->where('assigned_to', $user->id);
    }

    public static function scopeReparations(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $query) use ($user): void {
            $query->where('id_plombier', $user->id)
                ->orWhereHas('panne', fn (Builder $panne) => $panne->where('assigned_to', $user->id));
        });
    }

    public static function scopeReleves(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $query) use ($user): void {
            $query->where('created_by', $user->id)
                ->orWhereHas('compteur.pannes', fn (Builder $panne) => $panne->where('assigned_to', $user->id));
        });
    }

    public static function scopeCompteurs(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $query) use ($user): void {
            $query->whereHas('pannes', fn (Builder $panne) => $panne->where('assigned_to', $user->id))
                ->orWhereHas('releves', fn (Builder $releve) => $releve->where('created_by', $user->id))
                ->orWhereIn('id_secteur', self::assignedSectorIds($user));
        });
    }

    public static function scopeClients(Builder $query, User $user): Builder
    {
        return $query->whereHas('compteurs', function (Builder $compteur) use ($user): void {
            self::scopeCompteurs($compteur, $user);
        });
    }

    public static function canAccessCompteur(Compteur $compteur, User $user): bool
    {
        $query = Compteur::whereKey($compteur->id);
        self::scopeCompteurs($query, $user);

        return $query->exists();
    }

    private static function assignedSectorIds(User $user): array
    {
        return $user->assignedPannes()
            ->join('compteurs', 'compteurs.id', '=', 'pannes.id_compteur')
            ->whereNotNull('compteurs.id_secteur')
            ->distinct()
            ->pluck('compteurs.id_secteur')
            ->all();
    }
}
