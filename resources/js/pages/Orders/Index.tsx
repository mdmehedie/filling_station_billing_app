import AppLayout from "@/layouts/app-layout";
import { Head, router, usePage } from "@inertiajs/react";
import { DataTable, Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, Eye, Download, Filter, X, Plus, ShoppingCart, DollarSign, Calendar, TrendingUp, Truck, Car } from "lucide-react";
import { Order, PaginatedResponse, Fuel, Vehicle } from "@/types/response";
import { BreadcrumbItem, SharedData } from "@/types";
import { dashboard } from "@/routes";
import ordersRoute from "@/routes/orders";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { orderList, getAllOrganizations, getAllVehicles } from "@/lib/api";
import axios from "axios";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import OrganizationSelector from "@/components/OrganizationSelector";
import { Organization } from "@/types/response";
import { currenyFormat, numberFormat } from "@/lib/utils";
import { Switch } from "@headlessui/react";

export default function Index({ fuels }: { fuels: Fuel[] }) {
    const { auth } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
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
    const isInitialLoadRef = useRef(true);
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
        },
        stats: {
            total_vehicles: 0,
            total_quantity: 0,
            total_sales: 0,
        },
    });
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
    const [isFullForm, setisFullForm] = useState(false);
    const [isFullQuantity, setisFullQuantity] = useState(false);
    const [isFullTotalOrder, setisFullTotalOrder] = useState(false);
    const [isFullTotalVehicle, setisFullTotalVehicle] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
    const [pageSize, setPageSize] = useState(15);

    useEffect(() => {
        orderList((response: PaginatedResponse<Order>) => {
            setOrders(response);
            // Update page size from response only on initial load
            if (isInitialLoadRef.current && response.meta?.per_page) {
                setPageSize(response.meta.per_page);
                isInitialLoadRef.current = false;
            }
        });

        // Load filter options
        getAllOrganizations((response: any[]) => {
            setOrganizations(response || []);
        });
    }, []);

    // Load vehicles when organization changes
    useEffect(() => {
        if (selectedOrganization) {
            getAllVehicles((response: Vehicle[]) => {
                setVehicles(response || []);
            }, {
                "organization_id": selectedOrganization.id.toString()
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
                page: 1, // Reset to first page when searching
                per_page: pageSize
            });
        }, 500);
    }, [pageSize]);

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
            "filter[organization_id]": selectedOrganization ? selectedOrganization.id.toString() : "",
            "filter[vehicle_id]": selectedVehicle === "all" ? "" : selectedVehicle,
            "filter[fuel_id]": selectedFuel === "all" ? "" : selectedFuel,
            page: page,
            per_page: pageSize
        });
    };

    const handlePageSizeChange = useCallback((newPageSize: number) => {
        setPageSize(newPageSize);
        // Reset to first page when changing page size
        orderList((response: PaginatedResponse<Order>) => {
            setOrders(response);
        }, {
            "filter[search]": searchTerm,
            "filter[start_date]": startDate,
            "filter[end_date]": endDate,
            "filter[organization_id]": selectedOrganization ? selectedOrganization.id.toString() : "",
            "filter[vehicle_id]": selectedVehicle === "all" ? "" : selectedVehicle,
            "filter[fuel_id]": selectedFuel === "all" ? "" : selectedFuel,
            page: 1,
            per_page: newPageSize
        });
    }, [searchTerm, startDate, endDate, selectedOrganization, selectedVehicle, selectedFuel]);

    const handleFilterChange = () => {
        orderList((response: PaginatedResponse<Order>) => {
            setOrders(response);
        }, {
            "filter[search]": searchTerm,
            "filter[start_date]": startDate,
            "filter[end_date]": endDate,
            "filter[organization_id]": selectedOrganization ? selectedOrganization.id.toString() : "",
            "filter[vehicle_id]": selectedVehicle === "all" ? "" : selectedVehicle,
            "filter[fuel_id]": selectedFuel === "all" ? "" : selectedFuel,
            page: 1,
            per_page: pageSize
        });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
        setSelectedOrganization(null);
        setSelectedVehicle('all');
        setSelectedFuel('all');
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
            page: 1,
            per_page: pageSize
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
                        page: 1,
                        per_page: pageSize
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

    const handleSelectionChange = (selectedIds: (string | number)[]) => {
        setSelectedOrderIds(selectedIds.map(id => Number(id)));
    };

    const handleOrganizationSelect = useCallback((org: Organization | null) => {
        setSelectedOrganization(org);
        setSelectedVehicle('all'); // Reset vehicle selection when organization changes
    }, []);

    const handleBulkDelete = () => {
        if (selectedOrderIds.length === 0) return;
        
        setDeleteModal({
            isOpen: true,
            order: null,
            error: null,
        });
    };

    const handleBulkDeleteConfirm = () => {
        if (selectedOrderIds.length === 0) return;

        // Use the bulk delete endpoint
        axios.delete('/orders', {
            data: {
                ids: selectedOrderIds
            }
        })
            .then(() => {
                setSelectedOrderIds([]);
                setDeleteModal({ isOpen: false, order: null, error: null });
                // Refresh the orders list after successful deletion
                orderList((response: PaginatedResponse<Order>) => {
                    setOrders(response);
                }, {
                    "filter[search]": searchTerm,
                    "filter[start_date]": startDate,
                    "filter[end_date]": endDate,
                    "filter[organization_id]": selectedOrganization ? selectedOrganization.id.toString() : "",
                    "filter[vehicle_id]": selectedVehicle === "all" ? "" : selectedVehicle,
                    "filter[fuel_id]": selectedFuel === "all" ? "" : selectedFuel,
                    page: 1,
                    per_page: pageSize
                });
            })
            .catch((error) => {
                const errorMessage = error.response?.data?.message || 
                    error.response?.data?.error || 
                    'Failed to delete orders. Please try again.';
                setDeleteModal({
                    isOpen: true,
                    order: null,
                    error: errorMessage,
                });
            });
    };

    const columns: Column<Order>[] = useMemo(() => [
        // {
        //     key: 'id',
        //     header: 'Order ID',
        //     sortable: true,
        //     render: (value, row) => (
        //         <div className="font-mono text-sm font-medium">
        //             #{row.id.toString().padStart(4, '0')}
        //         </div>
        //     )
        // },
        {
            key: 'creator',
            header: 'Creator',
            sortable: true,
            render: (value, row) => (
                <div>
                    <div className="font-medium">{row.creator.name}</div>
                    <div className="text-sm text-muted-foreground">
                        {row.creator.email}
                    </div>
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
                        {row.fuel.type} • ৳{row.per_ltr_price}/L
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
                    <div className="font-medium">{currenyFormat(row.total_price)}</div>
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
            key: 'created_at',
            header: 'Created At',
            sortable: true,
            render: (value) => value
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
    ], [auth]);

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

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Orders
                            </CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {isFullTotalOrder ? orders.meta.total : numberFormat(orders.meta.total ?? 0)}
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    All orders based on filter
                                </p>
                                <Switch
                                    checked={isFullTotalOrder}
                                    onChange={setisFullTotalOrder}
                                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isFullTotalOrder ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isFullTotalOrder ? 'translate-x-4' : 'translate-x-0.5'
                                            }`}
                                    />
                                </Switch>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Quantity
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {isFullQuantity ? orders.stats?.total_quantity : numberFormat(orders.stats?.total_quantity ?? 0)} (L)
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    Total quantity based on filter
                                </p>
                                <Switch
                                    checked={isFullQuantity}
                                    onChange={setisFullQuantity}
                                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isFullQuantity ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isFullQuantity ? 'translate-x-4' : 'translate-x-0.5'
                                            }`}
                                    />
                                </Switch>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Sales
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ৳{isFullForm ? orders.stats?.total_sales : numberFormat(orders.stats?.total_sales ?? 0)}
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    Total sales based on filter
                                </p>
                                <Switch
                                    checked={isFullForm}
                                    onChange={setisFullForm}
                                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isFullForm ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isFullForm ? 'translate-x-4' : 'translate-x-0.5'
                                            }`}
                                    />
                                </Switch>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Vehicles
                            </CardTitle>
                            <Car className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {isFullTotalVehicle ? orders.stats?.total_vehicles : numberFormat(orders.stats?.total_vehicles ?? 0)}
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    Total vehicles based on filter
                                </p>
                                <Switch
                                    checked={isFullTotalVehicle}
                                    onChange={setisFullTotalVehicle}
                                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isFullTotalVehicle ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isFullTotalVehicle ? 'translate-x-4' : 'translate-x-0.5'
                                            }`}
                                    />
                                </Switch>
                            </div>
                        </CardContent>
                    </Card>
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
                                        <OrganizationSelector
                                            organizations={organizations}
                                            selectedOrganization={selectedOrganization}
                                            onOrganizationSelect={handleOrganizationSelect}
                                            placeholder="All Organizations"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vehicle-filter" className="text-sm font-medium">
                                            Vehicle
                                        </Label>
                                        <Select
                                            value={selectedVehicle}
                                            onValueChange={setSelectedVehicle}
                                            disabled={!selectedOrganization || vehicles.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={
                                                    !selectedOrganization
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
                                                        vehicle.name?.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
                                                        vehicle.ucode?.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
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

                {/* Bulk Actions Bar */}
                {selectedOrderIds.length > 0 && (
                    <Card className="bg-muted/50">
                        <CardContent className="flex items-center justify-between py-3">
                            <div className="text-sm font-medium">
                                {selectedOrderIds.length} order{selectedOrderIds.length !== 1 ? 's' : ''} selected
                            </div>
                            <div className="flex items-center gap-2">
                                {(auth as any).user?.role === 'admin' && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleBulkDelete}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Selected
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedOrderIds([])}
                                    className="flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Clear Selection
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <DataTable
                    data={orders!.data}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search orders..."
                    serverSidePagination={true}
                    showPagination={true}
                    currentPage={orders!.meta.current_page}
                    lastPage={orders!.meta.last_page}
                    from={orders!.meta.from}
                    to={orders!.meta.to}
                    total={orders!.meta.total}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    onSearchChange={handleSearchChange}
                    searchValue={searchTerm}
                    statusText={`Showing ${orders!.meta.from} to ${orders!.meta.to} of ${orders!.meta.total} orders`}
                    enableSelection={true}
                    selectedRows={selectedOrderIds}
                    onSelectionChange={handleSelectionChange}
                    getRowId={(row) => row.id}
                    responseData={orders!}
                    pageSize={pageSize}
                    pageSizeOptions={[15, 50, 100, 200, 400, 500]}
                />

                <DeleteConfirmation
                    isOpen={deleteModal.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={deleteModal.order ? handleDeleteConfirm : handleBulkDeleteConfirm}
                    title={deleteModal.order ? "Delete Order" : "Delete Selected Orders"}
                    description={
                        deleteModal.order
                            ? `Are you sure you want to delete this order? This action cannot be undone. ${deleteModal.error ? `Error: ${deleteModal.error}` : ''}`
                            : `Are you sure you want to delete ${selectedOrderIds.length} order${selectedOrderIds.length !== 1 ? 's' : ''}? This action cannot be undone. ${deleteModal.error ? `Error: ${deleteModal.error}` : ''}`
                    }
                    itemName={
                        deleteModal.order
                            ? `Order #${deleteModal.order.id.toString().padStart(4, '0')}`
                            : `${selectedOrderIds.length} selected order${selectedOrderIds.length !== 1 ? 's' : ''}`
                    }
                />
            </div>
        </AppLayout>
    )
}
