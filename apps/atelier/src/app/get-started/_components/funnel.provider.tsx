'use client'
'use client'
import FormComponent from "@/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { Errors } from "@repo/ui/components/custom/errors";
import { funnelAction } from "@/modules/users/server-actions/funnel.action";
import { createContext, ReactElement, useCallback, useContext, useEffect, useRef, useState } from "react";
import {  UpdateUserInputAvatarFile, User } from "@repo/common-lib/types/user";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { cn } from "@repo/ui/lib/utils";


type InputsType = HTMLInputElement | HTMLTextAreaElement | null | undefined

type FunnelContextType = {
    user?: User,
    lastStep: number,
    inputs?: UpdateUserInputAvatarFile,
    cleanErrors: () => void,
    handleOnChange: () => void,
    setErrors: (errors:string[])=>void,
    setInputs: (...inputs: InputsType[]) => void,
}
const FunnelContext = createContext<FunnelContextType>({
    lastStep: 0,
    setErrors: () => { },
    cleanErrors: () => { },
    setInputs: () => { },
    handleOnChange: () => { }

})

export const useFunnel = () => useContext(FunnelContext);

export const FunnelProvider = ({ children, user, lastStep }: {
    children: ReactElement,
    user: User,
    lastStep: number
}) => {
    const router = useRouter();
    const actionRef = useRef<HTMLInputElement>(null)
    const [inputs, _setInputs] = useState<(HTMLInputElement | HTMLTextAreaElement)[]>()
    const [canContinue, setCanContinue] = useState(false);
    const { result, handleSubmit, errors, cleanErrors, cleanResult,setErrors, isPending } = useHandleAction({
        action: async (formData) => funnelAction(user.funnel_step, formData),
        afterAction: async (result) => {
            if (result?.data) {
                cleanResult();
                router.refresh();

            }
        }

    });
    const setInputs = useCallback((...inputs: InputsType[]) => {
        _setInputs(inputs.filter(input => !!input));
    }, []);

    const handleOnChange = useCallback(() => {
        cleanErrors();
        if (inputs) {
            setCanContinue(inputs.every(input => {

                input?.parentElement?.classList.remove('input-required');
                return !input?.required || input?.required && !!input?.value
            }))
        }

    }, [inputs])


    useEffect(() => {
        if (!inputs) return;
        handleOnChange();
    }, [inputs]);


    //TODO:handle funnel logic

    return (
        <FunnelContext.Provider value={{
            user,
            lastStep,
            inputs: result?.inputs,
            cleanErrors,
            setInputs,
            setErrors,
            handleOnChange,
        }}>
            <FormComponent.Container>
                <FormComponent.Form onSubmit={(e) => {
                    e.preventDefault();
                    if (isPending || (!canContinue && actionRef.current?.value === 'continue')) return;

                    handleSubmit(e)
                }}>
                    <input ref={actionRef} type="text" name="action" hidden required />
                    {children}
                    <div className="flex flex-col items-center gap-4">

                        {/* Submit Button */}
                        <FormComponent.SubmitButton onClick={() => {
                            if (inputs && !canContinue) {
                                for (let i = 0; i < inputs.length; i++) {
                                    const input = inputs[i];
                                    if (!input?.required) continue;
                                    input.parentElement?.classList.add('input-required');
                                }
                            }
                            if (actionRef?.current) actionRef.current.value = 'continue';

                        }} className={cn({
                            'bg-text-muted cursor-not-allowed': !canContinue
                        })} isPending={isPending}>
                            Continue <ArrowRight />
                        </FormComponent.SubmitButton>

                        {user.funnel_step > 1 && <Button onClick={() => {
                            inputs?.forEach((input) => {
                                if (input) input.required = false;
                            })
                            if (actionRef?.current) actionRef.current.value = 'back';
                        }} type="submit" className={cn("bg-transparent text-sm transition-colors text-text-muted hover:text-text", {
                            "!text-text-muted !cursor-not-allowed": isPending
                        })} variant={'ghost'} >
                            <ArrowLeft /> step back
                        </Button>}
                    </div>
                </FormComponent.Form>
                {/* Error Messages */}
                {errors && errors.length > 0 && (
                    <Errors title="Update failed" errors={errors} />
                )}
            </FormComponent.Container>

        </FunnelContext.Provider>
    )

}