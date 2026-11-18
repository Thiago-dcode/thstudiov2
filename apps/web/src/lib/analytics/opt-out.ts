/**
 * Per-browser analytics opt-out, so the owner's (and the team's) own visits stay out of GA4
 * regardless of IP address, network or device.
 *
 * Visit any page with `?ga_optout=1` once and that browser never loads gtag again; `?ga_optout=0`
 * undoes it. The flag lives in localStorage, so it survives reloads and cookie-consent changes but
 * is lost if the site data is cleared (just visit the link again). The param itself never reaches
 * GA: `sanitizeQuery` keeps only `utm_*`.
 *
 * Browser-only.
 */
import {
  readStorage,
  removeStorage,
  writeStorage,
} from "@/lib/utils/browser-storage";

const OPT_OUT_PARAM = "ga_optout";
const OPT_OUT_KEY = "a11:ga-optout";

const isOptedOut = () => readStorage("local", OPT_OUT_KEY) === "1";

/** Applies `?ga_optout=1|0` if present, then returns whether this browser is opted out. */
export const resolveAnalyticsOptOut = (): boolean => {
  const param = new URLSearchParams(window.location.search).get(OPT_OUT_PARAM);
  if (param === "1") writeStorage("local", OPT_OUT_KEY, "1");
  else if (param === "0") removeStorage("local", OPT_OUT_KEY);
  const optedOut = isOptedOut();
  // Logged from the readback, so blocked storage doesn't claim an opt-out that didn't stick.
  if (param === "1" || param === "0") {
    console.info(
      optedOut
        ? "[analytics] This browser is excluded from Google Analytics."
        : "[analytics] This browser is counted in Google Analytics.",
    );
  }
  return optedOut;
};

/** Other tabs of this site follow an opt-out/in made here without a reload. Returns the unsubscribe. */
export const onAnalyticsOptOutChange = (
  listener: (optedOut: boolean) => void,
): (() => void) => {
  const handler = (event: StorageEvent) => {
    if (event.key === OPT_OUT_KEY || event.key === null) listener(isOptedOut());
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
};
