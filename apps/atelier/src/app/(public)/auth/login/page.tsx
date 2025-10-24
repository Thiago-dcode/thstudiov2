import { getRememberMe } from "@/modules/auth/server-actions/user-session.action";
import Link from "next/link";
import { LoginForm } from "../__components/loginForm";
import authComponent from "../__components/authComponent";

export default async function Login() {
  const rememberMe = await getRememberMe();
  return (

    <authComponent.Container>

      <authComponent.Content>
        <authComponent.Header >
          <authComponent.Title title="Hello again"/>
        </authComponent.Header>
        <LoginForm rememberMe={rememberMe} />

        <Link
          href="/auth/password-recovery"
          className="text-sm  transition-colors text-text-muted hover:text-text "
        >
          Problem with login?
        </Link>
      </authComponent.Content>


      <authComponent.Footer>
        <p> By signing in, you agree to our{' '}
          <Link href="/terms" className="text-blue-600 hover:text-blue-500 underline">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
            Privacy Policy
          </Link>
        </p>
      </authComponent.Footer>

    </authComponent.Container>


  );
}