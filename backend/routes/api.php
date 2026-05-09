<?php

use App\Enums\UserRole;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CompteurController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InterventionController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PanneController;
use App\Http\Controllers\ReparationController;
use App\Http\Controllers\ReleveController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SecteurController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::delete('auth/tokens', [AuthController::class, 'clearTokens'])->middleware('role:'.UserRole::Directeur->value);

    $adminRoles = implode(',', [UserRole::Responsable->value, UserRole::Developer->value]);
    $managerRoles = implode(',', [UserRole::Responsable->value, UserRole::Manager->value, UserRole::Developer->value]);
    $technicianRoles = implode(',', [UserRole::Responsable->value, UserRole::Manager->value, UserRole::Technician->value, UserRole::Developer->value]);
    $viewerRoles = implode(',', [UserRole::Responsable->value, UserRole::Manager->value, UserRole::Technician->value, UserRole::Viewer->value, UserRole::Developer->value]);
    $directeurRole = UserRole::Directeur->value;

    Route::get('dashboard/summary', [DashboardController::class, 'summary'])->middleware("role:{$managerRoles}");
    Route::get('dashboard/stats', [DashboardController::class, 'summary'])->middleware("role:{$managerRoles}");
    Route::get('settings', [SettingsController::class, 'show'])->middleware("role:{$directeurRole}");
    Route::put('settings', [SettingsController::class, 'update'])->middleware("role:{$directeurRole}");
    Route::get('logs', [ActivityLogController::class, 'index'])->middleware("role:{$directeurRole}");

    Route::get('notifications', [NotificationController::class, 'index'])->middleware("role:{$viewerRoles}");
    Route::post('notifications/read', [NotificationController::class, 'markAsRead'])->middleware("role:{$viewerRoles}");
    Route::put('notifications/mark-as-read', [NotificationController::class, 'markAsRead'])->middleware("role:{$viewerRoles}");

    Route::apiResource('clients', ClientController::class)->only(['index', 'show'])->middleware("role:{$viewerRoles}");
    Route::apiResource('compteurs', CompteurController::class)->only(['index', 'show'])->middleware("role:{$viewerRoles}");
    Route::apiResource('secteurs', SecteurController::class)->only(['index', 'show'])->middleware("role:{$viewerRoles}");
    Route::apiResource('pannes', PanneController::class)->only(['index', 'show'])->middleware("role:{$viewerRoles}");
    Route::apiResource('reparations', ReparationController::class)->only(['index', 'show'])->middleware("role:{$viewerRoles}");
    Route::apiResource('interventions', InterventionController::class)->only(['index', 'show'])->middleware("role:{$viewerRoles}");
    Route::apiResource('releves', ReleveController::class)->only(['index', 'show'])->parameters(['releves' => 'releve'])->middleware("role:{$viewerRoles}");

    Route::get('reports/pannes/pdf', [ReportController::class, 'pannesPdf'])->middleware("role:{$managerRoles}");
    Route::get('reports/clients/excel', [ReportController::class, 'clientsExcel'])->middleware("role:{$managerRoles}");

    Route::apiResource('clients', ClientController::class)->only(['store', 'update'])->middleware("role:{$adminRoles}");
    Route::apiResource('compteurs', CompteurController::class)->only(['store', 'update'])->middleware("role:{$managerRoles}");
    Route::apiResource('secteurs', SecteurController::class)->only(['store', 'update'])->middleware("role:{$adminRoles}");
    Route::apiResource('pannes', PanneController::class)->only(['store'])->middleware("role:{$managerRoles}");
    Route::apiResource('pannes', PanneController::class)->only(['update'])->middleware("role:{$technicianRoles}");
    Route::apiResource('reparations', ReparationController::class)->only(['store', 'update'])->middleware("role:{$technicianRoles}");
    Route::apiResource('interventions', InterventionController::class)->only(['store', 'update'])->middleware("role:{$technicianRoles}");
    Route::apiResource('releves', ReleveController::class)->only(['store', 'update'])->parameters(['releves' => 'releve'])->middleware("role:{$technicianRoles}");

    Route::apiResource('clients', ClientController::class)->only(['destroy'])->middleware("role:{$adminRoles}");
    Route::apiResource('compteurs', CompteurController::class)->only(['destroy'])->middleware("role:{$adminRoles}");
    Route::apiResource('secteurs', SecteurController::class)->only(['destroy'])->middleware("role:{$adminRoles}");
    Route::apiResource('pannes', PanneController::class)->only(['destroy'])->middleware("role:{$adminRoles}");
    Route::apiResource('reparations', ReparationController::class)->only(['destroy'])->middleware("role:{$adminRoles}");

    Route::get('users/technicians', [UserController::class, 'technicians'])->middleware("role:{$managerRoles}");
    Route::get('users/operators', [UserController::class, 'technicians'])->middleware("role:{$managerRoles}");
    Route::get('plombiers', [UserController::class, 'technicians'])->middleware("role:{$managerRoles}");

    Route::apiResource('users', UserController::class)->only(['index', 'store', 'update'])->middleware("role:{$directeurRole}");
});
