"use client";

import { useTranslations } from "next-intl";
import { clientEnv } from "@/env/client";
import { buildSlugPreview, type SlugResource } from "@/lib/slug-preview";

/**
 * Live preview of the public address a title will produce. Drop it under the title input.
 * Pure frontend: no API call, the slug is derived from `title` as the artist types.
 */
export function SlugPreview({
  title,
  username,
  resource,
}: {
  title: string;
  username: string;
  resource: SlugResource;
}) {
  const t = useTranslations("slugPreview");
  const { host, prefix, slug } = buildSlugPreview({
    appUrl: clientEnv.NEXT_PUBLIC_APP_URL,
    username,
    resource,
    title,
  });

  return (
    <p className="text-xs text-text-muted break-all" aria-live="polite">
      {t("label")}{" "}
      <span className="font-mono">
        {host}
        {prefix}
        <span className={slug ? "text-text" : undefined}>
          {slug ?? t("placeholder")}
        </span>
      </span>
    </p>
  );
}
