"use client";
import { normalizeUsername } from "@repo/common-lib/utils/username";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import FormComponent from "@/lib/components/form-component";
import { useRejectedUsernames } from "@/modules/users/hooks/use-rejected-usernames";
import {
  ButtonSubmitFunnel,
  ContainerFormFunnel,
  useFunnelActions,
  useFunnelState,
} from "./funnel.provider";

// Required, with no Skip or Back: sign-up gives a random username, and this step replaces it.
// The first change of a generated username is free (it does not count against the monthly limit).
export default function Step1() {
  const t = useTranslations("getStarted.username");
  const { user, setInputs, handleOnChange, setCanContinue } =
    useFunnelActions();
  const { inputs, inputErrors } = useFunnelState();
  const usernameRef = useRef<HTMLInputElement>(null);
  // Still the random one: leave the field empty so a real choice is made. Back from step 2
  // (already chosen) shows the chosen one.
  const isGenerated = Boolean(
    (user as { username_auto_generated?: boolean } | undefined)
      ?.username_auto_generated,
  );
  const initial = isGenerated ? "" : (user?.username ?? "");
  const [value, setValue] = useState(initial);
  const { remember, rejectionFor } = useRejectedUsernames();

  // A name the server refused is remembered, so asking for it again costs no API call.
  useEffect(() => {
    remember(inputs?.username, inputErrors?.username);
  }, [inputs?.username, inputErrors?.username, remember]);

  const rejection = rejectionFor(value);
  useEffect(() => {
    if (rejection) setCanContinue(false);
  }, [rejection, setCanContinue]);

  useEffect(() => {
    setInputs(usernameRef?.current);
  }, [setInputs]);
  return (
    <ContainerFormFunnel>
      <FormComponent.LabelInput
        ref={usernameRef}
        label={t("label")}
        type="text"
        id="username"
        name="username"
        defaultValue={initial || undefined}
        placeholder={t("placeholder")}
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        minLength={3}
        maxLength={20}
        required
        autoFocus
        error={rejection ?? inputErrors?.username}
        onChange={(e) => {
          e.target.value = normalizeUsername(e.target.value);
          setValue(e.target.value);
          handleOnChange();
          if (rejectionFor(e.target.value)) setCanContinue(false);
        }}
      />
      <p className="text-xs! text-text-muted">{t("hint")}</p>
      <div>
        <ButtonSubmitFunnel />
      </div>
    </ContainerFormFunnel>
  );
}
