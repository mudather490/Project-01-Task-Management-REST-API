"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        setPaletteOpen(true);
      } else if ((event.key === "n" || event.key === "N") && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        router.push("/dashboard?new=1");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  const newTask = () => {
    setDrawerOpen(false);
    router.push("/dashboard?new=1");
  };

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <Loader2 className="h-5 w-5 animate-spin text-faint" />
      </div>
    );
  }

  return (
    <>
        <div className="flex min-h-screen bg-canvas text-ink">
          <Sidebar onNewTask={newTask} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar
              onMenu={() => setDrawerOpen(true)}
              onSearch={() => setPaletteOpen(true)}
              onNewTask={newTask}
            />
            <main className="flex-1">{children}</main>
          </div>
        </div>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/40 animate-fade-in"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <div className="relative h-full w-[280px] max-w-[85vw] border-e border-line bg-sidebar shadow-modal animate-slide-in rtl:animate-[slideInStart_0.2s_ease-out]">
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute end-2 top-2 z-10 rounded-md p-1.5 text-muted hover:bg-hover hover:text-ink"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <Sidebar mobile onNewTask={newTask} onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
