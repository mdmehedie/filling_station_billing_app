<?php

use App\Models\SubscriptionPayment;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

function subscriber(): User
{
    return User::factory()->create(['role' => 'admin', 'status' => 'active']);
}

function subscriptionSuperAdmin(): User
{
    return User::factory()->create(['role' => 'superadmin', 'status' => 'active']);
}

function submitSubscription(User $user, string $plan = 'monthly', string $trx = 'ABC123'): SubscriptionPayment
{
    return app(SubscriptionService::class)->submit($user, $plan, $trx);
}

it('requires no payment or navbar warning before September 2026 and blocks early submission', function () {
    Carbon::setTestNow('2026-08-31');
    $user = subscriber();
    $service = app(SubscriptionService::class);
    expect($service->hasPaymentDue($user))->toBeFalse()
        ->and($service->nextUnpaidMonth($user)->toDateString())->toBe('2026-09-01');
    $this->actingAs($user)->get('/subscription-payments')->assertInertia(fn (Assert $page) => $page
        ->where('subscription.state', 'not_started')
        ->where('subscriptionPaymentDue', false)->etc());
    $this->actingAs($user)->post('/subscription-payments', ['plan_code' => 'monthly', 'transaction_id' => 'EARLY123'])->assertSessionHasErrors('plan_code');
    expect(SubscriptionPayment::count())->toBe(0);
    Carbon::setTestNow();
});

it('calculates monthly six month and yearly coverage across years', function () {
    $service = app(SubscriptionService::class);
    [$start, $end] = $service->calculateCoverage(Carbon::parse('2026-09-01'), 1);
    expect($start->toDateString())->toBe('2026-09-01')->and($end->toDateString())->toBe('2026-09-30');
    [, $end] = $service->calculateCoverage($start, 6);
    expect($end->toDateString())->toBe('2027-02-28');
    [, $end] = $service->calculateCoverage($start, 12);
    expect($end->toDateString())->toBe('2027-08-31');
    [, $end] = $service->calculateCoverage(Carbon::parse('2027-11-01'), 6);
    expect($end->toDateString())->toBe('2028-04-30');
});

it('starts after several overdue months and ignores manipulated price and coverage', function () {
    Carbon::setTestNow('2026-12-15');
    $user = subscriber();
    $this->actingAs($user)->post('/subscription-payments', [
        'plan_code' => 'six_months', 'transaction_id' => 'OVERDUE1',
        'amount' => 1, 'coverage_start' => '2026-12-01', 'coverage_end' => '2027-05-31',
    ])->assertSessionHasErrors(['amount', 'coverage_start', 'coverage_end']);
    expect(SubscriptionPayment::count())->toBe(0);
    $this->actingAs($user)->post('/subscription-payments', ['plan_code' => 'six_months', 'transaction_id' => 'OVERDUE1'])->assertRedirect();
    $payment = SubscriptionPayment::firstOrFail();
    expect($payment->amount)->toBe('11000.00')->and($payment->coverage_start->toDateString())->toBe('2026-09-01')
        ->and($payment->coverage_end->toDateString())->toBe('2027-02-28');
    Carbon::setTestNow();
});

it('does not count pending or rejected payments and permits resubmission', function () {
    Carbon::setTestNow('2026-10-10');
    $user = subscriber();
    $admin = subscriptionSuperAdmin();
    $service = app(SubscriptionService::class);
    $payment = submitSubscription($user);
    expect($service->nextUnpaidMonth($user)->toDateString())->toBe('2026-09-01')
        ->and($service->hasPaymentDue($user))->toBeTrue();
    $service->reject($payment, $admin, 'Wrong TrxID');
    expect($service->nextUnpaidMonth($user)->toDateString())->toBe('2026-09-01');
    $replacement = submitSubscription($user, 'monthly', 'NEWTRX2');
    expect($replacement->coverage_start->toDateString())->toBe('2026-09-01');
    Carbon::setTestNow();
});

it('blocks duplicate pending requests and transaction IDs even after rejection', function () {
    Carbon::setTestNow('2026-10-10');
    $user = subscriber();
    $admin = subscriptionSuperAdmin();
    $payment = submitSubscription($user);
    $this->actingAs($user)->post('/subscription-payments', ['plan_code' => 'yearly', 'transaction_id' => 'SECOND2'])->assertSessionHasErrors('plan_code');
    app(SubscriptionService::class)->reject($payment, $admin, null);
    $this->actingAs($user)->post('/subscription-payments', ['plan_code' => 'monthly', 'transaction_id' => 'ABC123'])->assertSessionHasErrors('transaction_id');
    expect(SubscriptionPayment::count())->toBe(1);
    Carbon::setTestNow();
});

