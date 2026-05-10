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

    $operationalWriteRoles = implode(',', [UserRole::Directeur->value, UserRole::Responsable->value, UserRole::Developer->value]);
    $supervisionRoles = implode(',', [UserRole::Directeur->value, UserRole::Responsable->value, UserRole::Manager->value, UserRole::Developer->value]);
    $reportRoles = implode(',', [UserRole::Directeur->value, UserRole::Responsable->value, UserRole::Manager->value, UserRole::Developer->value]);
    $repairReadRoles = implode(',', [UserRole::Directeur->value, UserRole::Responsable->value, UserRole::Manager->value, UserRole::Technician->value, UserRole::Developer->value]);
    $interventionReadRoles = implode(',', [UserRole::Directeur->value, UserRole::Responsable->value, UserRole::Manager->value, UserRole::Technician->value, UserRole::Viewer->value, UserRole::Developer->value]);
    $repairUpdateRoles = implode(',', [UserRole::Directeur->value, UserRole::Responsable->value, UserRole::Technician->value, UserRole::Developer->value]);
    $fieldUpdateRoles = implode(',', [UserRole::Directeur->value, UserRole::Responsable->value, UserRole::Manager->value, UserRole::Technician->value, UserRole::Developer->value]);
    $businessReadRoles = implode(',', [UserRole::Directeur->value, UserRole::Responsable->value, UserRole::Manager->value, UserRole::Viewer->value, UserRole::Developer->value]);
    $panneReadRoles = implode(',', [UserRole::Directeur->value, UserRole::Responsable->value, UserRole::Manager->value, UserRole::Technician->value, UserRole::Viewer->value, UserRole::Developer->value]);
    Route::get('dashboard/summary', [DashboardController::class, 'summary'])->middleware("role:{$supervisionRoles}");
    Route::get('dashboard/stats', [DashboardController::class, 'summary'])->middleware("role:{$supervisionRoles}");
    Route::middleware('directeur')->group(function (): void {
        Route::get('settings', [SettingsController::class, 'show']);
        Route::put('settings', [SettingsController::class, 'update']);
        Route::get('logs', [ActivityLogController::class, 'index']);
        Route::patch('users/{user}/password', [UserController::class, 'resetPassword']);
        Route::apiResource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
    });

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markOneAsRead']);
    Route::post('notifications/read', [NotificationController::class, 'markAsRead']);
    Route::put('notifications/mark-as-read', [NotificationController::class, 'markAsRead']);

    Route::apiResource('clients', ClientController::class)->only(['index', 'show'])->middleware("role:{$businessReadRoles}");
    Route::apiResource('compteurs', CompteurController::class)->only(['index', 'show'])->middleware("role:{$businessReadRoles}");
    Route::apiResource('secteurs', SecteurController::class)->only(['index', 'show'])->middleware("role:{$businessReadRoles}");
    Route::apiResource('pannes', PanneController::class)->only(['index', 'show'])->middleware("role:{$panneReadRoles}");
    Route::apiResource('reparations', ReparationController::class)->only(['index', 'show'])->middleware("role:{$repairReadRoles}");
    Route::apiResource('interventions', InterventionController::class)->only(['index', 'show'])->middleware("role:{$interventionReadRoles}");
    Route::apiResource('releves', ReleveController::class)->only(['index', 'show'])->parameters(['releves' => 'releve'])->middleware("role:{$businessReadRoles}");

    Route::get('reports/pannes/pdf', [ReportController::class, 'pannesPdf'])->middleware("role:{$reportRoles}");
    Route::get('reports/clients/excel', [ReportController::class, 'clientsExcel'])->middleware("role:{$reportRoles}");
    Route::get('reports/export', [ReportController::class, 'export'])->middleware("role:{$reportRoles}");

    Route::apiResource('clients', ClientController::class)->only(['store', 'update'])->middleware("role:{$operationalWriteRoles}");
    Route::apiResource('compteurs', CompteurController::class)->only(['store', 'update'])->middleware("role:{$operationalWriteRoles}");
    Route::apiResource('secteurs', SecteurController::class)->only(['store', 'update'])->middleware("role:{$operationalWriteRoles}");
    Route::apiResource('pannes', PanneController::class)->only(['store'])->middleware("role:{$operationalWriteRoles}");
    Route::apiResource('pannes', PanneController::class)->only(['update'])->middleware("role:{$fieldUpdateRoles}");
    Route::apiResource('reparations', ReparationController::class)->only(['store'])->middleware("role:{$operationalWriteRoles}");
    Route::apiResource('reparations', ReparationController::class)->only(['update'])->middleware("role:{$repairUpdateRoles}");
    Route::apiResource('interventions', InterventionController::class)->only(['store'])->middleware("role:{$operationalWriteRoles}");
    Route::apiResource('interventions', InterventionController::class)->only(['update'])->middleware("role:{$fieldUpdateRoles}");
    Route::apiResource('releves', ReleveController::class)->only(['store', 'update'])->parameters(['releves' => 'releve'])->middleware("role:{$operationalWriteRoles}");

    Route::apiResource('clients', ClientController::class)->only(['destroy'])->middleware("role:{$operationalWriteRoles}");
    Route::apiResource('compteurs', CompteurController::class)->only(['destroy'])->middleware("role:{$operationalWriteRoles}");
    Route::apiResource('secteurs', SecteurController::class)->only(['destroy'])->middleware("role:{$operationalWriteRoles}");
    Route::apiResource('pannes', PanneController::class)->only(['destroy'])->middleware("role:{$operationalWriteRoles}");
    Route::apiResource('reparations', ReparationController::class)->only(['destroy'])->middleware("role:{$operationalWriteRoles}");
    Route::apiResource('interventions', InterventionController::class)->only(['destroy'])->middleware("role:{$operationalWriteRoles}");

    Route::get('users/technicians', [UserController::class, 'technicians'])->middleware("role:{$supervisionRoles}");
    Route::get('users/operators', [UserController::class, 'technicians'])->middleware("role:{$supervisionRoles}");
    Route::get('plombiers', [UserController::class, 'technicians'])->middleware("role:{$supervisionRoles}");

});
