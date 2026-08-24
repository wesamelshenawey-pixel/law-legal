import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, 
  X, 
  FileText, 
  Briefcase, 
  Users, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  ShieldAlert, 
  ClipboardList, 
  ArrowRight, 
  Sparkles, 
  FileSpreadsheet, 
  Image as ImageIcon,
  Building,
  ExternalLink,
  Filter,
  Layers
} from "lucide-react";
import * as XLSX from "xlsx";
import { 
  CaseRecord, 
  ClientProfile, 
  SessionRecord, 
  FeeTransfer, 
  LawCodeBook,
  Announcement
} from "../types";

export interface GlobalSearchResult {
  id: string;
  category: "section" | "case" | "client" | "session" | "document" | "police_report" | "admin_task" | "fee" | "law_code";
  categoryLabel: string;
  title: string;
  subtitle: string;
  snippet?: string;
  date?: string;
  targetSection: string;
  badgeColor: string;
  icon: React.ReactNode;
  metadata?: any;
}

interface GlobalSearchViewProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CaseRecord[];
  clients: ClientProfile[];
  sessions: SessionRecord[];
  fees: FeeTransfer[];
  lawCodes: LawCodeBook[];
  announcements?: Announcement[];
  managedDocuments?: any[];
  policeReports?: any[];
  adminTasks?: any[];
  onNavigateTo: (section: string, metadata?: any) => void;
  language: "ar" | "en";
}

