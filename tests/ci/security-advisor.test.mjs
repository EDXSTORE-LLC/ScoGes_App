import assert from "node:assert/strict";
import test from "node:test";
import { securityAdvisorTestOptions } from "../../scripts/tests/security-advisor.mjs";

test("security migration replay rejects missing isolated opt-in before connecting", () => {
  for (const env of [
    {},
    { CI_ENFORCE_INTEGRATION: "1" },
    { DATABASE_TEST_LOCAL: "1" },
  ])
    assert.throws(() => securityAdvisorTestOptions(env), /isolated local CI/);
});

test("security migration replay rejects hosted and deceptive endpoints", () => {
  for (const host of [
    "db.example.com",
    "127.0.0.1.example.com",
    "localhost.example.com",
  ])
    assert.throws(
      () =>
        securityAdvisorTestOptions({
          CI_ENFORCE_INTEGRATION: "1",
          DATABASE_TEST_LOCAL: "1",
          DATABASE_URL: `postgresql://test:test@${host}/postgres`,
        }),
      /loopback/,
    );
  assert.equal(
    securityAdvisorTestOptions({
      CI_ENFORCE_INTEGRATION: "1",
      DATABASE_TEST_LOCAL: "1",
      DATABASE_URL: "postgresql://test:test@127.0.0.1:54322/postgres",
    }).ssl,
    false,
  );
});
