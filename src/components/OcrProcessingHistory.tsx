import React, { useState, useMemo, useEffect } from "react";
import {
  History,
  FileText,
  Download,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  Eye,
  ExternalLink,
  Calendar,
  Sparkles,
  RefreshCw,
  FolderDown,
  UserPlus,
  Briefcase,
  Layers,
  FileCode,
  FileSpreadsheet,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Clock,
  Printer
} from "lucide-react";
import { 
  PlatformUser, 
  ClientProfile, 
  CaseRecord, 
  OpponentProfile
} from "../types";
import { ExtractedLegalEntities } from "./SmartOcrStudio";

export interface OcrHistoryRecord {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: "image" | "pdf" | "scanned_doc";
  processedAt: string; // ISO string
  ocrMode: string;
  ocrModeLabel: string;
  status: "completed" | "partial" | "failed";
  accuracy: number; // percentage e.g. 98
  pageCount: number;
  extractedText: string;
  aiDraftedText?: string;
  summary?: string;
  entities?: ExtractedLegalEntities;
  previewUrl?: string;
  tags?: string[];
}

interface OcrProcessingHistoryProps {
  currentUser: PlatformUser;
  clients: ClientProfile[];
  cases: CaseRecord[];
  opponents?: OpponentProfile[];
  onAddClient: (newClient: ClientProfile) => void;
  onAddCase: (newCase: CaseRecord) => void;
  onAddOpponent?: (newOpponent: OpponentProfile) => void;
  onOpenInEditor?: (text: string, title?: string) => void;
  onNavigate?: (tab: string, params?: any) => void;
  onOpenSideBySide?: (doc: { name: string; imageSrc: string; rawText: string; entities?: ExtractedLegalEntities }) => void;
  language?: "ar" | "en";
}

const STORAGE_KEY = "law_ocr_processing_history_v2";

