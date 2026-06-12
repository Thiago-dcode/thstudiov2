import { notFound, redirect } from "next/navigation";
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
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const { slug } = await params;
  const serviceResponse = await userServiceService.getByUsername(
    userAuth.username,
    slug,
  );

  if (serviceResponse.error) {
    return (
      <div>{serviceResponse?.error?.message || "Something went wrong"}</div>
    );
  }

  if (!serviceResponse.data) {
    notFound();
  }

  const service = serviceResponse.data;
  const publicHref = userAuth.username
    ? `/artists/${userAuth.username}/services/${service.slug}`
    : undefined;
  const portfolios = await userPortfolioService.getAllByUsername(
    userAuth.username,
  );
  return (
    <AdminPageContainer>
      <AdminPageTitle
        title={`Edit: ${service.title}`}
        publicHref={publicHref}
      />
      <CreateOrUpdateService
        defaultService={service}
        userAuth={userAuth}
        portfolios={portfolios.data || []}
      />
    </AdminPageContainer>
  );
}
