<?php

use App\Enums\MonthInNumberEnums;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Carbon\Carbon;
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

        // add fuel_breakdown column to orders table
        // get available months, years and organizations then call the service function to generate the fuel breakdown
        $invoices = Invoice::query()->get();

        $invoiceService = new InvoiceService();
        // No need to query orders - we already have the months/years/organizations from invoices
        foreach ($invoices as $invoice) {
            $month = MonthInNumberEnums::getValueByName($invoice->month);
            $date = Carbon::create($invoice->year, $month, 1);  // first day of the month

            $invoiceService->generateMonthlyInvoice($date, $invoice->organization_id);
        }
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
