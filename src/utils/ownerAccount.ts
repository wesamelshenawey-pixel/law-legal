// Single source of truth for the owner (master admin) account.
// These values are never rendered in the UI — only used for authentication checks.
export const OWNER_PHONES = ["01283233555", "1283233555", "+201283233555"];

export const OWNER_PASSWORD = "Wesam.91089";

export const OWNER_NAME = "الأستاذ وسام حمدي الشناوي";

export const isOwnerPhone = (phone?: string): boolean =>
  !!phone && OWNER_PHONES.includes(phone.trim());
