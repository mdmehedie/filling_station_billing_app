import AppLayout from "@/layouts/app-layout";
import { Head, router, useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fuel, Save, ArrowLeft, DollarSign } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import fuelsRoute from "@/routes/fuels";

interface FormData {
    name: string;
    price: string;
}

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        name: '',
        price: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(fuelsRoute.store().url, {
            onSuccess: () => {
                reset();
                router.visit(fuelsRoute.index().url);
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Fuels',
            href: fuelsRoute.index().url,
        },
        {
            title: 'Create Fuel',
            href: fuelsRoute.store().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Fuel" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create New Fuel</h1>
                        <p className="text-muted-foreground">
                            Add a new fuel type to the system
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => router.visit(fuelsRoute.index().url)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Fuels
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="max-w-2xl mx-auto">
                        {/* Fuel Information Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Fuel className="h-5 w-5" />
                                    Fuel Information
                                </CardTitle>
                                <CardDescription>
                                    Basic details about the fuel type
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium">
                                        Fuel Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter fuel name (e.g., Petrol, Diesel, CNG)"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-sm font-medium">
                                        Price per Liter <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.price}
                                            onChange={(e) => setData('price', e.target.value)}
                                            className="pl-10"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    {errors.price && (
                                        <p className="text-sm text-destructive">{errors.price}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Enter the price per liter in Bangladeshi Taka (৳)
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => router.visit(fuelsRoute.index().url)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Creating...' : 'Create Fuel'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 