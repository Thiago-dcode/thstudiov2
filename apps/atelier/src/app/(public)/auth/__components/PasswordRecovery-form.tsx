'use client';

import FormComponent from "@/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { passwordRecoveryAction } from "@/modules/auth/server-actions/password-recovery.action";
import { Errors } from "@repo/ui/components/custom/errors";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { useRouter } from "next/navigation";

export const PasswordRecoveryForm = () => {
    const router = useRouter();
    const { result, isPending, handleSubmit, errors, success } = useHandleAction({
        action: passwordRecoveryAction,
        afterAction: async (result) => {
            if (result.data) {
                router.push('/auth/password-recovery/success');
            }
        }
    });

    return (
        <FormComponent.Container>
            {/* Error Messages */}
            {errors && errors.length > 0 && (
                <Errors title="Password recovery errors" errors={errors} />
            )}

            {/* Form */}
            <FormComponent.Form onSubmit={handleSubmit} >
                {/* Email Field */}
                <FormComponent.Field>
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
                </FormComponent.Field>
                {/* Submit Button */}

                {/* Submit Button */}
                <FormComponent.SubmitButton success={success} isPending={isPending}>
                    Send
                </FormComponent.SubmitButton>
            </FormComponent.Form>
        </FormComponent.Container>
    );
};