import Link from "next/link";
import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="border-t border-border/40">
      <div className="mx-auto flex w-full max-w-(--screen-desktop) flex-col items-center gap-8 px-6 py-24 text-center tablet:px-10 tablet:py-32">
        <h2 className="font-serif text-3xl font-medium italic tracking-tight tablet:text-5xl">
          Your work deserves a stage
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-text-muted tablet:text-base">
          Join a growing community of artists building their presence — free to start, no strings attached.
        </p>
        <Button asChild variant="primary" size="lg">
          <Link href="/auth/register">
            Create Your Portfolio
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
