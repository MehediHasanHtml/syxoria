import { IntegrationLogo } from "@/components/shared/integration-logo";
import { Reveal } from "@/components/shared/reveal";
import type { Integration } from "@/types";

/** Integration "roots": each tool's mark + name, category on hover. */
export function IntegrationsBand({ integrations }: { integrations: Integration[] }) {
  return (
    <section id="integrations" aria-labelledby="integrations-title" className="border-y border-line bg-canvas-2/60">
      <div className="container-page grid items-center gap-8 py-10 lg:grid-cols-[16rem_1fr] lg:py-12">
        <Reveal>
          <h2 id="integrations-title" className="text-sm font-medium text-fg">
            Rooted in the tools you already use
          </h2>
          <p className="mt-1.5 text-[13px] text-fg-3">Connect in minutes. Nothing to migrate.</p>
        </Reveal>
        <Reveal delay={100}>
          <ul className="grid grid-cols-2 border-l border-t border-line sm:grid-cols-3 md:grid-cols-5">
            {integrations.map((i) => (
              <li
                key={i.id}
                className="group relative flex h-20 flex-col items-center justify-center gap-2 border-b border-r border-line text-center transition-colors duration-300 hover:bg-white/[0.03]"
              >
                <IntegrationLogo id={i.id} size={26} className="transition-transform duration-500 ease-out-soft group-hover:-translate-y-0.5" />
                <span className="text-[13px] font-medium tracking-tight text-fg-2 transition-colors group-hover:text-fg">{i.name}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
