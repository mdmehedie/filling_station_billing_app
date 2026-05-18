import { Column, DataTable } from '@/components/data-table';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import organizationsRoute from '@/routes/organizations';
import paymentsRoute from '@/routes/payments';
import { BreadcrumbItem } from '@/types';
import { Organization } from '@/types/response';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    Calendar,
    CreditCard,
    Download,
    ExternalLink,
    FileText,
    Globe,
    Paperclip,
    Percent,
    Trash2,
    User,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    organization: Organization;
}

export default function Show({ organization }: Props) {
    const [deleteModal, setDeleteModal] = useState({ isOpen: false });
    const [paymentDeleteModal, setPaymentDeleteModal] = useState<{
        isOpen: boolean;
        paymentId: number | null;
    }>({ isOpen: false, paymentId: null });

    const handleDeleteClick = () => setDeleteModal({ isOpen: true });
    const handleDeleteCancel = () => setDeleteModal({ isOpen: false });

    const handleDeleteConfirm = () => {
        router.delete(organizationsRoute.destroy(organization.id).url, {
            onSuccess: () => setDeleteModal({ isOpen: false }),
        });
    };

    const handlePaymentDeleteClick = (id: number) => {
        setPaymentDeleteModal({ isOpen: true, paymentId: id });
    };

    const handlePaymentDeleteConfirm = () => {
        if (!paymentDeleteModal.paymentId) return;
        router.delete(paymentsRoute.destroy(paymentDeleteModal.paymentId).url, {
            onSuccess: () =>
                setPaymentDeleteModal({ isOpen: false, paymentId: null }),
        });
    };

    if (!organization || !organization.id) {
        return (
            <AppLayout>
                <Head title="Organization Not Found" />
                <div className="container mx-auto py-6">
                    <Card className="p-12 text-center">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
                        <h1 className="mb-2 text-2xl font-bold">
                            Organization Not Found
                        </h1>
                        <p className="mb-6 text-muted-foreground">
                            The requested organization could not be found.
                        </p>
                        <Link href={organizationsRoute.index().url}>
                            <Button>Back to Organizations</Button>
                        </Link>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Organizations', href: organizationsRoute.index().url },
        {
            title: organization.name,
            href: organizationsRoute.show(organization.id).url,
        },
    ];

    const paymentColumns: Column<any>[] = [
        {
            header: 'Date',
            key: 'payment_date',
            render: (value) => new Date(value).toLocaleDateString(),
        },
        {
            header: 'Bank Information',
            key: 'bank_account',
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="font-medium">
                        {row.method === 'check'
                            ? `Check: ${row.check_number}`
                            : value?.name || 'Cash'}
                    </span>
                    {row.method === 'check' && row.check_date && (
                        <span className="text-[10px] text-muted-foreground">
                            Date:{' '}
                            {new Date(row.check_date).toLocaleDateString()}
                        </span>
                    )}
                    <div className="mt-1 flex gap-1">
                        <Badge
                            variant="secondary"
                            className="h-4 px-1 text-[8px] uppercase"
                        >
                            {row?.method}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="h-4 px-1 text-[8px] uppercase"
                        >
                            {row?.type?.replace('_', ' ')}
                        </Badge>
                        {row.sender_bank && (
                            <Badge
                                variant="outline"
                                className="h-4 border-blue-200 bg-blue-50 px-1 text-[8px] text-blue-700 uppercase"
                            >
                                {row.sender_bank}
                            </Badge>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: 'Amount',
            key: 'amount',
            render: (value) => (
                <span className="font-bold text-green-600">
                    {new Intl.NumberFormat('en-BD', {
                        style: 'currency',
                        currency: 'BDT',
                    }).format(value)}
                </span>
            ),
        },
        {
            header: 'Transaction ID',
            key: 'tnx_id',
            render: (value) => value || '-',
        },
        {
            header: 'Created By',
            key: 'creator',
            render: (value) => (
                <div className="flex items-center gap-1.5 text-xs">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span>{value?.name || 'System'}</span>
                </div>
            ),
        },
        {
            header: 'Proof',
            key: 'proof',
            render: (value: string[] | undefined) => {
                if (!value || value.length === 0) return '-';
                return (
                    <a
                        href={`/storage/${value[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                        <Paperclip className="h-3 w-3" />
                        View
                        <ExternalLink className="h-2 w-2" />
                    </a>
                );
            },
        },
        {
            header: 'Actions',
            key: 'actions',
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    {!row.is_deleted && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePaymentDeleteClick(row.id)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const totalPaid = Number(organization.total_paid || 0);
    const totalDue = Number(organization.total_due || 0);
    const totalBilled = totalPaid + totalDue;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.name} - Details`} />
            <div className="container mx-auto space-y-8 px-4 py-6">
                {/* Modern Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-start gap-6 md:items-center">
                        {organization.logo_url ? (
                            <img
                                src={organization.logo_url}
                                alt={organization.name}
                                className="h-20 w-20 shrink-0 rounded-2xl border-4 border-background object-cover"
                            />
                        ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-background bg-primary/10 text-primary">
                                <Building2 size={40} />
                            </div>
                        )}
                        <div>
                            <div className="mb-1 flex items-center gap-2">
                                <h1 className="text-3xl font-extrabold tracking-tight">
                                    {organization.name}
                                </h1>
                                <Badge variant="outline" className="font-mono">
                                    {organization.ucode}
                                </Badge>
                            </div>
                            <p className="flex items-center gap-2 text-muted-foreground">
                                <Globe size={14} />
                                {organization.name_bn || 'No Bengali Name'}
                            </p>

                            {/* Organization Metadata Badges */}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {organization.user && (
                                    <div className="flex items-center gap-1.5 rounded-md border border-slate-200/50 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-200">
                                        <User className="h-3.5 w-3.5 text-primary" />
                                        <span>{organization.user.name}</span>
                                        <span className="hidden text-[10px] opacity-75 sm:inline">
                                            ({organization.user.email})
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 rounded-md border border-slate-200/50 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-200">
                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                    <span>
                                        Joined{' '}
                                        {new Date(
                                            organization.created_at,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md border border-slate-200/50 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-200">
                                    <Percent className="h-3.5 w-3.5 text-primary" />
                                    <span>
                                        VAT:{' '}
                                        {organization.is_vat_applied
                                            ? `${organization.vat_rate}%`
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md border border-slate-200/50 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-200">
                                    <CreditCard className="h-3.5 w-3.5 text-primary" />
                                    <span>
                                        {organization.vehicles_count} Vehicles
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md border border-slate-200/50 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-900 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-100">
                                    <Wallet className="h-3.5 w-3.5 text-primary" />
                                    <span>
                                        Security:{' '}
                                        {new Intl.NumberFormat('en-BD', {
                                            style: 'currency',
                                            currency: 'BDT',
                                            maximumFractionDigits: 0,
                                        }).format(
                                            organization.security_money || 0,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.visit(
                                    paymentsRoute.create({
                                        query: {
                                            organization_id: organization.id,
                                        },
                                    }).url,
                                )
                            }
                            className="border-none bg-green-600 text-white hover:bg-green-700 hover:text-white"
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Record Payment
                        </Button>
                        <Link
                            href={organizationsRoute.edit(organization.id).url}
                        >
                            <Button variant="outline">Edit Details</Button>
                        </Link>
                        {/* <Button variant="destructive" onClick={handleDeleteClick}>Delete</Button> */}
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-sm font-medium text-blue-600 dark:text-blue-400">
                                Total Billed
                                <FileText size={16} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {new Intl.NumberFormat('en-BD', {
                                    style: 'currency',
                                    currency: 'BDT',
                                }).format(totalBilled)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Lifetime billing amount
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-sm font-medium text-green-600 dark:text-green-400">
                                Total Paid
                                <Wallet size={16} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                                {new Intl.NumberFormat('en-BD', {
                                    style: 'currency',
                                    currency: 'BDT',
                                }).format(totalPaid)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Total payments received
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-sm font-medium text-orange-600 dark:text-orange-400">
                                Total Due
                                <AlertCircle size={16} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-600">
                                {new Intl.NumberFormat('en-BD', {
                                    style: 'currency',
                                    currency: 'BDT',
                                }).format(totalDue)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Outstanding balance
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>
                                Recently received payments from this
                                organization
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                window.open(
                                    `/organizations/${organization.id}/statement`,
                                    '_blank',
                                )
                            }
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Statement
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={organization.payments || []}
                            columns={paymentColumns}
                            showPagination={true}
                            pageSize={10}
                            emptyMessage="No payments recorded yet."
                            getRowClassName={(row) =>
                                row.is_deleted
                                    ? 'line-through opacity-50 grayscale select-none pointer-events-none bg-muted/20'
                                    : ''
                            }
                        />
                    </CardContent>
                </Card>

                <DeleteConfirmation
                    isOpen={deleteModal.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Organization"
                    description="Are you sure you want to delete this organization? This action cannot be undone."
                    itemName={organization.name}
                />

                <DeleteConfirmation
                    isOpen={paymentDeleteModal.isOpen}
                    onClose={() =>
                        setPaymentDeleteModal({
                            isOpen: false,
                            paymentId: null,
                        })
                    }
                    onConfirm={handlePaymentDeleteConfirm}
                    title="Delete Payment Record"
                    description="Are you sure you want to delete this payment record? This will affect the organization's total balance."
                    itemName="this payment"
                />
            </div>
        </AppLayout>
    );
}
