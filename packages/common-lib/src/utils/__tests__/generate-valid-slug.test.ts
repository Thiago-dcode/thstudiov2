import { generateValidSlug, isAValidSlugFormat } from "../generate-valid-slug";

describe("generateValidSlug", () => {
  it("returns empty string for empty input", () => {
    expect(generateValidSlug("")).toBe("");
  });
  it("lowercases and replaces spaces with hyphens", () => {
    expect(generateValidSlug("Hello World")).toBe("hello-world");
  });
  it("strips special characters", () => {
    expect(generateValidSlug("Hello! @World#")).toBe("hello-world");
  });
  it("collapses multiple hyphens", () => {
    expect(generateValidSlug("hello---world")).toBe("hello-world");
  });
  it("removes leading hyphens", () => {
    expect(generateValidSlug("--hello")).toBe("hello");
  });
  it("removes trailing hyphens by default", () => {
    expect(generateValidSlug("hello--")).toBe("hello");
  });
  it("preserves trailing hyphen when preserveTrailingHyphen is true", () => {
    expect(generateValidSlug("hello-", { preserveTrailingHyphen: true })).toBe("hello-");
  });
  it("replaces underscores with hyphens", () => {
    expect(generateValidSlug("hello_world")).toBe("hello-world");
  });
});

describe("isAValidSlugFormat", () => {
  it("returns false for empty or whitespace", () => {
    expect(isAValidSlugFormat("")).toBe(false);
    expect(isAValidSlugFormat("   ")).toBe(false);
  });
  it("returns false for too short (< 3)", () => {
    expect(isAValidSlugFormat("ab")).toBe(false);
    expect(isAValidSlugFormat("a")).toBe(false);
  });
  it("returns true for valid slug", () => {
    expect(isAValidSlugFormat("abc")).toBe(true);
    expect(isAValidSlugFormat("my-valid-slug")).toBe(true);
    expect(isAValidSlugFormat("slug123")).toBe(true);
  });
  it("returns false for uppercase", () => {
    expect(isAValidSlugFormat("My-Slug")).toBe(false);
  });
  it("returns false for leading or trailing hyphen", () => {
    expect(isAValidSlugFormat("-slug")).toBe(false);
    expect(isAValidSlugFormat("slug-")).toBe(false);
  });
  it("returns false for consecutive hyphens", () => {
    expect(isAValidSlugFormat("my--slug")).toBe(false);
  });
  it("returns false for invalid characters", () => {
    expect(isAValidSlugFormat("my_slug")).toBe(false);
    expect(isAValidSlugFormat("my slug")).toBe(false);
  });
  it("returns false for non-string", () => {
    expect(isAValidSlugFormat(null as unknown as string)).toBe(false);
    expect(isAValidSlugFormat(123 as unknown as string)).toBe(false);
  });
});
