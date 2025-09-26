import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Eye, Download, Filter, X } from "lucide-react";
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
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
    const [showFilters, setShowFilters] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Custom debounced search function
    const debouncedSearch = useCallback((term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            router.get('/orders', { 
                search: term,
                start_date: startDate,
                end_date: endDate,
                page: 1 // Reset to first page when searching
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500);
    }, [startDate, endDate]);

    const handleSearchChange = (search: string) => {
        setSearchTerm(search);
        debouncedSearch(search);
    };

    const handlePageChange = (page: number) => {
        router.get('/orders', { 
            page,
            search: searchTerm,
            start_date: startDate,
            end_date: endDate
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilterChange = () => {
        router.get('/orders', { 
            search: searchTerm,
            start_date: startDate,
            end_date: endDate,
            page: 1
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
        router.get('/orders', { page: 1 }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams({
                search: searchTerm,
                start_date: startDate,
                end_date: endDate,
                format: exportFormat
            });
            
            const response = await fetch(`/api/orders/export?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orders-export-${new Date().toISOString().split('T')[0]}.${exportFormat === 'pdf' ? 'pdf' : 'xlsx'}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error('Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setIsExporting(false);
        }
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
                {/* Filters and Export Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filters & Export
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                                </Button>
                                <Button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="bg-primary-custom hover:bg-primary-custom/90"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    {isExporting ? 'Exporting...' : 'Export'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    {showFilters && (
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date">Start Date</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date">End Date</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="export-format">Export Format</Label>
                                    <Select value={exportFormat} onValueChange={(value: 'pdf' | 'excel') => setExportFormat(value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pdf">PDF</SelectItem>
                                            <SelectItem value="excel">Excel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button onClick={handleFilterChange} className="flex-1">
                                        Apply Filters
                                    </Button>
                                    <Button variant="outline" onClick={clearFilters}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

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
