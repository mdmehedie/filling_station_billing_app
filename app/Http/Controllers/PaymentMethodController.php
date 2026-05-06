<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethodTypeEnums;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return inertia('PaymentMethods/Index', [
            'paymentMethods' => PaymentMethod::query()->latest('id')->get(),
            'types' => PaymentMethodTypeEnums::getValues(),
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
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'account_name' => 'nullable|string|max:255',
            'account_no' => 'nullable|string|max:255',
            'branch_name' => 'nullable|string|max:255',
            'type' => 'required|string',
            'note' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        PaymentMethod::create($validated);

        return back()->with('success', 'Payment method created successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'account_name' => 'nullable|string|max:255',
            'account_no' => 'nullable|string|max:255',
            'branch_name' => 'nullable|string|max:255',
            'type' => 'required|string',
            'note' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $paymentMethod->update($validated);

        return back()->with('success', 'Payment method updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PaymentMethod $paymentMethod)
    {
        $paymentMethod->delete();

        return back()->with('success', 'Payment method deleted successfully');
    }
}
