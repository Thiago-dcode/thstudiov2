"use client";

import { Errors } from "@repo/ui/components/custom/errors";
import { useRouter } from "next/navigation";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { passwordRecoveryAction } from "@/modules/auth/server-actions/password-recovery.action";

export const PasswordRecoveryForm = () => {
  const router = useRouter();
  const { isPending, handleSubmit, errors, success, cleanErrors } =
    useHandleAction({
      action: passwordRecoveryAction,
      afterAction: async (result) => {
        if (result.data) {
          router.push("/auth/password-recovery/success");
        }
      },
    });

  return (
    <FormComponent.Container>
      {/* Error Messages */}
      {errors && errors.length > 0 && <Errors errors={errors} />}

      {/* Form */}
      <FormComponent.Form onSubmit={handleSubmit}>
        {/* Email Field */}
        <FormComponent.LabelInput
          label="Email address"
          htmlFor="email"
          name="email"
          placeholder="your@email.com"
          required
          autoComplete="email"
          autoFocus
          onChange={() => cleanErrors()}
        />
        {/* Submit Button */}

        {/* Submit Button */}
        <FormComponent.SubmitButton success={success} isPending={isPending}>
          Send
        </FormComponent.SubmitButton>
      </FormComponent.Form>
    </FormComponent.Container>
  );
};
