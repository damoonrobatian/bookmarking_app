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
  const icon = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const type = size === "lg" ? "text-4xl" : "text-2xl";
  const pixels = size === "lg" ? 64 : size === "sm" ? 32 : 40;
  return (
    <span className={cn("inline-flex items-center", size === "lg" ? "gap-3.5" : "gap-2.5", className)}>
      <img
        src="/logo.png"
        alt={wordmark ? "" : "Neshanak"}
        className={icon}
        width={pixels}
        height={pixels}
      />
      {wordmark ? <span className={cn("font-serif leading-none", type)}>Neshanak</span> : null}
    </span>
  );
}
