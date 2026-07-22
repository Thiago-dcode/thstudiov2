import * as z from "zod";
import { serverEnv } from "@/env/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/redirect";
import authComponent from "@/lib/components/page-component";
import invitationLinkService from "@/modules/invitation-links/invitation-link.service";
import { RegisterForm } from "../__components/register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    ref?: string;
    email?: string;
  }>;
}) {
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
    <authComponent.Container>
      <authComponent.Content>
        <authComponent.Header>
          <authComponent.Title title="Create your account" />
          <authComponent.SubTitle subTitle="And start build your dream portfolio" />
        </authComponent.Header>
        <RegisterForm initialEmail={initialEmail}>
          {ref ? (
            <input hidden name="invitation_code" defaultValue={ref} />
          ) : null}
        </RegisterForm>

        <Link
          href="/auth/login"
          className="text-sm transition-colors text-text-muted hover:text-text "
        >
          Already have an account?
        </Link>
      </authComponent.Content>
    </authComponent.Container>
  );
}
