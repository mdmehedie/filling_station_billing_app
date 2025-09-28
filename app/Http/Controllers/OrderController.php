<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderCollection;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Organization;
use App\Models\Vehicle;
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
use App\Http\Resources\OrganizationResource;
use App\Http\Resources\VehicleResource;
use App\Http\Resources\FuelResource;
use App\Models\Fuel;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Requests\StoreOrderRequest;


class OrderController extends Controller
{
    function __construct(private OrderService $orderService)
    {
        //
    }
    /**
     * 
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {        
        return Inertia::render('Orders/Index', [
            // 'orders' => OrderResource::collection($orders),
            'fuels' => FuelResource::collection(Fuel::select('id', 'name', 'price')->get()),
        ]);
    }

    public function orderList(Request $request)
    {
        return OrderResource::collection($this->orderService->orderList());
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        return inertia('Orders/Create',[
            'organizations' => OrganizationResource::collection(Organization::select('id', 'name', 'name_bn', 'ucode')->get()),
            'vehicles' => VehicleResource::collection(Vehicle::select('id', 'name', 'ucode', 'model', 'type')->where('organization_id', $request->organization_id)->get()),
            'fuels' => FuelResource::collection(Fuel::select('id', 'name', 'price')->get()),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreOrderRequest $request)
    {
        $validated = $request->validated();

        $validated['user_id'] = auth()->user()->id;
        Order::create($validated);

        return redirect()->route('orders.index')->with('success', 'Order created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order)
    {
        return inertia('Orders/Show', [
            'order' => OrderResource::make($order)
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Order $order)
    {
        return inertia('Orders/Edit', [
            'order' => OrderResource::make($order),
            'organizations' => OrganizationResource::collection(Organization::select('id', 'name', 'name_bn', 'ucode')->get()),
            'fuels' => FuelResource::collection(Fuel::select('id', 'name', 'price')->get()),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateOrderRequest $request, Order $order)
    {
        $validated = $request->validated();

        $order->update($validated);

        return redirect()->route('orders.index')->with('success', 'Order updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order)
    {
        $order->delete();

        return redirect()->route('orders.index')->with('success', 'Order deleted successfully');
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