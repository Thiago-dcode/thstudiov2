import Link from "next/link";
import { redirect } from "next/navigation";
import PageComponent from "@/lib/components/page-component";
import { getPasswordRecoveryAttemptCookie } from "@/modules/auth/server-actions/password-recovery.action";
import { PasswordRecoveryForm } from "../__components/PasswordRecovery-form";
import { getTimeTillNextRecovery } from "./__utils/utils";

const authComponent = PageComponent;
export default async function PasswordRecovery() {
  const timeTillNextRecovery = getTimeTillNextRecovery(
    await getPasswordRecoveryAttemptCookie(),
  );
  if (timeTillNextRecovery > 0) {
    redirect("/auth/password-recovery/success");
  }
  return (
    <authComponent.Container>
      <authComponent.Content>
        <authComponent.Header>
          {" "}
          {/* Header */}
          <PageComponent.Title title="Password Recovery" />
          <PageComponent.SubTitle subTitle="Enter your email and we'll send you a recovery link" />
        </authComponent.Header>
        <PasswordRecoveryForm />

        {/* Divider */}

        <Link
          className="text-sm transition-colors text-text-muted hover:text-text "
          href={"/auth/login"}
        >
          Remember your password?
        </Link>
      </authComponent.Content>
      <authComponent.Footer>
        <p>
          Need help?{" "}
          <Link
            href="/support"
            className="text-blue-500 hover:text-blue-600 underline"
          >
            Contact Support
          </Link>
        </p>
      </authComponent.Footer>
    </authComponent.Container>
  );
}
