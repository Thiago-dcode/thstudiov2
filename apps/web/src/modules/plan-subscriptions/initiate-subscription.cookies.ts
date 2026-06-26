import { INITIATE_SUBCRIPTION_COOKIE } from "@repo/common-lib/constants/constants";
import { cookies } from "next/headers";

export async function deleteInitiateSubscriptionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(INITIATE_SUBCRIPTION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
  });
}
