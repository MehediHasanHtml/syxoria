"use client";

import { Play } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PreviewData } from "./product-screens";

// The tour is only needed after a click — keep it out of the initial bundle.
const DemoDialog = dynamic(() => import("./demo-dialog").then((m) => m.DemoDialog), { ssr: false });

export function DemoTrigger({ label, data, variant = "outline" }: { label: string; data: PreviewData; variant?: "outline" | "primary" }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  return (
    <>
      <Button
        variant={variant}
        size="lg"
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        onPointerEnter={() => setMounted(true)}
        aria-haspopup="dialog"
      >
        <span className="grid size-5 place-items-center rounded-full border border-current/40">
          <Play className="!size-2.5 translate-x-px fill-current" aria-hidden="true" />
        </span>
        {label}
      </Button>
      {mounted && <DemoDialog open={open} onClose={() => setOpen(false)} data={data} />}
    </>
  );
}
