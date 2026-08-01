import { BrandLogo } from "@repo/ui/components/custom/brand-logo";
import { ThemeToggle } from "@repo/ui/components/custom/theme-toggle";
import { getTranslations } from "next-intl/server";
import type { ComponentType, SVGProps } from "react";
import { serverEnv } from "@/env/server";
import { Link } from "@/i18n/navigation";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { InstagramIcon, LinkedInIcon } from "@/lib/components/social-icons";
import { WebFooterLanguageSwitcher } from "@/lib/components/web-footer-language-switcher";
import { config } from "@/lib/config";
import { SOCIAL, type SocialKey } from "@/lib/social";

const legalLinks = [
  { href: "/legal/privacy", key: "privacy" },
  { href: "/legal/terms", key: "terms" },
  { href: "/legal/cookies", key: "cookies" },
] as const;

/** Icon + aria-label key for each {@link SOCIAL} entry, so adding a network only needs a row here. */
const socialMeta: Record<
  SocialKey,
  {
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
    labelKey: "instagram" | "linkedin";
  }
> = {
  instagram: { Icon: InstagramIcon, labelKey: "instagram" },
  linkedin: { Icon: LinkedInIcon, labelKey: "linkedin" },
};

export const WebFooter = async () => {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();
  const supportEmail = serverEnv.SUPPORT_EMAIL;

  return (
    <footer className="w-full border-t border-fg-2 bg-bg">
      <div className="mx-auto max-w-(--screen-ultrawide) px-5 py-10 tablet:px-10 tablet:py-12">
        <div className="grid grid-cols-1 gap-10 phone-lg:grid-cols-2 tablet:grid-cols-3 tablet:gap-8">
          <div className="flex flex-col gap-3 phone-lg:col-span-2 tablet:col-span-1">
            <BrandLogo />
            <p className="max-w-xs text-xs leading-relaxed tracking-wider text-text">
              {t("tagline")}
            </p>
            <RegistrationCtaButton size="sm" className="w-fit" />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text">
              {t("legal.heading")}
            </span>
            <nav className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit text-sm tracking-wider text-text transition-colors hover:text-text"
                >
                  {t(`legal.${link.key}`)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text">
              {t("contact.heading")}
            </span>
            <nav className="flex flex-col gap-2">
              <Link
                href="/about"
                className="w-fit text-sm tracking-wider text-text transition-colors hover:text-text"
              >
                {t("contact.about")}
              </Link>
              <Link
                href="/faqs"
                className="w-fit text-sm tracking-wider text-text transition-colors hover:text-text"
              >
                {t("contact.faqs")}
              </Link>
              <Link
                href="/support"
                className="w-fit text-sm tracking-wider text-text transition-colors hover:text-text"
              >
                {t("contact.support")}
              </Link>
              <a
                href={`mailto:${supportEmail}`}
                className="w-fit break-all text-sm tracking-wider text-text transition-colors hover:text-text phone-lg:break-normal"
              >
                {supportEmail}
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-fg-2 pt-6 tablet:mt-12 phone-lg:flex-row phone-lg:items-center phone-lg:justify-center phone-lg:gap-8">
          <p className="text-center text-xs! tracking-wider text-text phone-lg:text-left">
            {t("copyright", { year })}
            <span className="ml-2 text-text-muted/60 text-xs!">
              v{config.app_version}
            </span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 phone-lg:justify-end">
            <nav
              aria-label={t("social.heading")}
              className="flex items-center gap-1"
            >
              {(Object.keys(SOCIAL) as SocialKey[]).map((key) => {
                const { Icon, labelKey } = socialMeta[key];
                return (
                  <a
                    key={key}
                    href={SOCIAL[key]}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={t(`social.${labelKey}`)}
                    className="inline-flex size-11 items-center justify-center text-text-muted transition-colors hover:text-text"
                  >
                    <Icon className="size-[18px]" />
                  </a>
                );
              })}
            </nav>
            <WebFooterLanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
};
