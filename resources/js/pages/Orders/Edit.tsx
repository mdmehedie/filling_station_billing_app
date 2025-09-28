import AppLayout from "@/layouts/app-layout";
import { Head, router, useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, Car, Fuel, Calendar, Save, ArrowLeft, Search } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import ordersRoute from "@/routes/orders";
import { useState, useEffect } from "react";
import { getAllVehicles } from "@/lib/api";

interface Organization {
    id: number;
    name: string;
    name_bn?: string;
    ucode: string;
}

interface Vehicle {
    id: number;
    name: string;
    ucode: string;
    model?: string;
    type?: string;
    organization_id: number;
    fuel_id?: number;
}

interface Fuel {
    id: number;
    name: string;
    price: number;
    type?: string;
    fuel_id: number;
}

interface Order {
    id: number;
    organization_id: number;
    vehicle_id: number;
    fuel_id: number;
    fuel_qty: number;
    total_price: number;
    sold_date: string;
    created_at: string;
    organization: {
        id: number;
        name: string;
        name_bn?: string;
    };
    vehicle: {
        id: number;
        ucode: string;
        name: string;
        model?: string;
        type?: string;
    };
    fuel: {
        id: number;
        name: string;
        type?: string;
        price: number;
    };
}

interface FormData {
    organization_id: string;
    vehicle_id: string;
    fuel_id: string;
    fuel_qty: string;
    sold_date: string;
}

interface Props {
    order: Order;
    organizations: Organization[];
    fuels: Fuel[];
}

