import { SECURE_COOKIE_FLAGS } from "@/lib/utils/cookie-flags";
import { INITIATE_SUBCRIPTION_COOKIE } from "@repo/common-lib/constants/cookies";
import { cookies } from "next/headers";

export async function deleteInitiateSubscriptionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(INITIATE_SUBCRIPTION_COOKIE, "", {
    ...SECURE_COOKIE_FLAGS,
    maxAge: 0,
  });
}
