"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Notification, User, Workspace } from "@/types";
import { Sidebar, type SidebarProject } from "./sidebar";
import { Topbar } from "./topbar";

const STORAGE_KEY = "syx.sidebar.collapsed";
const EVENT = "syx:sidebar";

/** Sidebar preference as an external store: SSR-safe, no effect-driven state. */
const sidebarStore = {
  subscribe(cb: () => void) {
    window.addEventListener("storage", cb);
    window.addEventListener(EVENT, cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener(EVENT, cb);
    };
  },
  get() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  },
  set(value: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* storage unavailable — preference won't persist */
    }
    window.dispatchEvent(new Event(EVENT));
  },
};

export type ShellContext = {
  user: User;
  workspace: Workspace;
  notifications: Notification[];
  badges: { insights: number };
  projects: SidebarProject[];
};

/**
 * Application shell: collapsible sidebar (persisted per device), mobile drawer
 * (native <dialog>), top bar. Content is rendered by server pages as children.
 */
export function AppShell({ children, ...ctx }: ShellContext & { children: ReactNode }) {
  const collapsed = useSyncExternalStore(sidebarStore.subscribe, sidebarStore.get, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);

  const toggleCollapsed = () => sidebarStore.set(!collapsed);

  useEffect(() => {
    const d = drawer.current;
    if (!d) return;
    if (mobileOpen && !d.open) d.showModal();
    if (!mobileOpen && d.open) d.close();
  }, [mobileOpen]);

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#app-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-(--z-toast) focus:rounded-md focus:bg-fg focus:px-3 focus:py-2 focus:text-sm focus:text-canvas"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-(--z-sticky) hidden border-r border-line bg-canvas-2 transition-[width] duration-300 ease-out-soft lg:block",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} badges={ctx.badges} workspace={ctx.workspace} projects={ctx.projects} />
      </aside>

      {/* Mobile drawer */}
      <dialog
        ref={drawer}
        aria-label="Navigation"
        onClose={() => setMobileOpen(false)}
        onCancel={(e) => {
          e.preventDefault();
          setMobileOpen(false);
        }}
        onClick={(e) => e.target === e.currentTarget && setMobileOpen(false)}
        className="drawer-motion m-0 h-dvh max-h-none w-72 max-w-[85vw] border-r border-line bg-canvas-2 p-0 text-fg"
      >
        <Sidebar collapsed={false} badges={ctx.badges} workspace={ctx.workspace} projects={ctx.projects} onNavigate={() => setMobileOpen(false)} />
      </dialog>

      <div className={cn("flex min-h-dvh flex-col transition-[padding] duration-300 ease-out-soft", collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64")}>
        <Topbar user={ctx.user} notifications={ctx.notifications} onOpenMenu={() => setMobileOpen(true)} />
        <main id="app-main" tabIndex={-1} className="flex-1 outline-none">
          <div className="@container w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8 2xl:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
