<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kullanıcı ve müşteri başına dil tercihi.
 * Bildirim e-postaları alıcının kendi dilinde gönderilebilsin diye saklanır.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('locale', 5)->nullable()->after('email');
        });

        if (Schema::hasTable('invitations') && ! Schema::hasColumn('invitations', 'locale')) {
            Schema::table('invitations', function (Blueprint $table) {
                $table->string('locale', 5)->nullable()->after('email');
            });
        }

        if (Schema::hasTable('customers') && ! Schema::hasColumn('customers', 'locale')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->string('locale', 5)->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('locale');
        });

        if (Schema::hasTable('invitations') && Schema::hasColumn('invitations', 'locale')) {
            Schema::table('invitations', function (Blueprint $table) {
                $table->dropColumn('locale');
            });
        }

        if (Schema::hasTable('customers') && Schema::hasColumn('customers', 'locale')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropColumn('locale');
            });
        }
    }
};
