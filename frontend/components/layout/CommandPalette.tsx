"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Inbox,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Languages,
  type LucideIcon,
} from "lucide-react";
import { api, clearToken, type Task } from "@/lib/api";
import { useStore } from "@/lib/store";
import { formatDueLabel, isOverdue } from "@/lib/dates";
import { Kbd } from "@/components/ui/kbd";
import { clsx } from "clsx";

interface Command {
  id: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { t, lang, setLang, toggleTheme } = useStore();
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const actions: Command[] = useMemo(
    () => [
      { id: "new", label: t("palette.newTask"), icon: Plus, run: () => go("/dashboard?new=1") },
      { id: "all", label: t("palette.goAll"), icon: Inbox, run: () => go("/dashboard") },
      { id: "today", label: t("palette.goToday"), icon: Sun, run: () => go("/dashboard?view=today") },
      {
        id: "upcoming",
        label: t("palette.goUpcoming"),
        icon: CalendarDays,
        run: () => go("/dashboard?view=upcoming"),
      },
      {
        id: "overdue",
        label: t("palette.goOverdue"),
        icon: AlertCircle,
        run: () => go("/dashboard?view=overdue"),
      },
      {
        id: "done",
        label: t("palette.goDone"),
        icon: CheckCircle2,
        run: () => go("/dashboard?view=done"),
      },
      {
        id: "settings",
        label: t("palette.goSettings"),
        icon: Settings,
        run: () => go("/settings"),
      },
      {
        id: "theme",
        label: t("palette.toggleTheme"),
        icon: Moon,
        run: () => {
          toggleTheme();
          onClose();
        },
      },
      {
        id: "lang",
        label: t("palette.switchLang"),
        icon: Languages,
        run: () => {
          const next = lang === "en" ? "ar" : "en";
          setLang(next);
          api.updateMe(next).catch(() => {});
          onClose();
        },
      },
      {
        id: "logout",
        label: t("palette.logout"),
        icon: LogOut,
        run: () => {
          clearToken();
          router.push("/login");
          onClose();
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, t]
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    setLoading(true);
    api
      .listTasks(undefined, undefined, undefined, false, "due_date", 0, 200)
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const normalized = query.trim().toLowerCase();

  const filteredActions = actions.filter(
    (action) => !normalized || action.label.toLowerCase().includes(normalized)
  );

  const filteredTasks = tasks
    .filter((task) => {
      if (!normalized) return true;
      return (
        task.title.toLowerCase().includes(normalized) ||
        (task.description ?? "").toLowerCase().includes(normalized)
      );
    })
    .slice(0, normalized ? 8 : 5);

  const rows = [
    ...filteredActions.map((action) => ({ type: "action" as const, action })),
    ...filteredTasks.map((task) => ({ type: "task" as const, task })),
  ];

  useEffect(() => {
    setActive(0);
  }, [normalized]);

  if (!open) return null;

  const runRow = (index: number) => {
    const row = rows[index];
    if (!row) return;
    if (row.type === "action") row.action.run();
    else go(`/dashboard?task=${row.task.id}`);
  };

  const firstTaskIndex = filteredActions.length;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[10vh]">
      <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] animate-fade-in" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("palette.placeholder")}
        className="relative w-full max-w-[580px] overflow-hidden rounded-xl border border-line bg-surface shadow-modal animate-pop"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((current) => (current + 1) % Math.max(rows.length, 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((current) => (current - 1 + rows.length) % Math.max(rows.length, 1));
              } else if (event.key === "Enter") {
                event.preventDefault();
                runRow(active);
              }
            }}
            placeholder={t("palette.placeholder")}
            className="h-12 w-full bg-transparent text-[14px] text-ink placeholder:text-faint focus:outline-none"
          />
          <Kbd className="hidden sm:inline-flex">esc</Kbd>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2">
          {loading && (
            <div className="px-3 py-6 text-center text-[12px] text-faint">{t("common.loading")}</div>
          )}

          {!loading && rows.length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="text-[13px] font-medium text-ink">{t("palette.noResults")}</p>
              <p className="mt-1 text-[12px] text-muted">{t("palette.noResultsSub")}</p>
            </div>
          )}

          {!loading && filteredActions.length > 0 && (
            <>
              <div className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
                {t("palette.actions")}
              </div>
              {filteredActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => runRow(index)}
                    onMouseMove={() => setActive(index)}
                    className={clsx(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-start text-[13px]",
                      active === index ? "bg-hover text-ink" : "text-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 text-faint" strokeWidth={1.8} />
                    <span className="flex-1">{action.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-faint rtl:rotate-180" />
                  </button>
                );
              })}
            </>
          )}

          {!loading && filteredTasks.length > 0 && (
            <>
              <div className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-faint">
                {t("palette.tasks")}
              </div>
              {filteredTasks.map((task, index) => {
                const rowIndex = firstTaskIndex + index;
                return (
                  <button
                    key={task.id}
                    onClick={() => runRow(rowIndex)}
                    onMouseMove={() => setActive(rowIndex)}
                    className={clsx(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-start",
                      active === rowIndex ? "bg-hover" : ""
                    )}
                  >
                    <span
                      className={clsx(
                        "h-2 w-2 shrink-0 rounded-full",
                        task.status === "done"
                          ? "bg-success"
                          : task.priority === "high"
                            ? "bg-p1"
                            : task.priority === "medium"
                              ? "bg-p2"
                              : "bg-p3"
                      )}
                    />
                    <span
                      className={clsx(
                        "min-w-0 flex-1 truncate text-[13px]",
                        task.status === "done" ? "text-faint line-through" : "text-ink"
                      )}
                    >
                      {task.title}
                    </span>
                    {task.due_date && (
                      <span
                        className={clsx(
                          "shrink-0 text-[11px]",
                          isOverdue(task) ? "text-danger" : "text-faint"
                        )}
                      >
                        {formatDueLabel(task.due_date, lang, t)}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line bg-sidebar/60 px-3 py-2 text-[11px] text-faint">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            {t("palette.hintNavigate")}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd>
            {t("palette.hintSelect")}
          </span>
          <span className="ms-auto flex items-center gap-1">
            <Kbd>esc</Kbd>
            {t("palette.hintClose")}
          </span>
        </div>
      </div>
    </div>
  );
}
