<?php

namespace App\Http\Controllers;

use App\Enums\PanneStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Compteur;
use App\Models\Panne;
use App\Models\Reparation;
use App\Models\Secteur;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $metersPerSector = Secteur::withCount('compteurs')
            ->withCount([
                'pannes as pannes_ouvertes_count' => fn ($query) => $query->where('status', PanneStatus::Open->value),
            ])
            ->orderBy('nom_secteur')
            ->get()
            ->map(fn (Secteur $secteur): array => [
                'id' => $secteur->id,
                'nom_secteur' => $secteur->nom_secteur,
                'emplacement' => $secteur->emplacement,
                'search_name' => Str::of($secteur->nom_secteur.' '.$secteur->emplacement)->ascii()->lower()->toString(),
                'latitude' => $secteur->latitude !== null ? (float) $secteur->latitude : null,
                'longitude' => $secteur->longitude !== null ? (float) $secteur->longitude : null,
                'meters_count' => $secteur->compteurs_count,
                'pannes_ouvertes_count' => $secteur->pannes_ouvertes_count,
            ]);

        $topTechnicians = User::query()
            ->where('role', UserRole::Technician->value)
            ->withCount([
                'reparations as pannes_resolues_count' => fn ($query) => $query
                    ->whereMonth('date_reparation', now()->month)
                    ->whereYear('date_reparation', now()->year)
                    ->whereHas('panne', fn ($panneQuery) => $panneQuery->where('status', PanneStatus::Resolved->value)),
            ])
            ->orderByDesc('pannes_resolues_count')
            ->orderBy('name')
            ->limit(5)
            ->get()
            ->map(fn (User $technician): array => [
                'id' => $technician->id,
                'name' => $technician->name ?: trim($technician->prenom.' '.$technician->nom),
                'pannes_resolues_count' => (int) $technician->pannes_resolues_count,
            ]);

        return response()->json([
            'total_clients' => Client::count(),
            'total_compteurs' => Compteur::count(),
            'total_secteurs' => Secteur::count(),
            'active_pannes' => Panne::where('status', PanneStatus::Open->value)->count(),
            'pannes_ouvertes' => Panne::where('status', PanneStatus::Open->value)->count(),
            'reparations_mois' => Reparation::whereMonth('date_reparation', now()->month)
                ->whereYear('date_reparation', now()->year)
                ->count(),
            'meters_per_sector' => $metersPerSector,
            'secteurs_gis' => $metersPerSector,
            'top_technicians' => $topTechnicians,
        ]);
    }
}
