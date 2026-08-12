import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { LayoutDashboard } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import portfolioService from "@/modules/portfolios/portfolio.service";
import {
  AdminPageContainer,
  AdminPageEmptyState,
  AdminPageTitle,
} from "../../__components/admin-page.component";
import { CreateResourceButton } from "../../__components/create-resource-button";

export default async function Atelier() {
  const t = await getTranslations("atelier.portfolios");
  const tCommon = await getTranslations("atelier.common");
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }
  const portfoliosResponse = await portfolioService.findAll({
    user_id: userAuth.id,
  });

  if (portfoliosResponse.error) {
    return <div>{portfoliosResponse?.error?.message || t("loadError")}</div>;
  }

  return (
    <AdminPageContainer>
      <AdminPageTitle title={t("pageTitle")} info={t("pageInfo")}>
        <CreateResourceButton
          resource={TABLES_ENUM.PORTFOLIOS}
          href="portfolios/create"
          label={t("createButtonLabel")}
        />
      </AdminPageTitle>
      {portfoliosResponse.data.length > 0 ? (
        <div className="grid grid-cols-2 laptop:grid-cols-4 desktop-lg:grid-cols-5 gap-4">
          {portfoliosResponse.data.map((portfolio) => (
            <Link
              key={portfolio.id}
              href={`/atelier/portfolios/edit/${portfolio.slug}`}
              className="block w-full min-w-0"
            >
              <PortfolioCard.Item
                portfolio={portfolio}
                isAtelier
                blockedLabel={tCommon("blocked")}
              />
            </Link>
          ))}
        </div>
      ) : (
        <AdminPageEmptyState
          icon={<LayoutDashboard />}
          description={t("emptyStateDescription")}
        >
          <CreateResourceButton
            resource={TABLES_ENUM.PORTFOLIOS}
            href="portfolios/create"
            label={t("createButtonLabel")}
          />
        </AdminPageEmptyState>
      )}
    </AdminPageContainer>
  );
}
