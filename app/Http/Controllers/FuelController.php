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
            'fuels' => FuelResource::collection(Fuel::paginate(3))
        ]);
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
    public function store(StoreFuelRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Fuel $fuel)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Fuel $fuel)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateFuelRequest $request, Fuel $fuel)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Fuel $fuel)
    {
        //
    }
}
