<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class BrandModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Currently just logging the file read process as we are string-based.
     */
    public function run(): void
    {
        if (File::exists(database_path('data/brands.json'))) {
            $brands = json_decode(File::get(database_path('data/brands.json')), true);
            $this->command->info(count($brands) . ' brands loaded from reference data.');
        }

        if (File::exists(database_path('data/models.json'))) {
            $models = json_decode(File::get(database_path('data/models.json')), true);
            $this->command->info(count($models) . ' models loaded from reference data.');
        }
    }
}
