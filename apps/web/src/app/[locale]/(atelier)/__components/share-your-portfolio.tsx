import { getTranslations } from "next-intl/server";
import { localizedUrl } from "@/lib/seo/core";
import { getArtistProfile } from "@/modules/users/get-artist-share-ready";
import { CopyField } from "./copy-field";

/**
 * "Put your portfolio in your bio" — the artist's public link plus an HTML snippet for their own
 * website, both naming A11STUDIO.
 *
 * Every artist who pastes one of these into an Instagram bio or a personal site creates a crawlable
 * mention of the brand linking to a11studio.com: the one brand signal that grows with the number of
 * artists (docs/brand-search, task C-04).
 *
 * Rendered only once the profile is share-ready — the same rule as the public Share button — so
 * nobody is nudged to broadcast a profile that is still `noindex` with a muted share card.
 */
export async function ShareYourPortfolio({ username }: { username: string }) {
  const [profile, t] = await Promise.all([
    getArtistProfile(username),
    getTranslations("atelier.home"),
  ]);
  if (!profile?.is_share_ready) return null;

  // The canonical (English, unprefixed) URL: a bio link should not pin visitors to one language —
  // the site's language detection handles that on arrival.
  const url = localizedUrl("en", `/artists/${profile.username}`);
  const snippet = `<a href="${url}">${t("shareKitBadgeText")}</a>`;

  return (
    <section
      aria-labelledby="share-kit-heading"
      className="flex w-full max-w-2xl flex-col gap-8 py-10"
    >
      <div className="flex flex-col gap-3">
        <h2
          id="share-kit-heading"
          className="font-serif text-xl tracking-tight text-text"
        >
          {t("shareKitTitle")}
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-text-muted">
          {t("shareKitDescription")}
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <CopyField
          label={t("shareKitLinkLabel")}
          value={url}
          copyLabel={t("shareKitCopy")}
          copiedLabel={t("shareKitCopied")}
        />
        <CopyField
          label={t("shareKitSnippetLabel")}
          value={snippet}
          copyLabel={t("shareKitCopy")}
          copiedLabel={t("shareKitCopied")}
          mono
        />
      </div>
    </section>
  );
}
