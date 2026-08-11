"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface MonthPickerProps {
  value: string; // Format: "YYYY-MM"
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function MonthPicker({ value, onChange, className, disabled }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse current value
  const { currentYear, currentMonth } = React.useMemo(() => {
    if (!value) {
      const now = new Date();
      return { currentYear: now.getFullYear(), currentMonth: now.getMonth() };
    }
    const [yrStr, moStr] = value.split("-");
    return {
      currentYear: parseInt(yrStr) || new Date().getFullYear(),
      currentMonth: (parseInt(moStr) - 1) || 0
    };
  }, [value]);

  const [displayYear, setDisplayYear] = React.useState(currentYear);

  React.useEffect(() => {
    setDisplayYear(currentYear);
  }, [currentYear, open]);

  const handlePrevYear = () => setDisplayYear(y => y - 1);
  const handleNextYear = () => setDisplayYear(y => y + 1);

  const handleSelectMonth = (monthIndex: number) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    onChange(`${displayYear}-${pad(monthIndex + 1)}`);
    setOpen(false);
  };

  const selectedDate = React.useMemo(() => {
    if (!value) return null;
    const [yr, mo] = value.split("-").map(Number);
    return new Date(yr, mo - 1, 1);
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[125px] h-7 justify-start text-left font-semibold text-[13px] bg-white border-gray-200 text-gray-700 hover:bg-gray-50/80 transition-colors shadow-2xs shrink-0 px-2.5",
            className
          )}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-gray-400 shrink-0" />
          {selectedDate ? format(selectedDate, "MMM yyyy") : "Pick a month"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[100000]">
        <div style={{ justifyContent: "space-between" }} className="flex items-center justify-between px-1 py-1 border-b border-gray-100">
          <button
            type="button"
            onClick={handlePrevYear}
            className="p-1 hover:bg-gray-100 rounded-md text-gray-500 transition-colors cursor-pointer border-0 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span style={{ fontWeight: "500", fontSize: "1rem" }} className="text-xs text-gray-800 ">
            {displayYear}
          </span>
          <button
            type="button"
            onClick={handleNextYear}
            className="p-1 hover:bg-gray-100 rounded-md text-gray-500 transition-colors cursor-pointer border-0 bg-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 mt-2">
          {MONTHS.map((mName, idx) => {
            const isSelected = displayYear === currentYear && idx === currentMonth;
            return (
              <button
                key={mName}
                type="button"
                onClick={() => handleSelectMonth(idx)}
                className={cn(
                  "py-2 text-[12px] font-medium rounded-lg text-center cursor-pointer transition-all border-0",
                  isSelected
                    ? "bg-teal-500 text-white shadow-xs hover:bg-teal-600"
                    : "bg-transparent hover:bg-gray-100 text-gray-700"
                )}
              >
                {mName}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
