<?php

namespace Database\Factories;

use App\Models\Dealer;
use Illuminate\Database\Eloquent\Factories\Factory;

class DealerFactory extends Factory
{
    protected $model = Dealer::class;

    public function definition(): array
    {
        return [
            'name'         => $this->faker->name(),
            'company_name' => $this->faker->company(),
            'email'        => $this->faker->unique()->companyEmail(),
            'phone'        => $this->faker->phoneNumber(),
            'status'       => 'active',
        ];
    }
}
