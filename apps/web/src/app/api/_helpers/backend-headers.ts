import {
 IP_ADDRESS_HEADER,
 LANGUAGE_HEADER,
 USER_AGENT_HEADER,
} from "@repo/common-lib/constants/constants";
import { headers } from "next/headers";
import { serverEnv } from "@/env/server";
import { getLanguage } from "@/lib/server-actions/get-language.server.action";

export async function getBackendHeaders(token: string) {
 const [language, headersList] = await Promise.all([getLanguage(), headers()]);

 return {
 baseUrl: serverEnv.API_V1_URL,
 headers: {
 Authorization: `Bearer ${token}`,
 [LANGUAGE_HEADER]: language,
 [USER_AGENT_HEADER]: headersList.get("user-agent") ?? "",
 [IP_ADDRESS_HEADER]: headersList.get("x-forwarded-for") ?? "",
 },
 };
}
