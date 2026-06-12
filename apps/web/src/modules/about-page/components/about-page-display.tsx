import type { AboutPage } from "@repo/common-lib/types/about-page";

export const AboutPageDisplay = ({ aboutPage }: { aboutPage: AboutPage }) => {
  return (
    <article className="w-full rounded-lg border border-fg-2 bg-fg p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {aboutPage.photo && (
          <div className="shrink-0">
            <div className="relative aspect-3/4 w-48 overflow-hidden rounded-lg border-2 border-fg-2">
              <img
                src={aboutPage.photo}
                alt="About photo"
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
