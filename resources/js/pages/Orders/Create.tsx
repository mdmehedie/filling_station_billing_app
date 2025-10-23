import AppLayout from "@/layouts/app-layout";
import { Head, router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Save, ArrowLeft } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import ordersRoute from "@/routes/orders";
import OrderForm from "@/components/orders/OrderForm";
import KeyboardShortcutsGuide from "@/components/KeyboardShortcutsGuide";
import { Organization } from "@/types/response";
import { Fuel as FuelType } from "@/types/response";
import { draftCache } from "@/lib/draftCache";
interface Props {
    organizations: Organization[];
    fuels: FuelType[];
}

export default function Create({ organizations, fuels }: Props) {
    const { post, processing, errors, reset } = useForm();

    const handleSubmit = (formData: any) => {
        post(ordersRoute.store().url, {
            ...formData,
            onSuccess: () => {
                // Clear draft cache for this specific date on successful submission
                if (formData.sold_date) {
                    draftCache.clearDraftForDate(formData.sold_date);
                }
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
            title: 'Create Order',
            href: ordersRoute.create().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Order" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create New Order</h1>
                        <p className="text-muted-foreground">
                            Add a new fuel order to the system
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <KeyboardShortcutsGuide />
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

                {/* Order Form */}
                <OrderForm
                    organizations={organizations}
                    fuels={fuels}
                    onSubmit={handleSubmit}
                    processing={processing}
                    errors={errors}
                />

                {/* Submit Button */}
                <div className="flex justify-center gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit(ordersRoute.index().url)}
                        tabIndex={-1}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="flex items-center gap-2"
                        form="order-form"
                        tabIndex={-1}
                    >
                        <Save className="h-4 w-4" />
                        {processing ? 'Creating...' : 'Create Order'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
