import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { DataTable, Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Eye, Shield, Mail, Phone, Calendar, Check, X, Loader2, Plus } from "lucide-react";
import { User, PaginatedResponse } from "@/types/response";
import { BreadcrumbItem } from "@/types";
import usersRoute from "@/routes/users";
import { dashboard } from "@/routes";
import { useState, useCallback, useRef, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
    users: PaginatedResponse<User>;
}

export default function Index({ users }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [updatingUsers, setUpdatingUsers] = useState<Set<number>>(new Set());

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
            case 'user':
                return 'secondary';
            default:
                return 'default';
        }
    };

    const handleStatusUpdate = async (userId: number, newStatus: string) => {
        setUpdatingUsers(prev => new Set(prev).add(userId));
        
        try {
            await router.patch(usersRoute.update(userId).url, {
                status: newStatus
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        } catch (error) {
            console.error('Failed to update user status:', error);
        } finally {
            setUpdatingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    const handleRoleUpdate = async (userId: number, newRole: string) => {
        setUpdatingUsers(prev => new Set(prev).add(userId));
        
        try {
            await router.patch(usersRoute.update(userId).url, {
                role: newRole
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        } catch (error) {
            console.error('Failed to update user role:', error);
        } finally {
            setUpdatingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    const columns: Column<User>[] = useMemo(() => [
        {
            key: 'name',
            header: 'User',
            sortable: true,
            render: (value, row) => (
                <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
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
            render: (value, row) => {
                const isUpdating = updatingUsers.has(row.id);
                return (
                    <div className="flex items-center space-x-2">
                        {isUpdating ? (
                            <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">Updating...</span>
                            </div>
                        ) : (
                            <Select
                                value={row.role || 'user'}
                                onValueChange={(newRole) => handleRoleUpdate(row.id, newRole)}
                                disabled={isUpdating || row.id === 1}
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                );
            }
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
            key: 'status',
            header: 'Status',
            render: (value, row) => {
                const isUpdating = updatingUsers.has(row.id);
                const currentStatus = row.status === 'active' ? 'active' : 'inactive';
                
                return (
                    <div className="flex items-center space-x-2">
                        {isUpdating ? (
                            <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">Updating...</span>
                            </div>
                        ) : (
                            <Select
                                value={currentStatus}
                                onValueChange={(newStatus) => handleStatusUpdate(row.id, newStatus)}
                                disabled={isUpdating || row.id === 1}
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                            <span>Active</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                                            <span>Inactive</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                );
            }
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
                    {/* <Button variant="ghost" size="sm" title="View User">
                        <Eye className="h-4 w-4" />
                    </Button> */}
                    <Button variant="ghost" size="sm" title="Edit User" onClick={() => router.get(usersRoute.edit(row.id).url)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        title="Delete User"
                        onClick={() => router.delete(usersRoute.destroy(row.id).url)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ], [updatingUsers]);

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
                <div className="flex justify-between items-center">
                    <div></div>
                    <Button className="flex items-center gap-2" onClick={() => router.get(usersRoute.create().url)}>
                        <Plus className="h-4 w-4" />
                        New User
                    </Button>
                </div>
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
                    responseData={users}
                />
            </div>  
        </AppLayout>
    )
}
