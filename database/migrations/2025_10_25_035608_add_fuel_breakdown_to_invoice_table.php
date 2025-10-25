<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->json('fuel_breakdown')->after('total_coupon')->nullable();  // example [{"fuel_name": "Diesel", "total_qty": 100, "total_price": 10000, "total_coupon": 10}, {"fuel_name": "Octane", "total_qty": 200, "total_price": 20000, "total_coupon": 20}]
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('fuel_breakdown');
        });
    }
};
