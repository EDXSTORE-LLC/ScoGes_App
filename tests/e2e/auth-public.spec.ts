import { expect, test } from "./fixtures";

test("authentication pages support French and English", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(
    page.getByLabel("Confirm password", { exact: true }),
  ).toBeVisible();
});

test("signup rejects password mismatch without sending an email", async ({
  page,
}) => {
  await page.goto("/signup?locale=en");
  await page.getByLabel("Email address").fill("test@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("Valid-PasswordAa1!");
  await page.getByLabel("Confirm password").fill("Different-PasswordAa1!");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Both passwords must match",
  );
});

test("recovery has a real email field and unauthenticated reset cannot update a password", async ({
  page,
}) => {
  await page.goto("/auth/forgot-password?locale=en");
  await expect(page.getByLabel("Email address")).toBeVisible();
  await page.goto("/auth/reset-password?locale=en");
  await expect(page.getByRole("status")).toContainText(
    "invalid, expired or already used",
  );
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
});

test("invalid invitation has no enabled acceptance action", async ({
  page,
}) => {
  await page.goto("/invitations/accept?locale=en");
  await expect(page.getByRole("status")).toContainText(
    "invalid, expired or already used",
  );
  await expect(
    page.getByRole("button", { name: "Open invitation" }),
  ).toBeDisabled();
});

for (const locale of ["fr", "en"] as const) {
  test(`signup enforces the ${locale} new-password policy without sending email`, async ({
    page,
  }) => {
    await page.goto(`/signup?locale=${locale}`);
    const password = page.getByLabel(
      locale === "fr" ? "Mot de passe" : "Password",
      { exact: true },
    );
    const confirm = page.getByLabel(
      locale === "fr" ? "Confirmer le mot de passe" : "Confirm password",
      { exact: true },
    );
    await expect(password).toHaveAttribute("minlength", "12");
    await expect(password).toHaveAccessibleDescription(/12/);
    await page
      .getByLabel(locale === "fr" ? "Adresse e-mail" : "Email address")
      .fill("policy@example.invalid");
    // Browser length validation rejects this before submission.
    await password.fill("Aa1!abcdefg");
    await confirm.fill("Aa1!abcdefg");
    expect(
      await password.evaluate(
        (field: HTMLInputElement) => field.validity.tooShort,
      ),
    ).toBe(true);
    // A long-enough password missing classes reaches server-side validation.
    await password.fill("abcdefghijkl");
    await confirm.fill("abcdefghijkl");
    await page
      .getByRole("button", {
        name: locale === "fr" ? "Continuer" : "Continue",
        exact: true,
      })
      .click();
    await expect(page.getByRole("status")).toContainText(
      locale === "fr" ? "au moins 12 caractères" : "at least 12 characters",
    );
    await expect(page).toHaveURL(/\/signup/);
  });
  test(`invalid sign-in reports a safe ${locale} failure`, async ({ page }) => {
    await page.goto(`/login?locale=${locale}`);
    await page
      .getByLabel(locale === "fr" ? "Adresse e-mail" : "Email address")
      .fill("nonexistent-validation@example.invalid");
    await page
      .getByLabel(locale === "fr" ? "Mot de passe" : "Password", {
        exact: true,
      })
      .fill("Unmatched-LoginAa1!");
    await page
      .getByRole("button", {
        name: locale === "fr" ? "Se connecter" : "Sign in",
        exact: true,
      })
      .click();
    await expect(page.getByRole("status")).toContainText(
      locale === "fr" ? "incorrect" : "Incorrect email or password",
    );
    await expect(page).toHaveURL(/\/login/);
  });
}
