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

Route::middleware(['auth', 'verified', 'is_active'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('vehicles', VehicleController::class);
    Route::resource('organizations', OrganizationController::class)->whereNumber('organization');
    Route::resource('fuels', FuelController::class)->except(['show']);
    Route::resource('orders', OrderController::class);
    Route::apiResource('users', UserController::class);
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    
    // api routes
    Route::post('api/orders/export', [OrderController::class, 'export']);
    Route::get('api/orders', [OrderController::class, 'orderList']);
    Route::get('api/vehicles', [VehicleController::class, 'getAllVehicles']);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
