import React from 'react'
import { DataTable, Column } from '@/components/data-table'
import { PaginatedResponse } from '@/types/response'

export interface DataTableWrapperProps<T> {
    response: PaginatedResponse<T>
    columns: Column<T>[]
    searchable?: boolean
    searchPlaceholder?: string
    searchFields?: (keyof T)[]
    pageSize?: number
    pageSizeOptions?: number[]
    className?: string
    emptyMessage?: string
    onRowClick?: (row: T) => void
    showPagination?: boolean
    onPageChange?: (page: number) => void
    onSearchChange?: (search: string) => void
    searchValue?: string
    statusText?: string
}

export function DataTableWrapper<T extends Record<string, any>>({
    response,
    columns,
    searchable = true,
    searchPlaceholder = "Search...",
    searchFields,
    pageSize = 10,
    pageSizeOptions = [5, 10, 20, 50, 100],
    className,
    emptyMessage = "No data available",
    onRowClick,
    showPagination = true,
    onPageChange,
    onSearchChange,
    searchValue = "",
    statusText,
}: DataTableWrapperProps<T>) {
    return (
        <DataTable
            data={response.data}
            columns={columns}
            searchable={searchable}
            searchPlaceholder={searchPlaceholder}
            searchFields={searchFields}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            className={className}
            emptyMessage={emptyMessage}
            onRowClick={onRowClick}
            serverSidePagination={true}
            showPagination={showPagination}
            // Pass the new response structure
            responseData={response}
            onPageChange={onPageChange}
            onSearchChange={onSearchChange}
            searchValue={searchValue}
            statusText={statusText || `Showing ${response.meta.from} to ${response.meta.to} of ${response.meta.total} items`}
        />
    )
}
