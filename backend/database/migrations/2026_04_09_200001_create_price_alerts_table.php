<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reference_number', 100);
            $table->decimal('target_price', 12, 2);
            $table->enum('direction', ['below', 'above'])->default('below');
            $table->boolean('is_active')->default(true);
            $table->timestamp('triggered_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'reference_number']);
            $table->index(['reference_number', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_alerts');
    }
};
