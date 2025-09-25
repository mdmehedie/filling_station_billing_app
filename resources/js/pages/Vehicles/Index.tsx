import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { Vehicle, PaginatedResponse } from "@/types/response";
import { BreadcrumbItem } from "@/types";
import vehiclesRoute from "@/routes/vehicles";
import { dashboard } from "@/routes";
import { useState, useCallback, useRef } from "react";

interface Props {
    vehicles: PaginatedResponse<Vehicle>;
}

export default function Index({ vehicles }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Custom debounced search function
    const debouncedSearch = useCallback((term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            router.get('/vehicles', { 
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
        router.get('/vehicles', { 
            page,
            search: searchTerm // Preserve search term when changing pages
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: Column<Vehicle>[] = [
        {
            key: 'ucode',
            header: 'Vehicle Code',
            sortable: true,
            render: (value, row) => (
                <div className="font-mono text-sm font-medium">
                    {row.ucode}
                </div>
            )
        },
        {
            key: 'name',
            header: 'Vehicle Name',
            sortable: true,
            render: (value, row) => (
                <div>
                    <div className="font-medium">{row.name || 'Unnamed Vehicle'}</div>
                    {row.model && (
                        <div className="text-sm text-muted-foreground">{row.model}</div>
                    )}
                </div>
            )
        },
        {
            key: 'type',
            header: 'Type',
            sortable: true,
            render: (value, row) => (
                <Badge variant="outline">
                    {row.type || 'Not specified'}
                </Badge>
            )
        },
        {
            key: 'fuel',
            header: 'Fuel Type',
            sortable: true,
            render: (value, row) => (
                <div>
                    <div className="font-medium">{row.fuel.name}</div>
                    <div className="text-sm text-muted-foreground">{row.fuel.type}</div>
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
            title: 'Vehicles',
            href: vehiclesRoute.index().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicles" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <DataTableWrapper
                    response={vehicles}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search vehicles..."
                    onPageChange={handlePageChange}
                    onSearchChange={handleSearchChange}
                    searchValue={searchTerm}
                    statusText={`Showing ${vehicles.meta.from} to ${vehicles.meta.to} of ${vehicles.meta.total} vehicles`}
                />
            </div>  
        </AppLayout>
    )
} 