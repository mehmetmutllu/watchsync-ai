<?php

namespace Database\Factories;

use App\Models\Dealer;
use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        return [
            'dealer_id'      => Dealer::factory(),
            'customer_id'    => null,
            'invoice_number' => sprintf('INV-%s-%05d', now()->format('Y'), $this->faker->unique()->numberBetween(1, 99999)),
            'status'         => 'draft',
            'issue_date'     => now(),
            'due_date'       => now()->addDays(30),
            'subtotal'       => 0,
            'tax_rate'       => 19.00,
            'tax_amount'     => 0,
            'total'          => 0,
            'currency'       => 'EUR',
        ];
    }

    public function sent(): static
    {
        return $this->state(['status' => 'sent']);
    }

    public function paid(): static
    {
        return $this->state(['status' => 'paid']);
    }
}
