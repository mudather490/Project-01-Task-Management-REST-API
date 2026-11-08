"use client";
import Link from "next/link";
import {
  Menu,
  Monitor,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/ui/logo";
import { Kbd } from "@/components/ui/kbd";

export function Topbar({
  onMenu,
  onSearch,
  onNewTask,
}: {
  onMenu: () => void;
  onSearch: () => void;
  onNewTask: () => void;
}) {
  const { t, theme, resolvedTheme, toggleTheme } = useStore();

  return (
    <header className="sticky top-0 z-30 flex h-11 shrink-0 items-center gap-2 border-b border-line bg-canvas/85 px-3 backdrop-blur-md md:px-4">
      <button
        onClick={onMenu}
        className="rounded-md p-1.5 text-muted hover:bg-hover hover:text-ink md:hidden"
        aria-label={t("nav.openMenu")}
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      <Link href="/dashboard" className="flex items-center gap-2 md:hidden" aria-label={t("app.name")}>
        <Logo className="h-6 w-6" />
      </Link>

      <button
        onClick={onSearch}
        className="hidden h-7 w-full max-w-[380px] items-center gap-2 rounded-md bg-hover px-2.5 text-[12px] text-faint transition-colors hover:bg-active hover:text-muted sm:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 truncate text-start">{t("nav.searchPlaceholder")}</span>
        <Kbd className="bg-surface">⌘K</Kbd>
      </button>

      <button
        onClick={onSearch}
        className="rounded-md p-1.5 text-muted hover:bg-hover hover:text-ink sm:hidden"
        aria-label={t("nav.search")}
      >
        <Search className="h-4.5 w-4.5" />
      </button>

      <div className="ms-auto flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="rounded-md p-1.5 text-muted hover:bg-hover hover:text-ink"
          aria-label={t("settings.appearance")}
          title={t(`settings.${theme}`)}
        >
          {theme === "system" ? (
            <Monitor className="h-4 w-4" />
          ) : resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        <Link
          href="/settings"
          className="hidden rounded-md p-1.5 text-muted hover:bg-hover hover:text-ink sm:block"
          aria-label={t("nav.settings")}
        >
          <Settings className="h-4 w-4" />
        </Link>

        <button
          onClick={onNewTask}
          className="ms-1 inline-flex h-7 items-center gap-1.5 rounded-md bg-accent px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("nav.new")}</span>
        </button>
      </div>
    </header>
  );
}
