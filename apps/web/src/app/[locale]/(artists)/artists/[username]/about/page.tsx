import { Mail, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { ArtistContactDialog } from "@/app/[locale]/(artists)/__components/artist-contact.dialog";
import Web from "@/lib/components/web-page.component";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userAboutPageService from "@/modules/user-about-page/user-about-page.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function AboutPage({ params }: Props) {
  const { username } = await params;

  const [user, { data: aboutPage }, userAuth] = await Promise.all([
    usersService.usernameExists(username),
    userAboutPageService.getByUsername(username),
    userSession(),
  ]);

  if (!user.data) {
    notFound();
  }
  const canEdit = userAuth?.username === username;

  if (!aboutPage) {
    return (
      <Web.Container>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm italic text-text-muted tracking-wide">
            This artist hasn't shared their story yet.
          </p>
        </div>
      </Web.Container>
    );
  }

  return (
    <Web.Container className="">
      <ArtistBreadcrumb
        username={username}
        items={[
          { url: `/artists/${username}/about`, title: "About", isActive: true },
        ]}
      />
      {/* <Web.Header title={'About'} /> */}
      <div className="w-full items-start justify-center flex">
        <div className="">
          <div className="flex w-full flex-col lg:flex-row gap-12 lg:gap-20">
            {aboutPage.photo && (
              <div className="shrink-0 lg:sticky lg:top-24 lg:self-start">
                <div className="relative aspect-3/4 w-full max-w-sm lg:w-80 xl:w-96 overflow-hidden">
                  <Image
                    src={aboutPage.photo}
                    alt={`About ${username} ${aboutPage.title || ""}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 384px"
                    priority
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col justify-center gap-10 flex-1 min-w-0">
              <div className="space-y-2">
                {aboutPage.title && (
                  <div className="flex items-baseline gap-4">
                    <h1 className="text-4xl font-serif italic tracking-tight md:text-5xl lg:text-6xl">
                      {aboutPage.title}
                    </h1>
                    {canEdit && (
                      <Link
                        href="/atelier/about"
                        aria-label="Edit about page"
                        className="text-text-muted hover:text-text transition-colors"
                      >
                        <Pencil className="size-4 md:size-5" />
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {aboutPage.description && (
                <p className="text-base leading-[1.8] text-text-muted whitespace-pre-line md:text-lg max-w-xl">
                  {aboutPage.description}
                </p>
              )}

              <div className="pt-4 border-t border-border/40">
                <ArtistContactDialog>
                  <button
                    type="button"
                    className="inline-flex items-center gap-3 text-sm tracking-wider uppercase hover:text-text text-text-muted transition-colors duration-300 group"
                  >
                    <Mail className="size-4 transition-transform duration-300 group-hover:-translate-y-px" />
                    <span>Get in touch</span>
                  </button>
                </ArtistContactDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Web.Container>
  );
}
