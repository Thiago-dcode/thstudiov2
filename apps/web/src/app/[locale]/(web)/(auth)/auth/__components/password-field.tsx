"use client";

import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Eye, EyeClosed } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useId, useState } from "react";
import FormComponent from "@/lib/components/form-component";

/** Password input with a show/hide toggle, styled like `FormComponent.LabelInput`. */
export const PasswordField = ({
  label,
  placeholder,
  autoComplete,
  error,
  labelAction,
  onChange,
}: {
  label: string;
  placeholder?: string;
  autoComplete: "current-password" | "new-password";
  error?: string;
  /** Rendered at the right of the label row (e.g. a "Forgot password?" link). */
  labelAction?: ReactNode;
  onChange?: () => void;
}) => {
  const t = useTranslations("auth.passwordField");
  const [hidden, setHidden] = useState(true);
  const errorId = useId();

  return (
    <FormComponent.Field>
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor="password"
          className="block text-xs tracking-wide text-text-muted"
        >
          {label} <span className="span-label text-red-500">*</span>
        </Label>
        {labelAction}
      </div>
      <div className="relative">
        <Input
          onChange={() => {
            onChange?.();
            setHidden(true);
          }}
          type={hidden ? "password" : "text"}
          id="password"
          name="password"
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          required
        />
        <button
          type="button"
          onClick={() => setHidden(!hidden)}
          aria-label={hidden ? t("show") : t("hide")}
          aria-pressed={!hidden}
          className="absolute top-2 right-2 cursor-pointer flex items-center justify-center text-text-muted"
        >
          {hidden ? (
            <Eye className="size-5" />
          ) : (
            <EyeClosed className="size-5" />
          )}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-red-500 mt-1">
          {error}
        </p>
      )}
    </FormComponent.Field>
  );
};
