"use client";
import type { UpdateUserInputWithAssets } from "@repo/common-lib/types/user";
import { Errors } from "@repo/ui/components/custom/errors";
import { Button } from "@repo/ui/components/shadcn/button";
import { cn } from "@repo/ui/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createContext,
  type FormEvent,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

// Stable slice: identities never change between renders (refs + memoized
// callbacks). Consumers that only need these never re-render on state changes.
type FunnelActionsContextType = {
  user?: UserAuth;
  lastStep: number;
  actionElementRef: MutableRefObject<HTMLInputElement | null>;
  setCanContinue: (value: boolean | ((prev: boolean) => boolean)) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  cleanErrors: () => void;
  handleOnChange: () => void;
  setErrors: (errors: string[]) => void;
  setInputs: (...inputs: InputsType[]) => void;
};

// Reactive slice: changes drive re-renders (pending/validation/errors).
type FunnelStateContextType = {
  isPending: boolean;
  canContinue: boolean;
  errors?: string[];
  inputs?: UpdateUserInputWithAssets;
  refInputs?: (HTMLInputElement | HTMLTextAreaElement)[];
};

type FunnelContextType = FunnelActionsContextType & FunnelStateContextType;

const FunnelActionsContext = createContext<FunnelActionsContextType>({
  lastStep: 0,
  actionElementRef: { current: null },
  setCanContinue: () => {},
  handleSubmit: async () => {},
  setErrors: () => {},
  cleanErrors: () => {},
  setInputs: () => {},
  handleOnChange: () => {},
});

const FunnelStateContext = createContext<FunnelStateContextType>({
  isPending: false,
  canContinue: false,
});

export const useFunnelActions = () => useContext(FunnelActionsContext);
export const useFunnelState = () => useContext(FunnelStateContext);

// Backward-compat merged hook. Subscribes to BOTH contexts, so it re-renders
// on any change. Prefer the granular hooks above to minimize re-renders.
export const useFunnel = (): FunnelContextType => {
  const actions = useFunnelActions();
  const state = useFunnelState();
  return { ...actions, ...state };
};

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
  const t = useTranslations("getStarted.actions");
  const actionElementRef = useRef<HTMLInputElement | null>(null);
  const [inputs, _setInputs] =
    useState<(HTMLInputElement | HTMLTextAreaElement)[]>();
  const [canContinue, _setCanContinue] = useState(defaultCanContinue);
  const setCanContinue = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      _setCanContinue((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        return prev === next ? prev : next;
      });
    },
    [],
  );
  const { result, handleSubmit, errors, cleanErrors, setErrors, isPending } =
    useHandleAction({
      action: async (formData) => {
        const validActions: FunnelActions[] = ["continue", "finish", "back"];
        const action = formData.get("action") as FunnelActions;
        if (!validActions.some((va) => va === action))
          return {
            data: null,
            errors: [t("somethingWentWrong")],
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

  // Mirror inputs into a ref so handleOnChange stays referentially stable and
  // can live in the stable actions context without churning its identity.
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;

  const handleOnChange = useCallback(() => {
    cleanErrors();
    const currentInputs = inputsRef.current;
    if (!currentInputs?.length) return;
    const nextCanContinue = currentInputs.every((input) => {
      input?.parentElement?.classList.remove("input-required");
      return !input?.required || (input?.required && !!input?.value);
    });
    setCanContinue((prev) =>
      prev === nextCanContinue ? prev : nextCanContinue,
    );
  }, [cleanErrors, setCanContinue]);

  useEffect(() => {
    if (!inputs?.length) return;
    handleOnChange();
  }, [inputs, handleOnChange]);

  const actionsValue = useMemo<FunnelActionsContextType>(
    () => ({
      user,
      lastStep,
      actionElementRef,
      setCanContinue,
      cleanErrors,
      setInputs,
      setErrors,
      handleOnChange,
      handleSubmit,
    }),
    [
      user,
      lastStep,
      setCanContinue,
      cleanErrors,
      setInputs,
      setErrors,
      handleOnChange,
      handleSubmit,
    ],
  );

  const stateValue = useMemo<FunnelStateContextType>(
    () => ({
      isPending,
      canContinue,
      errors: errors || undefined,
      inputs: result?.inputs,
      refInputs: inputs,
    }),
    [isPending, canContinue, errors, result?.inputs, inputs],
  );

  //TODO:handle funnel logic

  return (
    <FunnelActionsContext.Provider value={actionsValue}>
      <FunnelStateContext.Provider value={stateValue}>
        {children}
      </FunnelStateContext.Provider>
    </FunnelActionsContext.Provider>
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
  const { handleSubmit, actionElementRef } = useFunnelActions();
  const { canContinue, isPending, errors } = useFunnelState();
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
  text,
  simple = false,
}: {
  text?: string;
  simple?: boolean;
}) => {
  const t = useTranslations("getStarted.actions");
  const { actionElementRef } = useFunnelActions();
  const { refInputs, canContinue, isPending } = useFunnelState();
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
          if (actionElementRef.current)
            actionElementRef.current.value = "continue";
        }}
        className={cn({
          "bg-text-muted cursor-not-allowed": !canContinue,
          "": simple,
        })}
        isPending={isPending}
      >
        {text ?? t("continue")} {!simple ? <ArrowRight /> : null}
      </FormComponent.SubmitButton>
    </>
  );
};

export const ButtonFinishFunnel = ({
  variant = "ghost",
  text,
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
  const t = useTranslations("getStarted.actions");
  const { actionElementRef } = useFunnelActions();
  const { isPending } = useFunnelState();
  return (
    <FormComponent.SubmitButton
      onClick={() => {
        if (actionElementRef.current) actionElementRef.current.value = "finish";
      }}
      isPending={isPending}
      variant={variant}
    >
      {text ?? t("finish")}
    </FormComponent.SubmitButton>
  );
};
export const ButtonStepBackFunnel = () => {
  const t = useTranslations("getStarted.actions");
  const { user, actionElementRef } = useFunnelActions();
  const { refInputs, isPending } = useFunnelState();
  return (
    <>
      {user && user.funnel_step > 1 && (
        <Button
          onClick={() => {
            refInputs?.forEach((input) => {
              if (input) input.required = false;
            });
            if (actionElementRef.current)
              actionElementRef.current.value = "back";
          }}
          type="submit"
          className={cn({
            "text-text-muted cursor-not-allowed": isPending,
          })}
          variant={"ghost"}
        >
          <ArrowLeft /> {t("stepBack")}
        </Button>
      )}
    </>
  );
};
