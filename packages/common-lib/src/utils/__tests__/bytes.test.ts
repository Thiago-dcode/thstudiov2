import { bytesToMB, mbToBytes } from "../bytes";

describe("bytesToMB", () => {
  it("converts bytes to megabytes", () => {
    expect(bytesToMB(1024 * 1024)).toBe(1);
    expect(bytesToMB(5 * 1024 * 1024)).toBe(5);
  });
  it("handles zero", () => {
    expect(bytesToMB(0)).toBe(0);
  });
});

describe("mbToBytes", () => {
  it("converts megabytes to bytes", () => {
    expect(mbToBytes(1)).toBe(1024 * 1024);
    expect(mbToBytes(5)).toBe(5 * 1024 * 1024);
  });
  it("handles zero", () => {
    expect(mbToBytes(0)).toBe(0);
  });
  it("round-trips with bytesToMB", () => {
    const mb = 3;
    expect(bytesToMB(mbToBytes(mb))).toBe(mb);
  });
});
