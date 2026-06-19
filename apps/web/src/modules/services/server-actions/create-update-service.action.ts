"use server";

import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import type { MimeTypes } from "@repo/common-lib/types/general";
import type { ActionReturn } from "@repo/common-lib/types/response";
import type {
 CreateServiceInputWithFile,
 Service,
 UpdateServiceInputWithFile,
} from "@repo/common-lib/types/service";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import {
 getFriendlyApiErrors,
 getObjErrorFromZod,
} from "@/modules/auth/helpers";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userServiceService from "@/modules/user-services/user-service.service";
import {
 createServiceSchema,
 updateServiceSchema,
} from "../schemas/service-schemas";
import serviceService from "../service.service";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type ServiceActionInput = Partial<CreateServiceInputWithFile> &
 Partial<UpdateServiceInputWithFile>;

export const createOrUpdateServiceAction = async (
 input: ServiceActionInput,
 currentService?: Service,
): Promise<ActionReturn<Service, ServiceActionInput>> => {
 const thumbnailFile = input?.thumbnail as File | undefined;
 const isUpdate = !!currentService;

 const userAuth = await userSession();
 if (!userAuth) {
 return {
 errors: ["Unauthorized"],
 data: null,
 };
 }

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

 const rawData = {
 ...input,
 thumbnail: thumbnailFile,
 description: input.description || undefined,
 price: input.price != null ? Number(input.price) : undefined,
 features: input.features?.filter((f) => f.title.trim().length > 0),
 terms: input.terms?.filter((t) => t.title.trim().length > 0),
 };

 trimValues(rawData, { deep: true });

 const schema = isUpdate ? updateServiceSchema : createServiceSchema;
 const validated = schema.safeParse(rawData);

 if (!validated.success) {
 return {
 errors: [],
 inputErrors: getObjErrorFromZod(validated.error),
 data: null,
 };
 }

 cleanObj(rawData);

 if (rawData.slug && currentService?.slug !== rawData.slug) {
 const slugExistsResponse = await userServiceService.slugExists(
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
 console.log("RAWDATA", rawData);

 const service = isUpdate
 ? await serviceService.update(
 currentService.id,
 rawData as UpdateServiceInputWithFile,
 )
 : await serviceService.create(rawData as CreateServiceInputWithFile);

 if (service.data) {
 return {
 data: service.data,
 errors: null,
 inputErrors: undefined,
 };
 }

 return {
 data: null,
 errors: getFriendlyApiErrors(service),
 };
};
