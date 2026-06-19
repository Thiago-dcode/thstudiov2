"use server";

import type {
  Collection,
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@repo/common-lib/types/collection";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import {
  getFriendlyApiErrors,
  getObjErrorFromZod,
} from "@/modules/auth/helpers";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import collectionService from "../collection.service";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "../schemas/collection-schemas";

type CollectionActionInput = Partial<CreateCollectionInput> &
  Partial<UpdateCollectionInput>;

export const createOrUpdateCollectionAction = async (
  input: CollectionActionInput,
  currentCollection?: Collection,
): Promise<ActionReturn<Collection, CollectionActionInput>> => {
  const isUpdate = !!currentCollection;

  const userAuth = await userSession();
  if (!userAuth) {
    return {
      errors: ["Unauthorized"],
      data: null,
    };
  }

  const rawData = {
    ...input,
    description: input.description || undefined,
  };

  trimValues(rawData, { deep: true });

  const schema = isUpdate ? updateCollectionSchema : createCollectionSchema;
  const validated = schema.safeParse(rawData);

  if (!validated.success) {
    return {
      errors: [],
      inputErrors: getObjErrorFromZod(validated.error),
      data: null,
    };
  }

  cleanObj(rawData);

  if (
    rawData.slug &&
    rawData.user_id &&
    currentCollection?.slug !== rawData.slug
  ) {
    const slugExistsResponse = await userCollectionService.slugExists(
      userAuth.username,
      rawData.slug,
    );

    if (slugExistsResponse.error) {
      return {
        data: null,
        errors: getFriendlyApiErrors(slugExistsResponse),
      };
    }

    if (slugExistsResponse.data?.exists) {
      return {
        data: null,
        errors: [],
        inputErrors: { slug: "Slug already exists" },
      };
    }
  }

  const collection = isUpdate
    ? await collectionService.update(
        currentCollection.id,
        rawData as UpdateCollectionInput,
      )
    : await collectionService.create(rawData as CreateCollectionInput);

  if (collection.data) {
    return {
      data: collection.data,
      errors: null,
      inputErrors: undefined,
    };
  }

  return {
    data: null,
    errors: getFriendlyApiErrors(collection),
  };
};
