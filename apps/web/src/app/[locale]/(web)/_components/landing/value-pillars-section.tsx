import { getTranslations } from "next-intl/server";
import { CustomIcon, type IconName } from "@/lib/components/custom-icon";
import { WebSection } from "./web-section";
import mediaService from "@/modules/media/media.service";
import { MediaCarousel } from "@/modules/media/components/media-carousel";
import { ValueCarousel } from "./values-carousel";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { ScrollHashLink } from "./scroll-hash-link";
import { ChevronDown } from "lucide-react";

const ICONS: IconName[] = ["cloud", "brain", "hands"];

export async function ValuePillarsSection() {
  const t = await getTranslations("landing.valuePillars");
  const items = t.raw("items") as { title: string; description: string }[];

  const valuePillarsMedia = await mediaService.findAllWithUser({
    is_value_pillars: true,
  });

  const media = valuePillarsMedia.data

  if (!media || !media.length) return null;

  return (
    <WebSection id="value-pillars" className="relative">


      <WebSection.Container className=" pl-0 px-0 tablet:px-0  min-h-screen h-full flex flex-col items-center pt-24 ">
        <div className="h-full w-full flex flex-col items-center  justify-center gap-24 m-auto ">

          <div className=" w-full ">
            <div className="flex justify-start flex-col tablet:flex-row gap-4">
              <MediaCarousel media={media} />
              <div className="order-first tablet:order-2 flex flex-col gap-4 max-w-lg ">
                <h2 className="hidden tablet:flex text-4xl! tablet:text-6xl! desktop:text-8xl! flex-col items-start justify-start gap-2"> <span>LET'S</span> <span>MAKE</span> <span>ART</span> <span>GREAT</span> <span className="">AGAIN</span></h2>
                <h2 className=" flex text-4xl!  flex-col items-start justify-start tablet:hidden"> <span>LET'S MAKE ART GREAT AGAIN</span> <span></span> <span></span></h2>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full  gap-8 ">

            <ValueCarousel items={items}/>
            <RegistrationCtaButton
              size="lg"
              className=" self-end mr-4 py-2"
              label={t("cta")}
            /></div>
        </div>

      </WebSection.Container>
      <ScrollHashLink
        href="#featured-portfolio"
        aria-label={t("scrollToNextSection")}
        className="z-100 absolute bottom-6 left-1/2 -translate-x-1/2 p-2 text-text-muted/50 transition-colors hover:text-text focus-visible:text-text"
      >
        <ChevronDown
          className="size-5 hero-bounce text-text-muted"
          aria-hidden="true"
        />
      </ScrollHashLink>
    </WebSection>
  );
}
