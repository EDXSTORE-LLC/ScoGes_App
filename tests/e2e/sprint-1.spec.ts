import { test, expect } from "./fixtures";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { parseEnv } from "node:util";
import { existsSync, readFileSync } from "node:fs";
const env = {
  ...(existsSync(".env.local")
    ? parseEnv(readFileSync(".env.local", "utf8"))
    : {}),
  ...process.env,
};
// Sprint 1 migrations are not deployed to hosted development by this task.
// These mandatory CI journeys use only the disposable project, never hosted fallback.
if (env.CI_ENFORCE_INTEGRATION === "1") {
  if (
    env.DATABASE_TEST_LOCAL !== "1" ||
    !env.SUPABASE_SECRET_KEY ||
    !env.CI_TEST_PASSWORD
  )
    throw Error("Sprint 1 requires isolated CI fixtures");
  const endpoint = new URL(env.NEXT_PUBLIC_SUPABASE_URL!);
  if (!["127.0.0.1", "localhost"].includes(endpoint.hostname))
    throw Error("Sprint 1 browser fixtures require loopback");
  test.use({ trace: "off", screenshot: "off", video: "off" });
  for (const locale of ["fr", "en"] as const) {
    test(`Sprint 1 ${locale}: academic records, family, enrollment history and safe CSV retry`, async ({
      page,
    }) => {
      // A full new vertical slice includes nine forms, import preview and commit.
      test.setTimeout(90000);
      const admin = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL!,
        env.SUPABASE_SECRET_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const email = `sprint1-${randomUUID()}@example.invalid`,
        password = env.CI_TEST_PASSWORD!;
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (created.error || !created.data.user)
        throw Error("Sprint 1 fixture account failed");
      const userId = created.data.user.id;
      const client = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL!,
        env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      let tenantId: string | undefined;
      try {
        expect(
          (await client.auth.signInWithPassword({ email, password })).error,
        ).toBeNull();
        const t = await client.rpc("create_tenant_with_admin", {
          tenant_name: "Sprint 1 fixture",
          tenant_slug: `s1-${randomUUID()}`,
          tenant_country: "TG",
          tenant_base_currency: "XOF",
          tenant_timezone: "Africa/Lome",
          tenant_default_locale: locale,
          actor_user_id: userId,
        });
        if (t.error || typeof t.data !== "string")
          throw Error("Sprint 1 fixture tenant failed");
        tenantId = t.data;
        await page.goto(`/login?locale=${locale}`);
        await page
          .getByLabel(locale === "fr" ? "Adresse e-mail" : "Email address")
          .fill(email);
        await page
          .getByLabel(locale === "fr" ? "Mot de passe" : "Password", {
            exact: true,
          })
          .fill(password);
        await page
          .getByRole("button", {
            name: locale === "fr" ? "Se connecter" : "Sign in",
            exact: true,
          })
          .click();
        await expect(page).toHaveURL(/dashboard/);
        const save = locale === "fr" ? "Enregistrer" : "Save",
          saved =
            locale === "fr" ? "Modification enregistrée." : "Changes saved.";
        const label = {
          code: locale === "fr" ? "Code interne" : "Internal code",
          name: locale === "fr" ? "Nom" : "Name",
          start: locale === "fr" ? "Date de début" : "Start date",
          end: locale === "fr" ? "Date de fin" : "End date",
          first: locale === "fr" ? "Prénom" : "Given name",
          last: locale === "fr" ? "Nom de famille" : "Family name",
          year: locale === "fr" ? "Année scolaire" : "Academic year",
          level: locale === "fr" ? "Niveau" : "Level",
          group: locale === "fr" ? "Classe / groupe" : "Class / group",
          student: locale === "fr" ? "Élève" : "Student",
          guardian:
            locale === "fr"
              ? "Tuteur / responsable"
              : "Guardian / responsible person",
          status: locale === "fr" ? "Statut" : "Status",
        };
        async function screen(kind: string) {
          await page.goto(`/dashboard/school/${kind}?locale=${locale}`);
          await expect(page.locator("html")).toHaveAttribute("lang", locale);
        }
        async function submit() {
          await page.getByRole("button", { name: save, exact: true }).click();
          await expect(page.getByRole("status")).toContainText(saved);
        }
        async function record(table: string, code: string) {
          const r = await client
            .from(table)
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("code", code)
            .single();
          expect(r.error).toBeNull();
          return r.data!.id as string;
        }
        await screen("years");
        await page.getByLabel(label.code, { exact: true }).fill("year26");
        await page.getByLabel(label.name, { exact: true }).fill("2026");
        await page.getByLabel(label.start, { exact: true }).fill("2026-01-01");
        await page.getByLabel(label.end, { exact: true }).fill("2026-12-31");
        await submit();
        const year = await record("academic_years", "year26");
        await screen("levels");
        await page.getByLabel(label.code, { exact: true }).fill("grade1");
        await page.getByLabel(label.name, { exact: true }).fill("Grade 1");
        await submit();
        const level = await record("academic_levels", "grade1");
        await screen("classes");
        await page.getByLabel(label.code, { exact: true }).fill("group1");
        await page.getByLabel(label.name, { exact: true }).fill("Group 1");
        await page.getByLabel(label.year, { exact: true }).selectOption(year);
        await page.getByLabel(label.level, { exact: true }).selectOption(level);
        await submit();
        const group = await record("academic_classes", "group1");
        await screen("students");
        await page.getByLabel(label.code, { exact: true }).fill("s001");
        await page.getByLabel(label.first, { exact: true }).fill("Alex");
        await page.getByLabel(label.last, { exact: true }).fill("Example");
        await submit();
        const student = await record("students", "s001");
        await screen("guardians");
        await page.getByLabel(label.code, { exact: true }).fill("g001");
        await page.getByLabel(label.first, { exact: true }).fill("Robin");
        await page.getByLabel(label.last, { exact: true }).fill("Example");
        await page
          .getByLabel(locale === "fr" ? "Adresse e-mail" : "Email address", {
            exact: true,
          })
          .fill("guardian@example.invalid");
        await submit();
        const guardian = await record("guardians", "g001");
        await screen("links");
        await page
          .getByLabel(label.student, { exact: true })
          .selectOption(student);
        await page
          .getByLabel(label.guardian, { exact: true })
          .selectOption(guardian);
        await page
          .getByLabel(
            locale === "fr" ? "Type de relation" : "Relationship type",
          )
          .fill("guardian");
        await page
          .getByLabel(
            locale === "fr" ? "Contact principal" : "Primary contact",
            { exact: true },
          )
          .check();
        await submit();
        await screen("enrollments");
        await page
          .getByLabel(label.student, { exact: true })
          .selectOption(student);
        await page.getByLabel(label.year, { exact: true }).selectOption(year);
        await page.getByLabel(label.level, { exact: true }).selectOption(level);
        await page.getByLabel(label.group, { exact: true }).selectOption(group);
        await submit();
        const enrollment = await client
          .from("enrollments")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("student_id", student)
          .single();
        expect(enrollment.error).toBeNull();
        await page.goto(
          `/dashboard/school/enrollments?locale=${locale}&id=${enrollment.data!.id}`,
        );
        await page
          .getByLabel(label.status, { exact: true })
          .last()
          .selectOption("active");
        await submit();
        const history = await client
          .from("enrollment_history")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("enrollment_id", enrollment.data!.id);
        expect(history.data).toHaveLength(2);
        await page.goto(`/dashboard/imports?locale=${locale}`);
        const file =
            locale === "fr" ? "Fichier CSV ou XLSX" : "CSV or XLSX file",
          preview =
            locale === "fr"
              ? "Prévisualiser sans enregistrer"
              : "Preview without saving",
          commit =
            locale === "fr"
              ? "Importer les lignes valides"
              : "Import valid rows";
        await page.getByLabel(file).setInputFiles({
          name: "students.csv",
          mimeType: "text/csv",
          buffer: Buffer.from(
            "code,first_name,last_name\ns002,New,Student\ns001,Existing,Code\nbad,,Name",
          ),
        });
        await page.getByRole("button", { name: preview, exact: true }).click();
        await expect(
          page.getByRole("cell", {
            name:
              locale === "fr"
                ? "Conflit : code ou lien déjà présent"
                : "Conflict: code or link already exists",
            exact: true,
          }),
        ).toBeVisible();
        expect(
          (await client.from("students").select("id").eq("tenant_id", tenantId))
            .data,
        ).toHaveLength(1);
        await page.getByRole("checkbox", { name: commit, exact: true }).check();
        await page.getByRole("button", { name: commit, exact: true }).click();
        await expect(
          page.getByRole("cell", {
            name: locale === "fr" ? "Créé" : "Created",
            exact: true,
          }),
        ).toBeVisible();
        expect(
          (await client.from("students").select("id").eq("tenant_id", tenantId))
            .data,
        ).toHaveLength(2);
        // A new preview after success must reset commit state and safely accept corrected rows.
        await page.getByLabel(file).setInputFiles({
          name: "corrected.csv",
          mimeType: "text/csv",
          buffer: Buffer.from(
            "code,first_name,last_name\ns003,Corrected,Student",
          ),
        });
        await page.getByRole("button", { name: preview, exact: true }).click();
        await expect(
          page.getByRole("button", { name: commit, exact: true }),
        ).toBeVisible();
      } finally {
        if (tenantId) {
          const a = await admin
            .from("audit_events")
            .delete()
            .eq("tenant_id", tenantId);
          const t = await admin.from("tenants").delete().eq("id", tenantId);
          if (a.error || t.error)
            throw Error("Sprint 1 fixture cleanup failed");
        }
        if ((await admin.auth.admin.deleteUser(userId)).error)
          throw Error("Sprint 1 account cleanup failed");
      }
    });
  }
}
