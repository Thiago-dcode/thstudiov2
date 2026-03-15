import { calculatePrice, getMonthlyPrice, getLowestMontlyPrice, getHighestMontlyPrice } from "../calculatePrice";
import type { PlanPrice } from "../../types/plan-price";

const price = (billing_type: PlanPrice["billing_type"], price: number): PlanPrice =>
  ({ billing_type, price } as PlanPrice);

describe("calculatePrice", () => {
  it("returns price as-is for MONTHLY", () => {
    expect(calculatePrice(price("MONTHLY", 10))).toBe(10);
  });
  it("returns price * 3 for QUARTERLY", () => {
    expect(calculatePrice(price("QUARTERLY", 10))).toBe(30);
  });
  it("returns price * 12 for YEARLY", () => {
    expect(calculatePrice(price("YEARLY", 10))).toBe(120);
  });
  it("returns price * 36 for LIFETIME", () => {
    expect(calculatePrice(price("LIFETIME", 10))).toBe(360);
  });
});

describe("getMonthlyPrice", () => {
  it("returns price as-is for MONTHLY", () => {
    expect(getMonthlyPrice(price("MONTHLY", 12))).toBe(12);
  });
  it("returns price / 3 for QUARTERLY", () => {
    expect(getMonthlyPrice(price("QUARTERLY", 30))).toBe(10);
  });
  it("returns price / 12 for YEARLY", () => {
    expect(getMonthlyPrice(price("YEARLY", 120))).toBe(10);
  });
  it("returns price for LIFETIME (fallback)", () => {
    expect(getMonthlyPrice(price("LIFETIME", 360))).toBe(360);
  });
});

describe("getLowestMontlyPrice", () => {
  it("prefers YEARLY and returns its monthly equivalent", () => {
    const prices = [
      price("MONTHLY", 15),
      price("QUARTERLY", 36),
      price("YEARLY", 96),
    ];
    expect(getLowestMontlyPrice(prices)).toBe(8); // 96/12
  });
  it("uses first price when no YEARLY", () => {
    const prices = [price("MONTHLY", 12), price("QUARTERLY", 30)];
    expect(getLowestMontlyPrice(prices)).toBe(12);
  });
  it("converts QUARTERLY to monthly when it is the only/lowest", () => {
    const prices = [price("QUARTERLY", 30)];
    expect(getLowestMontlyPrice(prices)).toBe(10);
  });
});

describe("getHighestMontlyPrice", () => {
  it("returns 0 for empty array", () => {
    expect(getHighestMontlyPrice([])).toBe(0);
  });
  it("returns max monthly equivalent across billing types", () => {
    const prices = [
      price("MONTHLY", 10),
      price("QUARTERLY", 36), // 12/mo
      price("YEARLY", 120),  // 10/mo
      price("LIFETIME", 360), // 10/mo
    ];
    expect(getHighestMontlyPrice(prices)).toBe(12);
  });
  it("handles single price", () => {
    expect(getHighestMontlyPrice([price("MONTHLY", 5)])).toBe(5);
  });
});
