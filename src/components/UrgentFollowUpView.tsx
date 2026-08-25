import React, { useState, useMemo } from "react";
import { 
  CaseRecord, 
  ClientProfile, 
  SessionRecord, 
  ClientNote, 
  FeeTransfer, 
  PlatformUser,
  SentWhatsAppAlertRecord
} from "../types";
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  FileSignature, 
  DollarSign, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  User, 
  Scale, 
  Phone, 
  ChevronRight, 
  Search, 
  Filter, 
  Sparkles, 
  ExternalLink,
  Copy,
  Check,
  Flame,
  ArrowUpRight,
  Printer,
  FileText
} from "lucide-react";

interface UrgentFollowUpViewProps {
  cases: CaseRecord[];
  clients: ClientProfile[];
  sessions: SessionRecord[];
  clientNotes: ClientNote[];
  fees: FeeTransfer[];
  currentUser: PlatformUser;
  onNavigate: (section: string, extra?: any) => void;
  language?: "ar" | "en";
}

interface UrgentItem {
  id: string;
  type: "session" | "client_note" | "signature" | "fee" | "case_action";
  title: string;
  clientName: string;
  clientPhone?: string;
  caseNumber?: string;
  caseYear?: number;
  courtName?: string;
  dateOrDeadline: string;
  daysRemaining: number;
  severity: "critical" | "urgent" | "warning";
  details: string;
  actionRequired: string;
  rawObject: any;
}

