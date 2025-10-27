import { getPasswordUpdatedCookie } from "@/modules/auth/server-actions/password-update.action";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthComponent from "../../../__components/authComponent";
import { Button } from "@repo/ui/components/shadcn/button";
import { CheckCircle2 } from "lucide-react";

export default async function PasswordUpdateSuccess() {

    const passwordUpdatedCookie = await getPasswordUpdatedCookie();
    console.log(passwordUpdatedCookie)
    if (!passwordUpdatedCookie) {
        redirect('/auth/password-recovery');
    }

    return (
        <AuthComponent.Container>
            <AuthComponent.Content>
                {/* Success Icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="size-8 text-green-600" />
                    </div>
                </div>

                <AuthComponent.Header>
                    <AuthComponent.Title title="Password Updated Successfully" />
                    <AuthComponent.SubTitle subTitle="Your password has been changed. You can now sign in with your new password." />
                </AuthComponent.Header>

                {/* Action Button */}
                <div className="w-full">
                    <Button
                        asChild
                        variant="default"
                        className="w-full py-6"
                    >
                        <Link href="/auth/login">
                            Continue to Sign In
                        </Link>
                    </Button>
                </div>
            </AuthComponent.Content>

            <AuthComponent.Footer>
                <p>
                    Need help?{' '}
                    <Link href="/support" className="text-blue-500 hover:text-blue-600 underline">
                        Contact Support
                    </Link>
                </p>
            </AuthComponent.Footer>
        </AuthComponent.Container>
    )
}