export default function GlobalSearchView({
  isOpen,
  onClose,
  cases,
  clients,
  sessions,
  fees,
  lawCodes,
  announcements = [],
  managedDocuments = [],
  policeReports = [],
  adminTasks = [],
  onNavigateTo,
  language
}: GlobalSearchViewProps) {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [extractedFileIndex, setExtractedFileIndex] = useState<{ id: string; name: string; type: string; text: string; section: string; parentTitle: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSelectedFilter("all");
    }
  }, [isOpen]);

  // Index client-side and stored documents
  useEffect(() => {
    const docsIndex: { id: string; name: string; type: string; text: string; section: string; parentTitle: string }[] = [];

    // 1. Index documents in cases
    cases.forEach(c => {
      if (c.attachments) {
        c.attachments.forEach((att, idx) => {
          docsIndex.push({
            id: `case-att-${c.id}-${idx}`,
            name: att.name,
            type: att.type,
            text: `${att.name} ${c.caseNumber} ${c.subject} ${c.clientName} ${c.competentCourt}`,
            section: "cases",
            parentTitle: `قضية رقم ${c.caseNumber} لسنة ${c.caseYear} - ${c.clientName}`
          });
        });
      }
    });

    // 2. Index personal documents in clients
    clients.forEach(cl => {
      if (cl.personalDocuments) {
        cl.personalDocuments.forEach(docItem => {
          docsIndex.push({
            id: `client-doc-${docItem.id}`,
            name: docItem.name,
            type: "document",
            text: `${docItem.name} ${cl.name} ${cl.nationalId} ${cl.poaNumber} ${cl.phone || ""}`,
            section: "clients",
            parentTitle: `ملف الموكل: ${cl.name}`
          });
        });
      }
    });

    // 3. Index stored smart ocr docs from localStorage
    try {
      const savedOcr = localStorage.getItem("law_ocr_items");
      if (savedOcr) {
        const parsedOcr = JSON.parse(savedOcr);
        if (Array.isArray(parsedOcr)) {
          parsedOcr.forEach((item: any) => {
            docsIndex.push({
              id: item.id || `ocr-${Math.random()}`,
              name: item.name || item.fileName || "مستند فحص OCR",
              type: "ocr",
              text: `${item.name || ""} ${item.text || item.extractedText || ""} ${item.notes || ""}`,
              section: "smart_ocr",
              parentTitle: "استوديو الفحص الضوئي واستخراج النصوص"
            });
          });
        }
      }
      
      const savedPoa = localStorage.getItem("law_poa_docs");
      if (savedPoa) {
        const parsedPoa = JSON.parse(savedPoa);
        if (Array.isArray(parsedPoa)) {
          parsedPoa.forEach((p: any) => {
            docsIndex.push({
              id: p.id || `poa-${Math.random()}`,
              name: `توكيل للموكل: ${p.clientName || "غير محدد"}`,
              type: "poa",
              text: `توكيل رسمي موكل ${p.clientName || ""} ${p.textResult || ""}`,
              section: "smart_ocr",
              parentTitle: "استخراج التوكيلات السريع"
            });
          });
        }
      }

      const savedEditorDocs = localStorage.getItem("law_saved_editor_documents");
      if (savedEditorDocs) {
        const parsedDocs = JSON.parse(savedEditorDocs);
        if (Array.isArray(parsedDocs)) {
          parsedDocs.forEach((ed: any) => {
            docsIndex.push({
              id: ed.id || `editor-doc-${Math.random()}`,
              name: ed.title || "مستند صياغة قضائية",
              type: "word",
              text: `${ed.title || ""} ${ed.content || ""}`,
              section: "doc_editor",
              parentTitle: "محرر المستندات والصياغة القضائية"
            });
          });
        }
      }
    } catch (e) {
      console.warn("Could not index local storage docs:", e);
    }

    setExtractedFileIndex(docsIndex);
  }, [cases, clients]);

  // Main application sections index for instant section jump
  const appSections = useMemo(() => [
    { id: "dashboard", title: "لوحة المتابعة الشاملة (Dashboard)", keywords: "رئيسية احصائيات تقارير متابعة ملخص", icon: <Layers className="w-4 h-4" /> },
    { id: "cases", title: "إدارة القضايا والدعاوى", keywords: "قضايا دعاوى أحكام عريضة جنح جنايات محكمة", icon: <Briefcase className="w-4 h-4" /> },
    { id: "clients", title: "سجل الموكلين وجهات الاتصال", keywords: "موكلين عملاء أرقام توكيلات بطاقات هواتف", icon: <Users className="w-4 h-4" /> },
    { id: "sessions", title: "الأجندة والتقويم القضائي الموحد", keywords: "جلسات تقويم أجندة سرود محكمة تأجيل قرار رول", icon: <Calendar className="w-4 h-4" /> },
    { id: "fees", title: "الخزينة والأتعاب والتحصيلات", keywords: "أتعاب فلوس خزينة دفعات أقساط إيصالات مصاريف", icon: <DollarSign className="w-4 h-4" /> },
    { id: "doc_editor", title: "محرر المستندات والصياغة القضائية", keywords: "محرر صياغة عقود مذكرات دفاع عرائض وورد طباعة", icon: <FileText className="w-4 h-4" /> },
    { id: "smart_ocr", title: "استوديو الفحص واستخراج النصوص (AI OCR)", keywords: "ocr ماسح ضوئي قراءة صور توكيلات نصوص ذكاء اصطناعي", icon: <Sparkles className="w-4 h-4" /> },
    { id: "lawcodes", title: "المكتبة والأكواد القضائية المصرية", keywords: "قانون عقوبات مدني إجراءات أحوال شخصية نقض تشريعات", icon: <BookOpen className="w-4 h-4" /> },
    { id: "adminwork", title: "الأعمال الإدارية وشؤون المحاكم", keywords: "إداري استخراج شهادة سداد تنفيذ إعلان خبير محضرين", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "companies", title: "إدارة الشركات والمؤسسات", keywords: "شركات سجل تجاري ضرائب جمعيات عقود تأسيس", icon: <Building className="w-4 h-4" /> },
    { id: "announcements", title: "شريط الإعلانات والتعميمات القضائية", keywords: "إعلانات تعميمات نشرة قرارات نقابة", icon: <ShieldAlert className="w-4 h-4" /> },
    { id: "ai", title: "المستشار الذكي (AI Legal Assistant)", keywords: "مستشار ذكي شات روبوت استشارة ثغرات تقدير أتعاب", icon: <Sparkles className="w-4 h-4" /> },
    { id: "social", title: "ديوان التواصل والاستشارات", keywords: "تواصل استشارات واتساب رسائل استفسارات", icon: <Users className="w-4 h-4" /> },
    { id: "settings", title: "إعدادات النظام والتراخيص", keywords: "إعدادات ترخيص نسخة تفعيل حماية أمان", icon: <Layers className="w-4 h-4" /> },
  ], []);

  // Filter Categories
  const categoriesList = [
    { id: "all", label: "الكل" },
    { id: "cases", label: "القضايا والدعاوى" },
    { id: "clients", label: "الموكلين والخصوم" },
    { id: "sessions", label: "الجلسات والتقويم" },
    { id: "documents", label: "المستندات والملفات المرفوعة (Word/PDF/OCR)" },
    { id: "police_reports", label: "المحاضر والشكاوى" },
    { id: "admin_tasks", label: "الأعمال الإدارية" },
    { id: "fees", label: "الأتعاب والخزينة" },
    { id: "law_codes", label: "الأكواد ومواد القانون" },
    { id: "sections", label: "أقسام المنصة" }
  ];

  // Perform multi-dimensional search
  const searchResults: GlobalSearchResult[] = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const results: GlobalSearchResult[] = [];

    // Helper to check match
    const isMatch = (...strings: (string | undefined | null)[]) => {
      return strings.some(s => s && s.toLowerCase().includes(cleanQuery));
    };

    // 1. Search Sections
    if (selectedFilter === "all" || selectedFilter === "sections") {
      appSections.forEach(sec => {
        if (isMatch(sec.title, sec.keywords, sec.id)) {
          results.push({
            id: `sec-${sec.id}`,
            category: "section",
            categoryLabel: "قسم في المنصة",
            title: sec.title,
            subtitle: `الانتقال المباشر إلى ${sec.title}`,
            targetSection: sec.id,
            badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200",
            icon: sec.icon
          });
        }
      });
    }

    // 2. Search Cases
    if (selectedFilter === "all" || selectedFilter === "cases") {
      cases.forEach(c => {
        if (isMatch(c.caseNumber, String(c.caseYear), c.subject, c.clientName, c.opponentName, c.competentCourt, c.courtType, c.details, c.code)) {
          results.push({
            id: `case-${c.id}`,
            category: "case",
            categoryLabel: "ملف قضية",
            title: `قضية رقم ${c.caseNumber} لسنة ${c.caseYear} (${c.courtType || "محكمة"})`,
            subtitle: `الموكل: ${c.clientName} | الخصم: ${c.opponentName || "غير محدد"} | المحكمة: ${c.competentCourt}`,
            snippet: c.details ? c.details.slice(0, 140) + "..." : c.subject,
            date: c.nextSessionDate ? `الجلسة: ${c.nextSessionDate}` : undefined,
            targetSection: "cases",
            badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200",
            icon: <Briefcase className="w-4 h-4 text-amber-600" />,
            metadata: { caseId: c.id }
          });
        }
      });
    }

    // 3. Search Clients
    if (selectedFilter === "all" || selectedFilter === "clients") {
      clients.forEach(cl => {
        if (isMatch(cl.name, cl.nationalId, cl.phone, cl.poaNumber, cl.poaOffice, cl.subject, cl.address, cl.code, cl.whatsapp)) {
          results.push({
            id: `client-${cl.id}`,
            category: "client",
            categoryLabel: "سجل موكل",
            title: cl.name,
            subtitle: `الرقم القومي: ${cl.nationalId || "غير مسجل"} | التوكيل: ${cl.poaNumber || "بدون"} ${cl.poaOffice ? `(${cl.poaOffice})` : ""} | الهاتف: ${cl.phone || "غير مسجل"}`,
            snippet: cl.address ? `العنوان: ${cl.address}` : `القضية المرتبطة: ${cl.caseNumber || "لا يوجد"}`,
            targetSection: "clients",
            badgeColor: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
            icon: <Users className="w-4 h-4 text-emerald-600" />,
            metadata: { clientId: cl.id }
          });
        }
      });
    }

    // 4. Search Sessions & Calendar
    if (selectedFilter === "all" || selectedFilter === "sessions") {
      sessions.forEach(s => {
        if (isMatch(s.date, s.caseInfo?.caseNumber, String(s.caseInfo?.caseYear), s.caseInfo?.clientName, s.caseInfo?.opponentName, s.caseInfo?.competentCourt, s.caseInfo?.subject, s.caseInfo?.circuit, s.decision, s.requiredWork)) {
          results.push({
            id: `session-${s.id}`,
            category: "session",
            categoryLabel: "جلسة قضائية",
            title: `جلسة ${s.date} - قضية ${s.caseInfo?.caseNumber || ""}/${s.caseInfo?.caseYear || ""} (${s.caseInfo?.competentCourt || ""})`,
            subtitle: `الموكل: ${s.caseInfo?.clientName || ""} | الدائرة: ${s.caseInfo?.circuit || "عام"} | التوقيت: ${s.timeType === "morning" ? "صباحي ٩ ص" : "مسائي ١٢ م"}`,
            snippet: s.requiredWork ? `العمل المطلوب: ${s.requiredWork}` : s.decision ? `القرار السابق: ${s.decision}` : s.caseInfo?.subject,
            date: s.date,
            targetSection: "sessions",
            badgeColor: "bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200",
            icon: <Calendar className="w-4 h-4 text-purple-600" />,
            metadata: { sessionId: s.id, sessionDate: s.date }
          });
        }
      });
    }

    // 5. Search Documents & Attachments & OCR Text (Word, PDF, Excel, OCR Scans)
    if (selectedFilter === "all" || selectedFilter === "documents") {
      extractedFileIndex.forEach(docItem => {
        if (isMatch(docItem.name, docItem.text, docItem.parentTitle)) {
          const isDocx = docItem.name.toLowerCase().endsWith(".docx") || docItem.type === "word";
          const isXlsx = docItem.name.toLowerCase().endsWith(".xlsx") || docItem.name.toLowerCase().endsWith(".csv") || docItem.type === "excel";
          const isOcr = docItem.type === "ocr" || docItem.type === "poa";

          results.push({
            id: docItem.id,
            category: "document",
            categoryLabel: isDocx ? "مستند Word" : isXlsx ? "شيت Excel" : isOcr ? "نص مستخرج بـ AI OCR" : "ملف مرفوع",
            title: docItem.name,
            subtitle: `تابع لـ: ${docItem.parentTitle}`,
            snippet: docItem.text ? docItem.text.slice(0, 160) + "..." : "مستند مؤرشف بالنظام",
            targetSection: docItem.section,
            badgeColor: isDocx ? "bg-blue-100 text-blue-900 border-blue-300" : isXlsx ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "bg-cyan-100 text-cyan-900 border-cyan-300",
            icon: isDocx ? <FileText className="w-4 h-4 text-blue-600" /> : isXlsx ? <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> : <ImageIcon className="w-4 h-4 text-cyan-600" />,
            metadata: { docId: docItem.id }
          });
        }
      });
    }

    // 6. Search Police Reports (المحاضر والشكاوى)
    if (selectedFilter === "all" || selectedFilter === "police_reports") {
      policeReports.forEach((pr: any, idx) => {
        if (isMatch(pr.reportNumber, pr.station, pr.subject, pr.clientName, pr.opponentName, pr.prosecutionOffice, pr.status, pr.details)) {
          results.push({
            id: `pr-${pr.id || idx}`,
            category: "police_report",
            categoryLabel: "محضر شرطة / شكوى",
            title: `محضر رقم ${pr.reportNumber || "---"} (${pr.station || "قسم الشرطة"})`,
            subtitle: `المجني عليه/الشاكي: ${pr.clientName || ""} | المشكو في حقه: ${pr.opponentName || ""} | النيابة: ${pr.prosecutionOffice || ""}`,
            snippet: pr.details || pr.subject,
            targetSection: "sessions",
            badgeColor: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-300 border-red-200",
            icon: <ShieldAlert className="w-4 h-4 text-red-600" />,
            metadata: { tab: "police_records" }
          });
        }
      });
    }

    // 7. Search Admin Tasks
    if (selectedFilter === "all" || selectedFilter === "admin_tasks") {
      adminTasks.forEach((task: any, idx) => {
        if (isMatch(task.title, task.court, task.assignedTo, task.details, task.status, task.notes)) {
          results.push({
            id: `adm-${task.id || idx}`,
            category: "admin_task",
            categoryLabel: "عمل إداري قضائي",
            title: task.title || "مهمة إدارية",
            subtitle: `المحكمة: ${task.court || "المحكمة المختصة"} | المكلف بالمتابعة: ${task.assignedTo || "المحامي"} | الحالة: ${task.status || "قيد التنفيذ"}`,
            snippet: task.details || task.notes,
            date: task.deadline ? `آخر موعد: ${task.deadline}` : undefined,
            targetSection: "sessions",
            badgeColor: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200",
            icon: <ClipboardList className="w-4 h-4 text-indigo-600" />,
            metadata: { tab: "admin_tasks" }
          });
        }
      });
    }

    // 8. Search Fees & Treasury
    if (selectedFilter === "all" || selectedFilter === "fees") {
      fees.forEach(f => {
        if (isMatch(f.clientName, String(f.amount), f.notes, f.type, f.caseNumber, f.date)) {
          results.push({
            id: `fee-${f.id}`,
            category: "fee",
            categoryLabel: "سند خزينة وأتعاب",
            title: `تحصيل مبلغ ${f.amount.toLocaleString()} ${f.currency || "EGP"} (${f.clientName})`,
            subtitle: `طريقة الدفع: ${f.type === "cash" ? "نقدي" : f.type === "bank" ? "تحويل بنكي" : "محفظة إلكترونية"} | التاريخ: ${f.date}`,
            snippet: f.notes ? `ملاحظات: ${f.notes}` : undefined,
            date: f.date,
            targetSection: "fees",
            badgeColor: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
            icon: <DollarSign className="w-4 h-4 text-emerald-600" />
          });
        }
      });
    }

    // 9. Search Law Codes
    if (selectedFilter === "all" || selectedFilter === "law_codes") {
      lawCodes.forEach(lc => {
        if (isMatch(lc.title, lc.category, lc.contentMarkdown)) {
          results.push({
            id: `code-${lc.id}`,
            category: "law_code",
            categoryLabel: "المكتبة والأكواد القانونية",
            title: lc.title,
            subtitle: `التصنيف: ${lc.category || "التشريعات المصرية"}`,
            snippet: lc.contentMarkdown ? lc.contentMarkdown.slice(0, 160).replace(/[#*`_]/g, "") + "..." : undefined,
            targetSection: "lawcodes",
            badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300",
            icon: <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          });
        }
      });
    }

    return results;
  }, [query, selectedFilter, cases, clients, sessions, fees, lawCodes, appSections, extractedFileIndex, policeReports, adminTasks]);

  const highlightMatch = (text: string | undefined, highlight: string) => {
    if (!text || !highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 dark:bg-amber-500/40 text-slate-950 dark:text-amber-200 rounded-xs px-0.5 font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleSelectResult = (item: GlobalSearchResult) => {
    onNavigateTo(item.targetSection, item.metadata);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      
      {/* Search Modal Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all">
        
        {/* Header and Search Input */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
              <Search className="w-5 h-5" />
            </div>
            
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث في كامل المنونة: القضايا، الموكلين، الجلسات، ملفات Word/Excel، صور الـ OCR، المحاضر، الأتعاب، مواد القانون..."
                className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm sm:text-base font-bold outline-none text-right"
              />
            </div>

            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer text-xs font-bold"
            >
              إلغاء [ESC]
            </button>
          </div>

          {/* Categories Tab Filter Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] pt-4 pb-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
            {categoriesList.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedFilter(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedFilter === cat.id
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {!query.trim() ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">البحث الشامل والمتقدم في ديوان المحاماة</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  اكتب أي رقم قضية، اسم موكل، رقم قومي، رقم توكيل، محكمة، أو ابحث في نصوص مستندات Word والإكسيل المرفوعة والصور المستخرجة عبر الذكاء الاصطناعي.
                </p>
              </div>

              {/* Quick Shortcuts Suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="text-[11px] text-slate-500 font-bold">اقتراحات سريعة:</span>
                {["قضية", "توكيل", "استخراج", "جلسة", "عقد", "أتعاب", "محضر"].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-500 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">لم يتم العثور على نتائج مطابقة لـ "{query}"</p>
              <p className="text-xs text-slate-400">جرب البحث بكلمة أخرى أو تغيير تصنيف التصفية من الأعلى.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1 text-xs font-bold text-slate-500">
                <span>تم العثور على {searchResults.length} نتيجة بحث:</span>
                <span className="text-[11px] text-amber-600 font-normal">اضغط على أي عنصر للانتقال إليه مباشرة</span>
              </div>

              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectResult(item)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer group flex items-start gap-3.5"
                >
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 mt-0.5 group-hover:scale-105 transition">
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${item.badgeColor}`}>
                        {item.categoryLabel}
                      </span>
                      {item.date && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.date}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition truncate">
                      {highlightMatch(item.title, query)}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {highlightMatch(item.subtitle, query)}
                    </p>

                    {item.snippet && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                        {highlightMatch(item.snippet, query)}
                      </div>
                    )}
                  </div>

                  <div className="self-center flex items-center gap-1 text-slate-400 group-hover:text-amber-500 transition text-xs font-bold">
                    <span className="hidden sm:inline">انتقال</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500 px-5">
          <span>نظام الفهرسة والبحث الشامل لمكتب الأستاذ وسام الشناوي</span>
          <span>اختصار سريع: اضغط <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded font-mono font-bold">Ctrl + K</kbd> من أي مكان</span>
        </div>

      </div>
    </div>
  );
}
