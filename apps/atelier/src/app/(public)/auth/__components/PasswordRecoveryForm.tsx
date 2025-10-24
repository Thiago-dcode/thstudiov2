'use client';

import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { passwordRecoveryAction } from "@/modules/auth/server-actions/password-recovery.action";
import { Errors } from "@repo/ui/components/custom/errors";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { useRouter } from "next/navigation";

export const PasswordRecoveryForm = () => {
    const router = useRouter();
    const { result, isPending, handleSubmit, errors } = useHandleAction({
        action: passwordRecoveryAction,
        afterAction: async (result) => {
            if (result.data) {
                router.push('/auth/password-recovery/success');
            }
        }
    });

    return (
        <div className="w-full flex items-center flex-col gap-4">
            {/* Error Messages */}
            {errors && errors.length > 0 && (
                <Errors title="Password recovery errors" errors={errors} />
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
                {/* Email Field */}
                <div className="w-full flex flex-col gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        type="email"
                        id="email"
                        name="email"
                        defaultValue={result?.inputs?.email}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        autoFocus
                        disabled={isPending}
                        className="w-full px-4 py-6"
                    />
                </div>
                {/* Submit Button */}
                <Button
                    disabled={isPending}
                    type="submit"
                    className="w-full py-6"
                >
                    {isPending ? <Spinner /> : 'Send'}
                </Button>
            </form>
        </div>
    );
};