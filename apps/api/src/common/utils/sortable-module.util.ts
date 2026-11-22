import { BadRequestException } from '@nestjs/common';
import type { TableName } from '@repo/common-lib/types/database';
import type { SortModuleItem, SortModulesResult } from '@repo/common-lib/types/sort-module';
import type { ModuleStatus, ModuleStatusInput } from '@repo/common-lib/types/module-status';
import { classifyOwnedIds } from 'src/common/utils/owned-ids.util';
import {
  hasModuleStatusChange,
  type UpdateModuleStatusRequest,
} from 'src/common/requests/update-module-status.request';
import type { ApiLogger } from 'src/common/services/request.service';

/**
 * Words the shared flows use in their messages, so each module keeps its own wording
 * (`Portfolio reorder started`, `Collection status update targeted a foreign collection`).
 */
export type SortableModuleLabels = {
  /** Capitalised singular: `Service`. */
  subject: string;
  /** Lowercase plural: `services`. */
  plural: string;
  /** Log key for the row id: `service_id`. */
  idKey: string;
};

/**
 * Saves the order the artist dragged their items into. A partial list is allowed: rows that
 * are not sent keep their position. Another owner's id is answered exactly like a missing one,
 * so the response is not an ownership oracle, but it is logged `critical` because the UI can
 * only ever send the caller's own ids.
 *
 * Pure orchestration: the module supplies the write and whatever must happen after a change
 * (caches, edge purge) through `onChanged`, which runs only when a row really moved.
 */
export async function reorderOwnedModules(args: {
  labels: SortableModuleLabels;
  table: TableName;
  log: ApiLogger;
  userId: number;
  items: SortModuleItem[];
  write: (userId: number, items: SortModuleItem[]) => Promise<number>;
  onChanged: (userId: number) => Promise<void> | void;
}): Promise<SortModulesResult> {
  const { labels, table, log, userId, items, write, onChanged } = args;
  const itemCount = items.length;
  log.info(`${labels.subject} reorder started`, { user_id: userId, item_count: itemCount });

  const { missing, foreign } = await classifyOwnedIds(
    table,
    items.map((item) => item.module_id),
    userId,
  );
  if (foreign.length) {
    // Counts only: never the other owner's ids.
    log.critical(`${labels.subject} reorder targeted foreign ${labels.plural}`, {
      user_id: userId,
      item_count: itemCount,
      foreign_count: foreign.length,
      step: 'ownership',
    });
    throw new BadRequestException(`${labels.subject} not found`);
  }
  if (missing.length) {
    throw new BadRequestException(`${labels.subject} not found`);
  }

  const updatedCount = await write(userId, items);
  if (updatedCount > 0) {
    await onChanged(userId);
  }

  log.success(`${labels.subject} reorder completed`, {
    user_id: userId,
    item_count: itemCount,
    updated_count: updatedCount,
  });
  return { updated_count: updatedCount };
}

/**
 * Quick toggle of `is_highlight` / `is_active` from the atelier card. Unlike a full update it
 * rewrites nothing else, so the module's `onChanged` mirrors only the side effects those two
 * flags have (highlight-count cache, SEO-metadata cache, edge purge). It runs only when the
 * repository reports a changed row; a no-op returns the current values.
 *
 * A foreign id is answered like a missing one (not an ownership oracle) but logged `critical`.
 */
export async function updateOwnedModuleStatus<
  T extends { user_id: number; slug: string; is_highlight: boolean; is_active: boolean },
>(args: {
  labels: SortableModuleLabels;
  log: ApiLogger;
  userId: number;
  id: number;
  request: UpdateModuleStatusRequest;
  getCurrent: (id: number) => Promise<T | null>;
  enforceHighlightLimit: (
    userId: number,
    isHighlight: boolean | undefined,
    current: boolean,
  ) => Promise<void>;
  write: (id: number, userId: number, input: ModuleStatusInput) => Promise<ModuleStatus | null>;
  onChanged: (current: T) => Promise<void> | void;
}): Promise<ModuleStatus> {
  const { labels, log, userId, id, request, getCurrent, enforceHighlightLimit, write, onChanged } = args;
  if (!hasModuleStatusChange(request)) {
    throw new BadRequestException('Nothing to update');
  }
  const fields = (['is_highlight', 'is_active'] as const).filter((key) => request[key] !== undefined);
  log.info(`${labels.subject} status update started`, {
    user_id: userId,
    [labels.idKey]: id,
    fields: fields.join(','),
  });

  const current = await getCurrent(id);
  if (!current) {
    throw new BadRequestException(`${labels.subject} not found`);
  }
  if (current.user_id !== userId) {
    log.critical(`${labels.subject} status update targeted a foreign ${labels.subject.toLowerCase()}`, {
      user_id: userId,
      [labels.idKey]: id,
      step: 'ownership',
    });
    throw new BadRequestException(`${labels.subject} not found`);
  }

  await enforceHighlightLimit(userId, request.is_highlight, current.is_highlight);

  const updated = await write(id, userId, request);
  const result: ModuleStatus = updated ?? {
    id,
    is_highlight: current.is_highlight,
    is_active: current.is_active,
  };

  if (updated) {
    await onChanged(current);
  }

  log.success(`${labels.subject} status updated`, {
    user_id: userId,
    [labels.idKey]: id,
    is_highlight: result.is_highlight,
    is_active: result.is_active,
    changed: updated !== null,
  });
  return result;
}
