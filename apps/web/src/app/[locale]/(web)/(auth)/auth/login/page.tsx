import Link from "next/link";
import authComponent from "@/lib/components/page-component";
import { getPostLoginRedirect } from "@/modules/auth/server-actions/post-login-redirect.action";
import { getRememberMe } from "@/modules/auth/server-actions/user-session.action";
import { LoginForm } from "../__components/login-form";

export default async function Login() {
  const [rememberMe, redirectTo] = await Promise.all([
    getRememberMe(),
    getPostLoginRedirect(),
  ]);
  return (
    <authComponent.Container>
      <authComponent.Content>
        <authComponent.Header>
          <authComponent.Title title="Hello again" />
          <authComponent.SubTitle subTitle="Sign in to have access to your account" />
        </authComponent.Header>
        <LoginForm rememberMe={rememberMe} redirectTo={redirectTo} />

        <Link
          href="/auth/password-recovery"
          className="text-sm transition-colors text-text-muted hover:text-text "
        >
          Problem with login?
        </Link>
      </authComponent.Content>

      <authComponent.Footer>
        <div>
          {" "}
          By signing in, you agree to our{" "}
          <div>
            <Link
              href="/terms"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </authComponent.Footer>
    </authComponent.Container>
  );
}
