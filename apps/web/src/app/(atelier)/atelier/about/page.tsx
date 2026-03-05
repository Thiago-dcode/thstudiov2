import { AboutPageDisplay } from "@/modules/about-page/components/about-page-display";
import { CreateOrUpdateAboutPage } from "@/modules/about-page/components/create-update-about-page";
import { userSession } from "@/modules/auth/server-actions/user-session.action"
import usersService from "@/modules/users/users.service";
import { redirect } from "next/navigation";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

export default async function AboutPage(){

    const user = await userSession();
    if(!user) redirect('/')

const aboutPageResponse = await usersService.getAboutPage(user.username);

const aboutPage = aboutPageResponse.data

return <section className="size-full max-w-2xl p-10 flex flex-col gap-8">
    <div className="flex items-center justify-between">
    <CreateOrUpdateAboutPage userId={user.id} currentAboutPage={aboutPage || undefined}/>
    {aboutPage && <Link href={`/artists/${user.username}/about`} className="text-sm text-text-muted hover:text-text flex items-center gap-2">View public page <ArrowRightIcon className="size-4"/></Link>}
    </div>
    
    {aboutPage ? (
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium text-text-muted">Your current about page</h3>
            <AboutPageDisplay aboutPage={aboutPage} />
        </div>
    ) : (
        <p className="text-text-muted italic">You haven't created an about page yet.</p>
    )}
</section>
   
}
