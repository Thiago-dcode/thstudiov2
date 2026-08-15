"use server";

import {
  ALLOWED_IMAGE_FILE_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_MB,
} from "@repo/common-lib/constants/constants";
import type { MimeTypes } from "@repo/common-lib/types/general";
import type {
  CreatePortfolioPayload,
  Portfolio,
  UpdatePortfolioPayload,
} from "@repo/common-lib/types/portfolio";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import { getTranslations } from "next-intl/server";
import {
  getFailureFromApiError,
  getObjErrorFromZod,
} from "@/modules/auth/helpers";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import portfolioService from "../portfolio.service";
import {
  createPortfolioSchema,
  updatePortfolioSchema,
} from "../schemas/portfolio-schemas";

type PortfolioActionInput = Partial<CreatePortfolioPayload> &
  Partial<UpdatePortfolioPayload>;

export const createOrUpdatePortfolioAction = async (
  input: PortfolioActionInput,
  currentPortfolio?: Portfolio,
): Promise<ActionReturn<Portfolio, PortfolioActionInput>> => {
  const thumbnailFile = input?.thumbnail as File | undefined;
  const isUpdate = !!currentPortfolio;
  const t = await getTranslations();

  // Thumbnail is required only on create
  if (!isUpdate && (!thumbnailFile || thumbnailFile.size === 0)) {
    return {
      errors: [],
      inputErrors: { thumbnail: t("validation.thumbnailRequired") },
      data: null,
    };
  }

  const userAuth = await userSession();
  if (!userAuth) {
    return {
      errors: [t("actions.unauthorized")],

      data: null,
    };
  }
  // Validate thumbnail if provided (both create & update)
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

  // Prepare data
  const rawData = {
    ...input,
    thumbnail: thumbnailFile,
    description: input.description ?? "",
  };

  trimValues(rawData, { deep: true });
  // Validate with appropriate schema
  const schema = isUpdate ? updatePortfolioSchema(t) : createPortfolioSchema(t);
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
  const portfolio = isUpdate
    ? await portfolioService.update(
        currentPortfolio.id,
        rawData as UpdatePortfolioPayload,
      )
    : await portfolioService.create(rawData as CreatePortfolioPayload);

  if (portfolio.data) {
    return {
      data: portfolio.data,
      errors: null,
      inputErrors: undefined,
    };
  }

  return getFailureFromApiError(portfolio);
};
