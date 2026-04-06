import Link from "next/link";
import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="cta-glow pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-(--screen-desktop) flex-col items-center gap-8 px-6 py-24 text-center tablet:px-10 tablet:py-36">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Ready to begin?
        </span>
        <h2 className="max-w-2xl font-serif text-3xl font-medium italic leading-[1.1] tracking-tight tablet:text-5xl">
          Your next client is searching for someone like you
        </h2>
        <p className="max-w-lg text-sm leading-relaxed text-text-muted tablet:text-base tablet:leading-relaxed">
          Create a stunning portfolio in minutes, let AI handle the rest, and
          start getting discovered. Free to start — no credit card, no strings.
        </p>
        <Button asChild variant="primary" size="lg">
          <Link href="/auth/register">
            Create Your Portfolio
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <style>{`
        .cta-glow {
          background:
            radial-gradient(
              ellipse 60% 70% at 50% 60%,
              oklch(57% 0.19 302 / 0.06) 0%,
              transparent 70%
            ),
            radial-gradient(
              ellipse 40% 40% at 70% 30%,
              oklch(75% 0.14 85 / 0.04) 0%,
              transparent 70%
            );
        }
      `}</style>
    </section>
  );
}
