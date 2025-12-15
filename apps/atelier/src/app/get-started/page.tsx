import { userSession } from "@/modules/auth/server-actions/user-session.action"
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import dynamic from "next/dynamic"
import { redirect } from "next/navigation";
import { FunnelProvider } from "./_components/funnel.provider";
import AuthComponent from "@/components/auth-component";
import usersService from "@/modules/users/users.service";
import { cn } from "@repo/ui/lib/utils";
import Image from "next/image";

const LAST_STEP = 4;
export default async function GetStarted() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }
    const userResponse = await usersService.getOne(userAuth.id);
    if (!userResponse.data || userResponse.data.funnel_step <= 0 || userResponse.data.funnel_step > LAST_STEP) {
        redirect('/atelier')
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
    return <AuthComponent.Container className={cn("max-w-2xl",
        {"max-w-lg":user.funnel_step ===1 || user.funnel_step ===2},
        {" max-w-full":user.funnel_step === LAST_STEP}
    )}>

        <AuthComponent.Content>
            <AuthComponent.Header>
                <AuthComponent.Title title={currentStep.title} />
                <AuthComponent.SubTitle subTitle={currentStep.subTitle} />
            </AuthComponent.Header>
            <FunnelProvider lastStep={LAST_STEP} user={user}>
                <Step />
            </FunnelProvider>
        </AuthComponent.Content>

        <AuthComponent.Footer>
            <p className="text-text-muted">
                Step {user.funnel_step} of {LAST_STEP}
            </p>
        </AuthComponent.Footer>

    </AuthComponent.Container>

}