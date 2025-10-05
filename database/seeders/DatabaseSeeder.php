<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::create(
            [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('p@ssw0rd!'),
                'phone' => '01234567891',
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        // Run the seeders in order
        if (app()->isProduction() || app()->isLocal()) {
            $this->call([
                OrganizationSeeder::class,
                FuelSeeder::class,
                VehicleSeeder::class,
            ]);
        }

        if (app()->isLocal()) {
            $this->call([
                //                OrderSeeder::class,
            ]);
        }
    }
}
