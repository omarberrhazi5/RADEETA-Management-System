<?php

use App\Enums\UserRole;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CompteurController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PanneController;
use App\Http\Controllers\ReparationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SecteurController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('dashboard/summary', [DashboardController::class, 'summary'])
        ->middleware('role:'.UserRole::Admin->value.','.UserRole::Manager->value);
    Route::get('dashboard/stats', [DashboardController::class, 'summary'])
        ->middleware('role:'.UserRole::Admin->value.','.UserRole::Manager->value);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::put('notifications/mark-as-read', [NotificationController::class, 'markAsRead']);

    Route::apiResource('clients', ClientController::class)->only(['index', 'show']);
    Route::apiResource('compteurs', CompteurController::class)->only(['index', 'show']);
    Route::apiResource('pannes', PanneController::class)->only(['index', 'show']);
    Route::apiResource('secteurs', SecteurController::class)->only(['index', 'show']);
    Route::apiResource('reparations', ReparationController::class)->only(['index', 'show']);

    Route::get('reports/pannes/pdf', [ReportController::class, 'pannesPdf'])
        ->middleware('role:'.UserRole::Admin->value.','.UserRole::Manager->value);
    Route::get('reports/clients/excel', [ReportController::class, 'clientsExcel'])
        ->middleware('role:'.UserRole::Admin->value.','.UserRole::Manager->value);

    Route::apiResource('clients', ClientController::class)
        ->only(['store', 'update', 'destroy'])
        ->middleware('role:'.UserRole::Admin->value.','.UserRole::Manager->value);

    Route::apiResource('compteurs', CompteurController::class)
        ->only(['store', 'update', 'destroy'])
        ->middleware('role:'.UserRole::Admin->value.','.UserRole::Manager->value);

    Route::apiResource('secteurs', SecteurController::class)
        ->only(['store', 'update', 'destroy'])
        ->middleware('role:'.UserRole::Admin->value.','.UserRole::Manager->value);

    Route::apiResource('pannes', PanneController::class)
        ->only(['store', 'update', 'destroy'])
        ->middleware('role:'.UserRole::Admin->value.','.UserRole::Manager->value.','.UserRole::Technician->value);

    Route::apiResource('reparations', ReparationController::class)
        ->only(['store', 'update', 'destroy'])
        ->middleware('role:'.UserRole::Admin->value.','.UserRole::Technician->value);

    Route::get('users/technicians', [UserController::class, 'technicians'])
        ->middleware('role:'.UserRole::Admin->value.','.UserRole::Manager->value.','.UserRole::Technician->value);
    Route::get('plombiers', [UserController::class, 'technicians'])
        ->middleware('role:'.UserRole::Admin->value.','.UserRole::Manager->value.','.UserRole::Technician->value);

    Route::apiResource('users', UserController::class)
        ->only(['index', 'store', 'update'])
        ->middleware('role:'.UserRole::Admin->value);
});
