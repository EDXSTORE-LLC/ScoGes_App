import { workbook } from "../../../tests/fixtures/xlsx";
import { it, expect } from "vitest";
import { parseXlsx } from "./xlsx";
import { inspectXlsxArchive } from "./zip-safety";
import { importLimits } from "./limits";
// Tiny real XLSX fixtures, built without a second spreadsheet dependency.

it("parses real XLSX text cells without losing leading zeros", async () => {
  expect(await parseXlsx(workbook(), importLimits({}))).toEqual({
    headers: ["code"],
    rows: [["001"]],
  });
});
it("rejects dangerous archive content before XLSX parsing", () => {
  const cases: Record<string, string>[] = [
    { "bad.bin": "bad" },
    { "xl/test.xml": '<Relationship TargetMode="Exter&#110;al"/>' },
    { "xl/worksheets/sheet1.xml": '<row r="1000000"/>' },
    { "xl/worksheets/sheet1.xml": '<c r="A01000000"/>' },
    { "../bad.xml": "bad" },
    { "xl/test.xml": "<!DOCTYPE x>" },
    { "xl/test.xml": "<f>SUM(A1)</f>" },
    { "xl/test.xml": '<Relationship TargetMode="External"/>' },
    { "xl/worksheets/sheet1.xml": '<c r="A1000000"/>' },
  ];
  for (const extra of cases)
    expect(() =>
      inspectXlsxArchive(workbook(extra), importLimits({})),
    ).toThrow();
  const bad = workbook();
  bad[40] ^= 255;
  expect(() => inspectXlsxArchive(bad, importLimits({}))).toThrow();
  expect(() =>
    inspectXlsxArchive(workbook(), {
      ...importLimits({}),
      maxExpandedBytes: 10,
    }),
  ).toThrow();
});
