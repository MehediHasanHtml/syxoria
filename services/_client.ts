/**
 * Service-layer helpers.
 *
 * Every service in /services returns typed data through async functions.
 * Today they resolve mock data from /lib/mock-data. To connect the backend,
 * replace a function body with a real request (e.g. `apiFetch<Project[]>("/projects")`)
 * and keep the signature — no UI changes required.
 */

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "not_found" | "validation" | "unauthorized" | "network" | "unknown" = "unknown",
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/** Simulated latency for client-side mutations so loading states are visible. */
export function simulateLatency(ms = 700): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Clone so callers never mutate the shared mock store. */
export const clone = <T>(value: T): T => structuredClone(value);

/**
 * Placeholder for the real HTTP client. Base URL is public config only;
 * auth tokens belong in httpOnly cookies handled server-side, never here.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new ServiceError("API is not configured (NEXT_PUBLIC_API_URL).", "network");
  const res = await fetch(`${base}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (res.status === 404) throw new ServiceError("Not found", "not_found");
  if (res.status === 401) throw new ServiceError("Unauthorized", "unauthorized");
  if (!res.ok) throw new ServiceError(`Request failed (${res.status})`, "network");
  return (await res.json()) as T;
}
