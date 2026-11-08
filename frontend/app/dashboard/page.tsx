"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Columns3,
  LayoutList,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { api, clearToken, type Task, type TaskStatus } from "@/lib/api";
import {
  addDaysISO,
  filterForView,
  formatLongDate,
  groupTasks,
  isOverdue,
  todayISO,
  type SortKey,
  type View,
} from "@/lib/dates";
import { useStore } from "@/lib/store";
import { useCounts } from "@/lib/counts";
import { AppLayout } from "@/components/layout/AppLayout";
import { TaskRow } from "@/components/tasks/TaskRow";
import { QuickAdd, type QuickAddPayload } from "@/components/tasks/QuickAdd";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { BoardView } from "@/components/tasks/BoardView";
import { TaskForm } from "@/components/tasks/TaskForm";
import { FilterMenu, SortMenu } from "@/components/tasks/FilterControls";
import { Empty, TaskSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

const VIEWS: View[] = ["all", "today", "upcoming", "overdue", "done"];

function asView(value: string | null): View {
  return VIEWS.includes(value as View) ? (value as View) : "all";
}

const viewTitleKey: Record<View, string> = {
  all: "views.all",
  today: "views.today",
  upcoming: "views.upcoming",
  overdue: "views.overdue",
  done: "views.done",
};

const emptyTitleKey: Record<View, string> = {
  all: "views.emptyAll",
  today: "views.emptyToday",
  upcoming: "views.emptyUpcoming",
  overdue: "views.emptyOverdue",
  done: "views.emptyDone",
};

const emptySubKey: Record<View, string> = {
  all: "views.emptyAllSub",
  today: "views.emptyTodaySub",
  upcoming: "views.emptyUpcomingSub",
  overdue: "views.emptyOverdueSub",
  done: "views.emptyDoneSub",
};

type FormState = { open: boolean; status: TaskStatus; due: string | null };

function DashboardInner() {
  const { t, lang } = useStore();
  const { refresh: refreshCounts } = useCounts();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = asView(searchParams.get("view"));

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("due_date");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [selected, setSelected] = useState<Task | null>(null);
  const [form, setForm] = useState<FormState>({ open: false, status: "todo", due: null });
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("taskflow:viewMode");
    if (stored === "board" || stored === "list") setViewMode(stored);
  }, []);

  useEffect(() => {
    setTodayLabel(formatLongDate(new Date(), lang));
  }, [lang]);

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const query = params.toString();
      router.push(query ? `/dashboard?${query}` : "/dashboard", { scroll: false });
    },
    [router, searchParams]
  );

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listTasks(undefined, undefined, undefined, false, sort, 0, 200);
      setTasks(data);
    } catch (err: any) {
      if (err?.status === 401) {
        clearToken();
        router.replace("/login");
        return;
      }
      setError(err?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [router, sort, t]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const defaultDue = useMemo(() => {
    if (view === "today" || view === "overdue") return todayISO();
    if (view === "upcoming") return addDaysISO(todayISO(), 1);
    return null;
  }, [view]);

  const taskParam = searchParams.get("task");
  const newParam = searchParams.get("new");

  useEffect(() => {
    if (newParam !== "1") return;
    setForm({ open: true, status: "todo", due: defaultDue });
    updateParams((params) => params.delete("new"));
  }, [newParam, defaultDue, updateParams]);

  useEffect(() => {
    if (!taskParam) {
      setSelected(null);
      return;
    }
    const id = Number(taskParam);
    if (!Number.isFinite(id)) return;

    const fromList = tasks.find((task) => task.id === id);
    if (fromList) {
      setSelected(fromList);
      return;
    }
    if (loading) return;

    let cancelled = false;
    api
      .getTask(id)
      .then((task) => {
        if (!cancelled) setSelected(task);
      })
      .catch(() => {
        if (!cancelled) updateParams((params) => params.delete("task"));
      });
    return () => {
      cancelled = true;
    };
  }, [taskParam, tasks, loading, updateParams]);

  const baseTasks = useMemo(() => filterForView(tasks, view), [tasks, view]);

  const visibleTasks = useMemo(() => {
    let out = baseTasks;
    if (statusFilter !== "all") out = out.filter((task) => task.status === statusFilter);
    if (priorityFilter !== "all") out = out.filter((task) => task.priority === priorityFilter);
    if (overdueOnly) out = out.filter(isOverdue);

    const needle = q.trim().toLowerCase();
    if (needle) {
      out = out.filter(
        (task) =>
          task.title.toLowerCase().includes(needle) ||
          (task.description ?? "").toLowerCase().includes(needle)
      );
    }
    return out;
  }, [baseTasks, statusFilter, priorityFilter, overdueOnly, q]);

  const groups = useMemo(
    () => groupTasks(visibleTasks, view, t, sort),
    [visibleTasks, view, t, sort]
  );

  const hasFilters =
    q.trim() !== "" || statusFilter !== "all" || priorityFilter !== "all" || overdueOnly;

  const clearFilters = () => {
    setQ("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setOverdueOnly(false);
  };

  const changeViewMode = (mode: "list" | "board") => {
    setViewMode(mode);
    localStorage.setItem("taskflow:viewMode", mode);
  };

  const openTask = (task: Task) => {
    setSelected(task);
    updateParams((params) => params.set("task", String(task.id)));
  };

  const closeTask = () => {
    setSelected(null);
    updateParams((params) => params.delete("task"));
  };

  const openNew = (status: TaskStatus = "todo", due: string | null = null) => {
    setForm({ open: true, status, due });
  };

  const createTask = async (payload: Partial<Task>) => {
    try {
      const created = await api.createTask(payload);
      setTasks((current) => [created, ...current]);
      refreshCounts();
      toast(t("toast.created"));
      return created;
    } catch (err: any) {
      toast(err?.message || t("common.error"), { tone: "danger" });
      return null;
    }
  };

  const handleQuickAdd = async (payload: QuickAddPayload) => {
    await createTask(payload);
  };

  const handleFormSave = async (payload: Partial<Task>) => {
    const created = await createTask(payload);
    if (created) setForm((current) => ({ ...current, open: false }));
  };

  const updateTask = async (id: number, patch: Partial<Task>) => {
    const previous = tasks.find((task) => task.id === id);
    if (!previous) return;
    const optimistic = { ...previous, ...patch } as Task;

    setTasks((current) => current.map((task) => (task.id === id ? optimistic : task)));
    setSelected((current) => (current && current.id === id ? optimistic : current));

    try {
      const updated = await api.updateTask(id, patch);
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
      setSelected((current) => (current && current.id === id ? updated : current));
      refreshCounts();
    } catch (err: any) {
      setTasks((current) => current.map((task) => (task.id === id ? previous : task)));
      setSelected((current) => (current && current.id === id ? previous : current));
      toast(err?.message || t("common.error"), { tone: "danger" });
      throw err;
    }
  };

  const toggleTask = (task: Task) => {
    void updateTask(task.id, {
      status: task.status === "done" ? "todo" : "done",
    }).catch(() => {});
  };

  const deleteTask = async (task: Task) => {
    const snapshot = task;
    setTasks((current) => current.filter((item) => item.id !== task.id));
    if (selected?.id === task.id) {
      setSelected(null);
      updateParams((params) => params.delete("task"));
    }

    try {
      await api.deleteTask(task.id);
      refreshCounts();
      toast(t("toast.deleted"), {
        action: {
          label: t("tasks.undo"),
          onClick: async () => {
            const restored = await createTask({
              title: snapshot.title,
              description: snapshot.description,
              status: snapshot.status,
              priority: snapshot.priority,
              due_date: snapshot.due_date,
            });
            if (restored) refreshCounts();
          },
        },
      });
    } catch (err: any) {
      setTasks((current) => [task, ...current]);
      toast(err?.message || t("common.error"), { tone: "danger" });
    }
  };

  const showEmpty = !loading && visibleTasks.length === 0;
  const emptyTitle = hasFilters ? t("tasks.noResults") : t(emptyTitleKey[view]);
  const emptySub = hasFilters ? undefined : t(emptySubKey[view]);
  const emptyAction = hasFilters ? clearFilters : () => openNew("todo", defaultDue);
  const emptyActionLabel = hasFilters ? t("tasks.clearFilters") : t("nav.new");

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[940px] px-4 pb-20 pt-6 md:px-8 md:pt-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-8 tracking-[-0.02em] text-ink">
              {t(viewTitleKey[view])}
            </h1>
            <p className="mt-0.5 text-[12px] text-faint">
              {t(`views.${view}Sub`, { count: visibleTasks.length })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-faint sm:block">{todayLabel}</span>
            <div className="flex items-center rounded-md border border-line bg-surface p-0.5">
              <button
                type="button"
                onClick={() => changeViewMode("list")}
                aria-label={t("views.listView")}
                aria-pressed={viewMode === "list"}
                className={clsx(
                  "flex h-6 w-7 items-center justify-center rounded",
                  viewMode === "list" ? "bg-active text-ink" : "text-faint hover:text-muted"
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => changeViewMode("board")}
                aria-label={t("views.boardView")}
                aria-pressed={viewMode === "board"}
                className={clsx(
                  "flex h-6 w-7 items-center justify-center rounded",
                  viewMode === "board" ? "bg-active text-ink" : "text-faint hover:text-muted"
                )}
              >
                <Columns3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          <FilterMenu
            status={statusFilter}
            priority={priorityFilter}
            overdue={overdueOnly}
            onStatus={setStatusFilter}
            onPriority={setPriorityFilter}
            onOverdue={setOverdueOnly}
            onClear={clearFilters}
          />
          <SortMenu sort={sort} onSort={(next) => setSort(next as SortKey)} />

          <div className="relative ms-auto w-full sm:w-[210px]">
            <Search className="pointer-events-none absolute start-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={t("tasks.searchPlaceholder")}
              aria-label={t("nav.search")}
              className="h-7 w-full rounded-md border border-transparent bg-hover/60 pe-7 ps-7 text-[12px] text-ink placeholder:text-faint transition-colors hover:bg-hover focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute end-1 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:bg-active hover:text-ink"
                aria-label={t("filters.clear")}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] text-danger"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => void loadTasks()}
              className="flex items-center gap-1 font-medium hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              {t("common.retry")}
            </button>
          </div>
        )}

        <div className="mt-4">
          {loading ? (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <TaskSkeleton key={index} />
              ))}
            </div>
          ) : showEmpty ? (
            <Empty
              title={emptyTitle}
              sub={emptySub}
              actionLabel={emptyActionLabel}
              onAction={emptyAction}
            />
          ) : viewMode === "board" ? (
            <BoardView
              tasks={visibleTasks}
              onOpen={openTask}
              onToggle={toggleTask}
              onStatusChange={(task, status) =>
                void updateTask(task.id, { status }).catch(() => {})
              }
              onAddInColumn={(status) => openNew(status, null)}
            />
          ) : (
            <>
              {view !== "done" && !hasFilters && (
                <QuickAdd onAdd={handleQuickAdd} defaultDue={defaultDue} />
              )}

              {groups.map((group) => (
                <section key={group.key} className="mb-5">
                  <div className="mb-1 flex items-center gap-1.5 px-0.5">
                    {group.tone === "danger" && (
                      <AlertCircle className="h-3 w-3 text-danger" />
                    )}
                    <h2
                      className={clsx(
                        "text-[11px] font-semibold uppercase tracking-[0.06em]",
                        group.tone === "danger" ? "text-danger" : "text-muted"
                      )}
                    >
                      {group.title}
                    </h2>
                    <span
                      className={clsx(
                        "text-[11px] tabular-nums",
                        group.tone === "danger" ? "text-danger/70" : "text-faint"
                      )}
                    >
                      {group.tasks.length}
                    </span>
                  </div>

                  <div>
                    {group.tasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onOpen={openTask}
                        onToggle={toggleTask}
                        onDelete={(item) => void deleteTask(item)}
                      />
                    ))}
                  </div>
                </section>
              ))}

              {!hasFilters && view !== "done" && (
                <button
                  type="button"
                  onClick={() => openNew("todo", defaultDue)}
                  className="mt-1 flex w-full items-center gap-2 rounded-md border border-dashed border-line px-3 py-2 text-[12px] text-faint transition-colors hover:border-line-strong hover:bg-hover/40 hover:text-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("nav.new")}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <TaskDetailPanel
        task={selected}
        onClose={closeTask}
        onUpdate={updateTask}
        onDelete={(task) => void deleteTask(task)}
      />

      <TaskForm
        open={form.open}
        onClose={() => setForm((current) => ({ ...current, open: false }))}
        onSave={handleFormSave}
        defaultStatus={form.status}
        defaultDue={form.due}
      />
    </AppLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-canvas text-[13px] text-faint">
          …
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
