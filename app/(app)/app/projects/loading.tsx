import { Skeleton } from "@/components/shared/states";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading projects">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-8 w-56" />
      <div className="mt-8 flex gap-2">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-line">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-0">
            <Skeleton className="size-8" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="mt-2 h-3 w-72 max-w-full" />
            </div>
            <Skeleton className="hidden h-2 w-40 md:block" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
