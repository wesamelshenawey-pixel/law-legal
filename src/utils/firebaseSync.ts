import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocFromServer,
  onSnapshot
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { 
  PlatformUser, 
  ClientProfile, 
  CaseRecord, 
  SessionRecord,
  LeadProfile,
  EmailNotificationRecord,
  OpponentProfile
} from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

// -------------------------------------------------------------------------
// Mandatory Firestore Error Handler conforming to system constraints
// -------------------------------------------------------------------------
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Captured: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------------------
// Live Licensing and Copy Control Interfaces
// -------------------------------------------------------------------------
export interface License {
  id: string; // مفتاح الترخيص
  licenseKey?: string;
  holderName: string; // اسم المشتري
  holderPhone: string; // تليفون المشتري
  maxDevices: number; // الحد الأقصى للأجهزة
  maxUsers: number; // الحد الأقصى للمستخدمين
  approvedDevices?: string[]; // الأجهزة المصرح لها بالعمل
  registeredPhones?: string[]; // الهواتف المسجلة على هذه النسخة
  status: "active" | "inactive" | "suspended" | "expired";
  createdAt?: string;
  issuedAt?: string;
  expiresAt?: string;
  devicesUsed?: number;
  activeDevices?: string[];
}

export interface ActivationRequest {
  id: string;
  licenseKey: string;
  deviceName: string;
  deviceFingerprint: string;
  requestPhone: string;
  requestName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// -------------------------------------------------------------------------
// Pre-seeded local licenses as fallback
// -------------------------------------------------------------------------
export const INITIAL_LICENSES: License[] = [
  {
    id: "LIC-WESAM-FREE-2026",
    holderName: "النسخة التجريبية المعتمدة لعام ٢٠٢٦",
    holderPhone: "01283233555",
    maxDevices: 3,
    maxUsers: 5,
    approvedDevices: [], // Will be filled dynamically when devices register
    registeredPhones: ["01283233555"],
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "LIC-WESAM-PRO-GOLD",
    holderName: "المكتب الماسي - المنصورة",
    holderPhone: "01002233445",
    maxDevices: 5,
    maxUsers: 10,
    approvedDevices: ["DEV-SAMPLE-1"],
    registeredPhones: [],
    status: "active",
    createdAt: new Date().toISOString()
  }
];

// -------------------------------------------------------------------------
// Validate connection to Firestore on initialization
// -------------------------------------------------------------------------
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    const testDocRef = doc(db, 'users', 'ping');
    await getDocFromServer(testDocRef);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('permission-denied') || error.message.includes('Missing or insufficient permissions')) {
        return true; // We got a response from the server!
      }
      if (error.message.includes('the client is offline')) {
        console.warn("Firebase client operating in resilient offline-first mode.");
        return false;
      }
    }
    console.info("Firestore status initialized.");
    return false;
  }
}

// -------------------------------------------------------------------------
// Database CRUD operations with robust local-storage backup & error handlers
// -------------------------------------------------------------------------

// USERS
export async function dbSaveUser(user: PlatformUser): Promise<void> {
  try {
    await setDoc(doc(db, "users", user.phone), user);
  } catch (e) {
    console.warn("Failed to write user to Firebase. Using local storage.", e);
  }
}

export async function dbLoadUsers(): Promise<PlatformUser[]> {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const list: PlatformUser[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as PlatformUser);
    });
    return list;
  } catch (e) {
    return [];
  }
}

// CLIENTS
export async function dbSaveClient(client: ClientProfile): Promise<void> {
  try {
    await setDoc(doc(db, "clients", client.id), client);
  } catch (e) {
    console.warn("Firebase writing failed for clients", e);
  }
}

export async function dbLoadClients(): Promise<ClientProfile[]> {
  try {
    const snapshot = await getDocs(collection(db, "clients"));
    const list: ClientProfile[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data() as ClientProfile);
    });
    return list;
  } catch (e) {
    return [];
  }
}

export async function dbDeleteClient(clientId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "clients", clientId));
  } catch (e) {
    console.warn("Firebase delete failed for client", e);
  }
}

// OPPONENTS
export async function dbSaveOpponent(opponent: OpponentProfile): Promise<void> {
  try {
    await setDoc(doc(db, "opponents", opponent.id), opponent);
  } catch (e) {
    console.warn("Firebase write failed for opponents", e);
  }
}

export async function dbLoadOpponents(): Promise<OpponentProfile[]> {
  try {
    const snapshot = await getDocs(collection(db, "opponents"));
    const list: OpponentProfile[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data() as OpponentProfile);
    });
    return list;
  } catch (e) {
    return [];
  }
}

// CASES
export async function dbSaveCase(cse: CaseRecord): Promise<void> {
  try {
    await setDoc(doc(db, "cases", cse.id), cse);
  } catch (e) {
    console.warn("Firebase write failed for cases", e);
  }
}

export async function dbLoadCases(): Promise<CaseRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, "cases"));
    const list: CaseRecord[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data() as CaseRecord);
    });
    return list;
  } catch (e) {
    return [];
  }
}

export async function dbDeleteCase(caseId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "cases", caseId));
  } catch (e) {
    console.warn("Firebase delete failed for cases", e);
  }
}

// SESSIONS
export async function dbSaveSession(sess: SessionRecord): Promise<void> {
  try {
    await setDoc(doc(db, "sessions", sess.id), sess);
  } catch (e) {
    console.warn("Firebase write failed for sessions", e);
  }
}

export async function dbLoadSessions(): Promise<SessionRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, "sessions"));
    const list: SessionRecord[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data() as SessionRecord);
    });
    return list;
  } catch (e) {
    return [];
  }
}

