import { ArrowRight, Sparkles, Palette, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

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
              <span className="text-sm font-medium tracking-wide text-text-muted">
                {text}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/auth/register"
            className="group inline-flex items-center gap-2 text-sm font-medium tracking-wider text-text transition-colors hover:text-accent"
          >
            {t("cta")}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
