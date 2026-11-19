import Link from "next/link";
import type { Route } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/types/foundation";
import {
  schoolText,
  entityText,
  fieldText,
  statusText,
} from "@/modules/school/messages";
import { rowTitle, type SchoolRow } from "@/modules/school/registry";
export async function PersonConnections({
  client,
  tenantId,
  id,
  kind,
  locale,
}: {
  client: SupabaseClient;
  tenantId: string;
  id: string;
  kind: "students" | "guardians";
  locale: Locale;
}) {
  const other = kind === "students" ? "guardians" : "students";
  const links = await client
    .from("student_guardians")
    .select(`id,relationship,primary_contact,status,${other}(id,code,name)`)
    .eq("tenant_id", tenantId)
    .eq(kind === "students" ? "student_id" : "guardian_id", id)
    .limit(500)
    .returns<
      {
        id: string;
        relationship: string;
        primary_contact: boolean;
        status: string;
        students?: SchoolRow | null;
        guardians?: SchoolRow | null;
      }[]
    >();
  const enrollments =
    kind === "students"
      ? await client
          .from("enrollments")
          .select("id,status,academic_years(code,name)")
          .eq("tenant_id", tenantId)
          .eq("student_id", id)
          .order("created_at", { ascending: false })
          .limit(500)
          .returns<
            { id: string; status: string; academic_years: SchoolRow | null }[]
          >()
      : null;
  if (links.error || enrollments?.error)
    return <p role="alert">{schoolText(locale, "unavailable")}</p>;
  return (
    <section className="grid gap-3">
      <h2 className="text-xl font-semibold">{entityText(locale, "links")}</h2>
      <ul>
        {links.data?.map((link) => (
          <li key={link.id}>
            {link[other] ? (
              <Link
                className="underline"
                href={
                  `/dashboard/school/${other}?locale=${locale}&id=${link[other]!.id}` as Route
                }
              >
                {rowTitle(link[other]!)}
              </Link>
            ) : (
              schoolText(locale, "denied")
            )}{" "}
            · {link.relationship} · {statusText(locale, link.status)}
            {link.primary_contact
              ? ` · ${fieldText(locale, "primary_contact")}`
              : ""}
          </li>
        ))}
      </ul>
      {!links.data?.length && <p>{schoolText(locale, "empty")}</p>}
      {enrollments && (
        <>
          <h2 className="text-xl font-semibold">
            {schoolText(locale, "history")}
          </h2>
          <ul>
            {enrollments.data?.map((enrollment) => (
              <li key={enrollment.id}>
                <Link
                  className="underline"
                  href={
                    `/dashboard/school/enrollments?locale=${locale}&id=${enrollment.id}` as Route
                  }
                >
                  {enrollment.academic_years
                    ? rowTitle(enrollment.academic_years)
                    : entityText(locale, "enrollments")}{" "}
                  · {statusText(locale, enrollment.status)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
