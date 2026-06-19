"use server";

import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import type { MimeTypes } from "@repo/common-lib/types/general";
import type {
 CreatePortfolioInputWithFile,
 Portfolio,
 UpdatePortfolioInputWithFile,
} from "@repo/common-lib/types/portfolio";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import {
 getFriendlyApiErrors,
 getObjErrorFromZod,
} from "@/modules/auth/helpers";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import portfolioService from "../portfolio.service";
import {
 createPortfolioSchema,
 updatePortfolioSchema,
} from "../schemas/portfolio-schemas";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type PortfolioActionInput = Partial<CreatePortfolioInputWithFile> &
 Partial<UpdatePortfolioInputWithFile>;

export const createOrUpdatePortfolioAction = async (
 input: PortfolioActionInput,
 currentPortfolio?: Portfolio,
): Promise<ActionReturn<Portfolio, PortfolioActionInput>> => {
 const thumbnailFile = input?.thumbnail as File | undefined;
 const isUpdate = !!currentPortfolio;
 // Thumbnail is required only on create
 if (!isUpdate && (!thumbnailFile || thumbnailFile.size === 0)) {
 return {
 errors: [],
 inputErrors: { thumbnail: "Thumbnail is required" },
 data: null,
 };
 }

 const userAuth = await userSession();
 if (!userAuth) {
 return {
 errors: ["Unauthorized"],

 data: null,
 };
 }
 // Validate thumbnail if provided (both create & update)
 if (thumbnailFile && thumbnailFile.size > 0) {
 if (thumbnailFile.size > MAX_FILE_SIZE) {
 return {
 errors: [],
 inputErrors: {
 thumbnail: "Thumbnail file size must be less than 10MB",
 },
 data: null,
 };
 }

 if (!ALLOWED_IMAGE_FILE_TYPES.includes(thumbnailFile.type as MimeTypes)) {
 return {
 errors: [],
 inputErrors: {
 thumbnail: "Thumbnail must be an image (JPEG, PNG or WebP)",
 },
 data: null,
 };
 }
 }

 // Prepare data
 const rawData = {
 ...input,
 thumbnail: thumbnailFile,
 description: input.description || undefined,
 };

 trimValues(rawData, { deep: true });

 // Validate with appropriate schema
 const schema = isUpdate ? updatePortfolioSchema : createPortfolioSchema;
 const validated = schema.safeParse(rawData);

 if (!validated.success) {
 return {
 errors: [],
 inputErrors: getObjErrorFromZod(validated.error),
 data: null,
 };
 }

 cleanObj(rawData);

 // Check slug availability (skip if slug unchanged on update)
 if (
 rawData.slug &&
 rawData.user_id &&
 currentPortfolio?.slug !== rawData.slug
 ) {
 const slugExistsResponse = await userPortfolioService.slugExists(
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

 // Call create or update
 const portfolio = isUpdate
 ? await portfolioService.update(
 currentPortfolio.id,
 rawData as UpdatePortfolioInputWithFile,
 )
 : await portfolioService.create(rawData as CreatePortfolioInputWithFile);

 if (portfolio.data) {
 return {
 data: portfolio.data,
 errors: null,
 inputErrors: undefined,
 };
 }

 return {
 data: null,
 errors: getFriendlyApiErrors(portfolio),
 };
};
