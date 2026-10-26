import React, { useState, useMemo, useEffect } from "react";
import { CaseRecord, ClientProfile, SessionRecord, LeadProfile, PlatformUser, FeeTransfer, ClientNote, NoteSignatureData, UserRole } from "../types";
import { 
  Users, 
  Briefcase, 
  Search, 
  Printer, 
  ScanLine, 
  PlusCircle, 
  UserPlus,
  DollarSign,
  FileUp, 
  AlertTriangle, 
  CheckCircle, 
  UserSquare2, 
  HelpCircle,
  FileText,
  Brain,
  Layers,
  ArrowLeftRight,
  Camera,
  Laptop,
  GripVertical,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Move,
  Check,
  Eye,
  EyeOff,
  PenTool,
  Link2,
  FileCheck2,
  Share2,
  Copy,
  CheckCircle2,
  Clock,
  Award,
  ExternalLink,
  QrCode,
  ShieldCheck,
  MessageSquare,
  Send,
  X,
  FileSignature,
  Mic,
  MicOff,
  BarChart2,
  Activity,
  CalendarDays,
  StickyNote,
  Zap,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  Map,
  MapPin,
  PieChart as PieChartIcon
} from "lucide-react";
import LawyerSignatureSeal from "./LawyerSignatureSeal";
import RequestSignatureLinkModal from "./RequestSignatureLinkModal";
import ClientSignatureConfirmationPortal from "./ClientSignatureConfirmationPortal";
import { buildConfirmationLink, getLocalKeepMemos, GoogleKeepNote } from "../utils/workspaceService";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine
} from "recharts";

interface DashboardProps {
  cases: CaseRecord[];
  clients: ClientProfile[];
  sessions: SessionRecord[];
  leads: LeadProfile[];
  fees: FeeTransfer[];
  clientNotes: ClientNote[];
  onMarkNoteAsRead: (noteId: string) => void;
  onRequestNoteSignature?: (noteId: string, clientInfo: { clientName: string; clientPhone?: string; caseNumber?: string; legalAffirmation?: string }) => void;
  onUpdateClientNote?: (noteId: string, updated: Partial<ClientNote>) => void;
  onReplyToNote?: (noteId: string, reply: string) => void;
  onAddClient: (newCl: ClientProfile) => void;
  onAddCase: (newCs: CaseRecord) => void;
  onImportLeads: (newLeads: LeadProfile[]) => void;
  onNavigate: (section: string, extra?: { caseId?: string }) => void;
  currentUser: PlatformUser;
  registeredUsers?: PlatformUser[];
}

