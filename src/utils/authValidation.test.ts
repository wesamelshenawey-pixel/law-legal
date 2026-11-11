import { describe, expect, it } from "vitest";
import {
  buildFullPhone,
  isValidEmail,
  isValidFullName,
  isValidNationalNumber,
  phonesMatch,
  sanitizePhoneDigits,
  toTelHref,
  toWhatsAppNumber,
  validateLoginFields,
} from "./authValidation";

describe("email validation", () => {
  it("accepts well formed emails", () => {
    expect(isValidEmail("client@example.com")).toBe(true);
    expect(isValidEmail("  lawyer.name+tag@office.co.uk ")).toBe(true);
  });

  it("rejects malformed emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("client@")).toBe(false);
    expect(isValidEmail("client@example")).toBe(false);
    expect(isValidEmail("client example.com")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
  });
});

describe("full name validation", () => {
  it("accepts Arabic and Latin names", () => {
    expect(isValidFullName("محمد أحمد علي")).toBe(true);
    expect(isValidFullName("Ahmed Mohamed")).toBe(true);
  });

  it("rejects short names and digits", () => {
    expect(isValidFullName("أح")).toBe(false);
    expect(isValidFullName("Ahmed 123")).toBe(false);
  });
});

describe("phone fields with separate country code", () => {
  it("keeps only digits from the national number", () => {
    expect(sanitizePhoneDigits("010 0123-abc4567")).toBe("01001234567");
    expect(isValidNationalNumber("010 0123-abc4567")).toBe(true);
  });

  it("rejects a national number that has no digits or is too short", () => {
    expect(isValidNationalNumber("abcdef")).toBe(false);
    expect(isValidNationalNumber("12345")).toBe(false);
  });

  it("combines the country code and the national number", () => {
    expect(buildFullPhone("+20", "01001234567")).toBe("+2001001234567");
    expect(buildFullPhone("+966", "0501234567")).toBe("+9660501234567");
    expect(buildFullPhone("+20", "")).toBe("");
  });

  it("matches local and international forms of the same number", () => {
    expect(phonesMatch("+2001001234567", "01001234567")).toBe(true);
    expect(phonesMatch("01001234567", "+20 010 0123 4567")).toBe(true);
    expect(phonesMatch("01001234567", "01009999999")).toBe(false);
  });

  it("builds dial and WhatsApp targets", () => {
    expect(toTelHref("+2001001234567")).toBe("+2001001234567");
    expect(toWhatsAppNumber("01001234567")).toBe("201001234567");
    expect(toWhatsAppNumber("+966501234567")).toBe("966501234567");
  });
});

describe("login form validation", () => {
  it("accepts a phone with its country code and a password", () => {
    const result = validateLoginFields({
      countryCode: "+20",
      nationalNumber: "01001234567",
      password: "secret123",
    });
    expect(result.valid).toBe(true);
    expect(result.fullPhone).toBe("+2001001234567");
  });

  it("does not accept letters in the phone field", () => {
    const result = validateLoginFields({
      countryCode: "+20",
      nationalNumber: "abc",
      password: "secret123",
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("phone_required");
  });

  it("rejects a short phone or a missing password", () => {
    expect(
      validateLoginFields({ countryCode: "+20", nationalNumber: "123", password: "secret" }).reason
    ).toBe("phone_invalid");
    expect(
      validateLoginFields({ countryCode: "+20", nationalNumber: "01001234567", password: "" }).reason
    ).toBe("password_required");
  });
});
