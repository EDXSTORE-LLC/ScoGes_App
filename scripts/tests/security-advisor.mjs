import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import pg from "pg";
import { databaseTestOptions, loopbackUrl } from "../ci/environment.mjs";

export function securityAdvisorTestOptions(env) {
  if (env.CI_ENFORCE_INTEGRATION !== "1" || env.DATABASE_TEST_LOCAL !== "1")
    throw Error("Security migration replay requires isolated local CI.");
  loopbackUrl(env.DATABASE_URL, ["postgres:", "postgresql:"]);
  return databaseTestOptions(env);
}

async function snapshot(client) {
  const functions = await client.query(
    "select p.oid, p.proname, p.proowner, p.prosrc, p.prosecdef, p.proconfig, p.proacl::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','app_private') order by p.oid",
  );
  const defaults = await client.query(
    "select defaclrole, defaclnamespace, defaclobjtype, defaclacl::text from pg_default_acl order by defaclrole,defaclnamespace,defaclobjtype",
  );
  const tables = {};
  for (const table of [
    "public.tenants",
    "public.profiles",
    "public.tenant_settings",
    "public.memberships",
    "public.membership_roles",
    "public.invitations",
    "public.audit_events",
    "app_private.rpc_write_windows",
  ]) {
    tables[table] = (
      await client.query(
        "select md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text)::text,'')) fingerprint from " +
          table +
          " t",
      )
    ).rows[0].fingerprint;
  }
  return { functions: functions.rows, defaults: defaults.rows, tables };
}

export async function testSecurityAdvisorMigration(env) {
  // Never replay DDL against hosted projects; validation precedes connection.
  const client = new pg.Client(securityAdvisorTestOptions(env));
  try {
    await client.connect();
    await client.query("begin");
    const versions = readdirSync(
      new URL("../../supabase/migrations/", import.meta.url),
    )
      .filter((name) => name.endsWith(".sql"))
      .sort()
      .map((name) => name.slice(0, 14));
    assert.deepEqual(
      (
        await client.query(
          "select version from supabase_migrations.schema_migrations order by version",
        )
      ).rows.map((row) => row.version),
      versions,
    );
    console.log(
      "Fresh migration history/order matches all reviewed migration files.",
    );
    await client.query(
      readFileSync(
        new URL("../../supabase/tests/rpc_quota_fixtures.sql", import.meta.url),
        "utf8",
      ),
    );
    const before = await snapshot(client);
    const sql = readFileSync(
      new URL(
        "../../supabase/migrations/20261118151125_security_advisor_function_privileges.sql",
        import.meta.url,
      ),
      "utf8",
    );
    // Only this explicitly repeatable privilege/body migration is replayed.
    // CREATE TABLE/history migrations remain once-only and append-only.
    for (let replay = 0; replay < 2; replay++) {
      await client.query(sql);
      assert.deepEqual(await snapshot(client), before);
    }
    console.log(
      "Security migration repeatability: function identity/body/ACL/path, default privileges and fixture data preserved.",
    );
  } catch (error) {
    throw Error(
      "Security migration repeatability failed (" +
        (error.code ?? "assertion") +
        ").",
    );
  } finally {
    await client.query("rollback").catch(() => {});
    await client.end();
  }
}
