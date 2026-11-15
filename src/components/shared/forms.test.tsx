// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const { createTenant } = vi.hoisted(() => ({ createTenant: vi.fn() }));
vi.mock("@/modules/tenants/actions", () => ({
  createTenantAction: createTenant,
}));
vi.mock("@/modules/identity/invitation-actions", () => ({
  inviteMemberAction: vi.fn(),
}));
import { TenantOnboardingForm } from "./forms";
import { foundationText } from "@/i18n/foundation-messages";
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
for (const locale of ["fr", "en"] as const) {
  for (const failure of [
    "invalid",
    "duplicate",
    "unavailable",
    "rateLimited",
  ]) {
    it(`retains all editable settings after ${locale} ${failure} and submits corrected values`, async () => {
      createTenant
        .mockResolvedValueOnce({ ok: false, message: failure })
        .mockResolvedValueOnce({ ok: false, message: "retry complete" });
      const { container } = render(<TenantOnboardingForm locale={locale} />);
      const settings = [
        ["name", "X"],
        ["slug", "reserved-slug"],
        ["country", "GH"],
        ["baseCurrency", "GHS"],
        ["timezone", "Africa/Accra"],
        ["defaultLocale", "en"],
      ] as const;
      const field = (name: string) =>
        container.querySelector(`[name="${name}"]`)!;
      for (const [name, value] of settings)
        fireEvent.change(field(name), { target: { value } });
      fireEvent.submit(container.querySelector("form")!);
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(failure),
      );
      for (const [name, value] of settings)
        expect(field(name)).toHaveValue(value);
      expect(createTenant).toHaveBeenCalledTimes(1);
      fireEvent.change(screen.getByLabelText(foundationText(locale, "name")), {
        target: { value: "Corrected school" },
      });
      fireEvent.change(field("slug"), { target: { value: "corrected-slug" } });
      fireEvent.submit(container.querySelector("form")!);
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("retry complete"),
      );
      const submitted = createTenant.mock.calls[1][1] as FormData;
      expect(submitted.get("name")).toBe("Corrected school");
      expect(submitted.get("slug")).toBe("corrected-slug");
      expect(submitted.get("locale")).toBe(locale);
      for (const [name, value] of settings.slice(2))
        expect(submitted.get(name)).toBe(value);
      expect(Array.from(submitted.keys()).sort()).toEqual(
        [
          "baseCurrency",
          "country",
          "defaultLocale",
          "locale",
          "name",
          "slug",
          "timezone",
        ].sort(),
      );
    });
  }
}
