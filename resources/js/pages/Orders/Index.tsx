import AppLayout from "@/layouts/app-layout";
import { Head, router, usePage } from "@inertiajs/react";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, Eye, Download, Filter, X, Plus } from "lucide-react";
import { Order, PaginatedResponse, Fuel, Vehicle } from "@/types/response";
import { BreadcrumbItem, SharedData } from "@/types";
import { dashboard } from "@/routes";
import ordersRoute from "@/routes/orders";
import { useState, useCallback, useRef, useEffect } from "react";
import { orderList, getAllOrganizations, getAllVehicles } from "@/lib/api";
import axios from "axios";
import DeleteConfirmation from "@/components/DeleteConfirmation";

export default function Index({ fuels }: { fuels: Fuel[] }) {
    const { auth } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedOrganization, setSelectedOrganization] = useState('all');
    const [selectedVehicle, setSelectedVehicle] = useState('all');
    const [selectedFuel, setSelectedFuel] = useState('all');
    const [showFilters, setShowFilters] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        error: string | null;
        order: Order | null;
    }>({
        isOpen: false,
        error: null,
        order: null,
    });
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [orders, setOrders] = useState<PaginatedResponse<Order>>({
        data: [],
        links: {
            first: '',
            last: '',
            next: '',
            prev: '',
        },
        meta: {
            current_page: 1,
            from: 0,
            last_page: 0,
            links: [],
            path: '',
            per_page: 0,
            to: 0,
            total: 0
        }
    });
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [organizationSearchTerm, setOrganizationSearchTerm] = useState('');
    const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
    

    useEffect(() => {
        orderList((response: PaginatedResponse<Order>) => {
            setOrders(response);
        });
        
        // Load filter options
        getAllOrganizations((response: any[]) => {
            setOrganizations(response || []);
        });
    }, []);

    // Load vehicles when organization changes
    useEffect(() => {
        if (selectedOrganization && selectedOrganization !== 'all') {
            getAllVehicles((response: any[]) => {
                setVehicles(response || []);
            }, {
                "organization_id": selectedOrganization
            });
        } else {
            setVehicles([]);
        }
    }, [selectedOrganization]);


    // Custom debounced search function
    const debouncedSearch = useCallback((term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            orderList((response: PaginatedResponse<Order>) => {
                setOrders(response);
            }, {
                "filter[search]": term,
                page: 1 // Reset to first page when searching
            });
        }, 500);
    }, [startDate, endDate, selectedOrganization, selectedVehicle, selectedFuel]);

    const handleSearchChange = (search: string) => {
        setSearchTerm(search);
        debouncedSearch(search);
    };

    const handlePageChange = (page: number) => {
        orderList((response: PaginatedResponse<Order>) => {
            setOrders(response);
        }, {
            "filter[search]": searchTerm,
            "filter[start_date]": startDate,
            "filter[end_date]": endDate,
            "filter[organization_id]": selectedOrganization === "all" ? "" : selectedOrganization,
            "filter[vehicle_id]": selectedVehicle === "all" ? "" : selectedVehicle,
            "filter[fuel_id]": selectedFuel === "all" ? "" : selectedFuel,
            page: page
        });
    };

    const handleFilterChange = () => {
        orderList((response: PaginatedResponse<Order>) => {
            setOrders(response);
        }, {
            "filter[search]": searchTerm,
            "filter[start_date]": startDate,
            "filter[end_date]": endDate,
            "filter[organization_id]": selectedOrganization === "all" ? "" : selectedOrganization,
            "filter[vehicle_id]": selectedVehicle === "all" ? "" : selectedVehicle,
            "filter[fuel_id]": selectedFuel === "all" ? "" : selectedFuel,
            page: 1
        });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
        setSelectedOrganization('all');
        setSelectedVehicle('all');
        setSelectedFuel('all');
        setOrganizationSearchTerm('');
        setVehicleSearchTerm('');
        orderList((response: PaginatedResponse<Order>) => {
            setOrders(response);
        }, {
            "filter[search]": '',
            "filter[start_date]": '',
            "filter[end_date]": '',
            "filter[organization_id]": '',
            "filter[vehicle_id]": '',
            "filter[fuel_id]": '',
            page: 1
        });
    };

    const handleDeleteClick = (order: Order) => {
        setDeleteModal({
            isOpen: true,
            order,
            error: null,
        });
    };

    const handleDeleteConfirm = () => {
        if (deleteModal.order) {
            router.delete(ordersRoute.destroy(deleteModal.order.id).url, {
                onSuccess: () => {
                    setDeleteModal({ isOpen: false, order: null, error: null });
                    // Refresh the orders list after successful deletion
                    orderList((response: PaginatedResponse<Order>) => {
                        setOrders(response);
                    }, {
                        "filter[search]": searchTerm,
                        "filter[start_date]": startDate,
                        "filter[end_date]": endDate,
                        page: 1
                    });
                },
                onError: (errors) => {
                    setDeleteModal({ isOpen: true, order: null, error: Object.values(errors).join(', ') });

                    throw new Error(Object.values(errors).join(', '));
                }
            });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, order: null, error: null });
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
                    <div className="font-medium">{row.organization.name} ({row.organization.ucode})</div>
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
            render: (value) => new Date(value).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (value, row) => (
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => router.visit(ordersRoute.show(row.id).url)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" hidden={(auth as any).user?.role !== 'admin'} onClick={() => router.visit(ordersRoute.edit(row.id).url)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        hidden={(auth as any).user?.role !== 'admin'}
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
            title: 'Orders',
            href: ordersRoute.index().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
                        <p className="text-muted-foreground">
                            Manage and track all fuel orders
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit(ordersRoute.create().url)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Order
                    </Button>
                </div>

                {/* Filters Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filters
                            </CardTitle>
                        </div>
                    </CardHeader>
                    {showFilters && (
                        <CardContent className="pt-0">
                            <div className="space-y-6">
                                {/* Date Range Filters */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start-date" className="text-sm font-medium">
                                            Start Date
                                        </Label>
                                        <Input
                                            id="start-date"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end-date" className="text-sm font-medium">
                                            End Date
                                        </Label>
                                        <Input
                                            id="end-date"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                {/* Entity Filters */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="organization-filter" className="text-sm font-medium">
                                            Organization
                                        </Label>
                                        <Select value={selectedOrganization} onValueChange={(value) => {
                                            setSelectedOrganization(value);
                                            setSelectedVehicle('all'); // Reset vehicle selection when organization changes
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Organizations" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <div className="p-2">
                                                    <Input 
                                                        placeholder="Search organizations..." 
                                                        className="h-8"
                                                        value={organizationSearchTerm}
                                                        onChange={(e) => setOrganizationSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                <SelectItem value="all">All Organizations</SelectItem>
                                                {organizations
                                                    .filter(org => 
                                                        org.name.toLowerCase().includes(organizationSearchTerm.toLowerCase()) ||
                                                        org.ucode.toLowerCase().includes(organizationSearchTerm.toLowerCase()) ||
                                                        (org.name_bn && org.name_bn.toLowerCase().includes(organizationSearchTerm.toLowerCase()))
                                                    )
                                                    .map((org) => (
                                                        <SelectItem key={org.id} value={org.id.toString()}>
                                                            {org.name} ({org.ucode})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vehicle-filter" className="text-sm font-medium">
                                            Vehicle
                                        </Label>
                                        <Select 
                                            value={selectedVehicle} 
                                            onValueChange={setSelectedVehicle}
                                            disabled={selectedOrganization === 'all' || vehicles.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={
                                                    selectedOrganization === 'all' 
                                                        ? "Select an organization first" 
                                                        : vehicles.length === 0 
                                                            ? "No vehicles found" 
                                                            : "All Vehicles"
                                                } />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <div className="p-2">
                                                    <Input 
                                                        placeholder="Search vehicles..." 
                                                        className="h-8"
                                                        value={vehicleSearchTerm}
                                                        onChange={(e) => setVehicleSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                <SelectItem value="all">All Vehicles</SelectItem>
                                                {vehicles
                                                    .filter(vehicle => 
                                                        vehicle.name.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
                                                        vehicle.ucode.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
                                                        (vehicle.model && vehicle.model.toLowerCase().includes(vehicleSearchTerm.toLowerCase()))
                                                    )
                                                    .map((vehicle) => (
                                                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                                            {vehicle.name} ({vehicle.ucode})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fuel-filter" className="text-sm font-medium">
                                            Fuel Type
                                        </Label>
                                        <Select value={selectedFuel} onValueChange={setSelectedFuel}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Fuel Types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Fuel Types</SelectItem>
                                                {fuels.map((fuel) => (
                                                    <SelectItem key={fuel.id} value={fuel.id.toString()}>
                                                        {fuel.name} (৳{fuel.price}/L)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>


                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleFilterChange}
                                            className="flex items-center gap-2"
                                        >
                                            <Filter className="h-4 w-4" />
                                            Apply Filters
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={clearFilters}
                                            className="flex items-center gap-2"
                                        >
                                            <X className="h-4 w-4" />
                                            Clear All
                                        </Button>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center">
                                        {startDate && endDate && (
                                            <span>
                                                Filtering from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                <DataTableWrapper
                    response={orders!}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search orders..."
                    onPageChange={handlePageChange}
                    onSearchChange={handleSearchChange}
                    searchValue={searchTerm}
                    statusText={`Showing ${orders!.meta.from} to ${orders!.meta.to} of ${orders!.meta.total} orders`}
                />

                <DeleteConfirmation
                    isOpen={deleteModal.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Order"
                    description={`Are you sure you want to delete this order? This action cannot be undone. ${deleteModal.error ? `Error: ${deleteModal.error}` : ''}`}
                    itemName={deleteModal.order ? `Order #${deleteModal.order.id.toString().padStart(4, '0')}` : ''}
                />
            </div>
        </AppLayout>
    )
}
