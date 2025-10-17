'use client'

import { loginServerAction } from "@/modules/auth/server-actions/login.action";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react"
import { Errors } from "@repo/ui/components/custom/errors";
import { Input } from "@repo/ui/components/shadcn/input";
import { useSession } from "@/modules/auth/contexts/session.provider";

export const LoginForm = ({ rememberMe }: {
    rememberMe: boolean
}) => {
    const [errors, setErrors] = useState<string[]>([]);
    const [email, setEmail] = useState<string | undefined>(undefined)
    const [_rememberMe, setRememberMe] = useState<boolean>(rememberMe)
    const router = useRouter();
    const { setSession } = useSession()

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget)
        const result = await loginServerAction(formData)
        //Handle errors
        if (result.errors !== null) {
            setErrors(result.errors)
            setEmail(result.inputs?.email)
            setRememberMe(result.inputs?.rememberMe ?? false)
            return;
        }
        if (result.data) {
            setSession(result.data.token ? result.data : undefined);
            router.push(result.data.token ? '/atelier' : '/auth/2fa')
        }
    }

    return (<div>
        {/* Error Messages */}
        {errors && errors.length > 0 && (
            <Errors title="Login failed" errors={errors} />
        )}

        {/* Form */}
        <form onSubmit={async (e) => {
            await handleSubmit(e)
        }} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
                <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700"
                >
                    Email Address
                </label>
                <Input
                    onChange={() => {
                        setErrors([])
                    }}
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={email}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    autoFocus
                    className="w-full px-4 py-3"
                />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Password
                    </label>
                    <Link
                        href="/auth/password-recovery"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                        Forgot?
                    </Link>
                </div>
                <Input
                    onChange={() => {
                        setErrors([])
                    }}
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3"
                />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
                <input
                    id="remember-me"
                    name="remember_me"
                    type="checkbox"
                    defaultChecked={_rememberMe}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                />
                <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-slate-700 cursor-pointer"
                >
                    Remember me for 30 days
                </label>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                Sign In
            </button>
        </form>
    </div>)
}