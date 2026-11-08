import { clsx } from "clsx";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-ink text-canvas",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
        <path
          d="M3.2 8.4 6.4 11.4 12.8 4.6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
