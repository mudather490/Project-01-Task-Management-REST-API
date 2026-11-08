"use client";
import { Check, Flag, Pencil, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import type { Task } from "@/lib/api";
import { formatDueLabel, isOverdue } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

const priorityBorder: Record<Task["priority"], string> = {
  high: "border-p1",
  medium: "border-p2",
  low: "border-p4",
};

const priorityText: Record<Task["priority"], string> = {
  high: "text-p1",
  medium: "text-p2",
  low: "text-p4",
};

export function TaskRow({
  task,
  onToggle,
  onOpen,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onOpen: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { t, lang } = useStore();
  const done = task.status === "done";
  const overdue = isOverdue(task);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(task);
        }
      }}
      aria-label={t("tasks.open")}
      className="group relative -mx-2 flex cursor-pointer items-center gap-2.5 rounded-md border-b border-line/70 px-2 py-2.5 transition-colors hover:bg-hover/70 focus-visible:bg-hover/70"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? t("tasks.reopen") : t("tasks.complete")}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(task);
        }}
        className={clsx(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
          done
            ? "border-success bg-success text-white"
            : clsx(priorityBorder[task.priority], "hover:bg-hover")
        )}
      >
        {done ? (
          <Check className="h-3 w-3 animate-check" strokeWidth={3} />
        ) : (
          <Check className="h-3 w-3 text-faint opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={2.5} />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "truncate text-[14px] leading-5",
              done ? "task-done" : "text-ink"
            )}
          >
            {task.title}
          </span>
          {task.description && (
            <span
              className="hidden shrink-0 text-[11px] text-faint sm:inline"
              title={task.description}
            >
              ···
            </span>
          )}
        </div>
        {(task.description || task.status === "in_progress") && (
          <div className="mt-0.5 flex items-center gap-2">
            {task.status === "in_progress" && (
              <Badge tone="blue" className="px-1.5 py-0 text-[10px]">
                {t("tasks.inProgress")}
              </Badge>
            )}
            {task.description && (
              <span className="truncate text-[12px] text-faint">{task.description}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {task.due_date && (
          <span
            className={clsx(
              "flex items-center gap-1 text-[11px] tabular-nums",
              overdue ? "font-medium text-danger" : "text-faint"
            )}
            title={task.due_date}
          >
            {formatDueLabel(task.due_date, lang, t)}
          </span>
        )}

        <Flag
          className={clsx("h-3.5 w-3.5", priorityText[task.priority])}
          fill={task.priority === "low" ? "none" : "currentColor"}
          strokeWidth={task.priority === "low" ? 1.6 : 1.2}
          aria-label={t(`tasks.priority${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)}`)}
        />

        <div className="flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(task);
            }}
            className="rounded p-1 text-faint hover:bg-active hover:text-ink"
            aria-label={t("tasks.edit")}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(task);
            }}
            className="rounded p-1 text-faint hover:bg-danger-soft hover:text-danger"
            aria-label={t("tasks.delete")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
