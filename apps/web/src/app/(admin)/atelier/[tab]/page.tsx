import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";
import { User } from "@repo/common-lib/types/user";
import usersService from "@/modules/users/users.service";
import TabProvider from "./_components/tab.provider";

// Tab types
export type TabKey = 'profile' | 'about'

export type TabConfig = {
    key: TabKey
    title: string
    description?: string
}


// Tab definitions
export const TABS: Record<TabKey, TabConfig> = {
    profile: {
        key: 'profile',
        title: 'General info',
        description: 'Manage your profile information'
    },
    about: {
        key: 'about',
        title: 'About',
        description: 'Tell us about yourself'
    }
}
const getTabComponent = async (tab: TabKey) => {
    const TabComponent = (await import(`./_components/${tab}-tab`)).default;
    return <TabComponent />;
}

export type TabProps = { user: User }

export default async function AtelierTabPage({
    params,
}: {
    params: Promise<{ tab: TabKey }>;
}) {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }
    const { tab } = await params;
    if (!TABS[tab]) {
        notFound()
    }
    const userResponse = await usersService.getOne(userAuth.id);
    if (!userResponse.data) {
        notFound()
    }
    const tabsKey = Object.keys(TABS);
    return (

        <TabProvider defaultUser={userResponse.data}>
            <section className="flex flex-col items-start justify-start gap-4 w-full">
                <div className="flex items-center justify-start ">
                    {tabsKey.map((key, i) => {
                        const { title } = TABS[key as TabKey];
                        const isActive = key === tab
                        const isFirst = i === 0;
                        const isLast = i === tabsKey.length - 1
                        return (
                            <Link
                                key={`atelier-tab-${key}`}
                                className={cn("p-2 bg-fg-1 w-30 text-center", {
                                    'border-2 border-text bg-text/80 text-fg font-semibold ': isActive,
                                    'rounded-l-md': isFirst,
                                    'rounded-r-md': isLast
                                })}
                                href={`/atelier/${key}`}
                            >
                                {title}
                            </Link>
                        )
                    })}
                </div>
                <Suspense fallback={<Spinner />}>
                    {getTabComponent(tab)}
                </Suspense>
            </section>
        </TabProvider>
    )
}
