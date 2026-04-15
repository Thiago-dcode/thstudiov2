import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userServiceService from "@/modules/user-services/user-service.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminPageContainer, AdminPageTitle, AdminPageEmptyState } from "../../__components/admin-page.component";
import { Button } from "@repo/ui/components/shadcn/button";
import { Plus, Briefcase } from "lucide-react";
import { ServiceCard } from "@/modules/user-services/components/service-card";

export default async function ServicesPage() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    const servicesResponse = await userServiceService.getAllByUsername(userAuth.username);

    console.log(servicesResponse.data)
    const services = servicesResponse.data || [];

    return (
        <AdminPageContainer>
            <AdminPageTitle title="Services" info="Services are the offerings you provide to your clients, such as 'Wedding Photography' or 'Web Design'.">
                <Button asChild variant="primary" size="sm">
                    <Link href={'services/create'}>
                        <Plus className="size-4" />
                        Create Service
                    </Link>
                </Button>
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
                    <Button asChild variant="outline" size="sm">
                        <Link href={'services/create'}>
                            <Plus className="size-4 mr-2" />
                            Create Service
                        </Link>
                    </Button>
                </AdminPageEmptyState>
            )}
        </AdminPageContainer>
    );
}
