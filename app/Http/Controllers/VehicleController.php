<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\UpdateVehicleRequest;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use App\Http\Resources\FuelResource;
use App\Models\Fuel;
use Inertia\Inertia;

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
                    $query->where('name', 'like', "%{$value}%")
                          ->orWhere('ucode', 'like', "%{$value}%");
                }),
                AllowedFilter::callback('organization_id', function ($query, $value) {
                    $query->where('organization_id', $value);
                }),
                AllowedFilter::callback('fuel_id', function ($query, $value) {
                    $query->where('fuel_id', $value);
                }),
            ])
            ->allowedSorts(['id', 'name', 'ucode', 'model', 'type', 'organization_id', 'fuel_id'])
            ->paginate(15);
    
        return inertia('Vehicles/Index', [
            'vehicles' => VehicleResource::collection($vehicles)
        ]);
    }

    // this is for api
    public function getAllVehicles(Request $request)
    {
        return VehicleResource::collection(
            Vehicle::select('id', 'name', 'ucode', 'model', 'type','fuel_id')
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

        return redirect()->route('vehicles.index')->with('success', 'Vehicle created successfully');
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

        return redirect()->route('vehicles.index')->with('success', 'Vehicle updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();

        return redirect()->route('vehicles.index')->with('success', 'Vehicle deleted successfully');
    }
}
