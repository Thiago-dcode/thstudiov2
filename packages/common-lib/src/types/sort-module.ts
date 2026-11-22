/**
 * One row of a sort request. `module_id` is the row id of whichever sortable table is being
 * sorted (portfolios, collections and services; clients later).
 */
export type SortModuleItem = {
  module_id: number;
  position: number;
};

/** Body of a `PATCH /<module>/sort` request. A partial list is allowed: rows not sent keep their position. */
export type SortModulesInput = {
  items: SortModuleItem[];
};

/** `updated_count` is the number of rows whose position actually changed. */
export type SortModulesResult = {
  updated_count: number;
};
