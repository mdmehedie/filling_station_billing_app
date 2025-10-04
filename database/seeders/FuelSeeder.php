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
                'name' => 'Diesel',
                'price' => 102,
            ],
            [
                'name' => 'Octane',
                'price' => 122,
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
