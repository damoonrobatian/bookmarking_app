import { useTheme } from "@/hooks/useTheme";
import { themeLogo } from "@/theme";
import { cn } from "@/utils/cn";

export function BrandMark({
  className,
  wordmark = true,
  size = "md",
}: {
  className?: string;
  wordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const { theme } = useTheme();
  const icon = size === "lg" ? "h-20 w-20" : size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const type = size === "lg" ? "text-5xl" : "text-2xl";
  const pixels = size === "lg" ? 80 : size === "sm" ? 40 : 48;
  return (
    <span className={cn("inline-flex items-center", size === "lg" ? "gap-3.5" : "gap-2.5", className)}>
      <img
        src={themeLogo(theme)}
        alt={wordmark ? "" : "Neshanak"}
        className={icon}
        width={pixels}
        height={pixels}
      />
      {wordmark ? <span className={cn("font-serif leading-none", type)}>Neshanak</span> : null}
    </span>
  );
}
