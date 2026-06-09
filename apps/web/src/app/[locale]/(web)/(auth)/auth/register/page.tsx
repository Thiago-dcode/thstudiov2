import Link from "next/link";
import * as z from "zod";
import authComponent from "@/lib/components/page-component";
import { RegisterForm } from "../__components/register-form";
import waitListService from "@/modules/wait-list/wait-list.service";
import { WaitListForm } from "@/modules/wait-list/components/wait-list-form";
import invitationLinkService from "@/modules/invitation-links/invitation-link.service";
import { serverEnv } from "@/env/server";

export default async function RegisterPage({ searchParams }: {
  searchParams: Promise<{
    ref?: string
    email?: string
  }>
}) {

  const registrationIsClosed = serverEnv.REGISTRATION_IS_CLOSED === 1;

  const { ref, email } = await searchParams;
  const validatedEmail = z.email().safeParse(email);

  // Resolve the prefill email server-side from the invitation `ref` so we never
  // expose the address in the email link (which pushes mails to spam/promotions).
  let initialEmail = validatedEmail.success ? validatedEmail.data : undefined;
  if (!initialEmail && ref) {
    const invitationEmail = await waitListService.getEmailByInvitationCode(ref);
    if (invitationEmail.data?.email) {
      initialEmail = invitationEmail.data.email;
    }
  }

  if (registrationIsClosed) {
    // If registration is closed, allow bypass only for valid invitation refs.
    let bypassRegistrationClose = false;
    if (ref) {
      const invitationLinkResult = await invitationLinkService.validateCode(ref);
      bypassRegistrationClose = !invitationLinkResult.error && !!invitationLinkResult.data;
    }

    if (!bypassRegistrationClose) {
      const waitListPosition = await waitListService.getCurrentPosition();
      const currentWaitListPosition = waitListPosition.data?.position ?? null;

      return (
        <section
          aria-labelledby="wait-list-heading"
          className="flex min-h-[calc(100svh-4rem)] w-full items-center justify-center bg-bg px-6 py-16 text-center tablet:px-10 tablet:py-24"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8">
            <div className="flex max-w-2xl flex-col items-center gap-3">
              <h1
                id="wait-list-heading"
                className="text-4xl font-semibold tracking-tight text-text tablet:text-5xl"
              >
                Join the wait list
              </h1>
            </div>

            <div className="w-full max-w-4xl pt-4 tablet:pt-6">
              <WaitListForm currentPosition={currentWaitListPosition} />
            </div>
          </div>
        </section>
      );
    }
  }

  return (

    <authComponent.Container>

      <authComponent.Content>

        <authComponent.Header >
          <authComponent.Title title="Create your account" />
          <authComponent.SubTitle subTitle="And start build your dream portfolio" />
        </authComponent.Header>
        <RegisterForm initialEmail={initialEmail}>
          {ref ? <input hidden name="invitation_code" defaultValue={ref} /> : null}
        </RegisterForm>

        <Link
          href="/auth/login"
          className="text-sm  transition-colors text-text-muted hover:text-text "
        >
          Already have an account?
        </Link>
      </authComponent.Content>


      <authComponent.Footer>
        {/* <p> By signing in, you agree to our{' '}
          <div>
          <Link href="/terms" className="text-blue-600 hover:text-blue-500 underline">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
            Privacy Policy
          </Link>
          </div>
        </p> */}
        <></>
      </authComponent.Footer>

    </authComponent.Container>


  );
}
