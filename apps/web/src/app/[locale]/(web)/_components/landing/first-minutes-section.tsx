import { artistCollectionPath } from "@repo/common-lib/utils/artist-path";
import NextImage from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { NextSectionArrow } from "./next-section-arrow";
import {
  editorialNumber,
  type LandingSectionProps,
  WebSection,
} from "./web-section";

type Step = {
  time: string;
  title: string;
  description: string;
  /**
   * File name of the step's screenshot in `public/landing/first-minutes/` (16:10, cropped from the
   * top). Named per step, not picked by position, so adding or removing a step never shifts the
   * images. Must be the same in every locale.
   */
  image: string;
  /** Alt text for the step's app screenshot. */
  imageAlt: string;
};

/**
 * To change a screenshot, replace the file. Served as-is (`unoptimized`): they are already small
 * WebP files, and going through the optimizer meant its cache (4 h in Next 16, keyed by URL) kept
 * serving the old image after a replace. Don't add a query string to bust it — Next 16 rejects
 * local images with a query unless `images.localPatterns` allows that exact one.
 */
const screenshotSrc = (image: string) => `/landing/first-minutes/${image}`;

/**
 * A real published collection, linked wherever a step's copy has `<link>…</link>`. Prod data: if
 * it's renamed or unpublished this link 404s (it also 404s on local and dev), so update it then.
 */
const EXAMPLE_PATH = artistCollectionPath("thsworld", "lanzarote-2026");

/** Turns `<link>label</link>` in a step description into a link to {@link EXAMPLE_PATH}. */
function StepDescription({ text }: { text: string }) {
  const match = text.match(/^(.*)<link>(.*)<\/link>(.*)$/);
  if (!match) return text;
  const [, before, label, after] = match;
  return (
    <>
      {before}
      <Link
        href={EXAMPLE_PATH}
        className="whitespace-nowrap font-medium text-text underline underline-offset-4 hover:text-text-muted"
      >
        {label}
      </Link>
      {after}
    </>
  );
}

/** The step's time marker, set like the editorial metadata labels. */
const TIME_CLASS =
  "shrink-0 text-xs! font-medium tabular-nums uppercase tracking-[0.24em] text-text-muted";

