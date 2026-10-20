"use client";

import { BrandLogo } from "@repo/ui/components/custom/brand-logo";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { InvitePlacement } from "@/lib/analytics/track";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { useAppStatus } from "@/lib/providers/app-status.provider";
import { useSession } from "@/lib/providers/session.provider";

/**
 * The invitation to create a portfolio that an artist's public pages carry, on every plan.
 *
 * Restraint is the point: the artist's work is the page, so every placement (here, the header slot
 * and the footer) is a quiet text link — never an accent button, never a popup — shown only to
 * signed-out visitors. This component covers the two moments the visitor has finished with the
 * work: after the content, and after they've sent the artist a message. Media detail views never
 * show it. Clicks are measured as `artist_invite_clicked` with the placement; no UTM tags, which on
 * an internal link would restart the GA session and erase the visitor's real source.
 */
export const ArtistInvite = ({
  placement,
}: {
  placement: Extract<InvitePlacement, "end_of_content" | "contact_success">;
}) => {
  const t = useTranslations("artists.invite");
  const { session } = useSession();
  // Despite the name, `true` means registration is open (see RegistrationCtaButton).
  const { isRegisterClose } = useAppStatus();
  const pathname = usePathname();

  if (placement === "end_of_content" && pathname.includes("/media/")) {
    return null;
  }

  const label = isRegisterClose ? t("cta") : t("ctaWaitlist");
  if (placement === "contact_success") {
    if (session) return null;
    // A text link here: the dialog's own "Close" is already the outlined button.
    return (
      <div className="flex flex-col items-start gap-1 border-t border-fg-2 pt-6">
        <p className="text-sm text-text-muted">{t("contactTitle")}</p>
        <RegistrationCtaButton
          variant="link"
          size="sm"
          label={label}
          className="min-h-11 px-0 text-sm tracking-wider"
          invitePlacement={placement}
        />
      </div>
    );
  }

  return (
    <aside
      aria-label={t("label")}
      className="flex w-full flex-col items-center gap-4 px-5 pt-16 pb-10 text-center tablet:pt-20"
    >
      <Link
        href="/"
        className="group inline-flex min-h-11 items-center gap-2 px-3 text-xs tracking-wider text-text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-em"
      >
        <span>{t("madeWith")}</span>
        <BrandLogo className="h-5 opacity-60 transition-opacity group-hover:opacity-100 tablet:h-5" />
      </Link>
      {!session && (
        <div className="flex max-w-lg flex-col items-center gap-5">
          <p className="font-serif text-lg font-light leading-snug text-text tablet:text-xl">
            {t("endTitle")}
          </p>
          <RegistrationCtaButton
            variant="outline"
            size="sm"
            label={label}
            className="min-h-11 border-border-em px-5 text-sm tracking-wider text-text hover:bg-fg"
            invitePlacement={placement}
          />
        </div>
      )}
    </aside>
  );
};
