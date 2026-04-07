import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[112px] w-full rounded-[0.6rem] border border-border/34 bg-[hsl(var(--background)/0.66)] px-3.5 py-3 font-body text-[14px] leading-relaxed text-foreground/82 shadow-[inset_0_1px_0_hsl(var(--background)/0.58)] transition-[border-color,background-color,box-shadow,color] duration-200 placeholder:text-muted-foreground/44 hover:border-border/46 focus-visible:border-foreground/16 focus-visible:bg-[hsl(var(--background)/0.82)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[inset_0_1px_0_hsl(var(--background)/0.8),0_0_0_1px_hsl(var(--olive)/0.16)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
