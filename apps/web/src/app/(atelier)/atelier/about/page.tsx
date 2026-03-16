import { AboutPageDisplay } from "@/modules/about-page/components/about-page-display";
import { CreateOrUpdateAboutPage } from "@/modules/about-page/components/create-update-about-page";
import { userSession } from "@/modules/auth/server-actions/user-session.action"
import usersService from "@/modules/users/users.service";
import { redirect } from "next/navigation";
import { AdminPageContainer, AdminPageTitle } from "../../__components/admin-page.component";

export default async function AboutPage(){

    const user = await userSession();
    if(!user) redirect('/')

const aboutPageResponse = await usersService.getAboutPage(user.username);

const aboutPage = aboutPageResponse.data

const publicHref = aboutPage ? `/artists/${user.username}/about` : undefined;

return (
    <AdminPageContainer>
        <AdminPageTitle title="About Page" publicHref={publicHref}>
            <CreateOrUpdateAboutPage userId={user.id} currentAboutPage={aboutPage || undefined}/>
        </AdminPageTitle>
        <div className="max-w-2xl flex flex-col gap-6">
            {aboutPage ? (
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-medium text-text-muted">Your current about page</h3>
                    <AboutPageDisplay aboutPage={aboutPage} />
                </div>
            ) : (
                <p className="text-text-muted italic">You haven't created an about page yet.</p>
            )}
        </div>
    </AdminPageContainer>
);
}
