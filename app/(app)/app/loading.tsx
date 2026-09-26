import { Skeleton } from "@/components/shared/states";

/** Route-level loading skeleton — shown while server data streams in. */
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="animate-fade-in">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-8 w-72" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-lg xl:col-span-2" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
