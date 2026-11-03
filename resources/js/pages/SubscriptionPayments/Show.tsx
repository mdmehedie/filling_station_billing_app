import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    Download,
    FileText,
    Mail,
    Phone,
    ReceiptText,
    ShieldCheck,
    Smartphone,
    UserRound,
} from 'lucide-react';
import { PaymentReviewActions } from './PaymentReviewActions';
import { StatusBadge } from './StatusBadge';
import { Payment, date, money } from './types';

export default function Show({ payment }: { payment: Payment }) {
    const reference = `SP-${String(payment.id).padStart(6, '0')}`;
    const initials =
        payment.user?.name
            ?.split(' ')
            .map((word) => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || '?';

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Subscription Payments',
                    href: '/admin/subscription-payments',
                },
                {
                    title: reference,
                    href: `/admin/subscription-payments/${payment.id}`,
                },
            ]}
        >
            <Head title={`Payment ${reference}`} />
            <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div>
                    <Link
                        href="/admin/subscription-payments"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to payments
                    </Link>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Payment {reference}
                        </h1>
                        <StatusBadge status={payment.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Submitted {date(payment.submitted_at)} for manual bKash
                        verification.
                    </p>
                </div>

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-6">
                        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                            <div className="border-b px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-2">
                                    <UserRound className="size-4 text-emerald-700 dark:text-emerald-300" />
                                    <h2 className="font-semibold">
                                        Admin account
                                    </h2>
                                </div>
                            </div>
                            <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                                    {initials}
                                </span>
                                <div>
                                    <p className="text-lg font-semibold">
                                        {payment.user?.name || 'Unknown admin'}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                        {payment.user?.email && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Mail className="size-3.5" />
                                                {payment.user.email}
                                            </span>
                                        )}
                                        {payment.user?.phone && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Phone className="size-3.5" />
                                                {payment.user.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                            <div className="border-b px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="size-4 text-emerald-700 dark:text-emerald-300" />
                                    <h2 className="font-semibold">
                                        Subscription coverage
                                    </h2>
                                </div>
                            </div>
                            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                                <div className="rounded-xl bg-muted/50 p-4">
                                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Package
                                    </p>
                                    <p className="mt-2 text-lg font-semibold">
                                        {payment.plan_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {payment.duration_months}{' '}
                                        {payment.duration_months === 1
                                            ? 'month'
                                            : 'months'}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                                    <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase dark:text-emerald-200">
                                        Coverage period
                                    </p>
                                    <p className="mt-2 font-semibold">
                                        {date(payment.coverage_start)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        to {date(payment.coverage_end)}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                            <div className="border-b px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="size-4 text-pink-700 dark:text-pink-300" />
                                    <h2 className="font-semibold">
                                        Transaction details
                                    </h2>
                                </div>
                            </div>
                            <dl className="grid gap-x-8 gap-y-5 px-5 py-5 text-sm sm:grid-cols-2 sm:px-6">
                                <div>
                                    <dt className="text-muted-foreground">
                                        Payment method
                                    </dt>
                                    <dd className="mt-1 font-medium">
                                        Manual bKash Send Money
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        bKash TrxID
                                    </dt>
                                    <dd className="mt-1 font-mono font-semibold break-all">
                                        {payment.transaction_id}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        Submitted on
                                    </dt>
                                    <dd className="mt-1 font-medium">
                                        {date(payment.submitted_at)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        Payment reference
                                    </dt>
                                    <dd className="mt-1 font-mono font-medium">
                                        {reference}
                                    </dd>
                                </div>
                                {payment.approved_at && (
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Approved on
                                        </dt>
                                        <dd className="mt-1 font-medium">
                                            {date(payment.approved_at)}
                                        </dd>
                                    </div>
                                )}
                                {payment.approver && (
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Approved by
                                        </dt>
                                        <dd className="mt-1 font-medium">
                                            {payment.approver.name}
                                        </dd>
                                    </div>
                                )}
                                {payment.rejected_at && (
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Rejected on
                                        </dt>
                                        <dd className="mt-1 font-medium">
                                            {date(payment.rejected_at)}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </section>
                    </div>

                    <aside className="lg:sticky lg:top-6">
                        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                            <div className="border-b bg-muted/40 px-5 py-5 sm:px-6">
                                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Payment amount
                                </p>
                                <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
                                    {money(payment.amount)}
                                </p>
                                <div className="mt-3">
                                    <StatusBadge status={payment.status} />
                                </div>
                            </div>
                            <div className="space-y-4 px-5 py-5 sm:px-6">
                                {payment.status === 'pending' && (
                                    <>
                                        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                                            <Clock3 className="mt-0.5 size-4 shrink-0" />
                                            Verify the TrxID in bKash before
                                            approving this request.
                                        </div>
                                        <PaymentReviewActions
                                            payment={payment}
                                        />
                                    </>
                                )}
                                {payment.status === 'approved' && (
                                    <>
                                        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                                            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                                            Subscription coverage is active.
                                            Documents are ready to download.
                                        </div>
                                        <Button
                                            asChild
                                            variant="black"
                                            className="w-full justify-center"
                                        >
                                            <a
                                                href={`/subscription-payments/${payment.id}/invoice`}
                                            >
                                                <FileText className="size-4" />
                                                Invoice
                                                <Download className="size-3.5" />
                                            </a>
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="w-full justify-center"
                                        >
                                            <a
                                                href={`/subscription-payments/${payment.id}/receipt`}
                                            >
                                                <ReceiptText className="size-4" />
                                                Money receipt
                                                <Download className="size-3.5" />
                                            </a>
                                        </Button>
                                    </>
                                )}
                                {payment.status === 'rejected' && (
                                    <div className="rounded-xl bg-rose-50 p-4 dark:bg-rose-950/30">
                                        <p className="text-xs font-semibold tracking-wide text-rose-800 uppercase dark:text-rose-200">
                                            Rejection reason
                                        </p>
                                        <p className="mt-2 text-sm text-foreground">
                                            {payment.rejection_reason ||
                                                'No reason provided.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </AppLayout>
    );
}
