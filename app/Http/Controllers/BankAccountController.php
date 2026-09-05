<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return inertia('BankAccounts/Index', [
            'bankAccounts' => BankAccount::query()->latest('id')->get(),
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
            'note' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        BankAccount::create($validated);

        return back()->with('success', 'Bank information created successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BankAccount $bankAccount)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'account_name' => 'nullable|string|max:255',
            'account_no' => 'nullable|string|max:255',
            'branch_name' => 'nullable|string|max:255',
            'note' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $bankAccount->update($validated);

        return back()->with('success', 'Bank information updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BankAccount $bankAccount)
    {
        $bankAccount->delete();

        return back()->with('success', 'Bank information deleted successfully');
    }
}