export default function UrgentFollowUpView({
  cases,
  clients,
  sessions,
  clientNotes,
  fees,
  currentUser,
  onNavigate,
  language = "ar"
}: UrgentFollowUpViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "session" | "client_note" | "signature" | "fee" | "case_action">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // WhatsApp Alert Modal State
  const [activeAlertItem, setActiveAlertItem] = useState<UrgentItem | null>(null);
  const [alertMessageType, setAlertMessageType] = useState<"session_reminder" | "documents_request" | "judgment_alert" | "signature_request" | "fee_reminder" | "custom">("session_reminder");
  const [customMessage, setCustomMessage] = useState("");
  const [targetPhone, setTargetPhone] = useState("");

  // History of sent notifications
  const [sentAlerts, setSentAlerts] = useState<SentWhatsAppAlertRecord[]>(() => {
    const saved = localStorage.getItem("law_sent_whatsapp_alerts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Calculate Urgent Items
  const urgentItems: UrgentItem[] = useMemo(() => {
    const items: UrgentItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check Sessions occurring within next 7 days or overdue
    sessions.forEach(sess => {
      if (sess.status === "done") return;
      const sessDate = new Date(sess.date);
      sessDate.setHours(0, 0, 0, 0);
      const diffTime = sessDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Consider upcoming sessions within 7 days or today/past pending
      if (diffDays <= 7) {
        const client = clients.find(c => c.name === sess.caseInfo.clientName);
        let severity: "critical" | "urgent" | "warning" = "warning";
        if (diffDays <= 1) severity = "critical";
        else if (diffDays <= 3) severity = "urgent";

        const labelDays = diffDays === 0 
          ? "اليوم ⚡" 
          : diffDays === 1 
          ? "غداً ⚠️" 
          : diffDays < 0 
          ? `منذ ${Math.abs(diffDays)} أيام (معلقة)` 
          : `بعد ${diffDays} أيام`;

        items.push({
          id: `sess-${sess.id}`,
          type: "session",
          title: `جلسة محكمة قادمة: ${sess.caseInfo.competentCourt}`,
          clientName: sess.caseInfo.clientName,
          clientPhone: client?.phone || client?.whatsapp,
          caseNumber: sess.caseInfo.caseNumber,
          caseYear: sess.caseInfo.caseYear,
          courtName: sess.caseInfo.competentCourt,
          dateOrDeadline: sess.date,
          daysRemaining: diffDays,
          severity,
          details: `الدائرة: ${sess.caseInfo.circuit || "غير محددة"} | الخصم: ${sess.caseInfo.opponentName} | الموضوع: ${sess.caseInfo.subject}`,
          actionRequired: sess.requiredWork || "حضور الجلسة والمرافعة وتقديم المذكرات وسندات الدفاع",
          rawObject: sess
        });
      }
    });

    // 2. Check Client Notes (High Priority or Requiring Response)
    clientNotes.forEach(note => {
      if (note.status === "Acknowledged" && note.attorneyReply) return;
      if (note.priority === "High" || !note.attorneyReply) {
        const client = clients.find(c => c.name === note.clientName);
        const noteDate = new Date(note.date);
        const diffTime = today.getTime() - noteDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        items.push({
          id: `note-${note.id}`,
          type: "client_note",
          title: `مذكرة موكل عاجلة بحاجة لمتابعة ورد: ${note.clientName}`,
          clientName: note.clientName,
          clientPhone: note.clientPhone || client?.phone,
          dateOrDeadline: note.date,
          daysRemaining: -diffDays,
          severity: note.priority === "High" ? "critical" : "urgent",
          details: note.text.substring(0, 140) + (note.text.length > 140 ? "..." : ""),
          actionRequired: "الاطلاع على المذكرة، فحص المرفقات، والرد على الموكل بالتوجيه القانوني",
          rawObject: note
        });
      }
    });

    // 3. Check Pending Digital Signatures
    clientNotes.forEach(note => {
      if (note.signatureStatus === "pending") {
        const client = clients.find(c => c.name === note.clientName);
        items.push({
          id: `sign-${note.id}`,
          type: "signature",
          title: `طلب توقيع إلكتروني وتأكيد قانوني معلق: ${note.clientName}`,
          clientName: note.clientName,
          clientPhone: note.clientPhone || client?.phone,
          dateOrDeadline: note.signatureRequestedAt || note.date,
          daysRemaining: 0,
          severity: "urgent",
          details: `رابط التأكيد القانوني مفعل وبانتظار مصادقة الموكل: ${note.legalAffirmation || "المصادقة على صحة البيانات والأقوال القانونية"}`,
          actionRequired: "إرسال رابط التذكير للموكل عبر الواتساب لإتمام التوقيع الإلكتروني",
          rawObject: note
        });
      }
    });

    // 4. Check Overdue or Pending Legal Fees
    clients.forEach(c => {
      if (c.remainingFees && c.remainingFees > 0) {
        items.push({
          id: `fee-${c.id}`,
          type: "fee",
          title: `مستحقات وأتعاب قانونية متبقية: ${c.remainingFees.toLocaleString("ar-EG")} ج.م`,
          clientName: c.name,
          clientPhone: c.phone || c.whatsapp,
          caseNumber: c.caseNumber,
          caseYear: c.caseYear,
          courtName: c.competentCourt,
          dateOrDeadline: c.createdAt,
          daysRemaining: 0,
          severity: c.remainingFees > 15000 ? "critical" : "warning",
          details: `الموكل: ${c.name} | رقم التوكيل: ${c.poaNumber || "---"} | القضية: ${c.caseNumber || "---"} | المتبقي: ${c.remainingFees.toLocaleString("ar-EG")} ج.م`,
          actionRequired: "إرسال إشعار تذكير بالمطالبة وتفاصيل السداد البنكي / النقدي عبر الواتساب",
          rawObject: c
        });
      }
    });

    // 5. Check Case Records with Next Session in next 7 days (if not in sessions list)
    cases.forEach(cs => {
      if (!cs.nextSessionDate) return;
      const sessDate = new Date(cs.nextSessionDate);
      sessDate.setHours(0, 0, 0, 0);
      const diffTime = sessDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Avoid duplicates if session already captured
      const alreadyInSessions = items.some(it => it.type === "session" && it.caseNumber === cs.caseNumber);

      if (!alreadyInSessions && diffDays >= 0 && diffDays <= 7) {
        const client = clients.find(c => c.name === cs.clientName);
        items.push({
          id: `case-${cs.id}`,
          type: "case_action",
          title: `إجراء قضائي عاجل بالقضية: ${cs.caseNumber}/${cs.caseYear}`,
          clientName: cs.clientName,
          clientPhone: client?.phone || client?.whatsapp,
          caseNumber: cs.caseNumber,
          caseYear: cs.caseYear,
          courtName: cs.competentCourt,
          dateOrDeadline: cs.nextSessionDate,
          daysRemaining: diffDays,
          severity: diffDays <= 1 ? "critical" : diffDays <= 3 ? "urgent" : "warning",
          details: `المحكمة: ${cs.competentCourt} | الموضوع: ${cs.subject} | الخصم: ${cs.opponentName}`,
          actionRequired: "تجهيز حافظة المستندات ومذكرة الدفاع قبل موعد الجلسة",
          rawObject: cs
        });
      }
    });

    // Sort: critical first, then urgent, then warning, then daysRemaining
    return items.sort((a, b) => {
      const order = { critical: 0, urgent: 1, warning: 2 };
      if (order[a.severity] !== order[b.severity]) {
        return order[a.severity] - order[b.severity];
      }
      return a.daysRemaining - b.daysRemaining;
    });
  }, [cases, clients, sessions, clientNotes, fees]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return urgentItems.filter(item => {
      const matchType = selectedFilter === "all" || item.type === selectedFilter;
      const matchSearch = !searchQuery.trim() || 
        item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.caseNumber && item.caseNumber.includes(searchQuery)) ||
        (item.courtName && item.courtName.includes(searchQuery));
      return matchType && matchSearch;
    });
  }, [urgentItems, selectedFilter, searchQuery]);

  // Counts for Badges
  const counts = useMemo(() => {
    return {
      all: urgentItems.length,
      critical: urgentItems.filter(i => i.severity === "critical").length,
      session: urgentItems.filter(i => i.type === "session" || i.type === "case_action").length,
      client_note: urgentItems.filter(i => i.type === "client_note").length,
      signature: urgentItems.filter(i => i.type === "signature").length,
      fee: urgentItems.filter(i => i.type === "fee").length
    };
  }, [urgentItems]);

  // Open WhatsApp Modal with prepopulated message
  const handleOpenAlertModal = (item: UrgentItem) => {
    setActiveAlertItem(item);
    setTargetPhone(item.clientPhone || "");
    
    // Choose appropriate message type
    let defaultType: "session_reminder" | "documents_request" | "judgment_alert" | "signature_request" | "fee_reminder" | "custom" = "session_reminder";
    if (item.type === "signature") defaultType = "signature_request";
    else if (item.type === "fee") defaultType = "fee_reminder";
    else if (item.type === "client_note") defaultType = "custom";
    setAlertMessageType(defaultType);

    // Build template message text
    generateMessageText(item, defaultType, item.clientPhone || "");
  };

  const generateMessageText = (
    item: UrgentItem, 
    type: "session_reminder" | "documents_request" | "judgment_alert" | "signature_request" | "fee_reminder" | "custom",
    phone: string
  ) => {
    const lawyerName = "الأستاذ المحامي";
    const officeHeader = `🏛️ *ديوان المحاماة والاستشارات القانونية*\n⚖️ *${lawyerName} - محامٍ بالنقض والدستورية العليا*\n----------------------------------------\n`;
    
    let body = "";
    if (type === "session_reminder") {
      body = `${officeHeader}عناية الموكل الفاضل / *${item.clientName}* المحترم،\nتحية طيبة وبعد،،\n\nنود إحاطة سيادتكم علماً بموعد جلستكم القضائية القادمة:\n📋 *رقم القضية:* ${item.caseNumber || "---"} لسنة ${item.caseYear || "2026"}\n🏛️ *المحكمة:* ${item.courtName || "المحكمة المختصة"}\n📅 *تاريخ الجلسة:* ${new Date(item.dateOrDeadline).toLocaleDateString("ar-EG")}\n⚡ *العمل المطلوب:* ${item.actionRequired}\n\nيرجى التواصل مع الديوان في حال وجود أي استفسار أو مستندات إضافية.\nمع خالص التقدير والاحترام.`;
    } else if (type === "signature_request") {
      const confirmLink = item.rawObject?.confirmationLink || window.location.href;
      body = `${officeHeader}عناية الموكل الفاضل / *${item.clientName}* المحترم،\nتحية طيبة وبعد،،\n\nنحيطكم علماً بأنه تم إعداد مذكرة قانونية تتطلب *مصادقتكم وتوقيعكم الإلكتروني المعتمد*:\n✍️ *رابط التوقيع والتأكيد القانوني المباشر:*\n${confirmLink}\n\nيرجى الضغط على الرابط أعلاه للمصادقة وتأكيد التوقيع حرصاً على سرعة قيد المستند قانونياً.\nشاكرين لسيادتكم حسن التعاون.`;
    } else if (type === "fee_reminder") {
      const remainingAmount = item.rawObject?.remainingFees || 0;
      body = `${officeHeader}عناية الموكل الفاضل / *${item.clientName}* المحترم،\nتحية طيبة وبعد،،\n\nإلحاقاً بالاتفاق المالي المبرم بشأن مباشرة الإجراءات والرسوم القضائية في قضيتكم:\n📋 *المتبقي من الأتعاب والمصروفات:* ${remainingAmount.toLocaleString("ar-EG")} جنيه مصري.\n\nيرجى التكرم بترتيب سداد الدفعة المستحقة لمواصلة سداد الرسوم وإيداع المذكرات.\nمع خالص التقدير والتحية.`;
    } else if (type === "documents_request") {
      body = `${officeHeader}عناية الموكل الفاضل / *${item.clientName}* المحترم،\nتحية طيبة وبعد،،\n\nنرجو من سيادتكم التكرم بموافاتنا بالمستندات والأوراق القانونية المطلوبة لجلسة القضية رقم (${item.caseNumber || "---"}):\n📑 *المطلوب:* ${item.actionRequired}\n\nشاكرين ومقدرين سرعة تعاونكم.`;
    } else if (type === "judgment_alert") {
      body = `${officeHeader}عناية الموكل الفاضل / *${item.clientName}* المحترم،\nتحية طيبة وبعد،،\n\nيسر ديوان المحاماة إحاطتكم علماً بصدور قرار/حكم قضائي في قضيتكم رقم (${item.caseNumber || "---"}):\n📜 *القرار القضائي:* ${item.actionRequired}\n\nيسعدنا تواصلكم لترتيب الخطوات التنفيذية التالية.`;
    } else {
      body = `${officeHeader}عناية الأستاذ / *${item.clientName}*،\nبشأن موضوع: ${item.title}\n\n${item.details}\n\nالإجراء المطلوب: ${item.actionRequired}`;
    }

    setCustomMessage(body);
  };

  // Trigger Send WhatsApp
  const handleSendWhatsApp = () => {
    if (!targetPhone.trim()) {
      alert("يرجى إدخال رقم هاتف صحيح للموكل");
      return;
    }

    // Clean phone number (Egypt +20 / remove non-digits)
    let cleanPhone = targetPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "20" + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith("20") && cleanPhone.length === 10) {
      cleanPhone = "20" + cleanPhone;
    }

    const encodedMessage = encodeURIComponent(customMessage);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    // Save alert record
    const newRecord: SentWhatsAppAlertRecord = {
      id: "wa-" + Date.now(),
      clientId: activeAlertItem?.clientName,
      clientName: activeAlertItem?.clientName || "موكل",
      phone: targetPhone,
      messageType: alertMessageType,
      messageText: customMessage,
      sentAt: new Date().toISOString(),
      caseNumber: activeAlertItem?.caseNumber,
      status: "sent"
    };

    const updated = [newRecord, ...sentAlerts];
    setSentAlerts(updated);
    localStorage.setItem("law_sent_whatsapp_alerts", JSON.stringify(updated));

    // Open WhatsApp in new tab
    window.open(waUrl, "_blank");
    setActiveAlertItem(null);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* 1. Header Toolbar with Extracted Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
              لوحة متابعة الموكلين والمستخدمين (الحالات العاجلة)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate("sessions")}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>أجندة الجلسات</span>
          </button>
          <button
            onClick={() => onNavigate("cases")}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>سجل القضايا</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>إجمالي الحالات العاجلة</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{counts.all}</div>
        </div>

        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 p-3.5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center text-xs text-red-600 dark:text-red-300 font-bold">
            <span>حرجة جداً (1-24 ساعة)</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{counts.critical}</div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 p-3.5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center text-xs text-blue-600 dark:text-blue-300 font-bold">
            <span>جلسات قادمة (≤7 أيام)</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{counts.session}</div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 p-3.5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center text-xs text-amber-700 dark:text-amber-300 font-bold">
            <span>توقيعات ومذكرات معلقة</span>
            <FileSignature className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{counts.signature + counts.client_note}</div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 p-3.5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center text-xs text-emerald-700 dark:text-emerald-300 font-bold">
            <span>أتعاب مستحقة السداد</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{counts.fee}</div>
        </div>
      </div>

      {/* 2. Controls & Search Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الموكل، رقم القضية، اسم المحكمة، أو الإجراء المطلوب..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>

          {/* Filter Categories Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-3 py-2 rounded-xl text-xs font-black transition shrink-0 ${
                selectedFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              الكل ({counts.all})
            </button>
            <button
              onClick={() => setSelectedFilter("session")}
              className={`px-3 py-2 rounded-xl text-xs font-black transition shrink-0 flex items-center gap-1 ${
                selectedFilter === "session"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>جلسات قادمة ({counts.session})</span>
            </button>
            <button
              onClick={() => setSelectedFilter("signature")}
              className={`px-3 py-2 rounded-xl text-xs font-black transition shrink-0 flex items-center gap-1 ${
                selectedFilter === "signature"
                  ? "bg-amber-600 text-white shadow"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>توقيعات معلقة ({counts.signature})</span>
            </button>
            <button
              onClick={() => setSelectedFilter("client_note")}
              className={`px-3 py-2 rounded-xl text-xs font-black transition shrink-0 flex items-center gap-1 ${
                selectedFilter === "client_note"
                  ? "bg-purple-600 text-white shadow"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>مذكرات موكلين ({counts.client_note})</span>
            </button>
            <button
              onClick={() => setSelectedFilter("fee")}
              className={`px-3 py-2 rounded-xl text-xs font-black transition shrink-0 flex items-center gap-1 ${
                selectedFilter === "fee"
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>أتعاب مستحقة ({counts.fee})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Urgent Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              لا توجد حالات عاجلة أو جلسات مقاربة على الانتهاء حالياً
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              جميع مواعيد الجلسات والمذكرات ومطالبات الأتعاب والتوقيعات الإلكترونية مستوفاة ومنظمة بنجاح.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-sm transition hover:shadow-md ${
                item.severity === "critical"
                  ? "border-red-400 dark:border-red-700 bg-red-50/20 dark:bg-red-950/10"
                  : item.severity === "urgent"
                  ? "border-amber-400 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                
                {/* Left/Main Information */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Severity Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                      item.severity === "critical"
                        ? "bg-red-600 text-white animate-pulse"
                        : item.severity === "urgent"
                        ? "bg-amber-500 text-slate-950 font-extrabold"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    }`}>
                      {item.severity === "critical" ? "⚡ عاجل جداً" : item.severity === "urgent" ? "⚠️ مطلوب إجراء" : "ℹ️ متابعة"}
                    </span>

                    {/* Type Badge */}
                    <span className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.type === "session" || item.type === "case_action" ? "🏛️ جلسة محكمة" : item.type === "signature" ? "✍️ توقيع إلكتروني" : item.type === "client_note" ? "📝 مذكرة موكل" : "💰 مطالبة مالية"}
                    </span>

                    {/* Due Date Indicator */}
                    <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{new Date(item.dateOrDeadline).toLocaleDateString("ar-EG")}</span>
                      {item.daysRemaining === 0 && <span className="text-red-600 font-black mr-1">(اليوم)</span>}
                      {item.daysRemaining === 1 && <span className="text-amber-600 font-black mr-1">(غداً)</span>}
                      {item.daysRemaining > 1 && <span className="text-blue-600 font-bold mr-1">({item.daysRemaining} أيام متبقية)</span>}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{item.title}</span>
                  </h3>

                  {/* Client & Case Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 font-bold">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      <span>الموكل: {item.clientName}</span>
                    </div>

                    {item.clientPhone && (
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span dir="ltr">{item.clientPhone}</span>
                      </div>
                    )}

                    {item.caseNumber && (
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-blue-600" />
                        <span>القضية: {item.caseNumber}/{item.caseYear}</span>
                      </div>
                    )}
                  </div>

                  {/* Details Summary */}
                  <div className="bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 text-xs">
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {item.details}
                    </div>
                    <div className="mt-1 text-[11px] text-amber-800 dark:text-amber-400 font-bold flex items-center gap-1">
                      <span>⚡ الإجراء المطلوب:</span>
                      <span className="font-normal">{item.actionRequired}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-row lg:flex-col items-center gap-2 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                  
                  {/* WhatsApp Alert Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenAlertModal(item)}
                    className="flex-1 lg:flex-none w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 rotate-180" />
                    <span>تنبيه واتساب مباشر 💬</span>
                  </button>

                  <div className="flex items-center gap-1.5 w-full">
                    {/* View Details / Navigate */}
                    <button
                      type="button"
                      onClick={() => {
                        if (item.type === "session") onNavigate("sessions");
                        else if (item.type === "fee") onNavigate("fees");
                        else if (item.type === "client_note" || item.type === "signature") onNavigate("dashboard");
                        else onNavigate("cases", { caseId: item.rawObject?.id });
                      }}
                      className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>فتح السجل</span>
                    </button>

                    {/* Copy Link / Phone */}
                    <button
                      type="button"
                      onClick={() => {
                        if (item.clientPhone) {
                          navigator.clipboard.writeText(item.clientPhone);
                          setCopiedId(item.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }
                      }}
                      title="نسخ رقم الهاتف"
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. WhatsApp Direct Dispatch Modal */}
      {activeAlertItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-emerald-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Send className="w-5 h-5 rotate-180" />
                </div>
                <div>
                  <h3 className="text-sm font-black">إرسال تنبيه واتساب رسمي للموكل</h3>
                  <p className="text-[11px] text-emerald-100">صادر مباشرة من ديوان المحاماة والاستشارات القانونية</p>
                </div>
              </div>
              <button
                onClick={() => setActiveAlertItem(null)}
                className="p-1.5 hover:bg-white/20 rounded-xl text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-right">
              
              {/* Target Phone Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>رقم هاتف الموكل (WhatsApp):</span>
                  <span className="text-[10px] text-slate-500">المستلم: {activeAlertItem.clientName}</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    dir="ltr"
                    value={targetPhone}
                    onChange={(e) => {
                      setTargetPhone(e.target.value);
                      generateMessageText(activeAlertItem, alertMessageType, e.target.value);
                    }}
                    placeholder="مثال: 01012345678"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm outline-none focus:border-emerald-500 text-right"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Template Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  نوع الرسالة والنموذج القانوني المعتمد:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAlertMessageType("session_reminder");
                      generateMessageText(activeAlertItem, "session_reminder", targetPhone);
                    }}
                    className={`p-2 rounded-xl text-[11px] font-bold border text-right transition ${
                      alertMessageType === "session_reminder"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    ⚖️ تذكير بالجلسة
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAlertMessageType("signature_request");
                      generateMessageText(activeAlertItem, "signature_request", targetPhone);
                    }}
                    className={`p-2 rounded-xl text-[11px] font-bold border text-right transition ${
                      alertMessageType === "signature_request"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    ✍️ رابط التوقيع
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAlertMessageType("documents_request");
                      generateMessageText(activeAlertItem, "documents_request", targetPhone);
                    }}
                    className={`p-2 rounded-xl text-[11px] font-bold border text-right transition ${
                      alertMessageType === "documents_request"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    📑 طلب مستندات
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAlertMessageType("judgment_alert");
                      generateMessageText(activeAlertItem, "judgment_alert", targetPhone);
                    }}
                    className={`p-2 rounded-xl text-[11px] font-bold border text-right transition ${
                      alertMessageType === "judgment_alert"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    📜 إشعار بحكم
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAlertMessageType("fee_reminder");
                      generateMessageText(activeAlertItem, "fee_reminder", targetPhone);
                    }}
                    className={`p-2 rounded-xl text-[11px] font-bold border text-right transition ${
                      alertMessageType === "fee_reminder"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    💰 سداد أتعاب
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAlertMessageType("custom");
                      generateMessageText(activeAlertItem, "custom", targetPhone);
                    }}
                    className={`p-2 rounded-xl text-[11px] font-bold border text-right transition ${
                      alertMessageType === "custom"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    ✏️ رسالة مخصصة
                  </button>
                </div>
              </div>

              {/* Message Text Editor */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>نص الرسالة المجهزة للإرسال (يمكنك التعديل):</span>
                  <span className="text-[10px] text-slate-400">{customMessage.length} حرف</span>
                </label>
                <textarea
                  rows={6}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-sans outline-none focus:border-emerald-500 leading-relaxed text-right"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>سيتم فتح تطبيق الواتساب أو واتساب ويب فوراً مع إرفاق النص الكامل معتمداً باسم ديوان الأستاذ المحامي.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(customMessage);
                  alert("تم نسخ نص الرسالة للحافظة بنجاح!");
                }}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ النص</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAlertItem(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                  <span>فتح الواتساب وإرسال الآن 🚀</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
