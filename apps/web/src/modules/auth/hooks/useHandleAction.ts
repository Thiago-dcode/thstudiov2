'use client'
import { FormEvent, useEffect, useState } from "react"
import { ActionReturn } from "../auth.types"


export const useHandleAction = <K,T>({action,beforeAction,afterAction}:{
    action: ((formData:FormData)=>Promise<ActionReturn<K,T>>) | (()=>Promise<ActionReturn<K,T>>),
    beforeAction?: ((formData:FormData,prevResult?:ActionReturn<K,T>|null)=>Promise<void>) | ((prevResult?:ActionReturn<K,T>|null)=>Promise<void>) | (()=>Promise<void>)
    afterAction?:(result:ActionReturn<K,T>)=>Promise<void>
}) =>{
    const [result,setResult] = useState<ActionReturn<K,T>|null>(null);
    const [errors,setErrors] = useState<string[]|null>(null);
    const [inputErrors, setInputErrors] = useState<Record<string,string>>()
    const [isPending,setPending] = useState(false);

    const executeAction = async (formData?: FormData) => {
        if(isPending) return;
        setPending(true);
        
        try {
            if(beforeAction) {
                // Check if beforeAction accepts formData parameter
                if(beforeAction.length >= 1 && formData !== undefined) {
                    await (beforeAction as (formData:FormData,prevResult?:ActionReturn<K,T>|null)=>Promise<void>)(formData, result);
                } else if(beforeAction.length >= 1) {
                    await (beforeAction as (prevResult?:ActionReturn<K,T>|null)=>Promise<void>)(result);
                } else {
                    await (beforeAction as ()=>Promise<void>)();
                }
            }
            
            // Call action - check if it accepts formData
            // For Next.js server actions, always pass formData if it's provided
            // The action signature will determine if it's used
            const actionResult = formData !== undefined
                ? await (action as (formData:FormData)=>Promise<ActionReturn<K,T>>)(formData)
                : await (action as ()=>Promise<ActionReturn<K,T>>)();
            
            if(afterAction) await afterAction(actionResult);
            setErrors(actionResult.errors);
            setInputErrors(actionResult.inputErrors)
            setResult(actionResult);
        } finally {
            // isPending will be set to false in useEffect after result is set
        }
    }

    const handleSubmit = async (e:FormEvent<HTMLFormElement>| FormData) => {
        if(!(e instanceof FormData)){
            e.preventDefault();
        }
        const formData = e instanceof FormData? e: new FormData(e.currentTarget)
        await executeAction(formData);
    }

    const handleAction = async () => {
        await executeAction();
    }

    const cleanErrors = () =>{
        setErrors(null)
        setInputErrors(undefined)
    }
    const deleteInputErrorProperty = (key: string) => {
        //avoid rerenders
        if(!inputErrors || !inputErrors[key]) return;
        setInputErrors(prev => {
            if (!prev || !prev[key]) return prev;
            const { [key]: _, ...rest } = prev;
            return Object.keys(rest).length > 0 ? rest : undefined;
        });
    }
    const cleanResult = () =>{
        setResult(null);
    }
    const reset = () =>{
        cleanErrors()
        cleanResult()
    }
  
    useEffect(()=>{
        if(!result)return
        setTimeout(()=>{
            setPending(false);
        },300)
    },[result])

    return {
        result,
        isPending,
        handleSubmit,
        handleAction,
        errors,
        inputErrors,
        cleanErrors,
        cleanResult,
        deleteInputErrorProperty,
        setErrors,
        reset,
        success: !!result?.data
    }

}

export type HandlerActionType <T,K>= ReturnType<typeof useHandleAction<T,K>>