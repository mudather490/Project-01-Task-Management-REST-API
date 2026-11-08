"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";
import { useStore } from "@/lib/store";
import { api, setToken, setLang as persistLang, type Lang } from "@/lib/api";
import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const { t, lang, setLang } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [language, setLanguage] = useState<Lang>(lang);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const chooseLanguage = (next: Lang) => {
    setLanguage(next);
    setLang(next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError(t("auth.passwordHint"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.register(email, password, language);
      const res = await api.login(email, password);
      setToken(res.access_token);
      persistLang(language);
      setLang(language);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || t("auth.exists"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t("auth.register")} subtitle={t("auth.registerSub")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[12px] font-medium text-muted">
            {t("auth.email")}
          </label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-[12px] font-medium text-muted">
            {t("auth.password")}
          </label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pe-9"
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:bg-hover hover:text-ink"
              aria-label={show ? t("auth.hide") : t("auth.show")}
              tabIndex={-1}
            >
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-faint">{t("auth.passwordHint")}</p>
        </div>

        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-[12px] font-medium text-muted">
            {t("auth.confirmPassword")}
          </label>
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-[12px] font-medium text-muted">
            {t("auth.language")}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(["en", "ar"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => chooseLanguage(value)}
                aria-pressed={language === value}
                className={clsx(
                  "rounded-md border px-3 py-2 text-start text-[12.5px] transition-colors",
                  language === value
                    ? "border-accent bg-accent-soft text-ink"
                    : "border-line bg-surface text-muted hover:bg-hover"
                )}
              >
                <span className="block font-medium">
                  {value === "en" ? "English" : "العربية"}
                </span>
                <span className="mt-0.5 block text-[11px] text-faint">
                  {value === "en" ? "LTR" : "RTL"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[12px] text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? t("common.loading") : t("auth.create")}
        </Button>
      </form>

      <p className="mt-5 text-center text-[12px] text-muted">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </AuthShell>
  );
}
