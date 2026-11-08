"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { api, TaskCounts } from "./api";

type CountsCtx = {
  counts: TaskCounts;
  refresh: () => void;
  loaded: boolean;
};

const emptyCounts: TaskCounts = {
  all: 0,
  today: 0,
  upcoming: 0,
  overdue: 0,
  completed: 0,
};

const CountsContext = createContext<CountsCtx | null>(null);

export function CountsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<TaskCounts>(emptyCounts);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("access_token")) return;
    api
      .counts()
      .then((next) => {
        setCounts(next);
        setLoaded(true);
      })
      .catch(() => {
        // Keep the last known counts; a toast is not useful for a background badge.
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  const value = useMemo(() => ({ counts, refresh, loaded }), [counts, refresh, loaded]);

  return <CountsContext.Provider value={value}>{children}</CountsContext.Provider>;
}

export function useCounts() {
  const ctx = useContext(CountsContext);
  if (!ctx) throw new Error("CountsProvider missing");
  return ctx;
}
