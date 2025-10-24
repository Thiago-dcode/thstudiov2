import { getPasswordRecoveryAttemptCookie } from "@/modules/auth/server-actions/password-recovery.action";
import Link from "next/link";
import { redirect } from "next/navigation";
import authComponent from "../../__components/authComponent";
import { ExpiresIn } from "../../__components/expiresIn";
import { TryAgainButton } from "../__components/tryAgainButton";
import { getTimeTillNextRecovery } from "../__utils/utils";
import { MailOpen } from "lucide-react";

export default async function PasswordRecoverySuccess() {
    const passwordRecoveryAttemptCookie = await getPasswordRecoveryAttemptCookie();
    if (!passwordRecoveryAttemptCookie) {
        redirect('/auth/password-recovery');
    }
    const expiresAt = new Date(passwordRecoveryAttemptCookie.expires_at);
    if (expiresAt < new Date() || passwordRecoveryAttemptCookie.code_validated) {
        redirect('/auth/password-recovery');
    }

    return (
        <authComponent.Container className="max-w-md">
            <authComponent.Content>

                {/* Header */}
                <authComponent.Header>
                    <MailOpen className="size-10" />
                    <authComponent.Title title="Check your Email" />
                    <authComponent.SubTitle subTitle=" We've sent a password recovery link to your email address" />
                </authComponent.Header>


                <div className="w-full flex flex-col items-center gap-2">
                    <p>Didn't recieve the email?</p>
                    <TryAgainButton nextAttempt={getTimeTillNextRecovery(passwordRecoveryAttemptCookie)} />
                </div>


                {/* Actions */}

                <Link
                    href="/auth/login"
                    className="block text-center  text-text-muted hover:text-text text-sm"
                >
                    Remember password?
                </Link>
            </authComponent.Content>

            <authComponent.Footer>
                <ExpiresIn redirect="/auth/password-recovery" expiresIn={expiresAt.getTime() - new Date().getTime()} />
            </authComponent.Footer>
        </authComponent.Container>
    );
}