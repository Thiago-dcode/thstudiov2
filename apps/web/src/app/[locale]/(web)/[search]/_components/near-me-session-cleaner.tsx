"use client";

import { useEffect } from "react";
import { NEAR_ME_SESSION_KEY } from "./use-near-me";

/**
 * Clears the near-me auto-ask session flag when the search page unmounts.
 * Lives at the stable root of the page (not inside any conditional) so the
 * cleanup fires only when the user actually navigates away — not when the
 * SearchNearMeButton shows/hides based on search results.
 */
export function NearMeSessionCleaner() {
 useEffect(() => {
 return () => {
 sessionStorage.removeItem(NEAR_ME_SESSION_KEY);
 };
 }, []);

 return null;
}
