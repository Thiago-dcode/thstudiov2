"use server";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
} from "@repo/common-lib/constants/constants";
import { ENUMS, type EnumType } from "@repo/common-lib/constants/enums";
import { cookies } from "next/headers";

export const getLanguage = async () => {
  const cookieStore = await cookies();
  let language = cookieStore.get(LANGUAGE_COOKIE_NAME)
    ?.value as EnumType<"LANGUAGE_CODE">;
  if (!language) {
    language = DEFAULT_LANGUAGE;
  }
  if (!language || !ENUMS.LANGUAGE_CODE.includes(language)) {
    language = DEFAULT_LANGUAGE;
  }
  return language;
};
