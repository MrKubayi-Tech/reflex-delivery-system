/**
 * lib/validation.ts
 *
 * Client-side mirrors of the backend's validation rules (see
 * reflex-delivery-system-api/src/auth/register.php and
 * src/requests/create.php). These never replace server-side checks —
 * the server is still the source of truth and every caller must still
 * handle ApiError.fieldErrors from a 422 response — but they let the
 * UI show a mistake the moment someone leaves a field, instead of
 * making them submit first to find out.
 *
 * Every validator returns a message string (shown to the user) or
 * undefined (field is fine so far).
 */

/** Kenyan-friendly E.164-ish check: optional +, 9-15 digits total. */
const PHONE_PATTERN = /^\+?[0-9]{9,15}$/;

export function validatePhone(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Phone number is required';
  if (!PHONE_PATTERN.test(trimmed.replace(/[\s-]/g, ''))) {
    return 'Enter a valid phone number, e.g. +254712345678';
  }
  return undefined;
}

export function validateRequired(value: string, label: string): string | undefined {
  if (!value.trim()) return `${label} is required`;
  return undefined;
}

/** Mirrors the backend's 8-character minimum (register.php). */
export function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  return undefined;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | undefined {
  if (!confirmation) return 'Please confirm your password';
  if (password !== confirmation) return 'Passwords do not match';
  return undefined;
}

export function validateWeight(value: string): string | undefined {
  if (!value.trim()) return undefined; // optional field
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) return 'Weight must be a positive number';
  return undefined;
}

/**
 * Runs a map of {field: validator} and returns only the fields that
 * failed. Lets a form declare its whole rule set in one place and call
 * this both on submit and per-field on blur.
 */
export function runValidators(
  validators: Record<string, () => string | undefined>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, check] of Object.entries(validators)) {
    const message = check();
    if (message) errors[field] = message;
  }
  return errors;
}
