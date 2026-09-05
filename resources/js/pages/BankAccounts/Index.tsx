import AppLayout from "@/layouts/app-layout";
import { Head, router, useForm } from "@inertiajs/react";
import { DataTable, Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import bankAccountsRoute from "@/routes/bank-accounts";
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

interface BankAccount {
    id: number;
    name: string;
    account_name?: string;
    account_no?: string;
    branch_name?: string;
    is_active: boolean;
    note?: string;
}

interface Props {
    bankAccounts: BankAccount[];
}

export default function Index({ bankAccounts }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        account_name: '',
        account_no: '',
        branch_name: '',
        note: '',
        is_active: true,
    });

    const handleOpenModal = (bankAccount?: BankAccount) => {
        if (bankAccount) {
            setEditingBankAccount(bankAccount);
            setData({
                name: bankAccount.name,
                account_name: bankAccount.account_name || '',
                account_no: bankAccount.account_no || '',
                branch_name: bankAccount.branch_name || '',
                note: bankAccount.note || '',
                is_active: bankAccount.is_active,
            });
        } else {
            setEditingBankAccount(null);
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
        if (editingBankAccount) {
            put(bankAccountsRoute.update(editingBankAccount.id).url, {
                onSuccess: () => handleCloseModal(),
            });
        } else {
            post(bankAccountsRoute.store().url, {
                onSuccess: () => handleCloseModal(),
            });
        }
    };

    const handleDeleteClick = (bankAccount: BankAccount) => {
        setEditingBankAccount(bankAccount);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (editingBankAccount) {
            destroy(bankAccountsRoute.destroy(editingBankAccount.id).url, {
                onSuccess: () => setIsDeleteModalOpen(false),
            });
        }
    };

    const columns: Column<BankAccount>[] = useMemo(() => [
        {
            header: 'Name',
            key: 'name',
            sortable: true,
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
                <div className="flex items-center space-x-1">
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
            title: 'Bank Information',
            href: bankAccountsRoute.index().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bank Information" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Bank Information</h1>
                        <p className="text-muted-foreground">
                            Manage your bank accounts and payment details
                        </p>
                    </div>
                    <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Bank Information
                    </Button>
                </div>

                <DataTable
                    data={bankAccounts}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search bank information..."
                />

                {/* Create/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{editingBankAccount ? 'Edit Bank Information' : 'Add Bank Information'}</DialogTitle>
                                <DialogDescription>
                                    Fill in the details for the bank account. Click save when you're done.
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
                                    {editingBankAccount ? 'Update' : 'Save'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <DeleteConfirmation
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Bank Information"
                    description="Are you sure you want to delete this bank information? This action cannot be undone."
                    itemName={editingBankAccount?.name}
                />
            </div>
        </AppLayout>
    )
}
