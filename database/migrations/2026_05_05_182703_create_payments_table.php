<?php

use App\Enums\PaymentMethodTypeEnums;
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
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('account_name')->nullable();
            $table->string('account_no')->nullable();
            $table->string('branch_name')->nullable();
            $table->enum('type', PaymentMethodTypeEnums::getValueAsArray());
            $table->text('note')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('payment_method_id')->constrained('payment_methods')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->date('payment_date');
            $table->string('tnx_id')->nullable();
            $table->text('note')->nullable();
            $table->json('proof')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
