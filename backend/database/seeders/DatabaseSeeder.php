<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PlatformSeeder::class,
            BrandModelSeeder::class,
            RoleSeeder::class,
            DemoSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
