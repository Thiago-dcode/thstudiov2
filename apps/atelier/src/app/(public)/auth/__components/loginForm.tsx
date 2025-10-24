'use client'

import { loginServerAction } from "@/modules/auth/server-actions/login.action";
import { useRouter } from "next/navigation";
import { Errors } from "@repo/ui/components/custom/errors";
import { Input } from "@repo/ui/components/shadcn/input";
import { useSession } from "@/modules/auth/contexts/session.provider";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { Button } from "@repo/ui/components/shadcn/button";
import { Label } from '@repo/ui/components/shadcn/label'
import { Checkbox } from '@repo/ui/components/shadcn/checkbox'
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { Eye, EyeClosed } from "lucide-react";
import { useState } from "react";
export const LoginForm = ({ rememberMe }: {
    rememberMe: boolean
}) => {
    const router = useRouter();
    const { setSession } = useSession();
    const [hidden, setHidden] = useState(true);
    const { result, handleSubmit, errors, cleanErrors, isPending } = useHandleAction({
        action: loginServerAction,
        afterAction: async (result) => {
            if (result.data) {
                setSession(result.data.token ? result.data : undefined);
                router.push(result.data.token ? '/atelier' : '/auth/2fa')
            }
        }
    })


    return (<div className="w-full flex items-center flex-col gap-4">
        {/* Error Messages */}


        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full h-full flex flex-col gap-4">
            {/* Email Field */}
            <div className="space-y-1">
                <Label
                    htmlFor="email"
                    className="block  "
                >
                    Email Address
                </Label>
                <Input
                    onChange={() => {
                        cleanErrors()
                    }}
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={result?.inputs?.email}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    autoFocus
                />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
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
                        type={hidden?"password":'text'}
                        id="password"
                        name="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                    />
                    <button type="button" onClick={(e)=>{
                        e.preventDefault()
                        setHidden(!hidden);
                    }} className="absolute top-2 right-2 cursor-pointer flex items-center justify-center text-text-muted">
                        {hidden ? <Eye className="size-5" /> : <EyeClosed className="size-5" />}
                    </button>
                </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
                <Checkbox
                    id="remember-me"
                    name="remember_me"
                    defaultChecked={result?.inputs?.rememberMe || rememberMe}
                    className="h-4 w-4 rounded cursor-pointer"
                />
                <Label
                    htmlFor="remember-me"
                    className="ml-2 block cursor-pointer "
                >
                    Remember me for 30 days
                </Label>
            </div>

            {/* Submit Button */}
            <Button
                variant={'default'}
                type="submit"
                className="w-full mt-6 py-6 "
            >
                {!isPending ? ' Sign In' : <Spinner className="size-6" />}
            </Button>
        </form>
        {errors && errors.length > 0 && (
            <Errors title="Login failed" errors={errors} />
        )}
    </div>)
}