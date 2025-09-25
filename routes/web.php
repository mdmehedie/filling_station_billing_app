<?php

use App\Http\Controllers\FuelController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VehicleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::apiResource('vehicles', VehicleController::class);
    Route::resource('organizations', OrganizationController::class);
    Route::apiResource('fuels', FuelController::class);
    Route::resource('orders', OrderController::class);
    Route::apiResource('users', UserController::class);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
