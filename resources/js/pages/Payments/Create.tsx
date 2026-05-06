import AppLayout from "@/layouts/app-layout";
import { Head, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, ArrowLeft, Paperclip, X, Building } from "lucide-react";
import { useMemo } from "react";

interface Organization {
    id: number;
    name: string;
    ucode: string;
}

interface BankAccount {
    id: number;
    name: string;
    account_no?: string;
}

interface Props {
    organization?: Organization;
    organizations: Organization[];
    bankAccounts: BankAccount[];
}

export default function Create({ organization, organizations, bankAccounts }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        organization_id: organization?.id.toString() || '',
        bank_account_id: '',
        type: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        tnx_id: '',
        note: '',
        proof: null as File | null,
    });

    const showProofUpload = data.type === 'bank' || data.type === 'check';

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
            <Head title={`Add Payment - ${organization?.name || 'Organization'}`} />
            <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Record Payment</h1>
                        <p className="text-muted-foreground">
                            {organization ? `Record a new payment received from ${organization.name}` : 'Record a new payment received from an organization'}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Payment Details</span>
                            {organization && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                    <Building className="h-3 w-3 text-primary" />
                                    <span className="text-xs font-bold text-primary">{organization.name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">{organization.ucode}</span>
                                </div>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Enter the details of the transaction below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {!organization && (
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
                            )}

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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Payment Type</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(value) => setData('type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="bank">Bank</SelectItem>
                                            <SelectItem value="check">Check</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                                </div>

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
                            </div>

                            {data.type === 'bank' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="bank_account_id">Bank Information</Label>
                                        <Select
                                            value={data.bank_account_id.toString()}
                                            onValueChange={(value) => setData('bank_account_id', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select bank account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bankAccounts.map((pm) => (
                                                    <SelectItem key={pm.id} value={pm.id.toString()}>
                                                        {pm.name} {pm.account_no ? `(${pm.account_no})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.bank_account_id && <p className="text-xs text-destructive">{errors.bank_account_id}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="tnx_id">Transaction ID / Reference</Label>
                                        <Input
                                            id="tnx_id"
                                            value={data.tnx_id}
                                            onChange={(e) => setData('tnx_id', e.target.value)}
                                            placeholder="e.g. BK-12345678"
                                        />
                                        {errors.tnx_id && <p className="text-xs text-destructive">{errors.tnx_id}</p>}
                                    </div>
                                </div>
                            )}

                            {showProofUpload && (
                                <div className="grid gap-2 p-4 border-2 border-dashed rounded-lg bg-muted/30">
                                    <Label htmlFor="proof" className="flex items-center gap-2 cursor-pointer">
                                        <Paperclip className="h-4 w-4" />
                                        Upload {data.type === 'check' ? 'Check Copy' : 'Deposit Slip'} / Proof
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
                                        Please upload a scanned copy or photo of the {data.type === 'check' ? 'check' : 'deposit slip'} (Image or PDF).
                                    </p>
                                    {errors.proof && <p className="text-xs text-destructive">{errors.proof}</p>}
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="note">Note (Optional)</Label>
                                <Textarea
                                    id="note"
                                    value={data.note}
                                    onChange={(e) => setData('note', e.target.value)}
                                    placeholder="Add any additional details about this payment..."
                                    className="min-h-[100px]"
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
