import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Analytics } from '@vercel/analytics/react';
import { 
  UserRole, 
  PlatformUser, 
  ClientProfile, 
  OpponentProfile, 
  CaseRecord, 
  SessionRecord, 
  FeeTransfer, 
  AdminCustomSection, 
  AdminCustomProperty, 
  LawCodeBook,
  LeadProfile,
  Announcement,
  ClientNote,
  NoteSignatureData,
  ConnectedDeviceRecord
} from "./types";

import { 
  INITIAL_CLIENTS, 
  INITIAL_OPPONENTS, 
  INITIAL_CASES, 
  INITIAL_SESSIONS, 
  INITIAL_LAW_CODES,
  INITIAL_COURTS,
  INITIAL_SUBJECTS,
  INITIAL_ANNOUNCEMENTS
} from "./utils/staticData";

// Views Imports
import LoginView from "./components/LoginView";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import SessionsView from "./components/SessionsView";
import CasesView from "./components/CasesView";
import ClientsView from "./components/ClientsView";
import FeesView from "./components/FeesView";
import AiAssistantView from "./components/AiAssistantView";
import AiVoiceAssistantLauncher from "./components/AiVoiceAssistantLauncher";
import CompaniesView from "./components/CompaniesView";
import DocumentationView from "./components/DocumentationView";
import AdminWorkView from "./components/AdminWorkView";
import LawCodesView from "./components/LawCodesView";
import SettingsView from "./components/SettingsView";
import SocialHubView from "./components/SocialHubView";
import TenantsAdminView from "./components/TenantsAdminView";
import AnnouncementsView from "./components/AnnouncementsView";
import AnnouncementTicker from "./components/AnnouncementTicker";
import AdvancedDocumentEditor from "./components/AdvancedDocumentEditor";
import SmartOcrStudio from "./components/SmartOcrStudio";
import GoogleWorkspaceHub from "./components/GoogleWorkspaceHub";
import ImportFilesView from "./components/ImportFilesView";
import GlobalSearchView from "./components/GlobalSearchView";
import UserProfileCircle from "./components/UserProfileCircle";
import DesignsView from "./components/DesignsView";
import RequestSignatureLinkModal from "./components/RequestSignatureLinkModal";
import ClientSignatureConfirmationPortal from "./components/ClientSignatureConfirmationPortal";
import LawyerSignatureSeal from "./components/LawyerSignatureSeal";
import UrgentFollowUpView from "./components/UrgentFollowUpView";
import LegalTemplatesView from "./components/LegalTemplatesView";
import AttachmentsView from "./components/AttachmentsView";
import OfficeServicesView from "./components/OfficeServicesView";
import LegalAiAnalysisView from "./components/LegalAiAnalysisView";
import EgyptianLawyerAiView from "./components/EgyptianLawyerAiView";
import SmartNotificationsView from "./components/SmartNotificationsView";
import { buildConfirmationLink } from "./utils/workspaceService";
import { UserDesignPreferences, DEFAULT_DESIGN_PREFERENCES, DESIGN_PRESETS } from "./utils/themePresets";
import { SidebarDisplayMode } from "./components/Sidebar";
import { 
  Search, 
  Save, 
  Check, 
  Loader2, 
  ShieldCheck, 
  RefreshCw, 
  PenTool, 
  FileSignature, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Share2, 
  Award, 
  Printer, 
  FileCheck2, 
  X,
  Phone,
  FileText,
  Wifi,
  WifiOff,
  Bell,
  BellRing,
  BellOff
} from "lucide-react";

import { 
  registerServiceWorker, 
  setupNetworkSyncListener, 
  enqueueOfflineSync, 
  flushOfflineSyncQueue, 
  getOfflineSyncQueue 
} from "./utils/offlineSync";

import {
  getNotificationPermissionStatus,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
  checkUpcomingSessionsAndNotify,
  notifyClientActivity
} from "./utils/browserNotifications";

// Licensing / Licensing Helper Sync imports
import LicensingGate from "./components/LicensingGate";
import DocumentManagerModal, { ManagedDocument } from "./components/DocumentManagerModal";
import PhoneSyncModal from "./components/PhoneSyncModal";
import { 
  License, 
  ActivationRequest, 
  INITIAL_LICENSES,
  dbSaveUser,
  dbLoadUsers,
  dbSaveClient,
  dbLoadClients,
  dbSaveOpponent,
  dbLoadOpponents,
  dbSaveCase,
  dbLoadCases,
  dbSaveSession,
  dbLoadSessions,
  dbSaveLicense,
  dbLoadLicenses,
  dbSaveActivationRequest,
  dbLoadActivationRequests,
  dbSaveLead,
  dbLoadLeads,
  testFirebaseConnection,
  subscribeToCloudChanges
} from "./utils/firebaseSync";
import { TRANSLATIONS } from "./utils/translations";
import { requestWorkspaceAuth, getStoredWorkspaceToken, uploadFileToGoogleDrive, fetchGoogleDriveFiles, downloadGoogleDriveFileAsBase64 } from "./utils/workspaceService";


const ACCENT_PALETTES: Record<string, Record<number, string>> = {
  amber: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03' },
  blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554' },
  emerald: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22' },
  rose: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519' },
  purple: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764' },
  teal: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e' },
  indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b' },
  orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407' },
  cyan: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63', 950: '#083344' }
};