it('advances only approved contiguous coverage and switches navbar warning at month boundaries', function () {
    Carbon::setTestNow('2026-10-10');
    $user = subscriber();
    $admin = subscriptionSuperAdmin();
    $service = app(SubscriptionService::class);
    expect($service->hasPaymentDue($user))->toBeTrue();
    $payment = submitSubscription($user, 'six_months');
    $service->approve($payment, $admin);
    expect($service->nextUnpaidMonth($user)->toDateString())->toBe('2027-03-01')
        ->and($service->hasPaymentDue($user))->toBeFalse();
    $this->actingAs($user)->get('/subscription-payments')->assertInertia(fn (Assert $page) => $page->where('subscriptionPaymentDue', false)->etc());
    Carbon::setTestNow('2027-03-01');
    expect($service->hasPaymentDue($user))->toBeTrue();
    $this->actingAs($user)->get('/subscription-payments')->assertInertia(fn (Assert $page) => $page->where('subscriptionPaymentDue', true)->etc());
    Carbon::setTestNow();
});

it('makes yearly coverage due in the following September', function () {
    Carbon::setTestNow('2026-09-10');
    $user = subscriber();
    $admin = subscriptionSuperAdmin();
    $service = app(SubscriptionService::class);
    $service->approve(submitSubscription($user, 'yearly'), $admin);
    Carbon::setTestNow('2027-08-31');
    expect($service->hasPaymentDue($user))->toBeFalse();
    Carbon::setTestNow('2027-09-01');
    expect($service->hasPaymentDue($user))->toBeTrue();
    Carbon::setTestNow();
});

it('does not permit a customer to approve or see another customer financial records', function () {
    Carbon::setTestNow('2026-10-10');
    $owner = subscriber();
    $stranger = subscriber();
    $admin = subscriptionSuperAdmin();
    $payment = submitSubscription($owner);
    $this->actingAs($stranger)->post("/admin/subscription-payments/{$payment->id}/approve")->assertForbidden();
    $this->actingAs($stranger)->get("/subscription-payments/{$payment->id}/invoice")->assertForbidden();
    $this->actingAs($stranger)->get("/subscription-payments/{$payment->id}/receipt")->assertForbidden();
    $this->actingAs($owner)->get("/subscription-payments/{$payment->id}/invoice")->assertNotFound();
    $this->actingAs($owner)->get("/subscription-payments/{$payment->id}/receipt")->assertNotFound();
    app(SubscriptionService::class)->approve($payment, $admin);
    $this->actingAs($stranger)->get("/subscription-payments/{$payment->id}/invoice")->assertForbidden();
    $this->actingAs($stranger)->get("/subscription-payments/{$payment->id}/receipt")->assertForbidden();
    $this->actingAs($stranger)->get('/subscription-payments')->assertInertia(fn (Assert $page) => $page->has('payments.data', 0)->etc());
    Carbon::setTestNow();
});

it('paginates payment history without showing another admins payments', function () {
    Carbon::setTestNow('2026-10-10');
    $admin = subscriber();
    $otherAdmin = subscriber();
    foreach (range(1, 12) as $number) {
        SubscriptionPayment::create([
            'user_id' => $admin->id,
            'plan_code' => 'monthly',
            'plan_name' => 'Monthly',
            'duration_months' => 1,
            'amount' => 2000,
            'payment_method' => 'bkash_send_money',
            'transaction_id' => "HISTORY{$number}",
            'coverage_start' => '2026-09-01',
            'coverage_end' => '2026-09-30',
            'status' => 'rejected',
            'submitted_at' => now()->subDays($number),
        ]);
    }
    SubscriptionPayment::create([
        'user_id' => $otherAdmin->id,
        'plan_code' => 'monthly',
        'plan_name' => 'Monthly',
        'duration_months' => 1,
        'amount' => 2000,
        'payment_method' => 'bkash_send_money',
        'transaction_id' => 'OTHERHISTORY',
        'coverage_start' => '2026-09-01',
        'coverage_end' => '2026-09-30',
        'status' => 'rejected',
        'submitted_at' => now(),
    ]);

    $this->actingAs($admin)->get('/subscription-payments')->assertInertia(fn (Assert $page) => $page
        ->where('payments.total', 12)
        ->where('payments.current_page', 1)
        ->has('payments.data', 10)
        ->etc());
    $this->actingAs($admin)->get('/subscription-payments?page=2')->assertInertia(fn (Assert $page) => $page
        ->where('payments.total', 12)
        ->where('payments.current_page', 2)
        ->has('payments.data', 2)
        ->etc());
    Carbon::setTestNow();
});

