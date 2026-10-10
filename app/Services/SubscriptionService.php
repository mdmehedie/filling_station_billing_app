<?php

namespace App\Services;

use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubscriptionService
{
    public const START = '2026-09-01';

    public const PLANS = [
        'monthly' => ['name' => 'Monthly', 'months' => 1, 'amount' => 2000],
        'six_months' => ['name' => '6 Months', 'months' => 6, 'amount' => 11000],
        'yearly' => ['name' => 'Yearly', 'months' => 12, 'amount' => 20000],
    ];

    public function calculateCoverage(Carbon $start, int $months): array
    {
        $from = $start->copy()->startOfMonth();

        return [$from, $from->copy()->addMonthsNoOverflow($months)->subDay()];
    }

    public function nextUnpaidMonth(User $user): Carbon
    {
        $next = Carbon::parse(self::START);
        $approved = SubscriptionPayment::where('user_id', $user->id)
            ->where('status', 'approved')->orderBy('coverage_start')->get();
        foreach ($approved as $payment) {
            if ($payment->coverage_start->isSameDay($next)) {
                $next = $payment->coverage_end->copy()->addDay()->startOfMonth();
            }
        }

        return $next;
    }

    public function latestApprovedCoverage(User $user): ?SubscriptionPayment
    {
        return SubscriptionPayment::where('user_id', $user->id)->where('status', 'approved')
            ->orderByDesc('coverage_end')->first();
    }

    public function pendingPayment(User $user): ?SubscriptionPayment
    {
        return SubscriptionPayment::where('user_id', $user->id)->where('status', 'pending')->first();
    }

    public function isCurrentlyCovered(User $user, ?Carbon $now = null): bool
    {
        $now ??= now();

        return $now->greaterThanOrEqualTo(Carbon::parse(self::START))
            && $this->nextUnpaidMonth($user)->greaterThan($now->copy()->startOfMonth());
    }

    public function hasPaymentDue(User $user, ?Carbon $now = null): bool
    {
        $now ??= now();

        return $now->greaterThanOrEqualTo(Carbon::parse(self::START))
            && $this->nextUnpaidMonth($user)->lessThanOrEqualTo($now->copy()->startOfMonth());
    }

    public function status(User $user): array
    {
        $next = $this->nextUnpaidMonth($user);
        $latest = $this->latestApprovedCoverage($user);
        $pending = $this->pendingPayment($user);
        $covered = $this->isCurrentlyCovered($user);

        return [
            'state' => $covered ? 'covered' : ($pending ? 'pending' : ($this->hasPaymentDue($user) ? 'due' : 'not_started')),
            'coverage_start' => $covered ? $latest?->coverage_start?->toDateString() : null,
            'coverage_end' => $covered ? $latest?->coverage_end?->toDateString() : null,
            'covered_until' => $latest?->coverage_end?->toDateString(),
            'next_unpaid_month' => $next->toDateString(),
            'payment_due' => $this->hasPaymentDue($user),
            'pending_payment' => $pending,
        ];
    }

    public function submit(User $user, string $planCode, string $transactionId): SubscriptionPayment
    {
        abort_unless($user->role === 'admin', 403);
        if (! isset(self::PLANS[$planCode])) {
            throw ValidationException::withMessages(['plan_code' => 'Invalid package.']);
        }
        if (now()->lt(Carbon::parse(self::START))) {
            throw ValidationException::withMessages(['plan_code' => 'Payments start in September 2026.']);
        }

        try {
            return DB::transaction(function () use ($user, $planCode, $transactionId) {
                User::whereKey($user->id)->lockForUpdate()->firstOrFail();
                if ($this->pendingPayment($user)) {
                    throw ValidationException::withMessages(['plan_code' => 'A payment is already pending verification.']);
                }
                if (SubscriptionPayment::where('transaction_id', $transactionId)->exists()) {
                    throw ValidationException::withMessages(['transaction_id' => 'This transaction ID has already been submitted.']);
                }
                $plan = self::PLANS[$planCode];
                [$start, $end] = $this->calculateCoverage($this->nextUnpaidMonth($user), $plan['months']);

                return SubscriptionPayment::create([
                    'user_id' => $user->id,
                    'plan_code' => $planCode,
                    'plan_name' => $plan['name'],
                    'duration_months' => $plan['months'],
                    'amount' => $plan['amount'],
                    'payment_method' => 'bkash_send_money',
                    'transaction_id' => $transactionId,
                    'coverage_start' => $start,
                    'coverage_end' => $end,
                    'submitted_at' => now(),
                    'status' => 'pending',
                ]);
            });
        } catch (QueryException $exception) {
            if (in_array($exception->getCode(), ['23000', '23505', '19'], true)
                && str_contains(strtolower($exception->getMessage()), 'transaction_id')) {
                throw ValidationException::withMessages(['transaction_id' => 'This transaction ID has already been submitted.']);
            }
            throw $exception;
        }
    }

    public function approve(SubscriptionPayment $payment, User $admin): SubscriptionPayment
    {
        abort_unless($admin->role === 'superadmin', 403);

        return DB::transaction(function () use ($payment, $admin) {
            User::whereKey($payment->user_id)->lockForUpdate()->firstOrFail();
            $payment = SubscriptionPayment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            if ($payment->status === 'approved') {
                return $payment;
            }
            if ($payment->status !== 'pending') {
                throw ValidationException::withMessages(['payment' => 'Only pending payments can be approved.']);
            }
            if (! $payment->coverage_start->isSameDay($this->nextUnpaidMonth($payment->user))) {
                throw ValidationException::withMessages(['payment' => 'Coverage no longer begins at the earliest unpaid month.']);
            }
            $payment->update([
                'status' => 'approved', 'approved_by' => $admin->id, 'approved_at' => now(),
                'invoice_number' => sprintf('INV-%s-%06d', now()->format('Y'), $payment->id),
                'receipt_number' => sprintf('MR-%s-%06d', now()->format('Y'), $payment->id),
            ]);

            return $payment;
        });
    }

    public function reject(SubscriptionPayment $payment, User $admin, ?string $reason): SubscriptionPayment
    {
        abort_unless($admin->role === 'superadmin', 403);

        return DB::transaction(function () use ($payment, $admin, $reason) {
            User::whereKey($payment->user_id)->lockForUpdate()->firstOrFail();
            $payment = SubscriptionPayment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            if ($payment->status === 'rejected') {
                return $payment;
            }
            if ($payment->status !== 'pending') {
                throw ValidationException::withMessages(['payment' => 'Only pending payments can be rejected.']);
            }
            $payment->update(['status' => 'rejected', 'rejected_by' => $admin->id,
                'rejected_at' => now(), 'rejection_reason' => $reason]);

            return $payment;
        });
    }
}
