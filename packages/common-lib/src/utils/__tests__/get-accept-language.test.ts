import { getAcceptLanguage } from "../get-accept-language";

describe("getAcceptLanguage", () => {
  it("returns null when acceptLanguage is undefined", () => {
    expect(getAcceptLanguage(undefined)).toBeNull();
  });
  it("returns null when acceptLanguage is null", () => {
    expect(getAcceptLanguage(null)).toBeNull();
  });
  it("returns primary language code from single value", () => {
    expect(getAcceptLanguage("en")).toBe("EN");
    expect(getAcceptLanguage("es")).toBe("ES");
  });
  it("returns primary language from first locale (locale-region)", () => {
    expect(getAcceptLanguage("en-US")).toBe("EN");
    expect(getAcceptLanguage("es-ES")).toBe("ES");
  });
  it("uses first language when multiple in header", () => {
    expect(getAcceptLanguage("en-US,es;q=0.9")).toBe("EN");
  });
  it("returns uppercase language code", () => {
    expect(getAcceptLanguage("pt")).toBe("PT");
  });
});
