import { extendTailwindMerge } from "tailwind-merge";

type ClassValue = string | number | false | null | undefined | ClassValue[];

/**
 * tailwind-merge taught about our design tokens, so later classes cleanly
 * override component defaults (e.g. <ModuleIcon className="size-5" />).
 * Keep in sync with the @theme block in app/globals.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      font: ["display"],
      text: ["display", "headline", "title", "lead"],
      radius: ["xs", "sm", "md", "lg", "xl"],
      tracking: ["brand", "label"],
      shadow: ["panel", "float", "glow"],
      ease: ["out-soft", "in-out-soft", "spring"],
    },
  },
});

function join(inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) {
      const nested = join(input);
      if (nested) out.push(nested);
    } else {
      out.push(String(input));
    }
  }
  return out.join(" ");
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(join(inputs));
}
