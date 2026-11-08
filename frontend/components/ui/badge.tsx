import { clsx } from "clsx";

type Tone = "gray" | "red" | "amber" | "emerald" | "blue" | "accent";

const tones: Record<Tone, string> = {
  gray: "bg-hover text-muted",
  red: "bg-danger-soft text-danger",
  amber: "bg-warning-soft text-warning",
  emerald: "bg-success-soft text-success",
  blue: "bg-accent-soft text-accent",
  accent: "bg-accent-soft text-accent",
};

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
