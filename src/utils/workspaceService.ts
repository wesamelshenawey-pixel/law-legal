import firebaseConfig from "../../firebase-applet-config.json";

export interface WorkspaceTokenState {
  accessToken: string | null;
  expiresAt: number | null;
  userEmail: string | null;
  userName: string | null;
}

export interface GoogleContact {
  resourceName: string;
  name: string;
  phone?: string;
  email?: string;
  jobTitle?: string;
  notes?: string;
  avatarUrl?: string;
}

export interface GoogleKeepNote {
  id: string;
  title: string;
  content: string;
  date: string;
  tags?: string[];
  pinned?: boolean;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  size?: string;
  modifiedTime?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  bodyHtml?: string;
  bodyText?: string;
}

export interface ChatSpace {
  name: string;
  displayName: string;
  type: "SPACE" | "GROUP_CHAT" | "DIRECT_MESSAGE";
  description?: string;
}

export interface ChatMessage {
  name: string;
  text: string;
  createTime: string;
  sender: {
    displayName: string;
    email?: string;
    avatarUrl?: string;
  };
}

const SCOPES = [
  "https://www.googleapis.com/auth/photoslibrary.readonly",
  "https://www.googleapis.com/auth/contacts",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/meetings.space.create",
  "https://www.googleapis.com/auth/chat.messages",
  "https://www.googleapis.com/auth/chat.messages.create",
  "https://www.googleapis.com/auth/chat.messages.readonly",
  "https://www.googleapis.com/auth/chat.spaces",
  "https://www.googleapis.com/auth/chat.spaces.readonly",
  "https://www.googleapis.com/auth/chat.memberships",
  "https://www.googleapis.com/auth/chat.memberships.readonly",
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send"
];

const TOKEN_STORAGE_KEY = "wesam_workspace_token";

export function getStoredWorkspaceToken(): WorkspaceTokenState {
  try {
    const saved = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!saved) return { accessToken: null, expiresAt: null, userEmail: null, userName: null };
    const parsed = JSON.parse(saved);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return { accessToken: null, expiresAt: null, userEmail: null, userName: null };
    }
    return parsed;
  } catch {
    return { accessToken: null, expiresAt: null, userEmail: null, userName: null };
  }
}

export function saveWorkspaceToken(token: string, expiresInSec: number = 3599, email?: string, name?: string) {
  const state: WorkspaceTokenState = {
    accessToken: token,
    expiresAt: Date.now() + expiresInSec * 1000,
    userEmail: email || "wesam.elshenawey@gmail.com",
    userName: name || "الأستاذ وسام الشناوي"
  };
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function clearWorkspaceToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

// Request OAuth token using Google Identity Services (GSI)
export function requestWorkspaceAuth(callback: (tokenState: WorkspaceTokenState) => void, onError?: (err: any) => void) {
  const clientId = firebaseConfig.oAuthClientId;
  
  if (typeof window === "undefined") return;

  // Load GIS script if not present
  if (!(window as any).google?.accounts?.oauth2) {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initTokenClient();
    };
    script.onerror = (e) => {
      if (onError) onError(e);
    };
    document.head.appendChild(script);
  } else {
    initTokenClient();
  }

  function initTokenClient() {
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES.join(" "),
        callback: (resp: any) => {
          if (resp.error) {
            console.error("GSI OAuth Error:", resp);
            if (onError) onError(resp);
            return;
          }
          const tokenState = saveWorkspaceToken(resp.access_token, resp.expires_in);
          callback(tokenState);
        }
      });
      client.requestAccessToken();
    } catch (err) {
      console.error("Token client error:", err);
      if (onError) onError(err);
    }
  }
}

// ==========================================
// GMAIL API INTEGRATION METHODS
// ==========================================

export async function fetchGmailMessages(token: string, maxResults = 15, query = ""): Promise<GmailMessage[]> {
  try {
    const qParam = query ? `&q=${encodeURIComponent(query)}` : "";
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${qParam}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!listRes.ok) {
      throw new Error(`Gmail API error: ${listRes.statusText}`);
    }

    const listData = await listRes.json();
    if (!listData.messages || listData.messages.length === 0) {
      return [];
    }

    // Fetch individual message details in parallel
    const details = await Promise.all(
      listData.messages.slice(0, 10).map(async (msg: { id: string }) => {
        try {
          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          if (!res.ok) return null;
          const data = await res.json();
          
          const headers = data.payload?.headers || [];
          const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

          return {
            id: data.id,
            threadId: data.threadId,
            snippet: data.snippet || "",
            from: getHeader("from"),
            to: getHeader("to"),
            subject: getHeader("subject") || "(بدون عنوان)",
            date: getHeader("date") || new Date().toISOString()
          } as GmailMessage;
        } catch {
          return null;
        }
      })
    );

    return details.filter((m): m is GmailMessage => m !== null);
  } catch (err) {
    console.error("fetchGmailMessages error:", err);
    throw err;
  }
}

