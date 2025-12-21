import { getPasswordRecoveryAttemptCookie } from "@/modules/auth/server-actions/password-recovery.action";
import { redirect } from "next/navigation";
import Link from "next/link";
import authService from "@/modules/auth/auth.service";
import { PasswordUpdateForm } from "../../__components/passwordUpdate-form";
import PageComponent from "../../../../../components/page-component";
import { ExpiresIn } from "../../__components/expiresIn";
import { Lock } from "lucide-react";

export default async function PasswordRecoveryRecover({ searchParams }: { searchParams: Promise<{ attempt?: string }> }) {
    const [{ attempt }, passwordRecoveryAttemptCookie] = await Promise.all([searchParams, getPasswordRecoveryAttemptCookie()]);
    let _passwordRecoveryAttemptCookie = passwordRecoveryAttemptCookie;
    let expiresAt: Date | null = null;
    if (!attempt) {
        redirect('/auth/password-recovery');
    }
    //If there is no cookie, it means that the user open the link in another browser.
    if (_passwordRecoveryAttemptCookie) {
        expiresAt = new Date(_passwordRecoveryAttemptCookie.expires_at);
        if (expiresAt < new Date()) {
            redirect('/auth/password-recovery');
        }
    }
    //TODO: validate the attempt
    if (!_passwordRecoveryAttemptCookie || !_passwordRecoveryAttemptCookie.code_validated) {
      
        const result = await authService.validatePasswordRecoveryAttempt({ code: attempt });
        if (result.error || result.data === null) {
            redirect('/auth/password-recovery');
        }
        expiresAt = new Date(result.data.expires_at);
        if (expiresAt < new Date()) {
            redirect('/auth/password-recovery');
        }
        _passwordRecoveryAttemptCookie = result.data

    }
    console.log('RENDERING')

    return (
        <PageComponent.Container>
            <PageComponent.Content>
                <PageComponent.Header>
                <Lock className="size-10"/>
                    <PageComponent.Title title="Set New Password" />
                    <PageComponent.SubTitle subTitle="Choose a strong password for your account" />
                </PageComponent.Header>

                <PasswordUpdateForm passwordAttempt={_passwordRecoveryAttemptCookie} />

                <div className="relative flex justify-center text-sm">
                    <p className="px-2 text-text-muted">
                        Changed your mind?
                    </p>
                    <Link href="/auth/login">Back to Sign In</Link>
                </div>
            </PageComponent.Content>

            <PageComponent.Footer>
                {/* Timer Warning */}
                {expiresAt && <ExpiresIn expiresIn={expiresAt.getTime() - new Date().getTime()} redirect='/auth/password-recovery' />}

            </PageComponent.Footer>
        </PageComponent.Container>
    )
}
