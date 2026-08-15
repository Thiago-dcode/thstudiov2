"use server";

import {
  ALLOWED_IMAGE_FILE_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_MB,
} from "@repo/common-lib/constants/constants";
import type { MimeTypes } from "@repo/common-lib/types/general";
import type { ActionReturn } from "@repo/common-lib/types/response";
import type {
  CreateServicePayload,
  Service,
  UpdateServicePayload,
} from "@repo/common-lib/types/service";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import { getTranslations } from "next-intl/server";
import {
  getFailureFromApiError,
  getObjErrorFromZod,
} from "@/modules/auth/helpers";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../schemas/service-schemas";
import serviceService from "../service.service";

type ServiceActionInput = Partial<CreateServicePayload> &
  Partial<UpdateServicePayload>;

export const createOrUpdateServiceAction = async (
  input: ServiceActionInput,
  currentService?: Service,
): Promise<ActionReturn<Service, ServiceActionInput>> => {
  const thumbnailFile = input?.thumbnail as File | undefined;
  const isUpdate = !!currentService;
  const t = await getTranslations();

  const userAuth = await userSession();
  if (!userAuth) {
    return {
      errors: [t("actions.unauthorized")],
      data: null,
    };
  }

  if (thumbnailFile && thumbnailFile.size > 0) {
    if (thumbnailFile.size > MAX_IMAGE_UPLOAD_BYTES) {
      return {
        errors: [],
        inputErrors: {
          thumbnail: t("validation.file.tooLarge", {
            field: t("fields.thumbnail"),
            mb: MAX_IMAGE_UPLOAD_MB,
          }),
        },
        data: null,
      };
    }

    if (!ALLOWED_IMAGE_FILE_TYPES.includes(thumbnailFile.type as MimeTypes)) {
      return {
        errors: [],
        inputErrors: {
          thumbnail: t("validation.file.invalidType", {
            field: t("fields.thumbnail"),
          }),
        },
        data: null,
      };
    }
  }

  const rawData = {
    ...input,
    thumbnail: thumbnailFile,
    description: input.description ?? "",
    price: input.price != null ? Number(input.price) : undefined,
    features: input.features?.filter((f) => f.title.trim().length > 0),
    terms: input.terms?.filter((t) => t.title.trim().length > 0),
  };

  trimValues(rawData, { deep: true });

  const schema = isUpdate ? updateServiceSchema(t) : createServiceSchema(t);
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
  const service = isUpdate
    ? await serviceService.update(
        currentService.id,
        rawData as UpdateServicePayload,
      )
    : await serviceService.create(rawData as CreateServicePayload);

  if (service.data) {
    return {
      data: service.data,
      errors: null,
      inputErrors: undefined,
    };
  }

  return getFailureFromApiError(service);
};
