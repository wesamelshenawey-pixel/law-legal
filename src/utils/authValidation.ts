/**
 * Shared validation/normalisation rules for the login & registration model.
 *
 * Login is phone-only: every account is identified by its international mobile
 * number (`+<country code><national number>`) plus its password. The country
 * code is entered separately from the national number, so these helpers are the
 * single place that knows how to combine, sanitise and compare those fields.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/** Keep digits only: the phone field must never accept letters or symbols. */
export function sanitizePhoneDigits(value: string | null | undefined): string {
  return (value || "").replace(/[^\d]/g, "");
}

/** Email is optional on registration, but when present it must be well formed. */
export function isValidEmail(value: string | null | undefined): boolean {
  const email = (value || "").trim();
  return email.length > 0 && email.length <= 254 && EMAIL_PATTERN.test(email);
}

/** A person's full name: at least three letters, no digits. */
export function isValidFullName(value: string | null | undefined): boolean {
  const name = (value || "").trim().replace(/\s+/g, " ");
  return name.length >= 3 && name.length <= 120 && /^[\p{L}\p{M}\s.'-]+$/u.test(name);
}

/**
 * National mobile number (without the country code): digits only, 6–15 digits
 * as per E.164. The country code itself is validated separately.
 */
export function isValidNationalNumber(value: string | null | undefined): boolean {
  const digits = sanitizePhoneDigits(value);
  return digits.length >= 6 && digits.length <= 15;
}

export function isValidCountryCode(value: string | null | undefined): boolean {
  return /^\+\d{1,4}$/.test((value || "").trim());
}

/** Build the stored international form, e.g. ("+20", "01001234567") → "+2001001234567". */
export function buildFullPhone(
  countryCode: string | null | undefined,
  nationalNumber: string | null | undefined
): string {
  const code = sanitizePhoneDigits(countryCode);
  const national = sanitizePhoneDigits(nationalNumber);
  if (!national) return "";
  return code ? `+${code}${national}` : national;
}

/**
 * Compare a stored phone with a freshly entered one. Stored records may hold a
 * local Egyptian number ("01001234567") while the login form sends the
 * international form ("+2001001234567"), so compare national significant digits.
 */
export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = sanitizePhoneDigits(a).replace(/^0+/, "");
  const right = sanitizePhoneDigits(b).replace(/^0+/, "");
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length < 8 || right.length < 8) return false;
  return left.slice(-9) === right.slice(-9);
}

/** `tel:` target — keeps the international prefix so dialers resolve it. */
export function toTelHref(phone: string | null | undefined): string {
  const digits = sanitizePhoneDigits(phone);
  if (!digits) return "";
  return (phone || "").trim().startsWith("+") ? `+${digits}` : digits;
}

/**
 * `wa.me` target. Local Egyptian numbers ("0100…") become 20 + the number;
 * numbers already stored internationally are returned as their digits.
 */
export function toWhatsAppNumber(phone: string | null | undefined, defaultCountryCode = "+20"): string {
  const digits = sanitizePhoneDigits(phone);
  if (!digits) return "";
  if ((phone || "").trim().startsWith("+")) return digits;
  const code = sanitizePhoneDigits(defaultCountryCode);
  return `${code}${digits.replace(/^0+/, "")}`;
}

export type LoginValidationReason =
  | "phone_required"
  | "phone_invalid"
  | "password_required";

export interface LoginValidationInput {
  countryCode: string;
  nationalNumber: string;
  password: string;
}

export interface LoginValidationResult {
  valid: boolean;
  reason?: LoginValidationReason;
  fullPhone: string;
}

/** Validation shared by the login form and its automated tests. */
export function validateLoginFields({
  countryCode,
  nationalNumber,
  password,
}: LoginValidationInput): LoginValidationResult {
  const national = sanitizePhoneDigits(nationalNumber);
  if (!national) return { valid: false, reason: "phone_required", fullPhone: "" };
  if (!isValidCountryCode(countryCode) || !isValidNationalNumber(national)) {
    return { valid: false, reason: "phone_invalid", fullPhone: "" };
  }
  if (!password || password.length < 4) {
    return { valid: false, reason: "password_required", fullPhone: buildFullPhone(countryCode, national) };
  }
  return { valid: true, fullPhone: buildFullPhone(countryCode, national) };
}
