import React, { useState, useCallback, useRef } from 'react'
import { router } from '@inertiajs/react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { LaravelPagination } from '@/components/laravel-pagination'
import { PaginationLink } from '@/types/response'

/**
 * SearchPagination - A reusable component that combines search and pagination functionality
 * 
 * Features:
 * - Debounced search input (500ms delay)
 * - Server-side pagination with Laravel pagination links
 * - Customizable search and page parameters
 * - Optional search, pagination, and status display
 * - Preserves search term when navigating pages
 * - Fully configurable styling
 * 
 * @example
 * ```tsx
 * <SearchPagination
 *   links={data.links}
 *   currentPage={data.current_page}
 *   lastPage={data.last_page}
 *   from={data.from}
 *   to={data.to}
 *   total={data.total}
 *   searchPlaceholder="Search items..."
 *   baseUrl="/items"
 *   statusText="Showing X to Y of Z items"
 * />
 * ```
 */
interface SearchPaginationProps {
    // Pagination data
    links: PaginationLink[]
    currentPage: number
    lastPage: number
    from: number
    to: number
    total: number
    
    // Search configuration
    searchPlaceholder?: string
    searchValue?: string
    onSearchChange?: (value: string) => void
    
    // Navigation configuration
    baseUrl: string
    searchParam?: string
    pageParam?: string
    
    // Display options
    showSearch?: boolean
    showPagination?: boolean
    showStatus?: boolean
    statusText?: string
    
    // Styling
    className?: string
    searchClassName?: string
    statusClassName?: string
}

export function SearchPagination({
    links,
    currentPage,
    lastPage,
    from,
    to,
    total,
    searchPlaceholder = "Search...",
    searchValue = "",
    onSearchChange,
    baseUrl,
    searchParam = "search",
    pageParam = "page",
    showSearch = true,
    showPagination = true,
    showStatus = true,
    statusText,
    className = "",
    searchClassName = "",
    statusClassName = "",
}: SearchPaginationProps) {
    const [searchTerm, setSearchTerm] = useState(searchValue)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Custom debounced search function
    const debouncedSearch = useCallback((term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            const params: Record<string, any> = {
                [searchParam]: term,
                [pageParam]: 1, // Reset to first page when searching
            }
            
            router.get(baseUrl, params, {
                preserveState: true,
                preserveScroll: true,
            })
        }, 500)
    }, [baseUrl, searchParam, pageParam])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchTerm(value)
        
        if (onSearchChange) {
            onSearchChange(value)
        }
        
        debouncedSearch(value)
    }

    const handlePageChange = (page: number) => {
        const params: Record<string, any> = {
            [pageParam]: page,
        }
        
        // Preserve search term when changing pages
        if (searchTerm) {
            params[searchParam] = searchTerm
        }
        
        router.get(baseUrl, params, {
            preserveState: true,
            preserveScroll: true,
        })
    }

    const defaultStatusText = `Showing ${from} to ${to} of ${total} items`

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search Input */}
            {showSearch && (
                <div className="flex items-center justify-between">
                    <div className={`relative w-64 ${searchClassName}`}>
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-8"
                        />
                    </div>
                </div>
            )}

            {/* Status and Pagination */}
            <div className="flex items-center justify-between">
                {showStatus && (
                    <div className={`text-sm text-muted-foreground ${statusClassName}`}>
                        {statusText || defaultStatusText}
                    </div>
                )}
                
                {showPagination && lastPage > 1 && (
                    <LaravelPagination
                        links={links}
                        currentPage={currentPage}
                        lastPage={lastPage}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
        </div>
    )
}