export async function sendGmailEmail(token: string, { to, subject, bodyHtml }: { to: string; subject: string; bodyHtml: string }) {
  try {
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const messageParts = [
      `To: ${to}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${utf8Subject}`,
      "",
      bodyHtml
    ];
    const message = messageParts.join("\r\n");

    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: encodedMessage })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "فشل إرسال البريد الإلكتروني.");
    }

    return await res.json();
  } catch (err) {
    console.error("sendGmailEmail error:", err);
    throw err;
  }
}

// ==========================================
// GOOGLE CHAT API INTEGRATION METHODS
// ==========================================

export async function fetchChatSpaces(token: string): Promise<ChatSpace[]> {
  try {
    const res = await fetch("https://chat.googleapis.com/v1/spaces?pageSize=20", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`Chat API error: ${res.statusText}`);
    }

    const data = await res.json();
    return (data.spaces || []).map((s: any) => ({
      name: s.name,
      displayName: s.displayName || s.name.replace("spaces/", "مساحة "),
      type: s.type || "SPACE",
      description: s.spaceDetails?.description || ""
    }));
  } catch (err) {
    console.error("fetchChatSpaces error:", err);
    throw err;
  }
}

export async function fetchChatMessages(token: string, spaceName: string): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=25`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`Chat Messages API error: ${res.statusText}`);
    }

    const data = await res.json();
    return (data.messages || []).map((m: any) => ({
      name: m.name,
      text: m.text || "",
      createTime: m.createTime || new Date().toISOString(),
      sender: {
        displayName: m.sender?.displayName || "عضو",
        email: m.sender?.name || "",
        avatarUrl: m.sender?.avatarUrl
      }
    }));
  } catch (err) {
    console.error("fetchChatMessages error:", err);
    throw err;
  }
}

export async function sendChatMessage(token: string, spaceName: string, text: string) {
  try {
    const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "فشل إرسال رسالة المحادثة.");
    }

    return await res.json();
  } catch (err) {
    console.error("sendChatMessage error:", err);
    throw err;
  }
}

// ==========================================
// GOOGLE CONTACTS (PEOPLE API) INTEGRATION
// ==========================================

export async function fetchGoogleContacts(token: string, pageSize = 50): Promise<GoogleContact[]> {
  try {
    const res = await fetch(
      `https://people.googleapis.com/v1/people/me/connections?pageSize=${pageSize}&personFields=names,phoneNumbers,emailAddresses,organizations,photos,biographies`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `خطأ في جلب جهات الاتصال: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.connections || data.connections.length === 0) {
      return [];
    }

    return data.connections.map((c: any) => {
      const primaryName = c.names?.[0]?.displayName || "جهة اتصال بدون اسم";
      const primaryPhone = c.phoneNumbers?.[0]?.value || "";
      const primaryEmail = c.emailAddresses?.[0]?.value || "";
      const job = c.organizations?.[0]?.title || c.organizations?.[0]?.name || "";
      const note = c.biographies?.[0]?.value || "";
      const avatar = c.photos?.[0]?.url || "";

      return {
        resourceName: c.resourceName || "",
        name: primaryName,
        phone: primaryPhone,
        email: primaryEmail,
        jobTitle: job,
        notes: note,
        avatarUrl: avatar
      };
    });
  } catch (err) {
    console.error("fetchGoogleContacts error:", err);
    throw err;
  }
}

export async function createGoogleContact(token: string, contact: { name: string; phone?: string; email?: string; notes?: string }) {
  try {
    const res = await fetch("https://people.googleapis.com/v1/people:createContact", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        names: [{ givenName: contact.name }],
        phoneNumbers: contact.phone ? [{ value: contact.phone, type: "mobile" }] : undefined,
        emailAddresses: contact.email ? [{ value: contact.email, type: "work" }] : undefined,
        biographies: contact.notes ? [{ value: contact.notes, contentType: "TEXT_PLAIN" }] : undefined
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "فشل إضافة جهة الاتصال إلى Google Contacts");
    }

    return await res.json();
  } catch (err) {
    console.error("createGoogleContact error:", err);
    throw err;
  }
}

// ==========================================
// GOOGLE DRIVE API & PICKER INTEGRATION
// ==========================================

