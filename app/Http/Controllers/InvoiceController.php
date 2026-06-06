<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Organization;
use App\Services\InvoiceService;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(
        private InvoiceService $invoiceService
    ) {}

    public function statement(Request $request, Organization $organization)
    {
        return $this->invoiceService->exportStatement($organization);
    }

    public function index()
    {
        // fetch avaiable Months and Years from orders
        $months = Order::query()
            ->selectRaw('EXTRACT(MONTH FROM sold_date) AS month')
            ->distinct()
            ->orderBy('month', 'asc')
            ->pluck('month');

        $years = Order::query()
            ->selectRaw('EXTRACT(YEAR FROM sold_date) AS year')
            ->distinct()
            ->orderBy('year', 'asc')
            ->pluck('year');

        $organizations = Organization::select(['id', 'name', 'name_bn', 'ucode'])->get();

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

    public function sync(Request $request, string $organization_id)
    {
        $validated = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2050',
        ]);

        $date = \Illuminate\Support\Carbon::createFromDate((int) $validated['year'], (int) $validated['month'], 1);

        $this->invoiceService->generateMonthlyInvoice($date, (int) $organization_id);

        return back()->with('success', 'Invoice synchronized successfully');
    }
}
