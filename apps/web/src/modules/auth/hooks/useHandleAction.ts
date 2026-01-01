'use client'
import { FormEvent, useEffect, useState } from "react"
import { ActionReturn } from "../auth.types"


export const useHandleAction = <K,T>({action,beforeAction,afterAction}:{
    action: (formData:FormData)=>Promise<ActionReturn<K,T>>,
    beforeAction?: (formData:FormData,prevResult:ActionReturn<K,T>|null)=>Promise<void>
    afterAction?:(result:ActionReturn<K,T>)=>Promise<void>
}) =>{
    const [result,setResult] = useState<ActionReturn<K,T>|null>(null);
    const [errors,setErrors] = useState<string[]|null>(null);
    const [inputErrors, setInputErrors] = useState<Record<string,string>>()
    const [isPending,setPending] = useState(false);
    const handleSubmit =async (e:FormEvent<HTMLFormElement>| FormData) => {
        if(isPending) return;
        setPending(true);
        if(!(e instanceof FormData)){
            e.preventDefault();
        }
        const formData = e instanceof FormData? e: new FormData(e.currentTarget)
        if(beforeAction) await beforeAction(formData,result);
        const actionResult = await action(formData);
        if(afterAction) await afterAction(actionResult);
        setErrors(actionResult.errors);
        setInputErrors(actionResult.inputErrors)
        setResult(actionResult);
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