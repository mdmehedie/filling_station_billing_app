import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import { Fuel, PaginatedResponse } from "@/types/response";
import { BreadcrumbItem } from "@/types";
import fuelsRoute from "@/routes/fuels";
import { dashboard } from "@/routes";
import { useState, useCallback, useRef, useMemo } from "react";
import DeleteConfirmation from "@/components/DeleteConfirmation";

interface Props {
    fuels: PaginatedResponse<Fuel>;
}

export default function Index({ fuels }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        error: string | null;
        fuel: Fuel | null;
    }>({
        isOpen: false,
        error: null,
        fuel: null,
    });

    // Custom debounced search function
    const debouncedSearch = useCallback((term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            router.get('/fuels', { 
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
        router.get('/fuels', { 
            page,
            search: searchTerm // Preserve search term when changing pages
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDeleteClick = (fuel: Fuel) => {
        setDeleteModal({
            isOpen: true,
            fuel,
            error: null,
        });
    };

    const handleDeleteConfirm = () => {
        if (deleteModal.fuel) {
            router.delete(fuelsRoute.destroy(deleteModal.fuel.id).url, {
                onSuccess: () => {
                    setDeleteModal({ isOpen: false, fuel: null, error: null });
                },
                onError: (errors) => {
                    setDeleteModal({ isOpen: true, fuel: null, error: Object.values(errors).join(', ') });
                    
                    throw new Error(Object.values(errors).join(', '));
                }
            });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, fuel: null, error: null });
    };

    const columns: Column<Fuel>[] = useMemo(() => [
        {
            key: 'name',
            header: 'Fuel Name',
            sortable: true,
            render: (value, row) => (
                <div className="font-medium">
                    {row.name}
                </div>
            )
        },
        {
            key: 'price',
            header: 'Price',
            sortable: true,
            render: (value, row) => (
                <div className="font-mono">
                    ৳{Number(row.price).toFixed(2)}
                </div>
            )
        },
        {
            key: 'created_at',
            header: 'Created',
            sortable: true,
            render: (value) => value
        },
        {
            key: 'updated_at',
            header: 'Last Updated',
            sortable: true,
            render: (value) => value
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (value, row) => (
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => router.visit(fuelsRoute.edit(row.id).url)}>
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
            title: 'Fuels',
            href: fuelsRoute.index().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fuels" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Fuels</h1>
                        <p className="text-muted-foreground">
                            Manage fuel types and their pricing
                        </p>
                    </div>
                    <Button 
                        onClick={() => router.visit(fuelsRoute.create().url)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Fuel
                    </Button>
                </div>

                <DataTableWrapper
                    response={fuels}
                    columns={columns}
                    searchable={false}
                    searchPlaceholder="Search fuels..."
                    onPageChange={handlePageChange}
                    onSearchChange={handleSearchChange}
                    searchValue={searchTerm}
                    statusText={`Showing ${fuels.meta.from} to ${fuels.meta.to} of ${fuels.meta.total} fuels`}
                />

                <DeleteConfirmation
                    isOpen={deleteModal.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Fuel"
                    description={`Are you sure you want to delete this fuel? This action cannot be undone. ${deleteModal.error ? `Error: ${deleteModal.error}` : ''}`}
                    itemName={deleteModal.fuel?.name}
                />
            </div>  
        </AppLayout>
    )
} 