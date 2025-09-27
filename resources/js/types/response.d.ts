export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role?: string;
    status?: string;
    created_at: string;
    updated_at: string;
}

export interface Organization {
    id: number;
    user_id: number;
    ucode: string;
    name: string;
    name_bn: string;
    logo?: string;
    logo_url?: string;
    is_vat_applied: number;
    vat_rate?: string;
    deleted_at?: string;
    created_at: string;
    vehicles_count?: number;
    orders_count?: number;
    user: User;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[]
    searchable?: boolean
    searchPlaceholder?: string
    searchFields?: (keyof T)[]
    pageSize?: number
    pageSizeOptions?: number[]
    className?: string
    emptyMessage?: string
    onRowClick?: (row: T) => void
    serverSidePagination?: boolean
    showPagination?: boolean
    // Laravel pagination props
    paginationLinks?: PaginationLink[]
    currentPage?: number
    lastPage?: number
    from?: number
    to?: number
    total?: number
    onPageChange?: (page: number) => void
    onSearchChange?: (search: string) => void
    searchValue?: string
    statusText?: string
    // New response structure props
    responseData?: PaginatedResponse<T>
}

export interface Links {
    first: string;
    last: string;
    next: string;
    prev: string;
}


export interface PaginatedResponse<T> {
    data: T[];
    links: Links;
    meta: {
        current_page: number
        from: number
        last_page: number
        links: PaginationLink[]
        path: string
        per_page: number
        to: number
        total: number
    }
}

export interface Vehicle {
    id: number;
    fuel_id: number;
    organization_id: number;
    ucode: string;
    name?: string;
    model?: string;
    type?: string;
    deleted_at?: string;
    created_at: string;
    updated_at: string;
    fuel: {
        id: number;
        name: string;
        type: string;
        price: number;
    };
    organization: {
        id: number;
        name: string;
        name_bn: string;
    };
}

export interface Fuel {
    id: number;
    name: string;
    type: string;
    price: number;
    deleted_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: number;
    organization_id: number;
    vehicle_id: number;
    fuel_id: number;
    fuel_qty: number;
    total_price: number;
    sold_date: string;
    created_at: string;
    updated_at: string;
    organization: {
        id: number;
        name: string;
        name_bn: string;
    };
    vehicle: {
        id: number;
        ucode: string;
        name?: string;
        model?: string;
        type?: string;
    };
    fuel: {
        id: number;
        name: string;
        type: string;
        price: number;
    };
}

// Generic interface for search and pagination props
export interface SearchPaginationData {
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
}