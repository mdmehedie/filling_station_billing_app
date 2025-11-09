import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { DataTable, Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import { Organization, PaginatedResponse } from "@/types/response";
import DeleteConfirmation from "@/components/DeleteConfirmation";

import { BreadcrumbItem } from "@/types";
import organizationsRoute from "@/routes/organizations";
import { dashboard } from "@/routes";
import { useState, useCallback, useRef, useMemo } from "react";

interface Props {
    organizations: PaginatedResponse<Organization>;
}

export default function Index({ organizations }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        error: string | null;
        organization: Organization | null;
    }>({
        isOpen: false,
        error: null,
        organization: null,
    });

    // Custom debounced search function
    const debouncedSearch = useCallback((term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            router.get('/organizations', { 
                "filter[search]": term,
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
            "filter[search]": searchTerm // Preserve search term when changing pages
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDeleteClick = (organization: Organization) => {
        setDeleteModal({
            isOpen: true,
            organization,
            error: null,
        });
    };

    const handleDeleteConfirm = () => {
        if (deleteModal.organization) {
            router.delete(organizationsRoute.destroy(deleteModal.organization.id).url, {
                onSuccess: () => {
                    setDeleteModal({ isOpen: false, organization: null, error: null });
                },
                onError: (errors) => {
                    setDeleteModal({ isOpen: true, organization: null, error: Object.values(errors).join(', ') });
                    
                    throw new Error(Object.values(errors).join(', '));
                }
            });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, organization: null, error: null });
    };

    const columns: Column<Organization>[] = useMemo(() => [
        {
            header: 'Org ID',
            key: 'ucode',
            sortable: true,
            render: (value, row) => (
                <div>
                    <div className="font-medium">#{value}</div>
                </div>
            )
        },
        {
            key: 'name',
            header: 'Organization Name',
            sortable: true,
            render: (value, row) => (
                <div className="flex items-center space-x-3">
                    {row.logo_url && (
                        <img 
                            src={row.logo_url} 
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
                            row.vat_rate ? `Flat: ${row.vat_rate}` : 
                                'Not set'
                    ) : '-'}
                </div>
            )
        },
        {
            key: 'vehicles_count',
            header: 'Vehicles',
            render: (value, row) => (
                <div>{row.vehicles_count}</div>
            )
        },
        {
            key: 'orders_count',
            header: 'Orders',
            render: (value, row) => (
                <div>{row.orders_count}</div>
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
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.visit(organizationsRoute.show(row.id).url)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => router.visit(organizationsRoute.edit(row.id).url)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive" 
                        onClick={() => handleDeleteClick(row)}
                    >
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
            title: 'Organizations',
            href: organizationsRoute.index().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organizations" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
                        <p className="text-muted-foreground">
                            Manage your organizations and their settings
                        </p>
                    </div>
                    <Button 
                        onClick={() => router.visit(organizationsRoute.create().url)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Organization
                    </Button>
                </div>

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
                    responseData={organizations}
                />

                <DeleteConfirmation
                    isOpen={deleteModal.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Organization"
                    description={`Are you sure you want to delete this organization? This action cannot be undone. ${deleteModal.error ? `Error: ${deleteModal.error}` : ''}`}
                    itemName={deleteModal.organization?.name}
                />
            </div>  
        </AppLayout>
    )
} 