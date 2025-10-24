import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, User, Calendar, Percent, Hash, Globe, ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import organizationsRoute from '@/routes/organizations';
import { dashboard } from '@/routes';
import { Organization } from '@/types/response';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import { useState } from 'react';
import { router } from '@inertiajs/react';

interface Props {
    organization: Organization;
}

export default function Show({ organization }: Props) {
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
    }>({
        isOpen: false,
    });

    const handleDeleteClick = () => {
        setDeleteModal({
            isOpen: true,
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(organizationsRoute.destroy(organization.id).url, {
            onSuccess: () => {
                setDeleteModal({ isOpen: false });
            },
            onError: (errors) => {
                // Error will be handled by the DeleteConfirmation component
                throw new Error(Object.values(errors).join(', '));
            }
        });
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false });
    };

    if (!organization || !organization.id) {
        return (
            <AppLayout>
                <Head title="Organization Not Found" />
                <div className="container mx-auto py-6">
                    <div className="max-w-4xl mx-auto">
                        <Card>
                            <CardContent className="p-6 text-center">
                                <h1 className="text-2xl font-bold text-destructive mb-2">Organization Not Found</h1>
                                <p className="text-muted-foreground">The requested organization could not be found.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AppLayout>
        );
    }

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
            title: organization.name,
            href: organizationsRoute.show(organization.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.name} - Organization Details`} />
            <div className="container mx-auto py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {organization?.logo_url && (
                                <img
                                    src={organization.logo_url}
                                    alt={organization.name}
                                    className="h-16 w-16 rounded-lg object-cover border"
                                />
                            )}
                            <div>
                                <h1 className="text-3xl font-bold">{organization.name}</h1>
                                {organization.name_bn && (
                                    <p className="text-lg text-muted-foreground">{organization.name_bn}</p>
                                )}
                                <div className="flex items-center space-x-2 mt-2">
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-mono text-muted-foreground">
                                        {organization.ucode}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Link href={organizationsRoute.edit(organization.id).url}>
                                <Button variant="outline" size="sm">
                                    Edit
                                </Button>
                            </Link>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-destructive hover:text-destructive"
                                onClick={handleDeleteClick}
                            >
                                Delete
                            </Button>
                            <Link href={organizationsRoute.index().url}>
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <Separator />

                    {/* Organization Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Building2 className="h-5 w-5" />
                                    <span>Basic Information</span>
                                </CardTitle>
                                <CardDescription>
                                    Organization details and identification
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                                        <p className="text-lg font-medium">{organization.name}</p>
                                    </div>
                                    
                                    {organization.name_bn && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Organization Name (Bengali)</label>
                                            <p className="text-lg font-medium">{organization.name_bn}</p>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Organization Code</label>
                                        <p className="text-lg font-mono font-medium">{organization.ucode}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                                        <p className="text-lg">{new Date(organization.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* VAT Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Percent className="h-5 w-5" />
                                    <span>VAT Settings</span>
                                </CardTitle>
                                <CardDescription>
                                    Tax configuration for this organization
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">VAT Applied</span>
                                    <Badge variant={organization.is_vat_applied ? "default" : "secondary"}>
                                        {organization.is_vat_applied ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                                
                                {organization.is_vat_applied && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">VAT Rate</label>
                                        <p className="text-2xl font-bold text-primary">
                                            {organization.vat_rate}%
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Owner Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <User className="h-5 w-5" />
                                <span>Created By Information</span>
                            </CardTitle>
                            <CardDescription>
                                Organization creator and contact details
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium">{organization.user?.name}</h3>
                                    <p className="text-sm text-muted-foreground">{organization.user.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">Vehicles</span>
                                </div>
                                <p className="text-2xl font-bold">{organization.vehicles_count}</p>
                                <p className="text-xs text-muted-foreground">Total vehicles</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">Orders</span>
                                </div>
                                <p className="text-2xl font-bold">{organization.orders_count}</p>
                                <p className="text-xs text-muted-foreground">Total orders</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                                </div>
                                <p className="text-2xl font-bold">{organization.is_vat_applied ? 'VAT Applied' : 'No VAT'}</p>
                                <p className="text-xs text-muted-foreground">Organization status</p>
                            </CardContent>
                        </Card>
                    </div>

                    <DeleteConfirmation
                        isOpen={deleteModal.isOpen}
                        onClose={handleDeleteCancel}
                        onConfirm={handleDeleteConfirm}
                        title="Delete Organization"
                        description="Are you sure you want to delete this organization? This action cannot be undone."
                        itemName={organization.name}
                    />
                </div>
            </div>
        </AppLayout>
    );
} 