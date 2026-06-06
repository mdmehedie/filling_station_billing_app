import BankSelector from '@/components/BankSelector';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Building, Loader2, Paperclip, X } from 'lucide-react';
import { useMemo } from 'react';

interface Organization {
    id: number;
    name: string;
    ucode: string;
    total_due?: number;
    name_bn?: string;
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

export default function Create({
    organization,
    organizations,
    bankAccounts,
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        organization_id: organization?.id.toString() || '',
        bank_account_id: '',
        method: '',
        type: 'regular_paid',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        tnx_id: '',
        note: '',
        sender_bank: '',
        check_number: '',
        check_date: '',
        proof: null as File | null,
    });

    const selectedOrg = useMemo(() => {
        if (organization) return organization;
        if (!data.organization_id) return null;
        return (
            organizations.find(
                (org) => org.id.toString() === data.organization_id.toString(),
            ) || null
        );
    }, [organization, data.organization_id, organizations]);

    const { dueAmount, isDuePositive } = useMemo(() => {
        if (!selectedOrg) return { dueAmount: 0, isDuePositive: false };
        const due = Number(selectedOrg.total_due || 0);
        return { dueAmount: due, isDuePositive: due > 0 };
    }, [selectedOrg]);

    const showProofUpload = data.method === 'bank' || data.method === 'check';

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
            <Head
                title={`Add Payment - ${organization?.name || 'Organization'}`}
            />
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Record Payment
                        </h1>
                        <p className="text-muted-foreground">
                            {organization
                                ? `Record a new payment received from ${organization.name}`
                                : 'Record a new payment received from an organization'}
                        </p>
                    </div>
                </div>

