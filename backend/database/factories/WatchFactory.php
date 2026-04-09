<?php

namespace Database\Factories;

use App\Models\Dealer;
use App\Models\Watch;
use Illuminate\Database\Eloquent\Factories\Factory;

class WatchFactory extends Factory
{
    protected $model = Watch::class;

    public function definition(): array
    {
        $brands = ['Rolex', 'Omega', 'Patek Philippe', 'Audemars Piguet', 'IWC'];
        $models = ['Submariner', 'Speedmaster', 'Nautilus', 'Royal Oak', 'Portugieser'];
        $conditions = ['new', 'very_good', 'good', 'fair'];

        return [
            'dealer_id'        => Dealer::factory(),
            'brand'            => $this->faker->randomElement($brands),
            'model'            => $this->faker->randomElement($models),
            'reference_number' => strtoupper($this->faker->bothify('???-####')),
            'year'             => $this->faker->numberBetween(2015, 2026),
            'condition'        => $this->faker->randomElement($conditions),
            'status'           => 'active',
            'cost_price'       => $this->faker->numberBetween(3000, 30000),
            'sale_price'       => $this->faker->numberBetween(4000, 50000),
            'currency'         => 'EUR',
            'description'      => $this->faker->sentence(),
        ];
    }

    public function draft(): static
    {
        return $this->state(['status' => 'draft']);
    }

    public function active(): static
    {
        return $this->state(['status' => 'active']);
    }

    public function reserved(): static
    {
        return $this->state(['status' => 'reserved']);
    }

    public function sold(): static
    {
        return $this->state(['status' => 'sold']);
    }

    public function maintenance(): static
    {
        return $this->state(['status' => 'maintenance']);
    }
}
