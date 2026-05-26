import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { serverEnv } from "@/env/server";
import { getTranslations } from "next-intl/server";

export async function HeroSection() {
  const session = await userSession();
  const t = await getTranslations("landing.hero");
  // const categoriesResponse = await categoriesService.getAll({
  //   is_featured: true,
  //   paginated: true,
  // });

  // const categories = categoriesResponse.data ?? [];

  return (
    <section className="w-full relative overflow-hidden pb-28 tablet:pb-16 h-screen">



      <div className="flex flex-col items-center justify-center h-full py-8">
        <div className="w-full flex flex-col items-center gap-9 text-center z-100">
          {/* <span className="w-fit flex justify-center items-center gap-2 rounded-full border border-border/50 bg-fg/40 px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] text-text-muted backdrop-blur-md">
            <Sparkles className="size-3 text-accent" aria-hidden />
            For artists of every discipline
          </span> */}
          <h1 className="w-full mx-2 font-serif text-5xl font-medium leading-[1.05] tracking-tight text-text phone-lg:text-6xl tablet:text-7xl laptop:text-[5.25rem]">
            {t("titlePrefix")} <span className="hero-accent-text italic">{t("titleAccent")}</span> {t("titleSuffix")}
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-text-muted tablet:text-lg tablet:leading-relaxed">
            {t("subtitle")}
          </p>
          <div className="flex flex-col gap-4 items-center justify-center">
            <div className="flex flex-col items-center gap-3 phone:flex-row phone:gap-4">
              <Button asChild variant="primary" size="lg">
                <Link href={session ? "/atelier" : "/auth/register"}>
                  {session ? t("primaryCtaLoggedIn") : t("primaryCtaLoggedOut")}
                  <ArrowRight className="" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/artists">{t("secondaryCta")}</Link>
              </Button>
            </div>

            <p className="text-xs tracking-wider text-text-muted/60">
              {t("disclaimer")}
            </p>
          </div>

        </div>
        <video
          src={`${serverEnv.ASSETS_URL}/videos/hero-bg.mp4`}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover z-1 opacity-60"
        />
        {/* {categories.length > 0 && (
          <div className="w-full flex flex-col items-center gap-3 tablet:gap-4 px-4">
            <span className="flex items-center gap-2 text-[9px] phone-lg:text-[10px] uppercase tracking-[0.18em] text-text-muted/70">
              <Search className="size-3 text-accent" aria-hidden />
              Search artists by category
            </span>

            <nav
              aria-label="Browse artists by category"
              className="flex flex-wrap justify-center gap-1.5 phone:gap-2 pb-2 max-w-[90vw] tablet:max-w-3xl"
            >
              {categories.map((cat) => (
                <Link
                  key={`cat-hero-link-${cat.slug}`}
                  href={`/artists?categories=${cat.slug}`}
                  aria-label={`Search artists in ${cat.name}`}
                  className="group relative inline-flex items-center gap-1 phone:gap-1.5 rounded-full border border-border/50 bg-fg/40 px-3 py-1 phone:px-4 phone:py-1.5 text-[11px] phone:text-xs font-medium tracking-wide text-text-muted backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/50 hover:bg-gradient-to-r hover:from-secondary/20 hover:to-accent/20 hover:text-text hover:shadow-[0_4px_20px_-6px_var(--color-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  <span>{cat.name}</span>
                  <ArrowUpRight
                    className="size-3 text-text-muted/60 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-secondary"
                    aria-hidden
                  />
                </Link>
              ))}
            </nav>
          </div>
        )} */}
     
      </div>

      <style>{`
        .hero-glow {
          background:
            radial-gradient(
              ellipse 70% 55% at 50% 40%,
              oklch(57% 0.19 302 / 0.10) 0%,
              transparent 70%
            );
        }
        .hero-glow-secondary {
          background:
            radial-gradient(
              ellipse 40% 35% at 30% 55%,
              oklch(75% 0.14 85 / 0.05) 0%,
              transparent 70%
            ),
            radial-gradient(
              ellipse 40% 35% at 70% 45%,
              oklch(57% 0.19 302 / 0.05) 0%,
              transparent 70%
            );
        }
        .hero-grid {
          background-image:
            linear-gradient(to right, oklch(0.52 0.006 48.72 / 0.14) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(0.52 0.006 48.72 / 0.14) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 70% 65% at 50% 42%, black 0%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 70% 65% at 50% 42%, black 0%, transparent 75%);
        }
        .hero-accent-text {
          display: inline-block;
          padding-inline: 0.25rem;
          background: linear-gradient(135deg, oklch(57% 0.19 302), oklch(65% 0.16 340));
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </section>
  );
}
