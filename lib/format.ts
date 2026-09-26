/**
 * Deterministic formatters. Locale + time zone are pinned so server and
 * client render identical strings (no hydration mismatches).
 * Swap `LOCALE` / `CURRENCY` when i18n is introduced.
 */
export const LOCALE = "en-GB";
export const CURRENCY = "EUR";
const TIME_ZONE = "UTC";

const currencyFmt = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});
const currencyPreciseFmt = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numberFmt = new Intl.NumberFormat(LOCALE);
const compactFmt = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE });
const shortDateFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: TIME_ZONE });
const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });

export const formatCurrency = (value: number, precise = false) =>
  (precise ? currencyPreciseFmt : currencyFmt).format(value);
export const formatNumber = (value: number) => numberFmt.format(value);
export const formatCompact = (value: number) => compactFmt.format(value);
export const formatPercent = (value: number, withSign = false) =>
  `${withSign && value > 0 ? "+" : ""}${value.toFixed(Math.abs(value) < 10 ? 1 : 0)}%`;
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatShortDate = (iso: string) => shortDateFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

/** Hours as decimal → "6h 42m" */
export function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m.toString().padStart(2, "0")}m`;
}

/**
 * Relative time against a fixed reference. Pass `now` explicitly from the
 * caller (services expose `REFERENCE_NOW` for mock data) so SSR is stable.
 */
export function formatRelative(iso: string, now: Date): string {
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return formatShortDate(iso);
}

/* ---------- Serializable format keys (safe to pass Server → Client) ---------- */
export type ValueFormat = "currency" | "currency-compact" | "number" | "compact" | "duration" | "hours" | "percent";
export type DateFormat = "short" | "month" | "time";

export function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "currency-compact":
      return value >= 1000 ? `€${formatCompact(value)}` : formatCurrency(value);
    case "compact":
      return formatCompact(value);
    case "duration":
      return formatDuration(value);
    case "hours":
      return `${formatNumber(Math.round(value * 10) / 10)}h`;
    case "percent":
      return `${Math.round(value)}%`;
    default:
      return formatNumber(value);
  }
}

const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: "short", timeZone: "UTC" });
export function formatDateAs(iso: string, format: DateFormat): string {
  if (format === "month") return monthFmt.format(new Date(iso));
  if (format === "time") return formatTime(iso);
  return formatShortDate(iso);
}
