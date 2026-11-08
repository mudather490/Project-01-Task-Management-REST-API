import type { Lang, Task } from "./api";

export type View = "all" | "today" | "upcoming" | "overdue" | "done";

export interface TaskGroup {
  key: string;
  title: string;
  tasks: Task[];
  tone?: "danger";
}

const MS_DAY = 86_400_000;

/** Parse a `YYYY-MM-DD` string as a local date (not UTC). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole-day difference between a due date and today (negative = overdue). */
export function daysFromToday(iso: string): number {
  const due = startOfDay(parseISODate(iso)).getTime();
  const today = startOfDay(new Date()).getTime();
  return Math.round((due - today) / MS_DAY);
}

export function isOverdue(task: Task): boolean {
  return !!task.due_date && task.status !== "done" && daysFromToday(task.due_date) < 0;
}

const localeOf = (lang: Lang) => (lang === "ar" ? "ar-u-nu-latn" : "en-US");

export function formatShortDate(iso: string, lang: Lang): string {
  const date = parseISODate(iso);
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat(localeOf(lang), {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

export function formatLongDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeOf(lang), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatMonthDay(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeOf(lang), {
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Label used on compact task rows. */
export function formatDueLabel(
  iso: string,
  lang: Lang,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  const diff = daysFromToday(iso);
  if (diff < 0) return t("dates.overdue");
  if (diff === 0) return t("dates.today");
  if (diff === 1) return t("dates.tomorrow");
  if (diff > 1 && diff <= 6) {
    return new Intl.DateTimeFormat(localeOf(lang), { weekday: "long" }).format(
      parseISODate(iso)
    );
  }
  return formatShortDate(iso, lang);
}

/** Full label used in the task detail panel. */
export function formatFullDate(
  iso: string,
  lang: Lang,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  const diff = daysFromToday(iso);
  const short = formatShortDate(iso, lang);
  if (diff < 0) return `${t("dates.overdue")} · ${short}`;
  if (diff === 0) return `${t("dates.today")} · ${short}`;
  if (diff === 1) return `${t("dates.tomorrow")} · ${short}`;
  return new Intl.DateTimeFormat(localeOf(lang), {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(parseISODate(iso).getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" }),
  }).format(parseISODate(iso));
}

export function relativeDayLabel(
  iso: string,
  lang: Lang,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  const diff = daysFromToday(iso);
  if (diff === 0) return t("dates.today");
  if (diff === 1) return t("dates.tomorrow");
  if (diff === -1) return t("dates.yesterday");
  if (diff < 0) return t("dates.daysOverdue", { count: Math.abs(diff) });
  return formatShortDate(iso, lang);
}

type Bucket = "overdue" | "today" | "tomorrow" | "week" | "later" | "nodate" | "completed";

function bucketOf(task: Task): Bucket {
  if (task.status === "done") return "completed";
  if (!task.due_date) return "nodate";
  const diff = daysFromToday(task.due_date);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff <= 7) return "week";
  return "later";
}

const priorityRank: Record<Task["priority"], number> = { high: 0, medium: 1, low: 2 };

export type SortKey = "created_at" | "due_date" | "priority";

function compareTasks(a: Task, b: Task, sort: SortKey = "due_date"): number {
  if (sort === "priority") {
    const byPriority = priorityRank[a.priority] - priorityRank[b.priority];
    if (byPriority !== 0) return byPriority;
  }
  if (sort === "created_at") {
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    return b.id - a.id;
  }
  if (a.due_date && b.due_date && a.due_date !== b.due_date) {
    return a.due_date < b.due_date ? -1 : 1;
  }
  if (a.due_date && !b.due_date) return -1;
  if (!a.due_date && b.due_date) return 1;
  const p = priorityRank[a.priority] - priorityRank[b.priority];
  if (p !== 0) return p;
  return b.id - a.id;
}

const groupOrder: Record<View, Bucket[]> = {
  all: ["overdue", "today", "tomorrow", "week", "later", "nodate", "completed"],
  today: ["overdue", "today"],
  upcoming: ["tomorrow", "week", "later"],
  overdue: ["overdue"],
  done: ["completed"],
};

const groupTitleKey: Record<Bucket, string> = {
  overdue: "groups.overdue",
  today: "groups.today",
  tomorrow: "groups.tomorrow",
  week: "groups.thisWeek",
  later: "groups.later",
  nodate: "groups.noDate",
  completed: "groups.completed",
};

export function groupTasks(
  tasks: Task[],
  view: View,
  t: (key: string, vars?: Record<string, string | number>) => string,
  sort: SortKey = "due_date"
): TaskGroup[] {
  const buckets = new Map<Bucket, Task[]>();
  for (const task of tasks) {
    const b = bucketOf(task);
    if (!groupOrder[view].includes(b)) continue;
    const list = buckets.get(b) ?? [];
    list.push(task);
    buckets.set(b, list);
  }

  return groupOrder[view]
    .filter((b) => (buckets.get(b)?.length ?? 0) > 0)
    .map((b) => ({
      key: b,
      title: t(groupTitleKey[b]),
      tone: b === "overdue" ? ("danger" as const) : undefined,
      tasks: [...(buckets.get(b) ?? [])].sort((a, b2) => compareTasks(a, b2, sort)),
    }));
}

/** Tasks that belong to a view before grouping (used for empty states / counts). */
export function filterForView(tasks: Task[], view: View): Task[] {
  const today = todayISO();
  switch (view) {
    case "today":
      return tasks.filter(
        (task) =>
          task.status !== "done" && !!task.due_date && task.due_date <= today
      );
    case "upcoming":
      return tasks.filter(
        (task) => task.status !== "done" && !!task.due_date && task.due_date > today
      );
    case "overdue":
      return tasks.filter(
        (task) => task.status !== "done" && !!task.due_date && task.due_date < today
      );
    case "done":
      return tasks.filter((task) => task.status === "done");
    default:
      return tasks;
  }
}
