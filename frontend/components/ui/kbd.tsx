import { clsx } from "clsx";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={clsx(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-canvas px-1 text-[10px] font-medium text-faint",
        className
      )}
    >
      {children}
    </kbd>
  );
}
