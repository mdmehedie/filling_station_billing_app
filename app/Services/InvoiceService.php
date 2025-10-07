<?php

namespace App\Services;

use App\Http\Resources\InvoiceCollection;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Organization;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Spatie\Browsershot\Browsershot;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class InvoiceService
{
    function __construct()
    {
        //
    }

    /**
     * Start date, end date, period
     */
    function findOutStartEndPeriod($month, $year)
    {
        $period = Carbon::create($year, $month, 1);
        $start = $period->copy()->startOfMonth();
        $end = $period->copy()->endOfMonth();

        return [$start, $end, $period];
    }

    function exportPdf($validated, $organization_id)
    {

        [$start, $end, $period] = $this->findOutStartEndPeriod($validated['month'], $validated['year']);

        // 4) Structure data by fuel type and vehicle
        [$data, $tableHeaders, $totalBill, $totalCoupon, $totalQty, $pageCount] = $this->getInvoiceData($organization_id, $start, $end, $period);

        $organization = Organization::find($organization_id);
        $fileName = $organization->name . '_' . $period->isoFormat('MMMM YYYY');
        $month = $validated['month'];
        $year = $validated['year'];

        // logo rendering fix for fpdi
        $imagePath = public_path('default/logo.jpeg');
        $imageType = pathinfo($imagePath, PATHINFO_EXTENSION);
        $imageData = file_get_contents($imagePath);
        $logo = 'data:image/' . $imageType . ';base64,' . base64_encode($imageData);

        if ($validated['include_cover']) {
            try {
                // Generate invoice PDF with Browsershot
                $invoicePdf = Browsershot::html(view('invoice-pdf', compact('data', 'tableHeaders', 'organization', 'month', 'year', 'totalBill', 'totalCoupon', 'pageCount', 'logo'))->render())
                    ->format('Legal')
                    ->landscape()
                    ->margins(0, 0, 0, 0)
                    ->showBackground()
                    ->setNodeModulePath(base_path('node_modules'))
                    ->pdf();


                // Generate cover PDF with Browsershot for perfect Bengali support
                $coverPdf = Browsershot::html(view('invoice-cover-pdf', compact('organization', 'month', 'year', 'data', 'totalCoupon', 'totalBill', 'pageCount'))->render())
                    ->format('A4')
                    ->margins(10, 10, 10, 10)
                    ->showBackground()
                    ->setNodeModulePath(base_path('node_modules'))
                    ->pdf();
            } catch (\Exception $e) {
                abort(500, 'PDF generation failed. Please check if Puppeteer and Chrome are properly installed.');
            }


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
            try {
                // Generate invoice PDF with Browsershot
                $invoicePdf = Browsershot::html(view('invoice-pdf', compact('data', 'tableHeaders', 'organization', 'month', 'year', 'totalBill', 'totalCoupon', 'pageCount', 'logo'))->render())
                    ->format('Legal')
                    ->landscape()
                    ->margins(0, 0, 0, 0)
                    ->showBackground()
                    ->setNodeModulePath(base_path('node_modules'))
                    ->pdf();

                return response($invoicePdf, 200, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'attachment; filename="' . $fileName . '-invoice.pdf' . '"'
                ]);
            } catch (\Exception $e) {
                abort(500, 'PDF generation failed. Please check if Puppeteer and Chrome are properly installed.');
            }
        }
    }

    /**
     * Fetch and structure invoice data
     */
    function getInvoiceData($organization_id, $start, $end, $period)
    {
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
            ->select('fuels.id', 'fuels.name', 'orders.per_ltr_price as price')
            ->where('organization_id', $organization_id)
            ->rightJoin('fuels', 'orders.fuel_id', '=', 'fuels.id')
            ->whereDate('sold_date', '>=', $start->toDateString())
            ->whereDate('sold_date', '<=', $end->toDateString())
            ->groupBy('fuels.id', 'fuels.name', 'orders.per_ltr_price') // group by fuel id to get distinct fuels
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

        $totalCoupon = 0;
        $totalBill = 0;
        $totalQty = 0;
        $data = array_map(function ($item) use ($orders, $tableHeaders, &$totalCoupon, &$totalBill, &$totalQty) {
            $total_qty = array_sum(array_map(function ($v) use ($item) {
                return $v['name'] === $item['name'] ? $v['total_qty'] : 0;
            }, $orders));

            $totalBill += $total_qty * $item['price'];
            $totalQty += $total_qty;

            // Filter vehicles with total_price > 0
            $vehicles = array_filter(
                array_map(function ($v) use ($item, $tableHeaders, &$totalCoupon) {
                    $i = [
                        'ucode' => $v['ucode'],

                        "quantities" => array_map(function ($day) use ($v, $item, $tableHeaders) {
                            return $v['name'] === $item['name'] ? ($v['sold_day'] == $day['day'] ? $v['total_qty'] : 0) : 0;
                        }, $tableHeaders),

                        "total_qty" => $v['name'] === $item['name'] ? $v['total_qty'] : 0,
                        "total_price" => $v['name'] === $item['name'] ? $v['total_price'] : 0,
                        "order_count" => $v['name'] === $item['name'] ? $v['order_count'] : 0,
                    ];

                    $totalCoupon += $i['order_count'];
                    return $i;
                }, $orders),
                function ($vehicle) {
                    return $vehicle['total_price'] > 0;
                }
            );

            return [
                'fuel_name' => $item['name'],
                'per_ltr_price' => $item['price'],
                "total_qty" => $total_qty,
                "total_price" => $total_qty * $item['price'],
                'vehicles' => array_values($vehicles), // reindex array
            ];
        }, $fuels);

        // Calculate page count based on data
        $pageCount = $this->calculatePageCount($data, $tableHeaders);

        if (count($data) === 0) {
            abort(404, 'No data found for the selected month and organization.');
        }

        return [$data, $tableHeaders, $totalBill, $totalCoupon, $totalQty, $pageCount];
    }

    /**
     * Generate monthly invoice for an organization
     * 1) Validate input (month, year, include_cover)
     * 2) Determine start and end dates of the month
     * 3) Pull orders for the organization within that month (eager-load fuel to avoid N+1 + get fuel price/name reliably)
     * 4) Structure data by fuel type and vehicle
     * 5) Calculate total bill, total coupon, total quantity
     * 6) Calculate page count based on data
     */

    function generateMonthlyInvoice($sold_date, $organization_id)
    {
        [$start, $end, $period] = $this->findOutStartEndPeriod($sold_date->month, $sold_date->year);
        [$data, $tableHeaders, $totalBill, $totalCoupon, $totalQty, $pageCount] = $this->getInvoiceData($organization_id, $start, $end, $period);

        // get order ids for this period and organization
        $orderIds = Order::query()->where('organization_id', $organization_id)
            ->whereDate('sold_date', '>=', $start->toDateString())
            ->whereDate('sold_date', '<=', $end->toDateString())
            ->pluck('id')
            ->toArray();

        // create invoice
        Invoice::updateOrCreate([
            'organization_id' => $organization_id,
            'month' => $period->isoFormat('MMMM'),
            'year' => $period->year,
        ], [
            'total_bill' => $totalBill,
            'total_coupon' => $totalCoupon,
            'total_qty' => $totalQty,
            'page_count' => $pageCount,
            'order_ids' => $orderIds
        ]);
    }

    /**
     * Calculate the number of pages needed for the invoice PDF
     */
    public function calculatePageCount($data, $tableHeaders)
    {
        $maxVehiclesPerPage = 12; // Maximum vehicles that can fit on one page (Legal landscape)
        $headerRows = 3; // Header rows (fuel name, price, totals)
        $totalPages = 1; // Start with 1 page for the header

        $totalVehicles = 0;
        $totalFuelTypes = count($data);

        // Count total vehicles across all fuel types
        foreach ($data as $fuelData) {
            $vehicleCount = count($fuelData['vehicles']);
            $totalVehicles += $vehicleCount;
        }

        // Calculate pages needed based on vehicles
        if ($totalVehicles > 0) {
            $pagesForVehicles = ceil($totalVehicles / $maxVehiclesPerPage);
            $totalPages = max($totalPages, $pagesForVehicles);
        }

        // Add extra pages for multiple fuel types (each fuel type needs some space)
        if ($totalFuelTypes > 1) {
            $additionalPages = ceil($totalFuelTypes / 3); // 3 fuel types per page
            $totalPages += $additionalPages - 1;
        }

        // Ensure at least 1 page
        return max(1, $totalPages);
    }

    function invoiceList()
    {
        return InvoiceResource::collection(
            QueryBuilder::for(Invoice::class)->with('organization')
                ->allowedFilters([
                    AllowedFilter::callback('search', function ($query, $value) {
                        $query->where('id', 'like', "%{$value}%")
                            ->orWhereHas('organization', function ($query) use ($value) {
                                $query->where('name', 'like', "%{$value}%");
                                $query->orWhere('name_bn', 'like', "%{$value}%");
                            });
                    }),
                ])
                ->orderBy('updated_at', 'desc')
                ->paginate(15)
        );
    }
}
