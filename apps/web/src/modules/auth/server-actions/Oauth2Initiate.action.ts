"use server";

import type { OauthProviders } from "@repo/common-lib/types/auth";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { errorName, webLogger, withLogTrace } from "@/lib/logging/logger";
import authService from "../auth.service";
import { getFriendlyApiErrors } from "../helpers";
import {
  deleteInvitationCodeCookie,
  oauthCallbackUrl,
  setInvitationCodeCookie,
  setOauthInitiateCookie,
} from "./oauth-state.cookies";

const LOG_FIELDS = { operation: "oauth-initiate" };

export const oauth2InitiateAction = async (
  provider: OauthProviders,
  invitationCode?: string,
): Promise<ActionReturn<string>> =>
  withLogTrace(async () => {
    // Never log state, the code challenge or the invitation code: only whether one was sent.
    // `invited`, not `has_invitation_code`: redaction blanks any key containing "invitationcode".
    const info = { provider, invited: Boolean(invitationCode) };
    webLogger.info("OAuth initiate started", info, LOG_FIELDS);

    let step = "state-cookie";
    try {
      // The cookie keeps this browser's copy; the provider echoes the same value on the callback.
      const { state, codeChallenge } = await setOauthInitiateCookie();
      step = "api-initiate";
      const data = await authService.oauth2Initiate({
        redirect_uri: oauthCallbackUrl(provider),
        provider,
        state,
        code_challenge: codeChallenge,
      });

      if (data.error) {
        webLogger.warn(
          "OAuth initiate rejected",
          { ...info, api_error_code: data.error.api_error_code ?? null },
          { ...LOG_FIELDS, status_code: data.error.status_code },yes
        );
        return {
          data: null,
          errors: await getFriendlyApiErrors(data),
        };
      }

      step = "invitation-cookie";
      // No code this time: drop one a previous attempt may have left behind.
      if (invitationCode) await setInvitationCodeCookie(invitationCode);
      else await deleteInvitationCodeCookie();

      webLogger.success("OAuth initiate completed", info, LOG_FIELDS);
      return {
        data: data.data,
        errors: null,
      };
    } catch (error) {
      webLogger.error(
        "OAuth initiate failed",
        { ...info, step, error_name: errorName(error) },
        LOG_FIELDS,
      );
      throw error;
    }
  });
