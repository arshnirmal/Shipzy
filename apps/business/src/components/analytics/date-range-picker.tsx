"use client";

import { useEffect, useState } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRange } from "react-day-picker";

type DateRangePickerProps = {
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly onChange: (dateFrom: string, dateTo: string) => void;
  readonly className?: string;
};

export function DateRangePicker({ dateFrom, dateTo, onChange, className }: DateRangePickerProps) {
  // Convert basic strings (YYYY-MM-DD) to DateRange object for the calendar
  const initialRange: DateRange | undefined =
    dateFrom && dateTo
      ? {
          from: new Date(dateFrom),
          to: new Date(dateTo),
        }
      : undefined;

  const [date, setDate] = useState<DateRange | undefined>(initialRange);

  // Sync back to strings when date changes validly
  useEffect(() => {
    if (date?.from && date?.to) {
      const fromStr = format(date.from, "yyyy-MM-dd");
      const toStr = format(date.to, "yyyy-MM-dd");
      if (fromStr !== dateFrom || toStr !== dateTo) {
        onChange(fromStr, toStr);
      }
    }
  }, [date, dateFrom, dateTo, onChange]);

  const setPreset = (days: number) => {
    const today = new Date();
    setDate({
      from: startOfDay(subDays(today, days)),
      to: endOfDay(today),
    });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="hidden sm:block">
        <Select
          onValueChange={(value) => {
            if (value === "7d") setPreset(7);
            if (value === "30d") setPreset(30);
            if (value === "90d") setPreset(90);
          }}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Presets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Popover>
        <PopoverTrigger render={
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal bg-background",
              !date && "text-muted-foreground"
            )}
          />
        }>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {!date?.from && <span>Pick a date range</span>}
            {date?.from && !date.to && format(date.from, "LLL dd, y")}
            {date?.from && date.to && (
              <>
                {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
              </>
            )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
