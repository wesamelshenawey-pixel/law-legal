// Browser Push & In-App Notification Utility for Law Firm Portal
import { SessionRecord } from "../types";

export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

/**
 * Checks current browser notification permission
 */
export function getNotificationPermissionStatus(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Requests browser notification permission from the user
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (e) {
    console.error("Error requesting notification permission:", e);
    return "denied";
  }
}

/**
 * Plays an audio chime alert for high-priority notifications using Web Audio API
 */
export function playNotificationSound() {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Smooth dual-tone legal notification chime
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(440, now); // A4
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch (e) {
    // Ignore audio autoplay policy restrictions
  }
}

/**
 * Sends a native browser push notification if permissions are granted
 */
export async function sendBrowserNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
  },
  onClick?: () => void
): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  // Play audio chime
  playNotificationSound();

  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    // Prefer service worker registration if present
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body: options?.body || "",
          icon: options?.icon || "/favicon.ico",
          badge: options?.badge || "/favicon.ico",
          tag: options?.tag || `law-alert-${Date.now()}`,
          requireInteraction: options?.requireInteraction || false,
          data: options?.data,
          dir: "rtl",
          lang: "ar"
        } as any);
        return true;
      }
    }

    // Fallback to standard Notification instance
    const notification = new Notification(title, {
      body: options?.body || "",
      icon: options?.icon || "/favicon.ico",
      tag: options?.tag || `law-alert-${Date.now()}`,
      requireInteraction: options?.requireInteraction || false,
      dir: "rtl",
      lang: "ar"
    } as any);

    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }

    return true;
  } catch (e) {
    console.error("Failed to display browser notification:", e);
    return false;
  }
}

// Track notified session IDs to prevent spamming
const notifiedSessionIds = new Set<string>();

/**
 * Scans upcoming sessions (today & tomorrow) and dispatches native browser alerts
 */
export function checkUpcomingSessionsAndNotify(
  sessions: SessionRecord[],
  language: "ar" | "en" = "ar"
) {
  if (typeof window === "undefined" || Notification.permission !== "granted") {
    return;
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  sessions.forEach((session) => {
    const isToday = session.date === todayStr;
    const isTomorrow = session.date === tomorrowStr;

    if ((isToday || isTomorrow) && !notifiedSessionIds.has(session.id)) {
      notifiedSessionIds.add(session.id);

      const caseNum = session.caseInfo?.caseNumber || session.caseId || "قضية";
      const court = session.caseInfo?.competentCourt || "المحكمة";
      const client = session.caseInfo?.clientName || "الموكل";

      if (isToday) {
        sendBrowserNotification(
          language === "ar" ? `🚨 تنبيه محاكمة اليوم: قضية ${caseNum}` : `🚨 Today's Court Session: Case ${caseNum}`,
          {
            body: language === "ar"
              ? `لديك جلسة اليوم بالمحكمة (${court}) للموكل (${client}). يرجى مراجعة ملف المرافعة والطلبات.`
              : `You have a court hearing today at (${court}) for client (${client}). Review brief and documents.`,
            tag: `session-today-${session.id}`,
            requireInteraction: true
          }
        );
      } else if (isTomorrow) {
        sendBrowserNotification(
          language === "ar" ? `📅 تذكير بجلسة غداً: قضية ${caseNum}` : `📅 Hearing Tomorrow: Case ${caseNum}`,
          {
            body: language === "ar"
              ? `جلسة محاكمة مقررة غداً بالمحكمة (${court}) للموكل (${client}). تأكد من إعداد المذكرات والمستندات.`
              : `Trial session scheduled tomorrow at (${court}) for client (${client}). Prepare defense memos.`,
            tag: `session-tomorrow-${session.id}`
          }
        );
      }
    }
  });
}

/**
 * Notifies the lawyer when a client sends a note, confirmation, or signed memo
 */
export function notifyClientActivity(
  clientName: string,
  activityTitle: string,
  activityDetails: string,
  language: "ar" | "en" = "ar"
) {
  sendBrowserNotification(
    language === "ar" ? `📩 إشعار جديد من الموكل: ${clientName}` : `📩 New Client Activity: ${clientName}`,
    {
      body: `${activityTitle}\n${activityDetails}`,
      tag: `client-activity-${Date.now()}`,
      requireInteraction: false
    }
  );
}
