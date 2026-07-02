import Link from "next/link";
import * as z from "zod";
import { serverEnv } from "@/env/server";
import authComponent from "@/lib/components/page-component";
import invitationLinkService from "@/modules/invitation-links/invitation-link.service";
import { WaitListForm } from "@/modules/wait-list/components/wait-list-form";
import waitListService from "@/modules/wait-list/wait-list.service";
import { RegisterForm } from "../__components/register-form";
import { redirect } from "next/navigation";

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

  // Resolve the prefill email server-side from the invitation `ref` so we never


  if (registrationIsClosed) {
    // If registration is closed, allow bypass only for valid invitation refs.
    let bypassRegistrationClose = false;
    if (ref) {
      const invitationLinkResult =
        await invitationLinkService.validateCode(ref);
      bypassRegistrationClose =
        !invitationLinkResult.error && !!invitationLinkResult.data;
    }

    if (!bypassRegistrationClose) {
      redirect('/#home-hero-section')
    }
  }


  const validatedEmail = z.email().safeParse(email);

  // expose the address in the email link (which pushes mails to spam/promotions).
  let initialEmail = validatedEmail.success ? validatedEmail.data : undefined;
  if (!initialEmail && ref) {
    const invitationEmail = await waitListService.getEmailByInvitationCode(ref);
    if (invitationEmail.data?.email) {
      initialEmail = invitationEmail.data.email;
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
