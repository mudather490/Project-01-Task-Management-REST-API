"use client";
import { clsx } from "clsx";
import { CheckCircle2 } from "lucide-react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={clsx("skeleton rounded-md", className)} aria-hidden />;
}

export function TaskSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-line/70 px-2 py-3">
      <Skeleton className="h-[18px] w-[18px] rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  );
}

export function Empty({
  title,
  sub,
  actionLabel,
  onAction,
}: {
  title: string;
  sub?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-hover text-faint">
        <CheckCircle2 className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {sub && <p className="mt-1 max-w-xs text-[13px] text-muted">{sub}</p>}
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="mt-4 rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-hover"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
