import readXlsxFile from "read-excel-file/node";
import { parseCsv, type TabularData } from "./csv";
import { inspectXlsxArchive } from "./zip-safety";
import type { ImportLimits } from "./limits";
export async function parseXlsx(
  bytes: Buffer,
  limits: ImportLimits,
): Promise<TabularData> {
  inspectXlsxArchive(bytes, limits);
  const sheets = await readXlsxFile(bytes, {
    trim: false,
    parseNumber: (value) => value,
  });
  if (sheets.length !== 1) throw Error("one_sheet_required");
  const rows = sheets[0].data.map((row) =>
    row.map((value) =>
      value instanceof Date
        ? value.toISOString().slice(0, 10)
        : value === null
          ? ""
          : String(value),
    ),
  );
  const width = rows[0]?.length ?? 0;
  const csv = rows
    .map((row) => {
      while (row.length < width) row.push("");
      return row
        .map((value) => '"' + value.replaceAll('"', '""') + '"')
        .join(",");
    })
    .join("\n");
  return parseCsv(new TextEncoder().encode(csv), {
    ...limits,
    maxBytes: limits.maxExpandedBytes,
  });
}
