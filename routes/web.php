<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FuelController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VehicleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
})->name('home')->middleware('guest');

Route::middleware(['auth', 'verified', 'is_active'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('vehicles', VehicleController::class);
    Route::resource('organizations', OrganizationController::class)->whereNumber('organization')->middleware('is_admin');
    Route::resource('fuels', FuelController::class)->except(['show'])->middleware('is_admin');

    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/create', [OrderController::class, 'create'])->name('orders.create');
    Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('orders/{order}/show', [OrderController::class, 'show'])->name('orders.show');
    Route::resource('orders', OrderController::class)->except(['index', 'create', 'store', 'show'])->middleware('is_admin');

    Route::resource('users', UserController::class)->middleware('is_admin');

    // invoices routes
    Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::post('api/invoices/{invoice}/export', [InvoiceController::class, 'exportPdf']);

    // api routes
    Route::get('api/orders', [OrderController::class, 'orderList']);
    Route::get('api/vehicles', [VehicleController::class, 'getAllVehicles']);
    Route::get('api/organizations', [OrganizationController::class, 'getAllOrganizations']);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
