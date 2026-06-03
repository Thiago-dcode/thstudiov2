import Link from "next/link";
import * as z from "zod";
import authComponent from "@/lib/components/page-component";
import { RegisterForm } from "../__components/register-form";
import waitListService from "@/modules/wait-list/wait-list.service";
import { WaitListForm } from "@/modules/wait-list/components/wait-list-form";
import { serverEnv } from "@/env/server";

export default async function RegisterPage({ searchParams }: {
  searchParams: Promise<{
    ref?: string
    email?: string
  }>
}) {

  const registrationIsClosed = serverEnv.REGISTRATION_IS_CLOSED === 1;

  if (registrationIsClosed) {
    // Ensure searchParams is awaited so Next.js routing data isn't left unused.
    await searchParams;

    const waitListPosition = await waitListService.getCurrentPosition();
    const currentWaitListPosition = waitListPosition.data?.position ?? null;

    return (
      <authComponent.Container>
        <authComponent.Content>
          <authComponent.Header>
            <authComponent.Title title="Join the wait list" />
            <authComponent.SubTitle subTitle="Registration will be open soon, get early access." />
          </authComponent.Header>

          <WaitListForm currentPosition={currentWaitListPosition} />
        </authComponent.Content>

        <authComponent.Footer>
          <></>
        </authComponent.Footer>
      </authComponent.Container>
    );
  }

  const { ref, email } = await searchParams;
  const validatedEmail = z.email().safeParse(email);

  return (

    <authComponent.Container>

      <authComponent.Content>

        <authComponent.Header >
          <authComponent.Title title="Create your account" />
          <authComponent.SubTitle subTitle="And start build your dream portfolio" />
        </authComponent.Header>
        <RegisterForm initialEmail={validatedEmail.success ? validatedEmail.data : undefined}>
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
