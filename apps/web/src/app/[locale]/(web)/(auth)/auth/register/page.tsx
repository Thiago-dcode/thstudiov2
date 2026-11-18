import { getTranslations } from "next-intl/server";
import * as z from "zod";
import { serverEnv } from "@/env/server";
import { redirect } from "@/i18n/redirect";
import { FormPrivacyNotice } from "@/lib/components/form-privacy-notice";
import { buildPrivatePageMetadata } from "@/lib/seo/private-metadata";
import {
  AUTH_URL_ERROR_PARAM,
  AUTH_URL_ERRORS,
  type AuthUrlError,
  isAuthUrlError,
} from "@/modules/auth/auth-url-errors";
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
    error?: string;
  }>;
}) {
  const t = await getTranslations("auth.register");
  const registrationIsClosed = serverEnv.REGISTRATION_IS_CLOSED === 1;

  const { ref, email, error } = await searchParams;

  const validatedEmail = z.email().safeParse(email);

  const invitation = ref
    ? await invitationLinkService.validateCode(ref)
    : undefined;
  const validInvitation =
    invitation && !invitation.error ? invitation.data : null;

  // If registration is closed, allow bypass only for valid invitation refs. The home page shows
  // why as a toast: the error this page was sent with, or closed registration by default.
  if (registrationIsClosed && !validInvitation) {
    const reason: AuthUrlError = isAuthUrlError(error)
      ? error
      : AUTH_URL_ERRORS.REGISTRATION_CLOSED;
    await redirect(`/?${AUTH_URL_ERROR_PARAM}=${reason}#home-hero-section`);
    return;
  }

  const invitationEmail = validInvitation?.email || undefined;
  const initialEmail =
    invitationEmail ||
    (validatedEmail.success ? validatedEmail.data : undefined);

  return (
    <AuthCard title={t("title")}>
      <Oauth2Strategy invitationLink={ref} invitationEmail={invitationEmail} />
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
