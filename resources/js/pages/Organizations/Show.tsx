import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Building2, User, Calendar, Percent, Hash, Globe, ArrowLeft,
    CreditCard, Wallet, AlertCircle, FileText, Download, Paperclip, ExternalLink
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import organizationsRoute from '@/routes/organizations';
import paymentsRoute from '@/routes/payments';
import { dashboard } from '@/routes';
import { Organization } from '@/types/response';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { DataTable, Column } from '@/components/data-table';

interface Props {
    organization: Organization;
}

export default function Show({ organization }: Props) {
    const [deleteModal, setDeleteModal] = useState({ isOpen: false });

    const handleDeleteClick = () => setDeleteModal({ isOpen: true });
    const handleDeleteCancel = () => setDeleteModal({ isOpen: false });

    const handleDeleteConfirm = () => {
        router.delete(organizationsRoute.destroy(organization.id).url, {
            onSuccess: () => setDeleteModal({ isOpen: false }),
        });
    };

    if (!organization || !organization.id) {
        return (
            <AppLayout>
                <Head title="Organization Not Found" />
                <div className="container mx-auto py-6">
                    <Card className="text-center p-12">
                        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Organization Not Found</h1>
                        <p className="text-muted-foreground mb-6">The requested organization could not be found.</p>
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
        { title: organization.name, href: organizationsRoute.show(organization.id).url },
    ];

    const paymentColumns: Column<any>[] = [
        {
            header: 'Date',
            key: 'payment_date',
            render: (value) => new Date(value).toLocaleDateString()
        },
        {
            header: 'Method',
            key: 'payment_method',
            render: (value) => (
                <div className="flex flex-col">
                    <span className="font-medium">{value?.name}</span>
                    <Badge variant="secondary" className="text-[10px] w-fit uppercase">
                        {value?.type.replace('_', ' ')}
                    </Badge>
                </div>
            )
        },
        {
            header: 'Amount',
            key: 'amount',
            render: (value) => (
                <span className="font-bold text-green-600">
                    {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(value)}
                </span>
            )
        },
        {
            header: 'Transaction ID',
            key: 'tnx_id',
            render: (value) => value || '-'
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
            }
        }
    ];

    const totalPaid = Number(organization.total_paid || 0);
    const totalDue = Number(organization.total_due || 0);
    const totalBilled = totalPaid + totalDue;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.name} - Details`} />
            <div className="container mx-auto py-6 px-4 space-y-8">
                {/* Modern Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        {organization.logo_url ? (
                            <img src={organization.logo_url} alt={organization.name} className="h-20 w-20 rounded-2xl object-cover border-4 border-background shadow-xl" />
                        ) : (
                            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-4 border-background shadow-xl">
                                <Building2 size={40} />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-3xl font-extrabold tracking-tight">{organization.name}</h1>
                                <Badge variant="outline" className="font-mono">{organization.ucode}</Badge>
                            </div>
                            <p className="text-muted-foreground flex items-center gap-2">
                                <Globe size={14} />
                                {organization.name_bn || 'No Bengali Name'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={organizationsRoute.edit(organization.id).url}>
                            <Button variant="outline">Edit Details</Button>
                        </Link>
                        <Button variant="outline" onClick={() => router.visit(paymentsRoute.create({ query: { organization_id: organization.id } }).url)} className="bg-green-600 text-white hover:bg-green-700 hover:text-white border-none">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Record Payment
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteClick}>Delete</Button>
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-950 border-blue-100 dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center justify-between">
                                Total Billed
                                <FileText size={16} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(totalBilled)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Lifetime billing amount</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-white dark:from-slate-900 dark:to-slate-950 border-green-100 dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center justify-between">
                                Total Paid
                                <Wallet size={16} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">{new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(totalPaid)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total payments received</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-slate-900 dark:to-slate-950 border-orange-100 dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center justify-between">
                                Total Due
                                <AlertCircle size={16} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-600">{new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(totalDue)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Outstanding balance</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Payment History */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <div>
                                    <CardTitle>Payment History</CardTitle>
                                    <CardDescription>Recently received payments from this organization</CardDescription>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Statement
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    data={organization.payments || []}
                                    columns={paymentColumns}
                                    showPagination={false}
                                    emptyMessage="No payments recorded yet."
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Information Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <User size={18} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium leading-none">{organization.user?.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{organization.user?.email}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2"><Calendar size={14} /> Created On</span>
                                        <span className="font-medium">{new Date(organization.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2"><Percent size={14} /> VAT Rate</span>
                                        <span className="font-medium">{organization.is_vat_applied ? `${organization.vat_rate}%` : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2"><CreditCard size={14} /> Vehicles</span>
                                        <span className="font-medium">{organization.vehicles_count}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary text-primary-foreground">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Hash size={18} />
                                    Identification
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                                    <p className="text-xs opacity-70 mb-1 uppercase tracking-wider font-bold">Organization UCode</p>
                                    <p className="text-2xl font-mono font-bold tracking-tighter">{organization.ucode}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <DeleteConfirmation
                    isOpen={deleteModal.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Organization"
                    description="Are you sure you want to delete this organization? This action cannot be undone."
                    itemName={organization.name}
                />
            </div>
        </AppLayout>
    );
}