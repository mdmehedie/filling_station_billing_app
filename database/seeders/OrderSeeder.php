<?php

namespace Database\Seeders;

use App\Models\Fuel;
use App\Models\Order;
use App\Models\Organization;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get fuels, organizations, and vehicles
        $fuels = Fuel::all();
        $organizations = Organization::all();
        $vehicles = Vehicle::all();

        if ($fuels->isEmpty()) {
            $this->command->warn('No fuels found. Please run FuelSeeder first.');
            return;
        }

        if ($organizations->isEmpty()) {
            $this->command->warn('No organizations found. Please run OrganizationSeeder first.');
            return;
        }

        if ($vehicles->isEmpty()) {
            $this->command->warn('No vehicles found. Please run VehicleSeeder first.');
            return;
        }

        // Generate orders for multiple months dynamically
        $startYear = 2024;
        $startMonth = 6; // June
        $numberOfMonths = 2; // Generate for 2 months

        for ($i = 0; $i < $numberOfMonths; $i++) {
            $currentDate = Carbon::create($startYear, $startMonth)->addMonths($i);
            $this->generateOrdersForMonth($currentDate->year, $currentDate->month, $fuels, $organizations, $vehicles);
            $this->command->info("Generated orders for {$currentDate->format('F Y')}");
        }
    }

    private function generateOrdersForMonth($year, $month, $fuels, $organizations, $vehicles)
    {
        $startDate = Carbon::create($year, $month, 1);
        $endDate = $startDate->copy()->endOfMonth();

        // Fuel price ranges (per liter)
        $fuelPrices = [
            'Petrol' => ['min' => 95, 'max' => 105],
            'Diesel' => ['min' => 85, 'max' => 95],
            'Octane' => ['min' => 110, 'max' => 125],
            'CNG' => ['min' => 45, 'max' => 55],
            'LPG' => ['min' => 50, 'max' => 60],
        ];

        // Generate 8-12 orders per day
        for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
            $ordersPerDay = rand(8, 12);

            for ($i = 0; $i < $ordersPerDay; $i++) {
                $fuel = $fuels->random();
                $organization = $organizations->random();
                $vehicle = $vehicles->random();

                // Random quantity based on fuel type
                $quantity = $this->getRandomQuantity($fuel->name);

                // Calculate price with some variation
                $priceRange = $fuelPrices[$fuel->name] ?? ['min' => 80, 'max' => 120];
                $pricePerLiter = rand($priceRange['min'] * 100, $priceRange['max'] * 100) / 100;
                $totalPrice = round($quantity * $pricePerLiter, 2);

                // Random time during the day
                $orderDate = $date->copy()->addHours(rand(6, 20))->addMinutes(rand(0, 59));

                Order::create([
                    'user_id' => 1,
                    'organization_id' => $organization->id,
                    'vehicle_id' => $vehicle->id,
                    'fuel_id' => $fuel->id,
                    'fuel_qty' => $quantity,
                    'total_price' => $totalPrice,
                    'sold_date' => $orderDate,
                ]);
            }
        }
    }

    private function getRandomQuantity($fuelType)
    {
        switch ($fuelType) {
            case 'Petrol':
            case 'Octane':
                return rand(2000, 8000) / 100; // 20-80 liters
            case 'Diesel':
                return rand(3000, 12000) / 100; // 30-120 liters
            case 'CNG':
                return rand(1500, 6000) / 100; // 15-60 liters
            case 'LPG':
                return rand(1000, 4000) / 100; // 10-40 liters
            default:
                return rand(2000, 6000) / 100; // 20-60 liters
        }
    }
}