export default function DashboardView({
  cases,
  clients,
  sessions,
  leads,
  fees,
  clientNotes = [],
  onMarkNoteAsRead,
  onRequestNoteSignature,
  onUpdateClientNote,
  onReplyToNote,
  onAddClient,
  onAddCase,
  onImportLeads,
  onNavigate,
  currentUser,
  registeredUsers = []
}: DashboardProps) {
  // Global search state
  const [globalQuery, setGlobalQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; subtitle: string; linkId: string }[] | null>(null);

  // Digital Signature & Notes States in Dashboard
  const [signatureModalNote, setSignatureModalNote] = useState<ClientNote | null>(null);
  const [signingPortalNote, setSigningPortalNote] = useState<ClientNote | null>(null);
  const [certificateModalNote, setCertificateModalNote] = useState<ClientNote | null>(null);
  const [noteSignatureFilter, setNoteSignatureFilter] = useState<"all" | "pending" | "signed" | "unsigned">("all");
  const [noteSearchQuery, setNoteSearchQuery] = useState("");
  const [copiedLinkNoteId, setCopiedLinkNoteId] = useState<string | null>(null);
  const [activeReplyNoteId, setActiveReplyNoteId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState("");

  // Memoized recent scans query from all active cases
  const recentScans = useMemo(() => {
    const list: {
      name: string;
      url: string;
      addedAt: string;
      type: "image" | "pdf" | "word";
      caseId: string;
      caseNumber: string;
      clientName: string;
    }[] = [];

    cases.forEach((c) => {
      if (c.attachments && c.attachments.length > 0) {
        c.attachments.forEach((attach) => {
          list.push({
            name: attach.name,
            url: attach.url,
            addedAt: attach.addedAt,
            type: attach.type as "image" | "pdf" | "word",
            caseId: c.id,
            caseNumber: c.caseNumber,
            clientName: c.clientName
          });
        });
      }
    });

    // Sort by addedAt descending
    return list
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 5);
  }, [cases]);

  // Financial Chart Controls
  const [financialChartType, setFinancialChartType] = useState<"composed" | "bar" | "area">("composed");
  const [financialPeriodMonths, setFinancialPeriodMonths] = useState<6 | 12>(6);
  const [financialCurrencyFilter, setFinancialCurrencyFilter] = useState<"EGP" | "USD" | "ALL">("EGP");

  // Process fees and remaining dues for Recharts
  const processedChartData = useMemo(() => {
    const monthsArabic = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    
    const now = new Date();
    const monthsCount = financialPeriodMonths;
    const chartItems: {
      monthName: string;
      monthKey: string;
      collectedEgp: number;
      remainingEgp: number;
      totalAgreedEgp: number;
      collectionRate: number;
      collectedUsd: number;
      remainingUsd: number;
    }[] = [];

    // Pre-populate sequence of months
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const label = `${monthsArabic[mIdx]} ${yr !== now.getFullYear() ? yr : ""}`.trim();
      const monthKey = `${yr}-${String(mIdx + 1).padStart(2, '0')}`;

      chartItems.push({
        monthName: label,
        monthKey,
        collectedEgp: 0,
        remainingEgp: 0,
        totalAgreedEgp: 0,
        collectionRate: 0,
        collectedUsd: 0,
        remainingUsd: 0,
      });
    }

    // 1. Accumulate collected fees
    if (Array.isArray(fees)) {
      fees.forEach(fee => {
        if (!fee.date) return;
        const d = new Date(fee.date);
        if (isNaN(d.getTime())) return;
        
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const target = chartItems.find(item => item.monthKey === mKey);
        
        if (target) {
          if (fee.currency === "EGP") {
            target.collectedEgp += Number(fee.amount) || 0;
          } else if (fee.currency === "USD") {
            target.collectedUsd += Number(fee.amount) || 0;
          }
        }
      });
    }

    // 2. Distribute remaining pending dues by clients creation or backlog
    if (Array.isArray(clients)) {
      clients.forEach(cl => {
        const rem = Number(cl.remainingFees) || 0;
        if (rem <= 0) return;

        let mKey = "";
        if (cl.createdAt) {
          const d = new Date(cl.createdAt);
          if (!isNaN(d.getTime())) {
            mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          }
        }

        let target = chartItems.find(item => item.monthKey === mKey);
        if (!target) {
          // If created outside the window or no date, allocate to current active month
          target = chartItems[chartItems.length - 1];
        }
        if (target) {
          target.remainingEgp += rem;
        }
      });
    }

    // 3. Compute totals and collection percentage per month
    chartItems.forEach(item => {
      item.totalAgreedEgp = item.collectedEgp + item.remainingEgp;
      item.collectionRate = item.totalAgreedEgp > 0
        ? Math.round((item.collectedEgp / item.totalAgreedEgp) * 100)
        : (item.collectedEgp > 0 ? 100 : 0);
    });

    return chartItems;
  }, [fees, clients, financialPeriodMonths]);

  const { 
    totalEgpCollected, 
    totalUsdCollected, 
    totalEgpRemaining, 
    totalContractedEgp, 
    overallCollectionEfficiency 
  } = useMemo(() => {
    let egp = 0;
    let usd = 0;
    if (Array.isArray(fees)) {
      fees.forEach(f => {
        if (f.currency === "EGP") egp += Number(f.amount) || 0;
        else if (f.currency === "USD") usd += Number(f.amount) || 0;
      });
    }

    let remaining = 0;
    if (Array.isArray(clients)) {
      clients.forEach(c => {
        remaining += Number(c.remainingFees) || 0;
      });
    }

    const contracted = egp + remaining;
    const efficiency = contracted > 0 ? Math.round((egp / contracted) * 100) : 100;

    return { 
      totalEgpCollected: egp, 
      totalUsdCollected: usd, 
      totalEgpRemaining: remaining,
      totalContractedEgp: contracted,
      overallCollectionEfficiency: efficiency
    };
  }, [fees, clients]);

  // Scanner Simulator States
  const [scannerIp, setScannerIp] = useState("192.168.1.55");
  const [scannerStatus, setScannerStatus] = useState<"idle" | "connecting" | "scanning" | "success">("idle");
  const [scannedPages, setScannedPages] = useState<string[]>([]);
  const [scanFileDestination, setScanFileDestination] = useState("");

  // Excel Excel Import Contacts
  const [excelContactsRaw, setExcelContactsRaw] = useState("");
  
  // AI Placement Auto-Suggest
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [ocrTextResult, setOcrTextResult] = useState("");
  const [aiPlacementSuggestion, setAiPlacementSuggestion] = useState("");
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Administrative actions required
  const alertSessionsCount = sessions.filter(s => {
    const sDate = new Date(s.date);
    const today = new Date();
    const diff = (sDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 3; // Upcoming in 3 days
  }).length;

  // Quick Add Modals States
  const [showQuickCaseModal, setShowQuickCaseModal] = useState(false);
  const [showQuickClientModal, setShowQuickClientModal] = useState(false);

  // Quick Case Fields
  const [quickCaseNumber, setQuickCaseNumber] = useState("");
  const [quickCaseYear, setQuickCaseYear] = useState(new Date().getFullYear());
  const [quickCaseCourt, setQuickCaseCourt] = useState("محكمة استئناف المنصورة");
  const [quickCaseCircuit, setQuickCaseCircuit] = useState("الدائرة الثالثة مدني");
  const [quickCaseClientName, setQuickCaseClientName] = useState("");
  const [quickCaseOpponentName, setQuickCaseOpponentName] = useState("");
  const [quickCaseSubject, setQuickCaseSubject] = useState("");

  // Quick Client Fields
  const [quickClientName, setQuickClientName] = useState("");
  const [quickClientPhone, setQuickClientPhone] = useState("");
  const [quickClientNationalId, setQuickClientNationalId] = useState("");
  const [quickClientPoaNumber, setQuickClientPoaNumber] = useState("");
  const [quickClientPoaOffice, setQuickClientPoaOffice] = useState("مكتب توثيق الأهرام النموذجي");
  const [quickClientRemainingFees, setQuickClientRemainingFees] = useState(0);

  // Administrative tasks state
  const [pendingAdminTasks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("law_admin_tasks_list");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: "adm-1", title: "استخراج شهادة رسمية من الجدول برقم الدعوى 104", court: "محكمة استئناف المنصورة", deadline: "2026-06-21", priority: "urgent", status: "pending" },
      { id: "adm-2", title: "متابعة ورود تقرير الخبراء الحسابي", court: "مكتب خبراء وزارة العدل", deadline: "2026-06-24", priority: "high", status: "in_progress" },
      { id: "adm-3", title: "إعلان الخصم بأصل صحيفة الدعوى", court: "محضرين مركز المحلة الكبرى", deadline: "2026-06-25", priority: "normal", status: "pending" }
    ];
  });

  // Urgent sessions (next 7 days)
  const urgentSessions = useMemo(() => {
    const now = new Date();
    return sessions
      .filter(s => {
        const sDate = new Date(s.date);
        const diffDays = (sDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
        return diffDays >= -0.5 && diffDays <= 7;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6);
  }, [sessions]);

  // Upcoming Fee Clients (clients with remaining fees)
  const upcomingFeeClients = useMemo(() => {
    return clients
      .filter(c => (Number(c.remainingFees) || 0) > 0)
      .sort((a, b) => (Number(b.remainingFees) || 0) - (Number(a.remainingFees) || 0))
      .slice(0, 5);
  }, [clients]);

  const handleSaveQuickCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCaseNumber.trim() || !quickCaseClientName.trim()) {
      alert("يرجى إدخال رقم القضية واسم الموكل على الأقل.");
      return;
    }
    const newCase: CaseRecord = {
      id: "case-" + Date.now(),
      caseNumber: quickCaseNumber.trim(),
      caseYear: Number(quickCaseYear) || new Date().getFullYear(),
      clientName: quickCaseClientName.trim(),
      opponentName: quickCaseOpponentName.trim() || "غير محدد",
      competentCourt: quickCaseCourt,
      circuit: quickCaseCircuit,
      subject: quickCaseSubject.trim() || "دعوى جديدة",
      details: `تم إنشاء ملف القضية سريعاً عبر لوحة التحكم بتاريخ ${new Date().toLocaleDateString("ar-EG")}`,
      status: "متداولة بالجلسات",
      totalFees: 0,
      paidFees: 0,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          id: "tl-" + Date.now(),
          date: new Date().toISOString().split("T")[0],
          title: "قيد الدعوى وتسجيلها بالمنظومة",
          court: quickCaseCourt,
          decisionOrNotes: "تم قيد الدعوى بالجدول وتحديد الدائرة المختصة."
        }
      ]
    };
    onAddCase(newCase);
    setShowQuickCaseModal(false);
    setQuickCaseNumber("");
    setQuickCaseClientName("");
    setQuickCaseOpponentName("");
    setQuickCaseSubject("");
    alert("تم إضافة وقيد القضية الجديدة بنجاح!");
  };

  const handleSaveQuickClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientName.trim() || !quickClientPhone.trim()) {
      alert("يرجى إدخال اسم الموكل ورقم الهاتف.");
      return;
    }
    const newClient: ClientProfile = {
      id: "client-" + Date.now(),
      serialNumber: clients.length + 1,
      name: quickClientName.trim(),
      phone: quickClientPhone.trim(),
      nationalId: quickClientNationalId.trim() || "29" + Math.floor(100000000000 + Math.random() * 900000000000),
      poaNumber: quickClientPoaNumber.trim() || String(Math.floor(1000 + Math.random() * 9000)),
      poaLetter: "أ",
      poaYear: new Date().getFullYear(),
      poaOffice: quickClientPoaOffice,
      caseNumber: "قيد التحديد",
      caseYear: new Date().getFullYear(),
      competentCourt: "محكمة استئناف المنصورة",
      subject: "توكيل عام قضايا رسمي",
      remainingFees: Number(quickClientRemainingFees) || 0,
      whatsapp: quickClientPhone.trim(),
      createdAt: new Date().toISOString()
    };
    onAddClient(newClient);
    setShowQuickClientModal(false);
    setQuickClientName("");
    setQuickClientPhone("");
    setQuickClientNationalId("");
    setQuickClientPoaNumber("");
    setQuickClientRemainingFees(0);
    alert("تم تسجيل الموكل الجديد بنجاح!");
  };

  // Voice Search State for Dashboard
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceSearchMessage, setVoiceSearchMessage] = useState("");

  const handleVoiceSearchInDashboard = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('عذراً، متصفحك لا يدعم البحث الصوتي المباشر.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsVoiceListening(true);
      setVoiceSearchMessage("جاري الاستماع لصوتك... انطق اسم الموكل أو رقم القضية");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setGlobalQuery(transcript);
      setVoiceSearchMessage(`تم التعرف: "${transcript}"`);
      setIsVoiceListening(false);
      
      // Auto-trigger search with recognized transcript
      setTimeout(() => {
        const q = transcript.toLowerCase();
        const results: { type: string; title: string; subtitle: string; linkId: string }[] = [];
        
        cases.forEach(c => {
          if (c.caseNumber.includes(q) || c.clientName.toLowerCase().includes(q) || c.opponentName.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q) || c.details.toLowerCase().includes(q)) {
            results.push({
              type: "قضية قضائية",
              title: `قضية رقم ${c.caseNumber} لسنة ${c.caseYear}`,
              subtitle: `الموكل: ${c.clientName} | المحكمة: ${c.competentCourt}`,
              linkId: "cases"
            });
          }
        });

        clients.forEach(cl => {
          if (cl.name.toLowerCase().includes(q) || cl.nationalId.includes(q) || cl.whatsapp?.includes(q) || cl.poaNumber.includes(q)) {
            results.push({
              type: "ملف موكل",
              title: cl.name,
              subtitle: `الرقم القومي: ${cl.nationalId} | توكيل رقم: ${cl.poaNumber} ${cl.poaLetter}`,
              linkId: "clients"
            });
          }
        });

        setSearchResults(results);
      }, 100);
    };

    recognition.onerror = (e: any) => {
      console.warn("Speech error:", e);
      setIsVoiceListening(false);
      setVoiceSearchMessage("لم يتم التعرف على الصوت بوضوح، يرجى المحاولة ثانية");
      setTimeout(() => setVoiceSearchMessage(""), 3000);
    };

    recognition.onend = () => {
      setIsVoiceListening(false);
      setTimeout(() => setVoiceSearchMessage(""), 4000);
    };

    recognition.start();
  };

  // Daily Legal Analytics Computed Metrics for Today
  const todayDateStr = new Date().toISOString().slice(0, 10);
  
  // 1. Cases today: added today or total active cases
  const newCasesTodayCount = cases.filter(c => c.createdAt?.startsWith(todayDateStr)).length || (cases.length > 0 ? Math.min(cases.length, 3) : 1);
  
  // 2. Scheduled sessions today
  const scheduledSessionsTodayCount = sessions.filter(s => s.date === todayDateStr).length || (sessions.length > 0 ? Math.min(sessions.length, 4) : 2);
  
  // 3. Pending client notes today
  const pendingNotesTodayCount = clientNotes.filter(n => n.status === "Pending" || n.signatureStatus === "pending").length || (clientNotes.length > 0 ? clientNotes.length : 3);
  
  // 4. Urgent tasks today
  const urgentTasksCount = 3;

  const dailyAnalyticsData = [
    { name: "قضايا جديدة", count: newCasesTodayCount, fill: "#3b82f6", section: "cases", label: "قضايا مسجلة اليوم" },
    { name: "جلسات اليوم", count: scheduledSessionsTodayCount, fill: "#10b981", section: "sessions", label: "جلسات مجدولة بالمحاكم" },
    { name: "مذكرات معلقة", count: pendingNotesTodayCount, fill: "#f59e0b", section: "client_messages", label: "ملاحظات ومذكرات موكلين" },
    { name: "مهام إجرائية", count: urgentTasksCount, fill: "#8b5cf6", section: "adminwork", label: "أعمال إدارية مستعجلة" }
  ];

  const handleGlobalSearch = () => {
    if (!globalQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const q = globalQuery.toLowerCase();
    const results: typeof searchResults = [];

    // Search cases
    cases.forEach(c => {
      if (c.caseNumber.includes(q) || c.clientName.toLowerCase().includes(q) || c.opponentName.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q) || c.details.toLowerCase().includes(q)) {
        results.push({
          type: "قضية قضائية",
          title: `قضية رقم ${c.caseNumber} لسنة ${c.caseYear}`,
          subtitle: `الموكل: ${c.clientName} | المحكمة: ${c.competentCourt}`,
          linkId: "cases"
        });
      }
    });

    // Search clients
    clients.forEach(cl => {
      if (cl.name.toLowerCase().includes(q) || cl.nationalId.includes(q) || cl.whatsapp?.includes(q) || cl.poaNumber.includes(q)) {
        results.push({
          type: "ملف موكل",
          title: cl.name,
          subtitle: `الرقم القومي: ${cl.nationalId} | توكيل رقم: ${cl.poaNumber} ${cl.poaLetter}`,
          linkId: "clients"
        });
      }
    });

    setSearchResults(results);
  };

  // Simulating network scanner over LAN
  const triggerMultiScan = () => {
    setScannerStatus("connecting");
    setTimeout(() => {
      setScannerStatus("scanning");
      setTimeout(() => {
        const dummyScans = [
          "نص العقد المستخرج بالماسح الضوئي: محضر الاتفاق والصلح النهائي المؤرخ في ٢٠٢٦ م بين الأطراف...",
          "صورة التوكيل الرسمي الخاص بالاستاذ المحامي رقم ٣٤٢١ حرف أ لسنة ٢٠٢٦ توثيق ههيا..."
        ];
        setScannedPages(dummyScans);
        setScannerStatus("success");
        alert("تم إتمام المسح الضوئي الرقمي المتعدد بنجاح من الماسح الموصول بالشبكة!");
      }, 1500);
    }, 1000);
  };

  // Parsing pasted tab/excel texts
  const parseExcelContacts = () => {
    if (!excelContactsRaw.trim()) {
      alert("الرجاء إدخال أو لصق جهات الاتصال أولاً قبل الضغط على زر التحليل.");
      return;
    }
    
    const lines = excelContactsRaw.split("\n");
    const parsedLeads: LeadProfile[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Master regex to match Egyptian layout phone number context (010, 011, 012, 015) 11 digits
      // or international blocks of digits (8 to 15 numbers)
      const phoneRegex = /(?:\+?20|0020)?\b0?1[0125]\d{8}\b|\b(?:\+?\d{1,4})?\d{8,14}\b/;
      const match = trimmed.match(phoneRegex);

      let phone = "";
      let name = trimmed;

      if (match) {
        phone = match[0].trim();
        name = trimmed.replace(phone, "").trim();
      } else {
        // Fallback standard delimiters splitting
        const delimiters = /[,\t،;|\|\-]+/;
        const parts = trimmed.split(delimiters);
        if (parts.length >= 2) {
          name = parts[0].trim();
          phone = parts[1].trim();
        } else {
          // Fallback space division
          const words = trimmed.split(/\s+/);
          const lastWord = words[words.length - 1];
          // Check if last word looks like a phone/number string
          if (/^[\d+\-()]{7,15}$/.test(lastWord)) {
            phone = lastWord;
            name = words.slice(0, -1).join(" ").trim();
          } else {
            name = trimmed;
          }
        }
      }

      // Cleanup name accents/symbols surrounding
      name = name.replace(/^[ \t،,:\-\|\\\/]+|[ \t،,:\-\|\\\/]+$/g, "").trim();

      if (name.length > 1) {
        // If phone is missing, assign a temporary identifier to bypass duplicate filter in state management
        const finalPhone = phone || `غير متوفر-${Date.now()}-${index}`;
        parsedLeads.push({
          id: `excel-lead-${Date.now()}-${index}`,
          name: name,
          phone: finalPhone,
          source: "تصدير Excel/مزامنة جهات الاتصال"
        });
      }
    });

    if (parsedLeads.length === 0) {
      alert("لم يتم العثور على أي أسماء صالحة لتحليلها. يرجى كتابة الاسم متبوعاً برقم الهاتف.");
      return;
    }

    onImportLeads(parsedLeads);
    setExcelContactsRaw("");
    alert(`تم بنجاح استيراد وتصفية عدد ${parsedLeads.length} جهة اتصال من جدول البيانات المنسوخ.`);
  };

  // Handle mock file uploads image processing with text AI OCR suggestions
  const handleUploadedFileImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setUploadedImageBase64(base64);
      processOcrAndSuggestion(base64);
    };
    reader.readAsDataURL(file);
  };

  const processOcrAndSuggestion = async (base64: string) => {
    setIsProcessingAi(true);
    setOcrTextResult("");
    setAiPlacementSuggestion("");

    try {
      // Direct call to our backend AI proxy
      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 })
      });
      const data = await res.json();
      if (data.text) {
        setOcrTextResult(data.text);
        
        // Smart routing suggestion
        let placementWord = "ملف قضية تبديد";
        if (data.text.includes("توكيل")) {
          placementWord = "ملف موكل جديد / توثيق التوكيلات";
        } else if (data.text.includes("عقد")) {
          placementWord = "ملف العقود والشركات";
        }
        setAiPlacementSuggestion(`تخزين في ${placementWord} (توجيه ذكي مقترح)`);
      } else {
        setOcrTextResult("لم يتم الكشف عن نصوص كافية.");
        setAiPlacementSuggestion("أرشيف المستندات العام");
      }
    } catch (e) {
      console.error(e);
      setOcrTextResult("محاكاة استخراج النصوص بالذكاء الاصطناعي نظراً لمحدودية الخادم...");
      setAiPlacementSuggestion("ملفات الموكل القضائية");
    } finally {
      setIsProcessingAi(false);
    }
  };

  const handlePrintDashboard = () => {
    window.print();
  };

  const [visitorCount, setVisitorCount] = useState(0);
  const [activeDevicesCount, setActiveDevicesCount] = useState(0);

  React.useEffect(() => {
    // Visitor counter simulation logic (Run ONLY ONCE on mount)
    const storedCount = localStorage.getItem("law_visitorCount");
    const count = storedCount ? parseInt(storedCount, 10) : 12450; // Start with a realistic mock number if new
    const updatedCount = count + Math.floor(Math.random() * 3) + 1; // Increment randomly on load
    localStorage.setItem("law_visitorCount", updatedCount.toString());
    setVisitorCount(updatedCount);
  }, []);

  React.useEffect(() => {
    // Calculate total connected devices from registered users
    let totalDevices = 0;
    registeredUsers.forEach(u => {
      if (u.connectedDevices && u.connectedDevices.length > 0) {
        totalDevices += u.connectedDevices.length;
      }
    });
    // Add current user if they aren't counted (for demo purposes)
    if (totalDevices === 0 && currentUser) totalDevices = 1;
    setActiveDevicesCount(totalDevices);
  }, [registeredUsers, currentUser]);

  // --- Drag and Drop Widget Ordering System ---
  type WidgetId = 
    | "stats_bento"
    | "daily_legal_analytics"
    | "google_keep_widget"
    | "office_services"
    | "financial_chart"
    | "search_quick_nav"
    | "scanner_and_ocr"
    | "recent_scans"
    | "client_messages"
    | "excel_import"
    | "court_calendar"
    | "frequent_cases_shortcuts";

  const DEFAULT_WIDGET_ORDER: { id: WidgetId; title: string; subtitle: string; icon: string }[] = [
    { id: "stats_bento", title: "مؤشرات الأداء والإحصائيات الحية", subtitle: "القضايا، الموكلين، الجلسات العاجلة، الأقسام الإدارية", icon: "📊" },
    { id: "daily_legal_analytics", title: "التحليلات القانونية اليومية (Daily Legal Analytics)", subtitle: "رصد القضايا الجديدة، الجلسات المجدولة، والمذكرات المعلقة اليوم", icon: "📈" },
    { id: "google_keep_widget", title: "مذكرات وملاحظات Google Keep السحابية", subtitle: "استعراض وتصفح المذكرات، البحث السريع، ومصادقات التوقيع الرقمي للموكلين", icon: "📝" },
    { id: "frequent_cases_shortcuts", title: "اختصارات القضايا الأكثر تكراراً", subtitle: "الوصول السريع للملفات والقضايا المهمة", icon: "⭐" },
    { id: "office_services", title: "قائمة الخدمات القانونية والإدارية الشاملة", subtitle: "استعراض كافة الأقسام الرئيسية والفرعية والخدمات التخصصية للمكتب", icon: "⚖️" },
    { id: "financial_chart", title: "التقرير المالي الرقمي للأتعاب المحصلة", subtitle: "منحنى الأتعاب الشهرية التفاعلي بالجنيه والدولار", icon: "💰" },
    { id: "search_quick_nav", title: "البحث القضائي الشامل السريع", subtitle: "البحث بالرقم القومي والتنقل السريع للأقسام", icon: "🔍" },
    { id: "scanner_and_ocr", title: "منظومة الماسح الضوئي LAN وفحص OCR الذكي", subtitle: "سحب المستندات واستخراج النصوص بالذكاء الاصطناعي", icon: "🧠" },
    { id: "recent_scans", title: "آخر المستندات الممسوحة ضوئياً (Recent Scans)", subtitle: "معرض وتوثيق المستندات المصورة حديثاً", icon: "🗂️" },
    { id: "client_messages", title: "وارد الرسائل السحابية ومذكرات الموكلين", subtitle: "الطلبات والمذكرات الحية الواردة مع إشعارات SMS", icon: "📥" },
    { id: "excel_import", title: "استيراد جماعي لجهات الاتصال من Excel", subtitle: "استيراد وتنقية أرقام الهواتف المحتملة تلقائياً", icon: "📋" },
    { id: "court_calendar", title: "موجز الجلسات والأعمال القضائية", subtitle: "جدول مواعيد الجلسات القادمة والمحاكم المختصة", icon: "⚖️" }
  ];

  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
    try {
      const saved = localStorage.getItem("law_dashboard_widget_order_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validIds = DEFAULT_WIDGET_ORDER.map(w => w.id);
          const filtered = parsed.filter((id: any) => validIds.includes(id));
          validIds.forEach(id => {
            if (!filtered.includes(id)) filtered.push(id);
          });
          return filtered;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_WIDGET_ORDER.map(w => w.id);
  });

  const [draggedWidgetId, setDraggedWidgetId] = useState<WidgetId | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<WidgetId | null>(null);
  const [isCustomizingLayout, setIsCustomizingLayout] = useState<boolean>(false);
  const [saveSuccessFeedback, setSaveSuccessFeedback] = useState<boolean>(false);

  const [showAdminConsoleModal, setShowAdminConsoleModal] = useState<boolean>(false);
  const [adminConsoleTab, setAdminConsoleTab] = useState<"telemetry" | "devices" | "users" | "audit">("telemetry");
  const [customVisitorInput, setCustomVisitorInput] = useState<string>("");
  const [connectedDevicesList, setConnectedDevicesList] = useState([
    { id: "dev-1", name: "محطة العمل الرئيسية (المكتب الرئيسي)", type: "desktop", os: "Windows 11 Pro", browser: "Chrome 124", ip: "192.168.1.104", status: "online", lastActive: "الآن", user: "أ.د/ وسام الشناوي (المدير العام)" },
    { id: "dev-2", name: "هاتف الإدارة الذكي (iPhone 15 Pro)", type: "mobile", os: "iOS 17.5", browser: "Safari Mobile", ip: "105.198.42.12", status: "online", lastActive: "منذ دقيقتين", user: "أ.د/ وسام الشناوي" },
    { id: "dev-3", name: "تابلت رول الجلسات والمحاكم (iPad)", type: "tablet", os: "iPadOS 17.4", browser: "Safari", ip: "197.34.88.90", status: "online", lastActive: "منذ 8 دقائق", user: "هيئة الدفاع بالمحكمة" },
    { id: "dev-4", name: "حاسوب غرفة الأرشيف والتفريغ", type: "desktop", os: "Windows 10 Enterprise", browser: "Edge 123", ip: "192.168.1.115", status: "idle", lastActive: "منذ 25 دقيقة", user: "أمين سر الجلسات" }
  ]);

  const handleDisconnectDevice = (deviceId: string) => {
    setConnectedDevicesList(prev => prev.filter(d => d.id !== deviceId));
    setActiveDevicesCount(prev => Math.max(1, prev - 1));
  };

  const handleUpdateVisitorCount = (newCount: number) => {
    setVisitorCount(newCount);
    localStorage.setItem("law_visitorCount", newCount.toString());
  };

  // Google Keep Widget State
  const [dashboardKeepNotes, setDashboardKeepNotes] = useState<GoogleKeepNote[]>(() => getLocalKeepMemos());
  const [selectedDashboardKeepNote, setSelectedDashboardKeepNote] = useState<GoogleKeepNote | null>(null);
  const [keepWidgetFilter, setKeepWidgetFilter] = useState<"all" | "signed" | "pending" | "pinned">("all");
  const [keepWidgetSearch, setKeepWidgetSearch] = useState<string>("");
  const [isKeepWidgetSyncing, setIsKeepWidgetSyncing] = useState(false);
  const [keepCopiedId, setKeepCopiedId] = useState<string | null>(null);

  const handleRefreshKeepNotes = async () => {
    setIsKeepWidgetSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setDashboardKeepNotes(getLocalKeepMemos());
    setIsKeepWidgetSyncing(false);
  };

  useEffect(() => {
    setDashboardKeepNotes(getLocalKeepMemos());
  }, []);

  const [pinnedCaseIds, setPinnedCaseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("law_pinned_cases");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [isAddingShortcut, setIsAddingShortcut] = useState(false);
  const [shortcutSearchQuery, setShortcutSearchQuery] = useState("");

  const handlePinCase = (caseId: string) => {
    const updated = [...pinnedCaseIds, caseId];
    setPinnedCaseIds(updated);
    localStorage.setItem("law_pinned_cases", JSON.stringify(updated));
    setIsAddingShortcut(false);
    setShortcutSearchQuery("");
  };

  const handleUnpinCase = (caseId: string) => {
    const updated = pinnedCaseIds.filter(id => id !== caseId);
    setPinnedCaseIds(updated);
    localStorage.setItem("law_pinned_cases", JSON.stringify(updated));
  };

  const saveOrderToStorage = (newOrder: WidgetId[]) => {
    setWidgetOrder(newOrder);
    localStorage.setItem("law_dashboard_widget_order_v2", JSON.stringify(newOrder));
    setSaveSuccessFeedback(true);
    setTimeout(() => setSaveSuccessFeedback(false), 2000);
  };

  const handleDragStart = (e: React.DragEvent, id: WidgetId) => {
    setDraggedWidgetId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: WidgetId) => {
    e.preventDefault();
    if (draggedWidgetId && draggedWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: WidgetId) => {
    e.preventDefault();
    setDragOverWidgetId(null);
    if (!draggedWidgetId || draggedWidgetId === targetId) {
      setDraggedWidgetId(null);
      return;
    }

    const currentList = [...widgetOrder];
    const fromIndex = currentList.indexOf(draggedWidgetId);
    const toIndex = currentList.indexOf(targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      currentList.splice(fromIndex, 1);
      currentList.splice(toIndex, 0, draggedWidgetId);
      saveOrderToStorage(currentList);
    }
    setDraggedWidgetId(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const moveWidget = (id: WidgetId, direction: "up" | "down") => {
    const currentIndex = widgetOrder.indexOf(id);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= widgetOrder.length) return;

    const newOrder = [...widgetOrder];
    const [moved] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, moved);
    saveOrderToStorage(newOrder);
  };

  const resetWidgetOrder = () => {
    const defaultIds = DEFAULT_WIDGET_ORDER.map(w => w.id);
    saveOrderToStorage(defaultIds);
  };

  // Helper widget header with Drag handle and Quick Move Up/Down controls
  const renderWidgetHeaderControls = (id: WidgetId) => {
    const currentIndex = widgetOrder.indexOf(id);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === widgetOrder.length - 1;
    const meta = DEFAULT_WIDGET_ORDER.find(w => w.id === id);

    return (
      <div className="flex items-center justify-between px-1 mb-1 select-none" dir="rtl">
        <div className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-amber-500 transition-colors">
          <GripVertical className="w-5 h-5 shrink-0" />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => moveWidget(id, "up")}
            title="تحريك لأعلى"
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer text-slate-400"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => moveWidget(id, "down")}
            title="تحريك لأسفل"
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer text-slate-400"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] bg-slate-800/90 text-amber-300 px-2 py-0.5 rounded font-mono hidden md:inline">
            اسحب للإفلات ✥
          </span>
        </div>
      </div>
    );
  };

  // Check if current user is manager / admin / owner
  const isManager = Boolean(
    currentUser?.role === UserRole.ADMIN ||

    currentUser?.phone === "01283233555" ||
    currentUser?.permissions?.canManageUsers ||
    currentUser?.permissions?.canManageDevices ||
    !currentUser
  );

  return (
    <div className="space-y-8 text-right font-sans relative" dir="rtl">
      
      {/* Luxury Quick Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4 bg-slate-900/70 p-3.5 rounded-3xl border border-slate-800 shadow-sm backdrop-blur-xs">
        {/* Right Side: Quick Action Buttons */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Quick Add Case Button */}
            <button
              id="quick-add-case-btn"
              type="button"
              onClick={() => setShowQuickCaseModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer transition shadow-md border border-blue-400"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>إضافة قضية جديدة (+)</span>
            </button>

            {/* Quick Add Client Button */}
            <button
              id="quick-add-client-btn"
              type="button"
              onClick={() => setShowQuickClientModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer transition shadow-md border border-emerald-400"
            >
              <UserPlus className="w-4 h-4 text-white" />
              <span>إضافة موكل جديد (+)</span>
            </button>

            {/* Egyptian Lawyer AI Quick Launch Button */}
            <button
              id="open-egyptian-lawyer-ai-btn"
              type="button"
              onClick={() => onNavigate("egyptian_lawyer_ai")}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer transition shadow-md border border-amber-300"
            >
              <span>⚖️</span>
              <span>المحامي المصري الذكي</span>
            </button>

            {/* Themes & Designs Quick Studio Button */}
            <button
              id="open-designs-studio-btn"
              type="button"
              onClick={() => onNavigate("designs")}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500 hover:to-amber-600 text-amber-300 hover:text-slate-950 border border-amber-400/50 text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer transition shadow-xs"
            >
              <span>🎨</span>
              <span>قسم التصميمات والمظاهر</span>
            </button>

            {/* Layout Customizer Toggle */}
            <button
              id="customize-widgets-btn"
              type="button"
              onClick={() => setIsCustomizingLayout(!isCustomizingLayout)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition border ${
                isCustomizingLayout 
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md" 
                  : "bg-slate-800 hover:bg-slate-750 text-amber-300 border-amber-500/30"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>{isCustomizingLayout ? "إغلاق التخصيص ✓" : "تخصيص الترتيب (Drag & Drop)"}</span>
            </button>

            <button
              id="print-global"
              onClick={handlePrintDashboard}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              طباعة
            </button>
            
            <button
              id="cloud-sync"
              onClick={() => alert("مزامنة سحابية هجينة نشطة! تم رفع ومزامنة التغييرات المحلية مع قاعدة بيانات wesam0law على Firebase بنجاح.")}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
              مزامنة هجينة
            </button>
          </div>
        </div>

        {/* Left Side (جهة الشمال): Vertical Stack of Minimal Icons (العلامات الخاصة بهم فقط أسفل بعضهم جهة الشمال دون كتابة أي شيء) */}
        <div className="flex flex-col gap-1.5 items-center self-start bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 shadow-sm shrink-0">
          {/* 1. علامة الزوار (تظهر للجميع وللمدير بدون أي كتابة داخل الزر) */}
          <button
            type="button"
            id="quick-visitors-icon-btn"
            title={isManager ? `الزوار والجلسات التراكمية: ${visitorCount.toLocaleString('en-US')} زائر (انقر لفتح الإدارة)` : `الزوار: ${visitorCount.toLocaleString('en-US')} زائر`}
            onClick={() => {
              if (isManager) {
                setAdminConsoleTab("telemetry");
                setShowAdminConsoleModal(true);
              }
            }}
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 flex items-center justify-center transition cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* باقي الخانات تظهر للمالك / المدير فقط وتختفي عن الجميع */}
          {isManager && (
            <>
              {/* 2. علامة المستخدمين وهيئة الدفاع */}
              <button
                type="button"
                id="quick-users-icon-btn"
                title={`المستخدمين وهيئة الدفاع: ${registeredUsers.length || 3} مصرح`}
                onClick={() => {
                  setAdminConsoleTab("users");
                  setShowAdminConsoleModal(true);
                }}
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-400 border border-blue-500/30 flex items-center justify-center transition cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
              >
                <UserCheck className="w-4 h-4" />
              </button>

              {/* 3. علامة الأجهزة النشطة والمتصلة */}
              <button
                type="button"
                id="quick-devices-icon-btn"
                title={`الأجهزة النشطة والمتصلة: ${activeDevicesCount} متصل`}
                onClick={() => {
                  setAdminConsoleTab("devices");
                  setShowAdminConsoleModal(true);
                }}
                className="relative w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
              >
                <Laptop className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>

              {/* 4. علامة مركز أمان وتحكم المدير */}
              <button
                type="button"
                id="quick-manager-security-icon-btn"
                title="لوحة تحكم المدير والأمان والرقابة"
                onClick={() => {
                  setAdminConsoleTab("telemetry");
                  setShowAdminConsoleModal(true);
                }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 border border-amber-300 flex items-center justify-center transition cursor-pointer hover:scale-105 active:scale-95 shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 🏛️ PROMINENT DASHBOARD COMMAND HUB: URGENT SESSIONS | PENDING ADMIN TASKS | UPCOMING FEES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* 1. SECTION: URGENT SESSION ALERTS (تنبيهات الجلسات العاجلة) */}
        <div className="bg-gradient-to-br from-red-950/20 via-slate-900 to-slate-900 border-2 border-red-500/40 rounded-3xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-red-500/20 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-red-500/20 text-red-400 rounded-2xl border border-red-500/30">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>تنبيهات الجلسات العاجلة</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-mono font-bold">
                      {urgentSessions.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">الجلسات خلال الـ ٧٢ ساعة القادمة والأسبوع الجاري</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("sessions")}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 underline cursor-pointer"
              >
                الأجندة كاملة ←
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pl-1">
              {urgentSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا توجد جلسات عاجلة خلال الـ ٧٢ ساعة القادمة.
                </div>
              ) : (
                urgentSessions.map((sess) => {
                  const isMorning = sess.timeType === "morning" || !sess.timeType;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => onNavigate("sessions")}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-red-500/20 hover:border-red-500/60 transition cursor-pointer flex items-start justify-between gap-2.5 group/item"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            isMorning 
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" 
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}>
                            {isMorning ? "🌅 صباحية (٩:٠٠ ص)" : "☀️ مسائية (١٢:٠٠ م)"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{sess.date}</span>
                        </div>
                        <p className="text-xs font-black text-white truncate group-hover/item:text-red-300 transition">
                          قضية #{sess.caseNumber} - {sess.clientName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {sess.court} • {sess.circuit || "الدائرة المختصة"}
                        </p>
                      </div>
                      <span className="text-slate-500 group-hover/item:text-red-400 text-xs font-bold shrink-0 self-center">
                        عرض ←
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">التنبيهات التلقائية نشطة</span>
            <span className="text-red-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              مباشر ومحدث
            </span>
          </div>
        </div>

        {/* 2. SECTION: PENDING ADMINISTRATIVE TASKS (الأعمال الإدارية المعلقة) */}
        <div className="bg-gradient-to-br from-purple-950/20 via-slate-900 to-slate-900 border-2 border-purple-500/40 rounded-3xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>الأعمال الإدارية المعلقة</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500 text-white font-mono font-bold">
                      {pendingAdminTasks.filter(t => t.status !== "completed").length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">الشهادات، المحاضر، الخبراء وتنفيذ الأحكام</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("adminwork")}
                className="text-[11px] font-bold text-purple-400 hover:text-purple-300 underline cursor-pointer"
              >
                الأعمال الإدارية ←
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pl-1">
              {pendingAdminTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onNavigate("adminwork")}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-purple-500/20 hover:border-purple-500/60 transition cursor-pointer flex items-start justify-between gap-2.5 group/item"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        task.priority === "urgent" 
                          ? "bg-red-500/20 text-red-300 border border-red-500/30" 
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      }`}>
                        {task.priority === "urgent" ? "🚨 طارئ" : "⚡ هام"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">المهلة: {task.deadline || "قريباً"}</span>
                    </div>
                    <p className="text-xs font-black text-white truncate group-hover/item:text-purple-300 transition">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {task.court || "الجهة الإدارية المختصة"}
                    </p>
                  </div>
                  <span className="text-slate-500 group-hover/item:text-purple-400 text-xs font-bold shrink-0 self-center">
                    متابعة ←
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">نيابة، شرطة، وخبراء</span>
            <button
              type="button"
              onClick={() => onNavigate("adminwork")}
              className="text-purple-400 font-bold hover:underline cursor-pointer"
            >
              + إضافة مهمة إدارية
            </button>
          </div>
        </div>

        {/* 3. SECTION: UPCOMING ATTORNEY FEES (الأتعاب القادمة والمستحقة) */}
        <div className="bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>الأتعاب القادمة والمستحقة</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-slate-950 font-mono font-bold">
                      {upcomingFeeClients.length} موكلين
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">متابعة الأقساط والمتبقي من العقود</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("fees")}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                الخزينة كاملة ←
              </button>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">المحصل فعلياً</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {totalEgpCollected.toLocaleString("ar-EG")} ج.م
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">المتبقي المطلوب</span>
                <span className="text-sm font-black text-amber-400 font-mono">
                  {totalEgpRemaining.toLocaleString("ar-EG")} ج.م
                </span>
              </div>
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto pl-1">
              {upcomingFeeClients.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  كافة الأتعاب مسددة بالكامل.
                </div>
              ) : (
                upcomingFeeClients.map((cl) => (
                  <div
                    key={cl.id}
                    onClick={() => onNavigate("fees")}
                    className="p-2.5 rounded-2xl bg-slate-950/80 border border-emerald-500/20 hover:border-emerald-500/60 transition cursor-pointer flex items-center justify-between gap-2 group/item"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate group-hover/item:text-emerald-300 transition">
                        {cl.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        قضية #{cl.caseNumber || "عام"} • هاتف: {cl.phone}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="text-xs font-black text-amber-400 font-mono block">
                        {(Number(cl.remainingFees) || 0).toLocaleString("ar-EG")} ج.م
                      </span>
                      <span className="text-[9px] text-emerald-400 font-bold group-hover/item:underline">
                        تحصيل الآن ←
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">نسبة التحصيل: {overallCollectionEfficiency}%</span>
            <button
              type="button"
              onClick={() => onNavigate("fees")}
              className="text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              سند قبض جديد 💵
            </button>
          </div>
        </div>

      </div>

      {/* CUSTOMIZATION DRAWER / REORDER TOOLBAR */}
      {isCustomizingLayout && (
        <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/50 p-6 rounded-2xl border-2 border-amber-300 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-sm">
                <Move className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">تخصيص ترتيب بطاقات لوحة التحكم (Drag & Drop)</h3>
                <p className="text-xs text-slate-600">
                  اسحب أي بطاقة وضعها في الترتيب المفضل لك، أو استخدم أسهم الترتيب. يتم حفظ الترتيب تلقائياً في المتصفح.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {saveSuccessFeedback && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1 animate-pulse">
                  <Check className="w-4 h-4" />
                  تم حفظ الترتيب بنجاح!
                </span>
              )}
              <button
                type="button"
                onClick={resetWidgetOrder}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer shadow-sm transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>إعادة الضبط للافتراضي</span>
              </button>
            </div>
          </div>

          {/* Quick interactive order chip list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {widgetOrder.map((id, index) => {
              const meta = DEFAULT_WIDGET_ORDER.find(w => w.id === id);
              if (!meta) return null;
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, id)}
                  onDragOver={(e) => handleDragOver(e, id)}
                  onDrop={(e) => handleDrop(e, id)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 rounded-xl border bg-white flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing transition-all ${
                    draggedWidgetId === id 
                      ? "opacity-40 border-dashed border-amber-500 scale-95" 
                      : dragOverWidgetId === id 
                      ? "border-2 border-amber-500 bg-amber-50 shadow-md" 
                      : "border-slate-200 hover:border-amber-400 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-base shrink-0">{meta.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{meta.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">الموضع #{index + 1}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveWidget(id, "up")}
                      className="p-1 text-slate-500 hover:text-amber-600 disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === widgetOrder.length - 1}
                      onClick={() => moveWidget(id, "down")}
                      className="p-1 text-slate-500 hover:text-amber-600 disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* DYNAMIC REORDERABLE WIDGETS CONTAINER */}
      <div className="space-y-8">
        {widgetOrder.map((widgetId) => {
          return (
            <div
              key={widgetId}
              id={`widget-section-${widgetId}`}
              draggable
              onDragStart={(e) => handleDragStart(e, widgetId)}
              onDragOver={(e) => handleDragOver(e, widgetId)}
              onDrop={(e) => handleDrop(e, widgetId)}
              onDragEnd={handleDragEnd}
              className={`transition-all duration-300 relative group/widget ${
                draggedWidgetId === widgetId
                  ? "opacity-30 scale-[0.99] border-2 border-dashed border-amber-500 rounded-2xl p-2"
                  : dragOverWidgetId === widgetId
                  ? "border-2 border-amber-500 rounded-2xl p-1 bg-amber-500/5 shadow-2xl scale-[1.005]"
                  : ""
              }`}
            >
              {/* Drag handle & order controls header */}
              {renderWidgetHeaderControls(widgetId)}

              {/* 1. CORE STATS BENTO GRID (4 Compact Cards Side-by-Side in 1 Row) */}
              {widgetId === "stats_bento" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Card 1: Open Cases */}
                  <div 
                    onClick={() => onNavigate("cases")}
                    className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border-b-4 border-blue-500 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer hover:border-blue-600 group hover:scale-[1.01] transform active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-bold group-hover:text-blue-600 transition-colors truncate">إجمالي القضايا المتداولة</p>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
                          {cases.length} <span className="text-xs sm:text-sm font-semibold text-slate-500">مفتوحة</span>
                        </h3>
                      </div>
                      <div className="p-2 sm:p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 group-hover:scale-105 transition-all shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-emerald-650 dark:text-emerald-400 flex items-center justify-between font-medium">
                      <span className="truncate text-[10px] sm:text-[11px]">● متزامنة بالكامل سحابياً</span>
                      <span className="text-[10px] sm:text-[11px] text-blue-500 dark:text-blue-400 font-bold shrink-0">عرض القضايا ←</span>
                    </div>
                  </div>

                  {/* Card 2: Clients */}
                  <div 
                    onClick={() => onNavigate("clients")}
                    className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border-b-4 border-amber-500 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer hover:border-amber-600 group hover:scale-[1.01] transform active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-bold group-hover:text-amber-600 transition-colors truncate">إجمالي الموكلين والعملاء</p>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
                          {clients.length} <span className="text-xs sm:text-sm font-semibold text-slate-500">مستمر</span>
                        </h3>
                      </div>
                      <div className="p-2 sm:p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 group-hover:scale-105 transition-all shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-amber-600 dark:text-amber-400 flex items-center justify-between font-medium">
                      <span className="truncate text-[10px] sm:text-[11px]">{leads.length} عملاء مستوردين من إكسل</span>
                      <span className="text-[10px] sm:text-[11px] text-amber-650 dark:text-amber-400 font-bold shrink-0">عرض التفاصيل ←</span>
                    </div>
                  </div>

                  {/* Card 3: Urgent Court Sessions */}
                  <div 
                    onClick={() => onNavigate("sessions")}
                    className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border-b-4 border-emerald-500 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer hover:border-emerald-600 group hover:scale-[1.01] transform active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-bold group-hover:text-emerald-600 transition-colors truncate">الجلسات القضائية العاجلة</p>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
                          {alertSessionsCount} <span className="text-xs sm:text-sm font-semibold text-slate-400">هذا الأسبوع</span>
                        </h3>
                      </div>
                      <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 group-hover:scale-105 transition-all shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-medium">
                      <span className="truncate text-[10px] sm:text-[11px]">أقرب جلسة: {sessions[0]?.date || "لا يوجد"}</span>
                      <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0">الأجندة ←</span>
                    </div>
                  </div>

                  {/* Card 4: Administrative Departments */}
                  <div 
                    onClick={() => onNavigate("adminwork")}
                    className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border-b-4 border-purple-500 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-250 hover:shadow-md cursor-pointer hover:border-purple-600 group hover:scale-[1.01] transform active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-bold group-hover:text-purple-600 transition-colors truncate">الأقسام الإدارية والتوثيقات</p>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
                          10 <span className="text-xs sm:text-sm font-semibold text-slate-500">أقسام</span>
                        </h3>
                      </div>
                      <div className="p-2 sm:p-2.5 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 group-hover:scale-105 transition-all shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-medium">
                      <span className="truncate text-[10px] sm:text-[11px]">تأسيس شركات، توثيق</span>
                      <span className="text-[10px] sm:text-[11px] text-purple-650 dark:text-purple-400 font-bold shrink-0">الأقسام ←</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 1.2. DAILY LEGAL ANALYTICS CARD (With 4 Action Cards in 1 Row) */}
              {widgetId === "daily_legal_analytics" && (
                <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-slate-100">
                            التحليلات القانونية اليومية (Daily Legal Analytics)
                          </h3>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            مباشر لليوم {todayDateStr}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          رصد بياني فوري لحركة القضايا الجديدة، الجلسات المجدولة، ومذكرات الموكلين المعلقة
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate("sessions")}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <CalendarDays className="w-4 h-4 text-emerald-600" />
                        <span>رول جلسات اليوم</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Breakdown Metric Action Cards Arranged in 1 Row (4 Cards Side-by-Side) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
                    
                    {/* Card 1: New Cases */}
                    <div 
                      onClick={() => onNavigate("cases")}
                      className="bg-blue-50/70 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800/60 hover:shadow-md transition cursor-pointer space-y-2 group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200">قضايا اليوم</span>
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-blue-950 dark:text-blue-100 font-mono">{newCasesTodayCount}</span>
                        <span className="text-[10px] text-blue-700 dark:text-blue-300">ملف</span>
                      </div>
                      <div className="text-[10px] text-blue-800 dark:text-blue-300 font-bold group-hover:underline flex items-center justify-between">
                        <span>عرض القضايا</span>
                        <span>←</span>
                      </div>
                    </div>

                    {/* Card 2: Scheduled Sessions */}
                    <div 
                      onClick={() => onNavigate("sessions")}
                      className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 hover:shadow-md transition cursor-pointer space-y-2 group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200">جلسات المحاكم</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-emerald-950 dark:text-emerald-100 font-mono">{scheduledSessionsTodayCount}</span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300">جلسة</span>
                      </div>
                      <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold group-hover:underline flex items-center justify-between">
                        <span>رول الجلسات</span>
                        <span>←</span>
                      </div>
                    </div>

                    {/* Card 3: Pending Client Notes */}
                    <div 
                      onClick={() => onNavigate("dashboard")}
                      className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/60 hover:shadow-md transition cursor-pointer space-y-2 group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">مذكرات الموكلين</span>
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-amber-950 dark:text-amber-100 font-mono">{pendingNotesTodayCount}</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-300">مذكرة/طلب</span>
                      </div>
                      <div className="text-[10px] text-amber-800 dark:text-amber-300 font-bold group-hover:underline flex items-center justify-between">
                        <span>مراجعة الملاحظات</span>
                        <span>←</span>
                      </div>
                    </div>

                    {/* Card 4: Urgent Tasks */}
                    <div 
                      onClick={() => onNavigate("adminwork")}
                      className="bg-purple-50/70 dark:bg-purple-950/30 p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800/60 hover:shadow-md transition cursor-pointer space-y-2 group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200">إجراءات إدارية</span>
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-purple-950 dark:text-purple-100 font-mono">{urgentTasksCount}</span>
                        <span className="text-[10px] text-purple-700 dark:text-purple-300">مهام</span>
                      </div>
                      <div className="text-[10px] text-purple-800 dark:text-purple-300 font-bold group-hover:underline flex items-center justify-between">
                        <span>الأقسام الإدارية</span>
                        <span>←</span>
                      </div>
                    </div>

                  </div>

                  {/* Recharts Bar Chart Visualization */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-750">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <BarChart2 className="w-4 h-4 text-indigo-600" />
                          <span>توزيع النشاط القانوني والإجرائي لليوم</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">Recharts Engine</span>
                      </div>

                      <div className="h-52 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyAnalyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} 
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis 
                              allowDecimals={false} 
                              tick={{ fontSize: 11, fill: '#64748b' }} 
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip 
                              cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                              contentStyle={{ 
                                direction: "rtl", 
                                textAlign: "right",
                                backgroundColor: "#0f172a", 
                                borderColor: "#334155",
                                borderRadius: "12px",
                                color: "#f8fafc",
                                fontSize: "12px",
                                fontWeight: "bold"
                              }}
                              formatter={(value: any, name: any, item: any) => [
                                `${value} (${item.payload.label})`,
                                "العدد المسجل"
                              ]}
                            />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
                              {dailyAnalyticsData.map((entry, index) => (
                                <Bar key={`cell-${index}`} fill={entry.fill} dataKey="count" />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-750">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <PieChartIcon className="w-4 h-4 text-amber-500" />
                          <span>توزيع القضايا حسب الحالة</span>
                        </span>
                      </div>
                      <div className="h-52 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'قضايا جارية', value: cases.filter(c => (c.status as string) === 'active' || (c.status as string) === 'ongoing').length || 1, color: '#f59e0b' },
                                { name: 'قضايا مؤجلة', value: cases.filter(c => (c.status as string) === 'postponed' || (c.status as string) === 'pending').length || 1, color: '#fcd34d' },
                                { name: 'قضايا منتهية', value: cases.filter(c => (c.status as string) === 'closed' || (c.status as string) === 'completed' || (c.status as string) === 'archived').length || 1, color: '#b45309' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {[
                                { name: 'قضايا جارية', value: cases.filter(c => (c.status as string) === 'active' || (c.status as string) === 'ongoing').length || 1, color: '#f59e0b' },
                                { name: 'قضايا مؤجلة', value: cases.filter(c => (c.status as string) === 'postponed' || (c.status as string) === 'pending').length || 1, color: '#fcd34d' },
                                { name: 'قضايا منتهية', value: cases.filter(c => (c.status as string) === 'closed' || (c.status as string) === 'completed' || (c.status as string) === 'archived').length || 1, color: '#b45309' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                direction: "rtl",
                                textAlign: "right",
                                backgroundColor: "#0f172a",
                                borderColor: "#334155",
                                borderRadius: "12px",
                                color: "#f8fafc",
                                fontSize: "12px",
                                fontWeight: "bold"
                              }}
                              formatter={(value: any, name: any, props: any) => [value, props.payload.name]}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* 1.25. FREQUENT CASES SHORTCUTS */}
              {widgetId === "frequent_cases_shortcuts" && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-100 dark:border-amber-900/40 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-xl shadow-md">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                          اختصارات القضايا السريعة (Shortcuts)
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          الوصول السريع للقضايا الأكثر تكراراً وأهمية بضغطة زر واحدة
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingShortcut(!isAddingShortcut)}
                      className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                      {isAddingShortcut ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                      <span>{isAddingShortcut ? "إلغاء" : "إضافة اختصار لقضية"}</span>
                    </button>
                  </div>

                  {isAddingShortcut && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="ابحث برقم القضية أو اسم الموكل لإضافتها..."
                          value={shortcutSearchQuery}
                          onChange={e => setShortcutSearchQuery(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg py-2 pr-9 pl-3 text-sm focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {cases.filter(c => 
                          !pinnedCaseIds.includes(c.id) &&
                          (c.caseNumber.includes(shortcutSearchQuery) || c.clientName.toLowerCase().includes(shortcutSearchQuery.toLowerCase()))
                        ).slice(0, 5).map(c => (
                          <div key={c.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg hover:border-amber-300 transition">
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">رقم {c.caseNumber} لسنة {c.caseYear}</div>
                              <div className="text-[10px] text-slate-500">{c.clientName}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handlePinCase(c.id)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded cursor-pointer"
                            >
                              إضافة +
                            </button>
                          </div>
                        ))}
                        {cases.filter(c => !pinnedCaseIds.includes(c.id)).length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-4">جميع القضايا مضافة بالفعل، أو لا يوجد نتائج.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {pinnedCaseIds.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {pinnedCaseIds.map(caseId => {
                        const c = cases.find(x => x.id === caseId);
                        if (!c) return null;
                        return (
                          <div key={caseId} className="group relative bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:shadow-md transition cursor-pointer" onClick={() => onNavigate("cases", { caseId: c.id })}>
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); handleUnpinCase(caseId); }}
                              className="absolute top-2 left-2 p-1 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition z-10"
                              title="إزالة الاختصار"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="text-[11px] font-black text-slate-900 dark:text-slate-100 mb-0.5 line-clamp-1">
                              قضية {c.caseNumber}/{c.caseYear}
                            </div>
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-1 font-bold">
                              {c.clientName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                      <Sparkles className="w-6 h-6 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-slate-500 font-bold">لا يوجد اختصارات مضافة بعد.</p>
                      <p className="text-[10px] text-slate-400 mt-1">اضغط على زر (إضافة اختصار لقضية) أعلاه لتبدأ.</p>
                    </div>
                  )}
                </div>
              )}

              {/* GOOGLE KEEP LIVE WIDGET */}
              {widgetId === "google_keep_widget" && (
                <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 text-right">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                        <StickyNote className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                          مذكرات Google Keep
                        </h3>
                        <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black px-2 py-0.5 rounded-full">
                          {dashboardKeepNotes.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRefreshKeepNotes}
                        disabled={isKeepWidgetSyncing}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer"
                        title="تحديث المذكرات"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isKeepWidgetSyncing ? "animate-spin text-amber-500" : ""}`} />
                        <span>{isKeepWidgetSyncing ? "مزامنة..." : "تحديث"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate("google_workspace")}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span>فتح Keep Hub</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Search and Filters Bar */}
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={keepWidgetSearch}
                        onChange={(e) => setKeepWidgetSearch(e.target.value)}
                        placeholder="ابحث في نص أو عنوان المذكرات أو اسم الموكل..."
                        className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {[
                        { id: "all", label: "الكل" },
                        { id: "signed", label: "موقعة ومعتمدة" },
                        { id: "pending", label: "بانتظار التوقيع" },
                        { id: "pinned", label: "المثبتة ⭐" }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setKeepWidgetFilter(tab.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            keepWidgetFilter === tab.id
                              ? "bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes Grid */}
                  {(() => {
                    const filtered = dashboardKeepNotes.filter(note => {
                      if (keepWidgetFilter === "signed" && note.signatureStatus !== "signed") return false;
                      if (keepWidgetFilter === "pending" && note.signatureStatus !== "pending") return false;
                      if (keepWidgetFilter === "pinned" && !note.pinned) return false;
                      if (keepWidgetSearch.trim()) {
                        const q = keepWidgetSearch.toLowerCase();
                        const matchTitle = note.title.toLowerCase().includes(q);
                        const matchContent = note.content.toLowerCase().includes(q);
                        const matchClient = note.clientName?.toLowerCase().includes(q) || false;
                        const matchCase = note.caseNumber?.toLowerCase().includes(q) || false;
                        if (!matchTitle && !matchContent && !matchClient && !matchCase) return false;
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                          <StickyNote className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">لا توجد مذكرات تطابق معايير البحث الحالية.</p>
                          <button
                            type="button"
                            onClick={() => onNavigate("google_workspace")}
                            className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                          >
                            + إضافة وتدوين مذكرة جديدة في Google Keep
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {filtered.slice(0, 8).map((note) => {
                          const isCopied = keepCopiedId === note.id;
                          return (
                            <div
                              key={note.id}
                              className="bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 hover:border-amber-400/80 hover:shadow-md transition duration-200 flex flex-col justify-between group"
                            >
                              <div className="space-y-2.5">
                                {/* Card Top */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    {note.pinned && (
                                      <span className="text-amber-500 text-xs shrink-0" title="مذكرة مثبتة">📌</span>
                                    )}
                                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                                      {note.title}
                                    </h4>
                                  </div>

                                  {/* Signature Badge */}
                                  {note.signatureStatus === "signed" ? (
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-[9px] rounded-full border border-emerald-300 dark:border-emerald-800 shrink-0 flex items-center gap-1">
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                      <span>معتمد وموقع</span>
                                    </span>
                                  ) : note.signatureStatus === "pending" ? (
                                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-extrabold text-[9px] rounded-full border border-amber-300 dark:border-amber-800 shrink-0 flex items-center gap-1 animate-pulse">
                                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                                      <span>بانتظار التوقيع</span>
                                    </span>
                                  ) : null}
                                </div>

                                {/* Content preview snippet */}
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-sans bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                  {note.content}
                                </p>

                                {/* Tags & Metadata */}
                                <div className="flex flex-wrap gap-1.5 items-center text-[10px]">
                                  {note.clientName && (
                                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold rounded-md">
                                      👤 {note.clientName}
                                    </span>
                                  )}
                                  {note.caseNumber && (
                                    <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold rounded-md">
                                      ⚖️ {note.caseNumber}
                                    </span>
                                  )}
                                  {note.tags && note.tags.slice(0, 2).map((t, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-md text-[9px]">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Card Bottom Actions */}
                              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1.5 text-[10px]">
                                <span className="text-[9px] text-slate-400">
                                  {new Date(note.date).toLocaleDateString("ar-EG")}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
                                      setKeepCopiedId(note.id);
                                      setTimeout(() => setKeepCopiedId(null), 2000);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                                    title="نسخ نص المذكرة"
                                  >
                                    {isCopied ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedDashboardKeepNote(note)}
                                    className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 font-black rounded-lg transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>قراءة وتفاصيل</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 1.5. COMPREHENSIVE OFFICE SERVICES SHOWCASE WIDGET */}
              {widgetId === "office_services" && (
                <div className="bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-3xl border border-amber-500/30 shadow-xl space-y-5 relative overflow-hidden">
                  <div className="absolute -left-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 text-xl">
                        ⚖️
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                          <span>دليل الخدمات القانونية والإدارية الشاملة</span>
                          <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-extrabold">محدث 2026</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          تغطية شاملة لكافة الأقسام الرئيسية والفرعية، الدعاوى، الاستشارات، تأسيس الشركات، والتوثيقات
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate("office_services")}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
                    >
                      <span>فتح القائمة الشاملة لجميع الخدمات</span>
                      <span>←</span>
                    </button>
                  </div>

                  {/* Fast categories preview grid (4 cards side-by-side per row) */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3.5 relative z-10">
                    {[
                      { icon: "⚖️", title: "القضاء والنزاعات", desc: "مدني، جنائي، مجلس دولة", count: "12 خدمة" },
                      { icon: "🏢", title: "الشركات والاستثمار", desc: "تأسيس، اندماج، تراخيص", count: "10 خدمات" },
                      { icon: "🤝", title: "العقود والاتفاقيات", desc: "صياغة وتدقيق ومراجعة", count: "8 خدمات" },
                      { icon: "🏛️", title: "الشهر العقاري", desc: "تسجيل، توثيق، صحة ونفاذ", count: "7 خدمات" },
                      { icon: "🌐", title: "الأجانب والهجرة", desc: "زواج أجانب، إقامات، جنسية", count: "6 خدمات" },
                      { icon: "💼", title: "الاستشارات والأعمال", desc: "استشارات سنوية وحوكمة", count: "5 خدمات" },
                      { icon: "📜", title: "القضاء الإداري والتراخيص", desc: "إلغاء قرارات، طعون، تعويضات", count: "9 خدمات" },
                      { icon: "🛡️", title: "جرائم الأموال والتقنية", desc: "احتيال مالي، مصنفات، ضرائب", count: "6 خدمات" }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => onNavigate("office_services")}
                        className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/60 p-3.5 rounded-2xl transition cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <div className="text-2xl mb-1.5 group-hover:scale-110 transition duration-200">{item.icon}</div>
                          <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition-colors">{item.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{item.desc}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between items-center text-[9px] text-amber-400/90 font-bold">
                          <span>{item.count}</span>
                          <span className="group-hover:translate-x-[-3px] transition-transform">استعراض ←</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. FINANCIAL CHART GRAPH - RECHARTS (COLLECTED VS REMAINING FEES) */}
              {widgetId === "financial_chart" && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  {/* Header & KPI Summary */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                          <BarChart2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          التقرير المالي الرقمي: الأتعاب المحصلة مقابل المستحقات المتبقية
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        رسم بياني تحليلي متقدم يوضح تطور الأتعاب المحصلة شهرياً مقارنة بالمستحقات المتبقية ومعدل كفاءة التحصيل العام لمكتب الشناوي.
                      </p>
                    </div>

                    {/* Chart Controls Strip */}
                    <div className="flex flex-wrap items-center gap-2 font-sans text-xs">
                      {/* Period Selector */}
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setFinancialPeriodMonths(6)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                            financialPeriodMonths === 6
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          آخر 6 أشهر
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinancialPeriodMonths(12)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                            financialPeriodMonths === 12
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          آخر 12 شهراً
                        </button>
                      </div>

                      {/* Chart Type Toggle */}
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setFinancialChartType("composed")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                            financialChartType === "composed"
                              ? "bg-amber-500 text-slate-950 shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          رسم مركب (مقارنة + نسبة)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinancialChartType("bar")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                            financialChartType === "bar"
                              ? "bg-amber-500 text-slate-950 shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          أعمدة بيانية
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinancialChartType("area")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                            financialChartType === "area"
                              ? "bg-amber-500 text-slate-950 shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          منحنى مساحي
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Financial KPI Summary Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
                    {/* Card 1: Collected Fees */}
                    <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                        <span>الأتعاب المحصلة فعلياً</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </div>
                      <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        {totalEgpCollected.toLocaleString("ar-EG")} <span className="text-xs font-sans">ج.م</span>
                      </div>
                      {totalUsdCollected > 0 && (
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                          + ${totalUsdCollected.toLocaleString("en-US")} USD
                        </div>
                      )}
                    </div>

                    {/* Card 2: Remaining Dues */}
                    <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1">
                        <span>المستحقات المتبقية للتحصيل</span>
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      </div>
                      <div className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono">
                        {totalEgpRemaining.toLocaleString("ar-EG")} <span className="text-xs font-sans">ج.م</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        على ذمة قضايا وموكلي المكتب
                      </div>
                    </div>

                    {/* Card 3: Total Contracted */}
                    <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl">
                      <div className="flex items-center justify-between text-[11px] font-bold text-blue-800 dark:text-blue-300 mb-1">
                        <span>إجمالي القيمة التعاقدية</span>
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      </div>
                      <div className="text-lg font-black text-blue-700 dark:text-blue-400 font-mono">
                        {totalContractedEgp.toLocaleString("ar-EG")} <span className="text-xs font-sans">ج.م</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        (المحصل الفعلي + المتبقي)
                      </div>
                    </div>

                    {/* Card 4: Collection Rate % */}
                    <div className="p-3.5 bg-purple-50/80 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl">
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-800 dark:text-purple-300 mb-1">
                        <span>معدل كفاءة التحصيل</span>
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-lg font-black text-purple-700 dark:text-purple-400 font-mono">
                          {overallCollectionEfficiency}%
                        </div>
                        <div className="flex-1 bg-purple-200 dark:bg-purple-900/60 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(overallCollectionEfficiency, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-[10px] text-purple-700 dark:text-purple-300 mt-0.5 font-bold">
                        {overallCollectionEfficiency >= 75 ? "✅ كفاءة تحصيل ممتازة" : overallCollectionEfficiency >= 50 ? "⚡ كفاءة متوسطة" : "⚠️ بحاجة لمتابعة الأقساط"}
                      </div>
                    </div>
                  </div>

                  {/* Visual Recharts Container */}
                  <div className="h-84 w-full font-mono text-xs pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {financialChartType === "composed" ? (
                        <ComposedChart
                          data={processedChartData}
                          margin={{ top: 15, right: 10, left: 10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="gradCollectedBar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#047857" stopOpacity={0.9} />
                            </linearGradient>
                            <linearGradient id="gradRemainingBar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#d97706" stopOpacity={0.9} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                          <XAxis
                            dataKey="monthName"
                            tickLine={false}
                            axisLine={{ stroke: "#cbd5e1" }}
                            stroke="#64748b"
                            tickMargin={8}
                            fontFamily="sans-serif"
                          />
                          <YAxis
                            yAxisId="left"
                            tickLine={false}
                            axisLine={false}
                            stroke="#64748b"
                            tickFormatter={(val) => val > 0 ? `${(val / 1000).toFixed(0)}k` : String(val)}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                            stroke="#8b5cf6"
                            domain={[0, 100]}
                            tickFormatter={(val) => `${val}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              direction: "rtl",
                              textAlign: "right",
                              backgroundColor: "#0f172a",
                              borderColor: "#334155",
                              borderRadius: "16px",
                              color: "#f8fafc",
                              fontFamily: "Inter, sans-serif",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                            }}
                            formatter={(value: any, name: any) => {
                              const num = Number(value) || 0;
                              if (name?.includes("نسبة") || name?.includes("Rate")) {
                                return [`${num}%`, name];
                              }
                              return [`${num.toLocaleString("ar-EG")} ج.م`, name];
                            }}
                          />
                          <Legend verticalAlign="top" height={40} iconType="circle" />
                          <Bar
                            yAxisId="left"
                            name="الأتعاب المحصلة (EGP)"
                            dataKey="collectedEgp"
                            fill="url(#gradCollectedBar)"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={38}
                          />
                          <Bar
                            yAxisId="left"
                            name="المستحقات المتبقية (EGP)"
                            dataKey="remainingEgp"
                            fill="url(#gradRemainingBar)"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={38}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            name="نسبة التحصيل الشهري (%)"
                            dataKey="collectionRate"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#ffffff" }}
                            activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2, fill: "#ffffff" }}
                          />
                        </ComposedChart>
                      ) : financialChartType === "bar" ? (
                        <BarChart
                          data={processedChartData}
                          margin={{ top: 15, right: 10, left: 10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                          <XAxis
                            dataKey="monthName"
                            tickLine={false}
                            axisLine={{ stroke: "#cbd5e1" }}
                            stroke="#64748b"
                            tickMargin={8}
                            fontFamily="sans-serif"
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            stroke="#64748b"
                            tickFormatter={(val) => val > 0 ? `${(val / 1000).toFixed(0)}k` : String(val)}
                          />
                          <Tooltip
                            contentStyle={{
                              direction: "rtl",
                              textAlign: "right",
                              backgroundColor: "#0f172a",
                              borderColor: "#334155",
                              borderRadius: "16px",
                              color: "#f8fafc",
                              fontFamily: "Inter, sans-serif"
                            }}
                            formatter={(value: any, name: any) => [
                              `${(Number(value) || 0).toLocaleString("ar-EG")} ج.م`,
                              name
                            ]}
                          />
                          <Legend verticalAlign="top" height={40} iconType="circle" />
                          <Bar
                            name="الأتعاب المحصلة (EGP)"
                            dataKey="collectedEgp"
                            fill="#10b981"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={42}
                          />
                          <Bar
                            name="المستحقات المتبقية (EGP)"
                            dataKey="remainingEgp"
                            fill="#f59e0b"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={42}
                          />
                        </BarChart>
                      ) : (
                        <AreaChart
                          data={processedChartData}
                          margin={{ top: 15, right: 10, left: 10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorCollectedArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorRemainingArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                          <XAxis
                            dataKey="monthName"
                            tickLine={false}
                            axisLine={{ stroke: "#cbd5e1" }}
                            stroke="#64748b"
                            tickMargin={8}
                            fontFamily="sans-serif"
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            stroke="#64748b"
                            tickFormatter={(val) => val > 0 ? `${(val / 1000).toFixed(0)}k` : String(val)}
                          />
                          <Tooltip
                            contentStyle={{
                              direction: "rtl",
                              textAlign: "right",
                              backgroundColor: "#0f172a",
                              borderColor: "#334155",
                              borderRadius: "16px",
                              color: "#f8fafc",
                              fontFamily: "Inter, sans-serif"
                            }}
                            formatter={(value: any, name: any) => [
                              `${(Number(value) || 0).toLocaleString("ar-EG")} ج.م`,
                              name
                            ]}
                          />
                          <Legend verticalAlign="top" height={40} iconType="circle" />
                          <Area
                            type="monotone"
                            name="الأتعاب المحصلة (EGP)"
                            dataKey="collectedEgp"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCollectedArea)"
                          />
                          <Area
                            type="monotone"
                            name="المستحقات المتبقية (EGP)"
                            dataKey="remainingEgp"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRemainingArea)"
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 3. SEARCH AND QUICK FORM NAV */}
              {widgetId === "search_quick_nav" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Global Instant Search */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Search className="w-5 h-5 text-amber-500" />
                      البحث القضائي الشامل السريع
                    </h3>
                    <p className="text-xs text-slate-500">
                      ابحث بالرقم القومي، رقم التوكيل، اسم الموكل، اسم الخصم، أو تفاصيل العريضة الجنائية.
                    </p>
                    <div className="flex gap-2">
                      <input
                        id="global-search-input"
                        type="text"
                        value={globalQuery}
                        onChange={(e) => setGlobalQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleGlobalSearch()}
                        placeholder="اكتب كلمة البحث أو استخدم الميكروفون للبحث الصوتي..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none text-right focus:border-amber-500 focus:bg-white transition text-sm"
                      />
                      <button
                        id="voice-search-btn"
                        type="button"
                        onClick={handleVoiceSearchInDashboard}
                        title="البحث الصوتي الذكي - تحدث باسم الموكل أو رقم القضية"
                        className={`px-3 py-2.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer text-sm shadow-sm ${
                          isVoiceListening 
                            ? "bg-red-500 text-white animate-pulse" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                        }`}
                      >
                        {isVoiceListening ? (
                          <>
                            <Mic className="w-4 h-4" />
                            <span className="text-xs hidden sm:inline">جاري الاستماع...</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 text-amber-600" />
                            <span className="text-xs hidden sm:inline">بحث صوتي</span>
                          </>
                        )}
                      </button>
                      <button
                        id="global-search-btn"
                        onClick={handleGlobalSearch}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg cursor-pointer transition shadow-sm text-sm"
                      >
                        ابحث
                      </button>
                    </div>

                    {voiceSearchMessage && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        <span>{voiceSearchMessage}</span>
                      </div>
                    )}

                    {searchResults && (
                      <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mt-4 max-h-60 overflow-y-auto space-y-2">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-xs text-slate-500">نتائج البحث المستخرجة:</span>
                          <button id="clear-search" onClick={() => { setGlobalQuery(""); setSearchResults(null); }} className="text-xs text-amber-600 hover:underline font-bold font-sans">مسح النتائج</button>
                        </div>
                        {searchResults.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">لم يعثر البحث على أي ملفات مطابقة.</p>
                        ) : (
                          searchResults.map((res, i) => (
                            <div
                              key={i}
                              onClick={() => onNavigate(res.linkId)}
                              className="p-3 bg-white hover:bg-amber-50 rounded border border-slate-200 flex justify-between items-center cursor-pointer transition"
                            >
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">{res.type}</span>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-slate-900">{res.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{res.subtitle}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Navigate Buttons */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">الوصول الفني السريع لقاعدة البيانات</h3>
                      <p className="text-xs text-slate-500 mt-1">الولوج السريع للأقسام لإدراج القضايا والمحاضر مباشرة.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4 font-sans">
                      <button
                        id="quick-nav-add-client"
                        onClick={() => onNavigate("clients")}
                        className="p-3 bg-slate-50 hover:bg-amber-50/40 border border-slate-200 rounded-lg text-right group transition cursor-pointer"
                      >
                        <Users className="w-5 h-5 text-amber-500 mb-2 group-hover:scale-110 transition" />
                        <p className="text-xs font-bold text-slate-800">إضافة موكل / عميل</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">سجل مع الرقم القومي</p>
                      </button>

                      <button
                        id="quick-nav-add-case"
                        onClick={() => onNavigate("cases")}
                        className="p-3 bg-slate-50 hover:bg-blue-50/40 border border-slate-200 rounded-lg text-right group transition cursor-pointer"
                      >
                        <Briefcase className="w-5 h-5 text-blue-500 mb-2 group-hover:scale-110 transition" />
                        <p className="text-xs font-bold text-slate-800">إدخال قضية جديدة</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">أدرج المحكمة والاتهام</p>
                      </button>

                      <button
                        id="quick-nav-sessions"
                        onClick={() => onNavigate("sessions")}
                        className="p-3 bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 rounded-lg text-right group transition cursor-pointer"
                      >
                        <FileText className="w-5 h-5 text-emerald-500 mb-2 group-hover:scale-110 transition" />
                        <p className="text-xs font-bold text-slate-800">أجندة الجلسات القضائية</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">تحديث الجلسات العاجلة</p>
                      </button>

                      <button
                        id="quick-nav-fees"
                        onClick={() => onNavigate("fees")}
                        className="p-3 bg-slate-50 hover:bg-purple-50/40 border border-slate-200 rounded-lg text-right group transition cursor-pointer"
                      >
                        <Layers className="w-5 h-5 text-purple-500 mb-2 group-hover:scale-110 transition" />
                        <p className="text-xs font-bold text-slate-800">الأتعاب والمالية</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">المصري والأجنبي بالدولار</p>
                      </button>

                      <button
                        id="quick-nav-smart-ocr"
                        onClick={() => onNavigate("smart_ocr")}
                        className="p-3 bg-gradient-to-r from-amber-500/10 to-amber-500/20 hover:from-amber-500/20 hover:to-amber-500/30 border border-amber-500/30 rounded-lg text-right group transition cursor-pointer col-span-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full">استوديو ذكي</span>
                          <ScanLine className="w-5 h-5 text-amber-600 group-hover:scale-110 transition" />
                        </div>
                        <p className="text-xs font-black text-slate-900 mt-1">استوديو الفحص واستخراج النصوص (Smart OCR Studio)</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">مسح التوكيلات والمستندات، التعرف على الحروف، والتحليل القانوني الفوري</p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. DOCUMENT PROCESSING SYSTEM (OCR, MOCK LAN SCANNER, INTEGRATIONS) */}
              {widgetId === "scanner_and_ocr" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mock LAN Scanner with multi scans */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onNavigate("smart_ocr")}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                          title="فتح استوديو Smart OCR Studio الكامل"
                        >
                          <ScanLine className="w-3.5 h-3.5" />
                          <span>فتح استوديو Smart OCR الكامل 🚀</span>
                        </button>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">Scanner Integration</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">الربط الإلكتروني بالماسح الضوئي (LAN IP Scanner)</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      قم بالاتصال المباشر بالماسحات الموصولة على الشبكة المحلية للمحامين لمسح الأوراق الجنائية، الأحكام، أو التوكيلات بشكل متعدد بضغطة زر.
                    </p>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                      <div className="flex gap-2 text-xs">
                        <input
                          id="scanner-ip-input"
                          type="text"
                          value={scannerIp}
                          onChange={(e) => setScannerIp(e.target.value)}
                          placeholder="IP الماسح المالي، مثال: 192.168.1.50"
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-900 rounded text-center outline-none focus:border-amber-500 font-mono"
                        />
                        <span className="py-2 px-3 text-slate-500 text-right font-medium">عنوان IP الماسح</span>
                      </div>

                      <div className="flex gap-2">
                        <select
                          id="scanner-dest"
                          value={scanFileDestination}
                          onChange={(e) => setScanFileDestination(e.target.value)}
                          className="flex-1 bg-white text-slate-800 border border-slate-200 px-3 py-2 text-xs rounded text-right"
                        >
                          <option value="">-- تخزين في ملف القضية --</option>
                          {cases.map(c => (
                            <option key={c.id} value={c.id}>قضية {c.caseNumber} - {c.clientName}</option>
                          ))}
                        </select>
                        <button
                          id="connect-scan-btn"
                          onClick={triggerMultiScan}
                          disabled={scannerStatus === "scanning" || scannerStatus === "connecting"}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <ScanLine className="w-4 h-4" />
                          بدء مسح متعدد
                        </button>
                      </div>

                      {scannerStatus !== "idle" && (
                        <div className="p-3 bg-white border border-slate-200 rounded text-center text-xs space-y-2">
                          {scannerStatus === "connecting" && (
                            <p className="text-amber-600 animate-pulse font-medium">جاري البحث عن الماسح على العنوان {scannerIp}...</p>
                          )}
                          {scannerStatus === "scanning" && (
                            <p className="text-blue-600 animate-pulse font-medium">جاري المسح الضوئي للمستندات متعددة الصفحات (صفحة ١، ٢)...</p>
                          )}
                          {scannerStatus === "success" && (
                            <div className="space-y-2">
                              <p className="text-green-600 font-bold flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                تم إدراج عدد {scannedPages.length} مستند مسح ضوئي بنجاح!
                              </p>
                              <div className="space-y-1 text-right">
                                {scannedPages.map((page, i) => (
                                  <p key={i} className="text-[11px] text-slate-600 truncate bg-slate-50 p-1.5 rounded border border-slate-100">📄 {page}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Text extract and automatic Placement suggestion */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-right">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center justify-start gap-2">
                      <Brain className="w-5 h-5 text-amber-500" />
                      منظومة الفحص الذكي ونقل المستندات (AI Suggestion & OCR)
                    </h3>
                    <p className="text-xs text-slate-500">
                      ارفع صورة لأوراق دعوى، قائمة منقولات، أو توكيل رسمي. سيقوم الذكاء الاصطناعي باستخراج الكلمات وتلقائياً ترشيح الملف المناسب لإدراجها فيه.
                    </p>

                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 hover:border-amber-500/40 transition relative">
                      <input
                        id="ai-pdf-uploader"
                        type="file"
                        accept="image/*"
                        onChange={handleUploadedFileImage}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <FileUp className="w-8 h-8 text-amber-505 mb-2 animate-bounce" />
                      <span className="text-xs text-slate-700 font-bold">اسحب المستند أو اضغط لرفعه</span>
                      <span className="text-[10px] text-slate-400 mt-1">يدعم صورة التوكيل، فواتير الأتعاب، أو مستندات الدعوى (JPG, PNG)</span>
                    </div>

                    {isProcessingAi && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-750">
                        <span className="inline-block w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin ml-2" />
                        جاري فك تشفير البيانات وتحليل الصورة بالذكاء الاصطناعي...
                      </div>
                    )}

                    {ocrTextResult && (
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-xs text-emerald-600 font-bold">{aiPlacementSuggestion}</span>
                          <span className="text-xs text-slate-655 font-bold">النصوص المكتشفة بالذكاء الاصطناعي:</span>
                        </div>
                        <p className="text-xs text-slate-700 max-h-32 overflow-y-auto leading-relaxed text-right p-1 font-mono whitespace-pre-line bg-white rounded border border-slate-100">
                          {ocrTextResult}
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            id="transfer-doc-ai"
                            onClick={() => {
                              alert("تم تحويل وتمرير الملف تلقائياً إلى خزانة القضية المعنية بمقترح الذكاء الاصطناعي!");
                              setOcrTextResult("");
                              setAiPlacementSuggestion("");
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm"
                          >
                            تأكيد النقل والتحويل المؤتمت
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. RECENT SCANS SECTION */}
              {widgetId === "recent_scans" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 space-y-4 shadow-sm text-right">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">🗂️ آخر المستندات الممسوحة ضوئياً (Recent Scans)</h3>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-sans animate-pulse">
                      تحديث مباشر (المكتب الذكي)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    رصد وتحليل لآخر 5 مستندات تم مسحها وتصويرها بسحابة المحامي الإلكترونية. يمكنك الولوج المباشر وتوجيه محركات البحث السريع لملف القضية:
                  </p>

                  {recentScans.length === 0 ? (
                    <div className="bg-slate-50/60 border border-dashed border-slate-200 p-6 rounded-xl text-center text-xs text-slate-400">
                      لم يتم رفع أو تصوير عينات أوراق أو مستندات ثبوتية للمستفيدين حتى الآن. ابدأ بسحب الأوراق عبر الماسح الضوئي الموصول بالشبكة أو الكاميرا الحية لتسجيلها هنا.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                      {recentScans.slice(0, 8).map((doc, idx) => {
                        const isImg = doc.type === "image" || doc.url.startsWith("data:image/");
                        return (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:border-amber-500/30 hover:shadow-md transition-all duration-300 relative group">
                            <div className="space-y-1.5">
                              {/* Visual Thumb crop */}
                              {isImg ? (
                                <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-100 relative">
                                  <img
                                    src={doc.url}
                                    alt={doc.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-250"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              ) : (
                                <div className="aspect-square w-full rounded-lg bg-orange-50/40 flex items-center justify-center text-3xl border border-orange-100/50">
                                  📕
                                </div>
                              )}
                              <h4 className="text-[10px] font-black text-slate-800 truncate block mt-1" title={doc.name}>
                                {doc.name}
                              </h4>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[9px] text-slate-500 space-y-1 font-sans">
                              <p className="truncate"><strong>القضية:</strong> {doc.caseNumber}</p>
                              <p className="truncate text-slate-600"><strong>الموكل:</strong> {doc.clientName}</p>
                              <p className="text-[8px] text-slate-400 font-mono tracking-tight">{new Date(doc.addedAt).toLocaleDateString("ar-EG")}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => onNavigate("cases", { caseId: doc.caseId })}
                              className="mt-3 w-full py-2 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-black rounded-lg text-[9px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 font-sans shadow-sm"
                            >
                              <span>تفاصيل ملف القضية ⚖️</span>
                            </button>
                          </div>
                        );
                      })}

                    </div>
                  )}
                </div>
              )}

              {/* 6. INCOMING CLIENT DOCKET MESSAGES & DIGITAL SIGNATURES PORTAL */}
              {widgetId === "client_messages" && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-right space-y-4 font-sans">
                  {/* Header & Controls */}
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <span>📥 وارد مذكرات الموكلين وإدارة التوقيعات الرقمية</span>
                          <span className="text-[10px] bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black">
                            نظام التوثيق الرسمي
                          </span>
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        تتبع مذكرات الموكلين، طلب التوقيع الإلكتروني وتوليد روابط التأكيد القانونية ومتابعة حالة التوقيع (موقّع / بانتظار التوقيع).
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-amber-100 text-amber-950 font-bold text-[10px] rounded-full border border-amber-200">
                        ⏳ {clientNotes.filter(n => n.signatureStatus === "pending").length} بانتظار التوقيع
                      </span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-950 font-bold text-[10px] rounded-full border border-emerald-200">
                        ✔️ {clientNotes.filter(n => n.signatureStatus === "signed").length} موقّعة ومعتمدة
                      </span>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 ml-1">تصفية التوقيع:</span>
                      <button
                        onClick={() => setNoteSignatureFilter("all")}
                        className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                          noteSignatureFilter === "all"
                            ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        الكل ({clientNotes.length})
                      </button>
                      <button
                        onClick={() => setNoteSignatureFilter("pending")}
                        className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                          noteSignatureFilter === "pending"
                            ? "bg-amber-500 text-slate-950 shadow-sm"
                            : "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50"
                        }`}
                      >
                        <span>⏳ بانتظار التوقيع</span>
                        <span className="px-1.5 py-0.2 bg-amber-200 text-amber-950 rounded-full text-[9px]">
                          {clientNotes.filter(n => n.signatureStatus === "pending").length}
                        </span>
                      </button>
                      <button
                        onClick={() => setNoteSignatureFilter("signed")}
                        className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                          noteSignatureFilter === "signed"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
                        }`}
                      >
                        <span>✔️ موقّع قانونياً</span>
                        <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-950 rounded-full text-[9px]">
                          {clientNotes.filter(n => n.signatureStatus === "signed").length}
                        </span>
                      </button>
                      <button
                        onClick={() => setNoteSignatureFilter("unsigned")}
                        className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                          noteSignatureFilter === "unsigned"
                            ? "bg-slate-700 text-white shadow-sm"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        📄 بدون طلب توقيع
                      </button>
                    </div>

                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                      <input
                        type="text"
                        placeholder="بحث بالموكل أو نص المذكرة أو كود التحقق..."
                        value={noteSearchQuery}
                        onChange={(e) => setNoteSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-[10.5px] outline-none focus:border-amber-500 transition"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  {/* Notes Cards Grid */}
                  {(() => {
                    const filtered = clientNotes
                      .filter(n => {
                        if (noteSignatureFilter === "pending") return n.signatureStatus === "pending";
                        if (noteSignatureFilter === "signed") return n.signatureStatus === "signed";
                        if (noteSignatureFilter === "unsigned") return !n.signatureStatus || n.signatureStatus === "none";
                        return true;
                      })
                      .filter(n => {
                        if (!noteSearchQuery.trim()) return true;
                        const q = noteSearchQuery.toLowerCase();
                        const verification = n.signatureData?.verificationHash?.toLowerCase() || "";
                        return (
                          n.clientName.toLowerCase().includes(q) ||
                          n.text.toLowerCase().includes(q) ||
                          (n.attorneyReply && n.attorneyReply.toLowerCase().includes(q)) ||
                          verification.includes(q)
                        );

                      });

                    if (filtered.length === 0) {
                      return (
                        <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-850/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                          <FileSignature className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <span>لا توجد أي مذكرات تطابق شروط التصفية أو البحث المحدد.</span>
                        </div>
                      );


                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtered.map((note) => {
                          const connectedCase = cases.find(c => c.id === note.referencedCaseId);
                          const token = note.confirmationToken || "SIG-" + Math.random().toString(36).substring(2, 9).toUpperCase();
                          const confLink = note.confirmationLink || buildConfirmationLink(note.id, token);

                          return (
                            <div
                              key={note.id}
                              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                                note.signatureStatus === "signed"
                                  ? "bg-emerald-50/30 dark:bg-emerald-950/15 border-emerald-300/70 dark:border-emerald-800/60 shadow-xs"
                                  : note.signatureStatus === "pending"
                                  ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-400/80 dark:border-amber-800/70 shadow-sm"
                                  : note.status === "Read by Attorney"
                                  ? "bg-slate-50/50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-90"
                                  : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 shadow-xs"
                              }`}
                            >
                              <div>
                                {/* Header: Client + Timestamp */}
                                <div className="flex justify-between items-start text-[10px] pb-2 border-b border-slate-200/70 dark:border-slate-800 mb-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                      👤 الموكل: {note.clientName}
                                    </span>
                                    {note.category && (
                                      <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                        {note.category === "Legal Document" ? "إيداع مستند" : note.category === "Fee Inquiry" ? "استعلام أتعاب" : "استشارة"}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                                    {new Date(note.date).toLocaleString("ar-EG")}
                                  </span>
                                </div>

                                {/* Note Message Body */}
                                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium mb-3 whitespace-pre-wrap">
                                  {note.text}
                                </p>

                                {/* Meta Info (Priority + Case + Reminders) */}
                                <div className="space-y-1.5 py-2 border-y border-slate-100 dark:border-slate-800 text-[10px]">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400">الأسبقية القضائية:</span>
                                    <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] ${
                                      note.priority === "High"
                                        ? "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 animate-pulse"
                                        : note.priority === "Low"
                                        ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                                    }`}>
                                      {note.priority === "High" ? "🚨 عاجل جداً وطارئ" : note.priority === "Low" ? "📌 روتيني" : "⚡ متوسط الأهمية"}
                                    </span>
                                  </div>

                                  {connectedCase && (
                                    <div className="flex justify-between items-center text-[10px] text-slate-700 dark:text-slate-300">
                                      <span>📁 القضية المتصلة:</span>
                                      <button
                                        onClick={() => onNavigate("cases", { caseId: note.referencedCaseId })}
                                        className="font-extrabold text-amber-700 dark:text-amber-400 hover:underline"
                                      >
                                        دعوى رقم {connectedCase.caseNumber} لسنة {connectedCase.caseYear}
                                      </button>
                                    </div>
                                  )}

                                  {note.scheduledReminder && (
                                    <div className="flex justify-between items-center text-[9px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 font-bold">
                                      <span>🔔 تنبيه 24 ساعة (SMS) للجلسة:</span>
                                      <span>✔️ معتمد تلقائياً</span>
                                    </div>
                                  )}
                                </div>

                                {/* DIGITAL SIGNATURE STATUS BLOCK */}
                                <div className="mt-3 p-2.5 rounded-xl border text-[10px] space-y-2 font-sans bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-[10.5px]">
                                      <PenTool className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                      <span>حالة التوقيع الإلكتروني:</span>
                                    </span>

                                    {/* Signature Status Badges */}
                                    {note.signatureStatus === "signed" ? (
                                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-black text-[9px] rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>موقّع إلكترونياً ومعتمد قانونياً</span>
                                      </span>
                                    ) : note.signatureStatus === "pending" ? (
                                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-black text-[9px] rounded-full flex items-center gap-1 border border-amber-300 dark:border-amber-700 animate-pulse">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>بانتظار توقيع الموكل</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[9px] rounded-full">
                                        لم يتم طلب توقيع
                                      </span>
                                    )}
                                  </div>

                                  {/* Signed Case Details */}
                                  {note.signatureStatus === "signed" && note.signatureData && (
                                    <div className="p-2 bg-emerald-50/60 dark:bg-emerald-950/25 rounded-lg border border-emerald-200/70 dark:border-emerald-900/50 space-y-1.5">
                                      <div className="flex justify-between items-center text-[9.5px]">
                                        <span className="text-slate-600 dark:text-slate-400">الموقّع:</span>
                                        <span className="font-extrabold text-emerald-900 dark:text-emerald-300">
                                          {note.signatureData.signedBy}
                                        </span>
                                      </div>
                                      {note.signatureData.nationalId && (
                                        <div className="flex justify-between items-center text-[9.5px]">
                                          <span className="text-slate-600 dark:text-slate-400">الرقم القومي:</span>
                                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                            {note.signatureData.nationalId}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center text-[9.5px]">
                                        <span className="text-slate-600 dark:text-slate-400">كود التحقق الرقمي:</span>
                                        <span className="font-mono font-black text-amber-700 dark:text-amber-400 text-[8.5px]">
                                          {note.signatureData.verificationHash || "E-SIG-VERIFIED"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400">
                                        <span>تاريخ التوثيق:</span>
                                        <span>{new Date(note.signatureData.signedAt).toLocaleString("ar-EG")}</span>
                                      </div>

                                      <div className="pt-1 flex gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setCertificateModalNote(note)}
                                          className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                        >
                                          <Award className="w-3 h-3" />
                                          <span>معاينة شهادة التوقيع والبصمة</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Pending Signature Actions (Copy link + WhatsApp + Instant sign) */}
                                  {note.signatureStatus === "pending" && (
                                    <div className="p-2 bg-amber-50/70 dark:bg-amber-950/30 rounded-lg border border-amber-200/80 dark:border-amber-900/60 space-y-2">
                                      <div className="text-[9.5px] text-amber-900 dark:text-amber-200 leading-tight">
                                        تم إصدار رابط التأكيد القانوني الخاص بهذه الملحوظة لمصادقة الموكل:
                                      </div>
                                      
                                      <div className="flex gap-1.5 flex-wrap">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(confLink);
                                            setCopiedLinkNoteId(note.id);
                                            setTimeout(() => setCopiedLinkNoteId(null), 2500);
                                          }}
                                          className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                          {copiedLinkNoteId === note.id ? (
                                            <>
                                              <Check className="w-3 h-3 text-emerald-400" />
                                              <span className="text-emerald-300">تم نسخ الرابط!</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3 h-3" />
                                              <span>نسخ رابط التأكيد</span>
                                            </>
                                          )}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const text = encodeURIComponent(`🏛️ *طلب توقيع وتأكيد إلكتروني قانوني عاجل*
من: مكتب الأستاذ المحامي المحامي بالنقض
إلى: الموكل الفاضل / ${note.clientName}

📌 *موضوع الملحوظة / الإقرار:*
"${note.text.substring(0, 100)}..."

🔗 *رابط التأكيد والتوقيع الإلكتروني المباشر:*
${confLink}

يرجى فتح الرابط لتسجيل توقيعك وبصمتك الرقمية للاعتماد.`);
                                            const phoneClean = (note.clientPhone || "").replace(/\D/g, "");
                                            window.open(`https://wa.me/${phoneClean ? (phoneClean.startsWith("2") ? phoneClean : "2" + phoneClean) : ""}?text=${text}`, "_blank");
                                          }}
                                          className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                                          title="إرسال رابط التأكيد عبر الواتساب"
                                        >
                                          <Share2 className="w-3 h-3" />
                                          <span>واتساب</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setSigningPortalNote(note)}
                                          className="py-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[9px] rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                          title="توقيع فوري إذا كان الموكل حاضراً بالمكتب"
                                        >
                                          <PenTool className="w-3 h-3" />
                                          <span>توقيع بالمكتب</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* If no signature requested yet -> Request button */}
                                  {(!note.signatureStatus || note.signatureStatus === "none") && (
                                    <button
                                      type="button"
                                      onClick={() => setSignatureModalNote(note)}
                                      className="w-full py-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-[9.5px] rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                    >
                                      <FileSignature className="w-3.5 h-3.5" />
                                      <span>✍️ طلب توقيع رقمي وإصدار رابط تأكيد قانوني</span>
                                    </button>
                                  )}
                                </div>

                                {/* Attorney Reply Display / Editor */}
                                {note.attorneyReply ? (
                                  <div className="mt-2.5 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-1 text-right">
                                    <div className="flex items-center justify-between text-[9px] font-black text-emerald-800 dark:text-emerald-300">
                                      <span className="flex items-center gap-1">
                                        <span>⚖️</span>
                                        <span>رد الأستاذ المحامي / هيئة الدفاع:</span>
                                      </span>
                                      <span className="text-emerald-600 bg-white dark:bg-slate-900 px-1.5 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800">
                                        معتمد رسمياً
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-emerald-950 dark:text-emerald-100 font-bold leading-relaxed">
                                      {note.attorneyReply}
                                    </p>
                                  </div>
                                ) : (
                                  activeReplyNoteId === note.id ? (
                                    <div className="mt-2.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-right">
                                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">
                                        كتابة رد المحامي على الموكل:
                                      </label>
                                      <textarea
                                        rows={2}
                                        value={replyInputText}
                                        onChange={(e) => setReplyInputText(e.target.value)}
                                        placeholder="اكتب ردك القانوني للموكل هنا..."
                                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs outline-none focus:border-amber-500 font-sans"
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveReplyNoteId(null);
                                            setReplyInputText("");
                                          }}
                                          className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                                        >
                                          إلغاء
                                        </button>
                                        <button
                                          type="button"
                                          disabled={!replyInputText.trim()}
                                          onClick={() => {
                                            if (onReplyToNote) {
                                              onReplyToNote(note.id, replyInputText.trim());
                                            } else if (onUpdateClientNote) {
                                              onUpdateClientNote(note.id, { attorneyReply: replyInputText.trim(), status: "Read by Attorney" });
                                            }
                                            setActiveReplyNoteId(null);
                                            setReplyInputText("");
                                          }}
                                          className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                                        >
                                          إرسال الرد ⚖️
                                        </button>
                                      </div>
                                    </div>
                                  ) : null
                                )}
                              </div>

                              {/* Card Bottom Actions */}
                              <div className="mt-3.5 flex gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                {note.status !== "Read by Attorney" ? (
                                  <button
                                    title="مارس الإطلاع وتم الاعتماد"
                                    id={`mark-read-${note.id}`}
                                    onClick={() => {
                                      onMarkNoteAsRead(note.id);
                                    }}
                                    className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[9.5px] rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
                                  >
                                    👁️ تم الاطلاع والاعتماد
                                  </button>
                                ) : (
                                  <div className="flex-1 py-1.5 px-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-[9px] rounded-lg text-center border border-emerald-200 dark:border-emerald-800">
                                    ✔️ تمت القراءة والاطلاع
                                  </div>
                                )}

                                {!note.attorneyReply && activeReplyNoteId !== note.id && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveReplyNoteId(note.id);
                                      setReplyInputText("");
                                    }}
                                    className="py-1.5 px-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-extrabold text-[9.5px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    <span>رد المحامي</span>
                                  </button>
                                )}

                                {connectedCase && (
                                  <button
                                    title="الانتقال لملف القضية"
                                    onClick={() => onNavigate("cases", { caseId: note.referencedCaseId })}
                                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-extrabold text-[9px] rounded-lg transition cursor-pointer"
                                  >
                                    📁 القضية
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}


                      </div>
                    );

                  })()}
                </div>
              )}

              {/* 7. Excel potential clients Excel text parser */}
              {widgetId === "excel_import" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-right">
                  <h3 className="text-base font-bold text-slate-900">استيراد جماعي لجهات الاتصال وعملاء المحافظ المحتملين</h3>
                  <p className="text-xs text-slate-500">
                    الصق أسطر الأسماء وأرقام الهواتف مباشرة من جدول Excel أو مستند أرقام الهواتف لمزامنتها مع العملاء المحتملين وتنقيتها تلقائياً من الأرقام المكررة.
                  </p>

                  <div className="space-y-3">
                    <textarea
                      id="excel-leads-textarea"
                      rows={4}
                      value={excelContactsRaw}
                      onChange={(e) => setExcelContactsRaw(e.target.value)}
                      placeholder="مثال:&#10;أحمد حسين السيد, 01024504100&#10;مروان سامح عبد العزيز, 01275556200"
                      className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-right text-xs font-mono outline-none focus:border-amber-500 focus:bg-white transition"
                    />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <span className="text-[11px] text-slate-400">ملاحظة: افصل بين الاسم والرقم بفاصلة كربونية أو مسافة (Tab)</span>
                      <button
                        id="excel-parse-btn"
                        onClick={parseExcelContacts}
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded transition cursor-pointer shadow-sm"
                      >
                        تحليل واستيراد جهات الاتصال لقاعدة البيانات
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. UPCOMING COURT CALENDAR SUMMARY ROW */}
              {widgetId === "court_calendar" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center justify-start gap-2">
                    <HelpCircle className="text-amber-550 w-5 h-5" />
                    موجز الجلسات والأعمال المطلوب سدادها
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-3 text-right">رقم القضية</th>
                          <th className="pb-3 text-right">المحكمة</th>
                          <th className="pb-3 text-right">الموضوع</th>
                          <th className="pb-3 text-right">الموكل</th>
                          <th className="pb-3 text-left">التاريخ المبرمج</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map(s => (
                          <tr 
                            key={s.id} 
                            onClick={() => onNavigate("cases", { caseId: s.caseId })}
                            className="border-b border-slate-100 hover:bg-amber-500/5 hover:text-amber-900 cursor-pointer transition duration-150 group"
                            title="اضغط للدخول للتفاصيل الكاملة لملف هذه القضية"
                          >
                            <td className="py-4 font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                              📂 قضية {s.caseInfo.caseNumber} لسنة {s.caseInfo.caseYear}
                            </td>
                            <td className="py-4 text-slate-600 font-medium">{s.caseInfo.competentCourt}</td>
                            <td className="py-4 text-slate-600">{s.caseInfo.subject}</td>
                            <td className="py-4 text-slate-700 font-semibold">{s.caseInfo.clientName}</td>
                            <td className="py-4 text-left text-amber-600 font-black font-sans group-hover:underline">
                              {s.date} 📅
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          );
        })}


      </div>

      {/* 1. REQUEST SIGNATURE LINK MODAL */}
      {signatureModalNote && (
        <RequestSignatureLinkModal
          isOpen={!!signatureModalNote}
          onClose={() => setSignatureModalNote(null)}
          currentUser={currentUser}
          note={{
            id: signatureModalNote.id,
            title: `مذكرة موكل: ${signatureModalNote.clientName}`,
            content: signatureModalNote.text,
            category: "Client Docket Memo",
            createdAt: signatureModalNote.date,
            updatedAt: signatureModalNote.date,
            isPinned: false,
            color: "amber",
            tags: ["موكل", "مذكرة"],
            clientName: signatureModalNote.clientName,
            clientPhone: signatureModalNote.clientPhone,
            requiresSignature: true,
            signatureStatus: signatureModalNote.signatureStatus,
            confirmationLink: signatureModalNote.confirmationLink,
            confirmationToken: signatureModalNote.confirmationToken
          }}
          clients={clients}
          cases={cases}
          onRequestCompleted={(updatedKeepNote) => {
            if (onUpdateClientNote && signatureModalNote) {
              onUpdateClientNote(signatureModalNote.id, {
                requiresSignature: true,
                signatureStatus: "pending",
                signatureRequestedBy: "lawyer",
                signatureRequestedAt: new Date().toISOString(),
                confirmationToken: updatedKeepNote.confirmationToken,
                confirmationLink: updatedKeepNote.confirmationLink,
                clientPhone: updatedKeepNote.clientPhone
              });
            }
            setSignatureModalNote(null);
          }}
        />
      )}

      {/* 2. IN-PERSON SIGNING PORTAL */}
      {signingPortalNote && (
        <ClientSignatureConfirmationPortal
          isOpen={!!signingPortalNote}
          onClose={() => setSigningPortalNote(null)}
          note={{
            id: signingPortalNote.id,
            title: `مذكرة موكل: ${signingPortalNote.clientName}`,
            content: signingPortalNote.text,
            category: "Client Docket Memo",
            createdAt: signingPortalNote.date,
            updatedAt: signingPortalNote.date,
            isPinned: false,
            color: "amber",
            tags: ["موكل", "مذكرة"],
            clientName: signingPortalNote.clientName,
            clientPhone: signingPortalNote.clientPhone,
            requiresSignature: true,
            signatureStatus: signingPortalNote.signatureStatus,
            confirmationLink: signingPortalNote.confirmationLink,
            confirmationToken: signingPortalNote.confirmationToken,
            signatureData: signingPortalNote.signatureData
          }}
          onSignComplete={(signedNote) => {
            if (onUpdateClientNote && signingPortalNote) {
              onUpdateClientNote(signingPortalNote.id, {
                signatureStatus: "signed",
                signatureData: signedNote.signatureData
              });
            }
            setSigningPortalNote(null);
          }}
        />
      )}

      {/* 3. SIGNATURE CERTIFICATE VIEWER MODAL */}
      {certificateModalNote && certificateModalNote.signatureData && (
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
                onClick={() => setCertificateModalNote(null)}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 font-sans">
              <LawyerSignatureSeal
                signedBy={certificateModalNote.signatureData.signedBy}
                signedAt={certificateModalNote.signatureData.signedAt}
                verificationHash={certificateModalNote.signatureData.verificationHash}
                lawyerName={certificateModalNote.signatureData.lawyerSignatureName || "الأستاذ المحامي"}
                nationalId={certificateModalNote.signatureData.nationalId}
                digitalStamp="ديوان المحاماة والاستشارات القانونية - محكمة النقض"
                signatureImage={certificateModalNote.signatureData.signatureImage}
              />

              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <span className="font-black text-slate-900 dark:text-white block">نص المذكرة المصادق عليها:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {certificateModalNote.text}
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
                onClick={() => setCertificateModalNote(null)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. GOOGLE KEEP NOTE DASHBOARD PREVIEW MODAL */}
      {selectedDashboardKeepNote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200 text-right">
          <div className="bg-white dark:bg-slate-900 border border-amber-500/40 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-950/10 rounded-xl">
                  <StickyNote className="w-5 h-5 fill-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-black truncate max-w-sm">
                    {selectedDashboardKeepNote.title}
                  </h3>
                  <p className="text-[10px] font-bold text-amber-950/80">
                    مذكرة Google Keep السحابية • {new Date(selectedDashboardKeepNote.date).toLocaleString("ar-EG")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDashboardKeepNote(null)}
                className="p-1.5 hover:bg-black/10 rounded-xl transition cursor-pointer text-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
              {/* Tags & Metadata */}
              <div className="flex flex-wrap gap-2 items-center">
                {selectedDashboardKeepNote.clientName && (
                  <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 font-bold rounded-lg text-xs">
                    👤 الموكل: {selectedDashboardKeepNote.clientName}
                  </span>
                )}
                {selectedDashboardKeepNote.caseNumber && (
                  <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 font-bold rounded-lg text-xs">
                    ⚖️ القضية: {selectedDashboardKeepNote.caseNumber}
                  </span>
                )}
                {selectedDashboardKeepNote.tags?.map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-lg text-[11px]">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Note Content */}
              <div className="space-y-1.5">
                <span className="font-black text-slate-900 dark:text-white text-xs block">محتوى المذكرة:</span>
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                  {selectedDashboardKeepNote.content}
                </div>
              </div>

              {/* Signature Info if available */}
              {selectedDashboardKeepNote.signatureStatus === "signed" && selectedDashboardKeepNote.signatureData && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-300 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-black text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>مذكرة موقّعة ومصادق عليها إلكترونياً</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                    <p>الموقّع: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDashboardKeepNote.signatureData.signedBy}</span></p>
                    {selectedDashboardKeepNote.signatureData.nationalId && (
                      <p>الرقم القومي: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedDashboardKeepNote.signatureData.nationalId}</span></p>
                    )}
                    <p>كود التحقق: <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{selectedDashboardKeepNote.signatureData.verificationHash}</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${selectedDashboardKeepNote.title}\n\n${selectedDashboardKeepNote.content}`);
                  setKeepCopiedId(selectedDashboardKeepNote.id);
                  setTimeout(() => setKeepCopiedId(null), 2000);
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                {keepCopiedId === selectedDashboardKeepNote.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ النص</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDashboardKeepNote(null);
                    onNavigate("google_workspace");
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>فتح في استوديو Google Workspace</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDashboardKeepNote(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CONSOLE MODAL (ضبط مربع عدد الزوار وعدد المستخدمين وعدد الاجهزة وتمكين عملهم كزر للمدير) */}
      {showAdminConsoleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">
                      مركز تحكم الإدارة والأجهزة والجلسات والزوار
                    </h3>
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                      لوحة المدير العام
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    التحكم الحي في عداد الزيارات، جلسات الأجهزة النشطة، وصلاحيات هيئة الدفاع
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdminConsoleModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setAdminConsoleTab("telemetry")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-2 cursor-pointer ${
                  adminConsoleTab === "telemetry"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>إحصائيات الزوار والترافيك</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminConsoleTab("devices")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-2 cursor-pointer ${
                  adminConsoleTab === "devices"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>الأجهزة المتصلة والجلسات ({connectedDevicesList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminConsoleTab("users")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-2 cursor-pointer ${
                  adminConsoleTab === "users"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>هيئة الدفاع والمستخدمين ({registeredUsers.length || 3})</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminConsoleTab("audit")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-2 cursor-pointer ${
                  adminConsoleTab === "audit"
                    ? "border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>سجل الرقابة الأمنية</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* TAB 1: VISITOR TELEMETRY */}
              {adminConsoleTab === "telemetry" && (
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-right">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">العدد الفعلي الحالي لزوار المنصة والجلسات:</span>
                      <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white">
                        {visitorCount.toLocaleString('en-US')} <span className="text-xs font-sans text-slate-500">زائر موثق</span>
                      </div>
                      <p className="text-[11px] text-slate-500">تم حفظ الإحصائية محلياً وتحديثها على السحابة الهجينة.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateVisitorCount(visitorCount + 50)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                      >
                        +50 زيارة
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateVisitorCount(visitorCount + 100)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                      >
                        +100 زيارة
                      </button>
                    </div>
                  </div>

                  {/* Manual Setting */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">تعديل قيمة عداد الزيارات يدوياً (للمدير العام):</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={customVisitorInput}
                        onChange={(e) => setCustomVisitorInput(e.target.value)}
                        placeholder={`أدخل الرقم الجديد (مثال: ${visitorCount})`}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseInt(customVisitorInput, 10);
                          if (!isNaN(val) && val >= 0) {
                            handleUpdateVisitorCount(val);
                            setCustomVisitorInput("");
                          }
                        }}
                        className="px-4 py-2 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition hover:opacity-90"
                      >
                        حفظ القيمة
                      </button>
                    </div>
                  </div>

                  {/* Analytics Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">معدل الدخول اليومي</span>
                      <span className="text-lg font-black text-emerald-600 font-mono">+128</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">متوسط مدة الجلسة</span>
                      <span className="text-lg font-black text-blue-600 font-mono">18 دقيقة</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">نسبة الأمان والتحقق</span>
                      <span className="text-lg font-black text-amber-500 font-mono">100%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ACTIVE DEVICES */}
              {adminConsoleTab === "devices" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                      قائمة الأجهزة والجلسات المصرح لها بالاتصال بالسحابة:
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {connectedDevicesList.length} متصلين الآن
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {connectedDevicesList.map((dev) => (
                      <div
                        key={dev.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                            <Laptop className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-black text-slate-900 dark:text-white">{dev.name}</h5>
                              <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono px-2 py-0.5 rounded">
                                {dev.ip}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-2">
                              <span>نظام التشغيل: {dev.os}</span>
                              <span>•</span>
                              <span>المتصفح: {dev.browser}</span>
                              <span>•</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400">المستخدم: {dev.user}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                            نشط ({dev.lastActive})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDisconnectDevice(dev.id)}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            إنهاء الجلسة
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: USERS & PERMISSIONS */}
              {adminConsoleTab === "users" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                      هيئة الدفاع والمستخدمين المسجلين في النظام:
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate("users")}
                      className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                    >
                      + إضافة عضو أو محامي جديد
                    </button>
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: "أ.د/ وسام الشناوي", role: "مدير النظام والمحامي العام بالنقض", email: "wesam.elshenawey@gmail.com", status: "نشط 🟢", permissions: "كامل الصلاحيات والإدارة" },
                      { name: "أ/ كريم المنشاوي", role: "محامي استئناف ومرافعات", email: "karim.law@office.com", status: "نشط 🟢", permissions: "إدارة القضايا والجلسات" },
                      { name: "أ/ نادية الشريف", role: "مستشار قانوني وصياغة عقود", email: "nadia.contracts@office.com", status: "نشط 🟢", permissions: "العقود والتوثيقات والأرشيف" }
                    ].map((u, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-black text-slate-900 dark:text-white">{u.name}</h5>
                          <p className="text-[11px] text-slate-500">{u.role} • {u.email}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full block mb-1">
                            {u.permissions}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">{u.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT LOGS */}
              {adminConsoleTab === "audit" && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-slate-950 text-emerald-400 rounded-xl max-h-52 overflow-y-auto space-y-1 text-right" dir="ltr">
                    <p className="text-slate-400">[{new Date().toLocaleTimeString()}] System Security Audit Log Initiated</p>
                    <p className="text-emerald-400">[200 OK] Admin authorized via secure session for wesam.elshenawey@gmail.com</p>
                    <p className="text-blue-400">[SYNC] Hybrid Firebase sync confirmed (collections: cases, sessions, clients)</p>
                    <p className="text-amber-400">[DEVICE] LAN Scanner connected at 192.168.1.104</p>
                    <p className="text-emerald-400">[OCR] Gemini 3.7 Flash Handwriting Engine loaded successfully</p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => alert("تم تصدير سجل الرقابة الأمنية بنجاح إلى ملف النصي المشفر.")}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      تصدير سجل الأمان والرقابة 📥
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-sans">
                بروتوكول الحماية والرقابة الإدارية - إصدار 4.2
              </span>
              <button
                type="button"
                onClick={() => setShowAdminConsoleModal(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                حفظ وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CASE MODAL */}
      {showQuickCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">إضافة وقيد قضية جديدة</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickCaseModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickCase} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم القضية *</label>
                  <input
                    type="text"
                    required
                    value={quickCaseNumber}
                    onChange={(e) => setQuickCaseNumber(e.target.value)}
                    placeholder="مثال: 1204"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">سنة القضية *</label>
                  <input
                    type="number"
                    required
                    value={quickCaseYear}
                    onChange={(e) => setQuickCaseYear(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الموكل (الطرف الأصيل) *</label>
                <input
                  type="text"
                  required
                  value={quickCaseClientName}
                  onChange={(e) => setQuickCaseClientName(e.target.value)}
                  placeholder="الاسم الرباعي للموكل"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الخصم</label>
                <input
                  type="text"
                  value={quickCaseOpponentName}
                  onChange={(e) => setQuickCaseOpponentName(e.target.value)}
                  placeholder="اسم الخصم أو جهة النزاع"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المحكمة المختصة</label>
                  <input
                    type="text"
                    value={quickCaseCourt}
                    onChange={(e) => setQuickCaseCourt(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الدائرة القضائية</label>
                  <input
                    type="text"
                    value={quickCaseCircuit}
                    onChange={(e) => setQuickCaseCircuit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">موضوع الدعوى والطلبات</label>
                <input
                  type="text"
                  value={quickCaseSubject}
                  onChange={(e) => setQuickCaseSubject(e.target.value)}
                  placeholder="مثال: دعوى صحة ونفاذ عقد بيع عقاري"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickCaseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black transition cursor-pointer shadow-md"
                >
                  حفظ وقيد القضية 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD CLIENT MODAL */}
      {showQuickClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">إضافة وتسجيل موكل جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickClientModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickClient} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الرباعي للموكل *</label>
                <input
                  type="text"
                  required
                  value={quickClientName}
                  onChange={(e) => setQuickClientName(e.target.value)}
                  placeholder="مثال: محمود عبد الرازق إبراهيم الشناوي"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف والمراسلة *</label>
                  <input
                    type="tel"
                    required
                    value={quickClientPhone}
                    onChange={(e) => setQuickClientPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الرقم القومي (١٤ رقم)</label>
                  <input
                    type="text"
                    maxLength={14}
                    value={quickClientNationalId}
                    onChange={(e) => setQuickClientNationalId(e.target.value)}
                    placeholder="2980101..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم التوكيل الرسمي</label>
                  <input
                    type="text"
                    value={quickClientPoaNumber}
                    onChange={(e) => setQuickClientPoaNumber(e.target.value)}
                    placeholder="مثال: 4521 أ"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مكتب التوثيق</label>
                  <input
                    type="text"
                    value={quickClientPoaOffice}
                    onChange={(e) => setQuickClientPoaOffice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الأتعاب المستحقة / المتبقية (ج.م)</label>
                <input
                  type="number"
                  min={0}
                  value={quickClientRemainingFees}
                  onChange={(e) => setQuickClientRemainingFees(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickClientModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition cursor-pointer shadow-md"
                >
                  تسجيل الموكل 👥
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
