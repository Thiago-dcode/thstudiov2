'use client'
import { AddressSchema } from "@repo/common-lib/schemas/address";
import { ButtonStepBackFunnel, ButtonSubmitFunnel, ContainerFormFunnel } from "./funnel.provider";
import { useLocationAutocomplete } from "@/lib/hooks/useGetLocation";
import { useEffect } from "react";

export function Step4Client({defaultAddress}:{
    defaultAddress: AddressSchema
}) {


    //Create custom hook to handle api geo autocomplete

    const {search} = useLocationAutocomplete();

    //Create a dropdown component to show the result

    //Display the selected result to the user

    //Update user address with the address selected

    //Handle funnel logic

    useEffect(()=>{
         search('hamburg');

    },[])


    return <ContainerFormFunnel className="sticky bottom-0 bg-bg p-2">
        <ButtonSubmitFunnel />
        <ButtonStepBackFunnel />
    </ContainerFormFunnel>



}