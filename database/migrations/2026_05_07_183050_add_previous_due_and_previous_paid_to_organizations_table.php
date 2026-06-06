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
//        Schema::table('organizations', function (Blueprint $table) {
//            $table->decimal('previous_due', 15, 2)->default(0)->after('security_money');
//            $table->decimal('previous_paid', 15, 2)->default(0)->after('previous_due');
//        });

        Schema::table('payments', function (Blueprint $table) {
            $table->enum('method', PaymentMethodTypeEnums::getValueAsArray());
            $table->boolean('is_deleted')->default(false)->after('proof');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->enum('type', ['prev_paid', 'regular_paid'])->default('regular_paid')->after('amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['previous_due', 'previous_paid']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['is_deleted', 'type']);
            $table->renameColumn('method', 'type');
        });
    }
};
