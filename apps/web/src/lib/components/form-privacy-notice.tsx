"use client";

import { cn } from "@repo/ui/lib/utils";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Which form the notice sits under: each one says what that form's data is used for. */
export type FormPrivacyNoticeContext =
  | "register"
  | "waitList"
  | "support"
  | "artistContact"
  | "report";

/**
 * First-layer data-protection notice (GDPR art. 13, AEPD layered model) shown where personal data is
 * collected: what this form's data is for, in one line, and a link to the full Privacy Policy. The
 * policy is the second layer; this line must never be the only information.
 */
export const FormPrivacyNotice = ({
  context,
  className,
}: {
  context: FormPrivacyNoticeContext;
  className?: string;
}) => {
  const t = useTranslations("formPrivacyNotice");
  return (
    // `!`: the global unlayered `p { font-size }` rule otherwise beats `text-xs`.
    <p className={cn("text-xs! leading-relaxed text-text-muted", className)}>
      {t.rich(context, {
        privacy: (chunks) => (
          <Link
            href="/legal/privacy"
            target="_blank"
            className="text-text underline underline-offset-4"
          >
            {chunks}
          </Link>
        ),
        terms: (chunks) => (
          <Link
            href="/legal/terms"
            target="_blank"
            className="text-text underline underline-offset-4"
          >
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
};
