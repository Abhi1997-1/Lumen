"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

export function PaginationControls({
    totalCount,
    currentPage,
    pageSize
}: {
    totalCount: number,
    currentPage: number,
    pageSize: number
}) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const totalPages = Math.ceil(totalCount / pageSize)

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', pageNumber.toString())
        return `${pathname}?${params.toString()}`
    }

    if (totalPages <= 1) return null;

    // Logic to show page numbers (e.g. 1, 2, 3 ... 10)
    const getPageNumbers = () => {
        const pageNumbers = []
        const maxVisiblePages = 5

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i)
            }
        } else {
            // Complex pagination logic with ...
            if (currentPage <= 3) {
                pageNumbers.push(1, 2, 3, 4, '...', totalPages)
            } else if (currentPage >= totalPages - 2) {
                pageNumbers.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
            } else {
                pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
            }
        }
        return pageNumbers
    }

    return (
        <div className="flex items-center gap-2">
            <Link href={createPageURL(Math.max(1, currentPage - 1))} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </Link>

            {getPageNumbers().map((page, index) => {
                if (page === '...') {
                    return <span key={`ellipsis-${index}`} className="text-muted-foreground px-2"><MoreHorizontal className="h-4 w-4" /></span>
                }

                return (
                    <Link key={page} href={createPageURL(page)}>
                        <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className={`h-8 w-8 p-0 ${currentPage === page ? "pointer-events-none" : ""}`}
                        >
                            {page}
                        </Button>
                    </Link>
                )
            })}

            <Link href={createPageURL(Math.min(totalPages, currentPage + 1))} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </Link>
        </div>
    )
}
