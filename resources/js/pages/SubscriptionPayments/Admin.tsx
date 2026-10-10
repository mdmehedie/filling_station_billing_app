import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Eye,
    Filter,
    Search,
    WalletCards,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { PaymentReviewActions } from './PaymentReviewActions';
import { StatusBadge } from './StatusBadge';
import { Payment, date, money } from './types';

type StatusFilter = 'all' | Payment['status'];

interface Props {
    payments: {
        data: Payment[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: {
        status?: string;
        customer?: string;
        from?: string;
        to?: string;
    };
    statusCounts: Record<StatusFilter, number>;
}

const statusOptions: {
    value: StatusFilter;
    label: string;
    icon: typeof WalletCards;
    color: string;
}[] = [
    {
        value: 'all',
        label: 'All payments',
        icon: WalletCards,
        color: 'text-foreground',
    },
    {
        value: 'pending',
        label: 'Pending review',
        icon: Clock3,
        color: 'text-amber-700 dark:text-amber-300',
    },
    {
        value: 'approved',
        label: 'Approved',
        icon: CheckCircle2,
        color: 'text-emerald-700 dark:text-emerald-300',
    },
    {
        value: 'rejected',
        label: 'Rejected',
        icon: XCircle,
        color: 'text-rose-700 dark:text-rose-300',
    },
];

export default function Admin({ payments, filters, statusCounts }: Props) {
    const [status, setStatus] = useState<StatusFilter>(
        (filters.status as StatusFilter) || 'all',
    );
    const [customer, setCustomer] = useState(filters.customer || '');
    const [from, setFrom] = useState(filters.from || '');
    const [to, setTo] = useState(filters.to || '');
    const hasActiveFilters = !!(
        filters.status ||
        filters.customer ||
        filters.from ||
        filters.to
    );

    const navigateWithFilters = (
        nextStatus: StatusFilter,
        nextCustomer = customer,
        nextFrom = from,
        nextTo = to,
    ) => {
        router.get(
            '/admin/subscription-payments',
            {
                status: nextStatus === 'all' ? '' : nextStatus,
                customer: nextCustomer.trim(),
                from: nextFrom,
                to: nextTo,
            },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        setStatus('all');
        setCustomer('');
        setFrom('');
        setTo('');
        navigateWithFilters('all', '', '', '');
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Subscription Payments',
                    href: '/admin/subscription-payments',
                },
            ]}
        >
            <Head title="Manage Subscription Payments" />
            <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase dark:text-emerald-300">
                            Payment operations
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                            Subscription payments
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            Review bKash submissions, verify transaction IDs,
                            and track each admin account’s payment status.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
                        <Clock3 className="size-4 text-amber-600" />
                        <span>
                            <strong className="text-foreground">
                                {statusCounts.pending}
                            </strong>{' '}
                            awaiting review
                        </span>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {statusOptions.map((option) => {
                        const Icon = option.icon;
                        const active =
                            ((filters.status as StatusFilter) || 'all') ===
                            option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() => {
                                    setStatus(option.value);
                                    navigateWithFilters(option.value);
                                }}
                                className={`flex items-center justify-between rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none ${active ? 'border-emerald-600 ring-1 ring-emerald-600' : 'border-border'}`}
                            >
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {option.label}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold tabular-nums">
                                        {statusCounts[option.value]}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-xl bg-muted p-2.5 ${option.color}`}
                                >
                                    <Icon className="size-5" />
                                </span>
                            </button>
                        );
                    })}
                </div>

                <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center gap-2">
                        <Filter className="size-4 text-emerald-700 dark:text-emerald-300" />
                        <h2 className="font-semibold">Filter payments</h2>
                    </div>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            navigateWithFilters(status);
                        }}
                        className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="customer-search">Admin name</Label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="customer-search"
                                    value={customer}
                                    onChange={(event) =>
                                        setCustomer(event.target.value)
                                    }
                                    placeholder="Search by name"
                                    maxLength={100}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-status">Status</Label>
                            <Select
                                value={status}
                                onValueChange={(value) =>
                                    setStatus(value as StatusFilter)
                                }
                            >
                                <SelectTrigger
                                    id="payment-status"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All statuses
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="approved">
                                        Approved
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                        Rejected
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="submitted-from">
                                Submitted from
                            </Label>
                            <Input
                                id="submitted-from"
                                type="date"
                                value={from}
                                max={to || undefined}
                                onChange={(event) =>
                                    setFrom(event.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="submitted-to">Submitted to</Label>
                            <Input
                                id="submitted-to"
                                type="date"
                                value={to}
                                min={from || undefined}
                                onChange={(event) => setTo(event.target.value)}
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="black"
                            className="w-full xl:w-auto"
                        >
                            Apply
                        </Button>
                    </form>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-4 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
                        >
                            Clear all filters
                        </button>
                    )}
                </section>

                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
                        <div>
                            <h2 className="font-semibold">Payment requests</h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Showing {payments.from ?? 0}–{payments.to ?? 0}{' '}
                                of {payments.total}
                            </p>
                        </div>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                            Newest first
                        </span>
                    </div>
                    {payments.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1120px] text-sm">
                                <thead className="bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-5 py-3.5 sm:pl-6"
                                        >
                                            Admin account
                                        </th>
                                        <th scope="col" className="px-4 py-3.5">
                                            Package and coverage
                                        </th>
                                        <th scope="col" className="px-4 py-3.5">
                                            Amount
                                        </th>
                                        <th scope="col" className="px-4 py-3.5">
                                            bKash TrxID
                                        </th>
                                        <th scope="col" className="px-4 py-3.5">
                                            Submitted
                                        </th>
                                        <th scope="col" className="px-4 py-3.5">
                                            Status
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-5 py-3.5 text-right sm:pr-6"
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {payments.data.map((payment) => {
                                        const initials =
                                            payment.user?.name
                                                ?.split(' ')
                                                .map((word) => word[0])
                                                .slice(0, 2)
                                                .join('')
                                                .toUpperCase() || '?';
                                        return (
                                            <tr
                                                key={payment.id}
                                                className="align-top transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-5 py-4 sm:pl-6">
                                                    <div className="flex items-start gap-3">
                                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                                                            {initials}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-foreground">
                                                                {payment.user
                                                                    ?.name ||
                                                                    'Unknown admin'}
                                                            </p>
                                                            <p className="mt-0.5 max-w-48 truncate text-xs text-muted-foreground">
                                                                {payment.user
                                                                    ?.email ||
                                                                    payment.user
                                                                        ?.phone ||
                                                                    '—'}
                                                            </p>
                                                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                                SP-
                                                                {String(
                                                                    payment.id,
                                                                ).padStart(
                                                                    6,
                                                                    '0',
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold">
                                                        {payment.plan_name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {date(
                                                            payment.coverage_start,
                                                        )}
                                                        <br />
                                                        to{' '}
                                                        {date(
                                                            payment.coverage_end,
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 font-semibold whitespace-nowrap tabular-nums">
                                                    {money(payment.amount)}
                                                </td>
                                                <td className="px-4 py-4 font-mono text-xs tracking-wide">
                                                    {payment.transaction_id}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                                                    {date(payment.submitted_at)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge
                                                        status={payment.status}
                                                    />
                                                </td>
                                                <td className="px-5 py-4 sm:pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={`/admin/subscription-payments/${payment.id}`}
                                                            className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                                        >
                                                            <Eye className="size-3.5" />
                                                            Review
                                                        </Link>
                                                        {payment.status ===
                                                            'pending' && (
                                                            <PaymentReviewActions
                                                                payment={
                                                                    payment
                                                                }
                                                                compact
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center px-6 py-16 text-center">
                            <span className="rounded-2xl bg-muted p-4 text-muted-foreground">
                                <WalletCards className="size-7" />
                            </span>
                            <h3 className="mt-4 text-lg font-semibold">
                                No payments found
                            </h3>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                {hasActiveFilters
                                    ? 'Try a different status, admin name, or date range.'
                                    : 'Payment requests will appear here when admins submit them.'}
                            </p>
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetFilters}
                                    className="mt-5"
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    )}
                    {payments.links.some((link) => link.url) && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 sm:px-6">
                            <p className="text-xs text-muted-foreground">
                                {payments.total} total requests
                            </p>
                            <nav
                                aria-label="Payment pages"
                                className="flex flex-wrap items-center gap-1"
                            >
                                {payments.links.map((link, index) =>
                                    link.url ? (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            aria-current={
                                                link.active ? 'page' : undefined
                                            }
                                            className={`inline-flex min-w-9 items-center justify-center rounded-md px-2.5 py-1.5 text-sm transition-colors ${link.active ? 'bg-emerald-700 text-white' : 'text-muted-foreground hover:bg-muted'}`}
                                        >
                                            {index === 0
                                                ? 'Previous'
                                                : index ===
                                                    payments.links.length - 1
                                                  ? 'Next'
                                                  : link.label}
                                        </Link>
                                    ) : (
                                        <span
                                            key={index}
                                            className="inline-flex min-w-9 items-center justify-center px-2.5 py-1.5 text-sm text-muted-foreground/50"
                                        >
                                            {index === 0
                                                ? 'Previous'
                                                : index ===
                                                    payments.links.length - 1
                                                  ? 'Next'
                                                  : link.label}
                                        </span>
                                    ),
                                )}
                            </nav>
                        </div>
                    )}
                </section>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Dates use your local time zone.
                    <ArrowRight className="size-3.5" />
                    Open a request to review its full details.
                </p>
            </main>
        </AppLayout>
    );
}
