"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center px-6 py-8 animate-in fade-in duration-700">
      <div className="relative flex max-w-lg flex-col items-center text-center">
        <div className="border border-border/40 p-4">
          <RotateCcw className="size-6 text-text-muted/60" strokeWidth={1.5} />
        </div>

        <div className="mt-6 space-y-3">
          <h1 className="font-serif text-2xl tracking-tight tablet:text-3xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-text-muted tablet:text-base">
            {t("description")}
          </p>
        </div>

        <div className="mt-6 h-px w-8 bg-border/60" />

        <div className="mt-6 flex flex-col items-center gap-3 phone-lg:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2.5 border border-text bg-text px-7 py-3 text-xs uppercase tracking-[0.15em] text-bg transition-all duration-300 hover:bg-text/90"
          >
            {t("tryAgain")}
          </button>
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 border border-border/50 px-7 py-3 text-xs uppercase tracking-[0.15em] text-text-muted transition-all duration-300 hover:border-text/30 hover:text-text"
          >
            <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span>{t("backToHome")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
