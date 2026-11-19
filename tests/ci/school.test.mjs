import { test } from "node:test";
import assert from "node:assert/strict";
import { schoolTestOptions } from "../../scripts/tests/school-concurrency.mjs";
test("school concurrency cannot create hosted fixtures or bypass isolation flags", () => {
  const flags = { CI_ENFORCE_INTEGRATION: "1", DATABASE_TEST_LOCAL: "1" };
  for (const url of [
    "postgres://x@hosted.example/db",
    "postgres://x@127.0.0.1.attacker.example/db",
  ])
    assert.throws(() => schoolTestOptions({ ...flags, DATABASE_URL: url }));
  for (const flag of Object.keys(flags))
    assert.throws(() =>
      schoolTestOptions({
        ...flags,
        [flag]: "",
        DATABASE_URL: "postgres://x@127.0.0.1/db",
      }),
    );
});
test("school concurrency accepts only the explicit disposable local configuration", () => {
  assert.equal(
    schoolTestOptions({
      CI_ENFORCE_INTEGRATION: "1",
      DATABASE_TEST_LOCAL: "1",
      DATABASE_URL: "postgres://x@127.0.0.1/db",
    }).ssl,
    false,
  );
});
