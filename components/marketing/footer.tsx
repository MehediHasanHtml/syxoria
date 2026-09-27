import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { footerNav, siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-canvas">
      <div className="container-page flex flex-col gap-8 py-12 lg:flex-row lg:items-center lg:justify-between">
        <Logo />
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-7 gap-y-3">
            {footerNav.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-[13px] text-fg-3 transition-colors duration-200 hover:text-fg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-[13px] text-fg-3">© 2026 {siteConfig.name}</p>
      </div>
    </footer>
  );
}
