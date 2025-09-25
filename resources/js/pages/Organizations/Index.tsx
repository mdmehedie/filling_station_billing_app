import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { DataTable, Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { Organization, PaginatedResponse } from "@/types/response";

import { BreadcrumbItem } from "@/types";
import organizationsRoute from "@/routes/organizations";
import { dashboard } from "@/routes";
import { useState, useCallback, useRef } from "react";

interface Props {
    organizations: PaginatedResponse<Organization>;
}

export default function Index({ organizations }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Custom debounced search function
    const debouncedSearch = useCallback((term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            router.get('/organizations', { 
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
        router.get('/organizations', { 
            page,
            search: searchTerm // Preserve search term when changing pages
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: Column<Organization>[] = [
        {
            key: 'name',
            header: 'Organization Name',
            sortable: true,
            render: (value, row) => (
                <div className="flex items-center space-x-3">
                    {row.logo && (
                        <img 
                            src={row.logo} 
                            alt={row.name}
                            className="h-8 w-8 rounded-full object-cover"
                        />
                    )}
                    <div>
                        <div className="font-medium">{row.name}</div>
                        {row.name_bn && (
                            <div className="text-sm text-muted-foreground">{row.name_bn}</div>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'user',
            header: 'Owner',
            sortable: true,
            render: (value, row) => (
                <div>
                    <div className="font-medium">{row.user.name}</div>
                    <div className="text-sm text-muted-foreground">{row.user.email}</div>
                </div>
            )
        },
        {
            key: 'is_vat_applied',
            header: 'VAT Status',
            render: (value, row) => (
                <Badge variant={row.is_vat_applied ? "default" : "secondary"}>
                    {row.is_vat_applied ? 'VAT Applied' : 'No VAT'}
                </Badge>
            )
        },
        {
            key: 'vat_rate',
            header: 'VAT Rate',
            render: (value, row) => (
                <div>
                    {row.is_vat_applied ? (
                        row.vat_rate ? `${row.vat_rate}%` : 
                            row.vat_flat_amount ? `Flat: ${row.vat_flat_amount}` : 
                                'Not set'
                    ) : '-'}
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
            title: 'Organizations',
            href: organizationsRoute.index().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organizations" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <DataTable
                    data={organizations.data}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search organizations..."
                    serverSidePagination={true}
                    showPagination={true}
                    currentPage={organizations.meta.current_page}
                    lastPage={organizations.meta.last_page}
                    from={organizations.meta.from}
                    to={organizations.meta.to}
                    total={organizations.meta.total}
                    onPageChange={handlePageChange}
                    onSearchChange={handleSearchChange}
                    searchValue={searchTerm}
                    statusText={`Showing ${organizations.meta.from} to ${organizations.meta.to} of ${organizations.meta.total} organizations`}
                />
            </div>  
        </AppLayout>
    )
} 