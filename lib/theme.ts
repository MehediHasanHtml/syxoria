/**
 * Light / dark — the visitor's choice for the website, remembered in this browser. Dark is the
 * default and the reference: light is its daylight counterpart (see the themes in globals.css).
 *
 * The theme lives on <html data-theme>. An inline script (THEME_SCRIPT, in the root layout) sets
 * it before the first paint; afterwards this store owns it. The product (dashboard) and the
 * laptop's screen stay dark whatever is chosen: they declare data-theme="dark" themselves.
 */
export type Theme = "dark" | "light";

const KEY = "syxoria-theme";
/** The browser's colour for each theme (address bar, overscroll): each one's canvas. */
const CHROME: Record<Theme, string> = { dark: "#08090a", light: "#f2f1ed" };

/**
 * Runs in <head>, before anything is painted: the remembered theme — and, to compare the type
 * directions, a ?type=modern|original in the URL (see TypeSwitch).
 */
export const THEME_SCRIPT = `(function(){try{var d=document.documentElement,t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")d.setAttribute("data-theme",t);var y=new URLSearchParams(location.search).get("type");if(y==="modern"||y==="original")d.setAttribute("data-type",y)}catch(e){}})()`;

const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

const read = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", CHROME[theme]);
}

/** The theme stored in this browser, if the visitor has chosen one. */
export function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

export const themeStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    // one observer for everyone: whoever changes the attribute (this store, the inline script,
    // React resetting <html> in development), every subscriber hears it
    if (!observer) {
      observer = new MutationObserver(() => listeners.forEach((l) => l()));
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }
    return () => {
      listeners.delete(fn);
      if (!listeners.size) {
        observer?.disconnect();
        observer = null;
      }
    };
  },
  get: read,
  server: (): Theme => "dark",
  /** Switch, with a soft cross-fade of the whole page where the browser can (View Transitions). */
  set(theme: Theme) {
    try {
      localStorage.setItem(KEY, theme);
    } catch {}
    if (theme === read()) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof document.startViewTransition !== "function") return apply(theme);
    const t = document.startViewTransition(() => apply(theme));
    // the cross-fade is only a nicety: if the browser skips or aborts it (a hidden tab, a stalled
    // frame), the switch still happens, silently
    t.ready.catch(() => {});
    t.updateCallbackDone.catch(() => {});
    t.finished.catch(() => {}).finally(() => {
      if (read() !== theme) apply(theme);
    });
  },
  /**
   * Put the stored choice back on <html> (React resets the attributes it manages on a development
   * remount), and give the browser's chrome the theme's colour (the inline script runs before its meta exists).
   */
  restore() {
    const t = storedTheme() ?? read();
    if (t !== read()) apply(t);
    else document.querySelector('meta[name="theme-color"]')?.setAttribute("content", CHROME[t]);
  },
};
