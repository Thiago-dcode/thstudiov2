"use server";

import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import type {
  AboutPage,
  CreateAboutPageInputWithFile,
  UpdateAboutPageInputWithFile,
} from "@repo/common-lib/types/about-page";
import type { MimeTypes } from "@repo/common-lib/types/general";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import {
  getFriendlyApiErrors,
  getObjErrorFromZod,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import aboutPageService from "../about-page.service";
import {
  createAboutPageSchema,
  updateAboutPageSchema,
} from "../schemas/about-page.shemas";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const createAboutPageAction = async (
  formData: FormData,
): Promise<
  ActionReturn<
    AboutPage,
    {
      title?: string;
      description?: string;
      photo?: File;
    }
  >
> => {
  const session = await requireSession();
  if (!session) {
    return unauthorizedActionReturn<
      AboutPage,
      { title?: string; description?: string; photo?: File }
    >();
  }

  // Bind ownership to the session — ignore any client-supplied user_id.
  const rawData: CreateAboutPageInputWithFile = {
    description: (formData.get("description") as string) ?? "",
    title: (formData.get("title") as string) ?? "",
    user_id: session.id,
  };
  trimValues(rawData, {
    deep: true,
  });
  const validated = createAboutPageSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      errors: [],
      inputErrors: getObjErrorFromZod(validated.error),
      data: null,
      inputs: validated.data,
    };
  }

  cleanObj(rawData);
  const photoFile = formData.get("photo") as File | null;
  // Validate avatar file if provided
  if (photoFile && photoFile.size > 0) {
    if (photoFile.size > MAX_FILE_SIZE) {
      return {
        errors: [],
        inputErrors: { photo: "Photo file size must be less than 10MB" },
        data: null,
        inputs: validated.data,
      };
    }
    if (!ALLOWED_IMAGE_FILE_TYPES.includes(photoFile.type as MimeTypes)) {
      return {
        errors: [],
        inputErrors: { photo: "Photo must be an image (JPEG, PNG or WebP)" },
        data: null,
        inputs: validated.data,
      };
    }
    rawData.photo = photoFile;
  }

  const aboutPage = await aboutPageService.create(rawData);

  if (aboutPage.data) {
    return {
      data: aboutPage.data,
      errors: null,
      inputErrors: undefined,
    };
  }

  return {
    data: null,
    errors: getFriendlyApiErrors(aboutPage),
  };
};
export const updateAboutPageAction = async (
  id: number,
  formData: FormData,
): Promise<
  ActionReturn<
    AboutPage,
    {
      title?: string;
      description?: string;
      photo?: File;
    }
  >
> => {
  // Real ownership of `id` is validated against the about-page row on the API
  // (aboutPageService.update); this only needs to confirm the caller is signed in.
  const session = await requireSession();
  if (!session) {
    return unauthorizedActionReturn<
      AboutPage,
      { title?: string; description?: string; photo?: File }
    >();
  }

  const rawData: UpdateAboutPageInputWithFile = {
    description: (formData.get("description") as string) ?? "",
    title: (formData.get("title") as string) ?? "",
  };
  trimValues(rawData, {
    deep: true,
  });
  const validated = updateAboutPageSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      errors: [],
      inputErrors: getObjErrorFromZod(validated.error),
      data: null,
    };
  }
  cleanObj(rawData);
  const photoFile = formData.get("photo") as File | null;
  // Validate avatar file if provided
  if (photoFile && photoFile.size > 0) {
    if (photoFile.size > MAX_FILE_SIZE) {
      return {
        errors: [],
        inputErrors: { photo: "Photo file size must be less than 10MB" },
        data: null,
        inputs: validated.data,
      };
    }
    if (!ALLOWED_IMAGE_FILE_TYPES.includes(photoFile.type as MimeTypes)) {
      return {
        errors: [],
        inputErrors: { photo: "Photo must be an image (JPEG, PNG or WebP)" },
        data: null,
        inputs: validated.data,
      };
    }
    rawData.photo = photoFile;
  }

  const aboutPage = await aboutPageService.update(id, rawData);

  if (aboutPage.data) {
    return {
      data: aboutPage.data,
      errors: null,
      inputs: validated.data,
      inputErrors: undefined,
    };
  }

  return {
    data: null,
    errors: getFriendlyApiErrors(aboutPage),
  };
};
