import { extractOauth2GoogleScope } from "../extract-oauth2-scope";

const EMAIL = "https://www.googleapis.com/auth/userinfo.email";
const PROFILE = "https://www.googleapis.com/auth/userinfo.profile";
const DRIVE_FILE = "https://www.googleapis.com/auth/drive.file";

describe("extractOauth2GoogleScope", () => {
  it("parses a space-delimited scope string", () => {
    expect(extractOauth2GoogleScope(`${EMAIL} ${PROFILE}`)).toEqual([EMAIL, PROFILE]);
  });

  it("returns a single known scope", () => {
    expect(extractOauth2GoogleScope(DRIVE_FILE)).toEqual([DRIVE_FILE]);
  });

  it("keeps the input order", () => {
    expect(extractOauth2GoogleScope(`${PROFILE} ${EMAIL}`)).toEqual([PROFILE, EMAIL]);
  });

  it("drops unknown scopes", () => {
    expect(
      extractOauth2GoogleScope(`openid ${EMAIL} https://evil.example/auth/x ${PROFILE}`),
    ).toEqual([EMAIL, PROFILE]);
  });

  it("removes duplicates", () => {
    expect(extractOauth2GoogleScope(`${EMAIL} ${EMAIL} ${PROFILE} ${EMAIL}`)).toEqual([
      EMAIL,
      PROFILE,
    ]);
  });

  it("handles repeated spaces, tabs, newlines and surrounding whitespace", () => {
    expect(extractOauth2GoogleScope(`  ${EMAIL}\t\t${PROFILE}\n `)).toEqual([EMAIL, PROFILE]);
  });

  it("matches exactly: no prefix, suffix, case or partial matches", () => {
    expect(
      extractOauth2GoogleScope(
        [
          `${EMAIL}x`,
          `x${EMAIL}`,
          EMAIL.toUpperCase(),
          "https://www.googleapis.com/auth/userinfo",
          `${EMAIL},${PROFILE}`,
        ].join(" "),
      ),
    ).toEqual([]);
  });

  it("returns [] for empty or whitespace-only input", () => {
    expect(extractOauth2GoogleScope("")).toEqual([]);
    expect(extractOauth2GoogleScope("   \t\n")).toEqual([]);
  });

  it("returns [] for non-string input", () => {
    for (const value of [undefined, null, 42, {}, [EMAIL], true]) {
      expect(extractOauth2GoogleScope(value)).toEqual([]);
    }
  });

  it("ignores prototype property names", () => {
    expect(extractOauth2GoogleScope("constructor __proto__ toString length")).toEqual([]);
  });
});
