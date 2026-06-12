import { ArrowRight, Check, Circle, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { ResourceNotFound } from "@/app/[locale]/(artists)/__components/resource-not-found";
import Web from "@/lib/components/web-page.component";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userServiceService from "@/modules/user-services/user-service.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ username: string; slug: string }>;
};

export default async function Page({ params }: Props) {
  const { username, slug } = await params;

  const [userExist, response, userAuth] = await Promise.all([
    usersService.usernameExists(username),
    userServiceService.getByUsername(username, slug),
    userSession(),
  ]);

  if (!userExist.data) {
    notFound();
  }

  const service = response.data;
  console.log("service", service);
  if (!service || service.blocked_at) {
    return (
      <Web.Container>
        <ResourceNotFound
          username={username}
          message="The service you're looking for doesn't exist or may have been removed."
        />
      </Web.Container>
    );
  }

  const canEdit = userAuth?.id === service.user_id;
  const hasDetails = service.features.length > 0 || service.terms.length > 0;

  return (
    <Web.Container className="">
      <ArtistBreadcrumb
        username={username}
        items={[
          {
            url: `/artists/${username}/services`,
            title: "Services",
            isActive: false,
          },
          {
            url: `/artists/${username}/services/${slug}`,
            title: service.title,
            isActive: true,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
        {/* Left Column: Image */}
        <div className="md:col-span-5">
          <div className="sticky top-24 space-y-6">
            {service.thumbnail ? (
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-sm border border-border/30 bg-fg-1">
                <Image
                  src={service.thumbnail}
                  alt={service.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                />
              </div>
            ) : (
              <div className="relative aspect-4/3 w-full flex flex-col items-center justify-center gap-3 rounded-sm border border-border/20 bg-fg-1">
                <span className="font-serif text-7xl italic text-text-muted/10">
                  {service.title.charAt(0)}
                </span>
              </div>
            )}

            {service.show_price && service.price != null && (
              <div className="flex items-baseline justify-between border-t border-border/30 pt-5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  Starting at
                </span>
                <span className="font-serif text-2xl italic tracking-tight">
                  ${service.price.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="md:col-span-7 flex flex-col">
          <header className="pb-8">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-serif italic tracking-tight tablet:text-4xl desktop:text-5xl leading-[1.1]">
                {service.title}
              </h1>
              {canEdit && (
                <Link
                  href={`/atelier/services/edit/${service.slug}`}
                  aria-label="Edit service"
                  className="mt-1 shrink-0 rounded-full border border-border/40 p-2 text-text-muted transition-colors hover:border-border hover:text-text"
                >
                  <Pencil className="size-3.5" />
                </Link>
              )}
            </div>
          </header>

          <div className="h-px bg-border/40" />

          {service.description && (
            <div className="py-8">
              <p className="text-base leading-[1.75] text-text-muted whitespace-pre-line md:text-lg md:leading-[1.8]">
                {service.description}
              </p>
            </div>
          )}

          {hasDetails && (
            <>
              <div className="h-px bg-border/40" />

              <div className="grid grid-cols-1 gap-10 py-8 sm:grid-cols-2 sm:gap-12">
                {service.features.length > 0 && (
                  <section className="space-y-5">
                    <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
                      What&apos;s included
                    </h2>
                    <ul className="space-y-3.5">
                      {service.features.map((feature) => (
                        <li
                          key={feature.id}
                          className="flex items-start gap-3 text-sm leading-relaxed text-text/80"
                        >
                          <Check className="mt-0.5 size-3.5 shrink-0 text-text-muted/60" />
                          <span>{feature.title}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {service.terms.length > 0 && (
                  <section className="space-y-5">
                    <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
                      Terms
                    </h2>
                    <ul className="space-y-3.5">
                      {service.terms.map((term) => (
                        <li
                          key={term.id}
                          className="flex items-start gap-3 text-sm leading-relaxed text-text-muted"
                        >
                          <Circle className="mt-1.5 size-1.5 shrink-0 fill-current opacity-40" />
                          <span>{term.title}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </>
          )}

          {service.portfolio && (
            <div className="mt-auto border-t border-border/40 pt-8 pb-8">
              <div className="space-y-3">
                <span className="block text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  Related portfolio
                </span>
                <Link
                  href={`/artists/${username}/portfolios/${service.portfolio.slug}`}
                  className="group inline-flex items-center gap-4 rounded-full border border-border/30 px-6 py-2.5 transition-all hover:border-border hover:bg-text/5"
                >
                  <span className="font-serif text-lg italic text-text/90 group-hover:text-text">
                    {service.portfolio.title}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-text" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Web.Container>
  );
}