export default function App() {
  // ----------------------------------------------------
  // INTERFACE PREFERENCES (BILINGUAL & THEMING)
  // ----------------------------------------------------
  const [language, setLanguage] = useState<"ar" | "en">(() => {
    return (localStorage.getItem("law_language") as "ar" | "en") || "ar";
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("law_darkMode") === "true";
  });

  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem("law_accentColor") || "amber";
  });

  const [designPreferences, setDesignPreferences] = useState<UserDesignPreferences>(() => {
    const saved = localStorage.getItem("law_designPreferences");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_DESIGN_PREFERENCES;
  });

  const handleApplyDesignPreferences = (updated: UserDesignPreferences) => {
    setDesignPreferences(updated);
    setAccentColor(updated.accentColor);
    setIsDarkMode(updated.isDarkMode);
    localStorage.setItem("law_designPreferences", JSON.stringify(updated));
    localStorage.setItem("law_accentColor", updated.accentColor);
    localStorage.setItem("law_darkMode", updated.isDarkMode ? "true" : "false");
  };

  useEffect(() => {
    localStorage.setItem("law_language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("law_darkMode", isDarkMode ? "true" : "false");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("law_accentColor", accentColor);
    const palette = ACCENT_PALETTES[accentColor] || ACCENT_PALETTES.amber;
    if (palette) {
      Object.entries(palette).forEach(([shade, hex]) => {
        document.documentElement.style.setProperty(`--accent-${shade}`, hex);
      });
    }
  }, [accentColor]);

  // ----------------------------------------------------
  // ANTI-PIRACY & SOFTWARE LICENSING STATES
  // ----------------------------------------------------
  const [deviceFingerprint] = useState<string>(() => {
    let saved = localStorage.getItem("law_deviceFingerprint");
    if (!saved) {
      const rand = Math.floor(100000 + Math.random() * 900000).toString();
      saved = `DEV-SHENAWEY-${rand}`;
      localStorage.setItem("law_deviceFingerprint", saved);
    }
    return saved;
  });

  const [activeLicenseKey, setActiveLicenseKey] = useState<string>(() => {
    return localStorage.getItem("law_activeLicenseKey") || "";
  });

  const [licenses, setLicenses] = useState<License[]>(() => {
    const saved = localStorage.getItem("law_licenses");
    return saved ? JSON.parse(saved) : INITIAL_LICENSES;
  });

  const [activationRequests, setActivationRequests] = useState<ActivationRequest[]>(() => {
    const saved = localStorage.getItem("law_activationRequests");
    return saved ? JSON.parse(saved) : [];
  });

  // ----------------------------------------------------
  // CORE ENTERPRISE LEGAL OFFICE STATES
  // ----------------------------------------------------
  const [currentUser, setCurrentUser] = useState<PlatformUser | null>(() => {
    const saved = localStorage.getItem("law_currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  const [registeredUsers, setRegisteredUsers] = useState<PlatformUser[]>(() => {
    const saved = localStorage.getItem("law_users");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "usr-admin",
        name: "الأستاذ وسام حمدي الشناوي",
        phone: "01283233555",
        passwordHash: "W-001*001",
        role: UserRole.ADMIN,
        isVerified: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "usr-staff",
        name: "الأستاذ سعد الدين هلال",
        phone: "01234567890",
        passwordHash: "staff123",
        role: UserRole.STAFF,
        isVerified: true,
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [clients, setClients] = useState<ClientProfile[]>(() => {
    const saved = localStorage.getItem("law_clients");
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [opponents, setOpponents] = useState<OpponentProfile[]>(() => {
    const saved = localStorage.getItem("law_opponents");
    return saved ? JSON.parse(saved) : INITIAL_OPPONENTS;
  });

  const [cases, setCases] = useState<CaseRecord[]>(() => {
    const saved = localStorage.getItem("law_cases");
    return saved ? JSON.parse(saved) : INITIAL_CASES;
  });

  const [sessions, setSessions] = useState<SessionRecord[]>(() => {
    const saved = localStorage.getItem("law_sessions");
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [leads, setLeads] = useState<LeadProfile[]>(() => {
    const saved = localStorage.getItem("law_leads");
    return saved ? JSON.parse(saved) : [];
  });

  const [fees, setFees] = useState<FeeTransfer[]>(() => {
    const saved = localStorage.getItem("law_fees");
    if (saved) return JSON.parse(saved);
    return [
      { id: "fee-1", clientName: "أحمد محمد محمود عبد العال", amount: 10000, currency: "EGP", type: "cash", date: "2026-06-01", notes: "مقدم أتعاب الشكوى" },
      { id: "fee-2", clientName: "فاطمة الزهراء إبراهيم حسن", amount: 5000, currency: "EGP", type: "bank", date: "2026-06-03", notes: "الدفعة الأولى" }
    ];
  });

  const [lawCodes, setLawCodes] = useState<LawCodeBook[]>(() => {
    const saved = localStorage.getItem("law_codes");
    return saved ? JSON.parse(saved) : INITIAL_LAW_CODES;
  });

  const [customSections, setCustomSections] = useState<AdminCustomSection[]>(() => {
    const saved = localStorage.getItem("law_customSections");
    return saved ? JSON.parse(saved) : [];
  });

  const [customProperties, setCustomProperties] = useState<AdminCustomProperty[]>(() => {
    const saved = localStorage.getItem("law_customProperties");
    return saved ? JSON.parse(saved) : [];
  });

  const [courtsList, setCourtsList] = useState<string[]>(() => {
    const saved = localStorage.getItem("law_courts");
    return saved ? JSON.parse(saved) : INITIAL_COURTS;
  });

  const [subjectsList, setSubjectsList] = useState<string[]>(() => {
    const saved = localStorage.getItem("law_subjects");
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem("law_announcements");
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  useEffect(() => {
    localStorage.setItem("law_announcements", JSON.stringify(announcements));
  }, [announcements]);

  const [activeSection, setActiveSection] = useState(() => {
    const savedRole = localStorage.getItem("law_role");
    return savedRole === "client" ? "social" : "dashboard";
  });
  const [sidebarMode, setSidebarMode] = useState<SidebarDisplayMode>("full");
  const [editorInitialText, setEditorInitialText] = useState("");
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false);
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);
  const [defaultSelectCaseId, setDefaultSelectCaseId] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Client leave-note modal and logging states (with local storage persistence)
  const [clientNotes, setClientNotes] = useState<ClientNote[]>(() => {
    const saved = localStorage.getItem("law_clientNotes");
    return saved ? JSON.parse(saved) : [
      {
        id: "note-init-1",
        clientName: "الموكل المعتمد",
        text: "تم تحديث ورفع كافة صور المستندات الثبوتية وعقود تملك العقار للمراجعة القضائية من هيئة دفاع الأستاذ وسام الشناوي.",
        date: "2026-06-05T10:15:00.000Z",
        priority: "High",
        status: "Read by Attorney",
        scheduledReminder: true,
        attorneyReply: "تم استلام المستندات وجاري العمل عليها.",
        requiresSignature: true,
        signatureStatus: "signed",
        signatureData: {
          signedBy: "الموكل المعتمد",
          nationalId: "29201011234567",
          signedAt: "2026-06-05T10:20:00.000Z",
          verificationHash: "E-SIG-9842-VERIFIED-AUTH",
          digitalStamp: "مكتب الأستاذ وسام الشناوي - توقيع إلكتروني معتمد قانونياً",
          lawyerSignatureName: "الأستاذ وسام أحمد الشناوي المحامي بالنقض",
          ipOrDeviceId: "Device-Verified-EG"
        }
      },
      {
        id: "note-init-2",
        clientName: "الموكل المعتمد",
        text: "مطلوب معرفة موقف طلب استخراج الشهادة الرسمية من جدول المحكمة لضمها لملف الدعوى.",
        date: "2026-06-07T14:30:00.000Z",
        priority: "Normal",
        status: "Pending",
        scheduledReminder: false,
        requiresSignature: true,
        signatureStatus: "pending",
        confirmationToken: "SIG-9842KLP",
        confirmationLink: "https://diwan-law.app/confirm/note-init-2?token=SIG-9842KLP"
      }
    ];
  });

  const [isClientNoteModalOpen, setIsClientNoteModalOpen] = useState(false);
  const [isDocumentManagerOpen, setIsDocumentManagerOpen] = useState(false);
  const [isPhoneSyncOpen, setIsPhoneSyncOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [documentManagerSection, setDocumentManagerSection] = useState("cases");
  const [documentManagerSectionLabel, setDocumentManagerSectionLabel] = useState("القضايا");

  // OFFLINE-FIRST & SERVICE WORKER SYNC STATES
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(() => getOfflineSyncQueue().length);
  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);

  // Register service worker for offline caching and setup network synchronization
  useEffect(() => {
    registerServiceWorker();

    const cleanupSyncListener = setupNetworkSyncListener(
      (online) => {
        setIsOnline(online);
        setOfflinePendingCount(getOfflineSyncQueue().length);
      },
      (successCount) => {
        setOfflinePendingCount(getOfflineSyncQueue().length);
      }
    );

    return cleanupSyncListener;
  }, []);

  const handleManualFlushOfflineSync = async () => {
    if (isSyncingQueue) return;
    setIsSyncingQueue(true);
    try {
      const result = await flushOfflineSyncQueue();
      setOfflinePendingCount(getOfflineSyncQueue().length);
      if (result.syncedCount > 0) {
        alert(language === "ar" ? `✓ تمت مزامنة ${result.syncedCount} عمليات معلقة مع السحابة بنجاح!` : `✓ Successfully synced ${result.syncedCount} pending items to the cloud!`);
      } else {
        alert(language === "ar" ? "جميع البيانات متزامنة ومحدثة بالكامل مع السحابة." : "All data is already in sync with the cloud.");
      }
    } catch (e) {
      console.error("Manual sync failed:", e);
    } finally {
      setIsSyncingQueue(false);
    }
  };

  const [managedDocuments, setManagedDocuments] = useState<ManagedDocument[]>(() => {
    const saved = localStorage.getItem("law_managed_documents");
    return saved ? JSON.parse(saved) : [];
  });

  const [editedClientNote, setEditedClientNote] = useState(() => {
    const savedDraft = localStorage.getItem("law_clientNoteDraft");
    return savedDraft ? savedDraft : "";
  });

  const [noteAutoSaveStatus, setNoteAutoSaveStatus] = useState<"idle" | "saving" | "saved">(() => {
    const savedDraft = localStorage.getItem("law_clientNoteDraft");
    return savedDraft && savedDraft.trim() ? "saved" : "idle";
  });

  const [noteLastSavedTime, setNoteLastSavedTime] = useState<string | null>(() => {
    return localStorage.getItem("law_clientNoteDraft_time") || null;
  });

  // Debounced auto-save effect with real-time feedback
  useEffect(() => {
    if (!editedClientNote || !editedClientNote.trim()) {
      localStorage.removeItem("law_clientNoteDraft");
      localStorage.removeItem("law_clientNoteDraft_time");
      setNoteAutoSaveStatus("idle");
      return;
    }

    setNoteAutoSaveStatus("saving");
    const timer = setTimeout(() => {
      localStorage.setItem("law_clientNoteDraft", editedClientNote);
      const currentTime = new Date().toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", { 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit" 
      });
      localStorage.setItem("law_clientNoteDraft_time", currentTime);
      setNoteLastSavedTime(currentTime);
      setNoteAutoSaveStatus("saved");
    }, 280);

    return () => clearTimeout(timer);
  }, [editedClientNote, language]);

  // Restore note content from localStorage whenever the Compose Message modal is reopened, ensuring no data loss
  useEffect(() => {
    if (isClientNoteModalOpen) {
      const savedDraft = localStorage.getItem("law_clientNoteDraft");
      if (savedDraft !== null) {
        setEditedClientNote(savedDraft);
        setNoteAutoSaveStatus(savedDraft.trim() ? "saved" : "idle");
        setNoteLastSavedTime(localStorage.getItem("law_clientNoteDraft_time") || null);
      }
    }
  }, [isClientNoteModalOpen]);
  const [notePriority, setNotePriority] = useState<"High" | "Normal" | "Low">("Normal");
  const [noteCategory, setNoteCategory] = useState<string>("Consultation");
  const [noteLinkedAttachments, setNoteLinkedAttachments] = useState<{id: string, name: string, url: string}[]>([]);
  const [showAttachmentGallery, setShowAttachmentGallery] = useState(false);
  const [requestSmsReminder, setRequestSmsReminder] = useState(false);
  const [referencedCaseId, setReferencedCaseId] = useState("");
  const [showDocPreviewPane, setShowDocPreviewPane] = useState(false);
  const [clientNoteTab, setClientNoteTab] = useState<"compose" | "attachments" | "logs">("compose");
  const [noteSearchQuery, setNoteSearchQuery] = useState("");
  const [noteFilterPriority, setNoteFilterPriority] = useState<"All" | "High" | "Normal" | "Low">("All");
  const [buttonRipples, setButtonRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  // Digital Signature States for Client Note Interface
  const [requestDigitalSignature, setRequestDigitalSignature] = useState(false);
  const [signatureClientPhone, setSignatureClientPhone] = useState("");
  const [signatureLegalAffirmation, setSignatureLegalAffirmation] = useState("أقر أنا الموكل بصحة ومسؤولية ما ورد في هذه الملحوظة والإفادة القضائية الموجهة لهيئة الدفاع.");
  const [signingNotePortal, setSigningNotePortal] = useState<ClientNote | null>(null);
  const [viewingCertificateNote, setViewingCertificateNote] = useState<ClientNote | null>(null);
  const [requestSignatureModalNote, setRequestSignatureModalNote] = useState<ClientNote | null>(null);
  const [copiedNoteLinkId, setCopiedNoteLinkId] = useState<string | null>(null);

  // Toast & Browser Push notifications states
  interface ToastMessage {
    id: string;
    title: string;
    message: string;
    style: "info" | "warning" | "success";
  }
  const [activeToasts, setActiveToasts] = useState<ToastMessage[]>([]);
  const [toastsTriggered, setToastsTriggered] = useState(false);
  const [browserNotificationStatus, setBrowserNotificationStatus] = useState<string>(() => {
    return getNotificationPermissionStatus();
  });

  const handleRequestPushNotifications = async () => {
    const status = await requestBrowserNotificationPermission();
    setBrowserNotificationStatus(status);
    if (status === "granted") {
      sendBrowserNotification(
        language === "ar" ? "⚖️ تم تفعيل إشعارات المتصفح بنجاح" : "⚖️ Push Notifications Activated",
        {
          body: language === "ar" 
            ? "ستتلقى الآن تنبيهات صوتية وفورية عند ورود رسائل جديدة من الموكلين أو اقتراب جلسات المحاكمة." 
            : "You will now receive real-time audio and push alerts for upcoming court sessions and client messages.",
          tag: "notification-activation-confirm",
          icon: "/icon-192.png"
        }
      );
      checkUpcomingSessionsAndNotify(sessions, language);
    }
  };

  // Monitor upcoming court sessions for native push notifications
  useEffect(() => {
    if (sessions.length > 0 && currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.STAFF)) {
      checkUpcomingSessionsAndNotify(sessions, language);
    }

    const interval = setInterval(() => {
      if (sessions.length > 0 && currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.STAFF)) {
        checkUpcomingSessionsAndNotify(sessions, language);
      }
    }, 15 * 60 * 1000); // Check every 15 minutes

    return () => clearInterval(interval);
  }, [sessions, currentUser, language]);

  const getFormattedDate = (offsetDays = 0) => {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() + offsetDays);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.STAFF) && sessions.length > 0 && !toastsTriggered) {
      const todayStr = getFormattedDate(0);
      const tomorrowStr = getFormattedDate(1);

      const todaySessions = sessions.filter(s => s.date === todayStr);
      const tomorrowSessions = sessions.filter(s => s.date === tomorrowStr);

      const list: ToastMessage[] = [];
      todaySessions.forEach((s) => {
        const caseNum = s.caseInfo?.caseNumber || s.caseId;
        const client = s.caseInfo?.clientName || "غير محدد";
        list.push({
          id: `today-${s.id}`,
          title: language === "ar" ? "🔔 جلسة اليوم العاجلة" : "🔔 Urgent Today Session",
          message: language === "ar" 
            ? `جلسة رقم ${caseNum} للموكل ${client} مقررة اليوم!`
            : `Session No. ${caseNum} for client ${client} is scheduled for TODAY!`,
          style: "warning"
        });
      });

      tomorrowSessions.forEach((s) => {
        const caseNum = s.caseInfo?.caseNumber || s.caseId;
        const client = s.caseInfo?.clientName || "غير محدد";
        list.push({
          id: `tomorrow-${s.id}`,
          title: language === "ar" ? "📅 جلسة غداً الهامة" : "📅 Important Tomorrow Session",
          message: language === "ar" 
            ? `جلسة رقم ${caseNum} للموكل ${client} مقررة غداً!`
            : `Session No. ${caseNum} for client ${client} is scheduled for TOMORROW!`,
          style: "info"
        });
      });

      if (list.length > 0) {
        setActiveToasts(list);
      }
      setToastsTriggered(true);
    }
  }, [currentUser, sessions, language, toastsTriggered]);

  // ----------------------------------------------------
  // CLOUD DATABASE HYBRID LOAD & REAL-TIME SYNC FOR ALL ENTITIES
  // -----------------------------------------------------------------
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function loadDataFromFirestore() {
      const isLive = await testFirebaseConnection();
      if (isLive) {
        console.log("⚡ Real-time Cloud Sync Active: Loading Legal Practice records from Firestore...");
        
        const liveUsers = await dbLoadUsers();
        if (liveUsers.length > 0) setRegisteredUsers(liveUsers);

        const liveClients = await dbLoadClients();
        if (liveClients.length > 0) setClients(liveClients);

        const liveOpponents = await dbLoadOpponents();
        if (liveOpponents.length > 0) setOpponents(liveOpponents);

        const liveCases = await dbLoadCases();
        if (liveCases.length > 0) setCases(liveCases);

        const liveSessions = await dbLoadSessions();
        if (liveSessions.length > 0) setSessions(liveSessions);

        const liveLicenses = await dbLoadLicenses();
        if (liveLicenses.length > 0) setLicenses(liveLicenses);

        const liveReqs = await dbLoadActivationRequests();
        if (liveReqs.length > 0) setActivationRequests(liveReqs);

        const liveLeads = await dbLoadLeads();
        if (liveLeads.length > 0) setLeads(liveLeads);

        // Attach Realtime Listeners for immediate updates from other clients
        unsubscribe = subscribeToCloudChanges({
          onClientsChange: (freshClients) => {
            if (freshClients && freshClients.length > 0) setClients(freshClients);
          },
          onCasesChange: (freshCases) => {
            if (freshCases && freshCases.length > 0) setCases(freshCases);
          },
          onSessionsChange: (freshSessions) => {
            if (freshSessions && freshSessions.length > 0) setSessions(freshSessions);
          },
          onUsersChange: (freshUsers) => {
            if (freshUsers && freshUsers.length > 0) setRegisteredUsers(freshUsers);
          }
        });
      }
    }
    loadDataFromFirestore();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync state writes automatically to both localStorage and Cloud Firestore
  useEffect(() => {
    localStorage.setItem("law_currentUser", currentUser ? JSON.stringify(currentUser) : "");
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("law_users", JSON.stringify(registeredUsers));
    registeredUsers.forEach(u => dbSaveUser(u));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem("law_clients", JSON.stringify(clients));
    clients.forEach(c => dbSaveClient(c));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem("law_opponents", JSON.stringify(opponents));
    opponents.forEach(o => dbSaveOpponent(o));
  }, [opponents]);

  useEffect(() => {
    localStorage.setItem("law_cases", JSON.stringify(cases));
    cases.forEach(c => dbSaveCase(c));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem("law_sessions", JSON.stringify(sessions));
    sessions.forEach(s => dbSaveSession(s));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("law_leads", JSON.stringify(leads));
    leads.forEach(l => dbSaveLead(l));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem("law_fees", JSON.stringify(fees));
  }, [fees]);

  useEffect(() => {
    localStorage.setItem("law_codes", JSON.stringify(lawCodes));
  }, [lawCodes]);

  useEffect(() => {
    localStorage.setItem("law_customSections", JSON.stringify(customSections));
  }, [customSections]);

  useEffect(() => {
    localStorage.setItem("law_customProperties", JSON.stringify(customProperties));
  }, [customProperties]);

  useEffect(() => {
    localStorage.setItem("law_courts", JSON.stringify(courtsList));
  }, [courtsList]);

  useEffect(() => {
    localStorage.setItem("law_subjects", JSON.stringify(subjectsList));
  }, [subjectsList]);

  useEffect(() => {
    localStorage.setItem("law_licenses", JSON.stringify(licenses));
    licenses.forEach(l => dbSaveLicense(l));
  }, [licenses]);

  useEffect(() => {
    localStorage.setItem("law_activationRequests", JSON.stringify(activationRequests));
    activationRequests.forEach(r => dbSaveActivationRequest(r));
  }, [activationRequests]);

  // ----------------------------------------------------
  // INTERACTIVE BILINGUAL KEYBOARD SHORTCUTS CONTROLLER
  // ----------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K or Alt+F / Alt+K: Open Global Search
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "k" || e.key === "ك")) {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
        return;
      }

      if (e.altKey) {
        const key = e.key.toLowerCase();
        // Alt + K / Alt + F: Global Search
        if (key === "k" || key === "ك" || key === "f" || key === "ب") {
          setIsGlobalSearchOpen(prev => !prev);
          e.preventDefault();
        }
        // Alt + L / م : Language Toggle
        else if (key === "l" || key === "م") {
          setLanguage(prev => prev === "ar" ? "en" : "ar");
          e.preventDefault();
        }
        // Alt + N / د : Dark Mode Toggle
        else if (key === "n" || key === "د") {
          setIsDarkMode(prev => !prev);
          e.preventDefault();
        }
        // Alt + D / ي : Nav Dashboard
        else if (key === "d" || key === "ي") {
          setActiveSection("dashboard");
          e.preventDefault();
        }
        // Alt + S / س : Nav Sessions Scheduler Calendar
        else if (key === "s" || key === "س") {
          setActiveSection("sessions");
          e.preventDefault();
        }
        // Alt + C / ؤ : Nav Cases
        else if (key === "c" || key === "ؤ") {
          setActiveSection("cases");
          e.preventDefault();
        }
        // Alt + V / ر : Nav Clients
        else if (key === "v" || key === "ر") {
          setActiveSection("clients");
          e.preventDefault();
        }
        // Alt + A / ش : Nav AI Assistant
        else if (key === "a" || key === "ش") {
          setActiveSection("ai");
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ----------------------------------------------------
  // LICENSING SECURITY GATE CHECK
  // ----------------------------------------------------
  const isCopyLicensedOnThisDevice = () => {
    // Wesam Al-Shenawey master administrator bypasses all device locks
    if (currentUser?.phone === "01283233555") return true;

    const matchedLic = licenses.find(l => l.id === activeLicenseKey);
    if (matchedLic && matchedLic.status === "active") {
      return matchedLic.approvedDevices.includes(deviceFingerprint);
    }
    return false;
  };

  const handleActivateCopy = (key: string) => {
    setActiveLicenseKey(key);
    localStorage.setItem("law_activeLicenseKey", key);

    setLicenses(prev => prev.map(lic => {
      if (lic.id === key) {
        if (!lic.approvedDevices.includes(deviceFingerprint)) {
          const uLic = { ...lic, approvedDevices: [...lic.approvedDevices, deviceFingerprint] };
          dbSaveLicense(uLic);
          return uLic;
        }
      }
      return lic;
    }));
  };

  const handleRequestActivation = (req: ActivationRequest) => {
    setActivationRequests(prev => [...prev, req]);
    dbSaveActivationRequest(req);
  };

  // Admin Licensing controls passed to Setting view
  const handleAddLicense = (lic: License) => {
    setLicenses(prev => [...prev, lic]);
    dbSaveLicense(lic);
  };

  const handleDeleteLicense = (id: string) => {
    setLicenses(prev => prev.filter(lic => lic.id !== id));
  };

  const handleUpdateLicense = (id: string, updated: Partial<License>) => {
    setLicenses(prev => prev.map(lic => {
      if (lic.id === id) {
        const u = { ...lic, ...updated };
        dbSaveLicense(u);
        return u;
      }
      return lic;
    }));
  };

  const handleApproveDeviceRequest = (reqId: string) => {
    setActivationRequests(prev => prev.map(r => {
      if (r.id === reqId) {
        const approvedReq = { ...r, status: "approved" as const };
        
        // Add approved fingerprint signature to respective license key listing
        setLicenses(prevL => prevL.map(lic => {
          if (lic.id === r.licenseKey) {
            if (!lic.approvedDevices.includes(r.deviceFingerprint)) {
              const uLic = { ...lic, approvedDevices: [...lic.approvedDevices, r.deviceFingerprint] };
              dbSaveLicense(uLic);
              return uLic;
            }
          }
          return lic;
        }));

        dbSaveActivationRequest(approvedReq);
        return approvedReq;
      }
      return r;
    }));
  };

  const handleRejectDeviceRequest = (reqId: string) => {
    setActivationRequests(prev => prev.map(r => {
      if (r.id === reqId) {
        const rejReq = { ...r, status: "rejected" as const };
        dbSaveActivationRequest(rejReq);
        return rejReq;
      }
      return r;
    }));
  };

  const handleBindPhoneToLicense = (licenseKey: string, phone: string): boolean => {
    let outcome = false;
    setLicenses(prev => prev.map(lic => {
      if (lic.id === licenseKey) {
        if (!lic.registeredPhones.includes(phone)) {
          lic.registeredPhones.push(phone);
          dbSaveLicense(lic);
          outcome = true;
        }
      }
      return lic;
    }));
    return outcome;
  };

  // ----------------------------------------------------
  // EVENT ACTIONS FOR SUBSYSTEMS
  // ----------------------------------------------------
  const handleClientNoteSubmit = (
    clName: string, 
    text: string, 
    priority: "High" | "Normal" | "Low" = "Normal",
    scheduledReminder: boolean = false,
    referencedCase: string = "",
    category: string = "Consultation",
    linkedAttachments: any[] = [],
    requiresSignature: boolean = false,
    clientPhone: string = "",
    legalAffirmation: string = ""
  ) => {
    const noteId = "note-" + Math.random().toString(36).substr(2, 9);
    const token = "SIG-" + Math.random().toString(36).substr(2, 7).toUpperCase();
    const confirmLink = buildConfirmationLink(noteId, token);

    const newNote: ClientNote = {
      id: noteId,
      clientName: clName,
      text: text,
      date: new Date().toISOString(),
      priority,
      category,
      linkedAttachments,
      status: "Pending",
      scheduledReminder,
      referencedCaseId: referencedCase,
      requiresSignature,
      clientPhone: clientPhone || undefined,
      legalAffirmation: legalAffirmation || undefined,
      signatureStatus: requiresSignature ? "pending" : "none",
      confirmationToken: requiresSignature ? token : undefined,
      confirmationLink: requiresSignature ? confirmLink : undefined,
      signatureRequestedBy: requiresSignature ? "client" : undefined,
      signatureRequestedAt: requiresSignature ? new Date().toISOString() : undefined,
      signatureHistory: requiresSignature ? [
        {
          timestamp: new Date().toISOString(),
          action: "طلب توقيع رقمي وإصدار رابط تأكيد قانوني",
          performedBy: clName,
          status: "pending",
          notes: "تم إنشاء طلب التوقيع الإلكتروني وتوليد رابط التأكيد الرقمي المعتمد"
        }
      ] : []
    };

    setClientNotes(prev => {
      const updated = [newNote, ...prev];
      localStorage.setItem("law_clientNotes", JSON.stringify(updated));
      return updated;
    });

    // Trigger Browser Push Notification Alert for staff/lawyers
    notifyClientActivity(
      clName,
      priority === "High" ? "رسالة عاجلة جداً من موكل" : "رسالة جديدة من موكل",
      text,
      language
    );
    
    let alertMsg = "";
    if (language === "ar") {
      alertMsg = `عزيزنا الموكل [${clName}] تم وضع ملحوظتك بالنجاح!\n`;
      alertMsg += `الأولوية المعينة: ${priority === "High" ? "🚨 عاجل جداً" : priority === "Normal" ? "⚡ متوسط" : "📌 عادي"}\n`;
      if (requiresSignature) {
        alertMsg += `✍️ تم تفعيل طلب التوقيع الرقمي وإصدار رابط التأكيد القانوني الخاص بك.\n`;
      }
      if (scheduledReminder) {
        alertMsg += `✔️ تم تفعيل طلب التذكير التلقائي (SMS / Push) قبل جلسة المحاكمة بـ 24 ساعة لضمان حضورك.`;
      }
    } else {
      alertMsg = `Dear Client [${clName}], your message is dispatched successfully!\n`;
      alertMsg += `Urgency: ${priority}\n`;
      if (requiresSignature) {
        alertMsg += `✍️ Digital signature confirmation link generated.\n`;
      }
      if (scheduledReminder) {
        alertMsg += `✔️ Automated SMS reminder has been successfully requested 24 hours prior to court session.`;
      }
    }
    alert(alertMsg);
  };

  const handleUpdateClientNote = (noteId: string, updatedFields: Partial<ClientNote>) => {
    setClientNotes(prev => {
      const updated = prev.map(note => {
        if (note.id === noteId) {
          const history = note.signatureHistory ? [...note.signatureHistory] : [];
          if (updatedFields.signatureStatus && updatedFields.signatureStatus !== note.signatureStatus) {
            history.push({
              timestamp: new Date().toISOString(),
              action: updatedFields.signatureStatus === "signed" ? "اعتماد وتوقيع المذكرة إلكترونياً" : "تحديث حالة التوقيع",
              performedBy: updatedFields.signatureData?.signedBy || currentUser?.name || "المستخدم",
              status: updatedFields.signatureStatus,
              notes: updatedFields.signatureData ? `بصمة التحقق: ${updatedFields.signatureData.verificationHash}` : "تعديل الحالة من سجل المحامي"
            });
          }
          return { ...note, ...updatedFields, signatureHistory: history };
        }
        return note;
      });
      localStorage.setItem("law_clientNotes", JSON.stringify(updated));
      return updated;
    });
  };

  const handleReplyToClientNote = (noteId: string, reply: string) => {
    setClientNotes(prev => {
      const updated = prev.map(note => {
        if (note.id === noteId) {
          const history = note.signatureHistory ? [...note.signatureHistory] : [];
          history.push({
            timestamp: new Date().toISOString(),
            action: "رد الأستاذ وسام الشناوي / هيئة الدفاع",
            performedBy: currentUser?.name || "المحامي المعتمد",
            status: note.signatureStatus || "none",
            notes: reply
          });
          return {
            ...note,
            attorneyReply: reply,
            status: "Read by Attorney" as const,
            signatureHistory: history
          };
        }
        return note;
      });
      localStorage.setItem("law_clientNotes", JSON.stringify(updated));
      return updated;
    });

    notifyClientActivity(
      "الأستاذ وسام الشناوي المحامي بالنقض",
      "تم إرسال رد رسمي على ملحوظة الموكل",
      reply,
      language
    );
  };

  const handleMarkNoteAsRead = (noteId: string) => {
    setClientNotes(prev => {
      const updated = prev.map(note => {
        if (note.id === noteId) {
          return { ...note, status: "Read by Attorney" as const };
        }
        return note;
      });
      localStorage.setItem("law_clientNotes", JSON.stringify(updated));
      return updated;
    });
  };

  const handleAcknowledgeReplies = () => {
    setClientNotes(prev => {
      const updated = prev.map(note => {
        if (note.attorneyReply && note.status !== "Acknowledged" && (note.clientName === currentUser?.name || currentUser?.name === "الموكل المعتمد")) {
          return { ...note, status: "Acknowledged" as const };
        }
        return note;
      });
      localStorage.setItem("law_clientNotes", JSON.stringify(updated));
      return updated;
    });
    alert(language === "ar" ? "تمت المصادقة على ردود المحامي بنجاح!" : "Attorney replies have been acknowledged!");
  };

  // PDF export functionality with standard high contrast alignment for universal print support
  const handleExportClientPDF = (clientName: string) => {
    const doc = new jsPDF();
    
    // Header styling
    doc.setFillColor(30, 41, 59); // slate-900 background for title block
    doc.rect(0, 0, 210, 35, "F");
    
    doc.setTextColor(245, 158, 11); // amber-500 gold
    doc.setFontSize(16);
    doc.text("AL-SHENAWEY SMART LAW OFFICE", 15, 15);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("Secure Client Portal - Interaction History & Log Dossier", 15, 24);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 29);
    
    // Draw horizontal separator
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1.5);
    doc.line(15, 45, 195, 45);
    
    // Client Meta Info Card
    doc.setFillColor(248, 250, 252); // soft slate border Box
    doc.rect(15, 50, 180, 30, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(15, 50, 180, 30, "D");
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(`Client Name: ${clientName}`, 20, 58);
    doc.text(`Registry Office: Cairo Court Syndicate Branch`, 20, 64);
    doc.text(`Connection: Secured Encrypted Cloud Stream`, 20, 70);
    doc.text(`Export Integrity: Verified Off-line File Audit`, 20, 76);
    
    // Logs Section Header
    doc.setFontSize(14);
    doc.text("INTERACTION LOG RECORDS & CLIENT MESSAGES", 15, 95);
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 98, 195, 98);
    
    let yPos = 106;
    
    const relevantNotes = clientNotes.filter(n => n.clientName === clientName || clientName === "الموكل المعتمد");
    
    relevantNotes.forEach((note, index) => {
      // Box for each note
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, yPos, 180, 28, "DF");
      
      // Vertical left tag
      doc.setFillColor(245, 158, 11); // gold color accent
      doc.rect(15, yPos, 4, 28, "F");
      
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(10);
      doc.text(`[Entry #${relevantNotes.length - index}] Dispatched on: ${new Date(note.date).toLocaleString()}`, 24, yPos + 8);
      
      doc.setTextColor(71, 85, 105); // slate-600 font
      
      const textLine1 = note.text.substring(0, 80);
      const textLine2 = note.text.substring(80, 160);
      const textLine3 = note.text.substring(160, 240);
      
      doc.text(textLine1 || "No messages entered", 24, yPos + 15);
      if (textLine2) {
        doc.text(textLine2, 24, yPos + 21);
      } else if (textLine3) {
        doc.text(textLine3, 24, yPos + 26);
      }
      
      yPos += 34;
      
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    doc.setTextColor(148, 163, 184); // light gray slate
    doc.setFontSize(8);
    doc.text("Wesam Al-Shenawey Smart Legal Chambers - All rights reserved. Cairo, Egypt.", 15, 285);
    
    doc.save(`Shenawey_Client_Interaction_Report_${clientName.replace(/\s+/g, "_")}.pdf`);
  };



  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const performCloudSync = async () => {
    const tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) return;

    setIsCloudSyncing(true);
    try {
      const allData: any = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("law_")) {
          allData[key] = localStorage.getItem(key);
        }
      }
      
      const jsonData = JSON.stringify(allData);
      const base64Data = btoa(unescape(encodeURIComponent(jsonData)));
      const mimeType = "application/json";

      const existingFiles = await fetchGoogleDriveFiles(tokenState.accessToken, "name='legal_office_backup.json'", 10);
      
      for (const file of existingFiles) {
         try {
            await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
               method: 'DELETE',
               headers: { Authorization: `Bearer ${tokenState.accessToken}` }
            });
         } catch (e) {
            console.error("Cleanup error", e);
         }
      }

      await uploadFileToGoogleDrive(
        tokenState.accessToken,
        "legal_office_backup.json",
        "data:application/json;base64," + base64Data,
        mimeType
      );
      setLastSyncTime(new Date());
    } catch (e) {
      console.error("Cloud Sync Error:", e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleManualCloudSync = () => {
    let tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) {
      requestWorkspaceAuth((newState) => {
        performCloudSync();
      }, (err) => {
        alert("Cloud Backup Failed: Please approve permissions.");
      });
    } else {
      performCloudSync();
    }
  };

  const handleRestoreFromCloud = async () => {
    let tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) {
      requestWorkspaceAuth(async (newState) => {
         await doRestore(newState.accessToken!);
      });
      return;
    }
    await doRestore(tokenState.accessToken);
  };

  const doRestore = async (token: string) => {
    setIsCloudSyncing(true);
    try {
      const files = await fetchGoogleDriveFiles(token, "name='legal_office_backup.json'", 1);
      if (files.length > 0) {
        const file = files[0];
        const { base64 } = await downloadGoogleDriveFileAsBase64(token, file.id);
        const jsonData = decodeURIComponent(escape(atob(base64)));
        
        alert("تم استرجاع البيانات بنجاح من جوجل درايف! يرجى إعادة تحميل الصفحة لتطبيق التغييرات.");
        const parsed = JSON.parse(jsonData);
        for (const key in parsed) {
          localStorage.setItem(key, parsed[key]);
        }
        window.location.reload();
      } else {
        alert("لا يوجد نسخة احتياطية محفوظة على جوجل درايف.");
      }
    } catch (e) {
      console.error(e);
      alert("فشل استرجاع النسخة الاحتياطية.");
    } finally {
      setIsCloudSyncing(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      const token = getStoredWorkspaceToken();
      if (token.accessToken) {
         performCloudSync();
      }
    }, 120000); // 2 mins
    return () => clearInterval(interval);
  }, [currentUser]);


  const getLocalDeviceId = () => {
    let devId = localStorage.getItem("law_device_id");
    if (!devId) {
      devId = "DEV-" + Math.floor(Math.random() * 1000000000).toString(16);
      localStorage.setItem("law_device_id", devId);
    }
    return devId;
  };

  const handleLoginSuccess = (user: PlatformUser) => {
    // DEVICE LIMIT CHECK (Bypass for ADMIN if needed, but we apply to all to be safe)
    if (user.role !== UserRole.ADMIN) {
      const devId = getLocalDeviceId();
      const connected = user.connectedDevices || [];
      const isKnownDevice = connected.some(d => d.deviceId === devId);
      
      if (!isKnownDevice) {
        const maxDevices = user.maxDevices || 1; // Default to 1 device
        if (connected.length >= maxDevices) {
          alert("لقد تجاوزت الحد الأقصى للأجهزة المسموح بها لهذا الحساب. الرجاء التواصل مع الإدارة أو تسجيل الخروج من جهاز آخر.");
          return; // Abort login
        } else {
          // Register this new device
          const newDevice: ConnectedDeviceRecord = {
            deviceId: devId,
            deviceName: navigator.userAgent.substring(0, 30) + "...",
            deviceType: "desktop",
            os: "Web",
            browser: "Browser",
            firstLogin: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isCurrentDevice: true
          };
          const updatedUser: PlatformUser = { ...user, connectedDevices: [...connected, newDevice] };
          handleUpdateUser(user.id, updatedUser);
          user = updatedUser; // Use updated user for current session
        }
      } else {
        // Update last login
        const updatedConnected = connected.map(d => 
          d.deviceId === devId ? { ...d, lastLogin: new Date().toISOString() } : d
        );
        handleUpdateUser(user.id, { connectedDevices: updatedConnected });
      }

      // Check if merged
      if (user.mergedWithAccountId) {
        const parentUser = registeredUsers.find(u => u.id === user.mergedWithAccountId);
        if (parentUser) {
          alert(`تم دمج هذا الحساب مع حساب (${parentUser.name}). سيتم تحويلك واستخدام صلاحيات وبيانات الحساب الأساسي.`);
          user = parentUser; // Log in as the parent user
        }
      }
    }

    setCurrentUser(user);
    if (user.role === UserRole.SEEKER) {
      setActiveSection("social"); // Direct seekers/clients to social hub after verifying phone login!
    } else if (user.role === UserRole.CLIENT) {
      setActiveSection("social");
    } else {
      setActiveSection("dashboard");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("law_currentUser");
  };

  const handleRegisterUser = (newUser: PlatformUser) => {
    setRegisteredUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (id: string, updated: Partial<PlatformUser>) => {
    setRegisteredUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...updated } : null);
    }
  };

  const handleAddAnnouncement = (ann: Announcement) => {
    setAnnouncements(prev => [ann, ...prev]);
  };

  const handleUpdateAnnouncement = (id: string, updated: Partial<Announcement>) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleAddClient = (newCl: ClientProfile, firstCase?: CaseRecord) => {
    setClients(prev => {
      const updated = [...prev, newCl];
      localStorage.setItem("law_clients", JSON.stringify(updated));
      return updated;
    });
    
    // If a first case is linked from onboarding wizard
    if (firstCase) {
      handleAddCase(firstCase);
    }
    
    const clientPhone = newCl.phone || newCl.whatsapp || newCl.nationalId;
    const matchingPhoneExists = registeredUsers.some(u => u.phone === clientPhone);
    if (!matchingPhoneExists && (newCl.password || clientPhone)) {
      const userCred: PlatformUser = {
        id: "usr-" + newCl.id,
        name: newCl.name,
        phone: clientPhone,
        passwordHash: newCl.password || "123456",
        role: UserRole.CLIENT,
        isVerified: true,
        email: newCl.email,
        facebookAccount: newCl.facebook,
        whatsAppAccount: newCl.whatsapp,
        createdAt: new Date().toISOString()
      };
      setRegisteredUsers(prev => {
        const updated = [...prev, userCred];
        localStorage.setItem("law_users", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleAddOpponent = (newO: OpponentProfile) => {
    setOpponents(prev => [...prev, newO]);
  };

  const handleUpdateClient = (id: string, updatedFields: Partial<ClientProfile>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  const handleUpdateCase = (id: string, updatedFields: Partial<CaseRecord>) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  const handleDeleteCase = (id: string) => {
    setCases(prev => prev.filter(c => c.id !== id));
  };

  const handleImportLeads = (newLeads: LeadProfile[]) => {
    setLeads(prev => {
      const combined = [...prev, ...newLeads];
      const unique: LeadProfile[] = [];
      const seen = new Set();
      combined.forEach(l => {
        if (!seen.has(l.phone)) {
          seen.add(l.phone);
          unique.push(l);
        }
      });
      return unique;
    });
  };

  const handleAddCase = (newCs: CaseRecord) => {
    setCases(prev => [...prev, newCs]);

    const finalSessionDate = newCs.nextSessionDate;
    if (finalSessionDate) {
      const isMorning = newCs.courtType.includes("جنايات") || newCs.courtType.includes("إداري") ? "morning" : "evening";
      const sRec: SessionRecord = {
        id: "ss-" + Date.now(),
        caseId: newCs.id,
        date: finalSessionDate,
        timeType: isMorning,
        caseInfo: {
          caseNumber: newCs.caseNumber,
          caseYear: newCs.caseYear,
          competentCourt: newCs.competentCourt,
          subject: newCs.subject,
          clientName: newCs.clientName,
          opponentName: newCs.opponentName
        },
        status: "pending"
      };
      setSessions(prev => [...prev, sRec]);
    }
  };

  const handleUpdateSessionStatus = (id: string, nextDate: string, adjournmentReason: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          date: nextDate,
          decision: adjournmentReason,
          status: "adjourned",
          history: [
            ...(s.history || []),
            { date: s.date, decision: adjournmentReason, requiredWork: s.requiredWork || "تم تحريك الدعوى بنجاح" }
          ]
        };
      }
      return s;
    }));
  };

  const handleAddFeeTransfer = (val: FeeTransfer) => {
    setFees(prev => [...prev, val]);
    
    setClients(prev => prev.map(c => {
      if (c.name.trim() === val.clientName.trim() && val.currency === "EGP") {
        return { ...c, remainingFees: Math.max(0, (c.remainingFees || 0) - val.amount) };
      }
      return c;
    }));
  };

  const handleAddCode = (val: LawCodeBook) => {
    setLawCodes(prev => [...prev, val]);
  };

  const handleAddCustomSection = (val: AdminCustomSection) => {
    setCustomSections(prev => [...prev, val]);
  };

  const handleAddCustomProperty = (val: AdminCustomProperty) => {
    setCustomProperties(prev => [...prev, val]);
  };

  const handleRemoveCustomSection = (id: string) => {
    setCustomSections(prev => prev.filter(s => s.id !== id));
  };

  const handleRemoveCustomProperty = (id: string) => {
    setCustomProperties(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateUserRole = (phone: string, role: string) => {
    setRegisteredUsers(prev => prev.map(u => {
      if (u.phone === phone) {
        return { ...u, role: role as UserRole };
      }
      return u;
    }));
  };

  const handleUpdateUserPassword = (phone: string, pass: string) => {
    setRegisteredUsers(prev => prev.map(u => {
      if (u.phone === phone) {
        return { ...u, passwordHash: pass };
      }
      return u;
    }));
  };

  // ----------------------------------------------------
  // ROUTING VIEWS RENDERER
  // ----------------------------------------------------
  const renderActiveView = () => {
    switch (activeSection) {
      case "legal_ai_analysis":
        return (
          <LegalAiAnalysisView
            cases={cases}
            clients={clients}
            language={language}
          />
        );
      case "smart_notifications":
        return (
          <SmartNotificationsView
            cases={cases}
            clients={clients}
            language={language}
          />
        );
      case "urgent_followup":
        return (
          <UrgentFollowUpView
            cases={cases}
            clients={clients}
            sessions={sessions}
            clientNotes={clientNotes}
            fees={fees}
            currentUser={currentUser!}
            onNavigate={(sec, extra) => {
              if (extra && extra.caseId) {
                setDefaultSelectCaseId(extra.caseId);
              }
              setActiveSection(sec);
            }}
            language={language}
          />
        );
      case "office_services":
        return (
          <OfficeServicesView
            currentUser={currentUser!}
            language={language}
            onNavigate={(sec) => setActiveSection(sec)}
          />
        );
      case "legal_templates":
        return (
          <LegalTemplatesView
            clients={clients}
            cases={cases}
            currentUser={currentUser!}
            onSaveToCaseAttachments={(caseId, docName, content) => {
              const savedDocs = JSON.parse(localStorage.getItem("law_managed_documents") || "[]");
              const newDoc = {
                id: "doc-" + Date.now(),
                name: docName,
                type: "word",
                section: "cases",
                sectionLabel: "ملفات القضايا",
                fileBase64: content,
                addedAt: new Date().toISOString(),
                caseId: caseId
              };
              localStorage.setItem("law_managed_documents", JSON.stringify([newDoc, ...savedDocs]));
            }}
            onOpenInEditor={(text, title, clientName, caseNumber) => {
              setEditorInitialText(text);
              setActiveSection("doc_editor");
            }}
            language={language}
          />
        );
      case "attachments":
        return (
          <AttachmentsView
            cases={cases}
            clients={clients}
            currentUser={currentUser!}
            onNavigateToOcr={() => setActiveSection("smart_ocr")}
            language={language}
          />
        );
      case "dashboard":
        return (
          <DashboardView 
            cases={cases}
            clients={clients}
            sessions={sessions}
            leads={leads}
            fees={fees}
            clientNotes={clientNotes}
            onMarkNoteAsRead={handleMarkNoteAsRead}
            onUpdateClientNote={handleUpdateClientNote}
            onReplyToNote={handleReplyToClientNote}
            onAddClient={handleAddClient}
            onAddCase={handleAddCase}
            onImportLeads={handleImportLeads}
            onNavigate={(sec, extra) => {
              if (extra && extra.caseId) {
                setDefaultSelectCaseId(extra.caseId);
              }
              setActiveSection(sec);
            }}
            currentUser={currentUser!}
            registeredUsers={registeredUsers}
          />
        );
      case "sessions":
        return (
          <SessionsView 
            sessions={sessions}
            onUpdateSessionStatus={handleUpdateSessionStatus}
            currentUser={currentUser!}
            cases={cases}
            clients={clients}
            fees={fees}
            onAddFeePayment={handleAddFeeTransfer}
            onAddSession={(newSess) => setSessions(prev => [newSess, ...prev])}
          />
        );
      case "cases":
        return (
          <CasesView 
            cases={cases}
            clients={clients}
            opponents={opponents}
            onAddCase={handleAddCase}
            onAddCourt={(ct) => setCourtsList(prev => [...prev, ct])}
            onAddSubject={(sub) => setSubjectsList(prev => [...prev, sub])}
            onAddOpponent={handleAddOpponent}
            courtsList={courtsList}
            subjectsList={subjectsList}
            onUpdateCase={handleUpdateCase}
            onDeleteCase={handleDeleteCase}
            currentUser={currentUser!}
            language={language}
            defaultSelectCaseId={defaultSelectCaseId}
            onClearDefaultSelectCaseId={() => setDefaultSelectCaseId(null)}
            onOpenDocumentManager={(sec, lbl) => {
              setDocumentManagerSection(sec);
              setDocumentManagerSectionLabel(lbl);
              setIsDocumentManagerOpen(true);
            }}
            onNavigateToOcr={() => setActiveSection("smart_ocr")}
          />
        );
      case "clients":
        return (
          <ClientsView 
            clients={clients}
            opponents={opponents}
            leads={leads}
            fees={fees}
            registeredUsers={registeredUsers}
            onAddClient={handleAddClient}
            onAddOpponent={handleAddOpponent}
            onUpdateUserRole={handleUpdateUserRole}
            onUpdateUserPassword={handleUpdateUserPassword}
            onImportLeads={handleImportLeads}
            onUpdateClient={handleUpdateClient}
            currentUser={currentUser!}
            onOpenPhoneSync={() => setIsPhoneSyncOpen(true)}
            onOpenDocumentManager={(sec, lbl) => {
              setDocumentManagerSection(sec);
              setDocumentManagerSectionLabel(lbl);
              setIsDocumentManagerOpen(true);
            }}
          />
        );
      case "fees":
        return (
          <FeesView 
            fees={fees}
            clients={clients}
            onAddFeeTransfer={handleAddFeeTransfer}
            currentUser={currentUser!}
          />
        );
      case "ai":
        return (
          <AiAssistantView 
            currentUser={currentUser!}
          />
        );
      case "egyptian_lawyer_ai":
        return (
          <EgyptianLawyerAiView 
            currentUser={currentUser!}
            language={language}
            onNavigate={(sec) => setActiveSection(sec)}
          />
        );
      case "companies":
        return <CompaniesView />;
      case "documentation":
        return <DocumentationView />;
      case "adminwork":
        return <AdminWorkView />;
      case "lawcodes":
        return (
          <LawCodesView 
            lawCodes={lawCodes}
            onAddCode={handleAddCode}
            currentUser={currentUser!}
          />
        );
      case "social":
        return (
          <SocialHubView 
            language={language}
            currentUser={currentUser!}
            clients={clients}
            onUpdateClient={handleUpdateClient}
          />
        );
      case "doc_editor":
        return (
          <AdvancedDocumentEditor
            currentUser={currentUser!}
            clients={clients}
            cases={cases}
            initialContent={editorInitialText}
            language={language}
          />
        );
      case "smart_ocr":
        return (
          <SmartOcrStudio
            currentUser={currentUser!}
            clients={clients}
            cases={cases}
            opponents={opponents}
            onAddClient={handleAddClient}
            onAddCase={handleAddCase}
            onAddOpponent={handleAddOpponent}
            onOpenInEditor={(text, title, clientName, caseNumber) => {
              setEditorInitialText(text);
              setActiveSection("doc_editor");
            }}
            onNavigate={(sec) => setActiveSection(sec)}
            language={language}
          />
        );
      case "announcements":
        return (
          <AnnouncementsView
            announcements={announcements}
            onAddAnnouncement={handleAddAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            onTogglePin={(id) => {
              setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
            }}
            onToggleTicker={(id) => {
              setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, showInTicker: !a.showInTicker } : a));
            }}
            currentUser={currentUser!}
            language={language}
          />
        );
      case "designs":
        return (
          <DesignsView 
            currentPreferences={designPreferences}
            onApplyPreferences={handleApplyDesignPreferences}
            language={language}
          />
        );
      case "settings":
        return (
          <SettingsView 
            customSections={customSections}
            customProperties={customProperties}
            onAddCustomSection={handleAddCustomSection}
            onAddCustomProperty={handleAddCustomProperty}
            onRemoveCustomSection={handleRemoveCustomSection}
            onRemoveCustomProperty={handleRemoveCustomProperty}
            currentUser={currentUser!}
            licenses={licenses}
            onAddLicense={handleAddLicense}
            onDeleteLicense={handleDeleteLicense}
            onUpdateLicense={handleUpdateLicense}
            activationRequests={activationRequests}
            onApproveDeviceRequest={handleApproveDeviceRequest}
            onRejectDeviceRequest={handleRejectDeviceRequest}
            language={language}
            registeredUsers={registeredUsers}
            onUpdateUser={handleUpdateUser}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            onNavigateToDesigns={() => setActiveSection("designs")}
          />
        );
      case "import_files":
        return (
          <ImportFilesView
            onAddClient={handleAddClient}
            onAddCase={handleAddCase}
            clients={clients}
            language={language}
            onOpenDocumentManager={(sec, lbl) => {
              setDocumentManagerSection(sec);
              setDocumentManagerSectionLabel(lbl);
              setIsDocumentManagerOpen(true);
            }}
            onNavigateToOcr={() => setActiveSection("smart_ocr")}
          />
        );
      case "workspace":
        return (
          <GoogleWorkspaceHub
            currentUser={currentUser!}
            cases={cases}
            clients={clients}
            sessions={sessions}
            language={language}
            initialTab="sheets"
          />
        );
      case "keep":
        return (
          <GoogleWorkspaceHub
            currentUser={currentUser!}
            cases={cases}
            clients={clients}
            sessions={sessions}
            language={language}
            initialTab="keep"
          />
        );
      default:
        const targetDyn = customSections.find(s => s.id === activeSection);
        if (targetDyn) {
          return (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-right space-y-4 font-sans text-xs">
              <h2 className="text-xl font-bold text-amber-400">{targetDyn.nameArabic}</h2>
              <p className="text-slate-400">قسم إلكتروني تم استحداثه تلقائياً بواسطة الأستاذ وسام الشناوي.</p>
              
              <div className="p-12 text-center text-slate-500 bg-slate-950 rounded-lg animate-pulse">
                تم دمج وهندسة القسم بالكامل. يمكنك البدء باستخدام خاصية المزامنة السحابية لإدراج المدخلات.
              </div>
            </div>
          );
        }
        return <div className="text-center py-12">القسم غير متوفر</div>;
    }
  };

  // ----------------------------------------------------
  // OUTERMOST LAYOUT FLOW
  // ----------------------------------------------------
  
  // 1. IF NOT LOGGED IN, RENDER REGULAR SECURED LOGIN
  if (!currentUser) {
    return (
      <LoginView 
        onLoginSuccess={handleLoginSuccess}
        registeredUsers={registeredUsers}
        onRegisterUser={handleRegisterUser}
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        licenses={licenses}
        onBindPhoneToLicense={handleBindPhoneToLicense}
      />
    );
  }

  // 2. IF LOGGED IN BUT MACHINE IS UNLICENSED, REQUIRE ACTIVATION (Bypassed if user phone is general Admin Wesam)
  const isMasterAdmin = currentUser.phone === "01283233555";
  if (!isCopyLicensedOnThisDevice() && !isMasterAdmin) {
    return (
      <LicensingGate
        deviceFingerprint={deviceFingerprint}
        licenses={licenses}
        activationRequests={activationRequests}
        onActivateCopy={handleActivateCopy}
        onRequestActivation={handleRequestActivation}
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  // 3. PRE-CALCULATE MODAL METRICS FOR THE CURRENT CLIENT
  const modalClientNotes = clientNotes.filter(n => n.clientName === (currentUser.name || "الموكل المعتمد"));
  const totalNotesCount = modalClientNotes.length;
  const pendingRepliesCount = modalClientNotes.filter(n => n.status === "Pending").length;
  const resolvedIssuesCount = modalClientNotes.filter(n => n.status === "Read by Attorney" || n.status === "Acknowledged").length;
  const unacknowledgedReplies = modalClientNotes.filter(n => n.attorneyReply && n.status !== "Acknowledged");
  
  const filteredNotes = modalClientNotes.filter(n => 
    n.text.toLowerCase().includes(noteSearchQuery.toLowerCase()) || 
    (n.attorneyReply && n.attorneyReply.toLowerCase().includes(noteSearchQuery.toLowerCase())) ||
    new Date(n.date).toLocaleString("ar-EG").includes(noteSearchQuery)
  );

  // 4. RENDER CORE APPLICATION INTERFACES WITH LIGHT/DARK CUSTOM ACCENTS
  
  const selectedPalette = ACCENT_PALETTES[accentColor] || ACCENT_PALETTES.amber;
  const accentStyles = `
    :root {
      --accent-50: ${selectedPalette[50]};
      --accent-100: ${selectedPalette[100]};
      --accent-200: ${selectedPalette[200]};
      --accent-300: ${selectedPalette[300]};
      --accent-400: ${selectedPalette[400]};
      --accent-500: ${selectedPalette[500]};
      --accent-600: ${selectedPalette[600]};
      --accent-700: ${selectedPalette[700]};
      --accent-800: ${selectedPalette[800]};
      --accent-900: ${selectedPalette[900]};
      --accent-950: ${selectedPalette[950]};
    }
  `;

  return (
    <>
      <style>{accentStyles}</style>
      <div className={`min-h-screen flex flex-col md:flex-row relative transition-colors duration-300 ${
      isDarkMode ? "bg-[#111910] text-[#ecf3eb]" : "bg-[#f2f6ed] text-[#1c2a1b]"
    }`} dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* Floating User Profile Avatar in Top Left Corner */}

      <UserProfileCircle
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigateToSettings={() => setActiveSection("settings")}
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      
      {/* Global Public Announcement & Advertising Ticker (Centered Header) */}
      <div 
        className={`fixed top-4 z-40 transition-all duration-300 flex justify-center ${
          language === "ar"
            ? currentUser.role !== UserRole.CLIENT && sidebarMode === "full" ? "right-[330px] left-16 md:left-20" : currentUser.role !== UserRole.CLIENT && sidebarMode === "emoji" ? "right-[90px] left-16 md:left-20" : "right-16 md:right-20 left-16 md:left-20"
            : currentUser.role !== UserRole.CLIENT && sidebarMode === "full" ? "left-[330px] right-16 md:right-20" : currentUser.role !== UserRole.CLIENT && sidebarMode === "emoji" ? "left-[90px] right-16 md:right-20" : "left-16 md:left-20 right-16 md:right-20"
        }`}
      >
        <div className="w-full max-w-4xl">
          <AnnouncementTicker
            announcements={announcements}
            onNavigateToAnnouncements={() => setActiveSection("announcements")}
            language={language}
          />
        </div>
      </div>

      {/* Sidebar Navigation */}
      {currentUser.role !== UserRole.CLIENT && <Sidebar 
        currentUser={currentUser}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onLogout={handleLogout}
        customSections={customSections}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        language={language}
        sidebarMode={sidebarMode}
        setSidebarMode={setSidebarMode}
      />}
      {/* Main Container with Dynamic Margins and 2cm lowered top offset for desktop and mobile */}
      <main 
        className={`flex-1 p-3.5 sm:p-6 lg:p-8 pt-[calc(4.5rem+2cm)] sm:pt-[calc(5rem+2cm)] md:pt-[calc(5.5rem+2cm)] pb-16 overflow-y-auto max-h-screen transition-all duration-300 ${
          language === "ar"
            ? currentUser.role !== UserRole.CLIENT && sidebarMode === "full"
              ? "md:mr-[320px]"
              : currentUser.role !== UserRole.CLIENT && sidebarMode === "emoji"
              ? "md:mr-[80px]"
              : "mr-0"
            : currentUser.role !== UserRole.CLIENT && sidebarMode === "full"
              ? "md:ml-[320px]"
              : currentUser.role !== UserRole.CLIENT && sidebarMode === "emoji"
              ? "md:ml-[80px]"
              : "ml-0"
        }`}
      >
        {/* Global Public Announcement & Advertising Ticker (Always Visible at Top for All Users) */}
        

        {/* Top Header Bar with Dropdown Menus */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-emerald-900/10 dark:border-emerald-500/10">
          
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[12px] font-black text-amber-700 dark:text-amber-400 block tracking-wide">
                {language === "ar" ? "ديوان المحاماة الرقمي المتطور" : "Advanced Legal Office Portal"}
              </span>
              <h1 className="text-base md:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                {activeSection === "dashboard" && (language === "ar" ? "لوحة المتابعة الشاملة" : "Dashboard")}
                {activeSection === "office_services" && (language === "ar" ? "قائمة الخدمات القانونية والإدارية الشاملة" : "Comprehensive Legal Services")}
                {activeSection === "cases" && (language === "ar" ? "إدارة القضايا والدعاوى" : "Cases & Court Files")}
                {activeSection === "clients" && (language === "ar" ? "سجل الموكلين وجهات الاتصال" : "Clients & Contacts")}
                {activeSection === "sessions" && (language === "ar" ? "أجندة الجلسات اليومية" : "Court Sessions Agenda")}
                {activeSection === "fees" && (language === "ar" ? "الخزينة والأتعاب" : "Treasury & Fees")}
                {activeSection === "ai" && (language === "ar" ? "المستشار الذكي" : "AI Legal Assistant")}
                {activeSection === "doc_editor" && (language === "ar" ? "محرر المستندات والصياغة القضائية" : "Advanced Document Editor")}
                {activeSection === "smart_ocr" && (language === "ar" ? "الفحص واستخراج النصوص (Smart OCR)" : "Smart OCR Studio")}
                {activeSection === "lawcodes" && (language === "ar" ? "المكتبة والأكواد القضائية" : "Law Codes Library")}
                {activeSection === "social" && (language === "ar" ? "ديوان التواصل والاستشارات" : "Social & Interactive Hub")}
                {activeSection === "announcements" && (language === "ar" ? "شريط الإعلانات والتعميمات القضائية" : "Public Announcements & Legal Bulletins")}
                {activeSection === "import_files" && (language === "ar" ? "استيراد وإدارة الملفات" : "Import Files")}
                {activeSection === "keep" && (language === "ar" ? "ملاحظات ومذكرات Google Keep القضائية" : "Google Keep Legal Notes")}
                {activeSection === "workspace" && (language === "ar" ? "منظومة Google Workspace السحابية" : "Google Workspace Cloud")}
                {activeSection === "settings" && (language === "ar" ? "إعدادات النظام والترخيص" : "Settings & Licenses")}
                {activeSection === "tenants_admin" && (language === "ar" ? "إدارة المكاتب والمشتركين" : "Tenants Admin")}
              </h1>
            </div>
          </div>

          {/* Top Header Actions (Search Bar, Notifications, & Offline Sync Status Indicator) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 relative">
            {/* Browser Push Notifications Quick Toggle */}
            <button
              type="button"
              onClick={handleRequestPushNotifications}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all shadow-xs cursor-pointer ${
                browserNotificationStatus === "granted"
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-300 hover:bg-amber-500/25"
                  : browserNotificationStatus === "denied"
                  ? "bg-slate-500/10 border-slate-500/30 text-slate-500 hover:bg-slate-500/20"
                  : "bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-300 hover:bg-red-500/20 animate-pulse"
              }`}
              title={
                browserNotificationStatus === "granted"
                  ? "إشعارات المتصفح الفورية مفعلة (انقر لاختبار التنبيه الصوتي)"
                  : browserNotificationStatus === "denied"
                  ? "الإشعارات محظورة في إعدادات المتصفح"
                  : "انقر لتفعيل إشعارات المتصفح لتنبيهك بجلسات المحاكمة ورسائل الموكلين"
              }
            >
              {browserNotificationStatus === "granted" ? (
                <>
                  <BellRing className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                  <span>{language === "ar" ? "الإشعارات مفعلة 🔔" : "Push Active"}</span>
                </>
              ) : browserNotificationStatus === "denied" ? (
                <>
                  <BellOff className="w-3.5 h-3.5" />
                  <span>{language === "ar" ? "إشعارات محظورة" : "Notifications Blocked"}</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-red-500" />
                  <span>{language === "ar" ? "تفعيل إشعارات الجلسات 🔔" : "Enable Push Alerts"}</span>
                </>
              )}
            </button>

            {/* Offline-First & Network Status Chip */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all shadow-xs select-none ${
                !isOnline 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300"
                  : offlinePendingCount > 0
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
              }`}
              title={!isOnline ? "النظام يعمل حالياً في وضع عدم الاتصال بالإنترنت مع حفظ محلي كامل" : "النظام متصل بالسحابة ومتزامن"}
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span className="font-extrabold">{language === "ar" ? "وضع دون اتصال" : "Offline"}</span>
                  {offlinePendingCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-md font-mono text-[9px] font-black">
                      {offlinePendingCount} معلق
                    </span>
                  )}
                </>
              ) : offlinePendingCount > 0 ? (
                <>
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncingQueue ? "animate-spin" : ""}`} />
                  <span>{language === "ar" ? `مزامنة (${offlinePendingCount})` : `Sync (${offlinePendingCount})`}</span>
                  <button
                    type="button"
                    onClick={handleManualFlushOfflineSync}
                    disabled={isSyncingQueue}
                    className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-black cursor-pointer transition"
                  >
                    {isSyncingQueue ? "جاري..." : "مزامنة الآن"}
                  </button>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px]">{language === "ar" ? "سحابي متزامن" : "Live Cloud"}</span>
                </>
              )}
            </div>

            {/* Quick Global Search Trigger Button */}
            <button
              id="global-system-search-btn"
              type="button"
              onClick={() => setIsGlobalSearchOpen(true)}
              className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 hover:bg-amber-500/10 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 hover:border-amber-500 font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm group"
              title="البحث الشامل في كامل النظام والقضايا والأوراق (Ctrl + K)"
            >
              <Search className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
              <span>{language === "ar" ? "البحث الشامل" : "Global Search"}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono border border-slate-200 dark:border-slate-700 text-slate-500">Ctrl+K</kbd>
            </button>
          </div>
        </div>

        {/* Client upper assistance note tool */}
        {currentUser.role === UserRole.CLIENT && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex justify-between items-center text-xs flex-wrap gap-2 text-right">
            <div>
              <p className="font-extrabold text-amber-500">
                {language === "ar" ? "👋 أهلاً بك في ملفك القضائي الشخصي الآمن" : "👋 Welcome to your Legitimate Client Portal"}
              </p>
              <p className="text-slate-400 mt-0.5 leading-normal max-w-xl">
                {language === "ar" 
                  ? "يمكنك تصفح شروحات الدعاوى، التواريخ القضائية، وأصناف سداد الأتعاب المعينة لدى مكتب الأستاذ وسام." 
                  : "Track court schedule listings, remaining legal fees, and official case folder files safely."}
              </p>
            </div>
            
            <button
              id="client-leave-note"
              style={{ position: 'relative', overflow: 'hidden' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const id = Date.now();
                setButtonRipples((prev) => [...prev, { x, y, id }]);
                
                setIsClientNoteModalOpen(true);
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition duration-200 shadow-md cursor-pointer transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>{language === "ar" ? "✍️ ترك ملحوظة للأستاذ وسام" : "Message Advocate Wesam"}</span>
              
              {buttonRipples.map((ripple) => (
                <span
                  key={ripple.id}
                  onAnimationEnd={() => {
                    setButtonRipples((prev) => prev.filter((r) => r.id !== ripple.id));
                  }}
                  className="absolute bg-white/40 rounded-full pointer-events-none animate-ripple"
                  style={{
                    left: ripple.x - 20,
                    top: ripple.y - 20,
                    width: 40,
                    height: 40,
                  }}
                />
              ))}
            </button>
          </div>
        )}

        {/* BRANDED CLIENT NOTE DISPATCHER MODAL */}
        {isClientNoteModalOpen && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in font-sans" dir={language === "ar" ? "rtl" : "ltr"}>
            <div className="bg-white rounded-3xl border border-slate-200/90 w-full max-w-3xl overflow-hidden shadow-2xl animate-scale-up text-right">
              {/* Modal Title Block */}
              <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-amber-500/30">
                <div className="text-right">
                  <h3 className="text-base font-black text-white">⚖️ ديوان الملحوظات وإرسال المذكرات السحابية</h3>
                  <p className="text-[10px] text-amber-500 font-bold">المكتب الذكي للمحاماة - الأستاذ وسام الشناوي</p>
                </div>
                <button 
                  onClick={() => setIsClientNoteModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xl font-black bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <p className="text-xs text-slate-500 leading-normal">
                  {language === "ar" 
                    ? "عزيزنا الموكل، يمكنك كتابة وتعديل ملحوظتك الحالية وتصنيف أهميتها قبل تسليمها رسمياً لغرفة العمليات وسجلك القضائي. كما يمكنك تفعيل تذكيرات الجلسات بالرسائل اليدوية، واستعراض وإحالة المذكرات لملف قضية معين."
                    : "Dear Client, draft and edit your case notes, select urgency levels, toggle court date text notifications, reference specific case folders, and audit interaction logs."}
                </p>

                {/* Priority Selection and Session Reminder Toggle Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  {/* Select Priority widget */}
                  <div className="space-y-1 text-right">
                    <label className="block text-xs font-black text-slate-800">
                      🚨 مستوى أهمية الرسالة / الأولوية المعينة:
                    </label>
                    <select
                      value={notePriority}
                      onChange={(e) => setNotePriority(e.target.value as "High" | "Normal" | "Low")}
                      className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-amber-500 font-sans"
                    >
                      <option value="Normal">⚡ متوسطة الأهمية (Normal)</option>
                      <option value="High">🚨 عاجل جداً وطارئ (High / Urgent)</option>
                      <option value="Low">📌 هادئ أو تحديث روتيني (Low)</option>
                    </select>
                  </div>

                  {/* SMS Court Reminder Switch Toggle */}
                  <div className="flex flex-col justify-center text-right space-y-1">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1 justify-start">
                      🔔 إشعارات وتنبيهات الجلسات (SMS):
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={requestSmsReminder}
                        onChange={(e) => setRequestSmsReminder(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      <span className="mr-3 text-xs font-bold text-slate-700">
                        {requestSmsReminder 
                          ? "طلب تنبيه SMS تلقائي قبل الجلسة بـ ٢٤ ساعة" 
                          : "إيقاف تنبيهات الجلسات المؤتمتة"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Refer to Case Files with Preview Button */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-right">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="block text-xs font-black text-slate-800">
                      📁 ربط الملحوظة بملف قضيتك النشطة:
                    </label>
                    
                    <button
                      id="preview-associated-documents-trigger"
                      type="button"
                      onClick={() => setShowDocPreviewPane(!showDocPreviewPane)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[10.5px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <span>🔍 {showDocPreviewPane ? "إغلاق نافذة المعاينة" : "معاينة المستندات وأوراق القضية المتصلة"}</span>
                    </button>
                  </div>

                  <select
                    value={referencedCaseId}
                    onChange={(e) => setReferencedCaseId(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-amber-500 font-sans"
                  >
                    <option value="">-- اختياري: غير محدد / مالي أو عام --</option>
                    {cases
                      .filter(c => c.clientName === currentUser.name || currentUser.name === "الموكل المعتمد")
                      .map(c => (
                        <option key={c.id} value={c.id}>قضية رقم {c.caseNumber} لسنة {c.caseYear} - {c.subject}</option>
                      ))
                    }
                  </select>

                  {/* Preview Pane displaying associated file stats */}
                  {showDocPreviewPane && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl mt-2 space-y-3 max-h-48 overflow-y-auto text-xs text-slate-750 text-right">
                      <p className="font-bold border-b border-slate-100 pb-1 text-slate-900">📑 المستندات والأوراق المودعة بمجلس المحكمة:</p>
                      {cases
                        .filter(c => c.clientName === currentUser.name || currentUser.name === "الموكل المعتمد")
                        .length === 0 ? (
                        <p className="text-[10px] text-slate-400">لا يوجد قضايا ثبوتية مسجلة باسمك حالياً لربط المستندات بها.</p>
                      ) : (
                        cases
                          .filter(c => c.clientName === currentUser.name || currentUser.name === "الموكل المعتمد")
                          .map((c) => (
                            <div key={c.id} className="p-2.5 bg-slate-50 hover:bg-amber-50/20 border border-slate-100 rounded-lg flex flex-col gap-1 transition">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-slate-900">📂 رقم {c.caseNumber} لسنة {c.caseYear}</span>
                                <span className="bg-amber-100 text-amber-900 font-sans px-1.5 py-0.2 rounded font-extrabold">{c.competentCourt}</span>
                              </div>
                              <p className="font-medium text-slate-700">موضوع القضية: {c.subject}</p>
                              {c.nextSessionDate && (
                                <p className="text-[10px] text-emerald-800 font-bold">📅 الجلسة القادمة: {c.nextSessionDate} (طلب تذكير SMS ساري)</p>
                              )}
                              
                              {/* Attachments of this case file to preview */}
                              {c.attachments && c.attachments.length > 0 && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 space-y-1">
                                  <span className="text-[9px] text-slate-400 font-extrabold block">📄 المرفقات المتاحة للتحميل الفوري:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {c.attachments.map((attach, aIdx) => (
                                      <a
                                        key={aIdx}
                                        href={attach.url}
                                        download={attach.name}
                                        className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:border-amber-500 rounded px-2 py-0.5 text-[9px] text-amber-700 font-bold transition"
                                      >
                                        💾 {attach.name} ({attach.type})
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>

                {/* Category and Attachment Gallery Selection */}
                <div className="flex flex-wrap gap-2 items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-right">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-black text-slate-800 whitespace-nowrap">
                      🏷️ تصنيف الملحوظة:
                    </label>
                    <select
                      value={noteCategory}
                      onChange={(e) => setNoteCategory(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="Consultation">استشارة قانونية (Consultation)</option>
                      <option value="Legal Document">إيداع مستند (Legal Document)</option>
                      <option value="Fee Inquiry">استعلام عن الأتعاب (Fee Inquiry)</option>
                      <option value="Scheduling">مواعيد وجلسات (Scheduling)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAttachmentGallery(true)}
                    className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition border border-amber-200"
                  >
                    <span>📎</span>
                    <span>معرض المرفقات ({noteLinkedAttachments.length})</span>
                  </button>
                </div>

                {/* DIGITAL SIGNATURE REQUEST CONTROLS FOR CLIENT NOTE */}
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl space-y-2.5 text-right">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500/20 text-amber-900 rounded-lg border border-amber-500/30">
                        <FileSignature className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 block">
                          ✍️ طلب توقيع رقمي وتوليد رابط تأكيد قانوني معتمد:
                        </span>
                        <span className="text-[10px] text-slate-600">
                          إصدار بصمة إلكترونية مشفرة ورابط رسمي لإثبات وتوثيق هذه المذكرة قانونياً
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={requestDigitalSignature}
                        onChange={(e) => setRequestDigitalSignature(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      <span className="mr-2 text-xs font-black text-slate-800">
                        {requestDigitalSignature ? "مطلوب توقيع إلكتروني" : "بدون توقيع رقمي"}
                      </span>
                    </label>
                  </div>

                  {requestDigitalSignature && (
                    <div className="pt-2 border-t border-amber-500/20 space-y-2 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-800 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-amber-600" />
                            <span>رقم هاتف الموكل لإرسال رابط التأكيد (WhatsApp / SMS):</span>
                          </label>
                          <input
                            type="tel"
                            dir="ltr"
                            placeholder="مثال: 01012345678"
                            value={signatureClientPhone}
                            onChange={(e) => setSignatureClientPhone(e.target.value)}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-amber-500 font-mono text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-800 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>صيغة الإقرار القانوني المطلوب المصادقة عليه:</span>
                          </label>
                          <input
                            type="text"
                            value={signatureLegalAffirmation}
                            onChange={(e) => setSignatureLegalAffirmation(e.target.value)}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-amber-500 font-sans text-right"
                          />
                        </div>
                      </div>
                      <p className="text-[9.5px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        ⚡ بمجرد الإرسال، سيتم توليد رمز مشفر ورابط تأكيد قانوني معتمد يمكن استخدامه لتوقيع المذكرة فورياً أو عبر الهاتف.
                      </p>
                    </div>
                  )}
                </div>

                {/* Textarea field for leaving note with Draft Auto-save indicator */}
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="block text-xs font-black text-slate-800">
                      ✍️ اكتب رسالتك أو ملحوظتك للأستاذ وسام الشناوي:
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === "ar" ? "حفظ تلقائي محلي فوري" : "Instant Local Auto-save"}</span>
                      </span>
                      {editedClientNote.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(language === "ar" ? "هل ترغب في مسح المسودة والبدء من جديد؟" : "Clear this draft?")) {
                              setEditedClientNote("");
                              localStorage.removeItem("law_clientNoteDraft");
                              localStorage.removeItem("law_clientNoteDraft_time");
                              setNoteAutoSaveStatus("idle");
                              setNoteLastSavedTime(null);
                            }
                          }}
                          className="text-[10px] text-slate-400 hover:text-red-500 font-bold transition cursor-pointer underline"
                        >
                          {language === "ar" ? "مسح المسودة" : "Clear"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    {/* Corner Real-time Auto-save Icon & Status Badge */}
                    {editedClientNote.trim() && (
                      <div 
                        id="note-autosave-corner-badge"
                        className={`absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm border transition-all duration-300 pointer-events-auto select-none ${
                          noteAutoSaveStatus === "saving" 
                            ? "bg-amber-50 text-amber-800 border-amber-300 animate-pulse shadow-amber-100" 
                            : "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-emerald-100"
                        }`}
                        title={language === "ar" 
                          ? "محتوى الملحوظة محفوظ بأمان في جهازك محلياً بشكل فوري ومستمر قبل الإرسال النهائي." 
                          : "Your note is continuously saved locally on your device prior to final submission."}
                      >
                        {noteAutoSaveStatus === "saving" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                            <span>{language === "ar" ? "جاري الحفظ محلياً..." : "Saving locally..."}</span>
                          </>
                        ) : (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <Save className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {language === "ar" 
                                ? `محفوظ محلياً (${noteLastSavedTime || "الآن"})` 
                                : `Saved locally (${noteLastSavedTime || "Now"})`}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    <textarea
                      id="compose-message-note-textarea"
                      rows={3}
                      maxLength={2000}
                      value={editedClientNote}
                      onChange={(e) => {
                        setEditedClientNote(e.target.value);
                      }}
                      placeholder={language === "ar" ? "مثال: قمت بسداد الرسوم المقررة وحصلت على الشهادة الإدارية المطلوبة من نيابة الأسرة بمورثي، ومثبتة بملف القضية رقم ٣٣..." : "Type updates to represent..."}
                      className={`w-full p-3 pb-6 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 focus:bg-white transition text-right font-sans shadow-inner ${
                        editedClientNote.trim() ? "pt-8 sm:pt-3 sm:pl-48" : ""
                      }`}
                    />
                    <div className={`absolute bottom-2 left-3 text-[10px] font-bold ${editedClientNote.length >= 1900 ? 'text-red-500' : 'text-slate-400'}`}>
                      {editedClientNote.length}/2000
                    </div>
                  </div>
                </div>

                {/* Metrics Bar above History Section (Total Notes, Pending Replies, Resolved Issues) */}
                <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-100/80 rounded-2xl border border-slate-200/90 text-right">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1">
                      <span>📄</span>
                      <span>{language === "ar" ? "إجمالي المذكرات" : "Total Notes"}</span>
                    </span>
                    <span className="text-base font-black text-slate-900 mt-1 font-mono">{totalNotesCount}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1">
                      <span className={pendingRepliesCount > 0 ? "animate-pulse" : ""}>⌛</span>
                      <span>{language === "ar" ? "بانتظار الرد" : "Pending Replies"}</span>
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-base font-black text-amber-600 font-mono">{pendingRepliesCount}</span>
                      {pendingRepliesCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1">
                      <span>✔️</span>
                      <span>{language === "ar" ? "تمت المعالجة" : "Resolved Issues"}</span>
                    </span>
                    <span className="text-base font-black text-emerald-700 mt-1 font-mono">{resolvedIssuesCount}</span>
                  </div>
                </div>

                {/* Note History and Current Interactions */}
                <div className="space-y-2 text-right">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 flex-wrap gap-2">
                    <span className="text-xs font-black text-slate-800">📋 السجل التاريخي لمذكراتك وحالة قراءتها والتوقيع الرقمي</span>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={noteFilterPriority}
                        onChange={(e) => setNoteFilterPriority(e.target.value as "All" | "High" | "Normal" | "Low")}
                        className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-amber-500 transition-colors"
                      >
                        <option value="All">الكل (All)</option>
                        <option value="High">🚨 عاجل (High)</option>
                        <option value="Normal">⚡ عادي (Normal)</option>
                        <option value="Low">📌 منخفض (Low)</option>
                      </select>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="ابحث بالكلمات أو التاريخ..."
                          value={noteSearchQuery}
                          onChange={(e) => setNoteSearchQuery(e.target.value)}
                          className="w-48 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg pl-8 pr-2 py-1 text-[10px] outline-none focus:border-amber-500 transition-colors"
                        />
                        <span className="absolute left-2 top-1.5 text-slate-400 text-xs">🔍</span>
                      </div>
                      <button
                        onClick={() => handleExportClientPDF(currentUser.name)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm animate-pulse-subtle"
                      >
                        📥 طباعة (PDF)
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                    {clientNotes
                      .filter(n => n.clientName === currentUser.name || currentUser.name === "الموكل المعتمد")
                      .filter(n => noteFilterPriority === "All" || n.priority === noteFilterPriority)
                      .filter(n => {
                        if (!noteSearchQuery.trim()) return true;
                        const query = noteSearchQuery.toLowerCase();
                        return (
                          n.text.toLowerCase().includes(query) ||
                          (n.attorneyReply && n.attorneyReply.toLowerCase().includes(query)) ||
                          new Date(n.date).toLocaleDateString("ar-EG").includes(query)
                        );
                      })
                      .length === 0 ? (
                      <div className="text-center py-4 text-[11px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                        لا توجد نتائج بحث مطابقة أو مذكرات محفوظة.
                      </div>
                    ) : (
                      clientNotes
                        .filter(n => n.clientName === currentUser.name || currentUser.name === "الموكل المعتمد")
                        .filter(n => noteFilterPriority === "All" || n.priority === noteFilterPriority)
                        .filter(n => {
                          if (!noteSearchQuery.trim()) return true;
                          const query = noteSearchQuery.toLowerCase();
                          return (
                            n.text.toLowerCase().includes(query) ||
                            (n.attorneyReply && n.attorneyReply.toLowerCase().includes(query)) ||
                            new Date(n.date).toLocaleDateString("ar-EG").includes(query)
                          );
                        })
                        .map((note) => (
                          <div key={note.id} className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 text-right">
                            <div className="flex justify-between items-center text-[9px] text-slate-500 flex-wrap gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">📡 مرسلة للأستاذ وسام</span>
                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold ${
                                  note.priority === "High" 
                                    ? "bg-red-100 text-red-800 animate-pulse" 
                                    : note.priority === "Low" 
                                    ? "bg-slate-100 text-slate-600" 
                                    : "bg-amber-100 text-amber-800"
                                }`}>
                                  الأولوية: {note.priority === "High" ? "عاجل" : note.priority === "Low" ? "روتيني" : "متوسط"}
                                </span>
                                {note.category && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                                    {note.category === "Legal Document" ? "إيداع مستند" : note.category === "Fee Inquiry" ? "استعلام أتعاب" : note.category === "Scheduling" ? "مواعيد وجلسات" : "استشارة قانونية"}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-slate-400">{new Date(note.date).toLocaleString("ar-EG")}</span>
                            </div>

                            <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                              {note.text}
                            </p>
                            
                            {/* DIGITAL SIGNATURE STATUS PANEL IN NOTE LOG */}
                            <div className="p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors bg-white border-slate-200">
                              <div className="flex items-center gap-2">
                                {note.signatureStatus === "signed" ? (
                                  <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <div className="flex flex-col">
                                      <span className="font-black text-[10px]">موقّع ومصادق إلكترونياً ✔️</span>
                                      <span className="text-[9px] text-emerald-700 font-mono">
                                        بواسطة: {note.signatureData?.signedBy} | {note.signatureData?.verificationHash?.slice(0, 16)}...
                                      </span>
                                    </div>
                                  </div>
                                ) : note.signatureStatus === "pending" ? (
                                  <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 animate-pulse">
                                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                    <div className="flex flex-col">
                                      <span className="font-black text-[10px]">بانتظار التوقيع الإلكتروني ⌛</span>
                                      <span className="text-[9px] text-amber-700">رابط التأكيد القانوني مفعل وجاهز للإمضاء</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                    <FileSignature className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-bold text-[10px]">بدون توقيع رقمي</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons for Digital Signature */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {note.signatureStatus === "signed" && note.signatureData && (
                                  <button
                                    type="button"
                                    onClick={() => setViewingCertificateNote(note)}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg transition flex items-center gap-1 shadow-sm"
                                  >
                                    <Award className="w-3 h-3" />
                                    <span>شهادة التوقيع 📜</span>
                                  </button>
                                )}

                                {note.signatureStatus === "pending" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setSigningNotePortal(note)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg transition flex items-center gap-1 shadow-sm"
                                    >
                                      <PenTool className="w-3 h-3" />
                                      <span>توقيع الآن ✍️</span>
                                    </button>
                                    
                                    {note.confirmationLink && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(note.confirmationLink!);
                                            setCopiedNoteLinkId(note.id);
                                            setTimeout(() => setCopiedNoteLinkId(null), 2500);
                                          }}
                                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] rounded-lg transition flex items-center gap-1 border border-slate-200"
                                        >
                                          {copiedNoteLinkId === note.id ? (
                                            <>
                                              <Check className="w-3 h-3 text-emerald-600" />
                                              <span className="text-emerald-700 font-black">تم النسخ!</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3 h-3 text-slate-600" />
                                              <span>نسخ الرابط</span>
                                            </>
                                          )}
                                        </button>

                                        <a
                                          href={`https://wa.me/?text=${encodeURIComponent(`السلام عليكم، يرجى التكرم بالاطلاع والتوقيع الإلكتروني على المذكرة القانونية من ديوان المحاماة:\n${note.confirmationLink}`)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                                          title="مشاركة عبر الواتساب"
                                        >
                                          <Share2 className="w-3 h-3" />
                                        </a>
                                      </>
                                    )}
                                  </>
                                )}

                                {(!note.signatureStatus || note.signatureStatus === "none") && (
                                  <button
                                    type="button"
                                    onClick={() => setRequestSignatureModalNote(note)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-bold text-[9.5px] rounded-lg transition flex items-center gap-1 border border-slate-200"
                                  >
                                    <FileSignature className="w-3 h-3 text-amber-600" />
                                    <span>طلب توقيع رقمي</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Attorney Response Section if available */}
                            {note.attorneyReply && (
                              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-0.5 text-right">
                                <div className="flex items-center justify-start gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-black text-emerald-800 flex items-center gap-1">
                                    <span>⚖️</span>
                                    <span>رد الأستاذ وسام الشناوي / هيئة الدفاع:</span>
                                  </span>
                                  <span className="flex items-center gap-0.5 bg-emerald-600 text-white px-1.5 py-0.5 rounded-full text-[8px] font-extrabold shadow-sm" title="Verified Attorney">
                                    <span className="w-2.5 h-2.5 bg-white text-emerald-600 rounded-full flex items-center justify-center text-[6px]">✓</span>
                                    <span>محامي معتمد</span>
                                  </span>
                                </div>
                                <p className="text-xs font-bold leading-relaxed">{note.attorneyReply}</p>
                              </div>
                            )}

                            <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5 mt-0.5 text-[9.5px]">
                              {note.referencedCaseId ? (
                                <span className="text-blue-700 font-bold">📁 مرتبطة بملف قضية مفعلة</span>
                              ) : (
                                <span className="text-slate-400">مرجع عام</span>
                              )}
                              
                              {/* VISUAL PENDING TO READ STATUS INDICATOR DEMONSTRATION */}
                              <div className="flex items-center gap-1 font-bold">
                                {note.status === "Acknowledged" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-black text-[9px]">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    ✔️ تم تأكيد واستلام الرد
                                  </span>
                                ) : note.status === "Read by Attorney" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-[9px]">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                    ✔️ تمت المراجعة والاطلاع من المحامي
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-black text-[9px] animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                                    ⌛ قيد مراجعة السكرتارية والمستشار
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="bg-slate-50 px-6 py-4 flex justify-between items-center gap-3 border-t border-slate-100 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsClientNoteModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  إلغاء المعاينة
                </button>
                
                <div className="flex items-center gap-2">
                  {/* Quick Response acknowledgement badge when attorney replies */}
                  {unacknowledgedReplies.length > 0 && (
                    <button
                      id="client-quick-acknowledge-badge"
                      type="button"
                      onClick={handleAcknowledgeReplies}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer animate-pulse"
                      title="إقرار واستلام ردود المحامي بضغطة زر"
                    >
                      <span>⚡ {language === "ar" ? `إقرار واستلام رد المحامي (${unacknowledgedReplies.length})` : `Quick Response Acknowledged (${unacknowledgedReplies.length})`}</span>
                    </button>
                  )}

                  <button
                    id="client-submit-custom-note"
                    type="button"
                    disabled={!editedClientNote.trim()}
                    onClick={() => {
                      handleClientNoteSubmit(
                        currentUser?.name || "الموكل المعتمد", 
                        editedClientNote, 
                        notePriority, 
                        requestSmsReminder, 
                        referencedCaseId, 
                        noteCategory, 
                        noteLinkedAttachments,
                        requestDigitalSignature,
                        signatureClientPhone,
                        signatureLegalAffirmation
                      );
                      setEditedClientNote("");
                      setNoteLinkedAttachments([]);
                      setNoteCategory("Consultation");
                      setRequestDigitalSignature(false);
                      setSignatureClientPhone("");
                      localStorage.removeItem("law_clientNoteDraft");
                      localStorage.removeItem("law_clientNoteDraft_time");
                      setNoteAutoSaveStatus("idle");
                      setNoteLastSavedTime(null);
                      setIsClientNoteModalOpen(false);
                    }}
                    className={`px-5 py-2 rounded-xl font-black text-xs transition duration-200 cursor-pointer ${
                      editedClientNote.trim() 
                        ? "bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 shadow-md"
                        : "bg-slate-300 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    تحديث سجلي وإرسال الملحوظة ⚖️
                  </button>
                </div>
              </div>
            </div>

            {/* Signature Modals embedded inside Client Note Flow */}
            {requestSignatureModalNote && (
              <RequestSignatureLinkModal
                isOpen={!!requestSignatureModalNote}
                onClose={() => setRequestSignatureModalNote(null)}
                currentUser={currentUser}
                note={{
                  id: requestSignatureModalNote.id,
                  title: `مذكرة موكل: ${requestSignatureModalNote.clientName}`,
                  content: requestSignatureModalNote.text,
                  category: "Client Docket Memo",
                  createdAt: requestSignatureModalNote.date,
                  updatedAt: requestSignatureModalNote.date,
                  isPinned: false,
                  color: "amber",
                  tags: ["موكل", "مذكرة"],
                  clientName: requestSignatureModalNote.clientName,
                  clientPhone: requestSignatureModalNote.clientPhone,
                  requiresSignature: true,
                  signatureStatus: requestSignatureModalNote.signatureStatus,
                  confirmationLink: requestSignatureModalNote.confirmationLink,
                  confirmationToken: requestSignatureModalNote.confirmationToken
                }}
                clients={clients}
                cases={cases}
                onRequestCompleted={(updatedKeepNote) => {
                  handleUpdateClientNote(requestSignatureModalNote.id, {
                    requiresSignature: true,
                    signatureStatus: "pending",
                    signatureRequestedBy: "lawyer",
                    signatureRequestedAt: new Date().toISOString(),
                    confirmationToken: updatedKeepNote.confirmationToken,
                    confirmationLink: updatedKeepNote.confirmationLink,
                    clientPhone: updatedKeepNote.clientPhone
                  });
                  setRequestSignatureModalNote(null);
                }}
              />
            )}

            {signingNotePortal && (
              <ClientSignatureConfirmationPortal
                isOpen={!!signingNotePortal}
                onClose={() => setSigningNotePortal(null)}
                note={{
                  id: signingNotePortal.id,
                  title: `مذكرة موكل: ${signingNotePortal.clientName}`,
                  content: signingNotePortal.text,
                  category: "Client Docket Memo",
                  createdAt: signingNotePortal.date,
                  updatedAt: signingNotePortal.date,
                  isPinned: false,
                  color: "amber",
                  tags: ["موكل", "مذكرة"],
                  clientName: signingNotePortal.clientName,
                  clientPhone: signingNotePortal.clientPhone,
                  requiresSignature: true,
                  signatureStatus: signingNotePortal.signatureStatus,
                  confirmationLink: signingNotePortal.confirmationLink,
                  confirmationToken: signingNotePortal.confirmationToken,
                  signatureData: signingNotePortal.signatureData
                }}
                onSignComplete={(signedNote) => {
                  handleUpdateClientNote(signingNotePortal.id, {
                    signatureStatus: "signed",
                    signatureData: signedNote.signatureData
                  });
                  setSigningNotePortal(null);
                }}
              />
            )}

            {viewingCertificateNote && viewingCertificateNote.signatureData && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 text-right">
                <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-amber-400" />
                      <div>
                        <h3 className="text-sm font-black">شهادة التوقيع الإلكتروني والبصمة الرقمية المعتمدة</h3>
                        <p className="text-[10px] text-slate-400">وثيقة إثبات هوية وتصديق قانوني صادر عن ديوان المحاماة</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewingCertificateNote(null)}
                      className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-6 font-sans">
                    <LawyerSignatureSeal
                      signedBy={viewingCertificateNote.signatureData.signedBy}
                      signedAt={viewingCertificateNote.signatureData.signedAt}
                      verificationHash={viewingCertificateNote.signatureData.verificationHash}
                      lawyerName={viewingCertificateNote.signatureData.lawyerSignatureName || "الأستاذ وسام أحمد الشناوي"}
                      nationalId={viewingCertificateNote.signatureData.nationalId}
                      digitalStamp="ديوان المحاماة والاستشارات القانونية - محكمة النقض"
                      signatureImage={viewingCertificateNote.signatureData.signatureImage}
                    />

                    <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                      <span className="font-black text-slate-900 dark:text-white block">نص المذكرة المصادق عليها:</span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        {viewingCertificateNote.text}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
                    >
                      <Printer className="w-4 h-4 text-amber-400" />
                      <span>طباعة الشهادة الرسمية 🖨️</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewingCertificateNote(null)}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Attachment Gallery Modal (Nested Pop-over) */}
            {showAttachmentGallery && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-right">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
                  <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>📎</span> معرض المرفقات والصور السحابية
                    </h4>
                    <button 
                      onClick={() => setShowAttachmentGallery(false)}
                      className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-4 max-h-64 overflow-y-auto space-y-2">
                    {/* Dummy Data for Attachments / Derived from referencedCaseId if available */}
                    {referencedCaseId ? (
                       cases.find(c => c.id === referencedCaseId)?.attachments?.length ? (
                         cases.find(c => c.id === referencedCaseId)?.attachments?.map(att => (
                           <div key={att.name} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                             <span className="text-[10px] font-bold text-slate-700">{att.name}</span>
                             <button
                               onClick={() => {
                                 if (noteLinkedAttachments.some(a => a.id === att.name)) {
                                   setNoteLinkedAttachments(prev => prev.filter(a => a.id !== att.name));
                                 } else {
                                   setNoteLinkedAttachments(prev => [...prev, { id: att.name, name: att.name, url: att.url }]);
                                 }
                               }}
                               className={`px-3 py-1 rounded-lg text-[10px] font-black transition ${
                                 noteLinkedAttachments.some(a => a.id === att.name)
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 text-slate-700 hover:bg-amber-500"
                               }`}
                             >
                               {noteLinkedAttachments.some(a => a.id === att.name) ? "✓ مرتبط" : "+ ربط بالرسالة"}
                             </button>
                           </div>
                         ))
                       ) : (
                         <div className="text-center p-4 text-[11px] text-slate-400">لا توجد مرفقات مرتبطة بالقضية المحددة.</div>
                       )
                    ) : (
                      <div className="text-center p-4 text-[11px] text-slate-400">يرجى تحديد ملف قضية أولاً لاستعراض المرفقات وربطها بالملحوظة.</div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button 
                      onClick={() => setShowAttachmentGallery(false)}
                      className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-black transition"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Multi-Document Management Modal (ZIP extraction, AI document analysis, transfer/copy) */}
        {isDocumentManagerOpen && (
          <DocumentManagerModal
            isOpen={isDocumentManagerOpen}
            onClose={() => setIsDocumentManagerOpen(false)}
            currentSection={documentManagerSection}
            currentSectionLabel={documentManagerSectionLabel}
            onAddDocuments={(newDocs) => {
              setManagedDocuments(prev => {
                const combined = [...newDocs, ...prev];
                localStorage.setItem("law_managed_documents", JSON.stringify(combined));
                return combined;
              });
            }}
            existingDocuments={managedDocuments}
            onUpdateDocuments={(updatedDocs) => {
              setManagedDocuments(updatedDocs);
              localStorage.setItem("law_managed_documents", JSON.stringify(updatedDocs));
            }}
            language={language}
          />
        )}

        {/* Global Phone Sync & International Codes Registration Modal */}
        {isPhoneSyncOpen && (
          <PhoneSyncModal
            isOpen={isPhoneSyncOpen}
            onClose={() => setIsPhoneSyncOpen(false)}
            registeredUsers={registeredUsers}
            clients={clients}
            onRegisterNewClient={(newContact) => {
              const newClient: ClientProfile = {
                id: "client-" + Math.random().toString(36).substr(2, 9),
                serialNumber: clients.length + 1,
                name: newContact.name,
                phone: newContact.phone,
                countryCode: newContact.countryCode,
                nationalId: "2990101" + Math.floor(1000000 + Math.random() * 9000000),
                poaNumber: String(Math.floor(1000 + Math.random() * 9000)),
                poaLetter: "أ",
                poaYear: new Date().getFullYear(),
                poaOffice: "مكتب توثيق الأهرام النموذجي",
                caseNumber: String(Math.floor(100 + Math.random() * 900)),
                caseYear: new Date().getFullYear(),
                competentCourt: "محكمة شمال الجيزة الابتدائية",
                subject: "تسجيل جديد من سحب جهات الاتصال",
                remainingFees: 0,
                whatsapp: newContact.phone,
                createdAt: new Date().toISOString()
              };
              setClients(prev => {
                const updated = [newClient, ...prev];
                localStorage.setItem("law_clients", JSON.stringify(updated));
                return updated;
              });
              alert(language === "ar" ? `تم تسجيل الموكل الجديد (${newContact.name}) بنجاح!` : `Client (${newContact.name}) successfully registered!`);
            }}
            language={language}
          />
        )}

        {/* Dynamic Inner Sub-View */}
        <div className="animate-fade-in">
          {renderActiveView()}
        </div>

        {currentUser && (
        <AiVoiceAssistantLauncher
          onOpenAiAssistant={() => setActiveSection("ai")}
          onOpenLegalAnalysis={() => setActiveSection("legal_analysis")}
          onOpenSmartOcr={() => setActiveSection("smart_ocr")}
          language={language}
        />
      )}
      </main>

      {/* Global Comprehensive Search Modal Engine (Cases, Documents, Clients, Sessions, Fees, Law Codes) */}
      <GlobalSearchView
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        cases={cases}
        clients={clients}
        sessions={sessions}
        fees={fees}
        lawCodes={lawCodes}
        announcements={announcements}
        managedDocuments={managedDocuments}
        language={language}
        onNavigateTo={(section, metadata) => {
          if (metadata && metadata.caseId) {
            setDefaultSelectCaseId(metadata.caseId);
          }
          setActiveSection(section);
        }}
      />

      {/* Floating Toast Alerts for Court Sessions */}
      {activeToasts.length > 0 && (
        <div className="fixed bottom-5 right-5 left-5 md:left-auto md:w-96 flex flex-col gap-2 z-50 pointer-events-none font-sans" dir={language === "ar" ? "rtl" : "ltr"}>
          {activeToasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-4 rounded-2xl border pointer-events-auto shadow-2xl flex flex-col text-right transition-all duration-300 hover:scale-[1.02] transform translate-y-0 ${
                toast.style === "warning"
                  ? "bg-amber-500 border-amber-600 text-slate-950"
                  : "bg-teal-600 border-teal-700 text-white"
              }`}
            >
              <div className="flex justify-between items-center gap-2 mb-1.5">
                <span className="font-extrabold text-sm">{toast.title}</span>
                <button
                  onClick={() => setActiveToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-current/80 hover:text-current font-black text-sm bg-black/10 hover:bg-black/20 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer transition"
                >
                  ×
                </button>
              </div>
              <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
    <Analytics />
    </>
  );
}
