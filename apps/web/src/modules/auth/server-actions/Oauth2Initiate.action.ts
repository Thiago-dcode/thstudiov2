"use server";

import type { OauthProviders } from "@repo/common-lib/types/auth";
import type { ActionReturn } from "@repo/common-lib/types/response";
import authService from "../auth.service";
import { getFriendlyApiErrors } from "../helpers";
import {
  deleteInvitationCodeCookie,
  oauthCallbackUrl,
  setInvitationCodeCookie,
  setOauthInitiateCookie,
} from "./oauth-state.cookies";

export const oauth2InitiateAction = async (
  provider: OauthProviders,
  invitationCode?: string,
): Promise<ActionReturn<string>> => {
  // The cookie keeps this browser's copy; the provider echoes the same value on the callback.
  const { state, codeChallenge } = await setOauthInitiateCookie();
  const data = await authService.oauth2Initiate({
    redirect_uri: oauthCallbackUrl(provider),
    provider,
    state,
    code_challenge: codeChallenge,
  });

  if (data.error) {
    return {
      data: null,
      errors: await getFriendlyApiErrors(data),
    };
  }

  // No code this time: drop one a previous attempt may have left behind.
  if (invitationCode) await setInvitationCodeCookie(invitationCode);
  else await deleteInvitationCodeCookie();
  return {
    data: data.data,
    errors: null,
  };
};