it('keeps approval idempotent and creates one pair of document numbers', function () {
    Carbon::setTestNow('2026-10-10');
    $user = subscriber();
    $admin = subscriptionSuperAdmin();
    $service = app(SubscriptionService::class);
    $payment = submitSubscription($user);
    $staleRequestPayment = SubscriptionPayment::findOrFail($payment->id);
    $first = $service->approve($payment, $admin);
    $approvedAt = $first->approved_at->toDateTimeString();
    $second = $service->approve($staleRequestPayment, $admin);
    expect($second->invoice_number)->toBe('INV-2026-000001')
        ->and($second->receipt_number)->toBe('MR-2026-000001')
        ->and($second->approved_at->toDateTimeString())->toBe($approvedAt)
        ->and(SubscriptionPayment::where('status', 'approved')->count())->toBe(1)
        ->and($service->nextUnpaidMonth($user)->toDateString())->toBe('2026-10-01');
    Carbon::setTestNow();
});

it('restricts customer routes to admins and management to superadmins', function () {
    Carbon::setTestNow('2026-10-10');
    $user = subscriber();
    $admin = subscriptionSuperAdmin();
    $this->actingAs($admin)->get('/subscription-payments')->assertForbidden();
    $this->actingAs($admin)->post('/subscription-payments', ['plan_code' => 'monthly', 'transaction_id' => 'ADMINTRX'])->assertForbidden();
    $this->actingAs($user)->get('/admin/subscription-payments')->assertForbidden();
    $this->actingAs($admin)->get('/admin/subscription-payments')->assertOk();
    Carbon::setTestNow();
});

it('shows accurate admin payment counts and filters the review queue', function () {
    Carbon::setTestNow('2026-10-10');
    $superadmin = subscriptionSuperAdmin();
    $pending = submitSubscription(subscriber(), 'monthly', 'QUEUETRX1');
    $approved = submitSubscription(subscriber(), 'monthly', 'QUEUETRX2');
    $rejected = submitSubscription(subscriber(), 'monthly', 'QUEUETRX3');
    $service = app(SubscriptionService::class);
    $service->approve($approved, $superadmin);
    $service->reject($rejected, $superadmin, 'Incorrect TrxID');

    $this->actingAs($superadmin)->get('/admin/subscription-payments?status=pending')->assertInertia(fn (Assert $page) => $page
        ->component('SubscriptionPayments/Admin')
        ->where('statusCounts.all', 3)
        ->where('statusCounts.pending', 1)
        ->where('statusCounts.approved', 1)
        ->where('statusCounts.rejected', 1)
        ->has('payments.data', 1)
        ->where('payments.data.0.id', $pending->id)
        ->etc());

    $this->actingAs($superadmin)->get('/admin/subscription-payments?customer='.urlencode($approved->user->name).'&status=approved')->assertInertia(fn (Assert $page) => $page
        ->has('payments.data', 1)
        ->where('payments.data.0.id', $approved->id)
        ->etc());

    $this->actingAs($superadmin)->get("/admin/subscription-payments/{$rejected->id}")->assertInertia(fn (Assert $page) => $page
        ->component('SubscriptionPayments/Show')
        ->where('payment.status', 'rejected')
        ->where('payment.rejection_reason', 'Incorrect TrxID')
        ->etc());
    Carbon::setTestNow();
});

it('provides approved invoice and receipt PDFs with stable numbers', function () {
    Carbon::setTestNow('2026-10-10');
    $user = subscriber();
    $admin = subscriptionSuperAdmin();
    $payment = submitSubscription($user, 'monthly', 'PDFTRX1');
    $this->actingAs($admin)->post("/admin/subscription-payments/{$payment->id}/approve")->assertRedirect();
    $payment->refresh();
    $payment->load(['user', 'approver']);
    $invoiceHtml = view('subscription-document-pdf', ['payment' => $payment, 'type' => 'invoice'])->render();
    $receiptHtml = view('subscription-document-pdf', ['payment' => $payment, 'type' => 'receipt'])->render();
    $invoice = $this->actingAs($user)->get("/subscription-payments/{$payment->id}/invoice");
    $receipt = $this->actingAs($user)->get("/subscription-payments/{$payment->id}/receipt");
    $invoice->assertOk()->assertHeader('Content-Type', 'application/pdf');
    $receipt->assertOk()->assertHeader('Content-Type', 'application/pdf');
    expect($invoice->getContent())->toStartWith('%PDF')
        ->and($receipt->getContent())->toStartWith('%PDF')
        ->and($payment->invoice_number)->toBe('INV-2026-000001')
        ->and($payment->receipt_number)->toBe('MR-2026-000001')
        ->and($invoiceHtml)->toContain('Head of Filling Station,<br>CSD Filling Station', 'csdfillingstation@gmail.com')
        ->and($receiptHtml)->toContain('Head of Filling Station,<br>CSD Filling Station', 'csdfillingstation@gmail.com', 'Texon Software Solutions')
        ->and($payment->approved_by)->toBe($admin->id);
    Carbon::setTestNow();
});

