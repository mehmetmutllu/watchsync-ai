<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['terms_of_service', 'privacy_policy', 'kvkk_gdpr', 'cookie_policy']);
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content');
            $table->string('version', 20)->default('1.0');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['type', 'status']);
        });

        Schema::create('contract_acceptances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->string('version', 20);
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('accepted_at')->useCurrent();

            $table->unique(['user_id', 'contract_id', 'version']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_acceptances');
        Schema::dropIfExists('contracts');
    }
};
