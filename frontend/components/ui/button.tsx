import * as React from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover shadow-[0_1px_2px_rgba(15,15,15,0.12)]",
  secondary:
    "bg-surface text-ink border border-line hover:bg-hover",
  ghost:
    "text-muted hover:bg-hover hover:text-ink",
  danger:
    "bg-danger text-white hover:brightness-95",
  subtle:
    "bg-hover text-ink hover:bg-active",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-[13px] rounded-md gap-1.5",
  md: "h-9 px-3 text-[13px] rounded-md gap-2",
  lg: "h-10 px-4 text-sm rounded-md gap-2",
  icon: "h-9 w-9 rounded-md",
  "icon-sm": "h-7 w-7 rounded-md",
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  (
    { className, variant = "primary", size = "md", loading, children, disabled, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex select-none items-center justify-center font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