it('does not let rejection overwrite an approved financial record', function () {
    Carbon::setTestNow('2026-10-10');
    $user = subscriber();
    $admin = subscriptionSuperAdmin();
    $payment = submitSubscription($user);
    app(SubscriptionService::class)->approve($payment, $admin);
    $this->actingAs($admin)->post("/admin/subscription-payments/{$payment->id}/reject", ['rejection_reason' => 'late'])->assertSessionHasErrors('payment');
    expect($payment->fresh()->status)->toBe('approved');
    Carbon::setTestNow();
});

it('keeps regular users outside subscription payments while admins pay', function () {
    Carbon::setTestNow('2026-10-10');
    $regular = User::factory()->create(['role' => 'user', 'status' => 'active']);
    $admin = subscriber();
    $this->actingAs($regular)->get('/subscription-payments')->assertForbidden();
    $this->actingAs($regular)->get('/subscription-payments/pay')->assertForbidden();
    $this->actingAs($regular)->post('/subscription-payments', ['plan_code' => 'monthly', 'transaction_id' => 'REGULAR1'])->assertForbidden();
    $this->actingAs($admin)->get('/subscription-payments')->assertOk();
    $this->actingAs($admin)->get('/admin/subscription-payments')->assertForbidden();
    $this->actingAs($regular)->get('/settings/profile')->assertInertia(fn (Assert $page) => $page->where('subscriptionPaymentDue', false)->etc());
    Carbon::setTestNow();
});

it('allows only superadmins to approve or reject even through the service', function () {
    Carbon::setTestNow('2026-10-10');
    $payer = subscriber();
    $otherAdmin = subscriber();
    $superadmin = subscriptionSuperAdmin();
    $payment = submitSubscription($payer);
    $this->actingAs($otherAdmin)->post("/admin/subscription-payments/{$payment->id}/approve")->assertForbidden();
    $this->actingAs($otherAdmin)->post("/admin/subscription-payments/{$payment->id}/reject")->assertForbidden();
    expect(fn () => app(SubscriptionService::class)->approve($payment, $otherAdmin))->toThrow(\Symfony\Component\HttpKernel\Exception\HttpException::class);
    expect($payment->fresh()->status)->toBe('pending');
    $this->actingAs($superadmin)->post("/admin/subscription-payments/{$payment->id}/approve")->assertRedirect();
    expect($payment->fresh()->approved_by)->toBe($superadmin->id);
    Carbon::setTestNow();
});

it('lets superadmins use existing admin pages and protects superadmin accounts', function () {
    $admin = subscriber();
    $superadmin = subscriptionSuperAdmin();
    $this->actingAs($superadmin)->get('/users')->assertOk();
    $this->actingAs($superadmin)->delete("/users/{$superadmin->id}")->assertStatus(422);
    $this->actingAs($admin)->get("/users/{$superadmin->id}/edit")->assertForbidden();
    $this->actingAs($admin)->patch("/users/{$superadmin->id}", ['role' => 'admin'])->assertForbidden();
    $this->actingAs($admin)->delete("/users/{$superadmin->id}")->assertForbidden();
    $ordinary = User::factory()->create(['role' => 'user']);
    $this->actingAs($admin)->patch("/users/{$ordinary->id}", ['role' => 'superadmin'])->assertSessionHasErrors('role');
    expect($ordinary->fresh()->role)->toBe('user');
    $this->actingAs($admin)->post('/users', [
        'name' => 'New Owner', 'email' => 'owner@example.com', 'phone' => '01911111111',
        'password' => 'password123', 'role' => 'superadmin', 'status' => 'active',
    ])->assertSessionHasErrors('role');
    $this->assertDatabaseMissing('users', ['email' => 'owner@example.com']);
    $this->actingAs($superadmin)->post('/users', [
        'name' => 'New Owner', 'email' => 'owner@example.com', 'phone' => '01911111111',
        'password' => 'password123', 'role' => 'superadmin', 'status' => 'active',
    ])->assertRedirect();
    $this->assertDatabaseHas('users', ['email' => 'owner@example.com', 'role' => 'superadmin']);
});
