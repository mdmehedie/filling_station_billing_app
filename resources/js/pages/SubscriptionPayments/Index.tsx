import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronDown,
    FileDown,
    FileText,
    ReceiptText,
} from 'lucide-react';
import { Payment, Subscription, date, money } from './types';

export default function Index({
    subscription,
    payments,
}: {
    subscription: Subscription;
    payments: {
        data: Payment[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        last_page: number;
    };
}) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Payments', href: '/subscription-payments' },
            ]}
        >
            <Head title="Subscription Payments" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">
                        Subscription Payments
                    </h1>
                    {subscription.pending_payment ||
                    subscription.state === 'not_started' ? (
                        <Button disabled>Pay Now</Button>
                    ) : (
                        <Button
                            asChild
                            variant="black"
                            size="lg"
                            className="rounded-lg bg-emerald-700 px-5 font-semibold text-white shadow-md ring-2 ring-emerald-200 hover:bg-emerald-800 dark:bg-emerald-600 dark:ring-emerald-900 dark:hover:bg-emerald-500"
                        >
                            <Link href="/subscription-payments/pay">
                                Pay Now
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    )}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent className="capitalize">
                            {subscription.state.replace('_', ' ')}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Current coverage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {date(subscription.coverage_start)} –{' '}
                            {date(subscription.coverage_end)}
                            <p className="text-sm text-muted-foreground">
                                Covered until {date(subscription.covered_until)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Next unpaid month</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {date(subscription.next_unpaid_month)}
                        </CardContent>
                    </Card>
                </div>
                {subscription.pending_payment && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending verification</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {subscription.pending_payment.plan_name} ·{' '}
                            {money(subscription.pending_payment.amount)} · TrxID{' '}
                            {subscription.pending_payment.transaction_id}
                        </CardContent>
                    </Card>
                )}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment history</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        {[
                                            'Reference',
                                            'Package',
                                            'Coverage',
                                            'Amount',
                                            'Method',
                                            'TrxID',
                                            'Submitted',
                                            'Approved',
                                            'Status',
                                            'Documents',
                                        ].map((h) => (
                                            <th key={h} className="p-2">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.data.map((p) => (
                                        <tr key={p.id} className="border-b">
                                            <td className="p-2">
                                                SP-
                                                {String(p.id).padStart(6, '0')}
                                            </td>
                                            <td className="p-2">
                                                {p.plan_name}
                                            </td>
                                            <td className="p-2 whitespace-nowrap">
                                                <span className="font-medium">
                                                    {date(p.coverage_start)}
                                                </span>
                                                <span className="block text-xs text-muted-foreground">
                                                    to {date(p.coverage_end)}
                                                </span>
                                            </td>
                                            <td className="p-2">
                                                {money(p.amount)}
                                            </td>
                                            <td className="p-2">
                                                bKash Send Money
                                            </td>
                                            <td className="p-2">
                                                {p.transaction_id}
                                            </td>
                                            <td className="p-2">
                                                {date(p.submitted_at)}
                                            </td>
                                            <td className="p-2">
                                                {date(p.approved_at)}
                                            </td>
                                            <td className="p-2">
                                                <Badge
                                                    variant="outline"
                                                    className="capitalize"
                                                >
                                                    {p.status}
                                                </Badge>
                                                {p.rejection_reason && (
                                                    <p className="text-xs">
                                                        {p.rejection_reason}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {p.status === 'approved' ? (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                aria-label={`Download documents for SP-${String(p.id).padStart(6, '0')}`}
                                                                className="cursor-pointer gap-1.5"
                                                            >
                                                                <FileDown className="size-4" />
                                                                <ChevronDown className="size-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                asChild
                                                                className="cursor-pointer"
                                                            >
                                                                <a
                                                                    href={`/subscription-payments/${p.id}/invoice`}
                                                                >
                                                                    <FileText className="size-4" />
                                                                    Download
                                                                    invoice
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                asChild
                                                                className="cursor-pointer"
                                                            >
                                                                <a
                                                                    href={`/subscription-payments/${p.id}/receipt`}
                                                                >
                                                                    <ReceiptText className="size-4" />
                                                                    Download
                                                                    receipt
                                                                </a>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                ) : (
                                                    <span
                                                        className="text-muted-foreground"
                                                        title="Available after approval"
                                                    >
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!payments.data.length && (
                            <p className="py-4 text-muted-foreground">
                                No payments yet.
                            </p>
                        )}
                        {payments.total > 0 && (
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
                                <p className="text-muted-foreground">
                                    Showing {payments.from}–{payments.to} of{' '}
                                    {payments.total}
                                </p>
                                {payments.last_page > 1 && (
                                    <nav
                                        aria-label="Payment history pages"
                                        className="flex flex-wrap items-center gap-1"
                                    >
                                        {payments.links.map((link, index) =>
                                            link.url ? (
                                                <Link
                                                    key={index}
                                                    href={link.url}
                                                    aria-current={
                                                        link.active
                                                            ? 'page'
                                                            : undefined
                                                    }
                                                    className={`inline-flex min-w-9 items-center justify-center rounded-md px-2.5 py-1.5 transition-colors ${link.active ? 'bg-emerald-700 text-white' : 'text-muted-foreground hover:bg-muted'}`}
                                                >
                                                    {index === 0
                                                        ? 'Previous'
                                                        : index ===
                                                            payments.links
                                                                .length -
                                                                1
                                                          ? 'Next'
                                                          : link.label}
                                                </Link>
                                            ) : (
                                                <span
                                                    key={index}
                                                    className="inline-flex min-w-9 items-center justify-center px-2.5 py-1.5 text-muted-foreground/50"
                                                >
                                                    {index === 0
                                                        ? 'Previous'
                                                        : index ===
                                                            payments.links
                                                                .length -
                                                                1
                                                          ? 'Next'
                                                          : link.label}
                                                </span>
                                            ),
                                        )}
                                    </nav>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