export async function FirstMinutesSection({
  id,
  nextSectionId,
  index,
}: LandingSectionProps) {
  const t = await getTranslations("landing.firstMinutes");
  const steps = t.raw("steps") as Step[];

  return (
    <WebSection id={id} className="overflow-hidden">
      <WebSection.Container className="flex flex-col gap-16 px-5 py-20 tablet:px-10 tablet:py-28 laptop:gap-24">
        <WebSection.EditorialHeader
          className="mx-auto w-full max-w-6xl"
          label={t("badge")}
          qualifier={index ? editorialNumber(index) : undefined}
          title={t("title")}
          standfirst={t("lead")}
        />

        {/* Phones: an accordion (time + title opens the step), only the first open. Native
            <details>, so it works without JavaScript. The zigzag list below takes over from
            tablet up; only one of the two is ever displayed, and the hidden one's lazy images are
            never fetched. */}
        <ol className="flex flex-col border-t border-border tablet:hidden">
          {steps.map((step, stepIndex) => (
            <li key={step.time} className="border-b border-border">
              <details open={stepIndex === 0} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-4 py-5 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className={`w-12 ${TIME_CLASS}`}>
                    {step.time}
                  </span>
                  <h3 className="flex-1 font-serif! text-xl! font-normal! leading-tight!">
                    <span className="sr-only">{`${stepIndex + 1}. `}</span>
                    {step.title}
                  </h3>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 12 12"
                    className="h-3 w-3 shrink-0 text-text-muted transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.25}
                  >
                    <path d="M6 0v12M0 6h12" />
                  </svg>
                </summary>
                <div className="flex flex-col gap-5 pb-6">
                  {/* Indented to line up with the title (w-12 time + gap-4). */}
                  <p className="pl-16 text-base! leading-relaxed text-text-muted">
                    <StepDescription text={step.description} />
                  </p>
                  <figure className="relative aspect-16/10 w-full overflow-hidden border border-border bg-fg">
                    <NextImage
                      src={screenshotSrc(step.image)}
                      alt={step.imageAlt}
                      fill
                      unoptimized
                      className="object-cover object-top"
                    />
                  </figure>
                </div>
              </details>
            </li>
          ))}
        </ol>

        <ol className="hidden flex-col gap-16 tablet:flex tablet:gap-20 laptop:gap-28">
          {steps.map((step, stepIndex) => {
            // Steps zigzag: text left / image right, then mirrored.
            const flip = stepIndex % 2 === 1;
            return (
              // A fixed-width pair, centred, top-aligned: the text block and a small screenshot
              // sit right next to each other (no gap between them; the text keeps its own padding
              // on the image side). The pointer line fills the text block's time row, so it runs
              // from where the text starts to exactly where the image starts. Mirrored steps
              // right-align the text so the line still starts at the text and ends at the image.
              <li
                key={step.time}
                // Centred under the centred header, capped so the screenshots stay supporting on
                // wide screens. Text-left steps nudge right and mirrored ones left, so the pairs
                // zigzag. Uses `left` (not translate) because the fade-in animation owns transform.
                className={`first-minutes-step relative mx-auto flex w-full max-w-6xl flex-col gap-6 tablet:flex-row tablet:items-start tablet:gap-0 ${flip ? "tablet:flex-row-reverse tablet:-left-4 laptop:-left-10 desktop:-left-16" : "tablet:left-4 laptop:left-10 desktop:left-16"}`}
              >
                <div
                  className={`flex flex-col gap-3 tablet:w-[45%] tablet:flex-none ${flip ? "tablet:text-right" : ""}`}
                >
                  <div
                    className={`flex items-center gap-4 ${flip ? "tablet:flex-row-reverse" : ""}`}
                  >
                    <span aria-hidden="true" className={TIME_CLASS}>
                      {step.time}
                    </span>

                    <PointerLine direction={flip ? "left" : "right"} />
                  </div>
                  <h3
                    // Stays at 2xl through iPad portrait, where the text column is ~45% of 768px.
                    className={`font-serif! text-2xl! font-normal! leading-tight! tracking-[-0.01em] laptop:text-3xl! ${flip ? "tablet:pl-8" : "tablet:pr-8"}`}
                  >
                    <span className="sr-only">{`${stepIndex + 1}. `}</span>
                    {step.title}
                  </h3>
                  <p
                    className={`max-w-md text-base! leading-relaxed text-text-muted ${flip ? "tablet:ml-auto tablet:pl-8" : "tablet:pr-8"}`}
                  >
                    <StepDescription text={step.description} />
                  </p>
                </div>

                <div className="w-full max-w-xl tablet:w-[55%] tablet:max-w-none tablet:flex-none">
                  <figure className="relative aspect-16/10 w-full overflow-hidden border border-border bg-fg">
                    <NextImage
                      src={screenshotSrc(step.image)}
                      alt={step.imageAlt}
                      fill
                      unoptimized
                      className="object-cover object-top"
                    />
                  </figure>
                </div>
              </li>
            );
          })}
        </ol>
      </WebSection.Container>
      <NextSectionArrow nextSectionId={nextSectionId} />

      {/* Scroll-linked fade where the browser supports it; static everywhere else and for anyone
          who asked for reduced motion. No JavaScript. */}
      <style>{`
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .first-minutes-step {
      animation: first-minutes-in linear both;
      animation-timeline: view();
      /* Done once the step's top quarter is on screen, so no step (the last one sits right above
         the next section) can be left half-faded where the visitor stops scrolling. */
      animation-range: entry 0% entry 25%;
    }
    @keyframes first-minutes-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }
  }
}
`}</style>
    </WebSection>
  );
}

/**
 * A hairline arrow on the time marker's row, filling the rest of the text block, so it runs from
 * the start of the step's text to the screenshot's edge (text and image touch). Tablet+ only:
 * below that the image sits under the text. Decorative.
 */
function PointerLine({ direction }: { direction: "left" | "right" }) {
  return (
    <div
      aria-hidden="true"
      className={`hidden flex-1 items-center text-border-em tablet:flex ${direction === "left" ? "flex-row-reverse" : ""}`}
    >
      <span className="h-px flex-1 bg-current" />
      <svg
        viewBox="0 0 8 12"
        className={`h-3 w-2 shrink-0 ${direction === "left" ? "ml-2 -mr-px -scale-x-100" : "mr-2 -ml-px"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path d="M1 1l5 5-5 5" />
      </svg>
    </div>
  );
}
