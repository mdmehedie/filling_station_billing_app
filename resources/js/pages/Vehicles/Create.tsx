import AppLayout from "@/layouts/app-layout";
import { Head, router, useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Car, Fuel, Building2, Save, ArrowLeft, Hash } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import vehiclesRoute from "@/routes/vehicles";
import { useState } from "react";
import { Organization, Fuel as FuelType } from "@/types/response";

interface FormData {
    fuel_id: string;
    organization_id: string;
    ucode: string;
    name: string;
    model: string;
    type: string;
}

interface Props {
    organizations: Organization[];
    fuels: FuelType[];
}

export default function Create({ organizations, fuels }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        fuel_id: '',
        organization_id: '',
        ucode: '',
        name: '',
        model: '',
        type: '',
    });

    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
    const [selectedFuel, setSelectedFuel] = useState<FuelType | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(vehiclesRoute.store().url, {
            onSuccess: () => {
                reset();
                router.visit(vehiclesRoute.index().url);
            },
        });
    };

    const handleOrganizationChange = (value: string) => {
        const org = organizations.find(o => o.id.toString() === value);
        setSelectedOrganization(org || null);
        setData('organization_id', value);
    };

    const handleFuelChange = (value: string) => {
        const fuel = fuels.find(f => f.id.toString() === value);
        setSelectedFuel(fuel || null);
        setData('fuel_id', value);
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
            title: 'Create Vehicle',
            href: vehiclesRoute.store().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Vehicle" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create New Vehicle</h1>
                        <p className="text-muted-foreground">
                            Add a new vehicle to your organization
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => router.visit(vehiclesRoute.index().url)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Vehicles
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Vehicle Information Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Car className="h-5 w-5" />
                                    Vehicle Information
                                </CardTitle>
                                <CardDescription>
                                    Basic details about the vehicle
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ucode" className="text-sm font-medium">
                                        Vehicle Code <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="ucode"
                                            value={data.ucode}
                                            onChange={(e) => setData('ucode', e.target.value)}
                                            className="pl-10"
                                            placeholder="Enter unique vehicle code"
                                            required
                                        />
                                    </div>
                                    {errors.ucode && (
                                        <p className="text-sm text-destructive">{errors.ucode}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium">
                                        Vehicle Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter vehicle name"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="model" className="text-sm font-medium">
                                        Model
                                    </Label>
                                    <Input
                                        id="model"
                                        value={data.model}
                                        onChange={(e) => setData('model', e.target.value)}
                                        placeholder="Enter vehicle model"
                                    />
                                    {errors.model && (
                                        <p className="text-sm text-destructive">{errors.model}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type" className="text-sm font-medium">
                                        Vehicle Type
                                    </Label>
                                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select vehicle type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="car">Car</SelectItem>
                                            <SelectItem value="truck">Truck</SelectItem>
                                            <SelectItem value="bus">Bus</SelectItem>
                                            <SelectItem value="motorcycle">Motorcycle</SelectItem>
                                            <SelectItem value="van">Van</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-destructive">{errors.type}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Organization & Fuel Selection Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Organization & Fuel
                                </CardTitle>
                                <CardDescription>
                                    Select the organization and fuel type for this vehicle
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="organization_id" className="text-sm font-medium">
                                        Organization <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={data.organization_id} onValueChange={handleOrganizationChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select organization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {organizations.map((org) => (
                                                <SelectItem key={org.id} value={org.id.toString()}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{org.name}</span>
                                                        {org.name_bn && (
                                                            <span className="text-sm text-muted-foreground">{org.name_bn}</span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.organization_id && (
                                        <p className="text-sm text-destructive">{errors.organization_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fuel_id" className="text-sm font-medium">
                                        Fuel Type <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={data.fuel_id} onValueChange={handleFuelChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select fuel type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {fuels.map((fuel) => (
                                                <SelectItem key={fuel.id} value={fuel.id.toString()}>
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{fuel.name}</span>
                                                            {fuel.type && (
                                                                <span className="text-sm text-muted-foreground">{fuel.type}</span>
                                                            )}
                                                        </div>
                                                        <Badge variant="outline" className="ml-2">
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

                                {/* Selected Information Display */}
                                {(selectedOrganization || selectedFuel) && (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium">Selected Information:</h4>
                                            
                                            {selectedOrganization && (
                                                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="font-medium">{selectedOrganization.name}</div>
                                                        {selectedOrganization.name_bn && (
                                                            <div className="text-sm text-muted-foreground">{selectedOrganization.name_bn}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedFuel && (
                                                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                                                    <Fuel className="h-4 w-4 text-muted-foreground" />
                                                    <div className="flex-1">
                                                        <div className="font-medium">{selectedFuel.name}</div>
                                                        {selectedFuel.type && (
                                                            <div className="text-sm text-muted-foreground">{selectedFuel.type}</div>
                                                        )}
                                                    </div>
                                                    <Badge variant="outline">৳{selectedFuel.price}/L</Badge>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => router.visit(vehiclesRoute.index().url)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Creating...' : 'Create Vehicle'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 