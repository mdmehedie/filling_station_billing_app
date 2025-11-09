<?php

namespace App\Services;

use App\Exports\InvoiceExport;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Organization;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Browsershot\Browsershot;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
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

        // return $data;

        $organization = Organization::find($organization_id);
        $fileName = $organization->ucode . '_' . $organization->name . '_' . $period->isoFormat('MMMM YYYY');
        $month = $validated['month'];
        $year = $validated['year'];

        // logo rendering for left side
        $imagePath = public_path('default/csd-logo.png');
        $imageType = pathinfo($imagePath, PATHINFO_EXTENSION);
        $imageData = file_get_contents($imagePath);
        $logo1 = 'data:image/' . $imageType . ';base64,' . base64_encode($imageData);

        // logo rendering for right side
        $imagePath = public_path('default/logo.jpeg');
        $imageType = pathinfo($imagePath, PATHINFO_EXTENSION);
        $imageData = file_get_contents($imagePath);
        $logo2 = 'data:image/' . $imageType . ';base64,' . base64_encode($imageData);

        // calculate repeated coupon count
        $repeatedCouponCount = $this->calculateRepeatedCouponCount($start, $end, $organization_id);

        if ($validated['include_cover']) {
            try {
                // Generate invoice PDF with Browsershot
                $invoicePdf = Browsershot::html(view('invoice-pdf', compact('data', 'tableHeaders', 'organization', 'month', 'year', 'totalBill', 'totalCoupon', 'pageCount', 'logo1', 'logo2', 'repeatedCouponCount'))->render())
                    ->format('Legal')
                    ->landscape()
                    ->margins(0, 0, 0, 0)
                    ->showBackground()
                    ->setNodeModulePath(base_path('node_modules'))
                    ->setIncludePath('$PATH:/usr/bin')
                    ->pdf();

                // Generate cover PDF with Browsershot for perfect Bengali support
                $coverPdf = Browsershot::html(view('invoice-cover-pdf', compact('organization', 'month', 'year', 'data', 'totalCoupon', 'totalBill', 'pageCount'))->render())
                    ->format('A4')
                    ->margins(10, 10, 10, 10)
                    ->showBackground()
                    ->setNodeModulePath(base_path('node_modules'))
                    ->setIncludePath('$PATH:/usr/bin')
                    ->pdf();
            } catch (\Exception $e) {
                abort(500, $e->getMessage());
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
                $invoicePdf = Browsershot::html(view('invoice-pdf', compact('data', 'tableHeaders', 'organization', 'month', 'year', 'totalBill', 'totalCoupon', 'pageCount', 'logo1', 'logo2', 'repeatedCouponCount'))->render())
                    ->format('Legal')
                    ->landscape()
                    ->margins(0, 0, 0, 0)
                    ->showBackground()
                    ->setNodeModulePath(base_path('node_modules'))
                    ->setIncludePath('$PATH:/usr/bin')
                    ->pdf();

                return response($invoicePdf, 200, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'attachment; filename="' . $fileName . '-invoice.pdf' . '"'
                ]);
            } catch (\Exception $e) {
                abort(500, $e->getMessage());
            }
        }
    }

    /**
     * Fetch and structure invoice data
     */
    function getInvoiceData($organization_id, $start, $end, $period)
    {
        // Build table headers for each day of the month
        $tableHeaders = [];
        foreach (range(1, $period->daysInMonth) as $dayNumber) {
            $currentDay = $period->copy()->day($dayNumber);
            $tableHeaders[] = [
                'month' => $currentDay->isoFormat('MMM'),
                'year' => $currentDay->isoFormat('YYYY'),
                'day' => $currentDay->isoFormat('D'),
            ];
        }

        // Get all fuels used by this organization in this period
        $fuels = Order::query()
            ->select('fuels.id', 'fuels.name')
            ->where('orders.organization_id', $organization_id)
            ->leftJoin('fuels', 'orders.fuel_id', '=', 'fuels.id')
            ->whereDate('sold_date', '>=', $start->toDateString())
            ->whereDate('sold_date', '<=', $end->toDateString())
            ->groupBy('fuels.id', 'fuels.name')
            ->get()
            ->toArray();

        // Get all vehicles for this organization and period, grouped by fuel, vehicle, and day and per_ltr_price
        $orders = Order::query()
            ->select([
                'fuels.name as fuel_name',
                'vehicles.ucode as ucode',
                'orders.per_ltr_price',
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
                'orders.per_ltr_price',
                DB::raw('EXTRACT(DAY FROM orders.sold_date)')
            )
            ->orderBy('fuels.name')
            ->orderBy('vehicles.ucode')
            ->orderBy(DB::raw('EXTRACT(DAY FROM orders.sold_date)'), 'asc')
            ->get()
            ->toArray();

        // Build a lookup: [fuel_name][ucode][day] = [qty, price, per_ltr_price, order_count]
        $vehicleDayData = [];
        foreach ($orders as $order) {
            $fuel = $order['fuel_name'];
            $ucode = $order['ucode'];
            $day = (string) intval($order['sold_day']);  // day as string to match tableHeaders

            if (!isset($vehicleDayData[$fuel])) {
                $vehicleDayData[$fuel] = [];
            }

            if (!isset($vehicleDayData[$fuel][$ucode])) {
                $vehicleDayData[$fuel][$ucode] = [];
            }

            // Initialize day if not set
            if (!isset($vehicleDayData[$fuel][$ucode][$day])) {
                $vehicleDayData[$fuel][$ucode][$day] = [
                    'qty' => 0,
                    'price' => 0,
                    'per_ltr_price' => $order['per_ltr_price'],
                    'order_count' => 0,
                ];
            }

            // Accumulate values for the same day (in case of multiple orders with same per_ltr_price)
            $vehicleDayData[$fuel][$ucode][$day]['qty'] += $order['total_qty'];
            $vehicleDayData[$fuel][$ucode][$day]['price'] += $order['total_price'];
            $vehicleDayData[$fuel][$ucode][$day]['order_count'] += $order['order_count'];
        }

        // Now, fill missing days for each vehicle, and handle per_ltr_price change frequency
        foreach ($vehicleDayData as $fuel => &$vehicles) {
            foreach ($vehicles as $ucode => &$days) {
                // Collect all per_ltr_price changes as [day => per_ltr_price]
                $perLtrPriceByDay = [];
                foreach ($days as $day => $info) {
                    if ($info['per_ltr_price'] > 0) {
                        $perLtrPriceByDay[(int) $day] = $info['per_ltr_price'];
                    }
                }
                ksort($perLtrPriceByDay);

                // Fill missing days and assign correct per_ltr_price
                $lastPerLtrPrice = 0;
                foreach (range(1, $period->daysInMonth) as $d) {
                    $dStr = (string) $d;
                    if (isset($perLtrPriceByDay[$d])) {
                        $lastPerLtrPrice = $perLtrPriceByDay[$d];
                    }
                    if (!isset($days[$dStr])) {
                        $days[$dStr] = [
                            'qty' => 0,
                            'price' => 0,
                            'per_ltr_price' => $lastPerLtrPrice,
                            'order_count' => 0,
                        ];
                    } else {
                        if ($days[$dStr]['per_ltr_price'] == 0) {
                            $days[$dStr]['per_ltr_price'] = $lastPerLtrPrice;
                        } else {
                            $lastPerLtrPrice = $days[$dStr]['per_ltr_price'];
                        }
                    }
                }
                ksort($days, SORT_NUMERIC);
            }
        }
        unset($vehicles, $days);  // break reference

        // Now, calculate summary data for the invoice
        $totalCoupon = 0;
        $totalBill = 0;
        $totalQty = 0;
        $data = [];

        // Build the $data array in the format expected by the PDF
        foreach ($fuels as $fuel) {
            $fuelName = $fuel['name'];
            $vehiclesArr = [];
            $fuelTotalQty = 0;
            $fuelTotalPrice = 0;

            // Build per_ltr_price_ranges for this fuel dynamically based on order frequency
            $perLtrPriceRanges = [];
            if (isset($vehicleDayData[$fuelName])) {
                // Collect all per_ltr_price changes for this fuel across all vehicles and all days
                $priceChangeDays = [];
                foreach ($vehicleDayData[$fuelName] as $ucode => $days) {
                    foreach ($days as $day => $info) {
                        if ($info['per_ltr_price'] > 0) {
                            $priceChangeDays[(int) $day] = $info['per_ltr_price'];
                        }
                    }
                }
                ksort($priceChangeDays);

                // Build dynamic ranges: group consecutive days with the same price into a range
                $ranges = [];
                $daysInMonth = $period->daysInMonth;
                $prevPrice = null;
                $startDay = 1;  // Always start from 1

                for ($d = 1; $d <= $daysInMonth; $d++) {
                    $currentPrice = isset($priceChangeDays[$d]) ? $priceChangeDays[$d] : $prevPrice;
                    if ($currentPrice !== $prevPrice) {
                        if ($prevPrice !== null) {
                            $ranges[] = [
                                'start' => $startDay,
                                'end' => $d - 1,
                                'per_ltr_price' => $prevPrice,
                            ];
                        }
                        $startDay = $d;
                        $prevPrice = $currentPrice;
                    }
                }
                // Add last range if any
                if ($prevPrice !== null && $startDay !== null) {
                    $ranges[] = [
                        'start' => $startDay,
                        'end' => $daysInMonth,
                        'per_ltr_price' => $prevPrice,
                    ];
                }

                // Ensure the first range always starts from 1
                if (!empty($ranges) && $ranges[0]['start'] !== 1) {
                    $ranges[0]['start'] = 1;
                }

                // Format as "1-7": 121, "8-31": 110, etc. (dynamic, not static)
                foreach ($ranges as $range) {
                    $label = $range['start'] . '-' . $range['end'];
                    // Format price as string with 2 decimals
                    $perLtrPriceRanges[$label] = number_format($range['per_ltr_price'], 2, '.', '');
                }
            }

            if (isset($vehicleDayData[$fuelName])) {
                foreach ($vehicleDayData[$fuelName] as $ucode => $days) {
                    $quantities = [];
                    $vehicleTotalQty = 0;
                    $vehicleTotalPrice = 0;
                    $vehicleOrderCount = 0;

                    foreach ($tableHeaders as $header) {
                        $day = $header['day'];
                        if (isset($days[$day])) {
                            $qty = $days[$day]['qty'];
                            $perLtrPrice = $days[$day]['per_ltr_price'];
                            $price = $qty * $perLtrPrice;
                            $orderCount = $days[$day]['order_count'];
                        } else {
                            $qty = 0;
                            $price = 0;
                            $orderCount = 0;
                        }
                        $quantities[] = $qty;
                        $vehicleTotalQty += $qty;
                        $vehicleTotalPrice += $price;
                        $vehicleOrderCount += $orderCount;
                    }

                    $vehiclesArr[] = [
                        'ucode' => $ucode,
                        'quantities' => $quantities,
                        'total_qty' => $vehicleTotalQty,
                        'total_price' => $vehicleTotalPrice,
                        'order_count' => $vehicleOrderCount,
                    ];
                    $fuelTotalQty += $vehicleTotalQty;
                    $fuelTotalPrice += $vehicleTotalPrice;
                    $totalCoupon += $vehicleOrderCount;
                }
            }

            $totalBill += $fuelTotalPrice;
            $totalQty += $fuelTotalQty;

            $data[] = [
                'fuel_name' => $fuelName,
                // Example: ["1-7"=>121, "8-31"=>110] (dynamic, not static, depends on order frequency)
                'per_ltr_price_ranges' => $perLtrPriceRanges,
                'total_qty' => $fuelTotalQty,
                'total_price' => $fuelTotalPrice,
                'vehicles' => $vehiclesArr,
            ];
        }

        // Calculate page count based on data
        $pageCount = $this->calculatePageCount($data, $tableHeaders);

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
        $orderIds = Order::query()
            ->where('organization_id', $organization_id)
            ->whereDate('sold_date', '>=', $start->toDateString())
            ->whereDate('sold_date', '<=', $end->toDateString())
            ->pluck('id')
            ->toArray();

        if (count($orderIds) === 0) {
            // if prev invoice exists, delete it
            $prevInvoice = Invoice::query()
                ->where('organization_id', $organization_id)
                ->where('month', $period->isoFormat('MMMM'))
                ->where('year', $period->year)
                ->first();

            if ($prevInvoice) {
                $prevInvoice->delete();
            }
        } else {
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
                'order_ids' => $orderIds,
                'fuel_breakdown' => array_map(function ($fuel) use ($totalBill, $totalCoupon, $totalQty) {
                    return [
                        'fuel_name' => $fuel['fuel_name'],
                        'total_qty' => $fuel['total_qty'],
                        'total_price' => $fuel['total_price'],
                        'total_coupon' => array_reduce($fuel['vehicles'], function ($carry, $vehicle) {
                            return $carry + $vehicle['order_count'];
                        }, 0),
                    ];
                }, $data)
            ]);
        }
    }

    /**
     * Calculate the number of pages needed for the invoice PDF
     */
    public function calculatePageCount($data, $tableHeaders)
    {
        $maxVehiclesPerPage = 12;  // Maximum vehicles that can fit on one page (Legal landscape)
        $headerRows = 3;  // Header rows (fuel name, price, totals)
        $totalPages = 1;  // Start with 1 page for the header

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
            $additionalPages = ceil($totalFuelTypes / 3);  // 3 fuel types per page
            $totalPages += $additionalPages - 1;
        }

        // Ensure at least 1 page
        return max(1, $totalPages);
    }

    function invoiceList()
    {
        return InvoiceResource::collection(
            QueryBuilder::for(Invoice::class)
                ->with('organization')
                ->allowedFilters([
                    AllowedFilter::callback('search', function ($query, $value) {
                        $query
                            ->where('id', 'like', "%{$value}%")
                            ->orWhere('month', 'like', "%{$value}%")
                            ->orWhereHas('organization', function ($query) use ($value) {
                                $query->where('ucode', 'like', "%{$value}%");
                                $query->orWhere('name', 'like', "%{$value}%");
                                $query->orWhere('name_bn', 'like', "%{$value}%");
                            });
                    }),
                ])
                ->join('organizations', 'invoices.organization_id', '=', 'organizations.id')
                ->allowedSorts([
                    AllowedSort::field('month'),
                    AllowedSort::field('year'),
                ])
                ->defaultSort('-year', '-month')
                ->orderBy('organizations.ucode', 'asc')
                ->paginate(intval(request()->get('per_page', 15)))
        );
    }

    /**
     * Calculate the number of repeated coupons.
     * Logic: If a coupon (order_no) is used more than 2 times in a single day, it is considered a repeated coupon for that day (counted as 1 for that day).
     * The function sums up the repeated coupon count for all days in the given period.
     */
    function calculateRepeatedCouponCount($start_date, $end_date, $organization_id)
    {
        // Get all orders in the date range, grouped by sold_date and order_no
        $orders = Order::query()
            ->selectRaw('DATE(sold_date) as sold_date, vehicle_id, COUNT(*) as count')
            ->whereDate('sold_date', '>=', $start_date)
            ->whereDate('sold_date', '<=', $end_date)
            ->where('organization_id', $organization_id)
            ->groupBy(DB::raw('DATE(sold_date)'), 'vehicle_id')
            ->get();

        // For each day, count how many coupons (order_no) are repeated more than 2 times
        $repeatedCouponCount = 0;
        $groupedByDate = $orders->groupBy('sold_date');

        foreach ($groupedByDate as $date => $ordersForDate) {
            // For this day, check if any coupon is repeated more than 2 times
            $repeatedForDay = $ordersForDate->filter(function ($order) {
                return $order->count > 1;
            })->count();

            $repeatedCouponCount += $repeatedForDay;
        }

        return $repeatedCouponCount;
    }

    function monthlyExport($validated)
    {
        $month = $validated['month'];
        $year = $validated['year'];

        $monthName = date('F', mktime(0, 0, 0, $month, 1));
        $filename = "Bill-Summary-{$monthName}-{$year}.xlsx";

        return Excel::download(new InvoiceExport($month, $year), $filename, \Maatwebsite\Excel\Excel::XLSX);
    }
}
