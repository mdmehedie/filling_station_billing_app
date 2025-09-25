<?php

namespace Database\Seeders;

use App\Models\Fuel;
use App\Models\Organization;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class VehicleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get fuels and organizations
        $fuels = Fuel::all();
        $organizations = Organization::all();
        
        if ($fuels->isEmpty()) {
            $this->command->warn('No fuels found. Please run FuelSeeder first.');
            return;
        }
        
        if ($organizations->isEmpty()) {
            $this->command->warn('No organizations found. Please run OrganizationSeeder first.');
            return;
        }

        $vehicles = [
            [
                'fuel_id' => $fuels->where('name', 'Petrol')->first()->id,
                'organization_id' => $organizations->first()->id,
                'ucode' => 'VH001',
                'name' => 'Toyota Hiace',
                'model' => '2023',
                'type' => 'Bus',
            ],
            [
                'fuel_id' => $fuels->where('name', 'Diesel')->first()->id,
                'organization_id' => $organizations->first()->id,
                'ucode' => 'VH002',
                'name' => 'Nissan Civilian',
                'model' => '2022',
                'type' => 'Bus',
            ],
            [
                'fuel_id' => $fuels->where('name', 'Petrol')->first()->id,
                'organization_id' => $organizations->skip(1)->first()->id,
                'ucode' => 'VH003',
                'name' => 'Honda Civic',
                'model' => '2023',
                'type' => 'Car',
            ],
            [
                'fuel_id' => $fuels->where('name', 'CNG')->first()->id,
                'organization_id' => $organizations->skip(1)->first()->id,
                'ucode' => 'VH004',
                'name' => 'Toyota Corolla',
                'model' => '2022',
                'type' => 'Car',
            ],
            [
                'fuel_id' => $fuels->where('name', 'Diesel')->first()->id,
                'organization_id' => $organizations->skip(2)->first()->id,
                'ucode' => 'VH005',
                'name' => 'Ashok Leyland',
                'model' => '2023',
                'type' => 'Truck',
            ],
            [
                'fuel_id' => $fuels->where('name', 'Petrol')->first()->id,
                'organization_id' => $organizations->skip(2)->first()->id,
                'ucode' => 'VH006',
                'name' => 'Suzuki Swift',
                'model' => '2023',
                'type' => 'Car',
            ],
            [
                'fuel_id' => $fuels->where('name', 'Octane')->first()->id,
                'organization_id' => $organizations->skip(3)->first()->id,
                'ucode' => 'VH007',
                'name' => 'BMW X5',
                'model' => '2023',
                'type' => 'SUV',
            ],
            [
                'fuel_id' => $fuels->where('name', 'Diesel')->first()->id,
                'organization_id' => $organizations->skip(3)->first()->id,
                'ucode' => 'VH008',
                'name' => 'Mercedes Sprinter',
                'model' => '2022',
                'type' => 'Van',
            ],
            [
                'fuel_id' => $fuels->where('name', 'LPG')->first()->id,
                'organization_id' => $organizations->skip(4)->first()->id,
                'ucode' => 'VH009',
                'name' => 'Toyota Prius',
                'model' => '2023',
                'type' => 'Hybrid',
            ],
            [
                'fuel_id' => $fuels->where('name', 'Petrol')->first()->id,
                'organization_id' => $organizations->skip(4)->first()->id,
                'ucode' => 'VH010',
                'name' => 'Honda City',
                'model' => '2023',
                'type' => 'Car',
            ],
        ];

        foreach ($vehicles as $vehicle) {
            Vehicle::firstOrCreate(
                ['ucode' => $vehicle['ucode']],
                $vehicle
            );
        }
    }
}
