import { getTranslations } from "next-intl/server";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { landingCache } from "@/lib/config";
import { MediaCarousel } from "@/modules/media/components/media-carousel";
import mediaService from "@/modules/media/media.service";
import { reportSectionError } from "./section-error";
import { ValueCarousel } from "./values-carousel";
import { WebSection } from "./web-section";

export async function ValuePillarsSection() {
  const t = await getTranslations("landing.valuePillars");
  const items = t.raw("items") as { title: string; description: string }[];

  const valuePillarsMedia = await mediaService.findAllWithUser(
    { is_value_pillars: true, is_active: true },
    landingCache("media-value-pillars"),
  );

  reportSectionError("value-pillars", valuePillarsMedia);
  const media = valuePillarsMedia.data;

  if (!media?.length) return null;

  return (
    <WebSection id="value-pillars" className="relative">
      <WebSection.Container className=" pl-0 px-0 tablet:px-0  min-h-screen h-full flex flex-col items-center pt-20 tablet:pt-24 ">
        <div className="h-full w-full flex flex-col items-center  justify-center gap-12 desktop-lg:gap-24 m-auto ">
          <div className=" w-full ">
            <div className="flex justify-start flex-col tablet:flex-row gap-4">
              <MediaCarousel media={media} />
              <div className="order-first tablet:order-2 flex flex-col gap-4 max-w-lg ">
                {/* One heading, one copy of its text. The word-per-line break on tablet+ is
                    purely layout (flex-col); on phones the same words wrap as a sentence. The
                    previous version still carried the headline twice (a phone span + a tablet
                    span), so crawlers read "LET'S MAKE ART GREAT AGAIN" two times over. */}
                <h2 className="flex flex-wrap gap-x-[0.25em] text-4xl! tablet:text-6xl! desktop:text-7xl! desktop-lg:text-8xl! items-start justify-start tablet:flex-col tablet:gap-2">
                  <span>LET'S</span> <span>MAKE</span> <span>ART</span>{" "}
                  <span>GREAT</span> <span>AGAIN</span>
                </h2>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full  gap-8 ">
            <ValueCarousel items={items} />
            <RegistrationCtaButton
              size="lg"
              className=" self-end mr-4 py-2"
              label={t("cta")}
            />
          </div>
        </div>
      </WebSection.Container>
      <WebSection.NextSectionLink
        href="#featured-portfolio"
        ariaLabel={t("scrollToNextSection")}
      />
    </WebSection>
  );
}
