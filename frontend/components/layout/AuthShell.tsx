"use client";
import Link from "next/link";
import { Check, Flag, Globe, Monitor, Moon, Sun } from "lucide-react";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { t, lang, setLang, theme, resolvedTheme, toggleTheme } = useStore();

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <div className="flex min-h-screen flex-col px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2" aria-label={t("app.name")}>
            <Logo />
            <span className="text-[14px] font-semibold tracking-tight text-ink">
              {t("app.name")}
            </span>
          </Link>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                const next = lang === "en" ? "ar" : "en";
                setLang(next);
              }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-muted transition-colors hover:bg-hover hover:text-ink"
              aria-label={t("settings.language")}
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "en" ? "العربية" : "English"}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-ink"
              aria-label={t("settings.appearance")}
              title={`${t("settings.appearance")}: ${t(`settings.${theme}`)}`}
            >
              {theme === "system" ? (
                <Monitor className="h-4 w-4" />
              ) : resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[360px] animate-fade-up">
            <h1 className="text-[24px] font-bold leading-8 tracking-[-0.01em] text-ink">
              {title}
            </h1>
            <p className="mt-1 text-[13px] leading-5 text-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>

        <p className="text-center text-[11px] text-faint">
          © {t("app.name")} · FastAPI + Next.js
        </p>
      </div>

      <aside className="relative hidden overflow-hidden border-s border-line bg-sidebar lg:flex">
        <div
          className="pointer-events-none absolute -end-24 -top-24 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent-soft), transparent 65%)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -start-24 h-[360px] w-[360px] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--warning-soft), transparent 65%)" }}
          aria-hidden
        />

        <div className="relative z-10 flex w-full flex-col justify-center px-12 py-14 xl:px-20">
          <div className="max-w-[430px]">
            <Badge tone="accent" className="mb-5">
              {t("app.tagline")}
            </Badge>
            <h2 className="text-balance text-[30px] font-bold leading-[1.2] tracking-[-0.02em] text-ink xl:text-[34px]">
              {t("auth.promoTitle")}
            </h2>
            <p className="mt-3 text-[13.5px] leading-6 text-muted">{t("auth.promoSub")}</p>

            <div className="mt-8 rounded-xl border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(15,15,15,0.04)]">
              <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
                {t("nav.today")}
              </div>

              <div className="space-y-0.5">
                <PromoTask
                  title={t("auth.promoTask1")}
                  tag={t("auth.promoTagToday")}
                  priority="high"
                />
                <PromoTask title={t("auth.promoTask2")} tag={t("auth.promoTagToday")} priority="medium" />
                <PromoTask title={t("auth.promoTask3")} done />
              </div>
            </div>

            <ul className="mt-8 space-y-2.5">
              {[t("auth.promoPoint1"), t("auth.promoPoint2"), t("auth.promoPoint3")].map(
                (point) => (
                  <li key={point} className="flex items-start gap-2.5 text-[12.5px] text-muted">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                    {point}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}

function PromoTask({
  title,
  tag,
  priority,
  done,
}: {
  title: string;
  tag?: string;
  priority?: "high" | "medium" | "low";
  done?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md px-1 py-1.5">
      <span
        className={
          done
            ? "flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-success text-white"
            : priority === "high"
              ? "h-[17px] w-[17px] shrink-0 rounded-full border-[1.5px] border-p1"
              : priority === "medium"
                ? "h-[17px] w-[17px] shrink-0 rounded-full border-[1.5px] border-p2"
                : "h-[17px] w-[17px] shrink-0 rounded-full border-[1.5px] border-p4"
        }
      >
        {done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </span>
      <span
        className={
          done
            ? "min-w-0 flex-1 truncate text-[12.5px] text-faint line-through"
            : "min-w-0 flex-1 truncate text-[12.5px] text-ink"
        }
      >
        {title}
      </span>
      {tag && (
        <span className="shrink-0 rounded bg-hover px-1.5 py-0.5 text-[10px] text-muted">{tag}</span>
      )}
      {priority && (
        <Flag
          className={
            priority === "high" ? "h-3 w-3 text-p1" : priority === "medium" ? "h-3 w-3 text-p2" : "h-3 w-3 text-p4"
          }
          fill={priority === "low" ? "none" : "currentColor"}
        />
      )}
    </div>
  );
}
