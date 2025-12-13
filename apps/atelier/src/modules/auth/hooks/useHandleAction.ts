'use client'
import { FormEvent, useEffect, useState } from "react"
import { AuthActionReturn } from "../auth.types"


export const useHandleAction = <K,T>({action,beforeAction,afterAction}:{
    action: (formData:FormData)=>Promise<AuthActionReturn<K,T>>,
    beforeAction?: (e:FormEvent<HTMLFormElement>,prevResult:AuthActionReturn<K,T>|null)=>Promise<void>
    afterAction?:(result:AuthActionReturn<K,T>)=>Promise<void>
}) =>{
    const [result,setResult] = useState<AuthActionReturn<K,T>|null>(null);
    const [errors,setErrors] = useState<string[]|null>(null)
    const [isPending,setPending] = useState(false);
    const handleSubmit =async (e:FormEvent<HTMLFormElement>) => {
        if(isPending) return;
        setPending(true);
        e.preventDefault();

        if(beforeAction) await beforeAction(e,result);

        const actionResult = await action(new FormData(e.currentTarget));
   
        if(afterAction) await afterAction(actionResult);
        setErrors(actionResult.errors)
        setResult(actionResult);
    }

    const cleanErrors = () =>{
        setErrors(null)
    }
    const cleanResult = () =>{
        setResult(null);
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
        cleanErrors,
        cleanResult,
        setErrors,
        success: !!result?.data
    }

}

export type HandlerActionType <T,K>= ReturnType<typeof useHandleAction<T,K>>