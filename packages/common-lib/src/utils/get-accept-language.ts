import { EnumType } from "../constants/enums";

export const getAcceptLanguage = (acceptLanguage?: string | null) => {
    if (acceptLanguage) {
      const primaryLanguage = acceptLanguage
        .split(',')[0]
        .split('-')[0]
        .toUpperCase();
      return primaryLanguage as EnumType<'LANGUAGE_CODE'>;
    }
    return null;
  }