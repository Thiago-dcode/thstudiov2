import Link from "next/link";
import * as z from "zod";
import authComponent from "@/lib/components/page-component";
import { RegisterForm } from "../__components/register-form";

export default async function RegisterPage({ searchParams }: {
  searchParams: Promise<{
    ref?: string
    email?: string
  }>
}) {

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