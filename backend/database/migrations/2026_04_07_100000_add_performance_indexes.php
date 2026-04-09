<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('watches', function (Blueprint $table) {
            $table->index(['dealer_id', 'status']);
            $table->index('brand');
        });

        Schema::table('sync_logs', function (Blueprint $table) {
            $table->index(['status', 'created_at']);
        });

        Schema::table('inventory_status_histories', function (Blueprint $table) {
            $table->index(['watch_id', 'created_at']);
        });

        Schema::table('platform_connections', function (Blueprint $table) {
            $table->unique(['dealer_id', 'platform_id']);
        });
    }

    public function down(): void
    {
        Schema::table('watches', function (Blueprint $table) {
            $table->dropIndex(['dealer_id', 'status']);
            $table->dropIndex(['brand']);
        });

        Schema::table('sync_logs', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
        });

        Schema::table('inventory_status_histories', function (Blueprint $table) {
            $table->dropIndex(['watch_id', 'created_at']);
        });

        Schema::table('platform_connections', function (Blueprint $table) {
            $table->dropUnique(['dealer_id', 'platform_id']);
        });
    }
};
