import pg from "pg";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { databaseTestOptions, loopbackUrl } from "../ci/environment.mjs";
export function schoolTestOptions(env) {
  if (env.CI_ENFORCE_INTEGRATION !== "1" || env.DATABASE_TEST_LOCAL !== "1")
    throw Error("School concurrency requires isolated CI");
  loopbackUrl(env.DATABASE_URL, ["postgres:", "postgresql:"]);
  return databaseTestOptions(env);
}
export async function testSchoolConcurrency(env) {
  const options = schoolTestOptions(env),
    owner = new pg.Client(options),
    tenant = randomUUID(),
    actor = randomUUID(),
    membership = randomUUID();
  await owner.connect();
  async function save(kind, data, id = null, revision = null) {
    return (
      await owner.query("select public.save_school_record($1,$2,$3,$4,$5) id", [
        tenant,
        kind,
        id,
        revision,
        data,
      ])
    ).rows[0].id;
  }
  async function race(kind, values, id = null, revision = null) {
    return Promise.all(
      values.map(async (data) => {
        const c = new pg.Client(options);
        await c.connect();
        try {
          await c.query("begin");
          await c.query("set local role authenticated");
          await c.query("select set_config('request.jwt.claim.sub',$1,true)", [
            actor,
          ]);
          await c.query("select public.save_school_record($1,$2,$3,$4,$5)", [
            tenant,
            kind,
            id,
            revision,
            data,
          ]);
          await c.query("commit");
          return { ok: true };
        } catch (e) {
          await c.query("rollback");
          return { ok: false, code: e.code, message: e.message };
        } finally {
          await c.end();
        }
      }),
    );
  }
  try {
    await owner.query("begin");
    await owner.query(
      "insert into auth.users(id,email,email_confirmed_at) values($1,$2,clock_timestamp())",
      [actor, `${actor}@example.invalid`],
    );
    await owner.query("insert into public.profiles(id,email) values($1,$2)", [
      actor,
      `${actor}@example.invalid`,
    ]);
    await owner.query(
      "insert into public.tenants(id,name,slug) values($1,'School race fixture',$2)",
      [tenant, `s1-${tenant}`],
    );
    await owner.query(
      "insert into public.memberships(id,tenant_id,user_id) values($1,$2,$3)",
      [membership, tenant, actor],
    );
    await owner.query(
      "insert into public.membership_roles(membership_id,role_id) select $1,id from public.roles where key='tenant_admin'",
      [membership],
    );
    await owner.query("commit");
    await owner.query("select set_config('request.jwt.claim.sub',$1,false)", [
      actor,
    ]);
    const years = await race(
      "years",
      ["a", "b"].map((code) => ({
        code,
        name: code,
        starts_on: "2026-01-01",
        ends_on: "2026-12-31",
        status: "active",
      })),
    );
    assert.equal(years.filter((r) => r.ok).length, 1);
    assert.equal(years.filter((r) => r.code === "23505").length, 1);
    const year = (
      await owner.query(
        "select id from public.academic_years where tenant_id=$1",
        [tenant],
      )
    ).rows[0].id;
    const level = await save("levels", { code: "level", name: "Level" }),
      student = await save("students", {
        code: "student",
        first_name: "A",
        last_name: "B",
      });
    const enrollments = await race(
      "enrollments",
      [0, 1].map(() => ({
        student_id: student,
        year_id: year,
        level_id: level,
        status: "draft",
      })),
    );
    assert.equal(enrollments.filter((r) => r.ok).length, 1);
    assert.equal(enrollments.filter((r) => r.code === "23505").length, 1);
    const changes = await race(
      "students",
      [{ first_name: "C" }, { first_name: "D" }],
      student,
      1,
    );
    assert.equal(changes.filter((r) => r.ok).length, 1);
    assert.equal(changes.filter((r) => r.message === "stale_write").length, 1);
    assert.equal(
      (
        await owner.query(
          "select count(*)::int n from public.enrollment_history where tenant_id=$1",
          [tenant],
        )
      ).rows[0].n,
      1,
    );
    console.log(
      "Sprint 1 concurrent active-year, canonical-enrollment and revision/history assertions: passed",
    );
  } finally {
    await owner.query("rollback").catch(() => {});
    await owner.query("delete from public.audit_events where tenant_id=$1", [
      tenant,
    ]);
    await owner.query("delete from public.tenants where id=$1", [tenant]);
    await owner.query("delete from auth.users where id=$1", [actor]);
    await owner.end();
  }
}
