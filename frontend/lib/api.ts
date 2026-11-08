// Same-origin API. In production Vercel routes /api/* to FastAPI.
// In local dev, next.config.ts rewrites /api/* to the local FastAPI server.
// NEXT_PUBLIC_API_URL is only needed for a separate (split) deployment.
const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export type Lang = "en" | "ar";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface User {
  id: number;
  email: string;
  language: Lang;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCounts {
  all: number;
  today: number;
  upcoming: number;
  overdue: number;
  completed: number;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

const getLang = (): Lang =>
  typeof window !== "undefined" ? ((localStorage.getItem("lang") as Lang) || "en") : "en";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": getLang(),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...headers, ...(init?.headers || {}) },
    });
  } catch {
    throw new ApiError(
      getLang() === "ar"
        ? "تعذّر الاتصال بالخادم. تأكد من تشغيل الـ Backend."
        : "Cannot reach the server. Make sure the backend is running.",
      0,
      "network_error"
    );
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail = (data as any).detail;
    const msg =
      typeof detail === "string"
        ? detail
        : detail?.message || detail?.code || `Error ${res.status}`;
    throw new ApiError(msg, res.status, detail?.code);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register: (email: string, password: string, language: Lang) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, language }),
    }),
  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>("/users/me"),
  updateMe: (language: Lang) =>
    request<User>("/users/me", { method: "PATCH", body: JSON.stringify({ language }) }),

  listTasks: (
    q?: string,
    status?: string,
    priority?: string,
    overdue?: boolean,
    sort?: string,
    skip = 0,
    limit = 200
  ) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status && status !== "all") p.set("status", status);
    if (priority && priority !== "all") p.set("priority", priority);
    if (overdue) p.set("overdue", "true");
    if (sort) p.set("sort", sort);
    p.set("skip", String(skip));
    p.set("limit", String(limit));
    return request<Task[]>(`/tasks?${p.toString()}`);
  },
  counts: () => request<TaskCounts>("/tasks/counts"),
  getTask: (id: number) => request<Task>(`/tasks/${id}`),
  createTask: (t: Partial<Task>) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify(t) }),
  updateTask: (id: number, t: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(t) }),
  deleteTask: (id: number) =>
    request<undefined>(`/tasks/${id}`, { method: "DELETE" }),
  getToday: () => request<Task[]>("/tasks/today"),
};

export const setToken = (t: string) => localStorage.setItem("access_token", t);
export const clearToken = () => localStorage.removeItem("access_token");
export const setLang = (l: Lang) => localStorage.setItem("lang", l);
