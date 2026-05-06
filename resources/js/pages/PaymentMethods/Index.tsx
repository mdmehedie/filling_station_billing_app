import AppLayout from "@/layouts/app-layout";
import { Head, router, useForm } from "@inertiajs/react";
import { DataTable, Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import paymentMethodsRoute from "@/routes/payment-methods";
import { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import DeleteConfirmation from "@/components/DeleteConfirmation";

interface PaymentMethod {
    id: number;
    name: string;
    account_name?: string;
    account_no?: string;
    branch_name?: string;
    type: string;
    is_active: boolean;
    note?: string;
}

interface Props {
    paymentMethods: PaymentMethod[];
    types: string[];
}

export default function Index({ paymentMethods, types }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        account_name: '',
        account_no: '',
        branch_name: '',
        type: '',
        note: '',
        is_active: true,
    });

    const handleOpenModal = (paymentMethod?: PaymentMethod) => {
        if (paymentMethod) {
            setEditingPaymentMethod(paymentMethod);
            setData({
                name: paymentMethod.name,
                account_name: paymentMethod.account_name || '',
                account_no: paymentMethod.account_no || '',
                branch_name: paymentMethod.branch_name || '',
                type: paymentMethod.type,
                note: paymentMethod.note || '',
                is_active: paymentMethod.is_active,
            });
        } else {
            setEditingPaymentMethod(null);
            reset();
        }
        clearErrors();
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPaymentMethod) {
            put(paymentMethodsRoute.update(editingPaymentMethod.id).url, {
                onSuccess: () => handleCloseModal(),
            });
        } else {
            post(paymentMethodsRoute.store().url, {
                onSuccess: () => handleCloseModal(),
            });
        }
    };

    const handleDeleteClick = (paymentMethod: PaymentMethod) => {
        setEditingPaymentMethod(paymentMethod);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (editingPaymentMethod) {
            destroy(paymentMethodsRoute.destroy(editingPaymentMethod.id).url, {
                onSuccess: () => setIsDeleteModalOpen(false),
            });
        }
    };

    const columns: Column<PaymentMethod>[] = useMemo(() => [
        {
            header: 'Name',
            key: 'name',
            sortable: true,
        },
        {
            header: 'Type',
            key: 'type',
            render: (value) => (
                <Badge variant="secondary" className="capitalize">
                    {value.replace('_', ' ')}
                </Badge>
            )
        },
        {
            header: 'Account Info',
            key: 'account_no',
            render: (value, row) => (
                <div>
                    {row.account_name && <div className="font-medium">{row.account_name}</div>}
                    {value && <div className="text-sm text-muted-foreground">{value}</div>}
                    {row.branch_name && (
                        <div className="text-xs text-muted-foreground">{row.branch_name}</div>
                    )}
                </div>
            )
        },
        {
            header: 'Status',
            key: 'is_active',
            render: (value) => (
                <Badge variant={value ? "default" : "secondary"}>
                    {value ? 'Active' : 'Inactive'}
                </Badge>
            )
        },
        {
            header: 'Actions',
            key: 'actions',
            render: (value, row) => (
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(row)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(row)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ], []);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Payment Methods',
            href: paymentMethodsRoute.index().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment Methods" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payment Methods</h1>
                        <p className="text-muted-foreground">
                            Manage your payment methods and account details
                        </p>
                    </div>
                    <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Payment Method
                    </Button>
                </div>

                <DataTable
                    data={paymentMethods}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search payment methods..."
                />

                {/* Create/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
                                <DialogDescription>
                                    Fill in the details for the payment method. Click save when you're done.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Dutch Bangla Bank"
                                    />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select 
                                        value={data.type} 
                                        onValueChange={(value) => setData('type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {types.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="account_name">Account Name</Label>
                                    <Input
                                        id="account_name"
                                        value={data.account_name}
                                        onChange={(e) => setData('account_name', e.target.value)}
                                    />
                                    {errors.account_name && <p className="text-xs text-destructive">{errors.account_name}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="account_no">Account No / Phone</Label>
                                    <Input
                                        id="account_no"
                                        value={data.account_no}
                                        onChange={(e) => setData('account_no', e.target.value)}
                                    />
                                    {errors.account_no && <p className="text-xs text-destructive">{errors.account_no}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="branch_name">Branch Name (Optional)</Label>
                                    <Input
                                        id="branch_name"
                                        value={data.branch_name}
                                        onChange={(e) => setData('branch_name', e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', !!checked)}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingPaymentMethod ? 'Update' : 'Save'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <DeleteConfirmation
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Payment Method"
                    description="Are you sure you want to delete this payment method? This action cannot be undone."
                    itemName={editingPaymentMethod?.name}
                />
            </div>
        </AppLayout>
    )
}
