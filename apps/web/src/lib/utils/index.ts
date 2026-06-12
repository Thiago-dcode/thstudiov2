import { decrypt, encrypt } from "@repo/common-lib/utils/encrypt";
import { cookies } from "next/headers";
import { serverEnv } from "@/env/server";

const deleteCookie = async (cookieName: string) => {
  const response = await fetch(
    `${serverEnv.APP_URL}/api/cookies/${cookieName}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to delete cookie");
  }
  return response.json();
};

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
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const encryptObj = async <T extends object>(obj: T) => {
  return encrypt(JSON.stringify(obj), serverEnv.ENCRYPTION_SECRET);
};

export { deleteCookie };
