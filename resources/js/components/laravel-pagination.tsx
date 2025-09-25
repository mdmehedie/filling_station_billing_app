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

        links.forEach((link, index) => {
            if (link.label.includes('Previous')) {
                items.push(
                    <PaginationItem key="previous">
                        <PaginationPrevious
                            onClick={() => handlePageClick(currentPage - 1)}
                            className={!link.url ? "pointer-events-none opacity-50" : ""}
                            size="default"
                        />
                    </PaginationItem>
                )
            } else if (link.label.includes('Next')) {
                items.push(
                    <PaginationItem key="next">
                        <PaginationNext
                            onClick={() => handlePageClick(currentPage + 1)}
                            className={!link.url ? "pointer-events-none opacity-50" : ""}
                            size="default"
                        />
                    </PaginationItem>
                )
            } else if (link.label.includes('&hellip;') || link.label.includes('...')) {
                items.push(
                    <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                    </PaginationItem>
                )
            } else if (link.page) {
                items.push(
                    <PaginationItem key={link.page}>
                        <PaginationLinkComponent
                            onClick={() => handlePageClick(link.page)}
                            isActive={link.active}
                            size="default"
                        >
                            {link.label}
                        </PaginationLinkComponent>
                    </PaginationItem>
                )
            }
        })

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
