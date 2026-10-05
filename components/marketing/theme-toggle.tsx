"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { themeStore } from "@/lib/theme";

/** The current theme of the website (server and first render: dark, the default). */
export function useTheme() {
  return useSyncExternalStore(themeStore.subscribe, themeStore.get, themeStore.server);
}

/**
 * Light / dark: one small round button beside the header's links. It shows where it leads — a sun
 * in the dark, a moon in the light — and the two trade places with a quarter turn. The whole page
 * cross-fades between the themes (see themeStore.set).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const light = useTheme() === "light";
  useLayoutEffect(() => themeStore.restore(), []);

  const icon = "absolute inset-0 m-auto size-[15px] transition-[opacity,rotate,scale] duration-500 ease-out-soft";
  return (
    <button
      type="button"
      onClick={() => themeStore.set(light ? "dark" : "light")}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Dark mode" : "Light mode"}
      className={cn(
        "group relative grid size-9 shrink-0 place-items-center rounded-full text-fg-2 transition-[color,background-color] duration-300 ease-out-soft hover:bg-white/[0.06] hover:text-fg",
        className,
      )}
    >
      <Sun aria-hidden="true" strokeWidth={1.6} className={cn(icon, light ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100")} />
      <Moon aria-hidden="true" strokeWidth={1.6} className={cn(icon, light ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0")} />
    </button>
  );
}
