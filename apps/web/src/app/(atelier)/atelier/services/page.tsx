import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userServiceService from "@/modules/user-services/user-service.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminPageContainer, AdminPageTitle } from "../../__components/admin-page.component";
import { Button } from "@repo/ui/components/shadcn/button";
import { Plus } from "lucide-react";

export default async function ServicesPage() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    const servicesResponse = await userServiceService.getAllByUsername(userAuth.username);

    const services = servicesResponse.data || [];

    return (
        <AdminPageContainer>
            <AdminPageTitle title="Services">
                <Button asChild variant="primary" size="sm">
                    <Link href={'services/create'}>
                        <Plus className="size-4" />
                        Create Service
                    </Link>
                </Button>
            </AdminPageTitle>
            {services.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                    {services.map((service) => (
                        <Link key={service.id} href={`/atelier/services/edit/${service.slug}`}>
                            <article
                                className="group cursor-pointer aspect-square rounded-lg border border-border overflow-hidden relative"
                            >
                                {service.thumbnail ? (
                                    <img
                                        src={service.thumbnail}
                                        alt={service.title}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                ) : null}
                                <div className={`absolute inset-0 ${service.thumbnail ? 'bg-black/50' : 'bg-fg-2'}`} />
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                    <h3 className="text-sm font-semibold text-center text-white drop-shadow-md">
                                        {service.title}
                                    </h3>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No services found
                </div>
            )}
        </AdminPageContainer>
    );
}
