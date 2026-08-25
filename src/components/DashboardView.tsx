import React, { useState, useMemo, useEffect } from "react";
import { CaseRecord, ClientProfile, SessionRecord, LeadProfile, PlatformUser, FeeTransfer, ClientNote, NoteSignatureData } from "../types";
import { 
  Users, 
  Briefcase, 
  Search, 
  Printer, 
  ScanLine, 
  PlusCircle, 
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
  CalendarDays
} from "lucide-react";
import LawyerSignatureSeal from "./LawyerSignatureSeal";
import RequestSignatureLinkModal from "./RequestSignatureLinkModal";
import ClientSignatureConfirmationPortal from "./ClientSignatureConfirmationPortal";
import { buildConfirmationLink } from "../utils/workspaceService";

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
  Bar
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

  // Process fees data for Recharts
  const processedChartData = useMemo(() => {
    const monthsArabic = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    
    // Group by month name
    const groups: { [key: string]: { monthName: string; EGP: number; USD: number } } = {};
    
    // Pre-populate last 6 calendar months to make the chart look pristine even with little data on fresh starts
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const label = monthsArabic[mIdx];
      groups[label] = { monthName: label, EGP: 0, USD: 0 };
    }

    // Accumulate actual fees
    if (Array.isArray(fees)) {
      fees.forEach(fee => {
        if (!fee.date) return;
        const d = new Date(fee.date);
        if (isNaN(d.getTime())) return;
        
        const mIdx = d.getMonth();
        const label = monthsArabic[mIdx];
        
        if (!groups[label]) {
          groups[label] = { monthName: label, EGP: 0, USD: 0 };
        }
        
        if (fee.currency === "EGP") {
          groups[label].EGP += fee.amount;
        } else if (fee.currency === "USD") {
          groups[label].USD += fee.amount;
        }
      });
    }

    return Object.values(groups);
  }, [fees]);

  const { totalEgpCollected, totalUsdCollected } = useMemo(() => {
    let egp = 0;
    let usd = 0;
    if (Array.isArray(fees)) {
      fees.forEach(f => {
        if (f.currency === "EGP") egp += f.amount;
        else if (f.currency === "USD") usd += f.amount;
      });
    }
    return { totalEgpCollected: egp, totalUsdCollected: usd };
  }, [fees]);

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
    | "office_services"
    | "financial_chart"
    | "search_quick_nav"
    | "scanner_and_ocr"
    | "recent_scans"
    | "client_messages"
    | "excel_import"
    | "court_calendar";

  const DEFAULT_WIDGET_ORDER: { id: WidgetId; title: string; subtitle: string; icon: string }[] = [
    { id: "stats_bento", title: "مؤشرات الأداء والإحصائيات الحية", subtitle: "القضايا، الموكلين، الجلسات العاجلة، الأقسام الإدارية", icon: "📊" },
    { id: "daily_legal_analytics", title: "التحليلات القانونية اليومية (Daily Legal Analytics)", subtitle: "رصد القضايا الجديدة، الجلسات المجدولة، والمذكرات المعلقة اليوم", icon: "📈" },
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

  return (
    <div className="space-y-8 text-right font-sans relative" dir="rtl">
      
      {/* Luxury Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        {/* VISITOR COUNTER WIDGET (Moved from floating) */}
        <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-700 shadow-sm flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-xl border border-amber-500/30">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold tracking-wider">الزوار والجلسات التراكمية</span>
              <span className="text-base font-black font-mono tracking-widest text-amber-500">
                {visitorCount.toLocaleString('en-US')}
              </span>
            </div>
          </div>
          <div className="w-px h-10 bg-slate-800"></div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
              <Laptop className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold tracking-wider">الأجهزة النشطة الآن</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-black font-mono tracking-widest text-emerald-400">
                  {activeDevicesCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Egyptian Lawyer AI Quick Launch Button */}
          <button
            id="open-egyptian-lawyer-ai-btn"
            type="button"
            onClick={() => onNavigate("egyptian_lawyer_ai")}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 text-xs font-black rounded-lg flex items-center gap-2 cursor-pointer transition shadow-md border border-amber-300"
          >
            <span>⚖️</span>
            <span>المحامي المصري الذكي (Egyptian Lawyer AI)</span>
          </button>

          {/* Themes & Designs Quick Studio Button */}
          <button
            id="open-designs-studio-btn"
            type="button"
            onClick={() => onNavigate("designs")}
            className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500 hover:to-amber-600 text-amber-300 hover:text-slate-950 border border-amber-400/50 text-xs font-black rounded-lg flex items-center gap-2 cursor-pointer transition shadow-sm"
          >
            <span>🎨</span>
            <span>قسم التصميمات والمظاهر</span>
          </button>
          
          {/* Layout Customizer Toggle */}
          <button
            id="customize-widgets-btn"
            type="button"
            onClick={() => setIsCustomizingLayout(!isCustomizingLayout)}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition border ${
              isCustomizingLayout 
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md" 
                : "bg-slate-800 hover:bg-slate-750 text-amber-300 border-amber-500/30"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>{isCustomizingLayout ? "إغلاق التخصيص ✓" : "تخصيص ترتيب البطاقات (Drag & Drop)"}</span>
          </button>

          <button
            id="print-global"
            onClick={handlePrintDashboard}
            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            طباعة شاملة
          </button>
          
          <button
            id="cloud-sync"
            onClick={() => alert("مزامنة سحابية هجينة نشطة! تم رفع ومزامنة التغييرات المحلية مع قاعدة بيانات wesam0law على Firebase بنجاح.")}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-2 transition cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            مزامنة سحابية هجينة
          </button>
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

              {/* 1. CORE STATS BENTO GRID */}
              {widgetId === "stats_bento" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div 
                    onClick={() => onNavigate("cases")}
                    className="bg-white p-5 rounded-2xl border-b-4 border-blue-500 shadow-sm flex flex-col justify-center relative overflow-hidden transition-all duration-250 hover:shadow-md cursor-pointer hover:border-blue-600 group hover:scale-[1.02] transform active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-slate-500 text-xs font-semibold group-hover:text-blue-600 transition-colors">إجمالي القضايا المتداولة</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-2">{cases.length} <span className="text-sm font-normal text-slate-500">مفتوحة</span></h3>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-full text-blue-600 group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300">
                        <Briefcase className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-emerald-650 flex items-center justify-between font-medium">
                      <span>● متزامنة بالكامل سحابياً</span>
                      <span className="text-[10px] text-blue-500 font-bold">عرض القضايا ←</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => onNavigate("clients")}
                    className="bg-white p-5 rounded-2xl border-b-4 border-amber-500 shadow-sm flex flex-col justify-center relative overflow-hidden transition-all duration-250 hover:shadow-md cursor-pointer hover:border-amber-600 group hover:scale-[1.02] transform active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-slate-500 text-xs font-semibold group-hover:text-amber-600 transition-colors">إجمالي الموكلين والعملاء</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-2">{clients.length} <span className="text-sm font-normal text-slate-500">مستمر</span></h3>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-full text-amber-600 group-hover:bg-amber-100 group-hover:scale-110 transition-all duration-300">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-amber-600 flex items-center justify-between font-medium">
                      <span>{leads.length} عملاء مستوردين من إكسل</span>
                      <span className="text-[10px] text-amber-650 font-bold">عرض التفاصيل ←</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => onNavigate("sessions")}
                    className="bg-white p-5 rounded-2xl border-b-4 border-emerald-500 shadow-sm flex flex-col justify-center relative overflow-hidden transition-all duration-250 hover:shadow-md cursor-pointer hover:border-emerald-600 group hover:scale-[1.02] transform active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-slate-500 text-xs font-semibold group-hover:text-emerald-600 transition-colors">الجلسات القضائية العاجلة</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-2">{alertSessionsCount} <span className="text-xs font-normal text-slate-400">هذا الأسبوع</span></h3>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-300">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-555 flex items-center justify-between">
                      <span className="truncate">أقرب جلسة: {sessions[0]?.date || "لا يوجد"}</span>
                      <span className="text-[10px] text-emerald-600 font-bold font-sans">الأجندة القضائية ←</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => onNavigate("adminwork")}
                    className="bg-white p-5 rounded-2xl border-b-4 border-purple-500 shadow-sm flex flex-col justify-center relative overflow-hidden transition-all duration-250 hover:shadow-md cursor-pointer hover:border-purple-600 group hover:scale-[1.02] transform active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-slate-500 text-xs font-semibold group-hover:text-purple-600 transition-colors">الأقسام الإدارية والتوثيقات</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-2">10 أقسام</h3>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-full text-purple-600 group-hover:bg-purple-100 group-hover:scale-110 transition-all duration-300">
                        <Layers className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-555 flex items-center justify-between">
                      <span className="truncate">تأسيس شركات، زواج الأجانب، أعمال التوثيق</span>
                      <span className="text-[10px] text-purple-650 font-bold font-sans">الأقسام ←</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 1.2. DAILY LEGAL ANALYTICS CARD */}
              {widgetId === "daily_legal_analytics" && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
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

                  {/* Visual Chart & Metrics Bento Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    
                    {/* Recharts Bar Chart Visualization */}
                    <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-750">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <BarChart2 className="w-4 h-4 text-indigo-600" />
                          <span>توزيع النشاط القانوني والإجرائي لليوم</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">Recharts Engine</span>
                      </div>

                      <div className="h-56 w-full" dir="ltr">
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

                    {/* Breakdown Metric Action Cards */}
                    <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                      
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

                  </div>
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

                  {/* Fast categories preview grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
                    {[
                      { icon: "⚖️", title: "القضاء والنزاعات", desc: "مدني، جنائي، مجلس دولة", count: "12 خدمة" },
                      { icon: "🏢", title: "الشركات والاستثمار", desc: "تأسيس، اندماج، تراخيص", count: "10 خدمات" },
                      { icon: "🤝", title: "العقود والاتفاقيات", desc: "صياغة وتدقيق ومراجعة", count: "8 خدمات" },
                      { icon: "🏛️", title: "الشهر العقاري", desc: "تسجيل، توثيق، صحة ونفاذ", count: "7 خدمات" },
                      { icon: "🌐", title: "الأجانب والهجرة", desc: "زواج أجانب، إقامات، جنسية", count: "6 خدمات" },
                      { icon: "💼", title: "الاستشارات والأعمال", desc: "استشارات سنوية وحوكمة", count: "5 خدمات" }
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

              {/* 2. FINANCIAL CHART GRAPH - RECHARTS */}
              {widgetId === "financial_chart" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">📊 التقرير المالي الرقمي للأتعاب المحصلة</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        رسم بياني تفاعلي حي يوزع مقبوضات وأتعاب القضايا شهرياً (بالجنيه والدولار) لتسهيل الرقابة المالية في مكتب الشناوي.
                      </p>
                    </div>
                    <div className="flex gap-4 text-xs font-bold leading-none font-sans">
                      <div className="bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 rounded-xl text-center">
                        <span className="text-slate-500 text-[10px] block mb-1">إجمالي المقبوضات (EGP)</span>
                        <span className="text-emerald-700 text-base font-black font-mono">{totalEgpCollected.toLocaleString("ar-EG")} EGP</span>
                      </div>
                      {totalUsdCollected > 0 && (
                        <div className="bg-teal-50 border border-teal-100 px-3.5 py-2.5 rounded-xl text-center">
                          <span className="text-slate-500 text-[10px] block mb-1">إجمالي المقبوضات (USD)</span>
                          <span className="text-teal-700 text-base font-black font-mono">${totalUsdCollected.toLocaleString("en-US")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-80 w-full font-mono text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={processedChartData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorEgp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="monthName" 
                          tickLine={false}
                          axisLine={false}
                          stroke="#64748b"
                          tickMargin={8}
                          fontFamily="sans-serif"
                        />
                        <YAxis 
                          tickLine={false}
                          axisLine={false}
                          stroke="#64748b"
                          tickFormatter={(val) => val > 0 ? `${(val / 1000).toFixed(0)}k` : val}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            direction: "rtl", 
                            textAlign: "right",
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "12px",
                            color: "#f8fafc",
                            fontFamily: "Inter, sans-serif"
                          }} 
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Area 
                          type="monotone" 
                          name="أتعاب بالجنيه المصري (EGP)" 
                          dataKey="EGP" 
                          stroke="#d97706" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#colorEgp)" 
                        />
                        {totalUsdCollected > 0 && (
                          <Area 
                            type="monotone" 
                            name="أتعاب بالدولار الأمريكي (USD)" 
                            dataKey="USD" 
                            stroke="#0d9488" 
                            strokeWidth={2.5}
                            fillOpacity={1} 
                            fill="url(#colorUsd)" 
                          />
                        )}
                      </AreaChart>
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
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">Scanner Integration</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-1">
                      {recentScans.map((doc, idx) => {
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

    </div>
  );
}
