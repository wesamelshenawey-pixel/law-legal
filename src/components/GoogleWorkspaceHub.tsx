import React, { useState, useEffect } from "react";
import { PlatformUser, CaseRecord, ClientProfile, SessionRecord, UserRole } from "../types";
import {
  getStoredWorkspaceToken,
  requestWorkspaceAuth,
  clearWorkspaceToken,
  fetchGmailMessages,
  sendGmailEmail,
  fetchChatSpaces,
  fetchChatMessages,
  sendChatMessage,
  createGoogleSpreadsheet,
  fetchUserSpreadsheets,
  readSpreadsheetValues,
  createGoogleMeeting,
  getLocalKeepMemos,
  saveLocalKeepMemo,
  deleteLocalKeepMemo,
  signLocalKeepMemo,
  requestSignatureForKeepMemo,
  GmailMessage,
  ChatSpace,
  ChatMessage,
  WorkspaceTokenState,
  GoogleDriveFile,
  GoogleMeetRoom,
  GoogleKeepNote
} from "../utils/workspaceService";
import ElectronicSignatureModal from "./ElectronicSignatureModal";
import RequestSignatureLinkModal from "./RequestSignatureLinkModal";
import ClientSignatureConfirmationPortal from "./ClientSignatureConfirmationPortal";
import {
  Mail,
  MessageSquare,
  Send,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Calendar,
  Lock,
  FileSpreadsheet,
  Video,
  Bookmark,
  Share2,
  Copy,
  Check,
  Plus,
  Trash2,
  Download,
  Sparkles,
  FileCheck2,
  ShieldCheck,
  PenTool,
  Award,
  Filter,
  UserCheck,
  Clock,
  SendHorizontal,
  Link2,
  History
} from "lucide-react";

interface GoogleWorkspaceHubProps {
  currentUser: PlatformUser;
  cases: CaseRecord[];
  clients: ClientProfile[];
  sessions: SessionRecord[];
  language: "ar" | "en";
  initialTab?: "sheets" | "meet" | "keep" | "gmail" | "chat";
}

