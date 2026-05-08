<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethodTypeEnums;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Enum;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $payments = Payment::with(['organization:id,name,ucode', 'bankAccount:id,name', 'creator:id,name'])
            ->where('is_deleted', false)
            ->latest('payment_date')
            ->paginate(10);

        return inertia('Payments/Index', [
            'payments' => \App\Http\Resources\PaymentResource::collection($payments),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $organization = null;
        if ($request->has('organization_id')) {
            $organization = Organization::find($request->get('organization_id'), ['id', 'name', 'ucode']);
        }

        return inertia('Payments/Create', [
            'organization' => $organization,
            'organizations' => $organization ? [] : Organization::select(['id', 'name', 'ucode'])->get(),
            'bankAccounts' => BankAccount::query()->where('is_active', '=', true)->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'bank_account_id' => 'required_if:method,bank|nullable|exists:bank_accounts,id',
            'method' => ['required', 'string', new Enum(PaymentMethodTypeEnums::class)],
            'type' => 'required|in:prev_paid,regular_paid',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'tnx_id' => 'nullable|string|max:255',
            'note' => 'nullable|string',
            'sender_bank' => 'nullable|string|max:255',
            'proof' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        if ($request->hasFile('proof')) {
            $path = $request->file('proof')->store('payments/proofs', 'public');
            $validated['proof'] = [$path];
        }

        $validated['created_by'] = $request->user()->id;
        $validated['updated_by'] = $request->user()->id;

        Payment::create($validated);

        return redirect()->route('organizations.show', $validated['organization_id'])->with('success', 'Payment recorded successfully');
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
        $payment->load('organization:id,name,ucode');

        return inertia('Payments/Edit', [
            'payment' => $payment,
            'organization' => $payment->organization,
            'bankAccounts' => BankAccount::query()->where('is_active', '=', true)->get(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'bank_account_id' => 'required_if:method,bank|nullable|exists:bank_accounts,id',
            'method' => 'required|string|in:cash,bank,check',
            'type' => 'required|in:prev_paid,regular_paid',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'tnx_id' => 'nullable|string|max:255',
            'note' => 'nullable|string',
            'sender_bank' => 'nullable|string|max:255',
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

        $validated['updated_by'] = $request->user()->id;

        $payment->update($validated);

        return redirect()->route('organizations.show', $validated['organization_id'])->with('success', 'Payment record updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payment $payment)
    {
        $payment->update(['is_deleted' => true]);

        return back()->with('success', 'Payment record deleted successfully');
    }
}
