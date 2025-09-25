<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\Order;
use App\Models\Organization;
use App\Models\Fuel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Display the main dashboard.
     */
    public function index()
    {
        // Get basic statistics
        $totalVehicles = Vehicle::count();
        $totalOrganizations = Organization::count();
        $totalOrders = Order::count();
        $totalFuelTypes = Fuel::count();

        // Get recent orders
        $recentOrders = Order::with(['vehicle', 'organization', 'fuel'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Get vehicle statistics by type
        $vehiclesByType = Vehicle::selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->get()
            ->pluck('count', 'type');

        // Get orders by month for the last 6 months
        $ordersByMonth = Order::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count, SUM(total_price) as total_revenue')
            ->where('created_at', '>=', Carbon::now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Get top organizations by vehicle count
        $topOrganizations = Organization::withCount('vehicles')
            ->orderBy('vehicles_count', 'desc')
            ->limit(5)
            ->get();

        // Get fuel consumption statistics
        $fuelConsumption = Order::with('fuel')
            ->selectRaw('fuel_id, SUM(fuel_qty) as total_qty, SUM(total_price) as total_price')
            ->groupBy('fuel_id')
            ->get();

        return Inertia::render('dashboard', [
            'statistics' => [
                'totalVehicles' => $totalVehicles,
                'totalOrganizations' => $totalOrganizations,
                'totalOrders' => $totalOrders,
                'totalFuelTypes' => $totalFuelTypes,
            ],
            'recentOrders' => $recentOrders,
            'vehiclesByType' => $vehiclesByType,
            'ordersByMonth' => $ordersByMonth,
            'topOrganizations' => $topOrganizations,
            'fuelConsumption' => $fuelConsumption,
        ]);
    }

    /**
     * Display the vehicle dashboard.
     */
    public function vehicles()
    {
        // Get vehicle statistics
        $totalVehicles = Vehicle::count();
        $vehiclesByType = Vehicle::selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->get()
            ->pluck('count', 'type');

        $vehiclesByFuel = Vehicle::with('fuel')
            ->selectRaw('fuel_id, COUNT(*) as count')
            ->groupBy('fuel_id')
            ->get()
            ->map(function ($item) {
                return [
                    'fuel_name' => $item->fuel->name,
                    'fuel_type' => $item->fuel->type,
                    'count' => $item->count
                ];
            });

        $vehiclesByOrganization = Organization::withCount('vehicles')
            ->orderBy('vehicles_count', 'desc')
            ->get();

        // Get recent vehicles
        $recentVehicles = Vehicle::with(['fuel', 'organization'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Get vehicle orders statistics
        $vehicleOrders = Order::with('vehicle')
            ->selectRaw('vehicle_id, COUNT(*) as order_count, SUM(fuel_qty) as total_fuel_qty, SUM(total_price) as total_spent')
            ->groupBy('vehicle_id')
            ->orderBy('order_count', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('Vehicles/Dashboard', [
            'statistics' => [
                'totalVehicles' => $totalVehicles,
            ],
            'vehiclesByType' => $vehiclesByType,
            'vehiclesByFuel' => $vehiclesByFuel,
            'vehiclesByOrganization' => $vehiclesByOrganization,
            'recentVehicles' => $recentVehicles,
            'vehicleOrders' => $vehicleOrders,
        ]);
    }
}
