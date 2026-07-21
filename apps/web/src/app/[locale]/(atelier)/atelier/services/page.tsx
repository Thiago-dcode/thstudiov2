import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { Briefcase } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { ServiceCard } from "@/modules/user-services/components/service-card";
import userServiceService from "@/modules/user-services/user-service.service";
import {
  AdminPageContainer,
  AdminPageEmptyState,
  AdminPageTitle,
} from "../../__components/admin-page.component";
import { CreateResourceButton } from "../../__components/create-resource-button";

export default async function ServicesPage() {
  const t = await getTranslations("atelier.services");
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const servicesResponse = await userServiceService.getAllByUsername(
    userAuth.username,
  );

  const services = servicesResponse.data || [];

  return (
    <AdminPageContainer>
      <AdminPageTitle title={t("pageTitle")} info={t("pageInfo")}>
        <CreateResourceButton
          resource={TABLES_ENUM.SERVICES}
          href="services/create"
          label={t("createButtonLabel")}
        />
      </AdminPageTitle>
      {services.length > 0 ? (
        <div className="grid grid-cols-2 laptop:grid-cols-3 desktop-lg:grid-cols-5  gap-4">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              username={userAuth.username}
              isAtelier
            />
          ))}
        </div>
      ) : (
        <AdminPageEmptyState
          icon={<Briefcase />}
          description={t("emptyStateDescription")}
        >
          <CreateResourceButton
            resource={TABLES_ENUM.SERVICES}
            href="services/create"
            label={t("createButtonLabel")}
            variant="outline"
          />
        </AdminPageEmptyState>
      )}
    </AdminPageContainer>
  );
}
