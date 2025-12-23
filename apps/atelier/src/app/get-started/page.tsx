import { userSession } from "@/modules/auth/server-actions/user-session.action"
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import dynamic from "next/dynamic"
import { redirect } from "next/navigation";
import { FunnelProvider } from "./_components/funnel.provider";
import PageComponent from "@/lib/components/page-component";
import usersService from "@/modules/users/users.service";
import { cn } from "@repo/ui/lib/utils";
import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/constants";
import { SetSessionClient } from "@/modules/auth/components/SetSessionClient";

export default async function GetStartedLayout() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }
    const userResponse = await usersService.getOne(userAuth.id);
    if (!userResponse.data || userResponse.data.funnel_step <= 0 || userResponse.data.funnel_step > FUNNEL_LAST_STEP) {
        return <SetSessionClient redirect="/atelier" userAuth={{
            ...userAuth,
            funnel_step: FUNNEL_LAST_STEP + 1
        }} />
    }
    const user = userResponse.data;
    const Step = dynamic(() => import('./_components/step' + user.funnel_step), {
        loading: () => <Spinner className="size-12" />,

    });
    const stepsContent = {
        [1]: {
            title: 'Complete Your Profile',
            subTitle: 'Tell us a bit about yourself to get started'
        },
        [2]: {
            title: 'Select your profile photo',
            subTitle: 'This will be your face for potential clients'
        },
        [3]: {
            title: 'Select up to 5 categories',
            subTitle: 'These categories will help your profile be discovered'
        },
        [4]: {
            title: 'Choose Your Plan',
            subTitle: 'Select the perfect plan for your creative journey'
        },

    }
    const currentStep = stepsContent[user.funnel_step as keyof typeof stepsContent];
    return <PageComponent.Container className={cn("max-w-2xl",
        { "max-w-lg": user.funnel_step === 1 || user.funnel_step === 2 },
        { " max-w-full": user.funnel_step === FUNNEL_LAST_STEP }
    )}>

        <PageComponent.Content>
            <PageComponent.Header>
                <PageComponent.Title title={currentStep.title} />
                <PageComponent.SubTitle subTitle={currentStep.subTitle} />
            </PageComponent.Header>
            <FunnelProvider lastStep={FUNNEL_LAST_STEP} user={{
                ...userAuth,
                ...user
            }}>
                <Step />
            </FunnelProvider>
        </PageComponent.Content>

        <PageComponent.Footer>
            <p className="text-text-muted">
                Step {user.funnel_step} of {FUNNEL_LAST_STEP}
            </p>
        </PageComponent.Footer>

    </PageComponent.Container>

}