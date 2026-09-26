import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { footerNav, siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-canvas">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-fg-3">{siteConfig.tagline}. Designed in Europe, built for teams who want to grow calmly.</p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-sm border border-line px-2.5 py-1.5 text-xs text-fg-2">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-positive/60 motion-reduce:hidden" />
              <span className="relative size-1.5 rounded-full bg-positive" />
            </span>
            All systems operational
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
          {footerNav.map((group) => (
            <div key={group.title}>
              <h2 className="eyebrow">{group.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-fg-2 transition-colors duration-200 hover:text-fg">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="container-page flex flex-col gap-4 border-t border-line py-6 text-xs text-fg-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 {siteConfig.name}. All rights reserved.</p>
        <ul className="flex items-center gap-5" aria-label="Social">
          <li>
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-fg">
              LinkedIn
            </a>
          </li>
          <li>
            <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-fg">
              X
            </a>
          </li>
          <li>
            <a href={`mailto:${siteConfig.contactEmail}`} className="transition-colors hover:text-fg">
              {siteConfig.contactEmail}
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
