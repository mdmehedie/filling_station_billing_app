<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrganizationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first user to associate with organizations
        $user = User::first();
        
        if (!$user) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        $organizations = [
            [
                'ucode' => 'ORG001',
                'user_id' => $user->id,
                'name' => 'ABC Transport Ltd',
                'name_bn' => 'এবিসি ট্রান্সপোর্ট লিমিটেড',
                'logo' => null,
                'is_vat_applied' => true,
                'vat_rate' => 15.00,
            ],
            [
                'ucode' => 'ORG002',
                'user_id' => $user->id,
                'name' => 'XYZ Logistics',
                'name_bn' => 'এক্সওয়াইজেড লজিস্টিক্স',
                'logo' => null,
                'is_vat_applied' => true,
                'vat_rate' => 15.00,
            ],
            [
                'ucode' => 'ORG003',
                'user_id' => $user->id,
                'name' => 'City Bus Service',
                'name_bn' => 'সিটি বাস সার্ভিস',
                'logo' => null,
                'is_vat_applied' => false,
                'vat_rate' => 0,
            ],
            [
                'user_id' => $user->id,
                'ucode' => 'ORG004',
                'name' => 'Metro Transport Co.',
                'name_bn' => 'মেট্রো ট্রান্সপোর্ট কোং',
                'logo' => null,
                'is_vat_applied' => true,
                'vat_rate' => 15.00,
            ],
            [
                'ucode' => 'ORG005',
                'user_id' => $user->id,
                'name' => 'Green Fleet Ltd',
                'name_bn' => 'গ্রিন ফ্লিট লিমিটেড',
                'logo' => null,
                'is_vat_applied' => true,
                'vat_rate' => 15.00,
            ],
        ];

        foreach ($organizations as $organization) {
            Organization::firstOrCreate(
                ['name' => $organization['name']],
                $organization
            );
        }
    }
}
