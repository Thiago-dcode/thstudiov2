import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/constants";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import PageComponent from "@/lib/components/page-component";
import { SetSessionClient } from "@/modules/auth/components/SetSessionClient";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { UserBenefitModal } from "@/modules/user-benefit/components/user-benefit.modal";
import usersService from "@/modules/users/users.service";
import { FunnelProvider } from "./_components/funnel.provider";

export default async function GetStartedLayout() {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }
  const userResponse = await usersService.getOne(userAuth.id);
  if (
    !userResponse.data ||
    userResponse.data.funnel_step <= 0 ||
    userResponse.data.funnel_step > FUNNEL_LAST_STEP
  ) {
    return (
      <SetSessionClient
        redirect="/atelier"
        userAuth={{
          ...userAuth,
          funnel_step: FUNNEL_LAST_STEP + 1,
        }}
      />
    );
  }
  const user = userResponse.data;
  const Step = dynamic(() => import(`./_components/step${user.funnel_step}`), {
    loading: () => <Spinner className="size-12" />,
    ssr: true,
  });
  const stepsContent = {
    1: {
      title: "Complete Your Profile",
      subTitle: "Tell us a bit about yourself to get started",
    },
    2: {
      title: "Select your profile photo",
      subTitle: "This will be your face for potential clients",
    },
    3: {
      title: "Select up to 5 categories",
      subTitle: "These categories will help your profile be discovered",
    },
    4: {
      title: "Add Your Location",
      subTitle: "Help clients discover your profile by location",
    },
    5: {
      title: "Choose Your Plan",
      subTitle: "Select the perfect plan for your creative journey",
    },
  };
  const currentStep =
    stepsContent[user.funnel_step as keyof typeof stepsContent];
  return (
    <>
      {user.funnel_step < FUNNEL_LAST_STEP ? (
        <UserBenefitModal user={user} />
      ) : null}
      <PageComponent.Container
        className={cn(
          "max-w-2xl ",
          { "max-w-lg": user.funnel_step === 1 || user.funnel_step === 2 },
          {
            " max-w-full justify-start": user.funnel_step === FUNNEL_LAST_STEP,
          },
        )}
      >
        <PageComponent.Content
          className={cn("relative", {
            " max-w-full justify-start border-none inset-shadow-none":
              user.funnel_step === FUNNEL_LAST_STEP,
          })}
        >
          <PageComponent.Header>
            <PageComponent.Title title={currentStep.title} />
            <PageComponent.SubTitle subTitle={currentStep.subTitle} />
          </PageComponent.Header>
          <FunnelProvider
            lastStep={FUNNEL_LAST_STEP}
            user={{
              ...userAuth,
              ...user,
            }}
          >
            <Step />
          </FunnelProvider>
        </PageComponent.Content>

        <PageComponent.Footer>
          <p className="text-text-muted">
            Step {user.funnel_step} of {FUNNEL_LAST_STEP}
          </p>
        </PageComponent.Footer>
      </PageComponent.Container>
    </>
  );
}
