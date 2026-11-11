import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LoginView from "./LoginView";
import { PlatformUser, UserRole } from "../types";

const registeredUsers: PlatformUser[] = [
  {
    id: "usr-staff-1",
    name: "سكرتير تجريبي",
    phone: "01001234567",
    passwordHash: "secret123",
    role: UserRole.STAFF,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
];

function renderLogin() {
  const onLoginSuccess = vi.fn();
  const utils = render(
    <LoginView
      onLoginSuccess={onLoginSuccess}
      registeredUsers={registeredUsers}
      onRegisterUser={vi.fn()}
      language="ar"
      setLanguage={vi.fn()}
      isDarkMode={true}
      setIsDarkMode={vi.fn()}
      licenses={[]}
      onBindPhoneToLicense={() => true}
    />
  );
  return { ...utils, onLoginSuccess };
}

describe("login screen", () => {
  it("signs users in with the phone number only (no name or email fields)", () => {
    const { onLoginSuccess } = renderLogin();

    // The login form no longer renders the full name or email inputs.
    expect(document.querySelector('input[type="email"]')).toBeNull();
    expect(screen.queryByText("الاسم الكامل")).toBeNull();
    expect(screen.queryByText("البريد الإلكتروني")).toBeNull();

    // A mobile number with a separate country code is all that identifies a user.
    expect(screen.getByPlaceholderText("010XXXXXXXX")).toBeInTheDocument();
  });

  it("keeps only digits in the phone field and submits the international number", async () => {
    const user = userEvent.setup();
    const { onLoginSuccess } = renderLogin();

    const phoneInput = screen.getByPlaceholderText("010XXXXXXXX");
    await user.type(phoneInput, "01a0-01b23 4567");
    expect((phoneInput as HTMLInputElement).value).toBe("01001234567");

    await user.type(screen.getByPlaceholderText("••••••••"), "secret123");
    await user.click(screen.getByRole("button", { name: "تسجيل الدخول للنظام" }));

    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    expect(onLoginSuccess.mock.calls[0][0]).toMatchObject({
      id: "usr-staff-1",
      role: UserRole.STAFF,
    });
  });

  it("rejects a phone number without a valid national number", async () => {
    const user = userEvent.setup();
    const { onLoginSuccess } = renderLogin();

    await user.type(screen.getByPlaceholderText("010XXXXXXXX"), "123");
    await user.type(screen.getByPlaceholderText("••••••••"), "secret123");
    await user.click(screen.getByRole("button", { name: "تسجيل الدخول للنظام" }));

    expect(onLoginSuccess).not.toHaveBeenCalled();
    expect(screen.getByText(/رقم الهاتف غير صحيح/)).toBeInTheDocument();
  });

  it("does not show any stored password or credential hint", () => {
    renderLogin();
    const card = document.querySelector("form") as HTMLElement;
    expect(within(card).queryByText(/Wesam\.91089|1283233555|password/i)).toBeNull();
  });
});
