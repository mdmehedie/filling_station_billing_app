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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('order_no')->unique();
            $table->foreignId('organization_id')->constrained('organizations');
            $table->foreignId('vehicle_id')->constrained('vehicles');
            $table->foreignId('fuel_id')->constrained('fuels');
            $table->decimal('fuel_qty')->default(0);
            $table->decimal('per_ltr_price')->default(0);
            $table->decimal('total_price', 15, 2)->default(0);
            $table->date('sold_date')->default(now());
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
