"use client";

import {
  EDITORIAL_STANDFIRST_CLASS,
  EditorialRule,
  editorialHeadlineClass,
} from "@repo/ui/components/custom/editorial";
import { cn } from "@repo/ui/lib/utils";
import { ArrowLeft } from "lucide-react";
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
        <EditorialRule />

        <div className="mt-8 space-y-5">
          <h1 className={editorialHeadlineClass("section")}>{t("title")}</h1>
          <p className={cn(EDITORIAL_STANDFIRST_CLASS, "mx-auto max-w-sm")}>
            {t("description")}
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 phone-lg:flex-row">
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
