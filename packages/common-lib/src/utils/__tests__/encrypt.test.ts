import { encrypt, decrypt } from "../encrypt";

const secret = "test-secret-key";

describe("encrypt", () => {
  it("returns a non-empty string", () => {
    const result = encrypt("hello", secret);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
  it("produces different ciphertext for same plaintext (IV varies)", () => {
    const a = encrypt("hello", secret);
    const b = encrypt("hello", secret);
    expect(a).not.toBe(b);
  });
});

describe("decrypt", () => {
  it("decrypts encrypted text back to original", () => {
    const plain = "sensitive data";
    const encrypted = encrypt(plain, secret);
    expect(decrypt(encrypted, secret)).toBe(plain);
  });
  it("returns null or empty string for wrong secret", () => {
    const encrypted = encrypt("hello", secret);
    const result = decrypt(encrypted, "wrong-secret");
    expect(result === null || result === "").toBe(true);
  });
  it("returns null or empty string for invalid ciphertext", () => {
    const result = decrypt("not-valid-base64-or-cipher", secret);
    expect(result === null || result === "").toBe(true);
  });
});
