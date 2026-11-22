import { isHiddenFromPublic } from "../public-entity";
import { DEFAULT_SORT_POSITION, MAX_SORT_MODULE_ITEMS } from "../../constants/sort-module";

describe("isHiddenFromPublic (AC-24, shared by api and web)", () => {
  it("is visible when active and not blocked", () => {
    expect(isHiddenFromPublic({ is_active: true, blocked_at: null })).toBe(false);
    expect(isHiddenFromPublic({ is_active: true })).toBe(false);
  });

  it("is hidden when inactive", () => {
    expect(isHiddenFromPublic({ is_active: false, blocked_at: null })).toBe(true);
  });

  it("is hidden when is_active is missing or null (fail closed)", () => {
    expect(isHiddenFromPublic({})).toBe(true);
    expect(isHiddenFromPublic({ is_active: null })).toBe(true);
  });

  it("is hidden when blocked, even if active", () => {
    expect(isHiddenFromPublic({ is_active: true, blocked_at: new Date() })).toBe(true);
    expect(isHiddenFromPublic({ is_active: true, blocked_at: "2026-01-01T00:00:00Z" })).toBe(true);
  });
});

describe("sort-module constants (AC-11)", () => {
  it("explicit positions always stay below the DB default so new rows land after ordered ones", () => {
    expect(DEFAULT_SORT_POSITION).toBe(999);
    expect(MAX_SORT_MODULE_ITEMS).toBe(200);
    expect(MAX_SORT_MODULE_ITEMS - 1).toBeLessThan(DEFAULT_SORT_POSITION);
  });
});