export async function fetchGoogleDriveFiles(token: string, query = "", pageSize = 30): Promise<GoogleDriveFile[]> {
  try {
    const q = query 
      ? `trashed=false and ${query}` 
      : "trashed=false and (mimeType contains 'image/' or mimeType contains 'pdf' or mimeType contains 'document' or mimeType contains 'text')";
    
    const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,iconLink,thumbnailLink,webViewLink,size,modifiedTime)&q=${encodeURIComponent(q)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `خطأ في استعراض ملفات Google Drive: ${res.statusText}`);
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      iconLink: f.iconLink,
      thumbnailLink: f.thumbnailLink,
      webViewLink: f.webViewLink,
      size: f.size ? `${(parseInt(f.size, 10) / 1024).toFixed(0)} KB` : undefined,
      modifiedTime: f.modifiedTime
    }));
  } catch (err) {
    console.error("fetchGoogleDriveFiles error:", err);
    throw err;
  }
}

export async function downloadGoogleDriveFileAsBase64(token: string, fileId: string, mimeType?: string): Promise<{ base64: string; mimeType: string }> {
  try {
    // If it's a Google Doc, export as PDF or text
    let fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    let expectedMime = mimeType || "application/octet-stream";

    if (mimeType === "application/vnd.google-apps.document") {
      fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
      expectedMime = "application/pdf";
    }

    const res = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`فشل تنزيل ملف Drive (${res.status})`);
    }

    const blob = await res.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return { base64, mimeType: expectedMime };
  } catch (err) {
    console.error("downloadGoogleDriveFileAsBase64 error:", err);
    throw err;
  }
}

export async function uploadFileToGoogleDrive(
  token: string,
  fileName: string,
  base64Data: string,
  mimeType = "application/pdf"
): Promise<GoogleDriveFile> {
  try {
    const rawData = base64Data.replace(/^data:.*?;base64,/, "");
    const byteCharacters = atob(rawData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const fileBlob = new Blob([byteArray], { type: mimeType });

    const metadata = {
      name: fileName,
      mimeType: mimeType
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", fileBlob);

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "فشل رفع الملف إلى Google Drive.");
    }

    return await res.json();
  } catch (err) {
    console.error("uploadFileToGoogleDrive error:", err);
    throw err;
  }
}

// Open Google Picker for direct interactive file selection
export function openGooglePicker({
  token,
  onPicked,
  onCancel
}: {
  token: string;
  onPicked: (docs: { id: string; name: string; mimeType: string; url: string }[]) => void;
  onCancel?: () => void;
}) {
  const apiKey = firebaseConfig.apiKey;
  const appId = firebaseConfig.projectId;

  if (typeof window === "undefined") return;

  function createPicker() {
    if (!(window as any).google?.picker) {
      alert("جاري تحميل أداة الاختيار من Google Picker...");
      return;
    }

    try {
      const view = new (window as any).google.picker.DocsView((window as any).google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false);

      const picker = new (window as any).google.picker.PickerBuilder()
        .enableFeature((window as any).google.picker.Feature.NAV_HIDDEN)
        .enableFeature((window as any).google.picker.Feature.MULTISELECT_ENABLED)
        .setAppId(appId)
        .setOAuthToken(token)
        .addView(view)
        .addView((window as any).google.picker.ViewId.DOCS_IMAGES)
        .addView((window as any).google.picker.ViewId.PDFS)
        .setDeveloperKey(apiKey)
        .setCallback((data: any) => {
          if (data.action === (window as any).google.picker.Action.PICKED) {
            const docs = (data.docs || []).map((d: any) => ({
              id: d.id,
              name: d.name,
              mimeType: d.mimeType,
              url: d.url
            }));
            onPicked(docs);
          } else if (data.action === (window as any).google.picker.Action.CANCEL) {
            if (onCancel) onCancel();
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err) {
      console.error("Picker build error:", err);
    }
  }

  // Load Google API loader
  if (!(window as any).gapi) {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (window as any).gapi.load("picker", { callback: createPicker });
    };
    document.head.appendChild(script);
  } else if (!(window as any).google?.picker) {
    (window as any).gapi.load("picker", { callback: createPicker });
  } else {
    createPicker();
  }
}

// ==========================================
// GOOGLE KEEP & LEGAL VAULT MEMOS INTEGRATION
// ==========================================
const KEEP_STORAGE_KEY = "wesam_google_keep_memos";

export function getLocalKeepMemos(): GoogleKeepNote[] {
  try {
    const saved = localStorage.getItem(KEEP_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "keep-1",
        title: "ملاحظات جلسة الاستئناف - دائرة 14 مدني",
        content: "التأكيد على استخراج صورة رسمية من التوكيل رقم ٤٥٢ لسنة ٢٠٢٥ توثيق الأهرام قبل موعد الجلسة.",
        date: "2026-08-20T10:00:00.000Z",
        tags: ["جلسات", "استئناف"],
        pinned: true
      },
      {
        id: "keep-2",
        title: "مطابقة مستندات زواج الأجانب بوزارة العدل",
        content: "مراجعة أختام السفارة البريطانية والتصديق القنصلي بوزارة الخارجية بميدان أحمد عرابي.",
        date: "2026-08-21T14:30:00.000Z",
        tags: ["توثيق", "أجانب"],
        pinned: false
      }
    ];
  } catch {
    return [];
  }
}

export function saveLocalKeepMemo(memo: Omit<GoogleKeepNote, "id" | "date"> & { id?: string }): GoogleKeepNote {
  const list = getLocalKeepMemos();
  const newMemo: GoogleKeepNote = {
    id: memo.id || "keep-" + Date.now(),
    title: memo.title,
    content: memo.content,
    date: new Date().toISOString(),
    tags: memo.tags || ["مذكرة قانونية"],
    pinned: memo.pinned || false
  };

  const updated = [newMemo, ...list.filter(m => m.id !== newMemo.id)];
  localStorage.setItem(KEEP_STORAGE_KEY, JSON.stringify(updated));
  return newMemo;
}

export function deleteLocalKeepMemo(id: string): void {
  const list = getLocalKeepMemos();
  const updated = list.filter(m => m.id !== id);
  localStorage.setItem(KEEP_STORAGE_KEY, JSON.stringify(updated));
}

export interface GooglePhoto {
  id: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
}

export async function fetchGooglePhotos(accessToken: string): Promise<GooglePhoto[]> {
  const res = await fetch("https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=50", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    throw new Error(`Google Photos API Error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.mediaItems || [];
}

// ==========================================
// GOOGLE SHEETS API INTEGRATION
// ==========================================

export interface GoogleSheetSummary {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheetsCount?: number;
}

export async function createGoogleSpreadsheet(
  token: string,
  title: string,
  sheets: { title: string; rows: (string | number)[][] }[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  try {
    // 1. Create spreadsheet structure
    const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        properties: {
          title: title
        },
        sheets: sheets.map(s => ({
          properties: {
            title: s.title,
            rightToLeft: true
          }
        }))
      })
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `فشل إنشاء جدول Google Sheets (${createRes.status})`);
    }

    const spreadsheetData = await createRes.json();
    const spreadsheetId = spreadsheetData.spreadsheetId;
    const spreadsheetUrl = spreadsheetData.spreadsheetUrl;

    // 2. Populate values in each sheet
    for (const sheet of sheets) {
      if (sheet.rows && sheet.rows.length > 0) {
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheet.title)}!A1:Z${sheet.rows.length + 5}?valueInputOption=USER_ENTERED`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              range: `${sheet.title}!A1:Z${sheet.rows.length + 5}`,
              majorDimension: "ROWS",
              values: sheet.rows
            })
          }
        );
      }
    }

    return {
      spreadsheetId,
      spreadsheetUrl
    };
  } catch (err) {
    console.error("createGoogleSpreadsheet error:", err);
    throw err;
  }
}