export default function Edit({ order, organizations, fuels }: Props) {
    const { data, setData, put, processing, errors, reset } = useForm<FormData & { total_price: number }>({
        organization_id: order.organization_id.toString(),
        vehicle_id: order.vehicle_id.toString(),
        fuel_id: order.fuel_id.toString(),
        fuel_qty: order.fuel_qty.toString(),
        sold_date: order.sold_date,
        total_price: order.total_price
    });

    const [selectedFuel, setSelectedFuel] = useState<Fuel | null>(null);
    const [totalPrice, setTotalPrice] = useState<number>(order.total_price);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [orgSearchTerm, setOrgSearchTerm] = useState('');

    // Set selected organization on mount
    useEffect(() => {
        const org = organizations.find(o => o.id.toString() === data.organization_id);
        setSelectedOrg(org || null);
    }, [data.organization_id, organizations]);

    // Load vehicles when component mounts or organization changes
    useEffect(() => {
        if (data.organization_id) {
            getAllVehicles((vehicles: Vehicle[]) => {
                setVehicles(vehicles);
            }, { organization_id: data.organization_id });
        }
    }, [data.organization_id]);

    // Update selected fuel and calculate total price
    useEffect(() => {
        if (data.fuel_id) {
            const fuel = fuels.find(f => f.id.toString() === data.fuel_id);
            setSelectedFuel(fuel || null);
        } else {
            setSelectedFuel(null);
        }
    }, [data.fuel_id, fuels]);

    // Calculate total price when fuel or quantity changes
    useEffect(() => {
        if (selectedFuel && data.fuel_qty) {
            const quantity = parseFloat(data.fuel_qty);
            const price = selectedFuel.price;
            const calculatedTotal = quantity * price;
            setTotalPrice(calculatedTotal);
            setData('total_price', calculatedTotal);
        } else {
            setTotalPrice(0);
            setData('total_price', 0);
        }
    }, [selectedFuel, data.fuel_qty, setData]);

    const handleInputChange = (field: keyof FormData, value: string) => {
        setData(field, value);
        
        // Clear related fields when organization changes
        if (field === 'organization_id') {
            setData('vehicle_id', '');
            setData('fuel_qty', '');
            const org = organizations.find(o => o.id.toString() === value);
            setSelectedOrg(org || null);
            getAllVehicles((vehicles: Vehicle[]) => {
                setVehicles(vehicles);
            }, { organization_id: value });
        }
        
        // Auto-select fuel type when vehicle changes
        if (field === 'vehicle_id') {
            setData('fuel_qty', '');
            // Find the selected vehicle and auto-select its fuel type
            const selectedVehicle = vehicles.find(v => v.id.toString() === value);
            if (selectedVehicle && selectedVehicle.fuel_id) {
                setData('fuel_id', selectedVehicle.fuel_id.toString());
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(ordersRoute.update(order.id).url, {
            onSuccess: () => {
                reset();
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Orders',
            href: ordersRoute.index().url,
        },
        {
            title: `Order #${order.id.toString().padStart(4, '0')}`,
            href: ordersRoute.show(order.id).url,
        },
        {
            title: 'Edit Order',
            href: ordersRoute.edit(order.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Order #${order.id.toString().padStart(4, '0')}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Order #{order.id.toString().padStart(4, '0')}</h1>
                        <p className="text-muted-foreground">
                            Update the order details and information
                        </p>
                    </div>
                    <Button 
                        variant="outline"
                        onClick={() => router.visit(ordersRoute.show(order.id).url)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Order
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="max-w-2xl mx-auto space-y-6 border rounded-lg p-6">
                        {/* 1. Sold Date */}
                        <div className="space-y-2">
                            <Label htmlFor="sold_date" className="text-base font-medium">Sold Date *</Label>
                            <Input
                                id="sold_date"
                                type="date"
                                value={data.sold_date}
                                onChange={(e) => handleInputChange('sold_date', e.target.value)}
                                className="h-12"
                            />
                            {errors.sold_date && (
                                <p className="text-sm text-destructive">{errors.sold_date}</p>
                            )}
                        </div>

                        {/* 2. Organization Selection (Searchable) */}
                        <div className="space-y-2">
                            <Label className="text-base font-medium">Organization *</Label>
                            <Select 
                                value={data.organization_id} 
                                onValueChange={(value) => {
                                    const org = organizations.find(o => o.id.toString() === value);
                                    setSelectedOrg(org || null);
                                    handleInputChange('organization_id', value);
                                }}
                            >
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="relative p-2 border-b">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search organizations..."
                                            value={orgSearchTerm}
                                            onChange={(e) => setOrgSearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                            className="pl-10"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {organizations
                                            .filter(org => 
                                                org.name.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
                                                org.ucode.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
                                                (org.name_bn && org.name_bn.toLowerCase().includes(orgSearchTerm.toLowerCase()))
                                            )
                                            .map((org) => (
                                                <SelectItem key={org.id} value={org.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4" />
                                                        <div className="flex flex-col">
                                                            <span>{org.name} ({org.ucode})</span>
                                                            {org.name_bn && (
                                                                <span className="text-sm text-muted-foreground">
                                                                    ({org.name_bn})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        {organizations.filter(org => 
                                            org.name.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
                                            org.ucode.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
                                            (org.name_bn && org.name_bn.toLowerCase().includes(orgSearchTerm.toLowerCase()))
                                        ).length === 0 && (
                                                <div className="p-2 text-sm text-muted-foreground text-center">
                                                    No organizations found
                                                </div>
                                            )}
                                    </div>
                                </SelectContent>
                            </Select>
                            {errors.organization_id && (
                                <p className="text-sm text-destructive">{errors.organization_id}</p>
                            )}
                        </div>

                        {/* 3. Vehicle Selection */}
                        <div className="space-y-2">
                            <Label className="text-base font-medium">Vehicle *</Label>
                            <Select 
                                value={data.vehicle_id} 
                                onValueChange={(value) => handleInputChange('vehicle_id', value)}
                                disabled={!data.organization_id}
                            >
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder={data.organization_id ? "Select vehicle" : "Select organization first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map((vehicle) => (
                                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <Car className="h-4 w-4" />
                                                <div className="flex flex-col">
                                                    <span>{vehicle.name}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {vehicle.ucode} • {vehicle.model || 'No model'}
                                                    </span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.vehicle_id && (
                                <p className="text-sm text-destructive">{errors.vehicle_id}</p>
                            )}
                        </div>

                        {/* 4. Fuel Type */}
                        <div className="space-y-2">
                            <Label className="text-base font-medium">Fuel Type *</Label>
                            <Select 
                                value={data.fuel_id} 
                                onValueChange={(value) => handleInputChange('fuel_id', value)}
                            >
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select fuel type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fuels.map((fuel) => (
                                        <SelectItem key={fuel.id} value={fuel.id.toString()}>
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <Fuel className="h-4 w-4" />
                                                    <span>{fuel.name}</span>
                                                </div>
                                                <Badge variant="secondary" className="ml-2">
                                                    ৳{fuel.price}/L
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.fuel_id && (
                                <p className="text-sm text-destructive">{errors.fuel_id}</p>
                            )}
                        </div>

                        {/* 5. Fuel Quantity */}
                        <div className="space-y-2">
                            <Label htmlFor="fuel_qty" className="text-base font-medium">Fuel Quantity (Liters) *</Label>
                            <Input
                                id="fuel_qty"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.fuel_qty}
                                onChange={(e) => handleInputChange('fuel_qty', e.target.value)}
                                placeholder="Enter quantity in liters"
                                className="h-12"
                            />
                            {errors.fuel_qty && (
                                <p className="text-sm text-destructive">{errors.fuel_qty}</p>
                            )}
                        </div>
                    </div>

                    {/* Summary Section */}
                    {selectedFuel && data.fuel_qty && selectedOrg && (
                        <div className="bg-muted/50 border rounded-lg p-6 space-y-4 max-w-2xl mx-auto">
                            <h3 className="text-lg font-semibold">Order Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Date:</span>
                                        <span className="text-sm font-medium">{new Date(data.sold_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Organization:</span>
                                        <span className="text-sm font-medium">{selectedOrg.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Vehicle:</span>
                                        <span className="text-sm font-medium">
                                            {vehicles.find(v => v.id.toString() === data.vehicle_id)?.name || 'Not selected'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Fuel Type:</span>
                                        <span className="text-sm font-medium">{selectedFuel.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Price per Liter:</span>
                                        <span className="text-sm font-medium">৳{selectedFuel.price}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Quantity:</span>
                                        <span className="text-sm font-medium">{data.fuel_qty}L</span>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">Total Amount:</span>
                                <span className="text-2xl font-bold text-primary">৳{totalPrice.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-center gap-4">
                        <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => router.visit(ordersRoute.show(order.id).url)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing || !data.organization_id || !data.vehicle_id || !data.fuel_id || !data.fuel_qty}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Updating...' : 'Update Order'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 