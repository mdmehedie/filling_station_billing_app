<?php

use App\Enums\MonthEnums;
use Carbon\Month;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations');
            $table->enum('month', MonthEnums::getValueAsArray());
            $table->year('year');
            $table->decimal('total_bill', 20, 2);
            $table->decimal('total_qty', 8, 2);
            $table->integer('total_coupon')->unsigned();
            $table->json('order_ids'); // Store related order IDs for reference
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
