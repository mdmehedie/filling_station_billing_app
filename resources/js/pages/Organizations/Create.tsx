import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import InputError from '@/components/input-error';
import { Form, Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { LoaderCircle, Upload, X, Image as ImageIcon } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import organizationsRoute from '@/routes/organizations';
import { dashboard } from '@/routes';
import OrganizationController from '@/actions/App/Http/Controllers/OrganizationController';

interface OrganizationFormData {
    name: string;
    name_bn: string;
    ucode: string;
    logo: File | null;
    is_vat_applied: boolean;
    vat_rate: number | string;
}

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm<OrganizationFormData>({
        name: '',
        name_bn: '',
        ucode: '',
        logo: null,
        is_vat_applied: true,
        vat_rate: 0,
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [vatRateFocused, setVatRateFocused] = useState(false);

    const handleFileSelect = (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB');
            return;
        }

        setData('logo', file);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            setLogoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const removeLogo = () => {
        setData('logo', null);
        setLogoPreview(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/organizations', {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setLogoPreview(null);
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Organizations',
            href: organizationsRoute.index().url,
        },
        {
            title: 'Create Organization',
            href: organizationsRoute.create().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Organization" />
            <div className="container mx-auto py-6">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Organization</CardTitle>
                            <CardDescription>
                                Fill in the details to create a new organization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <>
                                    {/* Basic Information */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Basic Information</h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Organization Name *</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder="Enter organization name"
                                                    required
                                                />
                                                <InputError message={errors.name} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="name_bn">Organization Name (Bengali) *</Label>
                                                <Input
                                                    id="name_bn"
                                                    name="name_bn"
                                                    value={data.name_bn}
                                                    onChange={(e) => setData('name_bn', e.target.value)}
                                                    placeholder="Enter organization name in Bengali"
                                                    required
                                                />
                                                <InputError message={errors.name_bn} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="ucode">Organization Code *</Label>
                                            <Input
                                                id="ucode"
                                                name="ucode"
                                                value={data.ucode}
                                                onChange={(e) => setData('ucode', e.target.value)}
                                                placeholder="Enter unique organization code"
                                                required
                                            />
                                            <InputError message={errors.ucode} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="logo">Organization Logo</Label>
                                                
                                            {logoPreview ? (
                                                <div className="relative">
                                                    <div className="flex items-center space-x-4 p-4 border rounded-lg bg-muted/50">
                                                        <img
                                                            src={logoPreview}
                                                            alt="Logo preview"
                                                            className="h-16 w-16 object-cover rounded-lg"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="font-medium">{data.logo?.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {(data.logo?.size || 0) / 1024 / 1024 < 1 
                                                                    ? `${Math.round((data.logo?.size || 0) / 1024)} KB`
                                                                    : `${Math.round((data.logo?.size || 0) / 1024 / 1024 * 10) / 10} MB`
                                                                }
                                                            </p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={removeLogo}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragOver 
                                                        ? 'border-primary bg-primary/5' 
                                                        : 'border-muted-foreground/25 hover:border-primary/50'
                                                        }`}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    onClick={() => document.getElementById('logo-input')?.click()}
                                                >
                                                    <div className="flex flex-col items-center space-y-4">
                                                        <div className="p-3 rounded-full bg-muted">
                                                            <Upload className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                Drop your logo here, or click to browse
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                PNG, JPG, GIF up to 2MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                                
                                            <input
                                                id="logo-input"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileSelect(file);
                                                }}
                                                className="hidden"
                                            />
                                                
                                            <InputError message={errors.logo} />
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* VAT Settings */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">VAT Settings</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Configure tax settings for your organization
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="rounded-lg border bg-card p-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <Label htmlFor="is_vat_applied" className="text-base font-medium">
                                                        Apply VAT
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Enable VAT calculation for transactions
                                                    </p>
                                                </div>
                                                <Checkbox
                                                    id="is_vat_applied"
                                                    name="is_vat_applied"
                                                    checked={data.is_vat_applied}
                                                    onCheckedChange={(checked: boolean) => setData('is_vat_applied', checked)}
                                                    className="h-5 w-5"
                                                />
                                            </div>

                                            {data.is_vat_applied && (
                                                <div className="pt-4 border-t">
                                                    <div className="space-y-3">
                                                        <Label htmlFor="vat_rate" className="text-sm font-medium">
                                                            VAT Rate
                                                        </Label>
                                                        <div className="flex items-center space-x-3">
                                                            <div className="relative flex-1 max-w-[200px]">
                                                                <Input
                                                                    id="vat_rate"
                                                                    name="vat_rate"
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max="100"
                                                                    value={vatRateFocused && data.vat_rate === 0 ? '' : data.vat_rate}
                                                                    onChange={(e) => setData('vat_rate', e.target.value)}
                                                                    onFocus={() => {
                                                                        setVatRateFocused(true);
                                                                        if (data.vat_rate === 0) {
                                                                            setData('vat_rate', '');
                                                                        }
                                                                    }}
                                                                    onBlur={() => {
                                                                        setVatRateFocused(false);
                                                                        if (data.vat_rate === '' || data.vat_rate === null) {
                                                                            setData('vat_rate', 0);
                                                                        } else {
                                                                            setData('vat_rate', parseFloat(data.vat_rate.toString()) || 0);
                                                                        }
                                                                    }}
                                                                    placeholder="0.00"
                                                                    className="text-right pr-8"
                                                                />
                                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                    <span className="text-muted-foreground text-sm">%</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                of transaction value
                                                            </div>
                                                        </div>
                                                        <InputError message={errors.vat_rate} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Submit Button */}
                                    <div className="flex justify-end space-x-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => window.history.back()}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing && (
                                                <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                            )}
                                            Create Organization
                                        </Button>
                                    </div>
                                </>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 