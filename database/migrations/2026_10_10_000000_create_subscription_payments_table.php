<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('plan_code');
            $table->string('plan_name');
            $table->unsignedTinyInteger('duration_months');
            $table->decimal('amount', 10, 2);
            $table->string('payment_method')->default('bkash_send_money');
            $table->string('transaction_id')->unique();
            $table->date('coverage_start');
            $table->date('coverage_end');
            $table->string('status')->default('pending');
            $table->timestamp('submitted_at');
            $table->foreignId('approved_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->string('invoice_number')->nullable()->unique();
            $table->string('receipt_number')->nullable()->unique();
            $table->timestamps();
            $table->index(['user_id', 'status', 'coverage_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
    }
};
