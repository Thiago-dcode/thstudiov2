'use client'
'use client'
import FormComponent from "@/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { Errors } from "@repo/ui/components/custom/errors";
import { funnelAction } from "@/modules/users/server-actions/funnel.action";
import { createContext, FormEvent, ReactElement, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { UpdateUserInputAvatarFile, User } from "@repo/common-lib/types/user";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { cn } from "@repo/ui/lib/utils";


type InputsType = HTMLInputElement | HTMLTextAreaElement | null | undefined

type FunnelContextType = {
    user?: User,
    lastStep: number,
    isPending: boolean,
    actionElement?: HTMLInputElement
    inputs?: UpdateUserInputAvatarFile,
    errors?:string[],
    refInputs?: (HTMLInputElement | HTMLTextAreaElement)[],
    canContinue: boolean,
    handleSubmit:(e:FormEvent<HTMLFormElement>)=>Promise<void>,
    cleanErrors: () => void,
    setActionElement: (input:HTMLInputElement)=>void,
    handleOnChange: () => void,
    setErrors: (errors: string[]) => void,
    setInputs: (...inputs: InputsType[]) => void,
}
const FunnelContext = createContext<FunnelContextType>({
    lastStep: 0,
    canContinue: false,
    isPending: false,
    handleSubmit: async ()=>{},
    setErrors: () => { },
    setActionElement:()=>{},
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
    const [actionElement, setActionElement] = useState<HTMLInputElement>()
    const [inputs, _setInputs] = useState<(HTMLInputElement | HTMLTextAreaElement)[]>()
    const [canContinue, setCanContinue] = useState(false);
    const { result, handleSubmit, errors, cleanErrors, cleanResult, setErrors, isPending } = useHandleAction({
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
            isPending,
            actionElement: actionElement,
            setActionElement,
            inputs: result?.inputs,
            canContinue,
            errors: errors|| undefined,
            refInputs: inputs,
            handleSubmit,
            cleanErrors,
            setInputs,
            setErrors,
            handleOnChange,
        }}>
         
                    {children}

        </FunnelContext.Provider>
    )

}
export const ContainerFormFunnel = ({children}:{
    children:ReactNode
})=>{
    const actionRef = useRef<HTMLInputElement>(null)
    const { canContinue, isPending,handleSubmit,errors,setActionElement } = useFunnel()
    return <FormComponent.Container>
                <FormComponent.Form onSubmit={(e) => {
                    e.preventDefault();
                    if (isPending || (!canContinue && actionRef.current?.value === 'continue')) return;

                    handleSubmit(e)
                }}>
                    <input ref={(e)=>{
                        actionRef.current =e
                      if(e)  setActionElement(e)
                    }} type="text" name="action" hidden required />
                    {children}

                </FormComponent.Form>
                {/* Error Messages */}
                {errors && errors.length > 0 && (
                    <Errors title="Update failed" errors={errors} />
                )}
            </FormComponent.Container>
    
}
export const ButtonSubmitFunnel = () => {
    const { refInputs, canContinue, actionElement, isPending } = useFunnel()
    return (
        <>
            {/* Submit Button */}
            <FormComponent.SubmitButton onClick={() => {
                if (refInputs && !canContinue) {
                    for (let i = 0; i < refInputs.length; i++) {
                        const input = refInputs[i];
                        if (!input?.required) continue;
                        input.parentElement?.classList.add('input-required');
                    }
                }
                if (actionElement) actionElement.value = 'continue';

            }} className={cn({
                'bg-text-muted cursor-not-allowed': !canContinue
            })} isPending={isPending}>
                Continue <ArrowRight />
            </FormComponent.SubmitButton>

        </>
    )
}

export const ButtonStepBackFunnel = () => {
    const { refInputs, user, actionElement, isPending } = useFunnel()
    return <>
        {user && user.funnel_step > 1 && <Button onClick={() => {
            refInputs?.forEach((input) => {
                if (input) input.required = false;
            })
            if (actionElement) actionElement.value = 'back';
        }} type="submit" className={cn("bg-transparent text-sm transition-colors text-text-muted hover:text-text", {
            "!text-text-muted !cursor-not-allowed": isPending
        })} variant={'ghost'} >
            <ArrowLeft /> step back
        </Button>}</>
}