import { describe, expect, it } from "vitest";
import { CsvError, parseCsv, type TabularLimits } from "./csv";

// Test budgets, not approved product upload limits. Callers must supply policy.
const limits: TabularLimits = {
  maxBytes: 2048,
  maxRows: 3,
  maxColumns: 3,
  maxCellCharacters: 40,
};
const encode = (source: string) => new TextEncoder().encode(source);

describe("bounded CSV parsing", () => {
  it("preserves UTF-8, leading zeros, quotes, commas and embedded newlines", () => {
    expect(
      parseCsv(
        encode(
          '\uFEFFcode,name,note\r\n001,Élodie,"a,b"\r\n002,"A ""B""","line\n2"\r\n',
        ),
        limits,
      ),
    ).toEqual({
      headers: ["code", "name", "note"],
      rows: [
        ["001", "Élodie", "a,b"],
        ["002", 'A "B"', "line\n2"],
      ],
    });
  });

  it("preserves whitespace and formula-like text without evaluating it", () => {
    expect(
      parseCsv(encode("name,phone\n A ,+22812345678"), limits).rows,
    ).toEqual([[" A ", "+22812345678"]]);
    expect(parseCsv(encode("value\n=1+1"), limits).rows).toEqual([["=1+1"]]);
  });

  it.each([
    ['name\n"unfinished', "invalid_csv"],
    ['name\na"b', "invalid_csv"],
    ['name\n"a"suffix', "invalid_csv"],
    ["name\na\0b", "invalid_csv"],
    ["name,code\na", "invalid_csv"],
    ["", "invalid_headers"],
    ["name, NAME\na,b", "invalid_headers"],
    ["name,\na,b", "invalid_headers"],
    ["a,b,c,d\n1,2,3,4", "too_many_columns"],
    ["name\n1\n2\n3\n4", "too_many_rows"],
    ["name\n" + "x".repeat(41), "cell_too_long"],
  ])("rejects malformed or oversized structure (%s)", (source, code) => {
    expect(() => parseCsv(encode(source), limits)).toThrow(
      new CsvError(code as CsvError["code"]),
    );
  });

  it("checks byte limits before decoding and rejects invalid UTF-8", () => {
    expect(() => parseCsv(new Uint8Array(2049), limits)).toThrow("too_large");
    expect(() => parseCsv(new Uint8Array([0xc3, 0x28]), limits)).toThrow(
      "invalid_utf8",
    );
  });

  it("accepts the exact row budget and a final empty cell", () => {
    expect(parseCsv(encode("a,b\n1,\n2,\n3,"), limits).rows).toHaveLength(3);
  });

  it("rejects invalid caller budgets without including file data in errors", () => {
    expect(() =>
      parseCsv(encode("private"), { ...limits, maxRows: 0 }),
    ).toThrow("invalid_limits");
  });
});
