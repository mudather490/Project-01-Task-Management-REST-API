"use client";
import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  CircleDot,
  Flag,
  Trash2,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import type { Task, TaskPriority, TaskStatus } from "@/lib/api";
import { formatFullDate } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { Menu, MenuCheckItem, MenuLabel } from "@/components/ui/menu";

const statusColor: Record<TaskStatus, string> = {
  todo: "bg-p4",
  in_progress: "bg-p3",
  done: "bg-success",
};

const priorityColor: Record<TaskPriority, string> = {
  high: "text-p1",
  medium: "text-p2",
  low: "text-p4",
};

export function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  onDelete,
}: {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: number, patch: Partial<Task>) => Promise<void>;
  onDelete: (task: Task) => void;
}) {
  const { t, lang } = useStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!task || saving) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.due_date ?? "");
  }, [task, saving]);

  useEffect(() => {
    setSavedAt(null);
  }, [task?.id]);

  useEffect(() => {
    if (!task) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [task, onClose]);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [title, task]);

  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = "auto";
      descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
    }
  }, [description, task]);

  if (!task) return null;

  const save = async (patch: Partial<Task>) => {
    setSaving(true);
    try {
      await onUpdate(task.id, patch);
      setSavedAt(Date.now());
    } catch {
      // The parent surfaces a toast and reverts the optimistic value.
    } finally {
      setSaving(false);
    }
  };

  const saveTitle = () => {
    const next = title.trim();
    if (!next || next === task.title) {
      setTitle(task.title);
      return;
    }
    void save({ title: next });
  };

  const saveDescription = () => {
    const next = description.trim() === "" ? null : description;
    if ((task.description ?? null) === next) return;
    void save({ description: next });
  };

  const changeStatus = (next: TaskStatus) => {
    if (next === status) return;
    setStatus(next);
    void save({ status: next });
  };

  const changePriority = (next: TaskPriority) => {
    if (next === priority) return;
    setPriority(next);
    void save({ priority: next });
  };

  const changeDue = (next: string) => {
    setDueDate(next);
    void save({ due_date: next === "" ? null : next });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/20 animate-fade-in sm:bg-black/5"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("tasks.details")}
        className="fixed end-0 top-0 z-[60] flex h-full w-full flex-col border-s border-line bg-surface shadow-modal animate-slide-in sm:w-[400px]"
      >
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">
            {t("tasks.details")}
          </span>
          <div className="ms-auto flex items-center gap-0.5">
            <button
              onClick={() => onDelete(task)}
              className="rounded-md p-1.5 text-faint hover:bg-danger-soft hover:text-danger"
              aria-label={t("tasks.deleteTask")}
              title={t("tasks.deleteTask")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-faint hover:bg-hover hover:text-ink"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <textarea
            ref={titleRef}
            value={title}
            rows={1}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                titleRef.current?.blur();
              }
            }}
            aria-label={t("tasks.title")}
            className="w-full resize-none overflow-hidden bg-transparent text-[20px] font-semibold leading-7 text-ink placeholder:text-faint focus:outline-none"
            placeholder={t("tasks.titlePlaceholder")}
          />

          <div className="mt-4 space-y-0.5">
            <div className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-hover/60">
              <span className="flex w-[92px] shrink-0 items-center gap-2 text-[12px] text-muted">
                <CircleDot className="h-3.5 w-3.5 text-faint" />
                {t("tasks.status")}
              </span>
              <Menu
                ariaLabel={t("tasks.status")}
                label={
                  <span className="flex h-7 items-center gap-1.5 rounded-md px-1.5 text-[13px] text-ink hover:bg-active">
                    <span className={clsx("h-2 w-2 rounded-full", statusColor[status])} />
                    {t(`tasks.${status === "in_progress" ? "inProgress" : status}`)}
                    <ChevronDown className="h-3 w-3 text-faint" />
                  </span>
                }
                className="rounded-md hover:bg-hover/60"
                panelClassName="w-48"
              >
                {(close) => (
                  <>
                    <MenuLabel>{t("tasks.status")}</MenuLabel>
                    {(["todo", "in_progress", "done"] as TaskStatus[]).map((value) => (
                      <MenuCheckItem
                        key={value}
                        label={
                          <span className="flex items-center gap-2">
                            <span className={clsx("h-2 w-2 rounded-full", statusColor[value])} />
                            {t(`tasks.${value === "in_progress" ? "inProgress" : value}`)}
                          </span>
                        }
                        checked={status === value}
                        onClick={() => {
                          changeStatus(value);
                          close();
                        }}
                      />
                    ))}
                  </>
                )}
              </Menu>
            </div>

            <div className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-hover/60">
              <span className="flex w-[92px] shrink-0 items-center gap-2 text-[12px] text-muted">
                <Flag className="h-3.5 w-3.5 text-faint" />
                {t("tasks.priority")}
              </span>
              <Menu
                ariaLabel={t("tasks.priority")}
                label={
                  <span className="flex h-7 items-center gap-1.5 rounded-md px-1.5 text-[13px] text-ink hover:bg-active">
                    <Flag className={clsx("h-3.5 w-3.5", priorityColor[priority])} fill={priority === "low" ? "none" : "currentColor"} />
                    {t(`tasks.${priority}`)}
                    <ChevronDown className="h-3 w-3 text-faint" />
                  </span>
                }
                className="rounded-md hover:bg-hover/60"
                panelClassName="w-44"
              >
                {(close) => (
                  <>
                    <MenuLabel>{t("tasks.priority")}</MenuLabel>
                    {(["high", "medium", "low"] as TaskPriority[]).map((value) => (
                      <MenuCheckItem
                        key={value}
                        label={
                          <span className="flex items-center gap-2">
                            <Flag
                              className={clsx("h-3.5 w-3.5", priorityColor[value])}
                              fill={value === "low" ? "none" : "currentColor"}
                            />
                            {t(`tasks.${value}`)}
                          </span>
                        }
                        checked={priority === value}
                        onClick={() => {
                          changePriority(value);
                          close();
                        }}
                      />
                    ))}
                  </>
                )}
              </Menu>
            </div>

            <div className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-hover/60">
              <span className="flex w-[92px] shrink-0 items-center gap-2 text-[12px] text-muted">
                <Calendar className="h-3.5 w-3.5 text-faint" />
                {t("tasks.due")}
              </span>
              <div className="flex flex-1 items-center gap-1">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => changeDue(event.target.value)}
                  aria-label={t("tasks.due")}
                  className="h-7 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 text-[12px] text-ink hover:border-line focus:border-accent focus:outline-none"
                />
                {dueDate && (
                  <button
                    onClick={() => changeDue("")}
                    className="rounded p-1 text-faint hover:bg-hover hover:text-ink"
                    aria-label={t("tasks.noDue")}
                    title={t("tasks.noDue")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {task.due_date && (
              <div className="ps-[100px] text-[11px] text-faint">
                {formatFullDate(task.due_date, lang, t)}
              </div>
            )}
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-[12px] font-medium text-muted">
              {t("tasks.description")}
            </label>
            <textarea
              ref={descriptionRef}
              value={description}
              rows={4}
              onChange={(event) => setDescription(event.target.value)}
              onBlur={saveDescription}
              placeholder={t("tasks.descriptionPlaceholder")}
              className="w-full resize-none overflow-hidden rounded-md border border-transparent bg-hover/40 px-2.5 py-2 text-[13px] leading-relaxed text-ink placeholder:text-faint hover:border-line focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div className="mt-6 border-t border-line pt-3 text-[11px] text-faint">
            <span>
              {t("tasks.createdAt")}: {formatFullDate(task.created_at.slice(0, 10), lang, t)}
            </span>
          </div>
        </div>

        <div className="flex h-10 shrink-0 items-center gap-2 border-t border-line px-4 text-[11px] text-faint">
          {saving ? (
            <span>{t("tasks.saving")}</span>
          ) : savedAt ? (
            <span className="flex items-center gap-1 text-success">
              <Check className="h-3 w-3" />
              {t("tasks.saved")}
            </span>
          ) : (
            <span>{t("tasks.details")}</span>
          )}
        </div>
      </aside>
    </>
  );
}
