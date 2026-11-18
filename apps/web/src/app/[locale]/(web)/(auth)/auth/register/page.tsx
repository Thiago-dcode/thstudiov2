import { getTranslations } from "next-intl/server";
import * as z from "zod";
import { serverEnv } from "@/env/server";
import { redirect } from "@/i18n/redirect";
import { FormPrivacyNotice } from "@/lib/components/form-privacy-notice";
import { buildPrivatePageMetadata } from "@/lib/seo/private-metadata";
import invitationLinkService from "@/modules/invitation-links/invitation-link.service";
import {
  AuthCard,
  AuthDivider,
  AuthFooter,
  AuthSwitchLink,
} from "../__components/auth-card";
import { Oauth2Strategy } from "../__components/oauth2-strategy";
import { RegisterForm } from "../__components/register-form";

export async function generateMetadata() {
  const t = await getTranslations("auth.register.metadata");
  return buildPrivatePageMetadata({
    title: t("title"),
    description: t("description"),
    follow: true,
  });
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    ref?: string;
    email?: string;
  }>;
}) {
  const t = await getTranslations("auth.register");
  const registrationIsClosed = serverEnv.REGISTRATION_IS_CLOSED === 1;

  const { ref, email } = await searchParams;

  const validatedEmail = z.email().safeParse(email);

  let initialEmail = validatedEmail.success ? validatedEmail.data : undefined;
  if (registrationIsClosed) {
    // If registration is closed, allow bypass only for valid invitation refs.
    let bypassRegistrationClose = false;
    if (ref) {
      const invitationLinkResult =
        await invitationLinkService.validateCode(ref);
      bypassRegistrationClose =
        !invitationLinkResult.error && !!invitationLinkResult.data;

      initialEmail = invitationLinkResult.data?.email || initialEmail;
    }

    if (!bypassRegistrationClose) {
      await redirect("/#home-hero-section");
      return;
    }
  }

  return (
    <AuthCard title={t("title")}>
      <Oauth2Strategy invitationLink={ref} />
      <AuthDivider />
      <RegisterForm initialEmail={initialEmail}>
        {ref ? (
          <input hidden name="invitation_code" defaultValue={ref} />
        ) : null}
      </RegisterForm>
      <AuthFooter>
        <AuthSwitchLink
          prompt={t("alreadyHaveAccount")}
          label={t("logIn")}
          href="/auth/login"
        />
        <FormPrivacyNotice context="signUpAgreement" className="max-w-xs" />
      </AuthFooter>
    </AuthCard>
  );
}
