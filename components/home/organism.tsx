import { organism } from "@/content/home";
import { productModules } from "@/lib/mock-data/modules";

/**
 * Chapter four — the system. Six names, typographic, nothing else.
 * Hover (or focus) a module to hear what it does; the others step back.
 * On touch screens every line is simply shown.
 */
export function Organism() {
  return (
    <section id="modules" aria-labelledby="modules-title" className="border-t border-line py-28 sm:py-40">
      <div className="container-page grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+3rem)]">
            <p className="text-[11px] uppercase tracking-[0.3em] text-fg-3">{organism.eyebrow}</p>
            <h2 id="modules-title" className="mt-6 max-w-xs text-headline font-light text-fg">
              {organism.title}
            </h2>
          </div>
        </div>
        <ol className="lg:col-span-8 [&:has(li:hover)_li:not(:hover)]:opacity-35">
          {productModules.map((m, i) => (
            <li key={m.key} className="group border-t border-line transition-opacity duration-500 last:border-b">
              <div tabIndex={0} className="grid grid-cols-[3rem_1fr_auto] items-baseline gap-x-4 py-7 outline-none sm:grid-cols-[4rem_1fr_auto] sm:py-9">
                <span className="tabular text-xs text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-[clamp(2rem,1.3rem+2.6vw,3.5rem)] font-light leading-none tracking-[-0.03em] text-fg transition-transform duration-700 ease-out-soft group-hover:translate-x-3 group-focus-within:translate-x-3">
                    {m.name}
                  </h3>
                  <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-700 ease-out-soft group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] [@media(hover:none)]:grid-rows-[1fr]">
                    <p className="overflow-hidden text-[15px] leading-relaxed text-fg-3">
                      <span className="block max-w-md pt-4 transition-transform duration-700 ease-out-soft group-hover:translate-x-3">{m.summary}</span>
                    </p>
                  </div>
                </div>
                <span className="text-[11px] uppercase tracking-[0.22em] text-fg-3">{m.role}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