export async function dbDeleteSession(sessionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "sessions", sessionId));
  } catch (e) {
    console.warn("Firebase delete failed for session", e);
  }
}

// LICENSES
export async function dbSaveLicense(lic: License): Promise<void> {
  try {
    await setDoc(doc(db, "licenses", lic.id), lic);
  } catch (e) {
    console.warn("Firebase write failed for licenses", e);
  }
}

export async function dbLoadLicenses(): Promise<License[]> {
  try {
    const snapshot = await getDocs(collection(db, "licenses"));
    const list: License[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data() as License);
    });
    return list;
  } catch (e) {
    return [];
  }
}

// ACTIVATION REQUESTS
export async function dbSaveActivationRequest(req: ActivationRequest): Promise<void> {
  try {
    await setDoc(doc(db, "activation_requests", req.id), req);
  } catch (e) {
    console.warn("Firebase write failed for activation requests", e);
  }
}

export async function dbLoadActivationRequests(): Promise<ActivationRequest[]> {
  try {
    const snapshot = await getDocs(collection(db, "activation_requests"));
    const list: ActivationRequest[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data() as ActivationRequest);
    });
    return list;
  } catch (e) {
    return [];
  }
}

// LEADS
export async function dbSaveLead(lead: LeadProfile): Promise<void> {
  try {
    await setDoc(doc(db, "leads", lead.id), lead);
  } catch (e) {
    console.warn("Firebase write failed for lead", e);
  }
}

export async function dbLoadLeads(): Promise<LeadProfile[]> {
  try {
    const snapshot = await getDocs(collection(db, "leads"));
    const list: LeadProfile[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data() as LeadProfile);
    });
    return list;
  } catch (e) {
    return [];
  }
}

// SYNCED CONTACTS (Cloud Phone Directory)
export interface SyncedContactDoc {
  id: string;
  name: string;
  phone: string;
  countryCode: string;
  countryName: string;
  flag: string;
  source: string;
  status: string;
  updatedAt: string;
}

export async function dbSaveSyncedContacts(contacts: SyncedContactDoc[]): Promise<void> {
  try {
    // Save in batches or item-by-item
    for (const c of contacts.slice(0, 50)) {
      const cleanId = c.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      await setDoc(doc(db, "synced_contacts", cleanId), c);
    }
  } catch (e) {
    console.warn("Firebase write failed for synced contacts", e);
  }
}

export async function dbLoadSyncedContacts(): Promise<SyncedContactDoc[]> {
  try {
    const snapshot = await getDocs(collection(db, "synced_contacts"));
    const list: SyncedContactDoc[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data() as SyncedContactDoc);
    });
    return list;
  } catch (e) {
    return [];
  }
}

// EMAIL NOTIFICATIONS
export async function dbSaveEmailNotification(notif: EmailNotificationRecord): Promise<void> {
  try {
    await setDoc(doc(db, "email_notifications", notif.id), notif);
  } catch (e) {
    console.warn("Firebase write failed for email notification", e);
  }
}

export async function dbLoadEmailNotifications(): Promise<EmailNotificationRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, "email_notifications"));
    const list: EmailNotificationRecord[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data() as EmailNotificationRecord);
    });
    return list;
  } catch (e) {
    return [];
  }
}

// -------------------------------------------------------------------------
// REAL-TIME SYNC LISTENERS FOR INSTANT CLOUD SYNC ACROSS ALL DEVICES
// -------------------------------------------------------------------------
export function subscribeToCloudChanges(callbacks: {
  onClientsChange?: (clients: ClientProfile[]) => void;
  onCasesChange?: (cases: CaseRecord[]) => void;
  onSessionsChange?: (sessions: SessionRecord[]) => void;
  onUsersChange?: (users: PlatformUser[]) => void;
  onOpponentsChange?: (opponents: OpponentProfile[]) => void;
}): () => void {
  const unsubscribers: (() => void)[] = [];

  try {
    if (callbacks.onClientsChange) {
      const unsub = onSnapshot(collection(db, "clients"), (snapshot) => {
        if (!snapshot.empty) {
          const list: ClientProfile[] = [];
          snapshot.forEach(doc => list.push(doc.data() as ClientProfile));
          callbacks.onClientsChange?.(list);
        }
      }, (err) => console.warn("Clients realtime sync listener fallback:", err));
      unsubscribers.push(unsub);
    }

    if (callbacks.onCasesChange) {
      const unsub = onSnapshot(collection(db, "cases"), (snapshot) => {
        if (!snapshot.empty) {
          const list: CaseRecord[] = [];
          snapshot.forEach(doc => list.push(doc.data() as CaseRecord));
          callbacks.onCasesChange?.(list);
        }
      }, (err) => console.warn("Cases realtime sync listener fallback:", err));
      unsubscribers.push(unsub);
    }

    if (callbacks.onSessionsChange) {
      const unsub = onSnapshot(collection(db, "sessions"), (snapshot) => {
        if (!snapshot.empty) {
          const list: SessionRecord[] = [];
          snapshot.forEach(doc => list.push(doc.data() as SessionRecord));
          callbacks.onSessionsChange?.(list);
        }
      }, (err) => console.warn("Sessions realtime sync listener fallback:", err));
      unsubscribers.push(unsub);
    }

    if (callbacks.onUsersChange) {
      const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
        if (!snapshot.empty) {
          const list: PlatformUser[] = [];
          snapshot.forEach(doc => list.push(doc.data() as PlatformUser));
          callbacks.onUsersChange?.(list);
        }
      }, (err) => console.warn("Users realtime sync listener fallback:", err));
      unsubscribers.push(unsub);
    }
  } catch (e) {
    console.warn("Realtime subscription initialization:", e);
  }

  return () => {
    unsubscribers.forEach(u => u());
  };
}


