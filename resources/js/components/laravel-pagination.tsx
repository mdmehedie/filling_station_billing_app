import React from 'react'
import { PaginationLink } from '@/types/response'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink as PaginationLinkComponent,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'

interface LaravelPaginationProps {
    links: PaginationLink[]
    currentPage: number
    lastPage: number
    onPageChange: (page: number) => void
    className?: string
}

export function LaravelPagination({
    links,
    currentPage,
    lastPage,
    onPageChange,
    className
}: LaravelPaginationProps) {
    const handlePageClick = (page: number | null) => {
        if (page && page !== currentPage) {
            onPageChange(page)
        }
    }

    const renderPaginationItems = () => {
        const items: React.ReactNode[] = []
        const maxVisiblePages = 5

        // Previous button
        items.push(
            <PaginationItem key="previous">
                <PaginationPrevious
                    onClick={() => handlePageClick(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    size="default"
                />
            </PaginationItem>
        )

        if (lastPage <= maxVisiblePages) {
            for (let i = 1; i <= lastPage; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLinkComponent
                            onClick={() => handlePageClick(i)}
                            isActive={currentPage === i}
                            size="default"
                        >
                            {i}
                        </PaginationLinkComponent>
                    </PaginationItem>
                )
            }
        } else {
            // Always show first page
            items.push(
                <PaginationItem key={1}>
                    <PaginationLinkComponent
                        onClick={() => handlePageClick(1)}
                        isActive={currentPage === 1}
                        size="default"
                    >
                        1
                    </PaginationLinkComponent>
                </PaginationItem>
            )

            // Calculate range around current page
            let start = Math.max(2, currentPage - 1)
            let end = Math.min(lastPage - 1, currentPage + 1)

            // Adjust start/end to ensure we show a consistent number of items
            if (currentPage <= 3) {
                start = 2
                end = 4
            } else if (currentPage >= lastPage - 2) {
                start = lastPage - 3
                end = lastPage - 1
            }

            // Start ellipsis
            if (start > 2) {
                items.push(
                    <PaginationItem key="ellipsis-start">
                        <PaginationEllipsis />
                    </PaginationItem>
                )
            }

            // Range pages
            for (let i = start; i <= end; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLinkComponent
                            onClick={() => handlePageClick(i)}
                            isActive={currentPage === i}
                            size="default"
                        >
                            {i}
                        </PaginationLinkComponent>
                    </PaginationItem>
                )
            }

            // End ellipsis
            if (end < lastPage - 1) {
                items.push(
                    <PaginationItem key="ellipsis-end">
                        <PaginationEllipsis />
                    </PaginationItem>
                )
            }

            // Always show last page
            items.push(
                <PaginationItem key={lastPage}>
                    <PaginationLinkComponent
                        onClick={() => handlePageClick(lastPage)}
                        isActive={currentPage === lastPage}
                        size="default"
                    >
                        {lastPage}
                    </PaginationLinkComponent>
                </PaginationItem>
            )
        }

        // Next button
        items.push(
            <PaginationItem key="next">
                <PaginationNext
                    onClick={() => handlePageClick(currentPage + 1)}
                    className={currentPage === lastPage ? "pointer-events-none opacity-50" : ""}
                    size="default"
                />
            </PaginationItem>
        )

        return items
    }

    if (lastPage <= 1) {
        return null
    }

    return (
        <Pagination className={className}>
            <PaginationContent>
                {renderPaginationItems()}
            </PaginationContent>
        </Pagination>
    )
}
