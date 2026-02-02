'use server'

import { ActionReturn } from "@/modules/auth/auth.types";
import { createAddressSchema } from "../schemas/address.schema";
import { Address, PublicCreateAddressInput } from "@repo/common-lib/types/address";
import addressService from "../address.service";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import { getFriendlyApiErrors, getObjErrorFromZod } from "@/modules/auth/helpers";
import { revalidateTag } from "next/cache";

export const createOrUpdateAddressAction = async (formData: FormData, addressId?: number): Promise<ActionReturn<PublicCreateAddressInput, Address>> => {
    // Extract fields from FormData
    let rawData: PublicCreateAddressInput = {
        formated_address: formData.get('formated_address') as string || undefined,
        street: formData.get('street') as string || undefined,
        city: formData.get('city') as string || undefined,
        state: formData.get('state') as string || undefined,
        zip: formData.get('zip') as string || undefined,
        country: formData.get('country') as string || undefined,
        country_code: formData.get('country_code') as string || undefined,
        latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined,
        longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined,
        user_id: formData.get('user_id') ? parseInt(formData.get('user_id') as string) : undefined,
        client_id: formData.get('client_id') ? parseInt(formData.get('client_id') as string) : undefined,
    };

    trimValues(rawData, {
        deep: true
    });

    cleanObj(rawData);

    // Validate data
    const validated = createAddressSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            errors: [],
            inputErrors: getObjErrorFromZod(validated.error),
            data: null,
            inputs: rawData
        };
    }

    const result = !addressId ? await addressService.create(validated.data) : await addressService.update(addressId, validated.data);

    if (result.error) {
        return {
            data: null,
            errors: getFriendlyApiErrors(result)
        };
    }

    revalidateTag(`address-${validated.data.user_id}`,'max')
    return {
        data: result.data!,
        errors: null,
        inputErrors: undefined,
        inputs: rawData
    };
}

