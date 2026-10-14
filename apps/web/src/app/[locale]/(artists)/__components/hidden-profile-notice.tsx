import { EyeOff } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { getArtistProfile } from "@/modules/users/get-artist-share-ready";

/**
 * Shown on every page of a DEACTIVATED artist to its signed-in owner — the only person the API still
 * serves those pages to (everyone else gets a 404). Without it the owner would see their profile
 * looking perfectly normal and assume it is public.
 *
 * The profile fetch is the same `cache()`d call the pages make, so this adds no request.
 */
export const HiddenProfileNotice = async ({
  username,
}: {
  username: string;
}) => {
  const [session, profile] = await Promise.all([
    userSession(),
    getArtistProfile(username),
  ]);
  if (!session || !profile || profile.is_active !== false) return null;
  if (session.username !== profile.username) return null;

  const t = await getTranslations("artists.hiddenNotice");

  return (
    <div
      role="status"
      className="w-full border-b border-fg-2 bg-fg px-5 py-3 tablet:px-10"
    >
      <div className="mx-auto flex max-w-(--screen-ultrawide) flex-col gap-2 phone-lg:flex-row phone-lg:items-center phone-lg:justify-between phone-lg:gap-6">
        <p className="flex items-start gap-2 text-xs! text-text-muted">
          <EyeOff className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium text-text">{t("title")}</span>{" "}
            {t("body")}
          </span>
        </p>
        <Link
          href="/atelier/settings"
          className="shrink-0 text-xs text-text underline underline-offset-4"
        >
          {t("cta")}
        </Link>
      </div>
    </div>
  );
};
