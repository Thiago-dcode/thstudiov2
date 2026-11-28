import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ArtistContactDialog } from "./artist-contact.dialog";

/** Shown instead of any section view when the artist has no highlighted work yet. */
export const ArtistSectionsEmpty = async ({
  displayName,
}: {
  displayName: string;
}) => {
  const t = await getTranslations("artists.sections.emptyState");

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 px-6 text-center">
      <p className="font-serif! text-xl! italic text-text-muted">
        {t("title", { name: displayName })}
      </p>
      <p className="text-sm text-text-muted/70">{t("subtitle")}</p>
      <ArtistContactDialog>
        <button
          type="button"
          className="group inline-flex min-h-11 cursor-pointer items-center gap-2.5 border border-border/50 px-7 py-3 text-xs tracking-[0.15em] text-text-muted uppercase transition-all duration-300 hover:border-text/30 hover:text-text"
        >
          <Mail
            className="size-3.5 transition-transform duration-300 group-hover:-translate-y-px"
            aria-hidden="true"
          />
          <span>{t("cta")}</span>
        </button>
      </ArtistContactDialog>
    </div>
  );
};
