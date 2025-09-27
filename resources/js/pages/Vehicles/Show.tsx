import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Car, Fuel, Building2, Edit, Trash2, ArrowLeft, Calendar, Hash, Tag } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import vehiclesRoute from "@/routes/vehicles";
import { Vehicle } from "@/types/response";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import { useState } from "react";

interface Props {
    vehicle: Vehicle;
}

export default function Show({ vehicle }: Props) {
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        error: string | null;
    }>({
        isOpen: false,
        error: null,
    });

    const handleDeleteClick = () => {
        setDeleteModal({
            isOpen: true,
            error: null,
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(vehiclesRoute.destroy(vehicle.id).url, {
            onSuccess: () => {
                setDeleteModal({ isOpen: false, error: null });
                router.visit(vehiclesRoute.index().url);
            },
            onError: (errors) => {
                setDeleteModal({ isOpen: true, error: Object.values(errors).join(', ') });
            }
        });
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, error: null });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Vehicles',
            href: vehiclesRoute.index().url,
        },
        {
            title: vehicle.name || 'Vehicle Details',
            href: vehiclesRoute.show(vehicle.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Vehicle - ${vehicle.name || vehicle.ucode}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {vehicle.name || 'Unnamed Vehicle'}
                        </h1>
                        <p className="text-muted-foreground">
                            Vehicle Code: {vehicle.ucode}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => router.visit(vehiclesRoute.index().url)}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Vehicles
                        </Button>
                        <Button 
                            onClick={() => router.visit(vehiclesRoute.edit(vehicle.id).url)}
                            className="flex items-center gap-2"
                        >
                            <Edit className="h-4 w-4" />
                            Edit Vehicle
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleDeleteClick}
                            className="flex items-center gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Vehicle Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                Vehicle Information
                            </CardTitle>
                            <CardDescription>
                                Basic details about this vehicle
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Hash className="h-4 w-4" />
                                        Vehicle Code
                                    </div>
                                    <div className="font-mono text-lg font-semibold">
                                        {vehicle.ucode}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Tag className="h-4 w-4" />
                                        Vehicle Type
                                    </div>
                                    <div>
                                        <Badge variant="outline" className="text-sm">
                                            {vehicle.type || 'Not specified'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">Vehicle Name</div>
                                    <div className="text-lg font-semibold">
                                        {vehicle.name || 'Unnamed Vehicle'}
                                    </div>
                                </div>
                                
                                {vehicle.model && (
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground">Model</div>
                                        <div className="text-lg">{vehicle.model}</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Organization & Fuel Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Organization & Fuel
                            </CardTitle>
                            <CardDescription>
                                Organization and fuel type information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">Organization</div>
                                    <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                                        <Building2 className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <div className="font-semibold">{vehicle.organization.name}</div>
                                            {vehicle.organization.name_bn && (
                                                <div className="text-sm text-muted-foreground">
                                                    {vehicle.organization.name_bn}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">Fuel Type</div>
                                    <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                                        <Fuel className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex-1">
                                            <div className="font-semibold">{vehicle.fuel.name}</div>
                                            {vehicle.fuel.type && (
                                                <div className="text-sm text-muted-foreground">
                                                    {vehicle.fuel.type}
                                                </div>
                                            )}
                                        </div>
                                        <Badge variant="outline" className="ml-2">
                                            ৳{vehicle.fuel.price}/L
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Additional Information
                        </CardTitle>
                        <CardDescription>
                            Creation date and other metadata
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Created At</div>
                                <div className="text-lg">
                                    {new Date(vehicle.created_at).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                            
                            {vehicle.updated_at && vehicle.updated_at !== vehicle.created_at && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                                    <div className="text-lg">
                                        {new Date(vehicle.updated_at).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <DeleteConfirmation
                    isOpen={deleteModal.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Vehicle"
                    description={`Are you sure you want to delete this vehicle? This action cannot be undone. ${deleteModal.error ? `Error: ${deleteModal.error}` : ''}`}
                    itemName={`${vehicle.name || 'Unnamed Vehicle'} (${vehicle.ucode})`}
                />
            </div>
        </AppLayout>
    );
} 