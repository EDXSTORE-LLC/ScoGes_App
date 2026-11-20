import { describe, it, expect } from "vitest";
import { schoolSchemas } from "./validation";
import { mayTransitionEnrollment } from "@/modules/enrollments/schemas";
import { hasPermission } from "@/modules/identity/permissions";
const id = "10000000-0000-4000-8000-000000000001";
describe("Sprint 1 inputs and least privilege", () => {
  it("normalizes stable codes and rejects protected identity fields", () => {
    expect(
      schoolSchemas.students.parse({
        code: " S01 ",
        first_name: "A",
        last_name: "B",
      }).code,
    ).toBe("s01");
    for (const field of [
      "tenant_id",
      "id",
      "actor_id",
      "created_by",
      "revision",
    ])
      expect(
        schoolSchemas.students.safeParse({
          code: "s01",
          first_name: "A",
          last_name: "B",
          [field]: id,
        }).success,
      ).toBe(false);
  });
  it("requires names and guardian contact, validates dates and preferences", () => {
    expect(
      schoolSchemas.students.safeParse({
        code: "s01",
        first_name: "",
        last_name: "B",
      }).success,
    ).toBe(false);
    expect(
      schoolSchemas.guardians.safeParse({
        code: "g01",
        first_name: "A",
        last_name: "B",
      }).success,
    ).toBe(false);
    expect(
      schoolSchemas.guardians.parse({
        code: "g01",
        first_name: "A",
        last_name: "B",
        phone: "123",
        notify_sms: "false",
      }).notify_sms,
    ).toBe(false);
    expect(
      schoolSchemas.years.safeParse({
        code: "y1",
        name: "Year",
        starts_on: "2026-12-31",
        ends_on: "2026-01-01",
      }).success,
    ).toBe(false);
    expect(
      schoolSchemas.students.safeParse({
        code: "s01",
        first_name: "A",
        last_name: "B",
        birth_date: "2026-02-30",
      }).success,
    ).toBe(false);
  });
  it("uses explicit permissions for admins/registrars, not authentication or finance", () => {
    for (const role of ["tenant_admin", "registrar"] as const)
      expect(hasPermission([role], "students.write")).toBe(true);
    for (const role of ["finance_manager", "cashier", "auditor"] as const)
      for (const p of [
        "academics.read",
        "students.write",
        "imports.commit",
      ] as const)
        expect(hasPermission([role], p)).toBe(false);
    expect(hasPermission([], "students.write")).toBe(false);
  });
  it("preserves terminal enrollment history and only allows approved transitions", () => {
    expect(mayTransitionEnrollment("draft", "active")).toBe(true);
    expect(mayTransitionEnrollment("active", "withdrawn")).toBe(true);
    expect(mayTransitionEnrollment("active", "completed")).toBe(true);
    expect(mayTransitionEnrollment("draft", "cancelled")).toBe(true);
    for (const state of ["completed", "withdrawn", "cancelled"] as const)
      expect(mayTransitionEnrollment(state, state)).toBe(false);
    expect(mayTransitionEnrollment("active", "draft")).toBe(false);
    expect(mayTransitionEnrollment("draft", "completed")).toBe(false);
  });
});
