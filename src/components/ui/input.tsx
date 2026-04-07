import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[0.6rem] border border-border/34 bg-[hsl(var(--background)/0.66)] px-3.5 py-2.5 font-body text-[15px] text-foreground/84 shadow-[inset_0_1px_0_hsl(var(--background)/0.58)] transition-[border-color,background-color,box-shadow,color] duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/44 hover:border-border/46 focus-visible:border-foreground/16 focus-visible:bg-[hsl(var(--background)/0.82)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[inset_0_1px_0_hsl(var(--background)/0.8),0_0_0_1px_hsl(var(--olive)/0.16)] disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:transition-opacity hover:[&::-webkit-calendar-picker-indicator]:opacity-80 md:text-[14px]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
