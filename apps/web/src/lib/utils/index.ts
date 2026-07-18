import { decrypt, encrypt } from "@repo/common-lib/utils/encrypt";
import { cookies } from "next/headers";
import { serverEnv } from "@/env/server";

export const getEncryptedJsonCookie = async <T>(
  key: string,
): Promise<T | null> => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(key)?.value;
  if (!cookieValue) {
    return null;
  }
  try {
    const decrypted = decrypt(cookieValue, serverEnv.ENCRYPTION_SECRET);
    if (!decrypted) return null;
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
};

export const encryptObj = async <T extends object>(obj: T) => {
  return encrypt(JSON.stringify(obj), serverEnv.ENCRYPTION_SECRET);
};

/** Clears a cookie by setting maxAge to 0. */
export const deleteCookie = async (key: string) => {
  const cookieStore = await cookies();
  cookieStore.set(key, "", {
    httpOnly: true,
    maxAge: 0,
  });
};
