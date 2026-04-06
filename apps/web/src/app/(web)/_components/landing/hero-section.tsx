import Link from "next/link";
import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import { userSession } from "@/modules/auth/server-actions/user-session.action";

export async function HeroSection() {
  const session = await userSession();

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-6">
      <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="hero-glow-secondary pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 flex max-w-5xl flex-col items-center gap-10 text-center">
        <h1 className="font-serif text-5xl font-medium italic leading-[1.05] tracking-tight text-text phone-lg:text-6xl tablet:text-7xl laptop:text-8xl">
         Never was that{' '}
          <span className="hero-accent-text pr-3">Easy</span>to build a presence online
        </h1>

        <p className="max-w-xl text-base leading-relaxed text-text-muted tablet:text-lg tablet:leading-relaxed">
          Build a beautiful artist profile like a professional website —
          and customize it as fast as updating your social feed. AI handles
          the boring part (but important ones).
        </p>

        <div className="flex flex-col items-center gap-4 phone:flex-row">
          <Button asChild variant="primary" size="default">
            <Link href={session ? "/atelier" : "/auth/register"}>
              {session ? "Access Atelier" : "Start Free Now"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/artists">Explore Artists</Link>
          </Button>
        </div>

        <p className="text-xs tracking-wider text-text-muted/60">
          Free to start &middot; No credit card required
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-text-muted/50">
        <ChevronDown className="size-5" />
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
        .hero-accent-text {
          background: linear-gradient(135deg, oklch(57% 0.19 302), oklch(65% 0.16 340));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </section>
  );
}
