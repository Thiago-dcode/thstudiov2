import { getTranslations } from "next-intl/server";
import Image, { type StaticImageData } from "next/image";
import arrowIcon from "@/assets/icons/custom/arrow.png";
import crownIcon from "@/assets/icons/custom/crown.png";
import starIcon from "@/assets/icons/custom/star.png";
import { WebSection } from "./web-section";

const ICONS: StaticImageData[] = [crownIcon ,starIcon , arrowIcon];

export async function SocialProofSection() {
  const t = await getTranslations("landing.socialProof");
  const highlights = t.raw("highlights") as string[];

  return (
    <section className="border-y border-border/40">
      <div className="mx-auto w-full max-w-(--screen-desktop) px-6 tablet:px-10">
        <div className="flex flex-col divide-y divide-border/40 phone:flex-row phone:divide-x phone:divide-y-0">
          {highlights.map((text, index) => (
            <div
              key={text}
              className="group flex flex-1 flex-col items-center gap-3 px-8 py-10 transition-colors duration-200 hover:bg-fg-1/40"
            >
              <Image
                src={ICONS[index]!}
                alt=""
                className="size-7 object-contain opacity-60 transition-opacity duration-200 group-hover:opacity-100"
              />
              <span className="text-center text-xs font-semibold uppercase tracking-widest text-text-muted">
                {text}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-center border-t border-border/40 py-6">
          <WebSection.ActionLink
            href="/auth/register"
            className="text-sm text-text-muted transition-colors hover:text-text"
          >
            {t("cta")}
          </WebSection.ActionLink>
        </div>
      </div>
    </section>
  );
}
