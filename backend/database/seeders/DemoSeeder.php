<?php

namespace Database\Seeders;

use App\Models\Dealer;
use App\Models\User;
use App\Models\Watch;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create a Dealer
        $dealer = Dealer::create([
            'name'         => 'WatchSync Demo Dealer',
            'company_name' => 'WatchSync AI Ltd.',
            'email'        => 'contact@watchsync.ai',
            'phone'        => '+1 234 567 8900',
            'status'       => 'active',
        ]);

        // 2. Create the main Demo User
        $user = User::create([
            'dealer_id'         => $dealer->id,
            'name'              => 'Demo Admin',
            'email'             => 'demo@watchsync.ai',
            'password'          => Hash::make('password'),
            'role'              => 'owner',
            'email_verified_at' => now(),
            'remember_token'    => Str::random(10),
        ]);

        $this->command->info("Demo User created: demo@watchsync.ai / password");

        // 3. Create Demo Watches
        $demoWatches = [
            [
                'brand'            => 'Rolex',
                'model'            => 'Submariner',
                'reference_number' => '126610LN',
                'year'             => 2023,
                'condition'        => 'new',
                'status'           => 'active',
                'cost_price'       => 12000,
                'sale_price'       => 14500,
                'currency'         => 'EUR',
            ],
            [
                'brand'            => 'Patek Philippe',
                'model'            => 'Nautilus',
                'reference_number' => '5711/1A-010',
                'year'             => 2018,
                'condition'        => 'very_good',
                'status'           => 'active',
                'cost_price'       => 85000,
                'sale_price'       => 95000,
                'currency'         => 'EUR',
            ],
            [
                'brand'            => 'Audemars Piguet',
                'model'            => 'Royal Oak',
                'reference_number' => '15500ST',
                'year'             => 2021,
                'condition'        => 'unworn',
                'status'           => 'draft',
                'cost_price'       => 35000,
                'sale_price'       => 42000,
                'currency'         => 'USD',
            ],
        ];

        foreach ($demoWatches as $watchData) {
            $watchData['dealer_id'] = $dealer->id;
            Watch::create($watchData);
        }

        $this->command->info(count($demoWatches) . " demo watches created.");
    }
}
