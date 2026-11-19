// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const { signup } = vi.hoisted(() => ({ signup: vi.fn() }));
vi.mock("@/modules/identity/actions", () => ({
  signUpAction: signup,
  signInAction: vi.fn(),
  requestPasswordResetAction: vi.fn(),
  updatePasswordAction: vi.fn(),
}));
vi.mock("@/modules/identity/invitation-actions", () => ({
  acceptInvitationAction: vi.fn(),
  captureInvitationAction: vi.fn(),
}));
import { AuthForm } from "./auth-form";
import { authText } from "@/modules/identity/auth-messages";
afterEach(cleanup);

for (const locale of ["fr", "en"] as const) {
  it.each(["signup", "reset"] as const)(
    `shows accessible ${locale} new-password requirements for %s`,
    (mode) => {
      render(<AuthForm mode={mode} locale={locale} />);
      for (const label of ["password", "confirm"] as const) {
        const field = screen.getByLabelText(authText(locale, label), {
          exact: true,
        });
        expect(field).toHaveAttribute("minlength", "12");
        expect(field).toHaveAttribute("maxlength", "128");
        expect(field).toHaveAttribute("autocomplete", "new-password");
        expect(field).toHaveAccessibleDescription(
          authText(locale, "passwordHint"),
        );
      }
    },
  );
  it(`keeps ${locale} legacy login fields free of new-password requirements`, () => {
    render(<AuthForm mode="login" locale={locale} />);
    const password = screen.getByLabelText(authText(locale, "password"), {
      exact: true,
    });
    expect(password).toHaveAttribute("minlength", "8");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(password).not.toHaveAttribute("aria-describedby");
    expect(
      screen.queryByText(authText(locale, "passwordHint")),
    ).not.toBeInTheDocument();
  });
  it(`keeps the entered email and clears passwords after a ${locale} provider failure`, async () => {
    signup.mockResolvedValue({
      ok: false,
      message: authText(locale, "emailRateLimited"),
    });
    const { container } = render(<AuthForm mode="signup" locale={locale} />);
    const email = screen.getByLabelText(authText(locale, "email"));
    fireEvent.change(email, { target: { value: "synthetic@example.invalid" } });
    fireEvent.change(
      screen.getByLabelText(authText(locale, "password"), { exact: true }),
      { target: { value: "Synthetic-PasswordAa1!" } },
    );
    fireEvent.change(screen.getByLabelText(authText(locale, "confirm")), {
      target: { value: "Synthetic-PasswordAa1!" },
    });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        authText(locale, "emailRateLimited"),
      ),
    );
    expect(email).toHaveValue("synthetic@example.invalid");
    expect(
      screen.getByLabelText(authText(locale, "password"), { exact: true }),
    ).toHaveValue("");
    expect(screen.getByLabelText(authText(locale, "confirm"))).toHaveValue("");
  });
}
