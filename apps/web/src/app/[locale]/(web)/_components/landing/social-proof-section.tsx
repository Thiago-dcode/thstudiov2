import type { ReactNode } from "react";
import { Sparkles, Palette, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WebSection } from "./web-section";

const ICONS: ReactNode[] = [
  <Palette className="size-4 shrink-0 text-accent" />,
  <Sparkles className="size-4 shrink-0 text-accent" />,
  <Users className="size-4 shrink-0 text-accent" />,
];

export async function SocialProofSection() {
  const t = await getTranslations("landing.socialProof");
  const highlights = t.raw("highlights") as string[];

  return (
    <section className="border-y border-border/40">
      <div className="mx-auto w-full max-w-(--screen-desktop) px-6 py-10 tablet:px-10 tablet:py-14">
        <div className="flex flex-col items-center gap-6 phone:flex-row phone:justify-center phone:gap-12">
          {highlights.map((text, index) => (
            <div key={text} className="flex items-center gap-2.5 text-center phone:text-left">
              {ICONS[index]}
              <span className="text-base font-medium tracking-wide text-text-muted">
                {text}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <WebSection.ActionLink
            href="/auth/register"
            className="text-text transition-colors hover:text-accent"
          >
            {t("cta")}
          </WebSection.ActionLink>
        </div>
      </div>
    </section>
  );
}
