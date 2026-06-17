<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name'        => 'Super Admin',
                'slug'        => 'super_admin',
                'description' => 'Tüm sistem yetkilerine sahip en üst düzey yönetici.',
                'permissions' => json_encode(['*']),
            ],
            [
                'name'        => 'Admin',
                'slug'        => 'admin',
                'description' => 'Kullanıcı yönetimi, saat doğrulama ve raporlama yetkilerine sahip yönetici.',
                'permissions' => json_encode([
                    'admin.dashboard.view',
                    'admin.users.view',
                    'admin.users.create',
                    'admin.users.update',
                    'admin.watches.view',
                    'admin.watches.validate',
                    'admin.reports.view',
                    'admin.activity_logs.view',
                ]),
            ],
            [
                'name'        => 'Moderator',
                'slug'        => 'moderator',
                'description' => 'Saat doğrulama ve temel görüntüleme yetkilerine sahip moderatör.',
                'permissions' => json_encode([
                    'admin.dashboard.view',
                    'admin.users.view',
                    'admin.watches.view',
                    'admin.watches.validate',
                    'admin.activity_logs.view',
                ]),
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['slug' => $role['slug']],
                $role
            );
        }
    }
}
