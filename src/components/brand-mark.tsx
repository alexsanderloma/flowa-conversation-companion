import { cn } from "@/lib/utils";

/** Official compact FLOWA symbol, for loading states and compact navigation. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/FLOWA_ICONE_OFICIAL.png"
      alt=""
      aria-hidden="true"
      className={cn("size-10 shrink-0 object-contain", className)}
    />
  );
}

/** Official horizontal FLOWA wordmark, for headers and areas with horizontal room. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/FLOWA_LOGO_OFICIAL.png"
      alt="FLOWA"
      className={cn("h-9 w-auto max-w-full object-contain", className)}
    />
  );
}
