import { schoolEntities } from "@/modules/school/registry";
export const importKinds = [
  "students",
  "guardians",
  "links",
  "enrollments",
] as const;
export type ImportKind = (typeof importKinds)[number];
export function templateHeaders(kind: ImportKind) {
  return schoolEntities[kind].fields.map((f) =>
    f.reference ? f.name.replace(/_id$/, "_code") : f.name,
  );
}
