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

        User::firstOrCreate(
            ['email' => 'test@example.com', 'phone' => '01234567890', 'role' => 'admin'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'phone' => '01234567891',
                'role' => 'user',
                'email_verified_at' => now(),
            ]
        );

        // Run the seeders in order
        $this->call([
            FuelSeeder::class,
            OrganizationSeeder::class,
            VehicleSeeder::class,
            OrderSeeder::class,
        ]);
    }
}
