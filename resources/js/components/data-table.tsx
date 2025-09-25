import React, { useState, useMemo } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'
import { LaravelPagination } from '@/components/laravel-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { DataTableProps } from "@/types/response";

export interface Column<T> {
    key: keyof T | string
    header: string
    sortable?: boolean
    render?: (value: any, row: T) => React.ReactNode
    className?: string
}



export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    searchable = true,
    searchPlaceholder = "Search...",
    searchFields,
    pageSize = 10,
    pageSizeOptions = [5, 10, 20, 50, 100],
    className,
    emptyMessage = "No data available",
    onRowClick,
    serverSidePagination = false,
    showPagination = true,
    // Laravel pagination props
    paginationLinks,
    currentPage,
    lastPage,
    from,
    to,
    total,
    onPageChange,
    onSearchChange,
    searchValue = "",
    statusText,
    // New response structure props
    responseData,
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState(searchValue)
    const [currentPageLocal, setCurrentPageLocal] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(pageSize)
    const [sortConfig, setSortConfig] = useState<{
        key: keyof T | string | null
        direction: 'asc' | 'desc'
    }>({ key: null, direction: 'asc' })

    // Filter data based on search term (only for client-side)
    const filteredData = useMemo(() => {
        if (serverSidePagination || !searchTerm) return data

        const searchFieldsToUse = searchFields || columns.map(col => col.key as keyof T)
    
        return data.filter(item =>
            searchFieldsToUse.some(field => {
                const value = item[field]
                if (value && typeof value === 'object') {
                    // Handle nested objects by searching in their string properties
                    return Object.values(value).some(nestedValue => 
                        nestedValue && nestedValue.toString().toLowerCase().includes(searchTerm.toLowerCase())
                    )
                }
                return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            })
        )
    }, [data, searchTerm, searchFields, columns, serverSidePagination])

    // Sort data (only for client-side)
    const sortedData = useMemo(() => {
        if (serverSidePagination || !sortConfig.key) return filteredData

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key as keyof T]
            const bValue = b[sortConfig.key as keyof T]

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1
            }
            return 0
        })
    }, [filteredData, sortConfig, serverSidePagination])

    // Paginate data (only for client-side)
    const paginatedData = useMemo(() => {
        if (serverSidePagination) return data
        
        const startIndex = (currentPageLocal - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return sortedData.slice(startIndex, endIndex)
    }, [sortedData, currentPageLocal, itemsPerPage, serverSidePagination, data])

    // Calculate pagination - prioritize new response structure
    const currentPageToUse = serverSidePagination ? 
        (responseData?.meta.current_page || currentPage || 1) : 
        currentPageLocal
    const totalPages = serverSidePagination ? 
        (responseData?.meta.last_page || lastPage || 1) : 
        Math.ceil(sortedData.length / itemsPerPage)
    const totalItems = serverSidePagination ? 
        (responseData?.meta.total || total || data.length) : 
        sortedData.length
    const startItem = serverSidePagination ? 
        (responseData?.meta.from || from || 1) : 
        (currentPageLocal - 1) * itemsPerPage + 1
    const endItem = serverSidePagination ? 
        (responseData?.meta.to || to || data.length) : 
        Math.min(currentPageLocal * itemsPerPage, totalItems)

    const handleSort = (key: keyof T | string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const handlePageChange = (page: number) => {
        if (serverSidePagination && onPageChange) {
            onPageChange(page)
        } else {
            setCurrentPageLocal(page)
        }
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchTerm(value)
        
        if (serverSidePagination && onSearchChange) {
            onSearchChange(value)
        }
    }

    const handlePageSizeChange = (newPageSize: string) => {
        setItemsPerPage(Number(newPageSize))
        setCurrentPageLocal(1)
    }

    const renderPaginationItems = () => {
        const items = []
        const maxVisiblePages = 5

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            size="default"
                            onClick={() => handlePageChange(i)}
                            isActive={currentPageToUse === i}
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                )
            }
        } else {
            // Always show first page
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        size="default"
                        onClick={() => handlePageChange(1)}
                        isActive={currentPageToUse === 1}
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            )

            if (currentPageToUse > 3) {
                items.push(
                    <PaginationItem key="ellipsis1">
                        <PaginationEllipsis />
                    </PaginationItem>
                )
            }

            // Show pages around current page
            const start = Math.max(2, currentPageToUse - 1)
            const end = Math.min(totalPages - 1, currentPageToUse + 1)

            for (let i = start; i <= end; i++) {
                if (i !== 1 && i !== totalPages) {
                    items.push(
                        <PaginationItem key={i}>
                            <PaginationLink
                                size="default"
                                onClick={() => handlePageChange(i)}
                                isActive={currentPageToUse === i}
                            >
                                {i}
                            </PaginationLink>
                        </PaginationItem>
                    )
                }
            }

            if (currentPageToUse < totalPages - 2) {
                items.push(
                    <PaginationItem key="ellipsis2">
                        <PaginationEllipsis />
                    </PaginationItem>
                )
            }

            // Always show last page
            if (totalPages > 1) {
                items.push(
                    <PaginationItem key={totalPages}>
                        <PaginationLink
                            size="default"
                            onClick={() => handlePageChange(totalPages)}
                            isActive={currentPageToUse === totalPages}
                        >
                            {totalPages}
                        </PaginationLink>
                    </PaginationItem>
                )
            }
        }

        return items
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search Input at Top */}
            {searchable && (
                <div className="flex items-center justify-between">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-8"
                        />
                    </div>
                    {!serverSidePagination && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                                {startItem}-{endItem} of {totalItems}
                            </span>
                            <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pageSizeOptions.map(size => (
                                        <SelectItem key={size} value={size.toString()}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column, index) => (
                                <TableHead
                                    key={index}
                                    className={column.className}
                                >
                                    {column.sortable ? (
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort(column.key)}
                                            className="h-auto p-0 font-medium hover:bg-transparent"
                                        >
                                            <span className="flex items-center space-x-1">
                                                <span>{column.header}</span>
                                                {sortConfig.key === column.key && (
                                                    sortConfig.direction === 'asc' ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )
                                                )}
                                            </span>
                                        </Button>
                                    ) : (
                                        column.header
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((row, rowIndex) => (
                                <TableRow
                                    key={rowIndex}
                                    className={onRowClick ? "cursor-pointer" : ""}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((column, colIndex) => (
                                        <TableCell key={colIndex} className={column.className}>
                                            {column.render
                                                ? column.render(row[column.key as keyof T], row)
                                                : String(row[column.key as keyof T] || '')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Status and Pagination at Bottom */}
            <div className="flex items-center justify-between">
                {serverSidePagination ? (
                    <div className="text-sm text-muted-foreground">
                        {statusText || `Showing ${startItem} to ${endItem} of ${totalItems} items`}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        {startItem}-{endItem} of {totalItems}
                    </div>
                )}
                
                {showPagination && totalPages > 1 && (
                    serverSidePagination && (responseData?.meta.links || paginationLinks) ? (
                        <LaravelPagination
                            links={responseData?.meta.links || paginationLinks || []}
                            currentPage={currentPageToUse}
                            lastPage={totalPages}
                            onPageChange={handlePageChange}
                        />
                    ) : (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        size="default"
                                        onClick={() => handlePageChange(Math.max(1, currentPageToUse - 1))}
                                        className={currentPageToUse === 1 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                    
                                {renderPaginationItems()}
                    
                                <PaginationItem>
                                    <PaginationNext
                                        size="default"
                                        onClick={() => handlePageChange(Math.min(totalPages, currentPageToUse + 1))}
                                        className={currentPageToUse === totalPages ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )
                )}
            </div>
        </div>
    )
}
