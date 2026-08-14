import { isAValidSlugFormat } from "../generate-valid-slug";
import {
  allocateUniqueSlug,
  slugBaseFromTitle,
  SlugAllocationError,
} from "../unique-slug";

/** Builds an `exists` predicate over a fixed set of taken slugs, recording every candidate probed. */
const takenSet = (...taken: string[]) => {
  const probed: string[] = [];
  const exists = async (candidate: string) => {
    probed.push(candidate);
    return taken.includes(candidate);
  };
  return { exists, probed };
};

describe("slugBaseFromTitle", () => {
  it("slugifies a plain title", () => {
    expect(slugBaseFromTitle("My Work", "portfolio")).toBe("my-work");
  });

  it("folds diacritics instead of stripping the accented letters", () => {
    // generateValidSlug alone yields "ao-caf" — the fold is what keeps this readable.
    expect(slugBaseFromTitle("Ação Café", "portfolio")).toBe("acao-cafe");
  });

  it("falls back to the prefix for non-Latin titles", () => {
    expect(slugBaseFromTitle("Привет", "portfolio")).toBe("portfolio");
    expect(slugBaseFromTitle("日本", "service")).toBe("service");
    expect(slugBaseFromTitle("🎨", "collection")).toBe("collection");
  });

  it("falls back to the prefix for an empty or whitespace-only title", () => {
    expect(slugBaseFromTitle("", "portfolio")).toBe("portfolio");
    expect(slugBaseFromTitle("   ", "portfolio")).toBe("portfolio");
  });

  it("suffixes the prefix onto titles that slugify below the minimum length", () => {
    expect(slugBaseFromTitle("AB", "service")).toBe("ab-service");
    expect(slugBaseFromTitle("A", "portfolio")).toBe("a-portfolio");
  });

  it("always produces a valid slug format", () => {
    const titles = ["My Work", "Ação Café", "Привет", "🎨", "", "A", "AB", "  hello  "];
    for (const title of titles) {
      expect(isAValidSlugFormat(slugBaseFromTitle(title, "portfolio"))).toBe(true);
    }
  });
});

describe("allocateUniqueSlug", () => {
  it("returns the base when it is free", async () => {
    const { exists } = takenSet();
    await expect(allocateUniqueSlug("my-work", exists)).resolves.toBe("my-work");
  });

  it("appends -2 when the base is taken", async () => {
    const { exists } = takenSet("my-work");
    await expect(allocateUniqueSlug("my-work", exists)).resolves.toBe("my-work-2");
  });

  it("keeps incrementing past consecutive collisions", async () => {
    const { exists } = takenSet("my-work", "my-work-2");
    await expect(allocateUniqueSlug("my-work", exists)).resolves.toBe("my-work-3");
  });

  it("probes each candidate once, in order", async () => {
    const { exists, probed } = takenSet("my-work", "my-work-2");
    await allocateUniqueSlug("my-work", exists);
    expect(probed).toEqual(["my-work", "my-work-2", "my-work-3"]);
  });

  it("throws once maxAttempts is exhausted", async () => {
    const exists = async () => true;
    await expect(
      allocateUniqueSlug("my-work", exists, { maxAttempts: 3 }),
    ).rejects.toBeInstanceOf(SlugAllocationError);
  });

  it("rejects an invalid base without probing", async () => {
    const { exists, probed } = takenSet();
    await expect(allocateUniqueSlug("ab", exists)).rejects.toBeInstanceOf(
      SlugAllocationError,
    );
    expect(probed).toEqual([]);
  });

  it("never returns a slug that fails the format check", async () => {
    const { exists } = takenSet("my-work", "my-work-2", "my-work-3");
    const slug = await allocateUniqueSlug("my-work", exists);
    expect(isAValidSlugFormat(slug)).toBe(true);
  });

  it("composes with slugBaseFromTitle for a fully unslugifiable title", async () => {
    const { exists } = takenSet("portfolio");
    const base = slugBaseFromTitle("Привет", "portfolio");
    await expect(allocateUniqueSlug(base, exists)).resolves.toBe("portfolio-2");
  });
});
