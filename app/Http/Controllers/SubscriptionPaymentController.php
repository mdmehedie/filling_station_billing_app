<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPayment;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Pontedilana\PhpWeasyPrint\Pdf;

class SubscriptionPaymentController extends Controller
{
    public function __construct(private SubscriptionService $subscriptions) {}

    public function index(Request $request)
    {
        $this->customer($request);

        return inertia('SubscriptionPayments/Index', [
            'subscription' => $this->subscriptions->status($request->user()),
            'payments' => SubscriptionPayment::where('user_id', $request->user()->id)
                ->latest('submitted_at')->latest('id')->paginate(10),
        ]);
    }

    public function create(Request $request)
    {
        $this->customer($request);
        $start = $this->subscriptions->nextUnpaidMonth($request->user());
        $plans = [];
        foreach (SubscriptionService::PLANS as $code => $plan) {
            [, $end] = $this->subscriptions->calculateCoverage($start, $plan['months']);
            $plans[] = ['code' => $code, ...$plan, 'coverage_start' => $start->toDateString(), 'coverage_end' => $end->toDateString()];
        }

        return inertia('SubscriptionPayments/Create', [
            'plans' => $plans,
            'subscription' => $this->subscriptions->status($request->user()),
            'bkashNumber' => '01751763310',
        ]);
    }

    public function store(Request $request)
    {
        $this->customer($request);
        $data = $request->validate([
            'plan_code' => ['required', Rule::in(array_keys(SubscriptionService::PLANS))],
            'transaction_id' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9-]+$/'],
            'amount' => ['prohibited'], 'coverage_start' => ['prohibited'],
            'coverage_end' => ['prohibited'], 'user_id' => ['prohibited'],
        ]);
        $this->subscriptions->submit($request->user(), $data['plan_code'], strtoupper($data['transaction_id']));

        return redirect()->route('subscription-payments.index')->with('success', 'Payment submitted for verification.');
    }

    public function invoice(Request $request, SubscriptionPayment $subscriptionPayment)
    {
        return $this->document($request, $subscriptionPayment, 'invoice');
    }

    public function receipt(Request $request, SubscriptionPayment $subscriptionPayment)
    {
        return $this->document($request, $subscriptionPayment, 'receipt');
    }

    private function document(Request $request, SubscriptionPayment $payment, string $type)
    {
        abort_unless($request->user()->role === 'superadmin' || ($request->user()->role === 'admin' && $payment->user_id === $request->user()->id), 403);
        abort_unless($payment->status === 'approved', 404);
        $payment->load(['user', 'approver']);
        $pdf = new Pdf(env('WEASYPRINT_BINARY', '/opt/homebrew/bin/weasyprint'));
        $pdf->setTimeout(env('WEASYPRINT_TIMEOUT', 3600));
        $output = $pdf->getOutputFromHtml(view('subscription-document-pdf', compact('payment', 'type'))->render());
        $number = $type === 'invoice' ? $payment->invoice_number : $payment->receipt_number;

        return response($output, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$number.'.pdf"',
        ]);
    }

    private function customer(Request $request): void
    {
        abort_unless($request->user()->role === 'admin', 403);
    }
}
