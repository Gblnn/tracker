import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn(
        "p-3 bg-background rounded-xl border shadow-sm w-fit",
        className
      )}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),

        /* layout */
        months: cn("flex flex-col gap-4", defaultClassNames.months),
        month: cn("flex flex-col gap-4", defaultClassNames.month),

        /* navigation FIXED */
        nav: cn(
  "relative flex items-center justify-between w-full mb-2",
  defaultClassNames.nav
),

button_previous: cn(
  buttonVariants({ variant: buttonVariant }),
  "h-8 w-8 p-0 absolute left-0 top-2",
  defaultClassNames.button_previous
),

button_next: cn(
  buttonVariants({ variant: buttonVariant }),
  "h-8 w-8 p-0 absolute right-0 top-2",
  defaultClassNames.button_next
),

month_caption: cn(
  "w-full text-center text-sm font-medium ",
  defaultClassNames.month_caption
),

        /* weekdays */
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "w-9 text-center text-xs text-muted-foreground font-normal",
          defaultClassNames.weekday
        ),

        /* grid */
        week: cn("flex w-full mt-2", defaultClassNames.week),

        /* DAYS FIXED */
        day: cn(
          "w-9 h-9 p-0 text-center",
          defaultClassNames.day
        ),

        /* range styling kept minimal */
        range_start: cn("bg-accent rounded-l-md", defaultClassNames.range_start),
        range_middle: cn("bg-accent", defaultClassNames.range_middle),
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),

        today: cn(
          "border border-primary rounded-md",
          defaultClassNames.today
        ),

        outside: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.outside
        ),

        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),

        hidden: "invisible",

        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("h-4 w-4", className)} {...props} />
          }
          return <ChevronRightIcon className={cn("h-4 w-4", className)} {...props} />
        },

        DayButton: CalendarDayButton,

        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        // BASE
        "h-9 w-9 p-0 font-normal rounded-md transition-colors relative",

        // DEFAULT
        "bg-transparent hover:bg-accent/40",

        // SELECTED (single day OR range start/end)
        (modifiers.selected || modifiers.range_start || modifiers.range_end) &&
          "bg-primary text-primary-foreground hover:bg-primary",

        // RANGE MIDDLE
        modifiers.range_middle &&
          "bg-accent text-foreground hover:bg-accent",

        // TODAY FIX (IMPORTANT)
        modifiers.today &&
          "ring-1 ring-primary ring-offset-1",

        // If TODAY + SELECTED → ensure text stays visible
        modifiers.today &&
          (modifiers.selected ||
            modifiers.range_start ||
            modifiers.range_end) &&
          "ring-2 ring-primary ring-offset-2",

        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }