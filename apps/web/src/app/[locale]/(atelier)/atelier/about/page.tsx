import { BookUser } from "lucide-react";
import { redirect } from "next/navigation";
import { AboutPageDisplay } from "@/modules/about-page/components/about-page-display";
import { CreateOrUpdateAboutPage } from "@/modules/about-page/components/create-update-about-page";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import usersService from "@/modules/users/users.service";
import {
  AdminPageContainer,
  AdminPageEmptyState,
  AdminPageTitle,
} from "../../__components/admin-page.component";

export default async function AboutPage() {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const aboutPageResponse = await usersService.getAboutPage(userAuth.username);
  const aboutPage = aboutPageResponse.data;
  const publicHref = aboutPage
    ? `/artists/${userAuth.username}/about`
    : undefined;

  return (
    <AdminPageContainer>
      <AdminPageTitle
        title="About Page"
        info="Share your background, artistic journey, and anything else you'd like your audience to know about you."
        publicHref={publicHref}
      >
        <CreateOrUpdateAboutPage
          variant="default"
          userId={userAuth.id}
          currentAboutPage={aboutPage || undefined}
        />
      </AdminPageTitle>
      {aboutPage ? (
        <AboutPageDisplay aboutPage={aboutPage} />
      ) : (
        <AdminPageEmptyState
          icon={<BookUser />}
          description="No about page created yet. Share your background and artistic journey."
        >
          <CreateOrUpdateAboutPage
            userId={userAuth.id}
            currentAboutPage={aboutPage || undefined}
            variant="primary"
          />
        </AdminPageEmptyState>
      )}
    </AdminPageContainer>
  );
}
