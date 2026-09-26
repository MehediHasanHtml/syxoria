import { BrainCog, Globe2, KeyRound, Lock, ScrollText, ShieldCheck, UserCheck } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { security } from "@/content/marketing";

const securityIcons = [Lock, Globe2, UserCheck, KeyRound, ScrollText, BrainCog];

export function Security() {
  return (
    <section id="security" aria-labelledby="security-title" className="border-t border-line py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+3rem)]">
            <SectionHeading id="security-title" eyebrow={security.eyebrow} title={security.title} body={security.body} />
            <Reveal delay={120} className="mt-8 flex flex-wrap gap-2">
              {["GDPR-aligned", "EU hosting", "SSO / SAML", "Audit logs"].map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 rounded-sm border border-line px-2.5 py-1.5 text-xs text-fg-2">
                  <ShieldCheck className="size-3.5 text-accent" aria-hidden="true" />
                  {b}
                </span>
              ))}
            </Reveal>
          </div>
        </div>
        <ul className="grid border-l border-t border-line sm:grid-cols-2 lg:col-span-7">
          {security.items.map((item, i) => {
            const Icon = securityIcons[i];
            return (
              <Reveal as="li" key={item.title} delay={(i % 2) * 80} className="border-b border-r border-line p-6 sm:p-8">
                <Icon className="size-5 text-fg-2" strokeWidth={1.5} aria-hidden="true" />
                <h3 className="mt-6 text-[15px] font-medium text-fg">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-3">{item.body}</p>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
