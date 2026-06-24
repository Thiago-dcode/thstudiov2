"use client";

import { normalizePostLoginRedirect } from "@repo/common-lib/constants/post-login-redirects";
import { Errors } from "@repo/ui/components/custom/errors";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Eye, EyeClosed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { loginServerAction } from "@/modules/auth/server-actions/login.action";
import {
  deletePostLoginRedirect,
  type AllowedPostLoginRedirect,
} from "@/modules/auth/server-actions/post-login-redirect.action";

export const LoginForm = ({
  rememberMe: _rememberMe,
  redirectTo,
}: {
  rememberMe: boolean;
  redirectTo: AllowedPostLoginRedirect | null;
}) => {
  const router = useRouter();
  const [hidden, setHidden] = useState(true);
  const { result, handleSubmit, errors, cleanErrors, isPending, success } =
    useHandleAction({
      action: loginServerAction,
      afterAction: async (result) => {
        if (!result.data) {
          return;
        }
        if (!result.data.token) {
          router.push("/auth/2fa");
          return;
        }
        await deletePostLoginRedirect();
        const destination = redirectTo
          ? normalizePostLoginRedirect(redirectTo)
          : null;
        router.push(destination ? `/${destination}` : "/atelier");
      },
    });

  return (
    <FormComponent.Container>
      {/* Error Messages */}

      {/* Form */}
      <FormComponent.Form onSubmit={handleSubmit}>
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

        {/* Password Field */}
        <FormComponent.Field>
          <Label htmlFor="password" className="block ">
            Password
          </Label>
          <div className="relative">
            <Input
              onChange={() => {
                cleanErrors();
                setHidden(true);
              }}
              type={hidden ? "password" : "text"}
              id="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setHidden(!hidden);
              }}
              className="absolute top-2 right-2 cursor-pointer flex items-center justify-center text-text-muted"
            >
              {hidden ? (
                <Eye className="size-5" />
              ) : (
                <EyeClosed className="size-5" />
              )}
            </button>
          </div>
        </FormComponent.Field>

        {/* Remember Me */}
        {/* <div className="flex items-center">
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
 </div> */}

        {/* Submit Button */}
        <FormComponent.SubmitButton success={success} isPending={isPending}>
          Sign In
        </FormComponent.SubmitButton>
      </FormComponent.Form>
      {errors && errors.length > 0 && <Errors errors={errors} />}
    </FormComponent.Container>
  );
};
