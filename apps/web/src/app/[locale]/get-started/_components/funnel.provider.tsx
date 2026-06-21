"use client";
import type { UpdateUserInputWithAssets } from "@repo/common-lib/types/user";
import { Errors } from "@repo/ui/components/custom/errors";
import { Button } from "@repo/ui/components/shadcn/button";
import { cn } from "@repo/ui/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  type FormEvent,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import FormComponent from "@/lib/components/form-component";
import type { UserAuth } from "@/modules/auth/auth.types";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { setUserSession } from "@/modules/auth/server-actions/user-session.action";
import { updateUserAction } from "@/modules/users/server-actions/update-user.action";

type InputsType = HTMLInputElement | HTMLTextAreaElement | null | undefined;
type FunnelActions = "continue" | "finish" | "back";

type FunnelContextType = {
  user?: UserAuth;
  lastStep: number;
  isPending: boolean;
  actionElementRef: MutableRefObject<HTMLInputElement | null>;
  inputs?: UpdateUserInputWithAssets;
  errors?: string[];
  refInputs?: (HTMLInputElement | HTMLTextAreaElement)[];
  canContinue: boolean;
  setCanContinue: (value: boolean) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  cleanErrors: () => void;
  handleOnChange: () => void;
  setErrors: (errors: string[]) => void;
  setInputs: (...inputs: InputsType[]) => void;
};
const FunnelContext = createContext<FunnelContextType>({
  lastStep: 0,
  canContinue: false,
  isPending: false,
  actionElementRef: { current: null },
  setCanContinue: () => {},
  handleSubmit: async () => {},
  setErrors: () => {},
  cleanErrors: () => {},
  setInputs: () => {},
  handleOnChange: () => {},
});

export const useFunnel = () => useContext(FunnelContext);

