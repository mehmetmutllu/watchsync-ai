<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('status', ['active', 'invited', 'disabled'])
                ->default('active')
                ->after('role');
            $table->json('permissions')->nullable()->after('status');
            $table->foreignId('invited_by')->nullable()->after('permissions')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('invited_at')->nullable()->after('invited_by');
            $table->timestamp('last_login_at')->nullable()->after('invited_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('invited_by');
            $table->dropColumn(['status', 'permissions', 'invited_at', 'last_login_at']);
        });
    }
};
