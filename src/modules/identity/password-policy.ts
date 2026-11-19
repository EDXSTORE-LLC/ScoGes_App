export const newPasswordMinLength = 12;
export const newPasswordMaxLength = 128;

// Match the symbol set accepted by Supabase's strongest character requirement.
const symbols = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

export function hasRequiredPasswordCharacters(password: string) {
  return (
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    [...symbols].some((symbol) => password.includes(symbol))
  );
}
