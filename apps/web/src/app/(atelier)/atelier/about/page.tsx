import { AboutPageDisplay } from "@/modules/about-page/components/about-page-display";
import { CreateOrUpdateAboutPage } from "@/modules/about-page/components/create-update-about-page";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import usersService from "@/modules/users/users.service";
import { redirect } from "next/navigation";
import { AdminPageContainer, AdminPageTitle } from "../../__components/admin-page.component";

export default async function AboutPage() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    const aboutPageResponse = await usersService.getAboutPage(userAuth.username);
    const aboutPage = aboutPageResponse.data;
    const publicHref = aboutPage ? `/artists/${userAuth.username}/about` : undefined;

    return (
        <AdminPageContainer>
            <AdminPageTitle title="About Page"  info="Share your background, artistic journey, and anything else you'd like your audience to know about you." publicHref={publicHref}>
                <CreateOrUpdateAboutPage userId={userAuth.id} currentAboutPage={aboutPage || undefined} />
            </AdminPageTitle>
            {aboutPage ? (
                <AboutPageDisplay aboutPage={aboutPage} />
            ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No about page yet
                </div>
            )}
        </AdminPageContainer>
    );
}