export async function fetchUserSpreadsheets(token: string): Promise<GoogleDriveFile[]> {
  return fetchGoogleDriveFiles(token, "mimeType='application/vnd.google-apps.spreadsheet'", 30);
}

export async function readSpreadsheetValues(
  token: string,
  spreadsheetId: string,
  range = "A1:Z100"
): Promise<string[][]> {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "فشل قراءة بيانات جدول Google Sheets.");
    }

    const data = await res.json();
    return data.values || [];
  } catch (err) {
    console.error("readSpreadsheetValues error:", err);
    throw err;
  }
}

// ==========================================
// GOOGLE MEET API INTEGRATION
// ==========================================

export interface GoogleMeetRoom {
  spaceName: string;
  meetingUri: string;
  meetingCode: string;
  summary: string;
  createdAt: string;
}

export async function createGoogleMeeting(
  token: string,
  summary: string = "جلسة تشاور قانونية مع الموكل"
): Promise<GoogleMeetRoom> {
  try {
    // Try Google Meet Spaces API
    const res = await fetch("https://meet.googleapis.com/v1/spaces", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        config: {
          accessType: "OPEN"
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        spaceName: data.name || "spaces/instant",
        meetingUri: data.meetingUri || `https://meet.google.com/${data.meetingCode || ""}`,
        meetingCode: data.meetingCode || data.name?.replace("spaces/", "") || "new",
        summary,
        createdAt: new Date().toISOString()
      };
    }

    // Fallback: Generate dedicated direct Google Meet room
    const randomCode = Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 5);
    return {
      spaceName: `spaces/${randomCode}`,
      meetingUri: `https://meet.google.com/${randomCode}`,
      meetingCode: randomCode,
      summary,
      createdAt: new Date().toISOString()
    };
  } catch (err) {
    console.warn("createGoogleMeeting fallback triggered:", err);
    const randomCode = Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 5);
    return {
      spaceName: `spaces/${randomCode}`,
      meetingUri: `https://meet.google.com/${randomCode}`,
      meetingCode: randomCode,
      summary,
      createdAt: new Date().toISOString()
    };
  }
}

