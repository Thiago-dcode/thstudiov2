import { BrandLogo } from "@repo/ui/components/custom/brand-logo";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import usersService from "@/modules/users/users.service";

/**
 * "Made with a11studio" mark above the footer of a free-plan artist's pages; paid plans hide it.
 * Renders nothing when the flag can't be loaded — a flaky API must never brand a paying artist.
 */
export const ArtistBrandMark = async ({ username }: { username: string }) => {
  const response = await usersService.getBranding(username);
  if (!response.data?.show_brand) return null;

  const t = await getTranslations("artists.brandMark");

  return (
    <div className="flex w-full justify-center px-5 pt-16 pb-10 tablet:pt-20">
      <Link
        href="/"
        aria-label={t("label")}
        className="group inline-flex min-h-11 items-center gap-2 px-3 text-xs tracking-wider text-text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-em"
      >
        <span>{t("madeWith")}</span>
        <BrandLogo className="h-5 opacity-60 transition-opacity group-hover:opacity-100 tablet:h-5" />
      </Link>
    </div>
  );
};
