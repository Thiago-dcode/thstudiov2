"use client";

import type { GenerateMediaMetadataInput } from "@repo/common-lib/types/ai";
import type {
  CreateMediaInputWithFile,
  Media,
  UpdateMediaInput,
} from "@repo/common-lib/types/media";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import { clientTranslator } from "@/lib/i18n/client-translator";
import { toActionReturn } from "@/lib/services/to-action-return";
import {
  getObjErrorFromZod,
  type Translator,
} from "@/lib/validation/zod-helpers";
import aiClientService from "@/modules/ai/ai.client.service";
import mediaClientService, {
  type CreateMediaBody,
} from "../media.client.service";
import { createMediaSchema, updateMediaSchema } from "../schemas/media-shemas";
import { revalidateUserMediaAction } from "../server-actions/revalidate-user-media.action";
import { validateMediaFile } from "../validation/media-file.validation";

/**
 * These calls go from the browser straight to the API. They used to hop through a Next route
 * handler, which had to hold the whole upload in memory twice — once to parse the incoming
 * multipart body, once to re-encode it for the API — for no benefit: the API does not require
 * the app token, and it authenticates the same bearer token either way.
 *
 * The three exported signatures are unchanged, so `media.provider.tsx` consumes them exactly as
 * before. What the route handler did beyond proxying — zod validation, the per-type file caps,
 * and the cache-tag revalidation — moved here rather than being dropped.
 *
 * Every one of those extras needs translated copy, and `clientTranslator()` is null until a
 * client component has registered one (`MediaProvider` does). When it is, each check is skipped
 * rather than emitting an untranslated string: the API validates the same rules and answers in
 * the caller's language, so the user still gets a real message.
 */

const REVALIDATE_DEBOUNCE_MS = 1500;

let revalidateTimer: ReturnType<typeof setTimeout> | null = null;
let revalidateUserId: number | null = null;

/**
 * Coalesces the revalidation across a batch.
 *
 * A server action is not a route handler: Next attaches the re-rendered RSC tree to its
 * response and the router applies it, so firing one per file would refresh the atelier page
 * once per upload while the rest are still in flight. The route handler this replaces had no
 * such effect, so the debounce is what keeps the behaviour equivalent.
 */
const scheduleUserMediaRevalidation = (userId: number | null | undefined) => {
  if (!userId) return;
  revalidateUserId = userId;
  if (revalidateTimer) clearTimeout(revalidateTimer);
  revalidateTimer = setTimeout(() => {
    revalidateTimer = null;
    const id = revalidateUserId;
    revalidateUserId = null;
    if (id) void revalidateUserMediaAction(id);
  }, REVALIDATE_DEBOUNCE_MS);
};

const inputErrorsReturn = <T, K>(
  inputErrors: Record<string, string>,
  inputs: K,
): ActionReturn<T, K> => ({
  data: null,
  errors: [],
  inputErrors,
  inputs,
});

/**
 * Runs the schema only when there is a translator to build its messages with. Returns the
 * validated payload, an `inputErrors` map, or `undefined` for "not checked here".
 */
const validateWith = <S extends { safeParse: (v: unknown) => any }>(
  schema: (t: Translator) => S,
  t: Translator | null,
  candidate: unknown,
): { data?: unknown; inputErrors?: Record<string, string> } => {
  if (!t) return {};
  const result = schema(t).safeParse(candidate);
  return result.success
    ? { data: result.data }
    : { inputErrors: getObjErrorFromZod(result.error) };
};

export async function createMediaApi(
  input: CreateMediaInputWithFile,
): Promise<ActionReturn<Media, CreateMediaInputWithFile>> {
  const t = clientTranslator();

  const fileError = validateMediaFile(input.file, t);
  if (fileError) {
    return inputErrorsReturn<Media, CreateMediaInputWithFile>(fileError, input);
  }

  // Cloned before trimming: `trimValues` mutates in place, and `input` is React state owned by
  // the media provider.
  const { file, ...fields } = input;
  const candidate = trimValues({ ...fields }, { deep: true });

  const { data, inputErrors } = validateWith(createMediaSchema, t, candidate);
  if (inputErrors) {
    return inputErrorsReturn<Media, CreateMediaInputWithFile>(
      inputErrors,
      input,
    );
  }

  const validated = (data ?? candidate) as CreateMediaBody;
  const { generate_metadata, ...rest } = validated;

  const body = cleanObj({
    ...rest,
    file,
    // Only sent when explicitly requested: the API treats an absent field as "no AI
    // generation", so forwarding `false` would be equivalent but noisier.
    generate_metadata: generate_metadata || undefined,
  }) as CreateMediaBody;

  const result = toActionReturn<Media, CreateMediaInputWithFile>(
    await mediaClientService.createAsync(body),
    input,
  );
  if (result.data) scheduleUserMediaRevalidation(rest.user_id);
  return result;
}

export async function updateMediaApi(
  id: number,
  input: UpdateMediaInput,
): Promise<ActionReturn<Media, UpdateMediaInput>> {
  const t = clientTranslator();

  const candidate = trimValues({ ...input }, { deep: true });

  const { data, inputErrors } = validateWith(updateMediaSchema, t, candidate);
  if (inputErrors) {
    return inputErrorsReturn<Media, UpdateMediaInput>(inputErrors, input);
  }

  const validated = (data ?? candidate) as UpdateMediaInput;
  const cleaned: UpdateMediaInput = {};
  for (const [key, value] of Object.entries(validated)) {
    if (value !== null && value !== undefined) {
      cleaned[key as keyof UpdateMediaInput] = value as never;
    }
  }
  cleanObj(cleaned);

  // The API's update fields are all optional and its validation pipe whitelists unknown keys
  // away, so an empty body would be accepted and would enqueue a no-op update job.
  if (!Object.keys(cleaned).length) {
    return t
      ? inputErrorsReturn<Media, UpdateMediaInput>(
          { _form: t("actions.noFieldsToUpdate") },
          input,
        )
      : { data: null, errors: [], inputErrors: undefined, inputs: input };
  }

  const result = toActionReturn<Media, UpdateMediaInput>(
    await mediaClientService.updateAsync(id, cleaned),
    input,
  );
  // `UpdateMediaInput` carries no `user_id`, so the owner comes off the updated row.
  if (result.data) scheduleUserMediaRevalidation(result.data.user_id);
  return result;
}

export async function generateMediaMetadataApi(
  input: GenerateMediaMetadataInput,
): Promise<ActionReturn<Media, GenerateMediaMetadataInput>> {
  const t = clientTranslator();

  // Cheap pre-check: the API rejects these too, but not before spending the round trip.
  if (t && (!input.user_id || !input.media_id)) {
    const inputErrors: Record<string, string> = {};
    if (!input.user_id) {
      inputErrors.user_id = t("validation.required", {
        field: t("fields.userId"),
      });
    }
    if (!input.media_id) {
      inputErrors.media_id = t("validation.required", {
        field: t("fields.mediaId"),
      });
    }
    return inputErrorsReturn<Media, GenerateMediaMetadataInput>(
      inputErrors,
      input,
    );
  }

  const result = toActionReturn<Media, GenerateMediaMetadataInput>(
    await aiClientService.generateMediaMetadata(input),
    input,
  );
  // Generation spends AI credits, so the cached credit budget has to be refreshed too.
  if (result.data) scheduleUserMediaRevalidation(input.user_id);
  return result;
}
