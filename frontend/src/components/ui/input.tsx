import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink placeholder:text-ink-faint",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
