import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { LayoutDashboard } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import portfolioService from "@/modules/portfolios/portfolio.service";
import {
  AdminPageContainer,
  AdminPageEmptyState,
  AdminPageTitle,
} from "../../__components/admin-page.component";
import { CreateResourceButton } from "../../__components/create-resource-button";
import { PortfolioSortable } from "./_components/portfolio-sortable";

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
        <PortfolioSortable
          username={userAuth.username}
          items={portfoliosResponse.data.map((portfolio) => ({
            id: portfolio.id,
            slug: portfolio.slug,
            title: portfolio.title,
            is_active: portfolio.is_active,
            created_at: portfolio.created_at,
            updated_at: portfolio.updated_at,
            is_blocked: Boolean(portfolio.blocked_at),
            media: (
              <PortfolioCard.Image
                src={portfolio.thumbnail}
                alt={portfolio.title}
                isBlocked={Boolean(portfolio.blocked_at)}
                blockedLabel={tCommon("blocked")}
              />
            ),
          }))}
        />
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