                {selectedOrg && (
                    <div
                        className={`flex flex-col items-start justify-between gap-4 rounded-xl border bg-gradient-to-br p-5 shadow-sm transition-all duration-300 sm:flex-row sm:items-center ${
                            isDuePositive
                                ? 'border-amber-100 from-amber-50/50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-950'
                                : 'border-emerald-100 from-emerald-50/50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-950'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                    isDuePositive
                                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50'
                                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50'
                                }`}
                            >
                                <Building className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        {selectedOrg.name}
                                    </h2>
                                    <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                        {selectedOrg.ucode}
                                    </span>
                                </div>
                                {selectedOrg.name_bn && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {selectedOrg.name_bn}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div
                            className={`flex w-full flex-col items-start rounded-lg border px-4 py-2 transition-colors sm:w-auto sm:items-end ${
                                isDuePositive
                                    ? 'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                    : 'border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                            }`}
                        >
                            <span className="text-[10px] font-extrabold tracking-wider uppercase opacity-90">
                                {isDuePositive
                                    ? 'Total Due Amount'
                                    : dueAmount < 0
                                      ? 'Advance Balance'
                                      : 'Total Due Amount'}
                            </span>
                            <span
                                className={`text-2xl font-black ${
                                    isDuePositive
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                            >
                                {new Intl.NumberFormat('en-BD', {
                                    style: 'currency',
                                    currency: 'BDT',
                                }).format(Math.abs(dueAmount))}
                            </span>
                        </div>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                        <CardDescription>
                            Enter the details of the transaction below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {!organization && (
                                <div className="grid gap-2">
                                    <Label htmlFor="organization_id">
                                        Organization
                                    </Label>
                                    <Select
                                        value={data.organization_id.toString()}
                                        onValueChange={(value) =>
                                            setData('organization_id', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select organization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {organizations.map((org) => (
                                                <SelectItem
                                                    key={org.id}
                                                    value={org.id.toString()}
                                                >
                                                    {org.name} (#{org.ucode})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.organization_id && (
                                        <p className="text-xs text-destructive">
                                            {errors.organization_id}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="payment_date">
                                    Payment Date
                                </Label>
                                <Input
                                    id="payment_date"
                                    type="date"
                                    value={data.payment_date}
                                    onChange={(e) =>
                                        setData('payment_date', e.target.value)
                                    }
                                />
                                {errors.payment_date && (
                                    <p className="text-xs text-destructive">
                                        {errors.payment_date}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="type">
                                        Payment Category
                                    </Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(value) =>
                                            setData(
                                                'type',
                                                value as
                                                    | 'regular_paid'
                                                    | 'prev_paid',
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="regular_paid">
                                                Regular Paid
                                            </SelectItem>
                                            <SelectItem value="prev_paid">
                                                Previous Paid
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-xs text-destructive">
                                            {errors.type}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="method">
                                        Payment Method
                                    </Label>
                                    <Select
                                        value={data.method}
                                        onValueChange={(value) =>
                                            setData(
                                                'method',
                                                value as
                                                    | 'bank'
                                                    | 'check'
                                                    | 'cash',
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bank">
                                                Bank
                                            </SelectItem>
                                            <SelectItem value="check">
                                                Check
                                            </SelectItem>
                                            <SelectItem value="cash">
                                                Cash
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.method && (
                                        <p className="text-xs text-destructive">
                                            {errors.method}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount (BDT)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) =>
                                        setData('amount', e.target.value)
                                    }
                                    placeholder="0.00"
                                    className="text-lg font-semibold"
                                />
                                {errors.amount && (
                                    <p className="text-xs text-destructive">
                                        {errors.amount}
                                    </p>
                                )}
                            </div>

                            {data.method === 'bank' && (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="bank_account_id">
                                            Recieved Account
                                        </Label>
                                        <Select
                                            value={data.bank_account_id.toString()}
                                            onValueChange={(value) =>
                                                setData(
                                                    'bank_account_id',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select bank account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bankAccounts.map((pm) => (
                                                    <SelectItem
                                                        key={pm.id}
                                                        value={pm.id.toString()}
                                                    >
                                                        {pm.name}{' '}
                                                        {pm.account_no
                                                            ? `(${pm.account_no})`
                                                            : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.bank_account_id && (
                                            <p className="text-xs text-destructive">
                                                {errors.bank_account_id}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="tnx_id">
                                            Transaction ID / Reference
                                        </Label>
                                        <Input
                                            id="tnx_id"
                                            value={data.tnx_id}
                                            onChange={(e) =>
                                                setData(
                                                    'tnx_id',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. BK-12345678"
                                        />
                                        {errors.tnx_id && (
                                            <p className="text-xs text-destructive">
                                                {errors.tnx_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(data.method === 'bank' ||
                                data.method === 'check') && (
                                <div className="grid gap-2">
                                    <Label htmlFor="sender_bank">
                                        Sender Bank (From which bank they sent?)
                                    </Label>
                                    <BankSelector
                                        selectedBank={data.sender_bank}
                                        onBankSelect={(bank) =>
                                            setData('sender_bank', bank)
                                        }
                                        error={errors.sender_bank}
                                    />
                                </div>
                            )}

                            {data.method === 'check' && (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="check_number">
                                            Check Number
                                        </Label>
                                        <Input
                                            id="check_number"
                                            value={data.check_number}
                                            onChange={(e) =>
                                                setData(
                                                    'check_number',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter check number"
                                        />
                                        {errors.check_number && (
                                            <p className="text-xs text-destructive">
                                                {errors.check_number}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="check_date">
                                            Check Date
                                        </Label>
                                        <Input
                                            id="check_date"
                                            type="date"
                                            value={data.check_date}
                                            onChange={(e) =>
                                                setData(
                                                    'check_date',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.check_date && (
                                            <p className="text-xs text-destructive">
                                                {errors.check_date}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {showProofUpload && (
                                <div className="grid gap-2 rounded-lg border-2 border-dashed bg-muted/30 p-4">
                                    <Label
                                        htmlFor="proof"
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                        Upload{' '}
                                        {data.method === 'check'
                                            ? 'Check Copy'
                                            : 'Deposit Slip'}{' '}
                                        / Proof
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            id="proof"
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="hidden"
                                            onChange={(e) =>
                                                setData(
                                                    'proof',
                                                    e.target.files?.[0] || null,
                                                )
                                            }
                                        />
                                        {!data.proof ? (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() =>
                                                    document
                                                        .getElementById('proof')
                                                        ?.click()
                                                }
                                                className="w-full"
                                            >
                                                Select File
                                            </Button>
                                        ) : (
                                            <div className="flex w-full items-center justify-between rounded border bg-background p-2">
                                                <span className="max-w-[200px] truncate text-sm">
                                                    {data.proof.name}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setData('proof', null)
                                                    }
                                                    className="h-8 w-8 text-destructive"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Please upload a scanned copy or photo of
                                        the{' '}
                                        {data.method === 'check'
                                            ? 'check'
                                            : 'deposit slip'}{' '}
                                        (Image or PDF).
                                    </p>
                                    {errors.proof && (
                                        <p className="text-xs text-destructive">
                                            {errors.proof}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="note">Note (Optional)</Label>
                                <Textarea
                                    id="note"
                                    value={data.note}
                                    onChange={(e) =>
                                        setData('note', e.target.value)
                                    }
                                    placeholder="Add any additional details about this payment..."
                                    className="min-h-[100px]"
                                />
                                {errors.note && (
                                    <p className="text-xs text-destructive">
                                        {errors.note}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={processing}
                                    className="px-8"
                                >
                                    {processing && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
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
