'use client'

import { useRouter } from "next/navigation";
import { Errors } from "@repo/ui/components/custom/errors";
import { Input } from "@repo/ui/components/shadcn/input";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { Label } from '@repo/ui/components/shadcn/label'
import { Eye, EyeClosed } from "lucide-react";
import { useState } from "react";
import { registerServerAction } from "@/modules/auth/server-actions/register.action";
import FormComponent from "@/components/form-component";
export const RegisterForm = () => {
    const router = useRouter();
    const [hidden, setHidden] = useState(true);
    const { result, handleSubmit, errors, cleanErrors, isPending } = useHandleAction({
        action: registerServerAction,
        afterAction: async (result) => {
            if (result.data) {

                router.push('/auth/2fa')

            }
        }
    })

    return (<FormComponent.Container>

        {/* Form */}
        <FormComponent.Form onSubmit={handleSubmit} >
            {/* Email Field */}
            <FormComponent.LabelInput
                label="Email Address"
                type="email"
                id="email"
                name="email"
                defaultValue={result?.inputs?.email}
                placeholder="you@example.com"
                autoComplete="email"
                required
                autoFocus
                onChange={() => cleanErrors()}
            />

            {/* Username Field */}
            <FormComponent.LabelInput
                label="Username"
                type="text"
                id="username"
                name="username"
                defaultValue={result?.inputs?.username}
                placeholder="username"
                autoComplete="username"
                required
                onChange={() => cleanErrors()}
            />
            {/* Password Field */}
            <FormComponent.Field>
                <Label
                    htmlFor="password"
                    className="block   "
                >
                    Password
                </Label>
                <div className="relative">
                    <Input
                        onChange={() => {
                            cleanErrors()
                            setHidden(true)
                        }}
                        type={hidden ? "password" : 'text'}
                        id="password"
                        name="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                    />
                    <button type="button" onClick={(e) => {
                        e.preventDefault()
                        setHidden(!hidden);
                    }} className="absolute top-2 right-2 cursor-pointer flex items-center justify-center text-text-muted">
                        {hidden ? <Eye className="size-5" /> : <EyeClosed className="size-5" />}
                    </button>
                </div>
            </FormComponent.Field>

            {/* Submit Button */}
            <FormComponent.SubmitButton isPending={isPending}>
                Sign up
            </FormComponent.SubmitButton>
        </FormComponent.Form>
        {errors && errors.length > 0 && (
            <Errors title="Login failed" errors={errors} />
        )}
    </FormComponent.Container>)
}