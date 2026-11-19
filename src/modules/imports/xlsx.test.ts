import { deflateRawSync, crc32 } from "node:zlib";
import { it, expect } from "vitest";
import { parseXlsx } from "./xlsx";
import { inspectXlsxArchive } from "./zip-safety";
import { importLimits } from "./limits";
// Tiny real XLSX fixtures, built without a second spreadsheet dependency.
export function workbook(extra: Record<string, string> = {}) {
  const content = {
    "[Content_Types].xml":
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>',
    "xl/workbook.xml":
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml":
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:A2"/><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>code</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>001</t></is></c></row></sheetData></worksheet>',
    ...extra,
  };
  const locals: Buffer[] = [],
    central: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(content)) {
    const filename = Buffer.from(name),
      raw = Buffer.from(text),
      packed = deflateRawSync(raw),
      local = Buffer.alloc(30),
      dir = Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc32(raw), 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(filename.length, 26);
    dir.writeUInt32LE(0x02014b50);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(8, 10);
    dir.writeUInt32LE(crc32(raw), 16);
    dir.writeUInt32LE(packed.length, 20);
    dir.writeUInt32LE(raw.length, 24);
    dir.writeUInt16LE(filename.length, 28);
    dir.writeUInt32LE(offset, 42);
    locals.push(local, filename, packed);
    central.push(dir, filename);
    offset += 30 + filename.length + packed.length;
  }
  const cd = Buffer.concat(central),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(Object.keys(content).length, 8);
  end.writeUInt16LE(Object.keys(content).length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}
it("parses real XLSX text cells without losing leading zeros", async () => {
  expect(await parseXlsx(workbook(), importLimits({}))).toEqual({
    headers: ["code"],
    rows: [["001"]],
  });
});
it("rejects dangerous archive content before XLSX parsing", () => {
  const cases: Record<string, string>[] = [
    { "bad.bin": "bad" },
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
