<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPayment;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminSubscriptionPaymentController extends Controller
{
    public function __construct(private SubscriptionService $subscriptions) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])],
            'customer' => ['nullable', 'string', 'max:100'],
            'from' => ['nullable', 'date'], 'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);
        $payments = SubscriptionPayment::with('user:id,name,email,phone')
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['customer'] ?? null, fn ($q, $v) => $q->whereHas('user', fn ($u) => $u->where('name', 'like', '%'.$v.'%')))
            ->when($filters['from'] ?? null, fn ($q, $v) => $q->whereDate('submitted_at', '>=', $v))
            ->when($filters['to'] ?? null, fn ($q, $v) => $q->whereDate('submitted_at', '<=', $v))
            ->latest('submitted_at')->paginate(20)->withQueryString();

        $counts = SubscriptionPayment::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return inertia('SubscriptionPayments/Admin', [
            'payments' => $payments,
            'filters' => $filters,
            'statusCounts' => [
                'all' => $counts->sum(),
                'pending' => (int) ($counts['pending'] ?? 0),
                'approved' => (int) ($counts['approved'] ?? 0),
                'rejected' => (int) ($counts['rejected'] ?? 0),
            ],
        ]);
    }

    public function show(SubscriptionPayment $subscriptionPayment)
    {
        return inertia('SubscriptionPayments/Show', ['payment' => $subscriptionPayment->load(['user:id,name,email,phone', 'approver:id,name'])]);
    }

    public function approve(Request $request, SubscriptionPayment $subscriptionPayment)
    {
        $this->subscriptions->approve($subscriptionPayment, $request->user());

        return back()->with('success', 'Payment approved.');
    }

    public function reject(Request $request, SubscriptionPayment $subscriptionPayment)
    {
        $data = $request->validate(['rejection_reason' => ['nullable', 'string', 'max:1000']]);
        $this->subscriptions->reject($subscriptionPayment, $request->user(), $data['rejection_reason'] ?? null);

        return back()->with('success', 'Payment rejected.');
    }
}
