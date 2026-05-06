<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\Payment;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        return inertia('Payments/Create', [
            'organizations' => Organization::select(['id', 'name', 'ucode'])->get(),
            'paymentMethods' => PaymentMethod::query()->where('is_active', '=', true)->get(),
            'selected_organization_id' => $request->get('organization_id'),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'tnx_id' => 'nullable|string|max:255',
            'note' => 'nullable|string',
            'proof' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        if ($request->hasFile('proof')) {
            $path = $request->file('proof')->store('payments/proofs', 'public');
            $validated['proof'] = [$path];
        }

        Payment::create($validated);

        return redirect()->route('organizations.index')->with('success', 'Payment recorded successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Payment $payment)
    {
        return inertia('Payments/Edit', [
            'payment' => $payment,
            'organizations' => Organization::select(['id', 'name', 'ucode'])->get(),
            'paymentMethods' => PaymentMethod::query()->where('is_active', '=', true)->get(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'tnx_id' => 'nullable|string|max:255',
            'note' => 'nullable|string',
            'proof' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        if ($request->hasFile('proof')) {
            // Delete old proof
            if ($payment->proof && is_array($payment->proof)) {
                foreach ($payment->proof as $path) {
                    Storage::disk('public')->delete($path);
                }
            }
            $path = $request->file('proof')->store('payments/proofs', 'public');
            $validated['proof'] = [$path];
        }

        $payment->update($validated);

        return redirect()->route('payments.index')->with('success', 'Payment record updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payment $payment)
    {
        if ($payment->proof && is_array($payment->proof)) {
            foreach ($payment->proof as $path) {
                Storage::disk('public')->delete($path);
            }
        }

        $payment->delete();

        return back()->with('success', 'Payment record deleted successfully');
    }
}
