'use client'
import { ButtonStepBackFunnel, ButtonSubmitFunnel, ContainerFormFunnel, useFunnel } from "./funnel.provider";
import { useEffect, useState } from "react";
import { Address } from "@repo/common-lib/types/address";
import { UserAuth } from "@/modules/auth/auth.types";
import { CreateOrUpdateAddress } from "@/modules/addresses/components/create-or-update-address";

export function Step4Client({ defaultAddress, userAuth }: {
    defaultAddress?: Address,
    userAuth: UserAuth
}) {
    const [currentAddress, setCurrentAddress] = useState(defaultAddress);
    const { setCanContinue } = useFunnel();

    useEffect(() => {
        setCanContinue(!!currentAddress);
    }, [currentAddress, setCanContinue]);

    return (
        <>
            <CreateOrUpdateAddress
                userId={userAuth.id}
                defaultAddress={defaultAddress}
                onSuccess={(address) => {
                    setCurrentAddress(address);
                }}
            />

            <ContainerFormFunnel className="sticky bottom-0 bg-bg p-2">
                <ButtonSubmitFunnel />
                <ButtonStepBackFunnel />
            </ContainerFormFunnel>
        </>
    )
}