<?php

namespace Database\Seeders;

use App\Models\Fuel;
use Illuminate\Database\Seeder;

class FuelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $fuels = [
            [
                'name' => 'Petrol',
                'price' => 120.50,
            ],
            [
                'name' => 'Diesel',
                'price' => 110.25,
            ],
            [
                'name' => 'Octane',
                'price' => 135.75,
            ],
            [
                'name' => 'CNG',
                'price' => 45.00,
            ],
            [
                'name' => 'LPG',
                'price' => 55.50,
            ],
        ];

        foreach ($fuels as $fuel) {
            Fuel::firstOrCreate(
                ['name' => $fuel['name']],
                $fuel
            );
        }
    }
}
