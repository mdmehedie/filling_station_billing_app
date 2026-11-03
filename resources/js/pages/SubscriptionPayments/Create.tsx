import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    CircleCheck,
    Clock3,
    Copy,
    CreditCard,
    Info,
    LoaderCircle,
    ReceiptText,
    Smartphone,
} from 'lucide-react';
import { useState } from 'react';
import { Subscription, date, money } from './types';

interface Plan {
    code: string;
    name: string;
    months: number;
    amount: number;
    coverage_start: string;
    coverage_end: string;
}

interface Props {
    plans: Plan[];
    subscription: Subscription;
    bkashNumber: string;
}

export default function Create({ plans, subscription, bkashNumber }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        plan_code: 'monthly',
        transaction_id: '',
    });
    const [copied, setCopied] = useState(false);
    const selected =
        plans.find((plan) => plan.code === data.plan_code) ?? plans[0];
    const monthlyAmount =
        plans.find((plan) => plan.code === 'monthly')?.amount ?? 0;
    const paymentBlocked =
        !!subscription.pending_payment || subscription.state === 'not_started';

    const copyNumber = async () => {
        try {
            await navigator.clipboard.writeText(bkashNumber);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Payments', href: '/subscription-payments' },
                { title: 'Pay Now', href: '/subscription-payments/pay' },
            ]}
        >
            <Head title="Pay Now" />
            <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Complete your subscription
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            Choose a plan, send the amount with bKash, and
                            submit your transaction ID for verification.
                        </p>
                    </div>
                    <Link
                        href="/subscription-payments"
                        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Payment history
                    </Link>
                </div>
                <ol className="grid gap-4 border-b pb-5 sm:grid-cols-3 sm:gap-0">
                    {[
                        ['01', 'Choose your plan'],
                        ['02', 'Send money with bKash'],
                        ['03', 'Submit your TrxID for verification'],
                    ].map(([number, label], index) => (
                        <li
                            key={number}
                            className={`flex items-center gap-3 ${index > 0 ? 'sm:border-l sm:pl-6' : ''}`}
                        >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-600 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                {number}
                            </span>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Step {index + 1}
                                </p>
                                <p className="text-sm font-semibold">{label}</p>
                            </div>
                        </li>
                    ))}
                </ol>

                {subscription.pending_payment && (
                    <div
                        role="status"
                        className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
                    >
                        <Clock3 className="mt-0.5 size-5 shrink-0" />
                        <div>
                            <p className="font-semibold">
                                Your payment is pending verification
                            </p>
                            <p className="mt-1 text-sm opacity-80">
                                TrxID{' '}
                                {subscription.pending_payment.transaction_id} is
                                already submitted. You can review it in payment
                                history.
                            </p>
                        </div>
                    </div>
                )}
                {subscription.state === 'not_started' && (
                    <div
                        role="status"
                        className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"
                    >
                        <Info className="mt-0.5 size-5 shrink-0" />
                        <p className="text-sm">
                            Subscription payments begin in September 2026. You
                            can review the plans now, but submission is not
                            available yet.
                        </p>
                    </div>
                )}

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-6">
                        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                            <div className="mb-5 flex items-start gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                                    <CreditCard className="size-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                                        Step 1
                                    </p>
                                    <h2 className="text-xl font-semibold tracking-tight">
                                        Choose your plan
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Coverage starts from your earliest
                                        unpaid month.
                                    </p>
                                </div>
                            </div>
                            <div
                                role="group"
                                aria-label="Subscription plans"
                                className="grid gap-3 md:grid-cols-3"
                            >
                                {plans.map((plan) => {
                                    const isSelected =
                                        plan.code === data.plan_code;
                                    const savings =
                                        monthlyAmount * plan.months -
                                        plan.amount;

                                    return (
                                        <button
                                            type="button"
                                            key={plan.code}
                                            aria-pressed={isSelected}
                                            onClick={() =>
                                                setData('plan_code', plan.code)
                                            }
                                            className={`group flex min-h-48 flex-col rounded-2xl border p-4 text-left transition-all focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none sm:p-5 ${
                                                isSelected
                                                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-600 dark:bg-emerald-950/30'
                                                    : 'border-border bg-background hover:border-emerald-300 hover:shadow-sm dark:hover:border-emerald-800'
                                            }`}
                                        >
                                            <div className="flex w-full items-start justify-between gap-2">
                                                <span className="text-base font-semibold">
                                                    {plan.name}
                                                </span>
                                                <span
                                                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                                                        isSelected
                                                            ? 'border-emerald-600 bg-emerald-600 text-white'
                                                            : 'border-muted-foreground/40'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <Check className="size-3" />
                                                    )}
                                                </span>
                                            </div>
                                            <div className="mt-5 text-2xl font-bold tracking-tight">
                                                {money(plan.amount)}
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {plan.months}{' '}
                                                {plan.months === 1
                                                    ? 'month'
                                                    : 'months'}{' '}
                                                of coverage
                                            </p>
                                            <div className="mt-auto pt-4">
                                                {savings > 0 ? (
                                                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                                        Save {money(savings)}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        Pay month by month
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.plan_code && (
                                <p
                                    className="mt-3 text-sm text-destructive"
                                    role="alert"
                                >
                                    {errors.plan_code}
                                </p>
                            )}
                        </section>

                        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                            <div className="mb-5 flex items-start gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300">
                                    <Smartphone className="size-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-pink-700 uppercase dark:text-pink-300">
                                        Step 2
                                    </p>
                                    <h2 className="text-xl font-semibold tracking-tight">
                                        Send money with bKash
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Use Send Money to the personal number
                                        below.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 rounded-2xl border border-pink-200 bg-pink-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-pink-900 dark:bg-pink-950/20">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-pink-700 uppercase dark:text-pink-300">
                                        bKash personal number
                                    </p>
                                    <p className="mt-1 text-2xl font-bold tracking-wide text-foreground">
                                        {bkashNumber}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={copyNumber}
                                    className="w-full border-pink-200 bg-background sm:w-auto dark:border-pink-900"
                                    aria-label="Copy bKash number"
                                >
                                    {copied ? (
                                        <Check className="size-4" />
                                    ) : (
                                        <Copy className="size-4" />
                                    )}
                                    {copied ? 'Copied' : 'Copy number'}
                                </Button>
                            </div>
                            <p className="mt-4 rounded-xl bg-muted/70 px-4 py-3 text-sm">
                                Send exactly{' '}
                                <strong>{money(selected.amount)}</strong> for
                                the <strong>{selected.name}</strong> plan.
                            </p>
                            <ol className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-x-6">
                                {[
                                    'Open the bKash app.',
                                    'Select Send Money.',
                                    `Enter ${bkashNumber}.`,
                                    `Send ${money(selected.amount)} and complete the transaction.`,
                                    'Copy the bKash Transaction ID (TrxID).',
                                    'Return here and enter the TrxID below.',
                                ].map((instruction, index) => (
                                    <li
                                        key={instruction}
                                        className="flex items-start gap-3 text-sm"
                                    >
                                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                            {index + 1}
                                        </span>
                                        <span className="pt-0.5 text-muted-foreground">
                                            {instruction}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                            <div className="mb-5 flex items-start gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                                    <ReceiptText className="size-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                                        Step 3
                                    </p>
                                    <h2 className="text-xl font-semibold tracking-tight">
                                        Submit for verification
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Enter the TrxID from your completed
                                        bKash transaction.
                                    </p>
                                </div>
                            </div>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    if (processing || paymentBlocked) return;
                                    post('/subscription-payments');
                                }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="transaction_id">
                                        bKash Transaction ID / TrxID
                                    </Label>
                                    <Input
                                        id="transaction_id"
                                        value={data.transaction_id}
                                        onChange={(event) =>
                                            setData(
                                                'transaction_id',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Enter your TrxID"
                                        autoComplete="off"
                                        required
                                        maxLength={100}
                                        aria-invalid={!!errors.transaction_id}
                                        aria-describedby={
                                            errors.transaction_id
                                                ? 'transaction-id-error'
                                                : undefined
                                        }
                                        className="h-11 max-w-lg"
                                    />
                                    {errors.transaction_id && (
                                        <p
                                            id="transaction-id-error"
                                            role="alert"
                                            className="text-sm text-destructive"
                                        >
                                            {errors.transaction_id}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="max-w-md text-xs leading-5 text-muted-foreground">
                                        Your subscription becomes active after a
                                        superadmin verifies the payment.
                                    </p>
                                    <Button
                                        type="submit"
                                        variant="black"
                                        size="lg"
                                        disabled={
                                            processing ||
                                            paymentBlocked ||
                                            !data.transaction_id.trim()
                                        }
                                        className="w-full sm:w-auto"
                                    >
                                        {processing ? (
                                            <LoaderCircle className="size-4 animate-spin" />
                                        ) : (
                                            <ArrowRight className="size-4" />
                                        )}
                                        {processing
                                            ? 'Submitting...'
                                            : 'Submit payment'}
                                    </Button>
                                </div>
                            </form>
                        </section>
                    </div>

                    <aside className="lg:sticky lg:top-6">
                        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                            <div className="border-b bg-muted/40 px-5 py-5 sm:px-6">
                                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Payment summary
                                </p>
                                <h2 className="mt-1 text-lg font-semibold">
                                    {selected.name} plan
                                </h2>
                            </div>
                            <div className="space-y-5 px-5 py-5 sm:px-6">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total to send
                                    </p>
                                    <p className="mt-1 text-3xl font-bold tracking-tight">
                                        {money(selected.amount)}
                                    </p>
                                </div>
                                <div className="h-px bg-border" />
                                <div className="space-y-4 text-sm">
                                    <div className="flex items-start gap-3">
                                        <CalendarDays className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                                        <div>
                                            <p className="text-muted-foreground">
                                                Coverage period
                                            </p>
                                            <p className="mt-1 font-medium">
                                                {date(selected.coverage_start)}
                                                <br />
                                                to {date(selected.coverage_end)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock3 className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                                        <div>
                                            <p className="text-muted-foreground">
                                                Starts from
                                            </p>
                                            <p className="mt-1 font-medium">
                                                {date(
                                                    subscription.next_unpaid_month,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Smartphone className="mt-0.5 size-4 shrink-0 text-pink-700 dark:text-pink-300" />
                                        <div>
                                            <p className="text-muted-foreground">
                                                Payment method
                                            </p>
                                            <p className="mt-1 font-medium">
                                                bKash Send Money
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 border-t bg-emerald-50/70 px-5 py-4 text-xs leading-5 text-emerald-900 sm:px-6 dark:bg-emerald-950/30 dark:text-emerald-100">
                                <CircleCheck className="mt-0.5 size-4 shrink-0" />
                                <span>
                                    Coverage is calculated automatically from
                                    your earliest unpaid month.
                                </span>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </AppLayout>
    );
}
