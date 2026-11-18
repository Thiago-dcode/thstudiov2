import { BrandLogo } from "@repo/ui/components/custom/brand-logo";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import authComponent from "@/lib/components/page-component";

/** The sign-in / sign-up card: brand logo, title, then the page's body. */
export const AuthCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <authComponent.Container className="max-w-md">
      <authComponent.Content className="surface-card gap-6 px-6 py-10 inset-shadow-none">
        <authComponent.Header>
          <Link
            href="/"
            className="mb-2 text-text transition-opacity hover:opacity-80"
          >
            <BrandLogo className="h-10 tablet:h-10" />
          </Link>
          <authComponent.Title title={title} />
        </authComponent.Header>
        <div className="flex w-full flex-col gap-6">{children}</div>
      </authComponent.Content>
    </authComponent.Container>
  );
};

/** "or" rule between the OAuth buttons and the email form. */
export const AuthDivider = () => {
  const t = useTranslations("auth.oauth");
  return (
    <div className="flex items-center gap-4" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-widest text-text-muted">
        {t("or")}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
};

/** Centered stack under the form: the switch link and the agreement line. */
export const AuthFooter = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {children}
    </div>
  );
};

/** "Already have an account? Log in" / "Don't have an account? Sign up". */
export const AuthSwitchLink = ({
  prompt,
  label,
  href,
}: {
  prompt: string;
  label: string;
  href: string;
}) => {
  return (
    <p className="text-sm! text-text-muted">
      {prompt}{" "}
      <Link
        href={href}
        className="text-text underline underline-offset-4 transition-colors hover:text-text-muted"
      >
        {label}
      </Link>
    </p>
  );
};
