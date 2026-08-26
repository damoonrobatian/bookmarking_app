import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-24 w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
