"use server";

import type {
  Address,
  PublicCreateAddressInput,
} from "@repo/common-lib/types/address";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import { revalidateTag } from "next/cache";
import {
  getFriendlyApiErrors,
  getObjErrorFromZod,
  isSessionOwner,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import addressService from "../address.service";
import { createAddressSchema } from "../schemas/address.schema";

export const createOrUpdateAddressAction = async (
  formData: FormData,
  addressId?: number,
): Promise<ActionReturn<Address, PublicCreateAddressInput>> => {
  const session = await requireSession();
  if (!session) {
    return await unauthorizedActionReturn<Address, PublicCreateAddressInput>();
  }

  // Extract fields from FormData
  const rawData: PublicCreateAddressInput = {
    formated_address: (formData.get("formated_address") as string) ?? "",
    street: (formData.get("street") as string) ?? "",
    city: (formData.get("city") as string) ?? "",
    state: (formData.get("state") as string) ?? "",
    zip: (formData.get("zip") as string) ?? "",
    country: (formData.get("country") as string) ?? "",
    country_code: (formData.get("country_code") as string) ?? "",
    latitude: formData.get("latitude")
      ? parseFloat(formData.get("latitude") as string)
      : undefined,
    longitude: formData.get("longitude")
      ? parseFloat(formData.get("longitude") as string)
      : undefined,
    user_id: formData.get("user_id")
      ? parseInt(formData.get("user_id") as string, 10)
      : undefined,
    client_id: formData.get("client_id")
      ? parseInt(formData.get("client_id") as string, 10)
      : undefined,
  };

  trimValues(rawData, {
    deep: true,
  });

  cleanObj(rawData);

  // Validate data
  const validated = createAddressSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      errors: [],
      inputErrors: getObjErrorFromZod(validated.error),
      data: null,
      inputs: rawData,
    };
  }

  // Client-owned addresses (client_id set, no user_id) are validated for ownership
  // on the backend once that address belongs to one of the caller's clients.
  if (
    validated.data.user_id !== undefined &&
    !isSessionOwner(session, validated.data.user_id)
  ) {
    return await unauthorizedActionReturn<Address, PublicCreateAddressInput>(rawData);
  }

  const result = !addressId
    ? await addressService.create(validated.data)
    : await addressService.update(addressId, validated.data);

  if (result.error) {
    return {
      data: null,
      errors: await getFriendlyApiErrors(result),
    };
  }

  revalidateTag(`address-${validated.data.user_id}`, "max");
  return {
    data: result.data!,
    errors: null,
    inputErrors: undefined,
    inputs: rawData,
  };
};
