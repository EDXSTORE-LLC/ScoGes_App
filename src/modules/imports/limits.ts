export type ImportLimits = {
  maxBytes: number;
  maxRows: number;
  maxColumns: number;
  maxCellCharacters: number;
  maxExpandedBytes: number;
  previewSeconds: number;
};
export function importLimits(
  env: Record<string, string | undefined> = process.env,
): ImportLimits {
  const number = (name: string, fallback: number, ceiling: number) => {
    const v = env[name] === undefined ? fallback : Number(env[name]);
    if (!Number.isSafeInteger(v) || v < 1 || v > ceiling)
      throw Error("invalid_import_configuration");
    return v;
  };
  return {
    maxBytes: number("IMPORT_MAX_BYTES", 2 * 1024 * 1024, 4 * 1024 * 1024),
    maxRows: number("IMPORT_MAX_ROWS", 500, 500),
    maxColumns: 30,
    maxCellCharacters: 1000,
    maxExpandedBytes: number(
      "IMPORT_MAX_EXPANDED_BYTES",
      10 * 1024 * 1024,
      20 * 1024 * 1024,
    ),
    previewSeconds: number("IMPORT_PREVIEW_SECONDS", 900, 900),
  };
}
