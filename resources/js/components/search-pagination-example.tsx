// Example usage of DataTableWrapper component for different pages with new response structure

import { DataTableWrapper } from '@/components/data-table-wrapper'
import { Column } from '@/components/data-table'
import { PaginatedResponse, User } from '@/types/response'

// Example 1: Basic usage for Users page with new response structure
export function UsersPage({ users }: { users: PaginatedResponse<User> }) {
    const columns: Column<User>[] = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        { key: 'created_at', header: 'Created', sortable: true }
    ]

    return (
        <div>
            <DataTableWrapper
                response={users}
                columns={columns}
                searchable={true}
                searchPlaceholder="Search users..."
                statusText={`Showing ${users.meta.from} to ${users.meta.to} of ${users.meta.total} users`}
            />
        </div>
    )
}

// Example 2: Custom configuration for Products page
export function ProductsPage({ products }: { products: PaginatedResponse<any> }) {
    const columns: Column<any>[] = [
        { key: 'name', header: 'Product Name', sortable: true },
        { key: 'sku', header: 'SKU', sortable: true },
        { key: 'price', header: 'Price', sortable: true },
        { key: 'created_at', header: 'Created', sortable: true }
    ]

    return (
        <div>
            <DataTableWrapper
                response={products}
                columns={columns}
                searchable={true}
                searchPlaceholder="Search products by name or SKU..."
                statusText={`Found ${products.meta.total} products`}
                className="mb-6"
            />
        </div>
    )
}

// Example 3: Minimal configuration (only pagination, no search)
export function ReportsPage({ reports }: { reports: PaginatedResponse<any> }) {
    const columns: Column<any>[] = [
        { key: 'title', header: 'Report Title', sortable: true },
        { key: 'type', header: 'Type', sortable: true },
        { key: 'created_at', header: 'Generated', sortable: true }
    ]

    return (
        <div>
            <DataTableWrapper
                response={reports}
                columns={columns}
                searchable={false} // Disable search
                statusText={`Page ${reports.meta.current_page} of ${reports.meta.last_page}`}
            />
        </div>
    )
}

// Example 4: Only search, no pagination (for non-paginated data)
export function SearchOnlyPage({ data }: { data: any[] }) {
    const columns: Column<any>[] = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'description', header: 'Description', sortable: true }
    ]

    // Create a mock response structure for non-paginated data
    const mockResponse: PaginatedResponse<any> = {
        data,
        links: {
            first: '',
            last: '',
            prev: null,
            next: null
        },
        meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            links: [],
            path: '',
            per_page: data.length,
            to: data.length,
            total: data.length
        }
    }

    return (
        <div>
            <DataTableWrapper
                response={mockResponse}
                columns={columns}
                searchable={true}
                showPagination={false} // Disable pagination
                searchPlaceholder="Search anything..."
            />
        </div>
    )
}
