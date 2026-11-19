import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";
import { schoolKindSchema } from "@/modules/school/registry";
export const previewSchema = z
  .object({
    version: z.literal(1),
    batchId: z.uuid(),
    actorId: z.uuid(),
    tenantId: z.uuid(),
    kind: schoolKindSchema,
    expiresAt: z.number().int(),
    rows: z
      .array(
        z
          .object({
            line: z.number().int().min(2).max(501),
            data: z.record(
              z.string(),
              z.union([z.string(), z.number(), z.boolean(), z.null()]),
            ),
          })
          .strict(),
      )
      .max(500),
    errors: z
      .array(
        z
          .object({
            line: z.number().int().min(2).max(501),
            result: z.enum(["invalidRow", "duplicate"]),
          })
          .strict(),
      )
      .max(500),
  })
  .strict();
export type ImportPreview = z.infer<typeof previewSchema>;
function key(secret: string | undefined) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(secret))
    throw Error("import_preview_unavailable");
  return Buffer.from(secret, "hex");
}
export function sealPreview(
  data: ImportPreview,
  secret = process.env.IMPORT_PREVIEW_SECRET,
) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  cipher.setAAD(Buffer.from("scoges-import-preview-v1"));
  const body = Buffer.concat([
    cipher.update(JSON.stringify(previewSchema.parse(data)), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}
export function openPreview(
  token: string,
  actorId: string,
  tenantId: string,
  now = Date.now(),
  secret = process.env.IMPORT_PREVIEW_SECRET,
): ImportPreview {
  try {
    if (token.length > 16 * 1024 * 1024) throw Error();
    const bytes = Buffer.from(token, "base64url");
    const cipher = createDecipheriv(
      "aes-256-gcm",
      key(secret),
      bytes.subarray(0, 12),
    );
    cipher.setAAD(Buffer.from("scoges-import-preview-v1"));
    cipher.setAuthTag(bytes.subarray(12, 28));
    const value = previewSchema.parse(
      JSON.parse(
        Buffer.concat([
          cipher.update(bytes.subarray(28)),
          cipher.final(),
        ]).toString("utf8"),
      ),
    );
    if (
      value.actorId !== actorId ||
      value.tenantId !== tenantId ||
      value.expiresAt <= now
    )
      throw Error();
    return value;
  } catch {
    throw Error("invalid_import_preview");
  }
}
