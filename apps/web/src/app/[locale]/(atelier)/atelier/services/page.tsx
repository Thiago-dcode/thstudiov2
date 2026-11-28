import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { Briefcase } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { ServiceCover } from "@/modules/user-services/components/service-card";
import userServiceService from "@/modules/user-services/user-service.service";
import {
  AdminPageContainer,
  AdminPageEmptyState,
  AdminPageTitle,
} from "../../__components/admin-page.component";
import { CreateResourceButton } from "../../__components/create-resource-button";
import { ServiceSortable } from "./_components/service-sortable";

export default async function ServicesPage() {
  const t = await getTranslations("atelier.services");
  const tCommon = await getTranslations("atelier.common");
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
        <ServiceSortable
          username={userAuth.username}
          items={services.map((service) => ({
            id: service.id,
            slug: service.slug,
            title: service.title,
            is_active: service.is_active,
            created_at: service.created_at,
            updated_at: service.updated_at,
            is_blocked: Boolean(service.blocked_at),
            media: (
              <ServiceCover
                service={service}
                isBlocked={Boolean(service.blocked_at)}
                blockedLabel={tCommon("blocked")}
              />
            ),
          }))}
        />
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
