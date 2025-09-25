import React from 'react'
import { DataTable, Column } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye } from 'lucide-react'

// Example interface for demonstration
interface User {
    id: number
    name: string
    email: string
    role: 'admin' | 'user' | 'moderator'
    status: 'active' | 'inactive'
    created_at: string
}

// Example data
const exampleUsers: User[] = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-15T10:30:00Z'
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        status: 'active',
        created_at: '2024-01-16T14:20:00Z'
    },
    {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'moderator',
        status: 'inactive',
        created_at: '2024-01-17T09:15:00Z'
    }
]

export function DataTableExample() {
    const columns: Column<User>[] = [
        {
            key: 'name',
            header: 'Name',
            sortable: true,
            render: (value, row) => (
                <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-sm text-muted-foreground">{row.email}</div>
                </div>
            )
        },
        {
            key: 'role',
            header: 'Role',
            sortable: true,
            render: (value) => (
                <Badge variant={value === 'admin' ? 'default' : value === 'moderator' ? 'secondary' : 'outline'}>
                    {value}
                </Badge>
            )
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (value) => (
                <Badge variant={value === 'active' ? 'default' : 'secondary'}>
                    {value}
                </Badge>
            )
        },
        {
            key: 'created_at',
            header: 'Created',
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString()
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (value, row) => (
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">DataTable Example</h2>
                <p className="text-muted-foreground">
                    This is an example of how to use the DataTable component with pagination, sorting, and search.
                </p>
            </div>
      
            <DataTable
                data={exampleUsers}
                columns={columns}
                searchable={true}
                searchPlaceholder="Search users..."
                searchFields={['name', 'email']}
                pageSize={5}
                pageSizeOptions={[5, 10, 20]}
                emptyMessage="No users found"
                onRowClick={(row) => console.log('Row clicked:', row)}
            />
        </div>
    )
}

export default DataTableExample
