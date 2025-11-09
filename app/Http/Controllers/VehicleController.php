<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\UpdateVehicleRequest;
use App\Http\Resources\FuelResource;
use App\Http\Resources\OrganizationResource;
use App\Http\Resources\VehicleResource;
use App\Models\Fuel;
use App\Models\Organization;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class VehicleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $vehicles = QueryBuilder::for(Vehicle::class)
            ->with('fuel', 'organization')
            ->defaultSort('-id')
            ->allowedFilters([
                AllowedFilter::callback('search', function ($query, $value) {
                    $query
                        ->where('name', 'like', "%{$value}%")
                        ->orWhere('ucode', 'like', "%{$value}%")
                        ->orWhereHas('organization', function ($query) use ($value) {
                            $query
                                ->where('name', 'like', "%{$value}%")
                                ->orWhere('name_bn', 'like', "%{$value}%");
                        });
                }),
            ])
            ->paginate(intval(request()->get('per_page', 15)));

        return inertia('Vehicles/Index', [
            'vehicles' => VehicleResource::collection($vehicles)
        ]);
    }

    // this is for api
    public function getAllVehicles(Request $request)
    {
        return VehicleResource::collection(
            Vehicle::select('id', 'name', 'ucode', 'model', 'type', 'fuel_id')
                ->where('organization_id', $request->organization_id)
                ->with('fuel')
                ->get()
        );
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia('Vehicles/Create', [
            'organizations' => OrganizationResource::collection(
                Organization::select('id', 'name', 'name_bn', 'ucode')->get()
            ),
            'fuels' => FuelResource::collection(
                Fuel::select('id', 'name', 'price')->get()
            ),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreVehicleRequest $request)
    {
        $validated = $request->validated();

        $vehicle = Vehicle::create($validated);

        return redirect()->route('vehicles.index')->with('success', "Vehicle {$vehicle->name} created successfully");
    }

    /**
     * Display the specified resource.
     */
    public function show(Vehicle $vehicle)
    {
        return inertia('Vehicles/Show', [
            'vehicle' => VehicleResource::make($vehicle),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Vehicle $vehicle)
    {
        return inertia('Vehicles/Edit', [
            'vehicle' => VehicleResource::make($vehicle),
            'organizations' => OrganizationResource::collection(Organization::select('id', 'name', 'name_bn', 'ucode')->get()),
            'fuels' => FuelResource::collection(Fuel::select('id', 'name', 'price')->get()),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateVehicleRequest $request, Vehicle $vehicle)
    {
        $vehicle->update($request->validated());

        return redirect()->route('vehicles.index')->with('success', "Vehicle {$vehicle->name} updated successfully");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Vehicle $vehicle)
    {
        try {
            $vehicle->delete();
            return redirect()->route('vehicles.index')->with('success', "Vehicle {$vehicle->name} deleted successfully");
        } catch (\Exception $e) {
            return redirect()->route('vehicles.index')->with('error', "Vehicle {$vehicle->name} cannot be deleted because it is associated with an order");
        }
    }
}
