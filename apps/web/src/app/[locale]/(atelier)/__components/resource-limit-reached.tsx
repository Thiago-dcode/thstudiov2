import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type ResourceLimitReachedProps = {
  label: string;
  backHref: string;
  count: number;
  limit: number;
};

export const ResourceLimitReached = async ({
  label,
  backHref,
  count,
  limit,
}: ResourceLimitReachedProps) => {
  const t = await getTranslations("atelier.common");
  return (
    <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-4 max-w-md mx-auto text-center">
      <div className=" bg-error/10 p-4">
        <ShieldAlert className="size-8 text-error" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold text-text">
        {t("planLimitReached")}
      </h2>
      <p className="text-sm">
        {t.rich("planLimitDescription", {
          count,
          limit,
          label,
          strong: (chunks) => <strong className="text-text">{chunks}</strong>,
        })}
      </p>
      <div className="flex gap-3 mt-2">
        <Button asChild variant="outline" size="sm">
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            {t("goBack")}
          </Link>
        </Button>
        <Button asChild variant="accent" size="sm">
          <Link href="/atelier/settings/subscription">{t("upgradePlan")}</Link>
        </Button>
      </div>
    </div>
  );
};
