'use client'
'use client'
import FormComponent from "@/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { Errors } from "@repo/ui/components/custom/errors";
import { funnelAction } from "@/modules/users/server-actions/funnel.action";
import { createContext, ReactElement, RefObject, useCallback, useContext, useEffect, useRef, useState } from "react";
import { User } from "@repo/common-lib/types/user";
import { UpdateUserSchemaType } from "@/modules/users/schemas/user-shemas";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { cn } from "@repo/ui/lib/utils";

type RefInput = RefObject<HTMLInputElement | HTMLTextAreaElement | null>;

type FunnelContextType = {
    user?: User,
    lastStep: number,
    inputs?: UpdateUserSchemaType
    cleanErrors: () => void,
    handleOnChange: () => void,
    setRefs: (...refs: RefInput[]) => void,
}
const FunnelContext = createContext<FunnelContextType>({
    lastStep: 0,
    cleanErrors: () => { },
    setRefs: () => { },
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
    const [refs, _setRefs] = useState<RefInput[]>()
    const [canContinue, setCanContinue] = useState(false);
    const { result, handleSubmit, errors, cleanErrors, cleanResult, isPending } = useHandleAction({
        action: async (formData)=>funnelAction(user.funnel_step,formData),
        afterAction: async (result) => {
            if (result?.data) {
                cleanResult();
                router.refresh()

            }
        }
    });
    const setRefs = useCallback((...refs: RefInput[]) => {
        _setRefs(refs);
    }, []);

    const handleOnChange = useCallback(() => {
        cleanErrors();
        if (refs) {
            setCanContinue(refs.every(ref => {

                ref.current?.parentElement?.classList.remove('input-required');
                return !ref.current?.required || ref.current?.required && !!ref.current?.value
            }))
        }



    }, [refs])


    useEffect(() => {
        if (!refs) return;
        handleOnChange();
    }, [refs])

    //TODO:handle funnel logic

    return (
        <FunnelContext.Provider value={{
            user,
            lastStep,
            inputs: result?.inputs,
            cleanErrors,
            setRefs,
            handleOnChange
        }}>
            <FormComponent.Container>
                <FormComponent.Form onSubmit={(e) => {
                    e.preventDefault();
                    if (!canContinue && actionRef.current?.value === 'continue') return;
                    handleSubmit(e)
                }}>
                    <input ref={actionRef} type="text" name="action" hidden />
                    {children}
                    <div className="flex flex-col items-center gap-4">
                        {/* Submit Button */}

                        {/* Submit Button */}
                        <FormComponent.SubmitButton onClick={() => {
                            if (refs && !canContinue) {
                                for (let i = 0; i < refs.length; i++) {
                                    const ref = refs[i];
                                    if (!ref.current?.required) continue;
                                    ref.current.parentElement?.classList.add('input-required');
                                }
                            }
                            if (actionRef?.current) actionRef.current.value = 'continue';

                        }} className={cn({
                            'bg-text-muted cursor-not-allowed': !canContinue
                        })} isPending={isPending}>
                            Continue <ArrowRight />
                        </FormComponent.SubmitButton>
                        {user.funnel_step > 1 && <Button onClick={() => {
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