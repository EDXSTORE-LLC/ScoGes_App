import { describe, expect, it } from "vitest";
import { passwordSchema, signInSchema, signUpSchema } from "./schemas";

const valid = "Aa1!abcdefgh"; // Exactly 12 characters.
const input = (password: string, confirmPassword = password) => ({
  email: "synthetic@example.invalid",
  password,
  confirmPassword,
});

for (const [name, schema] of [
  ["signup", signUpSchema],
  ["reset", passwordSchema],
] as const) {
  describe(`${name} new-password policy`, () => {
    it.each([
      ["eleven characters", "Aa1!abcdefg"],
      ["no lowercase", "AA1!ABCDEFGH"],
      ["no uppercase", "aa1!abcdefgh"],
      ["no digit", "Aa!!abcdefgh"],
      ["no symbol", "Aa12abcdefgh"],
      ["space instead of symbol", "Aa12abcdefg "],
      ["emoji instead of provider-supported symbol", "Aa12abcdefg🙂"],
      ["over maximum length", "Aa1!" + "a".repeat(125)],
    ])("rejects %s", (_, password) => {
      expect(schema.safeParse(input(password)).success).toBe(false);
    });
    it("accepts both length boundaries and rejects mismatched confirmation", () => {
      expect(schema.safeParse(input(valid)).success).toBe(true);
      expect(schema.safeParse(input("Aa1!" + "a".repeat(124))).success).toBe(
        true,
      );
      expect(schema.safeParse(input(valid, "Bb2!abcdefgh")).success).toBe(
        false,
      );
    });
    it("preserves the exact password, including surrounding spaces", () => {
      const password = " " + valid + " ";
      expect(schema.parse(input(password)).password).toBe(password);
    });
    it.each(["!", "\\", ":", '"', "`", "~", "["])(
      "accepts provider-supported symbol %s",
      (symbol) => {
        expect(schema.safeParse(input("Aa12abcdefg" + symbol)).success).toBe(
          true,
        );
      },
    );
  });
}

it.each(["password", "password123"])(
  "preserves legacy login compatibility for %s",
  (password) => {
    expect(signInSchema.parse(input(password)).password).toBe(password);
  },
);
