"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type {
  BaseUser,
  UpdateUserPasswordInput,
} from "@repo/common-lib/types/user";
import { getTranslations } from "next-intl/server";
import {
  isSessionOwner,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import { updateUserPasswordSchema } from "../schemas/user-shemas";
import usersService from "../users.service";

export const updateUserPasswordAction = async (
  id: number,
  formData: FormData,
): Promise<ActionReturn<BaseUser, UpdateUserPasswordInput>> => {
  const session = await requireSession();
  if (!isSessionOwner(session, id)) {
    return await unauthorizedActionReturn<BaseUser, UpdateUserPasswordInput>();
  }

  const rawData: UpdateUserPasswordInput = {
    old_password: formData.get("old_password") as string,
    new_password: formData.get("new_password") as string,
  };

  const t = await getTranslations();
  const validated = updateUserPasswordSchema(t).safeParse(rawData);

  if (!validated.success) {
    const errors = validated.error.issues.map(
      (err) => `${err.path.join(".")}: ${err.message}`,
    );
    return {
      errors,
      data: null,
      inputs: rawData,
    };
  }

  const result = await usersService.updatePassword(id, validated.data);

  if (result.error) {
    const { status_code, errors } = result.error;
    return {
      errors:
        status_code === 422 || status_code === 420
          ? errors
          : [t("actions.genericError")],
      data: null,
      inputs: rawData,
    };
  }

  return {
    data: result.data!,
    errors: null,
    inputErrors: undefined,
    inputs: rawData,
  };
};