const SEED_HISTORY_DATA: OcrHistoryRecord[] = [
  {
    id: "hist-001",
    fileName: "صحيفة_افتتاح_دعوى_تعويض_مدني_2026.pdf",
    fileSize: "2.4 MB",
    fileType: "pdf",
    processedAt: "2026-08-26T11:45:00.000Z",
    ocrMode: "standard",
    ocrModeLabel: "مسح قضائي ذكي (مع تصحيح إملائي)",
    status: "completed",
    accuracy: 99,
    pageCount: 3,
    extractedText: `محكمة جنوب القاهرة الابتدائية - الدائرة 8 مدني كلي
بناءً على طلب السيد / محمود أحمد عبد الفتاح - المقيم بمصر الجديدة - القاهرة
ومحله المختار مكتب الأستاذ / وسام الشناوي المحامي بالنقض والدستورية العليا.
ضد: السيد / شركة النيل للتطوير العقاري والمقاولات العامة - ويمثلها قانوناً رئيس مجلس الإدارة.
الموضوع: دعوى إلزام بسداد تعويض مادي وأدبي قدره 500,000 جنيه مصري عن الإخلال ببنود التعاقد المؤرخ في 15-01-2025.
رقم الدعوى: 4892 لسنة 2026 مدني كلي جنوب القاهرة.
الطلبات: الحكم بإلزام المدعى عليه بأن يؤدي للطالب مبلغ التعويض المطلوب مع الفوائد القانونية والمصروفات ومقابل أتعاب المحاماة.`,
    aiDraftedText: `مذكرة بدفاع المدعي: نلتمس أصلياً إلزام المدعى عليه بقيمة الشرط الجزائي والتعويض المادي لجبر الضرر، واحتياطياً ندب خبير هندسي وحسابي لتقدير حجم الأضرار التراكمية الناتجة عن التأخير غير المبرر.`,
    summary: "دعوى تعويض مدني بمبلغ 500,000 ج.م أمام مدني كلي جنوب القاهرة نتيجة الإخلال ببنود عقد التطوير العقاري.",
    entities: {
      clientName: "محمود أحمد عبد الفتاح",
      nationalId: "28804150102934",
      phone: "01098765432",
      opponentName: "شركة النيل للتطوير العقاري والمقاولات",
      caseNumber: "4892",
      caseYear: "2026",
      competentCourt: "محكمة جنوب القاهرة الابتدائية - الدائرة 8 مدني كلي",
      courtType: "مدني كلي",
      subject: "إلزام بسداد تعويض مادي وأدبي 500,000 ج.م",
      demands: "إلزام المدعى عليها بالتعويض والفوائد والمصاريف وأتعاب المحاماة."
    },
    tags: ["تعويض مدني", "عقود مقاولات", "محكمة جنوب القاهرة"]
  },
  {
    id: "hist-002",
    fileName: "توكيل_خاص_قضايا_توثيق_الأهرام.jpg",
    fileSize: "890 KB",
    fileType: "image",
    processedAt: "2026-08-25T16:20:00.000Z",
    ocrMode: "poa",
    ocrModeLabel: "فحص التوكيلات ومأموريات الشهر العقاري",
    status: "completed",
    accuracy: 98,
    pageCount: 1,
    extractedText: `وزارة العدل - مصلحة الشهر العقاري والتوثيق
مكتب توثيق: الأهرام النموذجي
توكيل رسمي عام في القضايا رقم: 3412 / ب لسنة 2026
الموكل: السيدة / سارة إبراهيم الدسوقي - مصرية الجنسية - الرقم القومي: 29508120109988
الوكيل: الأستاذ / وسام الشناوي - المحامي المقيد بالنقض
الصلاحيات: التقرير بالطعن بالنقض والاستئناف والمعارضة، الحضور أمام جميع المحاكم، الصلح والإبراء، التنازل، الصرف، وتوكيل الغير.`,
    summary: "توكيل رسمي عام قضايا صادر من مكتب توثيق الأهرام النموذجي يتيح كافة الصلاحيات القضائية والصلح والنقض.",
    entities: {
      clientName: "سارة إبراهيم الدسوقي",
      nationalId: "29508120109988",
      phone: "01123456789",
      opponentName: "غير محدد بالتوكيل",
      caseNumber: "3412/ب",
      caseYear: "2026",
      competentCourt: "مكتب توثيق الأهرام النموذجي",
      courtType: "توثيق رسمي",
      subject: "توكيل رسمي عام في القضايا",
      demands: "حفظ وأرشفة سند الوكالة"
    },
    tags: ["توكيل قضايا", "شهر عقاري", "توثيق الأهرام"]
  },
  {
    id: "hist-003",
    fileName: "حكم_محكمة_استئناف_القاهرة_الدائرة_14.pdf",
    fileSize: "3.1 MB",
    fileType: "pdf",
    processedAt: "2026-08-24T09:15:00.000Z",
    ocrMode: "court_verdict",
    ocrModeLabel: "تحليل الأحكام ورول الجلسات",
    status: "completed",
    accuracy: 97,
    pageCount: 4,
    extractedText: `باسم الشعب - محكمة استئناف القاهرة - الدائرة 14 تجاري
بالجلسة العلنية المنعقدة بسراي المحكمة برئاسة السيد المستشار / رئيس الدائرة وعضوية السادة المستشارين.
في الاستئناف المقيد برقم 1024 لسنة 141 ق استئناف القاهرة.
المستأنف: شركة الأهرام للصناعات الغذائية والتوريدات (وكيلها الأستاذ / وسام الشناوي المحامي).
المستأنف ضده: بنك مصر - فرع طلعت حرب.
منطوق الحكم:
حكمت المحكمة بقبول الاستئناف شكلاً، وفي الموضوع بإلغاء الحكم المستأنف والقضاء مجدداً ببراءة ذمة المستأنفة من المبالغ المطالب بها، وإلزام المستأنف ضده بالمصروفات وأتعاب المحاماة.`,
    summary: "حكم استئناف بإلغاء الحكم الابتدائي وبراءة ذمة الموكل من المديونية المصرفية مع إلزام الخصم بالمصاريف.",
    entities: {
      clientName: "شركة الأهرام للصناعات الغذائية والتوريدات",
      nationalId: "سجل تجاري 189422",
      phone: "01234567890",
      opponentName: "بنك مصر - فرع طلعت حرب",
      caseNumber: "1024",
      caseYear: "141 ق",
      competentCourt: "محكمة استئناف القاهرة - الدائرة 14 تجاري",
      courtType: "استئناف تجاري",
      subject: "إلغاء حكم وبراءة ذمة من مديونية تجارية",
      demands: "تأييد براءة الذمة واسترداد خطاب الضمان."
    },
    tags: ["حكم استئناف", "قضاء تجاري", "براءة ذمة"]
  },
  {
    id: "hist-004",
    fileName: "بطاقة_رقم_قومي_المهندس_خالد_رشدي.jpg",
    fileSize: "540 KB",
    fileType: "image",
    processedAt: "2026-08-23T14:50:00.000Z",
    ocrMode: "national_id",
    ocrModeLabel: "استخراج الهوية والبيانات الشخصية",
    status: "completed",
    accuracy: 100,
    pageCount: 1,
    extractedText: `جمهورية مصر العربية - وزارة الداخلية - قطاع مصلحة الأحوال المدنية
بطاقة تحقيق الشخصية
الاسم: خالد رشدي عبد السلام التميمي
العنوان: 14 شارع النزهة - مصر الجديدة - قسم النزهة - القاهرة
المهنة: مهندس استشاري معماري - نقابة المهندسين
الرقم القومي: 28411030104875
تاريخ الميلاد: 03/11/1984
الحالة الاجتماعية: متزوج`,
    summary: "بيانات بطاقة الرقم القومي للمهندس خالد رشدي (مواليد 1984 - قسم النزهة).",
    entities: {
      clientName: "خالد رشدي عبد السلام التميمي",
      nationalId: "28411030104875",
      phone: "01011223344",
      opponentName: "غير محدد",
      caseNumber: "مستند هوية",
      caseYear: "2026",
      competentCourt: "مصلحة الأحوال المدنية",
      courtType: "إثبات هوية",
      subject: "إثبات صفة موكل - مهندس استشاري",
      demands: ""
    },
    tags: ["رقم قومي", "بيانات موكل", "مصر الجديدة"]
  }
];

