<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('watches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dealer_id')->constrained()->cascadeOnDelete();
            $table->string('brand');
            $table->string('model');
            $table->string('reference_number')->nullable();
            $table->integer('year')->nullable();
            $table->enum('condition', ['new', 'unworn', 'very_good', 'good', 'fair'])->default('very_good');
            $table->enum('status', ['draft', 'active', 'reserved', 'sold', 'maintenance'])->default('draft');
            $table->decimal('cost_price', 10, 2)->nullable();
            $table->decimal('sale_price', 10, 2)->nullable();
            $table->string('currency', 3)->default('EUR');
            $table->jsonb('features')->nullable(); // Bilezik, kasa materyali, kadran vs.
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('watches');
    }
};
