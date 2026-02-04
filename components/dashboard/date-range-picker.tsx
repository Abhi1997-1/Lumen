"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter, useSearchParams } from "next/navigation"

export function DatePickerWithRange({
    className,
}: React.HTMLAttributes<HTMLDivElement>) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const fromParam = searchParams.get('from_date')
    const toParam = searchParams.get('to_date')

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: fromParam ? new Date(fromParam) : undefined,
        to: toParam ? new Date(toParam) : undefined,
    })

    // Update URL function
    const onUpdate = (newDate: DateRange | undefined) => {
        setDate(newDate)
        const params = new URLSearchParams(searchParams)

        if (newDate?.from) {
            params.set('from_date', newDate.from.toISOString())
        } else {
            params.delete('from_date')
        }

        if (newDate?.to) {
            params.set('to_date', newDate.to.toISOString())
        } else {
            params.delete('to_date')
        }

        // Clear presets if custom range used
        params.delete('date')
        params.set('page', '1')

        router.replace(`${window.location.pathname}?${params.toString()}`)
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        size="sm"
                        className={cn(
                            "justify-start text-left font-normal bg-card border-border h-9 text-xs px-3",
                            !date && "text-muted-foreground",
                            date ? "w-auto" : "w-[130px]"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd")} -{" "}
                                    {format(date.to, "LLL dd")}
                                </>
                            ) : (
                                format(date.from, "LLL dd")
                            )
                        ) : (
                            <span>Custom Range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={onUpdate}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
