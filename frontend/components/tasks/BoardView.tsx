"use client";
import { useState } from "react";
import { Check, Flag, Plus } from "lucide-react";
import { clsx } from "clsx";
import type { Task, TaskStatus } from "@/lib/api";
import { formatDueLabel, isOverdue } from "@/lib/dates";
import { useStore } from "@/lib/store";

const columns: Array<{ status: TaskStatus; dot: string; labelKey: string }> = [
  { status: "todo", dot: "bg-p4", labelKey: "tasks.todo" },
  { status: "in_progress", dot: "bg-p3", labelKey: "tasks.inProgress" },
  { status: "done", dot: "bg-success", labelKey: "tasks.done" },
];

export function BoardView({
  tasks,
  onOpen,
  onToggle,
  onStatusChange,
  onAddInColumn,
}: {
  tasks: Task[];
  onOpen: (task: Task) => void;
  onToggle: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onAddInColumn: (status: TaskStatus) => void;
}) {
  const { t, lang } = useStore();
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.status);
        return (
          <section
            key={column.status}
            onDragOver={(event) => {
              event.preventDefault();
              setOverColumn(column.status);
            }}
            onDragLeave={() => setOverColumn((current) => (current === column.status ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              const id = Number(event.dataTransfer.getData("text/task-id"));
              const task = tasks.find((item) => item.id === id);
              if (task && task.status !== column.status) onStatusChange(task, column.status);
              setDraggingId(null);
              setOverColumn(null);
            }}
            className={clsx(
              "flex min-h-[260px] flex-col rounded-lg border p-2 transition-colors",
              overColumn === column.status
                ? "border-accent bg-accent-soft/40"
                : "border-line bg-sidebar/50"
            )}
          >
            <div className="mb-2 flex items-center gap-1.5 px-1.5 py-1">
              <span className={clsx("h-2 w-2 rounded-full", column.dot)} />
              <span className="text-[12px] font-medium text-ink">{t(column.labelKey)}</span>
              <span className="text-[11px] tabular-nums text-faint">{columnTasks.length}</span>
              <button
                onClick={() => onAddInColumn(column.status)}
                className="ms-auto rounded p-1 text-faint hover:bg-hover hover:text-ink"
                aria-label={`${t("tasks.add")} — ${t(column.labelKey)}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 space-y-1.5">
              {columnTasks.map((task) => {
                const done = task.status === "done";
                return (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/task-id", String(task.id));
                      event.dataTransfer.effectAllowed = "move";
                      setDraggingId(task.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverColumn(null);
                    }}
                    onClick={() => onOpen(task)}
                    className={clsx(
                      "group cursor-pointer rounded-md border border-line bg-surface p-2.5 transition-shadow hover:shadow-sm",
                      draggingId === task.id && "opacity-40"
                    )}
                  >
                    <div className="flex items-start gap-2">
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
                          "mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-[1.5px]",
                          done
                            ? "border-success bg-success text-white"
                            : task.priority === "high"
                              ? "border-p1"
                              : task.priority === "medium"
                                ? "border-p2"
                                : "border-p4"
                        )}
                      >
                        {done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={clsx(
                            "text-[13px] leading-5",
                            done ? "task-done" : "text-ink"
                          )}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-faint">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2">
                          {task.due_date && (
                            <span
                              className={clsx(
                                "text-[10px] tabular-nums",
                                isOverdue(task) ? "font-medium text-danger" : "text-faint"
                              )}
                            >
                              {formatDueLabel(task.due_date, lang, t)}
                            </span>
                          )}
                          <Flag
                            className={clsx(
                              "ms-auto h-3 w-3",
                              task.priority === "high"
                                ? "text-p1"
                                : task.priority === "medium"
                                  ? "text-p2"
                                  : "text-p4"
                            )}
                            fill={task.priority === "low" ? "none" : "currentColor"}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {columnTasks.length === 0 && (
                <div className="rounded-md border border-dashed border-line px-2 py-6 text-center text-[11px] text-faint">
                  {t("tasks.empty")}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
