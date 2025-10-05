<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use \Spatie\Browsershot\Browsershot;

class InvoiceController extends Controller
{
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
        ]);
    }

    public function exportPdf(Request $request, $organization_id)
    {
        $validated = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2050',
            'include_cover' => 'required|boolean',
        ]);

        $period = Carbon::create($validated['year'], $validated['month'], 1);
        $start = $period->copy()->startOfMonth();
        $end = $period->copy()->endOfMonth();

        // put all the date of this in an array
        $tableHeaders = [];
        foreach (range(1, $period->daysInMonth) as $dayNumber) {
            $currentDay = $period->copy()->day($dayNumber);
            $tableHeaders[] = [
                'month' => $currentDay->isoFormat('MMM'), // e.g., "Jun",
                'year' => $currentDay->isoFormat('YYYY'), // e.g., "2024",
                'day' => $currentDay->isoFormat('D'), // e.g., "1", "2", etc.
            ];
        }

        // 2) Pull orders (eager-load fuel to avoid N+1 + get fuel price/name reliably)
        $fuels = Order::query()
            ->select('fuels.id', 'fuels.name', 'fuels.price')
            ->where('organization_id', $organization_id)
            ->rightJoin('fuels', 'orders.fuel_id', '=', 'fuels.id')
            ->whereDate('sold_date', '>=', $start->toDateString())
            ->whereDate('sold_date', '<=', $end->toDateString())
            ->groupBy('fuels.id', 'fuels.name', 'fuels.price') // group by fuel id to get distinct fuels
            ->get()
            ->toArray();

        // 3. pull full wise vehicles
        $orders = Order::query()
            ->select([
                'fuels.name',
                'vehicles.ucode',
                DB::raw('EXTRACT(DAY FROM orders.sold_date) AS sold_day'),
                DB::raw('SUM(orders.fuel_qty) AS total_qty'),
                DB::raw('SUM(orders.total_price) AS total_price'),
                DB::raw('COUNT(orders.id) AS order_count'),
            ])
            ->leftJoin('vehicles', 'orders.vehicle_id', '=', 'vehicles.id')
            ->leftJoin('fuels', 'orders.fuel_id', '=', 'fuels.id')
            ->where('orders.organization_id', $organization_id)
            ->whereBetween('orders.sold_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy(
                'fuels.name',
                'vehicles.ucode',
                DB::raw('EXTRACT(DAY FROM orders.sold_date)')
            )
            ->orderBy(DB::raw('EXTRACT(DAY FROM orders.sold_date)'), 'asc')
            ->get()
            ->toArray();

        $data = array_map(function ($item) use ($orders, $tableHeaders) {
            return [
                'fuel_name' => $item['name'],
                'per_ltr_price' => $item['price'],

                "total_qty" => array_sum(array_map(function ($v) use ($item) {
                    return $v['name'] === $item['name'] ? $v['total_qty'] : 0;
                }, $orders)),

                "total_price" => array_sum(array_map(function ($v) use ($item) {
                    return $v['name'] === $item['name'] ? $v['total_price'] : 0;
                }, $orders)),


                'vehicles' => array_map(function ($v) use ($item, $tableHeaders) {
                    return [
                        'ucode' => $v['ucode'],
                        "quantities" => array_map(function ($day) use ($v, $item, $tableHeaders) {
                            return $v['name'] === $item['name'] ? ($v['sold_day'] == $day['day'] ? $v['total_qty'] : 0) : 0;
                        }, $tableHeaders),
                        "total_qty" => $v['name'] === $item['name'] ? $v['total_qty'] : 0,
                        "total_price" => $v['name'] === $item['name'] ? $v['total_price'] : 0,
                        "order_count" => $v['name'] === $item['name'] ? $v['order_count'] : 0,
                    ];
                }, $orders),
            ];
        }, $fuels);

        $organization = Organization::find($organization_id);
        $fileName = $organization->name . '_' . $period->isoFormat('MMMM YYYY');

        if ($validated['include_cover']) {
            // Generate invoice PDF with Browsershot
            $invoicePdf = Browsershot::html(view('invoice-pdf', compact('data', 'tableHeaders'))->render())
                ->format('Legal')
                ->landscape()
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->pdf();

            // Generate single PDF with Puppeteer for perfect Bengali support
            $month = $validated['month'];
            $year = $validated['year'];

            $coverPdf = Browsershot::html(view('invoice-cover-pdf', compact('organization', 'month', 'year', 'data'))->render())
                ->format('A4')
                ->margins(10, 10, 10, 10)
                ->showBackground()
                ->pdf();


            // Create a zip file in memory
            $zipFileName = $fileName . '-invoice-with-cover.zip';
            $zip = new \ZipArchive();
            $tmpFile = tempnam(sys_get_temp_dir(), 'zip');

            if ($zip->open($tmpFile, \ZipArchive::CREATE) === true) {
                $zip->addFromString($fileName . '-invoice.pdf', $invoicePdf);
                $zip->addFromString($fileName . '-cover.pdf', $coverPdf);
                $zip->close();

                return response()->download($tmpFile, $zipFileName)->deleteFileAfterSend(true);
            } else {
                abort(500, 'Could not create zip file.');
            }
        } else {
            // Generate invoice PDF with Browsershot
            $pdf = Browsershot::html(view('invoice-pdf', compact('data', 'tableHeaders'))->render())
                ->format('Legal')
                ->landscape()
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->pdf();

            return response($pdf, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $fileName . '-cover.pdf' . '"'
            ]);
        }
    }
}
