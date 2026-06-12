import { BrandLogo } from "@repo/ui/components/custom/brand-logo";
import { ThemeToggle } from "@repo/ui/components/custom/theme-toggle";
import Link from "next/link";
import { serverEnv } from "@/env/server";
import { WebFooterLanguageSwitcher } from "@/lib/components/web-footer-language-switcher";

const legalLinks = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/cookies", label: "Cookie Policy" },
] as const;

export const WebFooter = () => {
  const year = new Date().getFullYear();
  const supportEmail = serverEnv.SUPPORT_EMAIL;

  return (
    <footer className="w-full  border-t border-fg-2 bg-bg">
      <div className="max-w-(--screen-desktop) mx-auto px-5 tablet:px-10 py-12">
        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-10 tablet:gap-8">
          <div className="flex flex-col gap-3">
            <BrandLogo />
            <p className="text-xs tracking-wider leading-relaxed text-text-muted max-w-56">
              The portfolio platform built for artists.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
              Legal
            </span>
            <nav className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm tracking-wider text-text-muted hover:text-text transition-colors w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
              Contact
            </span>
            <a
              href={`mailto:${supportEmail}`}
              className="text-sm tracking-wider text-text-muted hover:text-text transition-colors w-fit"
            >
              {supportEmail}
            </a>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-fg-2 flex items-center justify-between">
          <p className="text-xs tracking-wider text-text-muted">
            &copy; {year} A11STUDIO. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <WebFooterLanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
};
