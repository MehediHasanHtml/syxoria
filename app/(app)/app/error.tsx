"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { ErrorState } from "@/components/shared/states";
import { Button, ButtonLink } from "@/components/ui/button";

/** Route error boundary for the whole app area. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // TODO(observability): report to your error tracker.
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-line bg-surface/40">
      <ErrorState
        title="This view could not be loaded"
        description="Something went wrong while fetching your data. Your workspace is safe — try again in a moment."
        action={
          <>
            <Button onClick={reset}>
              <RotateCcw aria-hidden="true" /> Try again
            </Button>
            <ButtonLink href="/app" variant="ghost">
              Back to overview
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
