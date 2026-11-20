import "server-only";
import { SaxesParser } from "saxes";
import type { ImportLimits } from "./limits";

// Inspect every XML part, regardless of its ZIP path. The workbook reader follows
// relationships and accepts arbitrary worksheet locations and namespace prefixes.
// SAX events validate before its sparse-cell arrays can be allocated.
export function inspectXlsxXml(xml: string, limits: ImportLimits) {
  if (/<!DOCTYPE|<!ENTITY|macroEnabled|vbaProject|externalLink/i.test(xml))
    throw Error("unsupported_xlsx_content");
  const parser = new SaxesParser({ xmlns: true });
  let rows = 0;
  let cells = 0;
  let depth = 0;
  const maxRows = limits.maxRows + 1; // Includes the header.
  function coordinate(value: string) {
    const match = /^([A-Z]+)([1-9][0-9]*)$/.exec(value);
    if (!match) throw Error("invalid_cell_reference");
    let column = 0;
    for (const letter of match[1]) {
      column = column * 26 + letter.charCodeAt(0) - 64;
      if (column > limits.maxColumns) throw Error("too_many_rows_or_columns");
    }
    if (Number(match[2]) > maxRows) throw Error("too_many_rows_or_columns");
  }
  parser.on("doctype", () => {
    throw Error("unsupported_xlsx_content");
  });
  parser.on("opentag", (tag) => {
    // Bound the safety parser's own namespace/element stack, not just ZIP bytes.
    if (++depth > 64) throw Error("xlsx_xml_too_deep");
    // `local` handles unprefixed, hyphenated, dotted and Unicode prefixes alike,
    // including attributes and self-closing formula elements. Never use cached values.
    if (tag.local === "f") throw Error("unsupported_xlsx_content");
    const attributes = Object.values(tag.attributes).filter(
      (attribute) => attribute.uri !== "http://www.w3.org/2000/xmlns/",
    );
    function attributeValue(local: string) {
      const matches = attributes.filter(
        (attribute) => attribute.local === local,
      );
      // The reader strips attribute prefixes. Reject ambiguous spellings rather
      // than letting namespace/order differences select an unchecked coordinate.
      if (matches.length > 1) throw Error("invalid_xlsx_attribute");
      return matches[0]?.value;
    }
    for (const attribute of attributes) {
      if (
        (attribute.local === "TargetMode" &&
          /^external$/i.test(attribute.value)) ||
        /macroEnabled|vbaProject|externalLink/i.test(attribute.value)
      )
        throw Error("unsupported_xlsx_content");
    }
    const ref = attributeValue("r");
    if (tag.local === "row") {
      if (++rows > maxRows) throw Error("too_many_rows_or_columns");
      if (
        ref !== undefined &&
        (!/^[1-9][0-9]*$/.test(ref) || Number(ref) > maxRows)
      )
        throw Error("invalid_cell_reference");
    }
    if (tag.local === "c") {
      if (++cells > maxRows * limits.maxColumns || ref === undefined)
        throw Error("invalid_cell_reference");
      coordinate(ref);
    }
    if (tag.local === "dimension") {
      const dimension = attributeValue("ref");
      if (dimension !== undefined) {
        const bounds = dimension.split(":");
        if (bounds.length > 2) throw Error("invalid_cell_reference");
        bounds.forEach(coordinate);
      }
    }
  });
  parser.on("closetag", () => {
    depth--;
  });
  try {
    parser.write(xml).close();
  } catch {
    // Parser diagnostics can contain file contents. Only fixed safe codes escape.
    throw Error("invalid_xlsx_xml");
  }
}
