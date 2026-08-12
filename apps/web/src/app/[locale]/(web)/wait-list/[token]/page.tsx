import { getBenefitMonths } from "@repo/common-lib/utils/wait-list";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { redirect } from "@/i18n/redirect";
import assetService from "@/modules/assets/asset.service";
import waitListService from "@/modules/wait-list/wait-list.service";

export const dynamic = "force-dynamic";

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
      className="relative aspect-3/4 overflow-hidden border border-border bg-fg"
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
    <section className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-12 tablet:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] tablet:items-center tablet:px-10 tablet:py-20">
      <Suspense fallback={<Spinner />}>
        <WaitListImage />
      </Suspense>

      <article className="py-4 tablet:py-0">
        <div className="mt-5 space-y-4">
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-text tablet:text-5xl">
            {t("page.title")}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-text-muted tablet:text-lg">
            {t("page.description")}
          </p>
        </div>
        <p className="mt-8 text-sm font-medium text-accent">
          {t("page.status")}
        </p>

        {benefit && (
          <div className="mt-8 border-t border-border pt-6">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-text-muted">
              {t("page.benefit.label")}
            </p>
            <p className="mt-2 text-lg font-medium text-text">
              {t("page.benefit.line", {
                tier: t(`page.benefit.tiers.${benefit.type}`),
                months: getBenefitMonths(benefit.trial_days),
              })}
            </p>
          </div>
        )}
      </article>
    </section>
  );
}
