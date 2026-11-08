"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe, Keyboard, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { clsx } from "clsx";
import { useStore, type Theme } from "@/lib/store";
import { api, clearToken, type Lang } from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line pb-8 last:border-0 last:pb-0">
      <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
      {subtitle && <p className="mt-0.5 max-w-[560px] text-[12px] text-muted">{subtitle}</p>}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

const themeIcons: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

function ThemePreview({ mode }: { mode: Theme }) {
  const base =
    mode === "system"
      ? "bg-[linear-gradient(90deg,#ffffff_0%,#ffffff_50%,#191919_50%,#191919_100%)]"
      : mode === "dark"
        ? "bg-[#191919]"
        : "bg-white";
  const sidebar =
    mode === "system"
      ? "bg-[linear-gradient(90deg,#f7f7f5_0%,#f7f7f5_100%)]"
      : mode === "dark"
        ? "bg-[#202020]"
        : "bg-[#f7f7f5]";

  return (
    <div className={clsx("h-14 overflow-hidden rounded-md border border-line", base)} aria-hidden>
      <div className={clsx("flex h-full w-1/4 border-e border-black/10", sidebar)} />
    </div>
  );
}

function SettingsInner() {
  const { t, lang, setLang, theme, setTheme } = useStore();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  useEffect(() => {
    api
      .me()
      .then((user) => setEmail(user.email))
      .catch(() => {});
  }, []);

  const changeLanguage = async (next: Lang) => {
    if (next === lang) return;
    setLang(next);
    try {
      await api.updateMe(next);
      toast(t("toast.languageSaved"));
    } catch (err: any) {
      toast(err?.message || t("toast.network"), { tone: "danger" });
    }
  };

  const logout = () => {
    clearToken();
    router.push("/login");
  };

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[760px] animate-fade-up px-4 py-7 md:px-8 md:py-9">
        <header>
          <h1 className="text-[24px] font-bold tracking-[-0.01em] text-ink">
            {t("settings.title")}
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">{t("settings.subtitle")}</p>
        </header>

        <div className="mt-8 space-y-8">
          <Section title={t("settings.appearance")} subtitle={t("settings.appearanceSub")}>
            <div className="grid grid-cols-3 gap-2.5 sm:max-w-[430px]">
              {(["light", "dark", "system"] as const).map((mode) => {
                const Icon = themeIcons[mode];
                const active = theme === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTheme(mode)}
                    aria-pressed={active}
                    className={clsx(
                      "group rounded-lg border p-1.5 text-start transition-colors",
                      active
                        ? "border-accent ring-1 ring-[var(--ring)]"
                        : "border-line hover:border-line-strong"
                    )}
                  >
                    <ThemePreview mode={mode} />
                    <span className="mt-1.5 flex items-center gap-1.5 px-0.5 pb-0.5">
                      <Icon className="h-3.5 w-3.5 text-faint" />
                      <span className="flex-1 text-[12px] font-medium text-ink">
                        {t(`settings.${mode}`)}
                      </span>
                      {active && <Check className="h-3.5 w-3.5 text-accent" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title={t("settings.language")} subtitle={t("settings.languageSub")}>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:max-w-[520px]">
              {(
                [
                  { value: "en", label: "English", sample: t("settings.sampleEn"), dir: "ltr" },
                  { value: "ar", label: "العربية", sample: t("settings.sampleAr"), dir: "rtl" },
                ] as const
              ).map((option) => {
                const active = lang === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => changeLanguage(option.value)}
                    aria-pressed={active}
                    className={clsx(
                      "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-start transition-colors",
                      active
                        ? "border-accent bg-accent-soft/50"
                        : "border-line hover:border-line-strong hover:bg-hover/50"
                    )}
                  >
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-medium text-ink">
                        {option.label}
                      </span>
                      <span
                        dir={option.dir}
                        className="mt-0.5 block truncate text-[11px] text-faint"
                      >
                        {option.sample}
                      </span>
                    </span>
                    {active && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title={t("settings.account")} subtitle={t("settings.accountSub")}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">
                {(email || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-faint">
                  {t("settings.email")}
                </p>
                <p className="truncate text-[13px] text-ink">{email || "…"}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={logout}>
                <LogOut className="h-3.5 w-3.5" />
                {t("settings.signOut")}
              </Button>
            </div>
          </Section>

          <Section title={t("settings.shortcuts")} subtitle={t("settings.shortcutsSub")}>
            <div className="max-w-[480px] divide-y divide-line">
              {[
                { label: t("settings.shortcutNew"), keys: ["N"] },
                { label: t("settings.shortcutSearch"), keys: ["Ctrl", "K"] },
                { label: t("settings.shortcutSlash"), keys: ["/"] },
                { label: t("settings.shortcutClose"), keys: ["Esc"] },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-2">
                  <span className="flex items-center gap-2 text-[12.5px] text-muted">
                    <Keyboard className="h-3.5 w-3.5 text-faint" />
                    {row.label}
                  </span>
                  <span className="flex items-center gap-1">
                    {row.keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t("settings.about")} subtitle={t("settings.aboutSub")}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
              <span>
                {t("settings.version")} <span className="tabular-nums text-ink">1.0.0</span>
              </span>
              <span className="text-faint">FastAPI · SQLAlchemy · Next.js · Tailwind</span>
            </div>
          </Section>
        </div>
      </div>
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-canvas text-[13px] text-faint">
          …
        </div>
      }
    >
      <SettingsInner />
    </Suspense>
  );
}
