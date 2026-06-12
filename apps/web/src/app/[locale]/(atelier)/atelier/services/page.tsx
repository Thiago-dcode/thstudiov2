import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { Briefcase } from "lucide-react";
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
      <AdminPageTitle
        title="Services"
        info="Services are the offerings you provide to your clients, such as 'Wedding Photography' or 'Web Design'."
      >
        <CreateResourceButton
          resource={TABLES_ENUM.SERVICES}
          href="services/create"
          label="Create Service"
        />
      </AdminPageTitle>
      {services.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
          description="No services created yet. Start by adding what you offer to clients."
        >
          <CreateResourceButton
            resource={TABLES_ENUM.SERVICES}
            href="services/create"
            label="Create Service"
            variant="outline"
          />
        </AdminPageEmptyState>
      )}
    </AdminPageContainer>
  );
}
