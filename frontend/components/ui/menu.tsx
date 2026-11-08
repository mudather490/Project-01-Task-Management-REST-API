"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Check } from "lucide-react";

interface MenuProps {
  label: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  className?: string;
  panelClassName?: string;
  ariaLabel?: string;
}

export function Menu({
  label,
  children,
  align = "start",
  className,
  panelClassName,
  ariaLabel,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={className}
      >
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className={clsx(
            "absolute top-full z-50 mt-1 min-w-[200px] rounded-lg border border-line bg-surface p-1 shadow-popover animate-pop",
            align === "end" ? "end-0" : "start-0",
            panelClassName
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
      {children}
    </div>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-line" role="separator" />;
}

export function MenuItem({
  icon,
  label,
  onClick,
  active,
  danger,
  hint,
  disabled,
}: {
  icon?: ReactNode;
  label: ReactNode;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-[13px] transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        danger
          ? "text-danger hover:bg-danger-soft"
          : "text-ink hover:bg-hover",
        active && "bg-hover font-medium"
      )}
    >
      {icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
      {active && <Check className="h-3.5 w-3.5 shrink-0 text-accent" />}
    </button>
  );
}

export function MenuCheckItem({
  label,
  checked,
  onClick,
  icon,
}: {
  label: ReactNode;
  checked: boolean;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-[13px] text-ink hover:bg-hover"
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted">
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {checked && <Check className="h-3.5 w-3.5 shrink-0 text-accent" />}
    </button>
  );
}
