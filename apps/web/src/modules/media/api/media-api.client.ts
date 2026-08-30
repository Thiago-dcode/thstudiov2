import type { GenerateMediaMetadataInput } from "@repo/common-lib/types/ai";
import type {
  CreateMediaInputWithFile,
  Media,
  UpdateMediaInput,
} from "@repo/common-lib/types/media";
import type { ActionReturn } from "@repo/common-lib/types/response";

function buildMediaFormData(input: CreateMediaInputWithFile): FormData {
  const formData = new FormData();
  const { file, ...fields } = input;

  if (file) {
    formData.append("file", file);
  }

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    formData.append(key, String(value));
  }

  return formData;
}

async function parseResponse<T, K = Record<string, any>>(
  response: Response,
): Promise<ActionReturn<T, K>> {
  const json = await response.json();
  return json as ActionReturn<T, K>;
}

export async function createMediaApi(
  input: CreateMediaInputWithFile,
): Promise<ActionReturn<Media, CreateMediaInputWithFile>> {
  try {
    const formData = buildMediaFormData(input);
    const response = await fetch("/api/media", {
      method: "POST",
      body: formData,
    });
    return await parseResponse<Media, CreateMediaInputWithFile>(response);
  } catch (error) {
    return {
      data: null,
      errors: [
        error instanceof Error ? error.message : "Failed to create media",
      ],
    };
  }
}

export async function updateMediaApi(
  id: number,
  input: UpdateMediaInput,
): Promise<ActionReturn<Media, UpdateMediaInput>> {
  try {
    const response = await fetch(`/api/media/${id}/async`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return await parseResponse<Media>(response);
  } catch (error) {
    return {
      data: null,
      errors: [
        error instanceof Error ? error.message : "Failed to update media",
      ],
    };
  }
}

export async function generateMediaMetadataApi(
  input: GenerateMediaMetadataInput,
): Promise<ActionReturn<Media, GenerateMediaMetadataInput>> {
  try {
    const response = await fetch("/api/media/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return await parseResponse<Media, GenerateMediaMetadataInput>(response);
  } catch (error) {
    return {
      data: null,
      errors: [
        error instanceof Error ? error.message : "Failed to generate metadata",
      ],
    };
  }
}
