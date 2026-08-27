import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

export function PasswordInput({
  className,
  preventAutofill = false,
  onFocus,
  autoComplete,
  readOnly,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { preventAutofill?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [locked, setLocked] = useState(preventAutofill);
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        autoComplete={preventAutofill ? "off" : autoComplete}
        readOnly={locked || readOnly}
        data-1p-ignore={preventAutofill || undefined}
        data-lpignore={preventAutofill ? "true" : undefined}
        data-form-type={preventAutofill ? "other" : undefined}
        onFocus={(event) => {
          if (preventAutofill) setLocked(false);
          onFocus?.(event);
        }}
      />
      <button
        type="button"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-faint hover:bg-paper-sunken hover:text-ink"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
