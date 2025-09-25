import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { Order, PaginatedResponse } from "@/types/response";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import ordersRoute from "@/routes/orders";
import { useState, useCallback, useRef } from "react";

interface Props {
    orders: PaginatedResponse<Order>;
}

export default function Index({ orders }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Custom debounced search function
    const debouncedSearch = useCallback((term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            router.get('/orders', { 
                search: term,
                page: 1 // Reset to first page when searching
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500);
    }, []);

    const handleSearchChange = (search: string) => {
        setSearchTerm(search);
        debouncedSearch(search);
    };

    const handlePageChange = (page: number) => {
        router.get('/orders', { 
            page,
            search: searchTerm // Preserve search term when changing pages
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: Column<Order>[] = [
        {
            key: 'id',
            header: 'Order ID',
            sortable: true,
            render: (value, row) => (
                <div className="font-mono text-sm font-medium">
                    #{row.id.toString().padStart(4, '0')}
                </div>
            )
        },
        {
            key: 'vehicle',
            header: 'Vehicle',
            sortable: true,
            render: (value, row) => (
                <div>
                    <div className="font-medium">{row.vehicle.name || 'Unnamed Vehicle'}</div>
                    <div className="text-sm text-muted-foreground">
                        {row.vehicle.ucode} • {row.vehicle.model || 'No model'}
                    </div>
                </div>
            )
        },
        {
            key: 'organization',
            header: 'Organization',
            sortable: true,
            render: (value, row) => (
                <div>
                    <div className="font-medium">{row.organization.name}</div>
                    <div className="text-sm text-muted-foreground">{row.organization.name_bn}</div>
                </div>
            )
        },
        {
            key: 'fuel',
            header: 'Fuel Details',
            sortable: true,
            render: (value, row) => (
                <div>
                    <div className="font-medium">{row.fuel.name}</div>
                    <div className="text-sm text-muted-foreground">
                        {row.fuel.type} • ৳{row.fuel.price}/L
                    </div>
                </div>
            )
        },
        {
            key: 'fuel_qty',
            header: 'Quantity',
            sortable: true,
            render: (value, row) => (
                <div className="text-right">
                    <div className="font-medium">{row.fuel_qty}L</div>
                </div>
            )
        },
        {
            key: 'total_price',
            header: 'Total Price',
            sortable: true,
            render: (value, row) => (
                <div className="text-right">
                    <div className="font-medium">৳{row.total_price.toLocaleString()}</div>
                </div>
            )
        },
        {
            key: 'sold_date',
            header: 'Sold Date',
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString()
        },
        {
            key: 'created_at',
            header: 'Created',
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString()
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (value, row) => (
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Orders',
            href: ordersRoute.index().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <DataTableWrapper
                    response={orders}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search orders..."
                    onPageChange={handlePageChange}
                    onSearchChange={handleSearchChange}
                    searchValue={searchTerm}
                    statusText={`Showing ${orders.meta.from} to ${orders.meta.to} of ${orders.meta.total} orders`}
                />
            </div>  
        </AppLayout>
    )
}
