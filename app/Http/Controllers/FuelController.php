<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFuelRequest;
use App\Http\Requests\UpdateFuelRequest;
use App\Models\Fuel;
use App\Http\Resources\FuelResource;

class FuelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return inertia('Fuel/Index', [
            'fuels' => FuelResource::collection(Fuel::paginate(15))
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia('Fuel/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreFuelRequest $request)
    {
        $validated = $request->validated();

        $fuel = Fuel::create($validated);

        return redirect()->route('fuels.index')->with('success', "Fuel {$fuel->name} created successfully");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Fuel $fuel)
    {
        return inertia('Fuel/Edit', [
            'fuel' => FuelResource::make($fuel)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateFuelRequest $request, Fuel $fuel)
    {
        $validated = $request->validated();

        $fuel->update($validated);

        return redirect()->route('fuels.index')->with('success', "Fuel {$fuel->name} updated successfully");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Fuel $fuel)
    {
        try {
            $fuel->delete();
            return redirect()->route('fuels.index')->with( 'success', "Fuel {$fuel->name} deleted successfully");
        } catch (\Exception $e) {
            return redirect()->route('fuels.index')->with('error', "Fuel {$fuel->name} cannot be deleted because it is associated with a vehicle");
        }

    }
}
