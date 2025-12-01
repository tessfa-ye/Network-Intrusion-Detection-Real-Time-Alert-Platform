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

interface DatePickerWithRangeProps {
    className?: string
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
}: DatePickerWithRangeProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Filter by Date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                        <div className="border-r p-2 space-y-2 min-w-[140px]">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-left font-normal"
                                onClick={() => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    setDate({
                                        from: today,
                                        to: new Date()
                                    });
                                }}
                            >
                                Today
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-left font-normal"
                                onClick={() => {
                                    const yesterday = addDays(new Date(), -1);
                                    yesterday.setHours(0, 0, 0, 0);
                                    setDate({
                                        from: yesterday,
                                        to: yesterday
                                    });
                                }}
                            >
                                Yesterday
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-left font-normal"
                                onClick={() => {
                                    const start = addDays(new Date(), -7);
                                    start.setHours(0, 0, 0, 0);
                                    setDate({
                                        from: start,
                                        to: new Date()
                                    });
                                }}
                            >
                                Last 7 days
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-left font-normal"
                                onClick={() => {
                                    const start = addDays(new Date(), -30);
                                    start.setHours(0, 0, 0, 0);
                                    setDate({
                                        from: start,
                                        to: new Date()
                                    });
                                }}
                            >
                                Last 30 days
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-left font-normal"
                                onClick={() => {
                                    const now = new Date();
                                    setDate({
                                        from: new Date(now.getFullYear(), now.getMonth(), 1),
                                        to: new Date(now.getFullYear(), now.getMonth() + 1, 0)
                                    });
                                }}
                            >
                                This Month
                            </Button>
                        </div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
