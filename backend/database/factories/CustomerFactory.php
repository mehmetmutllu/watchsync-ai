<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Dealer;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'dealer_id'   => Dealer::factory(),
            'first_name'  => $this->faker->firstName(),
            'last_name'   => $this->faker->lastName(),
            'email'       => $this->faker->unique()->safeEmail(),
            'phone'       => $this->faker->phoneNumber(),
            'company'     => $this->faker->company(),
            'address'     => $this->faker->streetAddress(),
            'city'        => $this->faker->city(),
            'country'     => $this->faker->country(),
            'postal_code' => $this->faker->postcode(),
            'tags'        => ['vip'],
        ];
    }
}
