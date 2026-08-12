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
        // Add terms acceptance legal audit trail to users table
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'accepted_terms_at')) {
                $table->timestamp('accepted_terms_at')->nullable()->after('remember_token');
            }
            if (! Schema::hasColumn('users', 'accepted_ip')) {
                $table->string('accepted_ip', 45)->nullable()->after('accepted_terms_at');
            }
        });

        // Add Stripe subscription fields to dealers table
        Schema::table('dealers', function (Blueprint $table) {
            if (! Schema::hasColumn('dealers', 'stripe_customer_id')) {
                $table->string('stripe_customer_id')->nullable()->index()->after('status');
            }
            if (! Schema::hasColumn('dealers', 'stripe_subscription_id')) {
                $table->string('stripe_subscription_id')->nullable()->index()->after('stripe_customer_id');
            }
            if (! Schema::hasColumn('dealers', 'plan_type')) {
                $table->string('plan_type', 50)->default('starter')->after('stripe_subscription_id');
            }
            if (! Schema::hasColumn('dealers', 'subscription_status')) {
                $table->string('subscription_status', 50)->default('active')->after('plan_type');
            }
            if (! Schema::hasColumn('dealers', 'current_period_end')) {
                $table->timestamp('current_period_end')->nullable()->after('subscription_status');
            }
            if (! Schema::hasColumn('dealers', 'cancel_at_period_end')) {
                $table->boolean('cancel_at_period_end')->default(false)->after('current_period_end');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['accepted_terms_at', 'accepted_ip']);
        });

        Schema::table('dealers', function (Blueprint $table) {
            $table->dropColumn([
                'stripe_customer_id',
                'stripe_subscription_id',
                'plan_type',
                'subscription_status',
                'current_period_end',
                'cancel_at_period_end',
            ]);
        });
    }
};
