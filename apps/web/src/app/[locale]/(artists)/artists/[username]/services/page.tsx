import { notFound } from "next/navigation";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import Web from "@/lib/components/web-page.component";
import { ServiceCard } from "@/modules/user-services/components/service-card";
import userServiceService from "@/modules/user-services/user-service.service";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function Page({ params }: Props) {
  const { username } = await params;

  const response = await userServiceService.getAllByUsername(username, {
    is_active: true,
    blocked: false,
  });

  if (!response.data) {
    notFound();
  }

  const services = response.data.filter((s) => s.is_active);

  return (
    <Web.Container>
      <ArtistBreadcrumb
        username={username}
        items={[
          {
            url: `/artists/${username}/services`,
            title: "Services",
            isActive: true,
          },
        ]}
      />

      <Web.Header title="Services" />

      {services.length > 0 ? (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 tablet:gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              username={username}
            />
          ))}
        </section>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center border border-dashed border-border/60 text-sm italic text-text-muted">
          No services yet.
        </div>
      )}
    </Web.Container>
  );
}
