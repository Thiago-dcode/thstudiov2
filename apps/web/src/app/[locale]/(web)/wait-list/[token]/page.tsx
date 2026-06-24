import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import     assetService  from "@/modules/assets/asset.service";
import waitListService from "@/modules/wait-list/wait-list.service";
import { Spinner } from "@repo/ui/components/shadcn/spinner";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("waitListValidate");

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

async function WaitListImage() {
  const heroImage = await assetService.getBySlug("madrid-diana-cazadora");

  return (
    <figure
      className="relative aspect-3/4 overflow-hidden border border-border bg-fg-1"
      aria-hidden
    >
      {heroImage.data && (
        <img
          src={heroImage.data.url}
          alt={heroImage.data.title  || heroImage.data.filename}
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
    redirect("/");
  }

  const result = await waitListService.validate(token);
  if (result.error || !result.data) {
    redirect("/");
  }

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-12 tablet:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] tablet:items-center tablet:px-10 tablet:py-20">
      <Suspense
        fallback={
          <Spinner/>
        }
      >
        <WaitListImage />
      </Suspense>

      <article className="py-4 tablet:py-0">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
          {t("page.label")}
        </p>
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
      </article>
    </section>
  );
}
