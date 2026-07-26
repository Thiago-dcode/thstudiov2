import type { MediaWithUser } from "@repo/common-lib/types/media";
import { Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  ArtistBreadcrumb,
  type BreadcrumbEntry,
} from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { FullscreenMedia } from "@/app/[locale]/(artists)/__components/fullscreen-media";
import { Link } from "@/i18n/navigation";
import Web from "@/lib/components/web-page.component";
import { buildMediaJsonLd, JsonLd } from "@/lib/seo/json-ld";

interface MediaPageComponentProps {
  user: { username: string };
  media: MediaWithUser;
  breadcrumbs?: BreadcrumbEntry[];
  backUrl?: string;
  canEdit?: boolean;
}

export const MediaPageComponent = async ({
  user,
  media,
  breadcrumbs = [],
  backUrl,
  canEdit,
}: MediaPageComponentProps) => {
  const t = await getTranslations("artists.media");
  const untitled = t("untitled");
  const allBreadcrumbs: BreadcrumbEntry[] = [
    ...breadcrumbs,
    {
      url: `/artists/media/${media.public_id}`,
      title: media.title || untitled,
      isActive: true,
    },
  ];

  return (
    <Web.Container>
      <JsonLd data={buildMediaJsonLd(media, user.username)} />
      <ArtistBreadcrumb
        username={user.username}
        items={allBreadcrumbs}
        backUrl={backUrl}
      />
      <Web.Header
        title={media.title || untitled}
        description={media.description || media.seo_description || undefined}
      >
        {canEdit && (
          <Link
            href={`/atelier/media?m=${media.public_id}`}
            aria-label={t("editAria")}
            className="text-text-muted hover:text-text transition-colors self-start md:self-auto"
          >
            <Pencil className="size-4 md:size-5" />
          </Link>
        )}
      </Web.Header>

      <FullscreenMedia
        url={media.url}
        alt={media.seo_alt || media.title || ""}
        title={media.title || undefined}
      />
    </Web.Container>
  );
};
