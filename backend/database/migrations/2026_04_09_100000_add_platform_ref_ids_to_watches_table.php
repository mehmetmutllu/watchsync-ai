<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('watches', function (Blueprint $table) {
            $table->string('ebay_listing_id')->nullable()->after('description');
            $table->string('ebay_offer_id')->nullable()->after('ebay_listing_id');
            $table->string('shopify_product_id')->nullable()->after('ebay_offer_id');
            $table->string('shopify_variant_id')->nullable()->after('shopify_product_id');

            $table->index('ebay_listing_id');
            $table->index('shopify_product_id');
        });
    }

    public function down(): void
    {
        Schema::table('watches', function (Blueprint $table) {
            $table->dropIndex(['ebay_listing_id']);
            $table->dropIndex(['shopify_product_id']);
            $table->dropColumn(['ebay_listing_id', 'ebay_offer_id', 'shopify_product_id', 'shopify_variant_id']);
        });
    }
};
