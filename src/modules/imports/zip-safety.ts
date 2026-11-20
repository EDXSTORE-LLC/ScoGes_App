import { inflateRawSync, crc32 } from "node:zlib";
import type { ImportLimits } from "./limits";
import { inspectXlsxXml } from "./xml-safety";
// Bounded ZIP preflight, independent of the XLSX reader. Reject ZIP64, encryption,
// overlapping payloads, unsafe paths and mismatched actual expansion/CRC.
export function inspectXlsxArchive(bytes: Buffer, limits: ImportLimits) {
  if (bytes.length > limits.maxBytes) throw Error("too_large");
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
    if (
      bytes.readUInt32LE(i) === 0x06054b50 &&
      i + 22 + bytes.readUInt16LE(i + 20) === bytes.length
    ) {
      end = i;
      break;
    }
  if (
    end < 0 ||
    bytes.readUInt16LE(end + 4) !== 0 ||
    bytes.readUInt16LE(end + 6) !== 0
  )
    throw Error("invalid_xlsx");
  const count = bytes.readUInt16LE(end + 10),
    start = bytes.readUInt32LE(end + 16),
    size = bytes.readUInt32LE(end + 12);
  if (
    count < 1 ||
    count > 1000 ||
    count !== bytes.readUInt16LE(end + 8) ||
    start + size !== end
  )
    throw Error("invalid_xlsx");
  const names = new Set<string>(),
    ranges: [number, number][] = [];
  let position = start,
    total = 0;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (let entry = 0; entry < count; entry++) {
    if (position + 46 > end || bytes.readUInt32LE(position) !== 0x02014b50)
      throw Error("invalid_xlsx");
    const flags = bytes.readUInt16LE(position + 8),
      method = bytes.readUInt16LE(position + 10),
      checksum = bytes.readUInt32LE(position + 16),
      compressed = bytes.readUInt32LE(position + 20),
      expanded = bytes.readUInt32LE(position + 24),
      length = bytes.readUInt16LE(position + 28),
      extra = bytes.readUInt16LE(position + 30),
      comment = bytes.readUInt16LE(position + 32),
      offset = bytes.readUInt32LE(position + 42);
    if (
      flags & 1 ||
      ![0, 8].includes(method) ||
      expanded > limits.maxExpandedBytes - total ||
      position + 46 + length + extra + comment > end
    )
      throw Error("invalid_xlsx");
    const name = decoder.decode(
      bytes.subarray(position + 46, position + 46 + length),
    );
    if (
      !name ||
      names.has(name) ||
      name.startsWith("/") ||
      name.includes("\\") ||
      name.includes("\0") ||
      name.split("/").some((p) => p === ".." || p === ".")
    )
      throw Error("invalid_xlsx");
    names.add(name);
    if (
      offset + 30 > start ||
      bytes.readUInt32LE(offset) !== 0x04034b50 ||
      bytes.readUInt16LE(offset + 6) !== flags ||
      bytes.readUInt16LE(offset + 8) !== method
    )
      throw Error("invalid_xlsx");
    const localName = bytes.readUInt16LE(offset + 26),
      localExtra = bytes.readUInt16LE(offset + 28),
      dataStart = offset + 30 + localName + localExtra,
      dataEnd = dataStart + compressed;
    if (
      dataEnd > start ||
      ranges.some(([a, b]) => offset < b && dataEnd > a) ||
      decoder.decode(bytes.subarray(offset + 30, offset + 30 + localName)) !==
        name
    )
      throw Error("invalid_xlsx");
    ranges.push([offset, dataEnd]);
    const input = bytes.subarray(dataStart, dataEnd);
    const data =
      method === 0
        ? input
        : inflateRawSync(input, {
            maxOutputLength: Math.max(1, limits.maxExpandedBytes - total),
          });
    if (data.length !== expanded || crc32(data) !== checksum)
      throw Error("invalid_xlsx");
    total += data.length;
    if (!name.endsWith("/")) {
      if (!/\.(xml|rels)$/i.test(name)) throw Error("unsupported_xlsx_content");
      inspectXlsxXml(decoder.decode(data), limits);
    }
    position += 46 + length + extra + comment;
  }
  if (
    position !== end ||
    !names.has("[Content_Types].xml") ||
    !names.has("xl/workbook.xml")
  )
    throw Error("invalid_xlsx");
}
