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
  const icon = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const type = size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/logo.svg"
        alt={wordmark ? "" : "Neshanak"}
        className={icon}
        width={32}
        height={32}
      />
      {wordmark ? <span className={cn("font-serif leading-none", type)}>Neshanak</span> : null}
    </span>
  );
}
