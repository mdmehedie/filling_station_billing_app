<?php

namespace Database\Seeders;

use App\Models\Fuel;
use App\Models\Organization;
use App\Models\Order;
use App\Models\Vehicle;
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

        $orders = [
            [
                'organization_id' => $organizations->first()->id,
                'vehicle_id' => $vehicles->where('ucode', 'VH001')->first()->id,
                'fuel_id' => $fuels->where('name', 'Petrol')->first()->id,
                'fuel_qty' => 50.00,
                'total_price' => 5000.00,
                'sold_date' => now()->subDays(5),
            ],
            [
                'organization_id' => $organizations->first()->id,
                'vehicle_id' => $vehicles->where('ucode', 'VH002')->first()->id,
                'fuel_id' => $fuels->where('name', 'Diesel')->first()->id,
                'fuel_qty' => 75.00,
                'total_price' => 6000.00,
                'sold_date' => now()->subDays(4),
            ],
            [
                'organization_id' => $organizations->skip(1)->first()->id,
                'vehicle_id' => $vehicles->where('ucode', 'VH003')->first()->id,
                'fuel_id' => $fuels->where('name', 'Petrol')->first()->id,
                'fuel_qty' => 30.00,
                'total_price' => 3000.00,
                'sold_date' => now()->subDays(3),
            ],
            [
                'organization_id' => $organizations->skip(1)->first()->id,
                'vehicle_id' => $vehicles->where('ucode', 'VH004')->first()->id,
                'fuel_id' => $fuels->where('name', 'CNG')->first()->id,
                'fuel_qty' => 40.00,
                'total_price' => 2000.00,
                'sold_date' => now()->subDays(2),
            ],
            [
                'organization_id' => $organizations->skip(2)->first()->id,
                'vehicle_id' => $vehicles->where('ucode', 'VH005')->first()->id,
                'fuel_id' => $fuels->where('name', 'Diesel')->first()->id,
                'fuel_qty' => 100.00,
                'total_price' => 8000.00,
                'sold_date' => now()->subDays(1),
            ],
            [
                'organization_id' => $organizations->skip(2)->first()->id,
                'vehicle_id' => $vehicles->where('ucode', 'VH006')->first()->id,
                'fuel_id' => $fuels->where('name', 'Petrol')->first()->id,
                'fuel_qty' => 25.00,
                'total_price' => 2500.00,
                'sold_date' => now(),
            ],
            [
                'organization_id' => $organizations->skip(3)->first()->id,
                'vehicle_id' => $vehicles->where('ucode', 'VH007')->first()->id,
                'fuel_id' => $fuels->where('name', 'Octane')->first()->id,
                'fuel_qty' => 60.00,
                'total_price' => 7200.00,
                'sold_date' => now()->subDays(6),
            ],
            [
                'organization_id' => $organizations->skip(3)->first()->id,
                'vehicle_id' => $vehicles->where('ucode', 'VH008')->first()->id,
                'fuel_id' => $fuels->where('name', 'Diesel')->first()->id,
                'fuel_qty' => 80.00,
                'total_price' => 6400.00,
                'sold_date' => now()->subDays(7),
            ],
            [
                'organization_id' => $organizations->skip(4)->first()->id,
                'vehicle_id' => $vehicles->where('ucode', 'VH009')->first()->id,
                'fuel_id' => $fuels->where('name', 'LPG')->first()->id,
                'fuel_qty' => 35.00,
                'total_price' => 1750.00,
                'sold_date' => now()->subDays(8),
            ],
            [
                'organization_id' => $organizations->skip(4)->first()->id,
                'vehicle_id' => $vehicles->where('ucode', 'VH010')->first()->id,
                'fuel_id' => $fuels->where('name', 'Petrol')->first()->id,
                'fuel_qty' => 45.00,
                'total_price' => 4500.00,
                'sold_date' => now()->subDays(9),
            ],
        ];

        foreach ($orders as $order) {
            Order::create($order);
        }
    }
}
