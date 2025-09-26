<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderCollection;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Barryvdh\DomPDF\Facade\Pdf;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {        
        return Inertia::render('Orders/Index', [
            // 'orders' => OrderResource::collection($orders),
        ]);
    }

    public function orderList(Request $request)
    {
        $orders = QueryBuilder::for(Order::class)
        ->with(['organization', 'vehicle', 'fuel'])
        ->allowedFilters([
            AllowedFilter::callback('search', function ($query, $value) {
                $query->where('id', 'like', "%{$value}%")
                      ->orWhereHas('organization', function ($orgQuery) use ($value) {
                          $orgQuery->where('name', 'like', "%{$value}%");
                      })
                      ->orWhereHas('vehicle', function ($vehicleQuery) use ($value) {
                          $vehicleQuery->where('name', 'like', "%{$value}%")
                                       ->orWhere('ucode', 'like', "%{$value}%");
                      })
                      ->orWhereHas('fuel', function ($fuelQuery) use ($value) {
                          $fuelQuery->where('name', 'like', "%{$value}%");
                      });
            }),
            AllowedFilter::callback('start_date', function ($query, $value) {
                $query->whereDate('sold_date', '>=', $value);
            }),
            AllowedFilter::callback('end_date', function ($query, $value) {
                $query->whereDate('sold_date', '<=', $value);
            }),
        ])
        ->allowedSorts(['id', 'organization_id', 'vehicle_id', 'fuel_id', 'fuel_qty', 'total_price', 'sold_date', 'created_at'])
        ->paginate(15);
        return OrderResource::collection($orders);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Order $order)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Order $order)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order)
    {
        //
    }

    /**
     * Export orders to PDF or Excel
     */
    public function export(Request $request)
    {
        $query = Order::with(['organization', 'vehicle', 'fuel']);

        // Apply search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhereHas('organization', function ($orgQuery) use ($search) {
                      $orgQuery->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('vehicle', function ($vehicleQuery) use ($search) {
                      $vehicleQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('ucode', 'like', "%{$search}%");
                  })
                  ->orWhereHas('fuel', function ($fuelQuery) use ($search) {
                      $fuelQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Apply date filters
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('sold_date', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('sold_date', '<=', $request->end_date);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();
        $format = $request->get('format', 'pdf');

        if ($format === 'excel') {
            return $this->exportToExcel($orders);
        } else {
            return $this->exportToPdf($orders);
        }
    }

    private function exportToExcel($orders)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $headers = [
            'A1' => 'Order ID',
            'B1' => 'Organization',
            'C1' => 'Vehicle',
            'D1' => 'Fuel Type',
            'E1' => 'Quantity (L)',
            'F1' => 'Total Price',
            'G1' => 'Sold Date',
            'H1' => 'Created At'
        ];

        foreach ($headers as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }

        // Style headers
        $sheet->getStyle('A1:H1')->applyFromArray([
            'font' => ['bold' => true],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '059669']
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);

        // Add data
        $row = 2;
        foreach ($orders as $order) {
            $sheet->setCellValue('A' . $row, '#' . str_pad($order->id, 4, '0', STR_PAD_LEFT));
            $sheet->setCellValue('B' . $row, $order->organization->name);
            $sheet->setCellValue('C' . $row, $order->vehicle->name ?? 'Unnamed Vehicle');
            $sheet->setCellValue('D' . $row, $order->fuel->name);
            $sheet->setCellValue('E' . $row, $order->fuel_qty);
            $sheet->setCellValue('F' . $row, '৳' . number_format($order->total_price, 2));
            $sheet->setCellValue('G' . $row, $order->sold_date->format('Y-m-d'));
            $sheet->setCellValue('H' . $row, $order->created_at->format('Y-m-d H:i:s'));
            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'H') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        
        $filename = 'orders-export-' . date('Y-m-d') . '.xlsx';
        
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function exportToPdf($orders)
    {
        $data = [
            'orders' => $orders,
            'exportDate' => now()->format('Y-m-d H:i:s'),
            'totalOrders' => $orders->count(),
            'totalAmount' => $orders->sum('total_price')
        ];

        $pdf = Pdf::loadView('exports.orders', $data);
        $pdf->setPaper('A4', 'landscape');
        
        $filename = 'orders-export-' . date('Y-m-d') . '.pdf';
        
        return $pdf->download($filename);
    }
}