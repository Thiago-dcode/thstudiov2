"use client";

import { Errors } from "@repo/ui/components/custom/errors";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Eye, EyeClosed } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { registerServerAction } from "@/modules/auth/server-actions/register.action";
export const RegisterForm = ({
  children,
  initialEmail,
}: {
  children?: ReactNode;
  initialEmail?: string;
}) => {
  const router = useRouter();
  const [hidden, setHidden] = useState(true);
  const { result, handleSubmit, errors, inputErrors, cleanErrors, isPending } =
    useHandleAction({
      action: registerServerAction,
      afterAction: async (result) => {
        if (result.data) {
          router.push("/auth/2fa");
        }
      },
    });

  return (
    <FormComponent.Container>
      {/* Form */}
      <FormComponent.Form onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <FormComponent.LabelInput
          label="Email Address"
          type="email"
          id="email"
          name="email"
          error={inputErrors?.email}
          defaultValue={result?.inputs?.email ?? initialEmail}
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
          error={inputErrors?.username}
          defaultValue={result?.inputs?.username}
          placeholder="username"
          autoComplete="username"
          required
          onChange={() => cleanErrors()}
        />
        {/* Password Field */}
        <FormComponent.Field>
          <Label htmlFor="password" className="block">
            Password *
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
          {inputErrors?.password && (
            <p id="error-password" className="text-xs text-red-500 mt-1">
              {inputErrors.password}
            </p>
          )}
        </FormComponent.Field>
        {children}
        {/* Submit Button */}
        <FormComponent.SubmitButton isPending={isPending} variant="accent">
          Sign up
        </FormComponent.SubmitButton>
      </FormComponent.Form>
      {errors && errors.length > 0 && <Errors errors={errors} />}
    </FormComponent.Container>
  );
};
