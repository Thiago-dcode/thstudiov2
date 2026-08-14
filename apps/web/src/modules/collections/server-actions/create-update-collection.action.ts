"use server";

import type {
  Collection,
  CreateCollectionPayload,
  UpdateCollectionPayload,
} from "@repo/common-lib/types/collection";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import { getTranslations } from "next-intl/server";
import {
  getFailureFromApiError,
  getObjErrorFromZod,
} from "@/modules/auth/helpers";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import collectionService from "../collection.service";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "../schemas/collection-schemas";

type CollectionActionInput = Partial<CreateCollectionPayload> &
  Partial<UpdateCollectionPayload>;

export const createOrUpdateCollectionAction = async (
  input: CollectionActionInput,
  currentCollection?: Collection,
): Promise<ActionReturn<Collection, CollectionActionInput>> => {
  const isUpdate = !!currentCollection;
  const t = await getTranslations();

  const userAuth = await userSession();
  if (!userAuth) {
    return {
      errors: [t("actions.unauthorized")],
      data: null,
    };
  }

  const rawData = {
    ...input,
    description: input.description ?? "",
  };

  trimValues(rawData, { deep: true });

  const schema = isUpdate
    ? updateCollectionSchema(t)
    : createCollectionSchema(t);
  const validated = schema.safeParse(rawData);

  if (!validated.success) {
    return {
      errors: [],
      inputErrors: getObjErrorFromZod(validated.error),
      data: null,
    };
  }

  cleanObj(rawData);

  // The API derives the slug from the title and enforces per-user title uniqueness,
  // so there is nothing left to pre-check here.
  const collection = isUpdate
    ? await collectionService.update(
        currentCollection.id,
        rawData as UpdateCollectionPayload,
      )
    : await collectionService.create(rawData as CreateCollectionPayload);

  if (collection.data) {
    return {
      data: collection.data,
      errors: null,
      inputErrors: undefined,
    };
  }

  return getFailureFromApiError(collection);
};
