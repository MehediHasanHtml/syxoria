"use client";

import { useState } from "react";
import { createCoreState } from "@/lib/core/state";
import { CoreCanvas } from "./core-canvas";

/** The Core at rest on its plinth, half awake — used outside the homepage story (auth screens). */
export function CoreEmblem({ className, label }: { className?: string; label?: string }) {
  const [state] = useState(() => createCoreState({ az: -0.35, el: 0.12, dist: 10.5, ty: -0.35, awaken: 0.4, floor: 0.8 }));
  return <CoreCanvas state={state} className={className} label={label} />;
}
