import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full appearance-none rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-3 pr-9 text-sm text-[var(--text-primary)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
      />
    </div>
  );
});
Select.displayName = "Select";

export { Select };
