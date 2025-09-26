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
use Barryvdh\DomPDF\Facade\Pdf;
use App\Services\OrderService;

class OrderController extends Controller
{
    function __construct(private OrderService $orderService)
    {
    }
    /**
     * 
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
        return OrderResource::collection($this->orderService->orderList());
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
        $validated = $request->validate([
            'format' => 'required|in:pdf,excel',
        ]);

        $orders = $this->orderService->orderList(true);

        if ($validated['format'] === 'excel') {
            return $this->orderService->exportToExcel($orders);
        } else {
            return $this->orderService->exportToPdf($orders);
        }
    }


}