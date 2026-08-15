import type { AboutPage } from "@repo/common-lib/types/about-page";
import { getTranslations } from "next-intl/server";

export const AboutPageDisplay = async ({
  aboutPage,
}: {
  aboutPage: AboutPage;
}) => {
  const t = await getTranslations("atelier.about.form");

  return (
    <article className="w-fit border border-fg-2 bg-fg p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {aboutPage.photo && (
          <div className="shrink-0">
            <div className="relative aspect-3/4 w-48 overflow-hidden border-2 border-fg-2">
              <img
                src={aboutPage.photo}
                alt={t("photoAlt")}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {aboutPage.title && (
            <h2 className="text-2xl font-semibold">{aboutPage.title}</h2>
          )}
          <p className="text-text-muted whitespace-pre-wrap leading-relaxed">
            {aboutPage.description}
          </p>
        </div>
      </div>
    </article>
  );
};
