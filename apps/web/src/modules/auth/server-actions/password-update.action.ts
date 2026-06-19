"use server";

import { PASSWORD_UPDATED_COOKIE_NAME } from "@repo/common-lib/constants/constants";
import type { ActionReturn } from "@repo/common-lib/types/response";
import type { User } from "@repo/common-lib/types/user";
import { decrypt, encrypt } from "@repo/common-lib/utils/encrypt";
import { cookies } from "next/headers";
import zod from "zod";
import { config } from "@/lib/config";
import authService from "../auth.service";
import { deletePasswordAttemptCookie } from "./password-recovery.action";

export const PasswordUpdateAction = async (
 formData: FormData,
): Promise<
 ActionReturn<
 User,
 {
 attempt?: string;
 }
 >
> => {
 const { password, code } = {
 password: formData.get("password") as string,
 code: formData.get("attempt") as string,
 };

 const validatedPassword = zod
 .string("Invalid password")
 .min(8, "Invalid password")
 .safeParse(password);

 if (!validatedPassword.success) {
 return {
 errors: ["Password must have at least 8 characters long"],
 data: null,
 inputs: {
 attempt: code,
 },
 };
 }

 const result = await authService.updatePassword({
 code,
 password,
 });
 if (result.error) {
 const errorCode = result.error?.status_code;

 return {
 errors:
 errorCode === 400 ? result.error?.errors : ["Something went wrong"],
 data: null,
 inputs: {
 attempt: code,
 },
 };
 }

 await deletePasswordAttemptCookie();

 return {
 data: result.data!,
 errors: null,
 inputs: {},
 };
};

export const setPasswordUpdatedCookie = async () => {
 const cookieStore = await cookies();
 const data = encrypt("success", config.encryption_secret);
 cookieStore.set(PASSWORD_UPDATED_COOKIE_NAME, data, {
 httpOnly: true,
 maxAge: 30, //1 minute
 });
};
export const getPasswordUpdatedCookie = async () => {
 const cookieStore = await cookies();
 const data = cookieStore.get(PASSWORD_UPDATED_COOKIE_NAME)?.value;
 if (!data) {
 return null;
 }
 const result = decrypt(data, config.encryption_secret);
 if (!result) return null;
 return result;
};

export const deletePasswordUpdatedCookie = async () => {
 const cookieStore = await cookies();
 cookieStore.set(PASSWORD_UPDATED_COOKIE_NAME, "", {
 httpOnly: true,
 maxAge: 0,
 });
};
