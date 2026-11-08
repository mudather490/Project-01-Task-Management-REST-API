"use client";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  action?: ToastAction;
  tone: "default" | "danger";
}

type ToastCtx = {
  toast: (message: string, opts?: { action?: ToastAction; tone?: "default" | "danger" }) => void;
};

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, opts?: { action?: ToastAction; tone?: "default" | "danger" }) => {
      const id = ++counter.current;
      setItems((current) => [
        ...current.slice(-2),
        { id, message, action: opts?.action, tone: opts?.tone ?? "default" },
      ]);
    },
    []
  );

  useEffect(() => {
    if (items.length === 0) return;
    const timers = items.map((item) =>
      window.setTimeout(() => dismiss(item.id), item.action ? 6000 : 3200)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [items, dismiss]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[90] flex flex-col items-center gap-2 px-4">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto flex items-center gap-3 rounded-lg bg-ink px-3.5 py-2 text-[13px] text-canvas shadow-popover animate-fade-up"
          >
            <span>{item.message}</span>
            {item.action && (
              <button
                onClick={() => {
                  item.action?.onClick();
                  dismiss(item.id);
                }}
                className="rounded px-1.5 py-0.5 font-medium text-accent-soft underline underline-offset-2 hover:opacity-80"
              >
                {item.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}
