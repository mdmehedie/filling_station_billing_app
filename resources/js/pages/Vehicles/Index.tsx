import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { Column, DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import { Vehicle, PaginatedResponse } from "@/types/response";
import { BreadcrumbItem } from "@/types";
import vehiclesRoute from "@/routes/vehicles";
import { dashboard } from "@/routes";
import { useState, useCallback, useRef } from "react";
import DeleteConfirmation from "@/components/DeleteConfirmation";

interface Props {
    vehicles: PaginatedResponse<Vehicle>;
}

export default function Index({ vehicles }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        error: string | null;
        vehicle: Vehicle | null;
    }>({
        isOpen: false,
        error: null,
        vehicle: null,
    });

    // Custom debounced search function
    const debouncedSearch = useCallback((term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            router.get('/vehicles', { 
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
        router.get('/vehicles', { 
            page,
            "filter[search]": searchTerm // Preserve search term when changing pages
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDeleteClick = (vehicle: Vehicle) => {
        setDeleteModal({
            isOpen: true,
            vehicle,
            error: null,
        });
    };

    const handleDeleteConfirm = () => {
        if (deleteModal.vehicle) {
            router.delete(vehiclesRoute.destroy(deleteModal.vehicle.id).url, {
                onSuccess: () => {
                    setDeleteModal({ isOpen: false, vehicle: null, error: null });
                },
                onError: (errors) => {
                    setDeleteModal({ isOpen: true, vehicle: null, error: Object.values(errors).join(', ') });
                    
                    throw new Error(Object.values(errors).join(', '));
                }
            });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, vehicle: null, error: null });
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
                    <Button variant="ghost" size="sm" onClick={() => router.visit(vehiclesRoute.show(row.id).url)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => router.visit(vehiclesRoute.edit(row.id).url)}>
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
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
                        <p className="text-muted-foreground">
                            Manage your vehicles and their information
                        </p>
                    </div>
                    <Button 
                        onClick={() => router.visit(vehiclesRoute.create().url)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Vehicle
                    </Button>
                </div>
                
                <DataTable
                    data={vehicles.data}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search vehicles..."
                    serverSidePagination={true}
                    showPagination={true}
                    currentPage={vehicles.meta.current_page}
                    lastPage={vehicles.meta.last_page}
                    from={vehicles.meta.from}
                    to={vehicles.meta.to}
                    total={vehicles.meta.total}
                    onPageChange={handlePageChange}
                    onSearchChange={handleSearchChange}
                    searchValue={searchTerm}
                    statusText={`Showing ${vehicles.meta.from} to ${vehicles.meta.to} of ${vehicles.meta.total} vehicles`}
                />

                <DeleteConfirmation
                    isOpen={deleteModal.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Vehicle"
                    description={`Are you sure you want to delete this vehicle? This action cannot be undone. ${deleteModal.error ? `Error: ${deleteModal.error}` : ''}`}
                    itemName={deleteModal.vehicle ? `${deleteModal.vehicle.name || 'Unnamed Vehicle'} (${deleteModal.vehicle.ucode})` : ''}
                />
            </div>  
        </AppLayout>
    )
} 