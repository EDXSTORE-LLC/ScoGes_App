import { workbook } from "../../../tests/fixtures/xlsx";
import { beforeEach, it, expect, vi } from "vitest";
import { parseXlsx } from "./xlsx";
import { inspectXlsxArchive } from "./zip-safety";
import { importLimits } from "./limits";
const { reader } = vi.hoisted(() => ({ reader: vi.fn() }));
vi.mock("read-excel-file/node", async (original) => {
  const actual = await original<typeof import("read-excel-file/node")>();
  reader.mockImplementation(actual.default);
  return { ...actual, default: reader };
});
beforeEach(() => vi.clearAllMocks());
// Tiny real XLSX fixtures, built without a second spreadsheet dependency.

it("parses real XLSX text cells without losing leading zeros", async () => {
  expect(await parseXlsx(workbook(), importLimits({}))).toEqual({
    headers: ["code"],
    rows: [["001"]],
  });
});

const spreadsheetNamespace =
  "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
function worksheet(cell: string, row = "2", address = "A2") {
  return `<worksheet xmlns="${spreadsheetNamespace}"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>code</t></is></c></row><row r="${row}"><c r="${address}" t="str">${cell}</c></row></sheetData></worksheet>`;
}
function locatedWorksheet(xml: string, target: string) {
  return workbook({
    [`xl/${target}`]: xml,
    "xl/_rels/workbook.xml.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="${target}"/></Relationships>`,
  });
}

it.each(["worksheets/sheet1.xml", "Worksheets/sheet1.xml", "custom/safe.xml"])(
  "validates sparse row coordinates before the reader for %s",
  async (target) => {
    await expect(
      parseXlsx(
        locatedWorksheet(
          worksheet("<v>001</v>", "1000000000", "A1000000000"),
          target,
        ),
        importLimits({}),
      ),
    ).rejects.toThrow();
    expect(reader).not.toHaveBeenCalled();
  },
);
it.each(["worksheets/sheet1.xml", "Worksheets/sheet1.xml", "custom/safe.xml"])(
  "validates extreme columns before the reader for %s",
  async (target) => {
    await expect(
      parseXlsx(
        locatedWorksheet(worksheet("<v>001</v>", "2", "ZZZZZZ2"), target),
        importLimits({}),
      ),
    ).rejects.toThrow();
    expect(reader).not.toHaveBeenCalled();
  },
);
it.each(["Worksheets/sheet1.xml", "custom/safe.xml"])(
  "accepts an ordinary bounded worksheet at %s",
  async (target) => {
    expect(
      await parseXlsx(
        locatedWorksheet(worksheet("<v>001</v>"), target),
        importLimits({}),
      ),
    ).toEqual({ headers: ["code"], rows: [["001"]] });
    expect(reader).toHaveBeenCalledOnce();
  },
);
it.each([
  "<f>1+1</f>",
  `<x:f xmlns:x="${spreadsheetNamespace}">1+1</x:f>`,
  `<x-y:f xmlns:x-y="${spreadsheetNamespace}">1+1</x-y:f>`,
  `<x.y:f xmlns:x.y="${spreadsheetNamespace}">1+1</x.y:f>`,
  `<élève:f xmlns:élève="${spreadsheetNamespace}">1+1</élève:f>`,
  `<x-y:f xmlns:x-y="${spreadsheetNamespace}" t="shared" si="0"/>`,
  '<f t="shared" si="0" ref="A2">1+1</f>',
])(
  "rejects formula elements with cached values before reading: %s",
  async (formula) => {
    await expect(
      parseXlsx(
        locatedWorksheet(
          worksheet(`${formula}<v>001</v>`),
          "Worksheets/sheet1.xml",
        ),
        importLimits({}),
      ),
    ).rejects.toThrow();
    expect(reader).not.toHaveBeenCalled();
  },
);
it("accepts legitimate XML namespaces, escaped text and self-closing non-formula elements", async () => {
  const xml = worksheet("<v>A&amp;B</v>")
    .replace("<sheetData>", `<sheetData xmlns:x-y="${spreadsheetNamespace}">`)
    .replace('<row r="2">', '<row r="2"><x-y:extLst/>');
  expect(
    (
      await parseXlsx(
        locatedWorksheet(xml, "Worksheets/sheet1.xml"),
        importLimits({}),
      )
    ).rows,
  ).toEqual([["A&B"]]);
});
it("enforces decoded XML coordinates, dimensions and implicit row counts before reading", async () => {
  for (const xml of [
    worksheet("<v>001</v>", "502", "A502").replaceAll('r="', 'r = "'),
    worksheet("<v>001</v>", "502", "A502").replaceAll("502", "&#53;02"),
    worksheet("<v>001</v>").replace(
      'c r="A2"',
      'c r="A2" n:r="A1000000000" xmlns:n="urn:test"',
    ),
    worksheet("<v>001</v>").replace(
      'row r="2"',
      'row r="2" n:r="1000000000" xmlns:n="urn:test"',
    ),
    worksheet("<v>001</v>", "502", "A502").replace(
      'c r="A502"',
      'c xmlns:r="urn:safe" r="A502"',
    ),
    worksheet("<v>001</v>").replace(
      "<sheetData>",
      '<dimension ref = "A1:XFD1048576"/><sheetData>',
    ),
    `<worksheet xmlns="${spreadsheetNamespace}"><sheetData>${"<row/>".repeat(502)}</sheetData></worksheet>`,
  ]) {
    await expect(
      parseXlsx(locatedWorksheet(xml, "custom/safe.xml"), importLimits({})),
    ).rejects.toThrow();
    expect(reader).not.toHaveBeenCalled();
  }
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
it("bounds XML nesting before the workbook reader or parser stack can grow", async () => {
  const xml = `<worksheet xmlns="${spreadsheetNamespace}">${"<x>".repeat(65)}${"</x>".repeat(65)}</worksheet>`;
  await expect(
    parseXlsx(locatedWorksheet(xml, "custom/safe.xml"), importLimits({})),
  ).rejects.toThrow();
  expect(reader).not.toHaveBeenCalled();
});
