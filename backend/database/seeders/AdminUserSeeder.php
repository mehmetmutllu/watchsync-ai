<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use App\Models\Dealer;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin dealer'ı yoksa oluştur
        $adminDealer = Dealer::firstOrCreate(
            ['email' => 'admin@watchsync.ai'],
            [
                'name'         => 'WatchSync Admin',
                'company_name' => 'WatchSync AI',
                'phone'        => '+905551234567',
                'status'       => 'active',
            ]
        );

        // Super Admin kullanıcısı oluştur
        $superAdminUser = User::firstOrCreate(
            ['email' => 'superadmin@watchsync.ai'],
            [
                'dealer_id' => $adminDealer->id,
                'name'      => 'Super Admin',
                'password'  => Hash::make('SuperAdmin123!'),
                'role'      => 'owner',
            ]
        );

        $superAdminRole = Role::where('slug', 'super_admin')->first();

        if ($superAdminRole) {
            AdminUser::firstOrCreate(
                ['user_id' => $superAdminUser->id],
                [
                    'role_id'   => $superAdminRole->id,
                    'is_active' => true,
                ]
            );
        }
    }
}
