import { BookUser } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
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
  const t = await getTranslations("atelier.about");
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
        title={t("pageTitle")}
        info={t("pageInfo")}
        publicHref={publicHref}
      >
        <Suspense fallback={null}>
          <CreateOrUpdateAboutPage
            variant="default"
            currentAboutPage={aboutPage || undefined}
            openFromQuery
          />
        </Suspense>
      </AdminPageTitle>
      {aboutPage ? (
        <AboutPageDisplay aboutPage={aboutPage} />
      ) : (
        <AdminPageEmptyState
          icon={<BookUser />}
          description={t("emptyStateDescription")}
        >
          <CreateOrUpdateAboutPage
            currentAboutPage={aboutPage || undefined}
            variant="primary"
          />
        </AdminPageEmptyState>
      )}
    </AdminPageContainer>
  );
}
