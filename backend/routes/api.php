<?php

use App\Enums\UserRole;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CompteurController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\PanneController;
use App\Http\Controllers\ReparationController;
use App\Http\Controllers\ReleveController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SecteurController;
use App\Http\Controllers\TariffSettingController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('logout', [AuthController::class, 'logout']);

    $adminRoles = implode(',', [UserRole::Admin->value, UserRole::Developer->value]);
    $managerRoles = implode(',', [UserRole::Admin->value, UserRole::Manager->value, UserRole::Developer->value]);
    $operatorRoles = implode(',', [UserRole::Admin->value, UserRole::Manager->value, UserRole::Operator->value, UserRole::Developer->value]);
    $viewerRoles = implode(',', [UserRole::Admin->value, UserRole::Manager->value, UserRole::Operator->value, UserRole::Viewer->value, UserRole::Developer->value]);
    $billingViewerRoles = implode(',', [UserRole::Admin->value, UserRole::Manager->value, UserRole::Viewer->value, UserRole::Developer->value]);
    $paymentViewerRoles = implode(',', [UserRole::Admin->value, UserRole::Manager->value, UserRole::Viewer->value, UserRole::Developer->value]);

    Route::get('dashboard/summary', [DashboardController::class, 'summary'])->middleware("role:{$managerRoles}");
    Route::get('dashboard/stats', [DashboardController::class, 'summary'])->middleware("role:{$managerRoles}");

    Route::get('notifications', [NotificationController::class, 'index'])->middleware("role:{$viewerRoles}");
    Route::post('notifications/read', [NotificationController::class, 'markAsRead'])->middleware("role:{$viewerRoles}");
    Route::put('notifications/mark-as-read', [NotificationController::class, 'markAsRead'])->middleware("role:{$viewerRoles}");

    Route::apiResource('clients', ClientController::class)->only(['index', 'show'])->middleware("role:{$viewerRoles}");
    Route::apiResource('compteurs', CompteurController::class)->only(['index', 'show'])->middleware("role:{$viewerRoles}");
    Route::apiResource('secteurs', SecteurController::class)->only(['index', 'show'])->middleware("role:{$viewerRoles}");
    Route::apiResource('pannes', PanneController::class)->only(['index', 'show'])->middleware("role:{$viewerRoles}");
    Route::apiResource('reparations', ReparationController::class)->only(['index', 'show'])->middleware("role:{$viewerRoles}");
    Route::apiResource('releves', ReleveController::class)->only(['index', 'show'])->parameters(['releves' => 'releve'])->middleware("role:{$viewerRoles}");
    Route::apiResource('factures', FactureController::class)->only(['index', 'show'])->middleware("role:{$billingViewerRoles}");
    Route::apiResource('paiements', PaiementController::class)->only(['index'])->middleware("role:{$paymentViewerRoles}");
    Route::get('factures/{facture}/pdf', [FactureController::class, 'download'])->middleware("role:{$billingViewerRoles}");
    Route::get('factures/{facture}/preview', [FactureController::class, 'preview'])->middleware("role:{$billingViewerRoles}");

    Route::get('reports/pannes/pdf', [ReportController::class, 'pannesPdf'])->middleware("role:{$managerRoles}");
    Route::get('reports/clients/excel', [ReportController::class, 'clientsExcel'])->middleware("role:{$managerRoles}");
    Route::get('reports/invoices/pdf', [ReportController::class, 'invoicesPdf'])->middleware("role:{$managerRoles}");
    Route::get('reports/payments/excel', [ReportController::class, 'paymentsExcel'])->middleware("role:{$managerRoles}");
    Route::get('tariff-settings', [TariffSettingController::class, 'show'])->middleware("role:{$managerRoles}");
    Route::put('tariff-settings', [TariffSettingController::class, 'update'])->middleware("role:{$managerRoles}");

    Route::apiResource('clients', ClientController::class)->only(['store', 'update'])->middleware("role:{$adminRoles}");
    Route::apiResource('compteurs', CompteurController::class)->only(['store', 'update'])->middleware("role:{$managerRoles}");
    Route::apiResource('secteurs', SecteurController::class)->only(['store', 'update'])->middleware("role:{$adminRoles}");
    Route::apiResource('pannes', PanneController::class)->only(['store'])->middleware("role:{$managerRoles}");
    Route::apiResource('pannes', PanneController::class)->only(['update'])->middleware("role:{$operatorRoles}");
    Route::apiResource('reparations', ReparationController::class)->only(['store', 'update'])->middleware("role:{$operatorRoles}");
    Route::apiResource('releves', ReleveController::class)->only(['store', 'update'])->parameters(['releves' => 'releve'])->middleware("role:{$operatorRoles}");
    Route::apiResource('factures', FactureController::class)->only(['store'])->middleware("role:{$managerRoles}");
    Route::post('factures/{facture}/paiements', [PaiementController::class, 'store'])->middleware("role:{$managerRoles}");

    Route::apiResource('clients', ClientController::class)->only(['destroy'])->middleware("role:{$adminRoles}");
    Route::apiResource('compteurs', CompteurController::class)->only(['destroy'])->middleware("role:{$adminRoles}");
    Route::apiResource('secteurs', SecteurController::class)->only(['destroy'])->middleware("role:{$adminRoles}");
    Route::apiResource('pannes', PanneController::class)->only(['destroy'])->middleware("role:{$adminRoles}");
    Route::apiResource('reparations', ReparationController::class)->only(['destroy'])->middleware("role:{$adminRoles}");

    Route::get('users/operators', [UserController::class, 'operators'])->middleware("role:{$managerRoles}");
    Route::get('plombiers', [UserController::class, 'operators'])->middleware("role:{$managerRoles}");

    Route::apiResource('users', UserController::class)->only(['index'])->middleware("role:{$managerRoles}");
    Route::apiResource('users', UserController::class)->only(['store', 'update'])->middleware("role:{$adminRoles}");
});
