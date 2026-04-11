import { hash, compare } from "../hash";

describe("hash", () => {
  it("returns a string", async () => {
    const result = await hash("password");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
  it("produces different hashes for same password (salt)", async () => {
    const a = await hash("password");
    const b = await hash("password");
    expect(a).not.toBe(b);
  });
});

describe("compare", () => {
  it("returns true for matching password and hash", async () => {
    const password = "mySecret123";
    const hashed = await hash(password);
    expect(await compare(password, hashed)).toBe(true);
  });
  it("returns false for wrong password", async () => {
    const hashed = await hash("correct");
    expect(await compare("wrong", hashed)).toBe(false);
  });
});
