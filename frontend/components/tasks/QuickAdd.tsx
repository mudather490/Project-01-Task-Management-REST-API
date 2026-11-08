"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Flag, Plus, X } from "lucide-react";
import { clsx } from "clsx";
import type { TaskPriority } from "@/lib/api";
import { formatDueLabel } from "@/lib/dates";
import { parseQuickAdd } from "@/lib/quickAdd";
import { useStore } from "@/lib/store";
import { Kbd } from "@/components/ui/kbd";

export interface QuickAddPayload {
  title: string;
  due_date: string | null;
  priority: TaskPriority;
}

export function QuickAdd({
  onAdd,
  defaultDue,
  autoFocus,
  onCancel,
  placeholder,
}: {
  onAdd: (payload: QuickAddPayload) => Promise<void> | void;
  defaultDue?: string | null;
  autoFocus?: boolean;
  onCancel?: () => void;
  placeholder?: string;
}) {
  const { t, lang } = useStore();
  const [open, setOpen] = useState(!!autoFocus);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(
    () => parseQuickAdd(value, { defaultDue: defaultDue ?? null }),
    [value, defaultDue]
  );

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const submit = async () => {
    if (!parsed.title.trim() || saving) return;
    setSaving(true);
    try {
      await onAdd({
        title: parsed.title,
        due_date: parsed.due_date,
        priority: parsed.priority,
      });
      setValue("");
    } finally {
      setSaving(false);
      inputRef.current?.focus();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-[13px] text-faint transition-colors hover:bg-hover/70 hover:text-muted"
      >
        <Plus className="h-3.5 w-3.5" />
        {t("tasks.add")}
      </button>
    );
  }

  const showPreview = parsed.matched && parsed.title.length > 0;

  return (
    <div className="border-b border-line/70 px-1 py-2">
      <div className="flex items-center gap-2">
        <Plus className="h-3.5 w-3.5 shrink-0 text-faint" />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit();
            } else if (event.key === "Escape") {
              event.preventDefault();
              setValue("");
              setOpen(false);
              onCancel?.();
            }
          }}
          placeholder={placeholder ?? t("tasks.addPlaceholder")}
          className="h-7 min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-faint focus:outline-none"
        />
        {saving && <span className="text-[11px] text-faint">{t("common.loading")}</span>}
        <button
          onClick={() => {
            setValue("");
            setOpen(false);
            onCancel?.();
          }}
          className="rounded p-1 text-faint hover:bg-hover hover:text-ink"
          aria-label={t("common.cancel")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {showPreview && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 ps-6">
          {parsed.due_date && (
            <span className="inline-flex items-center gap-1 rounded bg-hover px-1.5 py-0.5 text-[11px] text-muted">
              {formatDueLabel(parsed.due_date, lang, t)}
            </span>
          )}
          {parsed.priority !== "medium" && (
            <span
              className={clsx(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]",
                parsed.priority === "high"
                  ? "bg-danger-soft text-danger"
                  : "bg-hover text-muted"
              )}
            >
              <Flag className="h-2.5 w-2.5" />
              {t(`tasks.${parsed.priority}`)}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-faint">
            <Kbd className="h-4">↵</Kbd>
            {t("tasks.addHint")}
          </span>
        </div>
      )}
      {!showPreview && (
        <div className="mt-1 flex items-center gap-2 ps-6 text-[10px] text-faint">
          <CornerDownLeft className="h-3 w-3" />
          {t("tasks.addHint")}
        </div>
      )}
    </div>
  );
}
