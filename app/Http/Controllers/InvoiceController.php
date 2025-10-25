<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Organization;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Carbon;
use setasign\Fpdi\Fpdi;
use \Spatie\Browsershot\Browsershot;

class InvoiceController extends Controller
{
    function __construct(
        private InvoiceService $invoiceService
    ) {}

    public function index()
    {
        // fetch avaiable Months and Years from orders
        $months = Order::query()
            ->selectRaw('EXTRACT(MONTH FROM sold_date) AS month')
            ->distinct()
            ->orderBy('month')
            ->pluck('month');

        $years = Order::query()
            ->selectRaw('EXTRACT(YEAR FROM sold_date) AS year')
            ->distinct()
            ->orderBy('year')
            ->pluck('year');

        $organizations = Organization::select('id', 'name', 'name_bn', 'ucode')->get();

        return inertia('Invoice/Index', [
            'months' => $months,
            'years' => $years,
            'organizations' => $organizations,
            'invoices' => $this->invoiceService->invoiceList(),
        ]);
    }

    public function exportPdf(Request $request, $organization_id)
    {
        $validated = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2050',
            'include_cover' => 'required|boolean',
        ]);

        return $this->invoiceService->exportPdf($validated, $organization_id);
    }

    public function monthlyExport(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2050',
        ]);

        return $this->invoiceService->monthlyExport($validated);
    }
}