export const FunnelProvider = ({
  children,
  user,
  lastStep,
  defaultCanContinue = false,
}: {
  children: ReactElement;
  user: UserAuth;
  lastStep: number;
  defaultCanContinue?: boolean;
}) => {
  const router = useRouter();
  const actionElementRef = useRef<HTMLInputElement | null>(null);
  const [inputs, _setInputs] =
    useState<(HTMLInputElement | HTMLTextAreaElement)[]>();
  const [canContinue, setCanContinue] = useState(defaultCanContinue);
  const { result, handleSubmit, errors, cleanErrors, setErrors, isPending } =
    useHandleAction({
      action: async (formData) => {
        const validActions: FunnelActions[] = ["continue", "finish", "back"];
        const action = formData.get("action") as FunnelActions;
        if (!validActions.some((va) => va === action))
          return {
            data: null,
            errors: ["something went wrong"],
            inputs: undefined,
          };
        const currentStep = user.funnel_step;
        const newFormData = action === "continue" ? formData : new FormData();

        const nextStep =
          action === "finish"
            ? lastStep + 1
            : action === "back"
              ? currentStep - 1
              : currentStep + 1;
        newFormData.set("funnel_step", String(nextStep));
        return await updateUserAction(user.id, newFormData);
      },
      afterAction: async (result) => {
        if (result?.data) {
          await setUserSession({
            ...result.data,
            token: user.token,
          });
          if (result.data.funnel_step <= lastStep) router.refresh();
          else router.push("/atelier");
        }
      },
    });
  const setInputs = useCallback((...nextInputs: InputsType[]) => {
    const filtered = nextInputs.filter(
      (input): input is HTMLInputElement | HTMLTextAreaElement => !!input,
    );
    _setInputs((prev) => {
      if (
        prev?.length === filtered.length &&
        prev.every((el, i) => el === filtered[i])
      ) {
        return prev;
      }
      return filtered;
    });
  }, []);

  const handleOnChange = useCallback(() => {
    cleanErrors();
    if (!inputs?.length) return;
    const nextCanContinue = inputs.every((input) => {
      input?.parentElement?.classList.remove("input-required");
      return !input?.required || (input?.required && !!input?.value);
    });
    setCanContinue((prev) => (prev === nextCanContinue ? prev : nextCanContinue));
  }, [inputs, cleanErrors]);

  useEffect(() => {
    if (!inputs?.length) return;
    handleOnChange();
  }, [inputs, handleOnChange]);

  //TODO:handle funnel logic

  return (
    <FunnelContext.Provider
      value={{
        user,
        lastStep,
        isPending,
        actionElementRef,
        inputs: result?.inputs,
        canContinue,
        errors: errors || undefined,
        refInputs: inputs,
        handleSubmit,
        setCanContinue,
        cleanErrors,
        setInputs,
        setErrors,
        handleOnChange,
      }}
    >
      {children}
    </FunnelContext.Provider>
  );
};
export const ContainerFormFunnel = ({
  children,
  onSubmitCallback,
  className,
}: {
  children: ReactNode;
  onSubmitCallback?: (e: FormEvent) => Promise<void>;
  className?: string;
}) => {
  const actionRef = useRef<HTMLInputElement>(null);
  const { canContinue, isPending, handleSubmit, errors, actionElementRef } =
    useFunnel();
  return (
    <FormComponent.Container className={className}>
      <FormComponent.Form
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            isPending ||
            (!canContinue && actionRef.current?.value === "continue")
          )
            return;

          handleSubmit(e);
          if (onSubmitCallback) await onSubmitCallback(e);
        }}
      >
        <input
          ref={(node) => {
            actionRef.current = node;
            actionElementRef.current = node;
          }}
          type="text"
          name="action"
          hidden
          required
        />
        {children}
      </FormComponent.Form>
      {/* Error Messages */}
      {errors && errors.length > 0 && <Errors errors={errors} />}
    </FormComponent.Container>
  );
};
export const ButtonSubmitFunnel = ({
  text = "Continue",
  simple = false,
}: {
  text?: string;
  simple?: boolean;
}) => {
  const { refInputs, canContinue, actionElementRef, isPending } = useFunnel();
  return (
    <>
      {/* Submit Button */}
      <FormComponent.SubmitButton
        variant={simple ? "ghost" : "default"}
        onClick={() => {
          if (refInputs && !canContinue) {
            for (let i = 0; i < refInputs.length; i++) {
              const input = refInputs[i];
              if (!input?.required) continue;
              input.parentElement?.classList.add("input-required");
            }
          }
          if (actionElementRef.current) actionElementRef.current.value = "continue";
        }}
        className={cn({
          "bg-text-muted cursor-not-allowed": !canContinue,
          "": simple,
        })}
        isPending={isPending}
      >
        {text} {!simple ? <ArrowRight /> : null}
      </FormComponent.SubmitButton>
    </>
  );
};

export const ButtonFinishFunnel = ({
  variant = "ghost",
  text = "Finish",
}: {
  text?: string;
  variant?:
    | "base"
    | "link"
    | "default"
    | "primary"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
}) => {
  const { actionElementRef, isPending } = useFunnel();
  return (
    <FormComponent.SubmitButton
      onClick={() => {
        if (actionElementRef.current) actionElementRef.current.value = "finish";
      }}
      isPending={isPending}
      variant={variant}
    >
      {text}
    </FormComponent.SubmitButton>
  );
};
export const ButtonStepBackFunnel = () => {
  const { refInputs, user, actionElementRef, isPending } = useFunnel();
  return (
    <>
      {user && user.funnel_step > 1 && (
        <Button
          onClick={() => {
            refInputs?.forEach((input) => {
              if (input) input.required = false;
            });
            if (actionElementRef.current) actionElementRef.current.value = "back";
          }}
          type="submit"
          className={cn({
            "text-text-muted cursor-not-allowed": isPending,
          })}
          variant={"ghost"}
        >
          <ArrowLeft /> step back
        </Button>
      )}
    </>
  );
};
