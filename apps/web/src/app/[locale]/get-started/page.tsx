import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/limits";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import PageComponent from "@/lib/components/page-component";
import { buildPrivatePageMetadata } from "@/lib/seo/private-metadata";
import { SetSessionClient } from "@/modules/auth/components/SetSessionClient";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { UserBenefitModal } from "@/modules/user-benefit/components/user-benefit.modal";
import usersService from "@/modules/users/users.service";
import { FunnelProvider } from "./_components/funnel.provider";

export async function generateMetadata() {
  const t = await getTranslations("getStarted.metadata");
  return buildPrivatePageMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function GetStartedLayout() {
  const t = await getTranslations("getStarted");
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
      title: t("steps.profile.title"),
      subTitle: t("steps.profile.subtitle"),
    },
    2: {
      title: t("steps.photo.title"),
      subTitle: t("steps.photo.subtitle"),
    },
    3: {
      title: t("steps.categories.title"),
      subTitle: t("steps.categories.subtitle"),
    },
    4: {
      title: t("steps.location.title"),
      subTitle: t("steps.location.subtitle"),
    },
    5: {
      title: t("steps.plan.title"),
      subTitle: t("steps.plan.subtitle"),
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
            {t("stepOf", {
              current: user.funnel_step,
              total: FUNNEL_LAST_STEP,
            })}
          </p>
        </PageComponent.Footer>
      </PageComponent.Container>
    </>
  );
}
