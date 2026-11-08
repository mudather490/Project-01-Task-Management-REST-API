"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Globe,
  Inbox,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Settings,
  Sun,
} from "lucide-react";
import { api, clearToken, type Lang } from "@/lib/api";
import { useCounts } from "@/lib/counts";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/ui/logo";
import { Kbd } from "@/components/ui/kbd";
import { clsx } from "clsx";

interface SidebarProps {
  onNewTask: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ onNewTask, mobile, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang, setLang, theme, setTheme, resolvedTheme, toggleTheme } = useStore();
  const { counts } = useCounts();
  const [email, setEmail] = useState("");

  useEffect(() => {
    api
      .me()
      .then((user) => setEmail(user.email))
      .catch(() => {});
  }, []);

  const currentView = pathname === "/dashboard" ? searchParams.get("view") ?? "all" : "";

  const items = [
    { view: "all", label: t("nav.all"), icon: Inbox, count: counts.all, danger: false },
    { view: "today", label: t("nav.today"), icon: Sun, count: counts.today, danger: false },
    { view: "upcoming", label: t("nav.upcoming"), icon: CalendarDays, count: counts.upcoming, danger: false },
    { view: "overdue", label: t("nav.overdue"), icon: AlertCircle, count: counts.overdue, danger: true },
    { view: "done", label: t("nav.completed"), icon: CheckCircle2, count: counts.completed, danger: false },
  ] as const;

  const changeLang = async (next: Lang) => {
    setLang(next);
    try {
      await api.updateMe(next);
    } catch {
      /* language is still applied locally */
    }
  };

  const logout = () => {
    clearToken();
    router.push("/login");
  };

  const themeIcon =
    theme === "system" ? (
      <Monitor className="h-4 w-4" />
    ) : resolvedTheme === "dark" ? (
      <Sun className="h-4 w-4" />
    ) : (
      <Moon className="h-4 w-4" />
    );

  return (
    <aside
      className={clsx(
        "flex flex-col bg-sidebar",
        mobile
          ? "h-full w-full"
          : "sticky top-0 hidden h-screen w-[248px] shrink-0 border-e border-line md:flex"
      )}
    >
      <div className="flex items-center gap-2 px-3 pb-1 pt-3">
        <Logo />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight text-ink">
            {t("app.name")}
          </div>
          <div className="truncate text-[11px] leading-tight text-faint">
            {t("app.workspace")}
          </div>
        </div>
      </div>

      <div className="px-2 pt-3">
        <button
          onClick={onNewTask}
          className="group flex w-full items-center gap-2 rounded-md border border-line bg-surface px-2 py-1.5 text-[13px] text-muted transition-colors hover:bg-hover hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="flex-1 text-start">{t("nav.new")}</span>
          <Kbd className="opacity-0 transition-opacity group-hover:opacity-100">N</Kbd>
        </button>
      </div>

      <nav className="mt-5 flex-1 overflow-y-auto px-2">
        <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
          {t("nav.workspace")}
        </div>
        <div className="space-y-0.5">
          {items.map((item) => {
            const href = item.view === "all" ? "/dashboard" : `/dashboard?view=${item.view}`;
            const active = currentView === item.view;
            const Icon = item.icon;
            return (
              <Link
                key={item.view}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={clsx(
                  "flex items-center gap-2.5 rounded-md px-2 py-[7px] text-[13px] transition-colors",
                  active
                    ? "bg-active font-medium text-ink"
                    : "text-muted hover:bg-hover hover:text-ink"
                )}
              >
                <Icon
                  className={clsx(
                    "h-4 w-4 shrink-0",
                    active ? "text-ink" : item.danger && item.count > 0 ? "text-danger" : "text-faint"
                  )}
                  strokeWidth={1.8}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.count > 0 && (
                  <span
                    className={clsx(
                      "text-[11px] tabular-nums",
                      item.danger && item.count > 0
                        ? "font-medium text-danger"
                        : active
                          ? "text-muted"
                          : "text-faint"
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-5 px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
          {t("nav.preferences")}
        </div>
        <Link
          href="/settings"
          onClick={onNavigate}
          aria-current={pathname === "/settings" ? "page" : undefined}
          className={clsx(
            "flex items-center gap-2.5 rounded-md px-2 py-[7px] text-[13px] transition-colors",
            pathname === "/settings"
              ? "bg-active font-medium text-ink"
              : "text-muted hover:bg-hover hover:text-ink"
          )}
        >
          <Settings className="h-4 w-4 shrink-0 text-faint" strokeWidth={1.8} />
          {t("nav.settings")}
        </Link>
      </nav>

      <div className="border-t border-line px-2 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeLang(lang === "en" ? "ar" : "en")}
            className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-muted transition-colors hover:bg-hover hover:text-ink"
            aria-label={t("settings.language")}
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "en" ? "العربية" : "English"}
          </button>
          <button
            onClick={toggleTheme}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-ink"
            aria-label={t("settings.appearance")}
            title={`${t("settings.appearance")}: ${t(`settings.${theme}`)}`}
          >
            {themeIcon}
          </button>
        </div>

        <div className="mt-1 flex items-center gap-2 rounded-md px-2 py-1.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
            {(email || "?").charAt(0).toUpperCase()}
          </div>
          <span className="min-w-0 flex-1 truncate text-[11px] text-muted" title={email}>
            {email || "…"}
          </span>
          <button
            onClick={logout}
            className="rounded p-1 text-faint transition-colors hover:bg-hover hover:text-danger"
            aria-label={t("nav.logout")}
            title={t("nav.logout")}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
