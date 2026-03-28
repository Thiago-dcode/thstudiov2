import Link from "next/link";
import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowRight, ChevronDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-6">
      <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-8 text-center">
        <h1 className="font-serif text-5xl font-medium italic leading-[1.1] tracking-tight text-text phone-lg:text-6xl tablet:text-7xl laptop:text-8xl">
          Where Artists{" "}
          <span className="text-accent">Reveal</span>{" "}
          Their Craft
        </h1>

        <p className="max-w-lg text-base leading-relaxed text-text-muted tablet:text-lg">
          Build your portfolio. Get discovered. Connect with the world.
        </p>

        <div className="flex items-center gap-4">
          <Button asChild variant="primary" size="lg">
            <Link href="/auth/register">
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/artists">
              Explore Artists
            </Link>
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-text-muted/50">
        <ChevronDown className="size-5" />
      </div>

      <style>{`
        .hero-glow {
          background:
            radial-gradient(
              ellipse 60% 50% at 50% 45%,
              oklch(57% 0.19 302 / 0.06) 0%,
              transparent 70%
            );
        }
      `}</style>
    </section>
  );
}
