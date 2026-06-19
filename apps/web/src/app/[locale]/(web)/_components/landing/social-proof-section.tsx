import { Palette, Sparkles, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { WebSection } from "./web-section";

const ICONS: ReactNode[] = [
 <Palette key="palette" className="size-4 shrink-0 text-text-muted" />,
 <Sparkles key="sparkles" className="size-4 shrink-0 text-text-muted" />,
 <Users key="users" className="size-4 shrink-0 text-text-muted" />,
];

export async function SocialProofSection() {
 const t = await getTranslations("landing.socialProof");
 const highlights = t.raw("highlights") as string[];

 return (
 <section className="border-y border-border/40">
 <div className="mx-auto w-full max-w-(--screen-desktop) px-6 py-10 tablet:px-10 tablet:py-14">
 <div className="flex flex-col items-center gap-6 phone:flex-row phone:justify-center phone:gap-12">
 {highlights.map((text, index) => (
 <div
 key={text}
 className="flex items-center gap-2.5 text-center phone:text-left"
 >
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
 className="text-text transition-colors hover:text-text-muted"
 >
 {t("cta")}
 </WebSection.ActionLink>
 </div>
 </div>
 </section>
 );
}
