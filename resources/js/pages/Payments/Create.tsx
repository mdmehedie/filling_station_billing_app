import AppLayout from "@/layouts/app-layout";
import { Head, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import { Loader2, ArrowLeft, Paperclip, X } from "lucide-react";
import { useMemo } from "react";

interface Organization {
    id: number;
    name: string;
    ucode: string;
}

interface PaymentMethod {
    id: number;
    name: string;
    type: string;
    account_no?: string;
}

interface Props {
    organizations: Organization[];
    paymentMethods: PaymentMethod[];
    selected_organization_id?: string;
}

export default function Create({ organizations, paymentMethods, selected_organization_id }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        organization_id: selected_organization_id || '',
        payment_method_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        tnx_id: '',
        note: '',
        proof: null as File | null,
    });

    const selectedPaymentMethod = useMemo(() => {
        return paymentMethods.find(pm => pm.id.toString() === data.payment_method_id);
    }, [data.payment_method_id, paymentMethods]);

    const isCheckPayment = selectedPaymentMethod?.type === 'check';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/payments');
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Organizations',
            href: '/organizations',
        },
        {
            title: 'Add Payment',
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Payment" />
            <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Record Payment</h1>
                        <p className="text-muted-foreground">
                            Record a new payment received from an organization
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                        <CardDescription>
                            Enter the details of the transaction below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="organization_id">Organization</Label>
                                <Select
                                    value={data.organization_id.toString()}
                                    onValueChange={(value) => setData('organization_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizations.map((org) => (
                                            <SelectItem key={org.id} value={org.id.toString()}>
                                                {org.name} (#{org.ucode})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.organization_id && <p className="text-xs text-destructive">{errors.organization_id}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="payment_method_id">Payment Method</Label>
                                <Select
                                    value={data.payment_method_id.toString()}
                                    onValueChange={(value) => setData('payment_method_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map((pm) => (
                                            <SelectItem key={pm.id} value={pm.id.toString()}>
                                                {pm.name} {pm.account_no ? `(${pm.account_no})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.payment_method_id && <p className="text-xs text-destructive">{errors.payment_method_id}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="amount">Amount (BDT)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        placeholder="0.00"
                                        className="font-semibold text-lg"
                                    />
                                    {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="payment_date">Payment Date</Label>
                                    <Input
                                        id="payment_date"
                                        type="date"
                                        value={data.payment_date}
                                        onChange={(e) => setData('payment_date', e.target.value)}
                                    />
                                    {errors.payment_date && <p className="text-xs text-destructive">{errors.payment_date}</p>}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="tnx_id">Transaction ID / Reference (Optional)</Label>
                                <Input
                                    id="tnx_id"
                                    value={data.tnx_id}
                                    onChange={(e) => setData('tnx_id', e.target.value)}
                                    placeholder="e.g. BK-12345678"
                                />
                                {errors.tnx_id && <p className="text-xs text-destructive">{errors.tnx_id}</p>}
                            </div>

                            {isCheckPayment && (
                                <div className="grid gap-2 p-4 border-2 border-dashed rounded-lg bg-muted/30">
                                    <Label htmlFor="proof" className="flex items-center gap-2 cursor-pointer">
                                        <Paperclip className="h-4 w-4" />
                                        Upload Check Copy / Proof
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            id="proof"
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="hidden"
                                            onChange={(e) => setData('proof', e.target.files?.[0] || null)}
                                        />
                                        {!data.proof ? (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => document.getElementById('proof')?.click()}
                                                className="w-full"
                                            >
                                                Select File
                                            </Button>
                                        ) : (
                                            <div className="flex items-center justify-between w-full p-2 bg-background rounded border">
                                                <span className="text-sm truncate max-w-[200px]">{data.proof.name}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setData('proof', null)}
                                                    className="h-8 w-8 text-destructive"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Please upload a scanned copy or photo of the check (Image or PDF).
                                    </p>
                                    {errors.proof && <p className="text-xs text-destructive">{errors.proof}</p>}
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="note">Note (Optional)</Label>
                                <Input
                                    id="note"
                                    value={data.note}
                                    onChange={(e) => setData('note', e.target.value)}
                                />
                                {errors.note && <p className="text-xs text-destructive">{errors.note}</p>}
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="lg" disabled={processing} className="px-8">
                                    {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Record Payment
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
