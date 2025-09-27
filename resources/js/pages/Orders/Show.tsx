import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Car, Fuel, Calendar, DollarSign, Hash, Edit, Trash2, ArrowLeft, Receipt } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import ordersRoute from "@/routes/orders";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import { useState } from "react";

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

interface Props {
    order: Order;
}

export default function Show({ order }: Props) {
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
    }>({
        isOpen: false,
    });

    const handleDeleteClick = () => {
        setDeleteModal({
            isOpen: true,
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(ordersRoute.destroy(order.id).url, {
            onSuccess: () => {
                setDeleteModal({ isOpen: false });
            },
            onError: (errors) => {
                // Error will be handled by the DeleteConfirmation component
                throw new Error(Object.values(errors).join(', '));
            }
        });
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false });
    };

    if (!order || !order.id) {
        return (
            <AppLayout>
                <Head title="Order Not Found" />
                <div className="container mx-auto py-6">
                    <div className="max-w-4xl mx-auto">
                        <Card>
                            <CardContent className="p-6 text-center">
                                <h1 className="text-2xl font-bold text-destructive mb-2">Order Not Found</h1>
                                <p className="text-muted-foreground">The requested order could not be found.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AppLayout>
        );
    }

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
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Order #${order.id.toString().padStart(4, '0')} - Order Details`} />
            <div className="container mx-auto py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Receipt className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Order #{order.id.toString().padStart(4, '0')}</h1>
                                <div className="flex items-center space-x-2 mt-2">
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-mono text-muted-foreground">
                                        ID: {order.id}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.visit(ordersRoute.edit(order.id).url)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-destructive hover:text-destructive"
                                onClick={handleDeleteClick}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => router.visit(ordersRoute.index().url)}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Orders
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Order Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Organization Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Building2 className="h-5 w-5" />
                                    <span>Organization</span>
                                </CardTitle>
                                <CardDescription>
                                    Organization details for this order
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                                    <p className="text-lg font-medium">{order.organization.name}</p>
                                    {order.organization.name_bn && (
                                        <p className="text-sm text-muted-foreground">{order.organization.name_bn}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vehicle Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Car className="h-5 w-5" />
                                    <span>Vehicle</span>
                                </CardTitle>
                                <CardDescription>
                                    Vehicle details for this order
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Vehicle Name</label>
                                    <p className="text-lg font-medium">{order.vehicle.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Vehicle Code</label>
                                    <p className="text-lg font-mono">{order.vehicle.ucode}</p>
                                </div>
                                {order.vehicle.model && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Model</label>
                                        <p className="text-lg">{order.vehicle.model}</p>
                                    </div>
                                )}
                                {order.vehicle.type && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Type</label>
                                        <p className="text-lg">{order.vehicle.type}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Fuel Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Fuel className="h-5 w-5" />
                                    <span>Fuel Details</span>
                                </CardTitle>
                                <CardDescription>
                                    Fuel type and pricing information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Fuel Type</label>
                                    <p className="text-lg font-medium">{order.fuel.name}</p>
                                    {order.fuel.type && (
                                        <p className="text-sm text-muted-foreground">{order.fuel.type}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Price per Liter</label>
                                    <p className="text-lg font-medium">৳{order.fuel.price}/L</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                                    <p className="text-lg font-medium">{order.fuel_qty}L</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <DollarSign className="h-5 w-5" />
                                    <span>Order Summary</span>
                                </CardTitle>
                                <CardDescription>
                                    Pricing and date information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Fuel Price:</span>
                                        <span>৳{order.fuel.price}/L</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Quantity:</span>
                                        <span>{order.fuel_qty}L</span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold">Total Price:</span>
                                        <span className="text-lg font-bold text-primary">৳{order.total_price.toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Sold Date</label>
                                    <p className="text-lg">{new Date(order.sold_date).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}</p>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Order Created</label>
                                    <p className="text-lg">{new Date(order.created_at).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <Fuel className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">Fuel Quantity</span>
                                </div>
                                <p className="text-2xl font-bold">{order.fuel_qty}L</p>
                                <p className="text-xs text-muted-foreground">Total fuel ordered</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
                                </div>
                                <p className="text-2xl font-bold">৳{order.total_price.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Order total value</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">Order Date</span>
                                </div>
                                <p className="text-2xl font-bold">{new Date(order.sold_date).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit'
                                })}</p>
                                <p className="text-xs text-muted-foreground">Date of sale</p>
                            </CardContent>
                        </Card>
                    </div>

                    <DeleteConfirmation
                        isOpen={deleteModal.isOpen}
                        onClose={handleDeleteCancel}
                        onConfirm={handleDeleteConfirm}
                        title="Delete Order"
                        description="Are you sure you want to delete this order? This action cannot be undone."
                        itemName={`Order #${order.id.toString().padStart(4, '0')}`}
                    />
                </div>
            </div>
        </AppLayout>
    );
} 