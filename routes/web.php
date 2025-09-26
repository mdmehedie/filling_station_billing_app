<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FuelController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\VehicleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('vehicles/dashboard', [DashboardController::class, 'vehicles'])->name('vehicles.dashboard');

    Route::apiResource('vehicles', VehicleController::class);
    Route::resource('organizations', OrganizationController::class);
    Route::apiResource('fuels', FuelController::class);
    Route::resource('orders', OrderController::class);
    Route::apiResource('users', UserController::class);
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    
    // Export routes
    Route::get('api/orders/export', [OrderController::class, 'export'])->name('orders.export');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
