"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/providers/session.provider";

/**
 * Sign-in link beside the footer's registration CTA, for signed-out visitors only. A client
 * component so the footer itself stays a server component and its signed-out HTML stays cacheable.
 */
export function FooterSignInLink() {
  const { session } = useSession();
  const t = useTranslations("webHeader");

  if (session) return null;

  return (
    <Link
      href="/auth/login"
      className="inline-flex min-h-11 items-center text-sm tracking-wider text-text-muted transition-colors hover:text-text"
    >
      {t("signIn")}
    </Link>
  );
}
