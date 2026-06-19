"use client";
import type { Address } from "@repo/common-lib/types/address";
import { useEffect, useState } from "react";
import { CreateOrUpdateAddress } from "@/modules/addresses/components/create-or-update-address";
import type { UserAuth } from "@/modules/auth/auth.types";
import {
  ButtonStepBackFunnel,
  ButtonSubmitFunnel,
  ContainerFormFunnel,
  useFunnel,
} from "./funnel.provider";

export function Step4Client({
  defaultAddress,
  userAuth,
}: {
  defaultAddress?: Address;
  userAuth: UserAuth;
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
  );
}
