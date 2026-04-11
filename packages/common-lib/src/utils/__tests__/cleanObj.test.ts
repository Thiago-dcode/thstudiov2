import { cleanObj, trimValues } from "../cleanObj";

describe("cleanObj", () => {
  it("removes undefined keys", () => {
    const obj = { a: 1, b: undefined, c: "x" };
    cleanObj(obj);
    expect(obj).toEqual({ a: 1, c: "x" });
  });
  it("keeps null when includeNull is not set", () => {
    const obj = { a: null, b: 2 };
    cleanObj(obj);
    expect(obj).toEqual({ a: null, b: 2 });
  });
  it("removes null when includeNull is true", () => {
    const obj = { a: null, b: 2 };
    cleanObj(obj, { includeNull: true });
    expect(obj).toEqual({ b: 2 });
  });
  it("mutates object in place", () => {
    const obj = { x: undefined };
    cleanObj(obj);
    expect(obj).toEqual({});
  });
  it("does nothing to empty object", () => {
    const obj = {};
    cleanObj(obj);
    expect(obj).toEqual({});
  });
  it("removes all keys when all undefined", () => {
    const obj = { a: undefined, b: undefined };
    cleanObj(obj);
    expect(obj).toEqual({});
  });
  it("with includeNull: true, removes both undefined and null", () => {
    const obj = { a: undefined, b: null, c: 0 };
    cleanObj(obj, { includeNull: true });
    expect(obj).toEqual({ c: 0 });
  });
  it("with includeNull: true, keeps falsy non-null values", () => {
    const obj = { a: null, b: 0, c: "", d: false };
    cleanObj(obj, { includeNull: true });
    expect(obj).toEqual({ b: 0, c: "", d: false });
  });
  it("leaves nested objects untouched (shallow only)", () => {
    const obj = { top: "ok", nested: { inner: undefined } };
    cleanObj(obj);
    expect(obj).toEqual({ top: "ok", nested: { inner: undefined } });
  });
});

describe("trimValues", () => {
  it("trims string values", () => {
    const obj = { a: "  foo  ", b: "bar\n" };
    trimValues(obj);
    expect(obj).toEqual({ a: "foo", b: "bar" });
  });
  it("leaves non-strings unchanged", () => {
    const obj = { n: 1, b: true, o: { x: 1 } };
    trimValues(obj);
    expect(obj).toEqual({ n: 1, b: true, o: { x: 1 } });
  });
  it("when deep, trims nested string values", () => {
    const obj = { a: "  x  ", nested: { b: "  y  " } };
    trimValues(obj, { deep: true });
    expect(obj).toEqual({ a: "x", nested: { b: "y" } });
  });
  it("when deep, does not trim inside arrays (objects only)", () => {
    const obj = { arr: ["  a  "] };
    trimValues(obj, { deep: true });
    expect(obj.arr[0]).toBe("  a  ");
  });
  it("trims tabs and carriage returns", () => {
    const obj = { a: "\t\r\n  x  \t\r\n" };
    trimValues(obj);
    expect(obj.a).toBe("x");
  });
  it("empty string stays empty", () => {
    const obj = { a: "" };
    trimValues(obj);
    expect(obj.a).toBe("");
  });
  it("whitespace-only string becomes empty", () => {
    const obj = { a: "   \t\n  " };
    trimValues(obj);
    expect(obj.a).toBe("");
  });
  it("does nothing to empty object", () => {
    const obj = {};
    trimValues(obj);
    expect(obj).toEqual({});
  });
  it("when deep: false or omitted, does not trim inside nested objects", () => {
    const obj = { top: "  a  ", nested: { inner: "  b  " } };
    trimValues(obj);
    expect(obj.top).toBe("a");
    expect(obj.nested.inner).toBe("  b  ");
  });
  it("when deep, trims multiple levels of nesting", () => {
    const obj = {
      a: "  x  ",
      level1: { b: "  y  ", level2: { c: "  z  " } },
    };
    trimValues(obj, { deep: true });
    expect(obj.a).toBe("x");
    expect(obj.level1.b).toBe("y");
    expect(obj.level1.level2.c).toBe("z");
  });
  it("when deep, trims sibling nested objects", () => {
    const obj = {
      first: { a: "  x  " },
      second: { b: "  y  " },
    };
    trimValues(obj, { deep: true });
    expect(obj.first.a).toBe("x");
    expect(obj.second.b).toBe("y");
  });
  it("when deep, leaves Date instances unchanged", () => {
    const date = new Date("2021-01-01");
    const obj = { d: date, s: "  trim  " };
    trimValues(obj, { deep: true });
    expect(obj.d).toBe(date);
    expect(obj.s).toBe("trim");
  });
  it("when deep, leaves array reference unchanged (does not recurse into array)", () => {
    const arr = ["  a  ", "  b  "];
    const obj = { arr };
    trimValues(obj, { deep: true });
    expect(obj.arr).toBe(arr);
    expect(obj.arr[0]).toBe("  a  ");
    expect(obj.arr[1]).toBe("  b  ");
  });
  it("when deep, object nested inside array is not recursed into", () => {
    const obj = { items: [{ name: "  x  " }] };
    trimValues(obj, { deep: true });
    expect(obj.items[0].name).toBe("  x  ");
  });
});
