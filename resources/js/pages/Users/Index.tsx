import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { DataTable, Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Eye, Shield, Mail, Phone, Calendar } from "lucide-react";
import { User, PaginatedResponse } from "@/types/response";
import { BreadcrumbItem } from "@/types";
import usersRoute from "@/routes/users";
import { dashboard } from "@/routes";
import { useState, useCallback, useRef } from "react";

interface Props {
    users: PaginatedResponse<User>;
}

export default function Index({ users }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Custom debounced search function
    const debouncedSearch = useCallback((term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            router.get('/users', { 
                search: term,
                page: 1 // Reset to first page when searching
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500);
    }, []);

    const handleSearchChange = (search: string) => {
        setSearchTerm(search);
        debouncedSearch(search);
    };

    const handlePageChange = (page: number) => {
        router.get('/users', { 
            page,
            search: searchTerm // Preserve search term when changing pages
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleColor = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'admin':
                return 'destructive';
            case 'manager':
                return 'default';
            case 'user':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const columns: Column<User>[] = [
        {
            key: 'name',
            header: 'User',
            sortable: true,
            render: (value, row) => (
                <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={row.avatar} alt={row.name} />
                        <AvatarFallback className="text-xs">
                            {getInitials(row.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-sm text-muted-foreground">{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'role',
            header: 'Role',
            sortable: true,
            render: (value, row) => (
                <Badge variant={getRoleColor(row.role || 'user')}>
                    {row.role || 'User'}
                </Badge>
            )
        },
        {
            key: 'phone',
            header: 'Contact',
            render: (value, row) => (
                <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-3 w-3" />
                        <span>{row.email}</span>
                    </div>
                    {row.phone && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{row.phone}</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'email_verified_at',
            header: 'Verification',
            render: (value, row) => (
                <div className="space-y-1">
                    <Badge variant={row.email_verified_at ? "default" : "secondary"}>
                        {row.email_verified_at ? 'Verified' : 'Unverified'}
                    </Badge>
                    {row.two_factor_enabled && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Shield className="h-3 w-3" />
                            <span>2FA Enabled</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'created_at',
            header: 'Joined',
            sortable: true,
            render: (value) => (
                <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(value).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (value, row) => (
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" title="View User">
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Edit User">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        title="Delete User"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Users',
            href: usersRoute.index().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <DataTable
                    data={users.data}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search users..."
                    serverSidePagination={true}
                    showPagination={true}
                    currentPage={users.meta.current_page}
                    lastPage={users.meta.last_page}
                    from={users.meta.from}
                    to={users.meta.to}
                    total={users.meta.total}
                    onPageChange={handlePageChange}
                    onSearchChange={handleSearchChange}
                    searchValue={searchTerm}
                    statusText={`Showing ${users.meta.from} to ${users.meta.to} of ${users.meta.total} users`}
                />
            </div>  
        </AppLayout>
    )
}
