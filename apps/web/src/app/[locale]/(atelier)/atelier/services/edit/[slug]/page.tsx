import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  AdminPageContainer,
  AdminPageTitle,
} from "@/app/[locale]/(atelier)/__components/admin-page.component";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import userServiceService from "@/modules/user-services/user-service.service";
import { CreateOrUpdateService } from "../../_components/create-update-service.component";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ServiceEdit({ params }: Props) {
  const t = await getTranslations("atelier.services");
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const { slug } = await params;
  const [serviceResponse, portfolios] = await Promise.all([
    userServiceService.getByUsername(userAuth.username, slug),
    userPortfolioService.getAllByUsername(userAuth.username),
  ]);

  if (serviceResponse.error) {
    return <div>{serviceResponse?.error?.message || t("loadError")}</div>;
  }

  if (!serviceResponse.data) {
    notFound();
  }

  const service = serviceResponse.data;
  const publicHref = userAuth.username
    ? `/artists/${userAuth.username}/services/${service.slug}`
    : undefined;
  return (
    <AdminPageContainer>
      <AdminPageTitle
        title={t("editTitlePrefix", { title: service.title })}
        publicHref={publicHref}
      />
      <CreateOrUpdateService
        defaultService={service}
        portfolios={portfolios.data || []}
      />
    </AdminPageContainer>
  );
}
