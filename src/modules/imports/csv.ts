export type TabularLimits = {
  maxBytes: number;
  maxRows: number;
  maxColumns: number;
  maxCellCharacters: number;
};

export type TabularData = { headers: string[]; rows: string[][] };
export type CsvErrorCode =
  | "invalid_limits"
  | "too_large"
  | "invalid_utf8"
  | "invalid_csv"
  | "too_many_rows"
  | "too_many_columns"
  | "cell_too_long"
  | "invalid_headers";

// Codes only: file contents and personal data must not enter exception messages.
export class CsvError extends Error {
  constructor(public readonly code: CsvErrorCode) {
    super(code);
    this.name = "CsvError";
  }
}

/** Parse strings only. This adapter never evaluates cells or applies business rules. */
export function parseCsv(
  bytes: Uint8Array,
  limits: TabularLimits,
): TabularData {
  if (
    !Object.values(limits).every(
      (value) => Number.isSafeInteger(value) && value > 0,
    )
  )
    throw new CsvError("invalid_limits");
  if (bytes.byteLength > limits.maxBytes) throw new CsvError("too_large");
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new CsvError("invalid_utf8");
  }
  if (source.includes("\0")) throw new CsvError("invalid_csv");

  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let state: "plain" | "quoted" | "closed" = "plain";
  let started = false;
  function append(character: string) {
    cell += character;
    if (cell.length > limits.maxCellCharacters)
      throw new CsvError("cell_too_long");
  }
  function endCell() {
    row.push(cell);
    if (row.length > limits.maxColumns) throw new CsvError("too_many_columns");
    cell = "";
    state = "plain";
  }
  function endRow() {
    endCell();
    records.push(row);
    if (records.length > limits.maxRows + 1)
      throw new CsvError("too_many_rows");
    row = [];
    started = false;
  }

  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    started = true;
    if (state === "quoted") {
      if (character === '"') {
        if (source[index + 1] === '"') {
          append('"');
          index++;
        } else state = "closed";
      } else append(character);
    } else if (character === ",") {
      endCell();
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index++;
      endRow();
    } else if (state === "closed") {
      throw new CsvError("invalid_csv");
    } else if (character === '"') {
      if (cell.length) throw new CsvError("invalid_csv");
      state = "quoted";
    } else append(character);
  }
  if (state === "quoted") throw new CsvError("invalid_csv");
  if (started) endRow();
  const headers = records.shift() ?? [];
  if (
    !headers.length ||
    headers.some((header) => !header.trim()) ||
    new Set(headers.map((header) => header.trim().toLowerCase())).size !==
      headers.length
  )
    throw new CsvError("invalid_headers");
  if (records.some((record) => record.length !== headers.length))
    throw new CsvError("invalid_csv");
  return { headers, rows: records };
}
