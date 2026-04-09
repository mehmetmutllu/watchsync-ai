<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_histories', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number', 100)->index();
            $table->string('source', 50);
            $table->decimal('price', 12, 2);
            $table->string('currency', 3)->default('EUR');
            $table->string('condition', 50)->nullable();
            $table->string('seller', 255)->nullable();
            $table->string('url', 500)->nullable();
            $table->string('country', 5)->nullable();
            $table->date('scraped_date');
            $table->timestamps();

            $table->index(['reference_number', 'scraped_date']);
            $table->index(['reference_number', 'source']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_histories');
    }
};
