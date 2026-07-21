import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import {
  AdminPageContainer,
  AdminPageTitle,
} from "@/app/[locale]/(atelier)/__components/admin-page.component";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import { CreateOrUpdatePortfolio } from "../../_components/create-update-porfolio";
import { DeletePortfolioDialog } from "../../_components/delete-portfolio-dialog";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PortfolioDetail({ params }: Props) {
  const t = await getTranslations("atelier.portfolios");
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const { slug } = await params;
  const portfolioResponse = await userPortfolioService.getByUsername(
    userAuth.username,
    slug,
  );

  if (portfolioResponse.error) {
    return (
      <div>{portfolioResponse?.error?.message || t("loadError")}</div>
    );
  }

  if (!portfolioResponse.data) {
    notFound();
  }

  const portfolio = portfolioResponse.data;
  const publicHref = userAuth.username
    ? `/artists/${userAuth.username}/portfolios/${portfolio.slug}`
    : undefined;

  return (
    <AdminPageContainer>
      <AdminPageTitle
        title={t("editTitlePrefix", { title: portfolio.title })}
        publicHref={publicHref}
      >
        <DeletePortfolioDialog
          portfolioId={portfolio.id}
          portfolioTitle={portfolio.title}
        />
      </AdminPageTitle>
      <CreateOrUpdatePortfolio defaultPortfolio={portfolio} />
    </AdminPageContainer>
  );
}
