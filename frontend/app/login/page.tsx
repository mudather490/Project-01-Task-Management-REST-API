"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { api, setToken } from "@/lib/api";
import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { t } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("access_token")) router.replace("/dashboard");
  }, [router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setToken(res.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || t("auth.invalid"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t("auth.login")} subtitle={t("auth.loginSub")}>
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
            className="h-9"
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
              autoComplete="current-password"
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
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[12px] text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? t("common.loading") : t("auth.signIn")}
        </Button>
      </form>

      <p className="mt-5 text-center text-[12px] text-muted">
        {t("auth.newHere")}{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          {t("auth.create")}
        </Link>
      </p>
    </AuthShell>
  );
}
