import { getBenefitMonths } from "@repo/common-lib/utils/wait-list";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/redirect";
import assetService from "@/modules/assets/asset.service";
import waitListService from "@/modules/wait-list/wait-list.service";

export const dynamic = "force-dynamic";

/** Same example artist page the wait-list emails link to. */
const WAIT_LIST_SHOWCASE_PATH = "/artists/thsworld";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("waitListValidate");

  return {
    title: { absolute: t("metadata.title") },
    description: t("metadata.description"),
    // One-time token URL: never indexable. robots.txt disallows /wait-list too, but Disallow only
    // stops the crawl — this is what actually keeps a shared link out of the index.
    robots: { index: false, follow: false },
  };
}

async function WaitListImage() {
  const heroImage = await assetService.getBySlug("madrid-diana-cazadora");

  return (
    <figure
      className="relative aspect-4/3 overflow-hidden border border-border bg-fg"
      aria-hidden
    >
      {heroImage.data && (
        <img
          src={heroImage.data.url}
          alt={heroImage.data.title || heroImage.data.filename}
          className="h-full w-full object-cover"
        />
      )}
    </figure>
  );
}

export default async function WaitListValidatePage({
  params,
}: {
  params: Promise<{ token?: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("waitListValidate");

  if (!token) {
    await redirect("/");
    return;
  }

  const result = await waitListService.validate(token);
  if (result.error || !result.data) {
    await redirect("/");
    return;
  }

  const { benefit } = result.data;

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-12 tablet:py-20">
      <h1 className="text-4xl font-semibold tracking-tight text-text tablet:text-5xl">
        {t("page.title")}
      </h1>

      <Suspense
        fallback={
          <div className="flex aspect-4/3 items-center justify-center border border-border bg-fg">
            <Spinner />
          </div>
        }
      >
        <WaitListImage />
      </Suspense>

      <p className="text-base leading-relaxed text-text-muted tablet:text-lg">
        {t("page.description")}
      </p>

      {benefit && (
        <p className="text-sm! text-text italic">
          {t("page.benefit.label")}{" "}
          <span className="font-semibold">
            {t("page.benefit.line", {
              months: getBenefitMonths(benefit.trial_days),
            })}
          </span>
        </p>
      )}

      {/* While they wait: a real artist page shows what the benefit is for. */}
      <p className="flex flex-wrap items-center gap-x-2 text-sm! text-text-muted">
        {t("page.showcase.title")}
        <Link
          href={WAIT_LIST_SHOWCASE_PATH}
          className="inline-flex min-h-11 items-center gap-1.5 font-medium text-text underline underline-offset-4 hover:no-underline"
        >
          {t("page.showcase.cta")}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </p>
    </section>
  );
}