export default function GoogleWorkspaceHub({
  currentUser,
  cases,
  clients,
  sessions,
  language = "ar",
  initialTab = "sheets"
}: GoogleWorkspaceHubProps) {
  const [tokenState, setTokenState] = useState<WorkspaceTokenState>(getStoredWorkspaceToken());
  const [activeSubTab, setActiveSubTab] = useState<"sheets" | "meet" | "keep" | "gmail" | "chat">(initialTab);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Google Sheets State
  const [userSheets, setUserSheets] = useState<GoogleDriveFile[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [isExportingSheet, setIsExportingSheet] = useState(false);
  const [lastExportedUrl, setLastExportedUrl] = useState<string | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [sheetPreviewRows, setSheetPreviewRows] = useState<string[][]>([]);
  const [isLoadingSheetPreview, setIsLoadingSheetPreview] = useState(false);

  // 2. Google Meet State
  const [activeMeetRoom, setActiveMeetRoom] = useState<GoogleMeetRoom | null>(null);
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [meetTopic, setMeetTopic] = useState("استشارة قانونية مرئية - مكتب الأستاذ المحامي");
  const [selectedCaseForMeet, setSelectedCaseForMeet] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [meetHistory, setMeetHistory] = useState<GoogleMeetRoom[]>(() => {
    try {
      const saved = localStorage.getItem("wesam_meet_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. Google Keep State
  const [keepNotes, setKeepNotes] = useState<GoogleKeepNote[]>(getLocalKeepMemos());
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTag, setNewNoteTag] = useState("مذكرة قضائية");
  const [keepSearch, setKeepSearch] = useState("");
  const [requireSignatureOnNewNote, setRequireSignatureOnNewNote] = useState(false);
  const [selectedClientForNote, setSelectedClientForNote] = useState("");
  const [selectedCaseForNote, setSelectedCaseForNote] = useState("");
  const [customAffirmation, setCustomAffirmation] = useState("");
  const [filterSignatureStatus, setFilterSignatureStatus] = useState<"all" | "requires_sig" | "pending" | "signed">("all");
  const [selectedNoteForSignature, setSelectedNoteForSignature] = useState<GoogleKeepNote | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [selectedNoteForRequestLink, setSelectedNoteForRequestLink] = useState<GoogleKeepNote | null>(null);
  const [isRequestLinkModalOpen, setIsRequestLinkModalOpen] = useState(false);
  const [selectedNoteForClientPortal, setSelectedNoteForClientPortal] = useState<GoogleKeepNote | null>(null);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Check URL parameters for direct link signing (?action=sign_memo&memoId=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      const memoId = params.get("memoId");
      if (action === "sign_memo" && memoId) {
        const targetNote = keepNotes.find(n => n.id === memoId);
        if (targetNote) {
          setSelectedNoteForClientPortal(targetNote);
          setIsClientPortalOpen(true);
        }
      }
    } catch {
      // url param check fallback
    }
  }, [keepNotes]);

  // 4. Gmail State
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [gmailSearch, setGmailSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState<string | null>(null);

  // 5. Google Chat State
  const [chatSpaces, setChatSpaces] = useState<ChatSpace[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<ChatSpace | null>(null);
  const [spaceMessages, setSpaceMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newChatText, setNewChatText] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [selectedCaseToShare, setSelectedCaseToShare] = useState<string>("");

  const isConnected = !!tokenState.accessToken;

  // On mount or when token is updated, load initial tab data
  useEffect(() => {
    if (tokenState.accessToken) {
      if (activeSubTab === "sheets") {
        loadUserSheets();
      } else if (activeSubTab === "gmail") {
        loadGmail();
      } else if (activeSubTab === "chat") {
        loadChatSpaces();
      }
    }
  }, [tokenState.accessToken, activeSubTab]);

  const handleConnect = () => {
    setIsAuthenticating(true);
    setAuthError(null);
    requestWorkspaceAuth(
      (newTokens) => {
        setTokenState(newTokens);
        setIsAuthenticating(false);
      },
      (err) => {
        setIsAuthenticating(false);
        setAuthError("تعذر إتمام تسجيل الدخول إلى Google Workspace. يرجى التحقق من أذونات المتصفح.");
      }
    );
  };

  const handleDisconnect = () => {
    clearWorkspaceToken();
    setTokenState({ accessToken: null, expiresAt: null, userEmail: null, userName: null });
    setGmailMessages([]);
    setChatSpaces([]);
    setUserSheets([]);
    setSelectedEmail(null);
    setSelectedSpace(null);
  };

  // ==========================================
  // GOOGLE SHEETS ACTIONS
  // ==========================================
  const loadUserSheets = async () => {
    if (!tokenState.accessToken) return;
    setIsLoadingSheets(true);
    try {
      const sheets = await fetchUserSpreadsheets(tokenState.accessToken);
      setUserSheets(sheets);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleExportFullLegalLedger = async () => {
    if (!tokenState.accessToken) {
      handleConnect();
      return;
    }
    setIsExportingSheet(true);
    setLastExportedUrl(null);
    try {
      const nowStr = new Date().toLocaleDateString("ar-EG");
      const title = `سجل مكتب الأستاذ المحامي القضائي الشامل - ${nowStr}`;

      // Cases Sheet Data
      const casesHeader = ["م", "رقم الدعوى", "السنة", "المحكمة المختصة", "نوع المحكمة", "الموضوع", "الموكل", "صفة الموكل", "الخصم المقابل", "الجلسة القادمة", "تاريخ القيد"];
      const casesRows = cases.map((c, idx) => [
        idx + 1,
        c.caseNumber,
        c.caseYear,
        c.competentCourt,
        c.courtType || "مدني / جنائي",
        c.subject,
        c.clientName,
        c.clientRole,
        c.opponentName,
        c.nextSessionDate || "لم تحدد",
        c.createdAt || ""
      ]);

      // Clients Sheet Data
      const clientsHeader = ["م", "اسم الموكل", "الرقم القومي", "رقم الهاتف", "رقم التوكيل", "مكتب التوثيق", "العنوان", "الأتعاب المتبقية", "تاريخ التسجيل"];
      const clientsRows = clients.map((cl, idx) => [
        idx + 1,
        cl.name,
        cl.nationalId,
        cl.phone || "",
        `${cl.poaNumber || ""} لسنة ${cl.poaYear || ""}`,
        cl.poaOffice || "توثيق الأهرام",
        cl.address || "جمهورية مصر العربية",
        cl.remainingFees || 0,
        cl.createdAt || ""
      ]);

      // Sessions Sheet Data
      const sessionsHeader = ["م", "تاريخ الجلسة", "رقم القضية", "المحكمة", "الدائرة", "الموكل", "الخصم", "الموضوع والتفاصيل", "الفترة"];
      const sessionsRows = sessions.map((s, idx) => [
        idx + 1,
        s.date || "",
        s.caseInfo?.caseNumber ? `${s.caseInfo.caseNumber} لسنة ${s.caseInfo.caseYear || ""}` : "",
        s.caseInfo?.competentCourt || "",
        s.caseInfo?.circuit || "الدائرة الأولى",
        s.caseInfo?.clientName || "",
        s.caseInfo?.opponentName || "",
        s.caseInfo?.subject || "",
        s.timeType === "morning" ? "صباحية (9:00 ص)" : "مسائية (12:00 م)"
      ]);

      const result = await createGoogleSpreadsheet(tokenState.accessToken, title, [
        { title: "سجل القضايا والدعاوى", rows: [casesHeader, ...casesRows] },
        { title: "سجل الموكلين وجهات الاتصال", rows: [clientsHeader, ...clientsRows] },
        { title: "أجندة الجلسات القضائية", rows: [sessionsHeader, ...sessionsRows] }
      ]);

      setLastExportedUrl(result.spreadsheetUrl);
      loadUserSheets();
    } catch (err: any) {
      alert("فشل إنشاء جدول Google Sheets: " + (err.message || err));
    } finally {
      setIsExportingSheet(false);
    }
  };

  const handlePreviewSheet = async (sheetId: string) => {
    if (!tokenState.accessToken) return;
    setSelectedSheetId(sheetId);
    setIsLoadingSheetPreview(true);
    try {
      const rows = await readSpreadsheetValues(tokenState.accessToken, sheetId, "A1:G15");
      setSheetPreviewRows(rows);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSheetPreview(false);
    }
  };

  // ==========================================
  // GOOGLE MEET ACTIONS
  // ==========================================
  const handleCreateMeetRoom = async () => {
    if (!tokenState.accessToken) {
      handleConnect();
      return;
    }
    setIsCreatingMeet(true);
    try {
      let finalSummary = meetTopic;
      if (selectedCaseForMeet) {
        const cs = cases.find(c => c.id === selectedCaseForMeet);
        if (cs) {
          finalSummary = `استشارة قضائية: القضية رقم ${cs.caseNumber} (${cs.clientName} ضد ${cs.opponentName})`;
        }
      }

      const room = await createGoogleMeeting(tokenState.accessToken, finalSummary);
      setActiveMeetRoom(room);
      const updatedHistory = [room, ...meetHistory.filter(r => r.meetingCode !== room.meetingCode)];
      setMeetHistory(updatedHistory);
      localStorage.setItem("wesam_meet_history", JSON.stringify(updatedHistory));
    } catch (err: any) {
      alert("فشل إنشاء غرفة Google Meet: " + (err.message || err));
    } finally {
      setIsCreatingMeet(false);
    }
  };

  const handleCopyMeetLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareViaWhatsApp = (url: string, title: string) => {
    const text = encodeURIComponent(`🏛️ *دعوة لحضور استشارة قانونية مرئية عبر Google Meet*
من مكتب الأستاذ المحامي المحامي بالنقض
📌 الموضوع: ${title}
🔗 رابط الانضمام المباشر: ${url}
نتطلع لمقابلتكم.`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // ==========================================
  // GOOGLE KEEP & ELECTRONIC SIGNATURE ACTIONS
  // ==========================================
  const handleAddKeepNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    let targetClientName = "";
    let targetClientPhone = "";
    let targetClientId = "";

    if (selectedClientForNote) {
      const foundCl = clients.find(c => c.id === selectedClientForNote || c.name === selectedClientForNote);
      if (foundCl) {
        targetClientName = foundCl.name;
        targetClientPhone = foundCl.phone || "";
        targetClientId = foundCl.id;
      } else {
        targetClientName = selectedClientForNote;
      }
    } else if (currentUser.role === UserRole.CLIENT) {
      targetClientName = currentUser.name;
      targetClientPhone = currentUser.phone;
      targetClientId = currentUser.id;
    }

    const added = saveLocalKeepMemo({
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      tags: [newNoteTag],
      pinned: false,
      requiresSignature: requireSignatureOnNewNote,
      signatureRequestedBy: currentUser.role === UserRole.CLIENT ? "client" : "lawyer",
      clientId: targetClientId || undefined,
      clientName: targetClientName || undefined,
      clientPhone: targetClientPhone || undefined,
      caseNumber: selectedCaseForNote || undefined,
      legalAffirmation: customAffirmation.trim() || undefined,
      signatureStatus: requireSignatureOnNewNote ? "pending" : "none"
    });

    setKeepNotes([added, ...keepNotes.filter(n => n.id !== added.id)]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setRequireSignatureOnNewNote(false);
    setSelectedClientForNote("");
    setSelectedCaseForNote("");
    setCustomAffirmation("");

    setSuccessToast(
      requireSignatureOnNewNote
        ? "تم حفظ المذكرة وإرسال طلب التوقيع والتأكيد الإلكتروني للموكل بنجاح!"
        : "تم حفظ المذكرة بنجاح في Google Keep!"
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleDeleteKeepNote = (id: string) => {
    deleteLocalKeepMemo(id);
    setKeepNotes(keepNotes.filter(n => n.id !== id));
  };

  const handleOpenSignatureModal = (note: GoogleKeepNote) => {
    setSelectedNoteForSignature(note);
    setIsSignatureModalOpen(true);
  };

  const handleOpenRequestSignatureModal = (note: GoogleKeepNote) => {
    setSelectedNoteForRequestLink(note);
    setIsRequestLinkModalOpen(true);
  };

  const handleOpenClientPortal = (note: GoogleKeepNote) => {
    setSelectedNoteForClientPortal(note);
    setIsClientPortalOpen(true);
  };

  const handleSignCompleted = (signedNote: GoogleKeepNote) => {
    setKeepNotes(keepNotes.map(n => n.id === signedNote.id ? signedNote : n));
    setSelectedNoteForSignature(signedNote);
    setSelectedNoteForClientPortal(signedNote);
    setSuccessToast("تم اعتماد التوقيع الإلكتروني وتوثيقه قانونياً وتحديث حالة الملحوظة بنجاح!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleRequestSignatureCompleted = (updatedNote: GoogleKeepNote) => {
    setKeepNotes(keepNotes.map(n => n.id === updatedNote.id ? updatedNote : n));
    setSuccessToast(`تم تفعيل وحفظ طلب التوقيع الرقمي للموكل: ${updatedNote.clientName || "الموكل"}`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleCopyConfirmationLink = (note: GoogleKeepNote) => {
    const link = note.confirmationLink || window.location.origin + window.location.pathname + `?action=sign_memo&memoId=${note.id}`;
    navigator.clipboard.writeText(link);
    setSuccessToast("تم نسخ رابط التأكيد القانوني للموكل إلى الحافظة!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleQuickRequestSignature = (note: GoogleKeepNote) => {
    handleOpenRequestSignatureModal(note);
  };

  const handleShareSignatureLinkWhatsApp = (note: GoogleKeepNote) => {
    const clientName = note.clientName || "الموكل الفاضل";
    const title = note.title;
    const link = note.confirmationLink || window.location.origin + window.location.pathname + `?action=sign_memo&memoId=${note.id}`;
    const text = encodeURIComponent(`🏛️ *طلب توقيع وتأكيد إلكتروني قانوني عاجل*
من: مكتب الأستاذ المحامي المحامي بالنقض والدستورية العليا
إلى: ${clientName}
📌 موضوع الملحوظة / الإقرار: "${title}"
🔗 رابط الاعتماد والتوقيع الرقمي:
${link}

⚖️ يرجى فتح الرابط ووضع توقيعكم وبصمتكم لاعتماده قانونياً وتقديمه لملف الدعوى.`);
    window.open(`https://wa.me/${note.clientPhone ? note.clientPhone.replace(/\D/g, '') : ''}?text=${text}`, "_blank");
  };

  // ==========================================
  // GMAIL & CHAT ACTIONS
  // ==========================================
  const loadGmail = async () => {
    if (!tokenState.accessToken) return;
    setIsLoadingGmail(true);
    try {
      const msgs = await fetchGmailMessages(tokenState.accessToken, 15, gmailSearch);
      setGmailMessages(msgs);
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("401") || err?.message?.includes("UNAUTHENTICATED")) {
        handleDisconnect();
      }
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const loadChatSpaces = async () => {
    if (!tokenState.accessToken) return;
    setIsLoadingSpaces(true);
    try {
      const spaces = await fetchChatSpaces(tokenState.accessToken);
      setChatSpaces(spaces);
      if (spaces.length > 0 && !selectedSpace) {
        handleSelectSpace(spaces[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const handleSelectSpace = async (space: ChatSpace) => {
    setSelectedSpace(space);
    if (!tokenState.accessToken) return;
    setIsLoadingMessages(true);
    try {
      const msgs = await fetchChatMessages(tokenState.accessToken, space.name);
      setSpaceMessages(msgs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenState.accessToken || !composeTo || !composeSubject) return;
    setIsSendingEmail(true);
    setEmailSendStatus(null);
    try {
      const formattedHtml = `
        <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.7; color: #1e293b; padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="border-bottom: 2px solid #d97706; padding-bottom: 10px; margin-bottom: 15px;">
            <h3 style="color: #78350f; margin: 0;">مكتب الأستاذ المحامي المحامي بالنقض</h3>
            <p style="font-size: 12px; color: #64748b; margin: 3px 0 0 0;">إشعار قضائي رسمي ورسالة إلكترونية موثقة</p>
          </div>
          <div style="font-size: 14px; white-space: pre-line;">
            ${composeBody}
          </div>
          <div style="margin-top: 25px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            تم إرسال هذا البريد عبر المنظومة السحابية المعتمدة لمكتب الأستاذ المحامي - هاتف: 01283233555
          </div>
        </div>
      `;

      await sendGmailEmail(tokenState.accessToken, {
        to: composeTo,
        subject: composeSubject,
        bodyHtml: formattedHtml
      });

      setEmailSendStatus("تم إرسال البريد الإلكتروني بنجاح عبر حساب Gmail!");
      setTimeout(() => {
        setShowComposeModal(false);
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        setEmailSendStatus(null);
        loadGmail();
      }, 1800);
    } catch (err: any) {
      setEmailSendStatus("خطأ: " + (err.message || "تعذر إرسال الرسالة"));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenState.accessToken || !selectedSpace || !newChatText.trim()) return;
    setIsSendingChat(true);
    try {
      await sendChatMessage(tokenState.accessToken, selectedSpace.name, newChatText.trim());
      setNewChatText("");
      handleSelectSpace(selectedSpace);
    } catch (err) {
      console.error(err);
      alert("فشل إرسال الرسالة إلى مساحة Google Chat.");
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* Top Action & SubTabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* 1. Google Sheets Tab */}
          <button
            id="tab-google-sheets"
            onClick={() => setActiveSubTab("sheets")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "sheets"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>جداول Google Sheets</span>
          </button>

          {/* 2. Google Meet Tab */}
          <button
            id="tab-google-meet"
            onClick={() => setActiveSubTab("meet")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "meet"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Video className="w-4 h-4 text-blue-300" />
            <span>غرف Google Meet</span>
          </button>

          {/* 3. Google Keep Tab */}
          <button
            id="tab-google-keep"
            onClick={() => setActiveSubTab("keep")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "keep"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-700 dark:text-amber-950" />
            <span>ملاحظات Google Keep</span>
          </button>

          {/* 4. Gmail Tab */}
          <button
            id="tab-gmail"
            onClick={() => setActiveSubTab("gmail")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "gmail"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>بريد Gmail القضائي</span>
            {gmailMessages.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
                {gmailMessages.length}
              </span>
            )}
          </button>

          {/* 5. Google Chat Tab */}
          <button
            id="tab-google-chat"
            onClick={() => setActiveSubTab("chat")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "chat"
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>مساحات Google Chat</span>
          </button>
        </div>

        {/* Connection Status & Trigger */}
        <div className="flex items-center gap-2.5">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                <span>Google متصل: {tokenState.userEmail}</span>
              </span>
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
              >
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isAuthenticating}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isAuthenticating ? "جارٍ الربط..." : "ربط منظومة Google Workspace"}</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. GOOGLE SHEETS TAB VIEW                                */}
      {/* ======================================================== */}
      {activeSubTab === "sheets" && (
        <div className="space-y-6">
          {/* Top Quick Actions Banner */}
          <div className="p-6 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl border border-emerald-700/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-black">المزامنة الشاملة مع Google Sheets</h3>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                أنشئ دفاتر وجداول إكسل سحابية مباشرة على حساب Google Drive الخاص بك تضم كافة القضايا ({cases.length}) والموكلين ({clients.length}) والجلسات ({sessions.length}) بتنسيق عربي RTL جاهز للطباعة والمشاركة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportFullLegalLedger}
                disabled={isExportingSheet}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingSheet ? "جارٍ إنشاء الجدول وتصديره..." : "تصدير السجل القضائي الشامل إلى Google Sheets"}</span>
              </button>

              <button
                onClick={loadUserSheets}
                disabled={isLoadingSheets || !isConnected}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition cursor-pointer"
                title="تحديث قائمة الجداول"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingSheets ? "animate-spin text-emerald-400" : ""}`} />
              </button>
            </div>
          </div>

          {lastExportedUrl && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>تم إنشاء جدول Google Sheets بنجاح على حسابك السحابي!</span>
              </div>
              <a
                href={lastExportedUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <span>فتح الجدول في Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* User Sheets on Google Drive */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>جداول Google Sheets المسجلة على حسابك</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Drive</span>
              </h4>

              {!isConnected ? (
                <div className="p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>قم بربط حساب Google لعرض جداول بيانات المكتب وقراءة سجلات القضايا.</p>
                  <button
                    onClick={handleConnect}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    تسجيل الدخول لـ Google Drive & Sheets
                  </button>
                </div>
              ) : isLoadingSheets ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-500" />
                  <p>جارٍ جلب جداول Google Sheets من حسابك...</p>
                </div>
              ) : userSheets.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                  <p>لا توجد جداول Google Sheets مكتشفة حالياً في حسابك.</p>
                  <button
                    onClick={handleExportFullLegalLedger}
                    className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    إنشاء أول جدول الآن
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {userSheets.map((sheet) => (
                    <div
                      key={sheet.id}
                      onClick={() => handlePreviewSheet(sheet.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-right space-y-1 ${
                        selectedSheetId === sheet.id
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-750 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                          {sheet.name}
                        </span>
                        {sheet.webViewLink && (
                          <a
                            href={sheet.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-600 hover:text-emerald-700 p-1"
                            title="فتح في علامة تبويب جديدة"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        آخر تعديل: {sheet.modifiedTime ? new Date(sheet.modifiedTime).toLocaleDateString("ar-EG") : "حديثاً"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sheet Preview Area */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 min-h-[400px]">
              <h4 className="text-xs font-black text-slate-900 dark:text-white mb-3 flex items-center justify-between">
                <span>معاينة بيانات الجدول السحابي (Live Preview)</span>
                {selectedSheetId && (
                  <button
                    onClick={() => handlePreviewSheet(selectedSheetId)}
                    className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer"
                  >
                    تحديث المعاينة
                  </button>
                )}
              </h4>

              {isLoadingSheetPreview ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                  <p>جارٍ قراءة صفوف وخلايا الجدول عبر Sheets API...</p>
                </div>
              ) : sheetPreviewRows.length > 0 ? (
                <div className="overflow-x-auto max-h-[420px] rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-right text-xs border-collapse font-sans">
                    <tbody>
                      {sheetPreviewRows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={rIdx === 0 ? "bg-emerald-600 text-white font-black" : "border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"}
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2.5 border-l border-slate-200/40 dark:border-slate-700/40 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-2">
                  <FileSpreadsheet className="w-12 h-12 text-slate-300" />
                  <p className="text-xs">اختر جدولاً من القائمة الجانبية لقراءة ومطابقة بياناته مباشرة.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. GOOGLE MEET TAB VIEW                                  */}
      {/* ======================================================== */}
      {activeSubTab === "meet" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Meet Room Generator Form */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">إنشاء غرفة استشارة قانونية (Google Meet)</h3>
                  <p className="text-[11px] text-slate-400">جلسات تشاور مرئية مؤمنة وفورية مع الموكلين وهيئات الدفاع</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان وموضوع جلسة التشاور:
                  </label>
                  <input
                    type="text"
                    value={meetTopic}
                    onChange={(e) => setMeetTopic(e.target.value)}
                    placeholder="جلسة استشارة ومراجعة أدلة الاستئناف..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-blue-500 text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ربط الجلسة بملف قضية محدد (اختياري):
                  </label>
                  <select
                    value={selectedCaseForMeet}
                    onChange={(e) => setSelectedCaseForMeet(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none text-right"
                  >
                    <option value="">-- جلسة عامة بدون ملف محدد --</option>
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>
                        دعوى رقم {c.caseNumber} لسنة {c.caseYear} - ({c.clientName})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateMeetRoom}
                  disabled={isCreatingMeet}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <Video className="w-4 h-4" />
                  <span>{isCreatingMeet ? "جارٍ توليد الغرفة وتجهيز الرابط..." : "توليد رابط Google Meet الفوري الآن"}</span>
                </button>
              </div>

              {/* Active Created Room Card */}
              {activeMeetRoom && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                      <span>الغرفة المرئية جاهزة للبدء:</span>
                    </span>
                    <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-md">
                      {activeMeetRoom.meetingCode}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">{activeMeetRoom.summary}</p>
                  
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] font-mono text-blue-600 dark:text-blue-400 break-all select-all text-center">
                    {activeMeetRoom.meetingUri}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={activeMeetRoom.meetingUri}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-xl font-black text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>دخول الغرفة</span>
                    </a>

                    <button
                      onClick={() => handleCopyMeetLink(activeMeetRoom.meetingUri)}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-center rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? "تم النسخ!" : "نسخ الرابط"}</span>
                    </button>

                    <button
                      onClick={() => handleShareViaWhatsApp(activeMeetRoom.meetingUri, activeMeetRoom.summary)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white text-center rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>واتساب للموكل</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Meet History Column */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>سجل غرف واستشارات Google Meet المنعقدة</span>
              </h4>

              {meetHistory.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <Video className="w-10 h-10 text-slate-300 mx-auto" />
                  <p>لم يتم إنشاء غرف Google Meet بعد. ابدأ أول جلسة تشاور الآن!</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {meetHistory.map((room, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 text-right space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-900 dark:text-slate-100">{room.summary}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(room.createdAt).toLocaleDateString("ar-EG")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-mono text-[10px] truncate max-w-[220px]">
                          {room.meetingUri}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyMeetLink(room.meetingUri)}
                            className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-slate-950 rounded-lg transition"
                            title="نسخ الرابط"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <a
                            href={room.meetingUri}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                          >
                            <span>فتح</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 left-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-amber-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. GOOGLE KEEP & ELECTRONIC SIGNATURE TAB VIEW            */}
      {/* ======================================================== */}
      {activeSubTab === "keep" && (
        <div className="space-y-6">
          
          {/* Top Summary & Filter Statistics Bar */}
          <div className="p-5 bg-gradient-to-r from-amber-900 via-slate-900 to-slate-900 text-white rounded-3xl border border-amber-700/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black">منظومة مذكرات وملاحظات Google Keep والتوقيع الإلكتروني</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  قانون التوقيع الإلكتروني رقم 15 لسنة 2004
                </span>
              </div>
              <p className="text-xs text-amber-100/80 leading-relaxed">
                تدوين المذكرات والملحوظات القانونية مع إمكانية طلب <strong>توقيع وتأكيد إلكتروني ملزم</strong> من الموكل، ومتابعة حالة التوقيع الرقمي، واستخراج شهادات التوثيق القضائية.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 text-xs">
              <div className="bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 text-center">
                <span className="block text-[10px] text-slate-300">إجمالي الملاحظات</span>
                <span className="font-mono font-black text-white text-sm">{keepNotes.length}</span>
              </div>

              <div className="bg-amber-500/20 px-3.5 py-2 rounded-2xl border border-amber-500/30 text-center">
                <span className="block text-[10px] text-amber-200">بانتظار توقيع الموكل</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {keepNotes.filter(n => n.requiresSignature && n.signatureStatus === "pending").length}
                </span>
              </div>

              <div className="bg-emerald-500/20 px-3.5 py-2 rounded-2xl border border-emerald-500/30 text-center">
                <span className="block text-[10px] text-emerald-200">موقعة ومعتمدة</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {keepNotes.filter(n => n.signatureStatus === "signed").length}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Create Memo Form with E-Signature Checkbox */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span>تدوين ملاحظة / طلب تأكيد قانوني</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Google Keep</span>
              </div>

              <form onSubmit={handleAddKeepNote} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان الملحوظة / الإقرار:
                  </label>
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="إقرار استلام مستندات / موافقة على الصلح..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-amber-500 text-right font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    التصنيف القضائي:
                  </label>
                  <select
                    value={newNoteTag}
                    onChange={(e) => setNewNoteTag(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none text-right"
                  >
                    <option value="تأكيد قانوني وتوقيع">تأكيد قانوني وتوقيع إلكتروني</option>
                    <option value="مذكرة قضائية">مذكرة قضائية</option>
                    <option value="تنبيهات الجلسة">تنبيهات الجلسة</option>
                    <option value="استلام مستندات">استلام مستندات وأوراق</option>
                    <option value="صلح وتفويض">صلح وتفويض رسمي</option>
                    <option value="أتعاب ورسوم">أتعاب ورسوم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نص الملاحظة أو التوجيه القانوني:
                  </label>
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    rows={4}
                    placeholder="تفاصيل الملحوظة والتوجيه القانوني المطلوب تأكيده..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-1 focus:ring-amber-500 text-right leading-relaxed"
                    required
                  />
                </div>

                {/* E-Signature Option Checkbox */}
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-3">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={requireSignatureOnNewNote}
                      onChange={(e) => setRequireSignatureOnNewNote(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black text-amber-950 dark:text-amber-200 flex items-center gap-1">
                        <PenTool className="w-3.5 h-3.5 text-amber-600" />
                        <span>طلب 'توقيع إلكتروني' وتأكيد قانوني من الموكل</span>
                      </span>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                        إلزام الموكل بوضع توقيعه الرقمي وبصمته للتأكيد الرسمي على مضمون الملحوظة.
                      </p>
                    </div>
                  </label>

                  {/* Sub-inputs when E-Signature is checked */}
                  {requireSignatureOnNewNote && (
                    <div className="space-y-2.5 pt-2 border-t border-amber-200/80 dark:border-amber-900/40 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          الموكل المعني بالتوقيع:
                        </label>
                        <select
                          value={selectedClientForNote}
                          onChange={(e) => setSelectedClientForNote(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-right outline-none font-bold"
                        >
                          <option value="">-- اختر الموكل من السجل --</option>
                          {clients.map((cl) => (
                            <option key={cl.id} value={cl.id}>
                              {cl.name} ({cl.phone || "بدون هاتف"})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          رقم القضية المرتبطة (اختياري):
                        </label>
                        <select
                          value={selectedCaseForNote}
                          onChange={(e) => setSelectedCaseForNote(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-right outline-none"
                        >
                          <option value="">-- اختر القضية --</option>
                          {cases.map((cs) => (
                            <option key={cs.id} value={`${cs.caseNumber} لسنة ${cs.caseYear} - ${cs.competentCourt}`}>
                              {cs.caseNumber} لسنة {cs.caseYear} ({cs.clientName})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          نص الإقرار والتأكيد القانوني المخصص:
                        </label>
                        <input
                          type="text"
                          value={customAffirmation}
                          onChange={(e) => setCustomAffirmation(e.target.value)}
                          placeholder="أقر بصفتي الموكل بصحة البيانات والموافقة على خطة الدفاع..."
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-right outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>{requireSignatureOnNewNote ? "حفظ وإرسال طلب التوقيع الإلكتروني" : "حفظ المذكرة في Google Keep"}</span>
                </button>
              </form>
            </div>

            {/* Notes List with Status Filter & E-Signature Actions */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
              
              {/* Search & Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={keepSearch}
                    onChange={(e) => setKeepSearch(e.target.value)}
                    placeholder="بحث في الملاحظات والمذكرات القضائية أو اسم الموكل..."
                    className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-right outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Filter Badges */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <button
                    onClick={() => setFilterSignatureStatus("all")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      filterSignatureStatus === "all"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    الكل ({keepNotes.length})
                  </button>

                  <button
                    onClick={() => setFilterSignatureStatus("pending")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                      filterSignatureStatus === "pending"
                        ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40"
                    }`}
                  >
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>بانتظار التوقيع ({keepNotes.filter(n => n.requiresSignature && n.signatureStatus === "pending").length})</span>
                  </button>

                  <button
                    onClick={() => setFilterSignatureStatus("signed")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                      filterSignatureStatus === "signed"
                        ? "bg-emerald-600 text-white font-black shadow-xs"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>موقعة ومعتمدة ({keepNotes.filter(n => n.signatureStatus === "signed").length})</span>
                  </button>
                </div>
              </div>

              {/* Notes Grid */}
              {keepNotes.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
                  <p>لا توجد ملاحظات أو مذكرات مسجلة.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[560px] overflow-y-auto pr-1">
                  {keepNotes
                    .filter(n => {
                      const matchQuery =
                        !keepSearch ||
                        n.title.toLowerCase().includes(keepSearch.toLowerCase()) ||
                        n.content.toLowerCase().includes(keepSearch.toLowerCase()) ||
                        (n.clientName && n.clientName.toLowerCase().includes(keepSearch.toLowerCase()));

                      if (!matchQuery) return false;

                      if (filterSignatureStatus === "requires_sig") return !!n.requiresSignature;
                      if (filterSignatureStatus === "pending") return n.requiresSignature && n.signatureStatus === "pending";
                      if (filterSignatureStatus === "signed") return n.signatureStatus === "signed";
                      return true;
                    })
                    .map((note) => {
                      const isSigned = note.signatureStatus === "signed";
                      const isPending = note.requiresSignature && note.signatureStatus === "pending";

                      return (
                        <div
                          key={note.id}
                          className={`p-4 rounded-3xl border text-right space-y-3 flex flex-col justify-between transition-all hover:shadow-md ${
                            isSigned
                              ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-900/50"
                              : isPending
                              ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60"
                              : "bg-slate-50/60 dark:bg-slate-850 border-slate-200 dark:border-slate-750"
                          }`}
                        >
                          <div className="space-y-2">
                            {/* Card Top: Title & Delete */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 flex-1">
                                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block leading-snug">
                                  {note.title}
                                </span>
                                {note.caseNumber && (
                                  <span className="text-[10px] text-slate-500 font-mono block">
                                    دعوى: {note.caseNumber}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteKeepNote(note.id)}
                                className="text-slate-400 hover:text-red-500 transition p-1 cursor-pointer shrink-0"
                                title="حذف المذكرة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Content Preview */}
                            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {note.content}
                            </p>

                            {/* Electronic Signature Status Badge in Lawyer Interface */}
                            {note.requiresSignature && (
                              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                {isSigned && note.signatureData ? (
                                  <div className="p-2.5 bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                        <span>توقيع إلكتروني معتمد وموثق</span>
                                      </span>
                                      <span className="text-[9px] font-mono bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                                        {note.signatureData.verificationHash?.substring(0, 14)}...
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                                      <span>الموكل: {note.signatureData.signedBy}</span>
                                      <span className="font-mono">
                                        {new Date(note.signatureData.signedAt).toLocaleDateString("ar-EG")}
                                      </span>
                                    </div>
                                  </div>
                                ) : isPending ? (
                                  <div className="p-2.5 bg-amber-100/70 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-black text-amber-950 dark:text-amber-200 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                        <span>بانتظار التوقيع الإلكتروني من الموكل</span>
                                      </span>
                                      <span className="text-[9px] bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
                                        تأكيد مطلوب
                                      </span>
                                    </div>

                                    {note.clientName && (
                                      <div className="text-[10px] text-amber-900 dark:text-amber-300 font-bold">
                                        الموكل المعني: {note.clientName}
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>

                          {/* Card Footer & Interactive Action Buttons */}
                          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold">
                                {note.tags?.[0] || "مذكرة"}
                              </span>
                              <span className="font-mono">{new Date(note.date).toLocaleDateString("ar-EG")}</span>
                            </div>

                            {/* Signature Action Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {isSigned ? (
                                <>
                                  <button
                                    onClick={() => handleOpenSignatureModal(note)}
                                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>معاينة شهادة التوقيع</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenClientPortal(note)}
                                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
                                    title="فتح بوابة التأكيد الرسمية"
                                  >
                                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                                  </button>

                                  <button
                                    onClick={() => handleCopyConfirmationLink(note)}
                                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
                                    title="نسخ رابط التوثيق"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleShareSignatureLinkWhatsApp(note)}
                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer"
                                    title="مشاركة عبر واتساب"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : isPending ? (
                                <>
                                  <button
                                    onClick={() => handleOpenRequestSignatureModal(note)}
                                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                                  >
                                    <Link2 className="w-3.5 h-3.5" />
                                    <span>إرسال رابط التأكيد للموكل</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenClientPortal(note)}
                                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 text-amber-700 dark:text-amber-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                    title="توقيع الموكل الآن"
                                  >
                                    <PenTool className="w-3.5 h-3.5" />
                                    <span>توقيع</span>
                                  </button>

                                  <button
                                    onClick={() => handleCopyConfirmationLink(note)}
                                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
                                    title="نسخ رابط التأكيد القانوني"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleShareSignatureLinkWhatsApp(note)}
                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer"
                                    title="إرسال طلب التوقيع للموكل عبر واتساب"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleOpenRequestSignatureModal(note)}
                                  className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                  <PenTool className="w-3 h-3 text-amber-500" />
                                  <span>طلب توقيع رقمي وإرسال رابط للموكل</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. GMAIL TAB VIEW                                        */}
      {/* ======================================================== */}
      {activeSubTab === "gmail" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={gmailSearch}
                  onChange={(e) => setGmailSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadGmail()}
                  placeholder="بحث في الرسائل (الاسم، القضية)..."
                  className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-right outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={loadGmail}
                disabled={isLoadingGmail || !isConnected}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-slate-600 transition cursor-pointer"
                title="تحديث الرسائل"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingGmail ? "animate-spin text-amber-500" : ""}`} />
              </button>
              <button
                onClick={() => setShowComposeModal(true)}
                disabled={!isConnected}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إنشاء</span>
              </button>
            </div>

            {!isConnected ? (
              <div className="p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <Mail className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">قم بربط حساب Google لعرض رسائل Gmail القضائية وإرسال الإخطارات للموكلين.</p>
                <button
                  onClick={handleConnect}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-xl cursor-pointer"
                >
                  تسجيل الدخول إلى Gmail
                </button>
              </div>
            ) : isLoadingGmail ? (
              <div className="p-10 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                <p>جارٍ تحميل صندوق الوارد...</p>
              </div>
            ) : gmailMessages.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p>لا توجد رسائل بريد إلكتروني مطابقة.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {gmailMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedEmail(msg)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-right space-y-1 ${
                      selectedEmail?.id === msg.id
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-750 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                        {msg.from.replace(/<.*>/, "") || "مرسل غير معروف"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.date).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 truncate">{msg.subject}</p>
                    <p className="text-[11px] text-slate-500 truncate">{msg.snippet}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 min-h-[400px]">
            {selectedEmail ? (
              <div className="space-y-4 text-right">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedEmail.subject}</h3>
                    <p className="text-xs text-slate-500 mt-1">من: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedEmail.from}</span></p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedEmail.date}</p>
                  </div>
                  <button
                    onClick={() => {
                      setComposeTo(selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from);
                      setComposeSubject("رد: " + selectedEmail.subject);
                      setShowComposeModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    رد على الرسالة
                  </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {selectedEmail.snippet}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-2">
                <Mail className="w-12 h-12 text-slate-300" />
                <p className="text-xs">اختر رسالة من القائمة لعرض تفاصيلها والرد عليها.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. GOOGLE CHAT TAB VIEW                                  */}
      {/* ======================================================== */}
      {activeSubTab === "chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span>مساحات العمل والمحادثات</span>
              </h4>
              <button
                onClick={loadChatSpaces}
                disabled={isLoadingSpaces || !isConnected}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-600 transition cursor-pointer"
                title="تحديث المساحات"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSpaces ? "animate-spin text-emerald-500" : ""}`} />
              </button>
            </div>

            {!isConnected ? (
              <div className="p-6 text-center space-y-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p>قم بتسجيل الدخول للوصول إلى غرف محادثات Google Chat ومشاركة مواعيد الجلسات.</p>
                <button
                  onClick={handleConnect}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  تسجيل الدخول لـ Google Chat
                </button>
              </div>
            ) : isLoadingSpaces ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-500" />
                <p>جارٍ تحميل المساحات...</p>
              </div>
            ) : chatSpaces.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <p>لا توجد مساحات Google Chat مفعلة حالياً.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {chatSpaces.map((sp) => (
                  <div
                    key={sp.name}
                    onClick={() => handleSelectSpace(sp)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-right space-y-0.5 ${
                      selectedSpace?.name === sp.name
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-855 border-slate-200 dark:border-slate-750 hover:bg-slate-100"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{sp.displayName}</p>
                    {sp.description && <p className="text-[10px] text-slate-400 truncate">{sp.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between min-h-[480px]">
            {selectedSpace ? (
              <>
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{selectedSpace.displayName}</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">{selectedSpace.name}</p>
                  </div>
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    Google Chat Live
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 max-h-[360px]">
                  {isLoadingMessages ? (
                    <div className="text-center py-10 text-xs text-slate-400 space-y-1">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-500" />
                      <p>جارٍ جلب رسائل المحادثة...</p>
                    </div>
                  ) : spaceMessages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400">
                      لا توجد رسائل بعد في هذه المساحة. ابدأ المحادثة الآن!
                    </div>
                  ) : (
                    spaceMessages.map((m, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 text-right space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{m.sender.displayName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(m.createTime).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {m.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChatMessage} className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={newChatText}
                    onChange={(e) => setNewChatText(e.target.value)}
                    placeholder="اكتب رسالة أو تنبيهاً قانونياً في مساحة Google Chat..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500 text-right"
                  />
                  <button
                    type="submit"
                    disabled={!newChatText.trim() || isSendingChat}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-12 h-12 text-slate-300" />
                <p className="text-xs">اختر مساحة Google Chat لعرض الرسائل والمشاركة الفورية.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl text-right animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-red-600" />
                <span>إرسال بريد إلكتروني قضائي رسمي (Gmail)</span>
              </h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white flex items-center justify-center text-sm font-black cursor-pointer transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البريد الإلكتروني للمستلم (الموكل أو المحكمة أو الخبير):
                </label>
                <input
                  type="email"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-right outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  موضوع الرسالة:
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="بخصوص الجلسة القادمة في الدعوى رقم..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-right outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نص الخطاب القضائي:
                </label>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  rows={6}
                  placeholder="نحيط سيادتكم علماً بصدور قرار المحكمة في جلسة اليوم بالتأجيل لـ..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-right outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
                  required
                />
              </div>

              {emailSendStatus && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  emailSendStatus.includes("بنجاح")
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200"
                    : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200"
                }`}>
                  {emailSendStatus}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingEmail ? "جارٍ الإرسال..." : "إرسال البريد الآن"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Electronic Signature Modal */}
      {isSignatureModalOpen && selectedNoteForSignature && (
        <ElectronicSignatureModal
          note={selectedNoteForSignature}
          currentUser={currentUser}
          isOpen={isSignatureModalOpen}
          onClose={() => {
            setIsSignatureModalOpen(false);
            setSelectedNoteForSignature(null);
          }}
          onSignComplete={handleSignCompleted}
        />
      )}

      {/* Request Signature & Shareable Confirmation Link Modal */}
      {isRequestLinkModalOpen && selectedNoteForRequestLink && (
        <RequestSignatureLinkModal
          note={selectedNoteForRequestLink}
          currentUser={currentUser}
          clients={clients}
          cases={cases}
          isOpen={isRequestLinkModalOpen}
          onClose={() => {
            setIsRequestLinkModalOpen(false);
            setSelectedNoteForRequestLink(null);
          }}
          onRequestCompleted={handleRequestSignatureCompleted}
          onOpenClientSigningView={(targetNote) => {
            setIsRequestLinkModalOpen(false);
            setSelectedNoteForRequestLink(null);
            handleOpenClientPortal(targetNote);
          }}
        />
      )}

      {/* Client Signature Confirmation Portal (Simulated Client View) */}
      {isClientPortalOpen && selectedNoteForClientPortal && (
        <ClientSignatureConfirmationPortal
          note={selectedNoteForClientPortal}
          isOpen={isClientPortalOpen}
          onClose={() => {
            setIsClientPortalOpen(false);
            setSelectedNoteForClientPortal(null);
          }}
          onSignComplete={handleSignCompleted}
        />
      )}

    </div>
  );
}
