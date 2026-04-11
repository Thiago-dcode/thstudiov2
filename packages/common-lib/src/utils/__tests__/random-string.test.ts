import { randomStr } from "../random-string";

describe("randomStr", () => {
  it("returns string of requested length", () => {
    expect(randomStr(0).length).toBe(0);
    expect(randomStr(5).length).toBe(5);
    expect(randomStr(100).length).toBe(100);
  });
  it("returns only alphanumeric characters", () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const result = randomStr(50);
    for (const c of result) {
      expect(chars).toContain(c);
    }
  });
  it("produces different strings on multiple calls", () => {
    const a = randomStr(20);
    const b = randomStr(20);
    expect(a).not.toBe(b);
  });
});
