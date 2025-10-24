<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Resources\FuelResource;
use App\Http\Resources\OrderCollection;
use App\Http\Resources\OrderResource;
use App\Http\Resources\OrganizationResource;
use App\Http\Resources\VehicleResource;
use App\Models\Fuel;
use App\Models\Order;
use App\Models\Organization;
use App\Models\Vehicle;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App;

class OrderController extends Controller
{
    function __construct(
        private OrderService $orderService
    ) {
        //
    }

    /**
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
        return ($this->orderService->orderList());
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        return inertia('Orders/Create', [
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

        $order = DB::transaction(function () use ($validated) {
            foreach ($validated['order_items'] as $item) {
                $orderData = $validated;
                unset($orderData['order_items']);
                $orderData['organization_id'] = $item['organization_id'];
                $orderData['fuel_id'] = $item['fuel_id'];
                $orderData['fuel_qty'] = $item['fuel_qty'];
                $orderData['user_id'] = Auth::id();
                $orderData['vehicle_id'] = $item['vehicle_id'];
                $orderData['per_ltr_price'] = $item['per_ltr_price'];
                $orderData['total_price'] = $item['total_price'];

                $order = Order::create($orderData);
            }

            return $order;
        });
        return redirect()->route('orders.index')->with('success', "Order #00{$order->id} created successfully");
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

        return redirect()->route('orders.index')->with('success', "Order {$order->order_no} updated successfully");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order)
    {
        try {
            $order->delete();
            return redirect()->route('orders.index')->with('success', "Order {$order->id} deleted successfully");
        } catch (\Exception $e) {
            return redirect()->route('orders.index')->with('error', "Order {$order->id} cannot be deleted because it is associated with a vehicle");
        }
    }
}