export default function OcrProcessingHistory({
  currentUser,
  clients,
  cases,
  opponents = [],
  onAddClient,
  onAddCase,
  onAddOpponent,
  onOpenInEditor,
  onNavigate,
  onOpenSideBySide,
  language = "ar"
}: OcrProcessingHistoryProps) {
  // 1. History State
  const [historyRecords, setHistoryRecords] = useState<OcrHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return SEED_HISTORY_DATA;
  });

  // Sync to local storage safely
  const saveRecords = (records: OcrHistoryRecord[]) => {
    setHistoryRecords(records);
    try {
      const sanitized = records.slice(0, 30).map(r => ({
        ...r,
        previewUrl: r.previewUrl && r.previewUrl.length > 4000 ? undefined : r.previewUrl,
        extractedText: r.extractedText ? r.extractedText.slice(0, 15000) : "",
      }));
      let itemsToSave = [...sanitized];
      let saved = false;
      while (!saved && itemsToSave.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToSave));
          saved = true;
        } catch {
          itemsToSave.pop();
        }
      }
    } catch (e) {
      console.warn("Could not save full OCR history to local storage:", e);
    }
  };

  // 2. Search, Filter, and Sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "accuracy" | "pages">("newest");
  
  // 3. Selection & Modal inspection states
  const [selectedRecord, setSelectedRecord] = useState<OcrHistoryRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Copy handler
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showNotification("تم نسخ النص المستخرج إلى الحافظة بنجاح!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Download Text File (.txt)
  const handleDownloadTxt = (record: OcrHistoryRecord) => {
    const textBlob = new Blob([record.extractedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(textBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `OCR_${record.fileName.replace(/\.[^/.]+$/, "")}_استخراج.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`تم تنزيل النص المستخرج للمستند (${record.fileName}) كملف نصي.`);
  };

  // Quick Download Case Data JSON
  const handleDownloadCaseJson = (record: OcrHistoryRecord) => {
    const caseData = {
      ocrMeta: {
        recordId: record.id,
        fileName: record.fileName,
        processedAt: record.processedAt,
        ocrMode: record.ocrMode,
        accuracy: `${record.accuracy}%`,
        pageCount: record.pageCount
      },
      extractedLegalEntities: record.entities || {},
      summary: record.summary || "",
      aiDraftedText: record.aiDraftedText || "",
      extractedRawText: record.extractedText
    };

    const jsonBlob = new Blob([JSON.stringify(caseData, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `بيانات_قضائية_${record.fileName.replace(/\.[^/.]+$/, "")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`تم تنزيل ملف البيانات القضائية المنظمة (JSON) بنجاح.`);
  };

  // Quick Download Formatted Word File (.doc)
  const handleDownloadDoc = (record: OcrHistoryRecord) => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${record.fileName}</title>
        <style>
          body { font-family: 'Traditional Arabic', 'Arial', sans-serif; direction: rtl; text-align: right; margin: 30px; font-size: 14pt; line-height: 1.8; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 20pt; font-weight: bold; color: #1e3a8a; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12pt; }
          .meta-table td, .meta-table th { border: 1px solid #ccc; padding: 8px 12px; }
          .meta-table th { background-color: #f3f4f6; text-align: right; }
          .content-box { background-color: #fafafa; padding: 20px; border-radius: 8px; border: 1px solid #ddd; white-space: pre-wrap; font-size: 13pt; }
          .footer { margin-top: 40px; text-align: center; font-size: 10pt; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">مكتب الأستاذ وسام الشناوي - المحامي بالنقض</div>
          <div style="font-size: 12pt; margin-top: 5px; color: #555;">تقرير استخراج وفحص المستندات القضائية بالذكاء الاصطناعي (Smart OCR)</div>
        </div>

        <table class="meta-table">
          <tr>
            <th>اسم الملف الأصلي</th>
            <td>${record.fileName}</td>
            <th>تاريخ المعالجة</th>
            <td>${new Date(record.processedAt).toLocaleString("ar-EG")}</td>
          </tr>
          <tr>
            <th>نمط الفحص</th>
            <td>${record.ocrModeLabel}</td>
            <th>دقة التعرف التقديرية</th>
            <td>${record.accuracy}%</td>
          </tr>
          ${record.entities?.clientName ? `
          <tr>
            <th>الموكل / الطالب</th>
            <td>${record.entities.clientName}</td>
            <th>الخصم / المعلن إليه</th>
            <td>${record.entities.opponentName || "غير محدد"}</td>
          </tr>
          ` : ""}
          ${record.entities?.caseNumber ? `
          <tr>
            <th>رقم القضية</th>
            <td>${record.entities.caseNumber} لسنة ${record.entities.caseYear || "2026"}</td>
            <th>المحكمة المختصة</th>
            <td>${record.entities.competentCourt || "محاكم القاهرة"}</td>
          </tr>
          ` : ""}
        </table>

        <h3>النص القضائي المستخرج:</h3>
        <div class="content-box">${record.extractedText}</div>

        ${record.aiDraftedText ? `
        <h3 style="margin-top: 30px; color: #1e3a8a;">الصياغة والمذكرة القانونية المقترحة:</h3>
        <div class="content-box" style="background-color: #f0fdf4; border-color: #bbf7d0;">${record.aiDraftedText}</div>
        ` : ""}

        <div class="footer">
          تم استخراج هذا التقرير آلياً عبر منظومة Smart OCR Studio القانونية المتطورة.
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `مستند_قضائي_${record.fileName.replace(/\.[^/.]+$/, "")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`تم تصدير المستند (${record.fileName}) بصيغة Word بنجاح.`);
  };

  // Export All as CSV
  const handleExportAllCsv = () => {
    if (historyRecords.length === 0) return;
    
    const headers = ["المعرف", "اسم الملف", "تاريخ المعالجة", "نمط الفحص", "الدقة", "اسم الموكل", "الخصم", "رقم القضية", "المحكمة المختصة", "النص المستخرج"];
    const rows = historyRecords.map(r => [
      `"${r.id}"`,
      `"${r.fileName.replace(/"/g, '""')}"`,
      `"${new Date(r.processedAt).toLocaleString("ar-EG")}"`,
      `"${r.ocrModeLabel.replace(/"/g, '""')}"`,
      `"${r.accuracy}%"`,
      `"${(r.entities?.clientName || "").replace(/"/g, '""')}"`,
      `"${(r.entities?.opponentName || "").replace(/"/g, '""')}"`,
      `"${(r.entities?.caseNumber ? `${r.entities.caseNumber}/${r.entities.caseYear}` : "").replace(/"/g, '""')}"`,
      `"${(r.entities?.competentCourt || "").replace(/"/g, '""')}"`,
      `"${r.extractedText.replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);

    const csvContent = "\ufeff" + [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `سجل_معالجات_OCR_الشامل_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification("تم تصدير سجل المعالجات بالكامل بصيغة Excel / CSV بنجاح.");
  };

  // Direct Case Registration
  const handleRegisterCaseFromHistory = (record: OcrHistoryRecord) => {
    const ent: Partial<ExtractedLegalEntities> = record.entities || {};
    const newCase: CaseRecord = {
      id: `case-ocr-hist-${Date.now()}`,
      serialNumber: cases.length + 1,
      caseNumber: ent.caseNumber || `قضية-${Math.floor(Math.random() * 9000 + 1000)}`,
      caseYear: parseInt(ent.caseYear || "2026", 10) || 2026,
      competentCourt: ent.competentCourt || "محكمة استئناف القاهرة",
      courtType: ent.courtType || "مدني كلي",
      stage: "first_session",
      status: "active",
      subject: ent.subject || `دعوى مقيدة من سجل المعالجات: ${record.fileName}`,
      clientName: ent.clientName || "موكل مستخرج من الفحص",
      clientRole: "مدعي / طالب",
      opponentName: ent.opponentName || "الخصم الوارد بالأوراق",
      nextSessionDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      details: `تم قيد هذه القضية من سجل معالجات الـ OCR للمستند: ${record.fileName} بتاريخ ${new Date(record.processedAt).toLocaleDateString("ar-EG")}`,
      attachments: [],
      scans: [],
      createdAt: new Date().toISOString()
    };

    onAddCase(newCase);

    if (ent.clientName) {
      const newClient: ClientProfile = {
        id: `client-ocr-hist-${Date.now()}`,
        serialNumber: clients.length + 1,
        name: ent.clientName,
        nationalId: ent.nationalId || "29000000000000",
        poaNumber: "توكيل قيد التوثيق",
        poaLetter: "أ",
        poaYear: new Date().getFullYear(),
        poaOffice: "مكتب توثيق الأهرام",
        caseNumber: newCase.caseNumber,
        caseYear: newCase.caseYear,
        competentCourt: newCase.competentCourt,
        subject: newCase.subject,
        capacity: "مدعي / طالب",
        phone: ent.phone || "01000000000",
        remainingFees: 0,
        status: "active",
        createdAt: new Date().toISOString()
      };
      onAddClient(newClient);
    }

    showNotification(`تم قيد القضية (${newCase.caseNumber}/${newCase.caseYear}) والموكل في ديوان القضايا بنجاح!`);
  };

  // Delete single record
  const handleDeleteRecord = (id: string) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا المستند من سجل المعالجات السابقة؟")) {
      const updated = historyRecords.filter(r => r.id !== id);
      saveRecords(updated);
      if (selectedRecord?.id === id) setSelectedRecord(null);
      showNotification("تم حذف المستند من سجل المعالجة.");
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm("تحذير: هل أنت متأكد من تفريغ وحذف سجل المعالجات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.")) {
      saveRecords([]);
      setSelectedRecord(null);
      showNotification("تم تفريغ سجل المعالجات بالكامل.");
    }
  };

  // Restore Default Seeds
  const handleRestoreDefaults = () => {
    saveRecords(SEED_HISTORY_DATA);
    showNotification("تمت استعادة نماذج السجل الافتراضية بنجاح.");
  };

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    return historyRecords.filter(record => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = record.fileName.toLowerCase().includes(q);
        const matchText = record.extractedText.toLowerCase().includes(q);
        const matchClient = record.entities?.clientName?.toLowerCase().includes(q);
        const matchOpponent = record.entities?.opponentName?.toLowerCase().includes(q);
        const matchCourt = record.entities?.competentCourt?.toLowerCase().includes(q);
        const matchCase = record.entities?.caseNumber?.toLowerCase().includes(q);
        if (!matchName && !matchText && !matchClient && !matchOpponent && !matchCourt && !matchCase) {
          return false;
        }
      }

      // 2. Mode Filter
      if (selectedModeFilter !== "all" && record.ocrMode !== selectedModeFilter) {
        return false;
      }

      // 3. Status Filter
      if (selectedStatusFilter !== "all" && record.status !== selectedStatusFilter) {
        return false;
      }

      // 4. Date Filter
      if (selectedDateFilter !== "all") {
        const recordDate = new Date(record.processedAt).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (selectedDateFilter === "today" && now - recordDate > oneDay) return false;
        if (selectedDateFilter === "week" && now - recordDate > 7 * oneDay) return false;
        if (selectedDateFilter === "month" && now - recordDate > 30 * oneDay) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "newest") return new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime();
      if (sortBy === "oldest") return new Date(a.processedAt).getTime() - new Date(b.processedAt).getTime();
      if (sortBy === "accuracy") return b.accuracy - a.accuracy;
      if (sortBy === "pages") return b.pageCount - a.pageCount;
      return 0;
    });
  }, [historyRecords, searchQuery, selectedModeFilter, selectedStatusFilter, selectedDateFilter, sortBy]);

  // Calculations
  const stats = useMemo(() => {
    const totalJobs = historyRecords.length;
    const totalPages = historyRecords.reduce((sum, r) => sum + r.pageCount, 0);
    const avgAccuracy = totalJobs > 0 
      ? Math.round(historyRecords.reduce((sum, r) => sum + r.accuracy, 0) / totalJobs) 
      : 0;
    const extractedEntitiesCount = historyRecords.filter(r => r.entities?.clientName || r.entities?.caseNumber).length;

    return { totalJobs, totalPages, avgAccuracy, extractedEntitiesCount };
  }, [historyRecords]);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Toast feedback */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-emerald-400 border border-emerald-500/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-black">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 rounded-2xl shadow-lg font-black">
              <History className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-100">
                  سجل عمليات المسح والتعرف الضوئي (Processing History)
                </h2>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black rounded-full">
                  {stats.totalJobs} عملية مسجلة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                أرشيف دائم لكافة المستندات والأوراق القضائية التي تمت معالجتها واستخراج نصوصها وبياناتها؛ مع روابط تحميل مباشرة للنصوص، ملفات Word، وبيانات القضايا المنظمة (JSON).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportAllCsv}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
              title="تصدير السجل كجدول إكسل"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>تصدير كملف Excel (CSV)</span>
            </button>

            {historyRecords.length === 0 ? (
              <button
                onClick={handleRestoreDefaults}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>استعادة النماذج السابقة</span>
              </button>
            ) : (
              <button
                onClick={handleClearAllHistory}
                className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="تفريغ السجل بالكامل"
              >
                <Trash2 className="w-4 h-4" />
                <span>تفريغ السجل</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Stats Highlights Mini Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي المستندات المفحوصة</span>
            <span className="text-lg font-black text-amber-400 mt-0.5 block font-mono">{stats.totalJobs} ملف</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي الصفحات المستخرجة</span>
            <span className="text-lg font-black text-emerald-400 mt-0.5 block font-mono">{stats.totalPages} صفحة</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold block">متوسط دقة القراءة والتعرف</span>
            <span className="text-lg font-black text-blue-400 mt-0.5 block font-mono">{stats.avgAccuracy}%</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold block">قضايا وموكلين تم استخراجهم</span>
            <span className="text-lg font-black text-purple-400 mt-0.5 block font-mono">{stats.extractedEntitiesCount} قضية</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الملف، اسم الموكل، الخصم، رقم القضية، المحكمة..."
            className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Mode Filter */}
          <select
            value={selectedModeFilter}
            onChange={(e) => setSelectedModeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كل الأنماط</option>
            <option value="standard">مسح معياري ذكي</option>
            <option value="national_id">بطاقات الرقم القومي</option>
            <option value="poa">توكيلات ومحررات</option>
            <option value="court_verdict">أحكام ورول جلسات</option>
            <option value="contract">عقود ومذكرات</option>
            <option value="handwritten">خط يدوي</option>
          </select>

          {/* Date Filter */}
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كل التواريخ</option>
            <option value="today">اليوم فقط</option>
            <option value="week">آخر 7 أيام</option>
            <option value="month">آخر 30 يوماً</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="newest">الأحدث معالجة</option>
              <option value="oldest">الأقدم معالجة</option>
              <option value="accuracy">الأعلى دقة</option>
              <option value="pages">الأكثر صفحات</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table / Cards */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200 mb-1">
            لم يتم العثور على أي عمليات مسح مطابقة
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
            جرّب تغيير كلمات البحث أو إعادة تعيين الفلاتر لعرض كافة المستندات المحفوظة.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedModeFilter("all");
              setSelectedDateFilter("all");
            }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((record) => {
            const hasEntities = record.entities && (record.entities.clientName || record.entities.caseNumber);
            const isSelected = selectedRecord?.id === record.id;

            return (
              <div
                key={record.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md ${
                  isSelected
                    ? "border-amber-500 ring-2 ring-amber-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-amber-400/60"
                }`}
              >
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left (File Info) */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0 mt-0.5">
                      <FileText className="w-6 h-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate max-w-md">
                          {record.fileName}
                        </h4>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700">
                          {record.ocrModeLabel}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          دقة {record.accuracy}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {record.pageCount} {record.pageCount === 1 ? "صفحة" : "صفحات"} ({record.fileSize})
                        </span>
                      </div>

                      {/* Extracted Entities Tag Ribbon */}
                      {hasEntities && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                          {record.entities?.clientName && (
                            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                              <span className="text-slate-400 text-[11px]">الموكل:</span>
                              <strong className="font-bold text-amber-700 dark:text-amber-400">{record.entities.clientName}</strong>
                            </span>
                          )}
                          {record.entities?.opponentName && (
                            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                              <span className="text-slate-400 text-[11px]">الخصم:</span>
                              <span>{record.entities.opponentName}</span>
                            </span>
                          )}
                          {record.entities?.caseNumber && (
                            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono text-[11px]">
                              <span>رقم {record.entities.caseNumber}/{record.entities.caseYear || "2026"}</span>
                            </span>
                          )}
                          {record.entities?.competentCourt && (
                            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                              <span>● {record.entities.competentCourt}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Text Excerpt */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800">
                        {record.extractedText}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(record.processedAt).toLocaleString("ar-EG")}</span>
                        </span>
                        {record.tags && record.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-slate-400" />
                            <span>{record.tags.join(" • ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons & Downloads */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800 justify-end">
                    
                    {/* Quick Download TXT */}
                    <button
                      onClick={() => handleDownloadTxt(record)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="تحميل النص المستخرج كملف .txt"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-500" />
                      <span>نص (TXT)</span>
                    </button>

                    {/* Quick Download Word DOC */}
                    <button
                      onClick={() => handleDownloadDoc(record)}
                      className="px-3 py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="تحميل بصيغة Word منسق قضائياً"
                    >
                      <FileCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>ملف Word</span>
                    </button>

                    {/* Quick Download JSON Data */}
                    <button
                      onClick={() => handleDownloadCaseJson(record)}
                      className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="تحميل بيانات القضية المنظمة كملف JSON"
                    >
                      <FolderDown className="w-3.5 h-3.5 text-emerald-600" />
                      <span>بيانات القضية (JSON)</span>
                    </button>

                    {/* Copy Text */}
                    <button
                      onClick={() => handleCopyText(record.extractedText, record.id)}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
                      title="نسخ النص بالكامل"
                    >
                      {copiedId === record.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {/* Open in Editor */}
                    {onOpenInEditor && (
                      <button
                        onClick={() => onOpenInEditor(record.extractedText, record.fileName)}
                        className="p-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                        title="فتح في محرر المذكرات والصحف القضائية"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}

                    {/* Register to System */}
                    <button
                      onClick={() => handleRegisterCaseFromHistory(record)}
                      className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="قيد الموكل والقضية في ديوان القضايا"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>قيد بالقضايا</span>
                    </button>

                    {/* Inspect Modal Trigger */}
                    <button
                      onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                      className="px-3 py-2 bg-slate-800 text-slate-200 hover:bg-slate-750 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="عرض التفاصيل الكاملة"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isSelected ? "إغلاق" : "معاينة"}</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition cursor-pointer"
                      title="حذف من السجل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Inspection Drawer */}
                {isSelected && (
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 p-5 rounded-b-2xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-amber-500" />
                        <span>معاينة تفاصيل المستند والمعالجة الكاملة</span>
                      </h5>
                      <div className="flex items-center gap-2">
                        {onOpenSideBySide && (
                          <button
                            onClick={() => onOpenSideBySide({
                              name: record.fileName,
                              imageSrc: record.previewUrl || "",
                              rawText: record.extractedText,
                              entities: record.entities
                            })}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>فتح في التدقيق البصري جنباً لجنب</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedRecord(null)}
                          className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          إغلاق المعاينة ✕
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left: Raw Text with Copy */}
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">النص الكامل المستخرج من المستند</span>
                          <button
                            onClick={() => handleCopyText(record.extractedText, record.id)}
                            className="text-xs text-amber-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>نسخ النص</span>
                          </button>
                        </div>
                        <textarea
                          readOnly
                          value={record.extractedText}
                          rows={8}
                          className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-sans leading-relaxed text-slate-800 dark:text-slate-200 resize-y focus:outline-none"
                        />
                      </div>

                      {/* Right: AI Draft / Structured Summary */}
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>التحليل القضائي والصياغة الذكية المقترحة</span>
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200/50 dark:border-amber-900/50">
                            {record.aiDraftedText || record.summary || "لا توجد مذكرة مقترحة مضافة لهذا المستند. يمكنك صياغة مذكرات جديدة عبر استوديو OCR."}
                          </p>
                        </div>

                        {/* Quick Structured Entity Pills */}
                        {record.entities && (
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <span className="text-[10px] text-slate-400 block">الموكل:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{record.entities.clientName || "-"}</span>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <span className="text-[10px] text-slate-400 block">الخصم:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{record.entities.opponentName || "-"}</span>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <span className="text-[10px] text-slate-400 block">رقم الدعوى:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block font-mono">{record.entities.caseNumber ? `${record.entities.caseNumber}/${record.entities.caseYear}` : "-"}</span>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <span className="text-[10px] text-slate-400 block">المحكمة:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{record.entities.competentCourt || "-"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
