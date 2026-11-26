import {
  getMonthlyPrice,
  getLowestMontlyPrice,
  getPurchasablePrices,
  getYearlySaving,
  toMinorUnits,
} from "../calculatePrice";
import type { PlanPrice } from "../../types/plan-price";

const price = (
  billing_type: PlanPrice["billing_type"],
  price: number,
  is_active = true,
): PlanPrice => ({ billing_type, price, is_active } as PlanPrice);

describe("toMinorUnits", () => {
  it("converts the seeded yearly amounts exactly", () => {
    expect(toMinorUnits(57.6)).toBe(5760);
    expect(toMinorUnits(86.4)).toBe(8640);
  });
  it("rounds away float noise", () => {
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
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

describe("getPurchasablePrices", () => {
  it("keeps only active MONTHLY and YEARLY rows, MONTHLY first", () => {
    const prices = [
      price("YEARLY", 57.6),
      price("QUARTERLY", 22),
      price("LIFETIME", 0),
      price("MONTHLY", 9, false),
      price("MONTHLY", 6),
    ];
    expect(getPurchasablePrices(prices)).toEqual([
      price("MONTHLY", 6),
      price("YEARLY", 57.6),
    ]);
  });
  it("returns nothing for the free plan", () => {
    expect(getPurchasablePrices([price("LIFETIME", 0)])).toEqual([]);
  });
});

describe("getYearlySaving", () => {
  it("computes the Artist Plus saving (10 months charged, 2 free)", () => {
    expect(getYearlySaving([price("MONTHLY", 6), price("YEARLY", 60)])).toEqual({
      yearlyTotal: 60,
      monthlyEquivalent: 5,
      percent: 17,
    });
  });
  it("computes the Studio saving (10 months charged, 2 free)", () => {
    expect(getYearlySaving([price("MONTHLY", 9), price("YEARLY", 90)])).toEqual({
      yearlyTotal: 90,
      monthlyEquivalent: 7.5,
      percent: 17,
    });
  });
  it("still computes a 20% saving with non-round amounts", () => {
    expect(getYearlySaving([price("MONTHLY", 6), price("YEARLY", 57.6)])).toEqual({
      yearlyTotal: 57.6,
      monthlyEquivalent: 4.8,
      percent: 20,
    });
  });
  it("ignores retired rows", () => {
    expect(
      getYearlySaving([price("MONTHLY", 9, false), price("MONTHLY", 6), price("YEARLY", 60)]),
    ).toMatchObject({ percent: 17, monthlyEquivalent: 5 });
  });
  it("returns null when a row is missing", () => {
    expect(getYearlySaving([price("MONTHLY", 6)])).toBeNull();
    expect(getYearlySaving([price("YEARLY", 57.6)])).toBeNull();
    expect(getYearlySaving([price("MONTHLY", 6), price("YEARLY", 57.6, false)])).toBeNull();
  });
  it("returns null when yearly saves nothing", () => {
    expect(getYearlySaving([price("MONTHLY", 6), price("YEARLY", 72)])).toBeNull();
  });
});
