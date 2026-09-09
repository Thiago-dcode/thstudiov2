"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearClientAuthToken } from "@/lib/services/client-session-token";
import type { UserAuth } from "../auth.types";
import {
  deleteUserSession,
  setUserSession,
} from "../server-actions/user-session.action";

export const SetSessionClient = ({
  userAuth,
  redirect,
}: {
  userAuth: UserAuth;
  redirect: string;
}) => {
  const router = useRouter();
  useEffect(() => {
    // Signing in replaces the cookie, but this tab may still be memoizing the token of whoever
    // was signed in before — and unlike sign-out, nothing expired that session on the API, so
    // the stale token is still *accepted*. Left in place, the new user's calls authenticate as
    // the previous one; only routes that also check an explicit id in the body or path (the
    // `IsUserAuth` validator/pipe) would notice. Clear on every outcome, including the failure
    // branch, which still navigates.
    clearClientAuthToken();
    deleteUserSession()
      .then(() => {
        setUserSession(userAuth).then(() => {
          clearClientAuthToken();
          router.push(redirect);
        });
      })
      .catch(() => {
        router.push(redirect);
      });
  }, [userAuth, redirect, router.push]);

  return null;
};
