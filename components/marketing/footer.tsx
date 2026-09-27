import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { footerNav, siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-canvas">
      <div className="container-page grid gap-14 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-5">
          <Logo />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-fg-3">{siteConfig.tagline}.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:col-span-7">
          {footerNav.map((group) => (
            <div key={group.title}>
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-fg-3">{group.title}</h2>
              <ul className="mt-5 space-y-3">
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
      <div className="container-page">
        <div className="flex flex-col gap-4 border-t border-line py-6 text-xs text-fg-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 {siteConfig.name}</p>
        <ul className="flex items-center gap-6" aria-label="Social">
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
      </div>
    </footer>
  );
}
