import type { ReactNode } from "react";

/** Consistent section frame: title + description left, content right. */
export function SettingsSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-line pb-10 pt-2 last:border-0 md:grid-cols-[14rem_1fr] md:gap-10 [&+&]:pt-10">
      <div>
        <h2 className="text-[15px] font-medium text-fg">{title}</h2>
        {description && <p className="mt-1.5 text-[13px] leading-relaxed text-fg-3">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
