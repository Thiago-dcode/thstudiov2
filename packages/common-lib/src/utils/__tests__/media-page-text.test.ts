import { resolveMediaPageText } from "../media-page-text";

describe("resolveMediaPageText", () => {
  it("prefers the artist's own title and description", () => {
    expect(
      resolveMediaPageText({
        title: "Facade",
        description: "Madrid, winter.",
        seo_title: "AI title",
        seo_description: "AI description",
      }),
    ).toEqual({ title: "Facade", description: "Madrid, winter." });
  });

  it("falls back to the AI SEO copy when the artist wrote nothing", () => {
    expect(
      resolveMediaPageText({
        title: null,
        description: null,
        seo_title: "Architecture Photography Madrid",
        seo_description: "Monochrome facade under a dramatic sky.",
      }),
    ).toEqual({
      title: "Architecture Photography Madrid",
      description: "Monochrome facade under a dramatic sky.",
    });
  });

  it("resolves each field on its own", () => {
    expect(
      resolveMediaPageText({
        title: "Facade",
        description: "",
        seo_title: "AI title",
        seo_description: "AI description",
      }),
    ).toEqual({ title: "Facade", description: "AI description" });
  });

  it("treats whitespace-only artist text as missing and trims the result", () => {
    expect(
      resolveMediaPageText({
        title: "   ",
        description: "\n\t",
        seo_title: "  AI title  ",
        seo_description: " AI description ",
      }),
    ).toEqual({ title: "AI title", description: "AI description" });
  });

  it("returns null for both fields when there is no text at all", () => {
    expect(
      resolveMediaPageText({
        title: null,
        description: undefined,
        seo_title: " ",
        seo_description: null,
      }),
    ).toEqual({ title: null, description: null });
  });
});
