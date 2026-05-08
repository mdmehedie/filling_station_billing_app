import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { DataTable, Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Trash2 } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { PaginatedResponse } from '@/types/response'
import { dashboard } from "@/routes";
import { useMemo } from "react";

interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    tnx_id?: string;
    note?: string;
    sender_bank?: string;
    organization: {
        id: number;
        name: string;
        ucode: string;
    };
    bank_account: {
        id: number;
        name: string;
    };
    creator?: {
        id: number;
        name: string;
    };
}

interface Props {
    payments: PaginatedResponse<Payment>;
}

export default function Index({ payments }: Props) {
    const columns: Column<Payment>[] = useMemo(() => [
        {
            header: 'Date',
            key: 'payment_date',
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString()
        },
        {
            header: 'Organization',
            key: 'organization',
            render: (value) => (
                <div>
                    <div className="font-medium">{value.name}</div>
                    <div className="text-xs text-muted-foreground">#{value.ucode}</div>
                </div>
            )
        },
        {
            header: 'Amount',
            key: 'amount',
            sortable: true,
            render: (value) => (
                <div className="font-bold text-green-600">
                    {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(value)}
                </div>
            )
        },
        {
            header: 'Bank Information',
            key: 'bank_account',
            render: (value, row) => (
                <div>
                    {value && <div className="font-medium">{value.name}</div>}
                    {row.sender_bank && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="bg-blue-100 text-blue-700 px-1 rounded uppercase font-bold text-[8px]">Sender:</span>
                            {row.sender_bank}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Transaction ID',
            key: 'tnx_id',
            render: (value) => value || '-'
        },
        {
            header: 'Created By',
            key: 'creator',
            render: (value) => value?.name || 'System'
        },
        {
            header: 'Actions',
            key: 'actions',
            render: (value, row) => (
                <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ], []);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Payments',
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payments" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payments History</h1>
                        <p className="text-muted-foreground">
                            View and manage all received payments
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/payments/create')}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Record New Payment
                    </Button>
                </div>

                <DataTable
                    data={payments.data}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search payments..."
                    serverSidePagination={true}
                    showPagination={true}
                    currentPage={payments.meta.current_page}
                    lastPage={payments.meta.last_page}
                    from={payments.meta.from}
                    to={payments.meta.to}
                    total={payments.meta.total}
                    onPageChange={(page) => router.get('/payments', { page }, { preserveState: true })}
                    responseData={payments}
                />
            </div>
        </AppLayout>
    )
}
