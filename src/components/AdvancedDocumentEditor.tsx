import React, { useState, useRef, useEffect } from "react";
import { CaseRecord, ClientProfile, PlatformUser } from "../types";
import GoldenEagleEmblem from "./GoldenEagleEmblem";
import { getClientRoleLabel } from "../utils/translations";
import { SectionDedicatedOcrModal } from "./SectionDedicatedOcrModal";
import {
  FileText,
  Save,
  Printer,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  List,
  ListOrdered,
  Scale,
  Undo,
  Redo,
  Clock,
  Scan,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Layers,
  SplitSquareVertical,
  Scissors,
  CheckCircle2,
  BookOpen,
  Calendar,
  FileSignature,
  Table,
  Highlighter,
  Quote,
  Minus,
  Square,
  Box,
  LayoutGrid,
  Frame,
  Type
} from "lucide-react";

interface AdvancedDocumentEditorProps {
  currentUser: PlatformUser;
  clients: ClientProfile[];
  cases: CaseRecord[];
  initialContent?: string;
  onSaveToVault?: (doc: { title: string; content: string; type: string }) => void;
  language?: "ar" | "en";
}

// Pre-packaged Judicial Templates
const LEGAL_TEMPLATES = [
  {
    id: "defense_brief",
    title: "مذكرة دفاع ودفوع قانونية أمام المحكمة",
    category: "قضائي",
    pages: [
      `بسم الله الرحمن الرحيم

محكمة [المحكمة المختصة]
الدائرة: [رقم الدائرة] - [نوع الدائرة]

مذكرة بدفاع السيد / [اسم الموكل] (صفته: [المدعي / المتهم])
ضد السيد / [اسم الخصم] (صفته: [المدعى عليه / المجني عليه])

في الدعوى رقم [رقم القضية] لسنة [سنة القضية]
والمحدد لنظرها جلسة يوم [اليوم] الموافق [تاريخ الجلسة]

أولاً: الوقائع
تتحصل وقائع الدعوى الماثلة في أن [شرح موجز للوقائع المثبتة بالأوراق والمستندات]...
وحيث أن المدعي قد أقام دعواه بغية القضاء له بطلباته التي تفتقد لأي سند قانوني أو واقعي سليم، مستنداً إلى مزاعم مرسلة لا تؤيدها أوراق التداعي، الأمر الذي يحدو بدفاع الموكل إلى إبداء الدفوع القانونية الجوهرية الآتية:`,
      `ثانياً: الدفوع القانونية الجوهرية

1. الدفع ببطلان الإجراءات لمخالفتها صريح نص القانون وللنظام العام:
من المستقر عليه في قضاء محكمة النقض أن "الإجراءات الجنائية والمدنية إنما شُرعت لصيانة حقوق المتقاضين، وأن كل إجراء يخالف الإجراءات الجوهرية المقررة قانوناً يقع باطلاً بطلاناً مطلقاً لا تصححه موافقة الخصوم".

2. الدفع بانتفاء أركان الواقعة المنسوبة للموكل وانعدام الدليل:
حيث خلت أوراق الدعوى من ثمة دليل يقيني جازم تطمئن إليه عدالة المحكمة الموقرة، وجاءت أقوال الخصم متناقضة مع الثابت بالمستندات الرسمية المرفقة بحافظة مستندات دفاعنا.

3. الدفع بعدم قبول الدعوى لرفعها من غير ذي صفة أو مصلحة:
إعمالاً لنص المادة ٣ من قانون المرافعات المدنية والتجارية.`,
      `ثالثاً: الطلبات الختامية

يلتمس دفاع الموكل من عدالة المحكمة الموقرة التفضل بالقضاء:

أصلياً: 
بالبراءة ورفض الدعوى المدنية وإلزام رافعها بالمصروفات ومقابل أتعاب المحاماة والنفاذ المعجل.

احتياطياً: 
إعادة الدعوى لمكتب خبراء وزارة العدل المختص لتحقيق عناصر النزاع وبيان وجه الحق فيه.

وكيل [صفة الموكل: المدعي / المتهم / المستأنف / الموكل]
الأستاذ / المحامي
المحامي بالنقض والدستورية العليا`
    ]
  },
  {
    id: "lawsuit_petition",
    title: "صحيفة افتتاح دعوى قضائية (عريضة دعوى)",
    category: "عرائض",
    pages: [
      `بسم الله الرحمن الرحيم

إنه في يوم [اليوم] الموافق [تاريخ اليوم]
بناءً على طلب السيد / [اسم الموكل]، ومحله المختار مكتب الأستاذ وسام الشناوي المحامي بالنقض.

أنا [اسم المحضر] محضر محكمة [المحكمة المختصة] الجزئية قد انتقلت وأعلنت:
السيد / [اسم الخصم]، المقيم في [عنوان الخصم].
مخاطباً مع / [اسم المستلم].

وأعلنته بالآتي:
[شرح موضوع النزاع والسند القانوني لحق الطالب بالأدلة والمستندات المرفقة]...
وحيث أن المعلن إليه قد امتنع عن الوفاء بالتزاماته التعاقدية والقانونية رغم سابق إنذاره رسمياً على يد محضر، الأمر الذي حدا بالطالب إلى إقامة هذه الدعوى بغية القضاء له بطلباته المشروعة.`,
      `بناءً عليه

أنا المحضر سالف الذكر قد انتقلت وسلمت المعلن إليه صورة من هذه الصحيفة وكلفته بالحضور أمام محكمة [المحكمة المختصة] الكائن مقرها في [مقر المحكمة] بجلستها المنعقدة علناً يوم [تاريخ الجلسة] لسماع الحكم بـ:

1. إلزام المعلن إليه بأداء أصل الحق الثابت بالأوراق وقدره [المبلغ المطالب به].
2. إلزامه بالتعويض المادي والأدبي الجابر للأضرار اللاحقة بالطالب.
3. إلزام المعلن إليه بالمصروفات القضائية ومقابل أتعاب المحاماة الفعلية والنفاذ المعجل طليقاً من قيد الكفالة.

ولأجل العلم ،،،`
    ]
  },
  {
    id: "formal_warning",
    title: "إنذار رسمي على يد محضر",
    category: "إنذارات",
    pages: [
      `بسم الله الرحمن الرحيم

إنه في يوم [اليوم] الموافق [تاريخ اليوم]
بناءً على طلب السيد / [اسم الموكل]، المقيم في [عنوان الموكل] ومحله المختار مكتب الأستاذ وسام الشناوي المحامي بالنقض.

أنا [اسم المحضر] محضر محكمة [المحكمة المختصة] قد انتقلت في تاريخه إلى حيث إقامة:
السيد / [اسم المنذر إليه]، المقيم في [عنوان المنذر إليه].
مخاطباً مع / [المستلم].

وأنذرته بالآتي:
بموجب [سند الإنذار] فإن للمنذر في ذمة المنذر إليه التزاماً قانونياً ومالياً ثابتاً...
وحيث أن المنذر إليه قد امتنع عن الوفاء رغم حلول الأجل القانوني ومطالبته ودياً مراراً وتكراراً...

لذلك
ينبه المنذر على المنذر إليه بضرورة الوفاء بالتزامه وتسليم المستحقات خلال مهلة أقصاها ٥ أيام من تاريخ تسلم هذا الإنذار، وإلا سيضطر الطالب لاتخاذ كافة الإجراءات القانونية والقضائية والرجوع عليه بالتعويض والمصروفات.

ولأجل العلم ،،،`
    ]
  },
  {
    id: "legal_fees_contract",
    title: "عقد اتفاق وتوكيل أتعاب محاماة",
    category: "عقود",
    pages: [
      `بسم الله الرحمن الرحيم

عقد اتفاق أتعاب ومباشرة دعاوى قانونية

إنه في يوم [اليوم] الموافق [التاريخ]، تم الاتفاق والتراضي بين كل من:
الطرف الأول: الأستاذ وسام الشناوي - المحامي بالنقض والدستورية العليا. (الوكيل)
الطرف الثاني: السيد / [اسم الموكل]، بطاقة رقم [الرقم القومي]. (الموكل)

البند الأول (موضوع الوكالة):
يقوم الطرف الأول بتمثيل ومباشرة الدفاع في الدعوى رقم [رقم القضية] لسنة [سنة القضية] أمام محكمة [المحكمة المختصة].

البند الثاني (الأتعاب):
اتفق الطرفان على أن تكون أتعاب المحاماة الإجمالية مبلغاً وقدره [مبلغ الأتعاب] جنيه مصري، تدفع على النحو التالي:
1. مقدم أتعاب عند التوقيع: [المقدم].
2. الباقي على دفعات بحسب مراحل التقاضي.

توقيع الطرف الأول (المحامي)              توقيع الطرف الثاني (الموكل)`
    ]
  }
];

// Helper to partition continuous raw text into A4 pages (~1400-1800 chars per A4 sheet)
function partitionRawTextIntoA4Pages(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [""];
  
  // If text already has explicit page breaks
  if (rawText.includes("<!-- pagebreak -->") || rawText.includes("=== PAGE BREAK ===") || rawText.includes("\f")) {
    const splitted = rawText.split(/<!-- pagebreak -->|=== PAGE BREAK ===|\f/).map(p => p.trim());
    return splitted.filter(Boolean).length > 0 ? splitted.filter(Boolean) : [""];
  }

  // If text is short enough to fit on one page
  if (rawText.length <= 1500) {
    return [rawText];
  }

  // Partition logically across paragraphs
  const paragraphs = rawText.split("\n");
  const pages: string[] = [];
  let currentPage = "";
  // Page 1 has official letterhead header so max chars ~1400, subsequent pages ~1900
  let currentLimit = 1400;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if ((currentPage + "\n" + para).length > currentLimit && currentPage.trim().length > 0) {
      pages.push(currentPage.trim());
      currentPage = para;
      currentLimit = 1900;
    } else {
      currentPage = currentPage ? currentPage + "\n" + para : para;
    }
  }

  if (currentPage.trim().length > 0) {
    pages.push(currentPage.trim());
  }

  return pages.length > 0 ? pages : [""];
}

export default function AdvancedDocumentEditor({
  currentUser,
  clients,
  cases,
  initialContent = "",
  onSaveToVault,
  language = "ar"
}: AdvancedDocumentEditorProps) {
  const [docTitle, setDocTitle] = useState("مذكرة دفاع قضائية جديدة");
  
  // Multi-page state: each item in array is one physical A4 page sheet
  const [pages, setPages] = useState<string[]>(() => {
    if (initialContent) {
      return partitionRawTextIntoA4Pages(initialContent);
    }
    return LEGAL_TEMPLATES[0].pages;
  });

  const [activePageIndex, setActivePageIndex] = useState(0);
  
  // Context selection for Auto-Fill
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  
  // View & Workspace settings
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 75, 90, 100, 115, 125
  const [viewMode, setViewMode] = useState<"continuous" | "single">("continuous");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showRuler, setShowRuler] = useState(true);
  const [fontFamily, setFontFamily] = useState<string>("Traditional Arabic");
  const [fontSizePt, setFontSizePt] = useState<number>(16);
  const [lineHeight, setLineHeight] = useState<number>(1.8);
  const [textAlign, setTextAlign] = useState<"right" | "center" | "left" | "justify">("justify");

  // Page Border Framing & Margins
  const [pageBorderStyle, setPageBorderStyle] = useState<"none" | "single" | "double" | "gold_luxury" | "dotted">("gold_luxury");
  const [pageMargin, setPageMargin] = useState<"standard" | "narrow" | "wide" | "court">("standard");

  // Table Generator Modal
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(4);
  const [tableHeadersInput, setTableHeadersInput] = useState("م, بيان المستند أو البند, التاريخ, وجه الدلالة القانونية");

  // Callout & Text Box Modal
  const [showCalloutModal, setShowCalloutModal] = useState(false);

  // AI Assistant states
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiActionType, setAiActionType] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [autoPageBreakAlert, setAutoPageBreakAlert] = useState<string | null>(null);

  // Version history
  const [versions, setVersions] = useState<{ id: string; timestamp: string; title: string; pages: string[] }[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // References to page textareas/divs
  const pageRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Keep pageRefs array length synced with pages
  useEffect(() => {
    pageRefs.current = pageRefs.current.slice(0, pages.length);
  }, [pages.length]);

  // When initialContent changes from outside (e.g. from OCR Studio)
  useEffect(() => {
    if (initialContent && initialContent.trim()) {
      const partitioned = partitionRawTextIntoA4Pages(initialContent);
      setPages(partitioned);
      setActivePageIndex(0);
    }
  }, [initialContent]);

  // Combined full document text
  const fullDocumentText = pages.join("\n\n<!-- pagebreak -->\n\n");
  const totalWords = pages.reduce((acc, p) => acc + (p.trim() ? p.trim().split(/\s+/).length : 0), 0);
  const totalChars = pages.reduce((acc, p) => acc + p.length, 0);

  // Handle typing inside a specific A4 page
  const handlePageChange = (pageIdx: number, newText: string) => {
    const updatedPages = [...pages];
    updatedPages[pageIdx] = newText;

    // Check if the current page has significantly overflowed standard A4 limits
    // Threshold: ~1800 characters or ~28 lines
    const lineCount = newText.split("\n").length;
    const charCount = newText.length;
    const thresholdChars = pageIdx === 0 ? 1650 : 2100;
    const thresholdLines = pageIdx === 0 ? 25 : 32;

    if ((charCount > thresholdChars || lineCount > thresholdLines) && pageIdx === updatedPages.length - 1) {
      // Automatic A4 pagination: split text at natural paragraph boundary and open a new A4 sheet
      const paragraphs = newText.split("\n");
      if (paragraphs.length > 2) {
        // Take the last 1 or 2 paragraphs and move them to a new A4 page
        const splitPoint = Math.max(1, paragraphs.length - 3);
        const keptText = paragraphs.slice(0, splitPoint).join("\n");
        const overflowText = paragraphs.slice(splitPoint).join("\n");

        if (keptText.trim() && overflowText.trim()) {
          updatedPages[pageIdx] = keptText.trim();
          updatedPages.push(overflowText.trim());
          setPages(updatedPages);
          setActivePageIndex(updatedPages.length - 1);
          
          setAutoPageBreakAlert(`📄 تم امتلاء ورقة A4 رقم (${pageIdx + 1}) وفتح صفحة A4 جديدة رقم (${updatedPages.length}) تلقائياً بنفس المقاس!`);
          setTimeout(() => setAutoPageBreakAlert(null), 4000);
          return;
        }
      }
    }

    setPages(updatedPages);
  };

  // Add a new A4 page manually
  const handleAddNewPage = (afterIndex?: number) => {
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : pages.length;
    const updated = [...pages];
    updated.splice(insertAt, 0, "");
    setPages(updated);
    setActivePageIndex(insertAt);
  };

  // Delete an A4 page
  const handleDeletePage = (pageIdx: number) => {
    if (pages.length <= 1) {
      setPages([""]);
      return;
    }
    const updated = pages.filter((_, idx) => idx !== pageIdx);
    setPages(updated);
    setActivePageIndex(Math.min(pageIdx, updated.length - 1));
  };

  // Duplicate an A4 page
  const handleDuplicatePage = (pageIdx: number) => {
    const updated = [...pages];
    updated.splice(pageIdx + 1, 0, pages[pageIdx]);
    setPages(updated);
    setActivePageIndex(pageIdx + 1);
  };

  // Merge page with previous page
  const handleMergeWithPrevious = (pageIdx: number) => {
    if (pageIdx <= 0) return;
    const updated = [...pages];
    updated[pageIdx - 1] = (updated[pageIdx - 1] + "\n\n" + updated[pageIdx]).trim();
    updated.splice(pageIdx, 1);
    setPages(updated);
    setActivePageIndex(pageIdx - 1);
  };

  // Apply Judicial Template
  const handleApplyTemplate = (templateId: string) => {
    const tmpl = LEGAL_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setDocTitle(tmpl.title);
      setPages([...tmpl.pages]);
      setActivePageIndex(0);
    }
  };

  // Smart Auto-Fill variables with selected client/case data
  const handleAutoFillVariables = () => {
    const client = clients.find(c => c.id === selectedClientId);
    const cs = cases.find(c => c.id === selectedCaseId);
    const todayStr = new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const dayName = new Date().toLocaleDateString("ar-EG", { weekday: "long" });

    const updatedPages = pages.map((pageText) => {
      let updated = pageText;
      if (client) {
        updated = updated.replace(/\[اسم الموكل\]/g, client.name);
        if (client.nationalId) updated = updated.replace(/\[الرقم القومي\]/g, client.nationalId);
        if (client.address) updated = updated.replace(/\[عنوان الموكل\]/g, client.address);
      }
      if (cs) {
        updated = updated.replace(/\[رقم القضية\]/g, cs.caseNumber);
        updated = updated.replace(/\[سنة القضية\]/g, cs.caseYear.toString());
        updated = updated.replace(/\[المحكمة المختصة\]/g, cs.competentCourt || "محكمة جنوب القاهرة الابتدائية");
        updated = updated.replace(/\[اسم الخصم\]/g, cs.opponentName || "الخصم المعلن إليه");
        if (cs.nextSessionDate) updated = updated.replace(/\[تاريخ الجلسة\]/g, cs.nextSessionDate);
        if (cs.clientRole) {
          updated = updated.replace(/\[المدعي \/ المتهم\]/g, cs.clientRole);
          updated = updated.replace(/\[صفة الموكل: المدعي \/ المتهم \/ المستأنف \/ الموكل\]/g, cs.clientRole);
          updated = updated.replace(/وكيل \[صفة الموكل: المدعي \/ المتهم \/ المستأنف \/ الموكل\]/g, getClientRoleLabel(cs.clientRole, cs, language));
        }
      }
      updated = updated.replace(/وكيل الموكل/g, getClientRoleLabel(cs?.clientRole, cs, language));
      updated = updated.replace(/\[تاريخ اليوم\]/g, todayStr);
      updated = updated.replace(/\[اليوم\]/g, dayName);
      return updated;
    });

    setPages(updatedPages);
  };

  // Insert token at active cursor in active page
  const handleInsertToken = (token: string) => {
    const activeText = pages[activePageIndex] || "";
    const updated = activeText + (activeText ? " " : "") + token;
    handlePageChange(activePageIndex, updated);
  };

  // Format selected word, sentence, or topic in active page
  const handleFormatText = (type: "bold" | "italic" | "underline" | "highlight" | "quote" | "h1" | "h2" | "bullet" | "number" | "divider") => {
    const textarea = pageRefs.current[activePageIndex];
    const currentText = pages[activePageIndex] || "";
    let start = currentText.length;
    let end = currentText.length;
    let selectedText = "";

    if (textarea) {
      start = textarea.selectionStart;
      end = textarea.selectionEnd;
      selectedText = currentText.substring(start, end);
    }

    let replacement = "";
    if (type === "bold") {
      replacement = `**${selectedText || "نص عريض"}**`;
    } else if (type === "italic") {
      replacement = `*${selectedText || "نص مائل"}*`;
    } else if (type === "underline") {
      replacement = `__${selectedText || "نص مسطر"}__`;
    } else if (type === "highlight") {
      replacement = `⟦ ${selectedText || "نص مميز قضائياً"} ⟧`;
    } else if (type === "quote") {
      replacement = `«${selectedText || "من المستقر عليه في قضاء محكمة النقض أن: ..."}»`;
    } else if (type === "h1") {
      replacement = `\n\n════════════════════════════════════\nأولاً: ${selectedText || "بيان الموضوع والوقائع"}\n════════════════════════════════════\n`;
    } else if (type === "h2") {
      replacement = `\n١. الدفع بـ ${selectedText || "بطلان الإجراءات لمخالفة القانون"}:\n`;
    } else if (type === "bullet") {
      replacement = `\n• ${selectedText || "البند الأول"}`;
    } else if (type === "number") {
      replacement = `\n١. ${selectedText || "البند الأول"}`;
    } else if (type === "divider") {
      replacement = `\n────────────────────────────────────\n`;
    }

    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
    handlePageChange(activePageIndex, newText);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPos = start + replacement.length;
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  // Generate and insert a formatted judicial table
  const handleInsertCustomTable = (rows: number, cols: number, headersText: string) => {
    const rawHeaders = headersText.split(/[,،]/).map(h => h.trim()).filter(Boolean);
    const headers = Array(cols).fill(0).map((_, i) => rawHeaders[i] || `العمود ${i + 1}`);
    
    const colWidth = 22;
    const formatCell = (txt: string) => {
      const truncated = txt.length > colWidth - 2 ? txt.substring(0, colWidth - 3) + "…" : txt;
      const pad = Math.max(0, colWidth - truncated.length - 2);
      return ` ${truncated}${" ".repeat(pad)} `;
    };

    const top = "┌" + Array(cols).fill("─".repeat(colWidth)).join("┬") + "┐";
    const headerRow = "│" + headers.map(h => formatCell(h)).join("│") + "│";
    const mid = "├" + Array(cols).fill("─".repeat(colWidth)).join("┼") + "┤";
    const bottom = "└" + Array(cols).fill("─".repeat(colWidth)).join("┴") + "┘";

    const dataRows: string[] = [];
    for (let r = 0; r < rows; r++) {
      const rowCells = Array(cols).fill(0).map((_, c) => {
        if (c === 0) return `${r + 1}`;
        return `بيان (${r + 1}-${c + 1})`;
      });
      dataRows.push("│" + rowCells.map(c => formatCell(c)).join("│") + "│");
    }

    const tableText = `\n${top}\n${headerRow}\n${mid}\n${dataRows.join("\n" + mid + "\n")}\n${bottom}\n`;
    handleInsertToken(tableText);
    setShowTableModal(false);
  };

  // Insert Pre-made Judicial Tables
  const handleInsertPresetTable = (preset: "dockets" | "sessions" | "finance" | "parties") => {
    let table = "";
    if (preset === "dockets") {
      table = `\n┌─────┬──────────────────────────┬────────────┬──────────────────────────┐
│  م  │ بيان المستند المودع       │   التاريخ  │ وجه الدلالة القانونية    │
├─────┼──────────────────────────┼────────────┼──────────────────────────┤
│  ١  │ أصل عقد البيع الابتدائي  │ ٢٠٢٣/٠٥/١٠ │ إثبات قيام الرابطة العقدية│
├─────┼──────────────────────────┼────────────┼──────────────────────────┤
│  ٢  │ إيصال سداد الثمن كاملاً  │ ٢٠٢٣/٠٦/٠١ │ إبراء ذمة الموكل من الدين│
├─────┼──────────────────────────┼────────────┼──────────────────────────┤
│  ٣  │ صورة رسمية من المحضر     │ ٢٠٢٤/٠١/١٥ │ إثبات واقعة النزاع       │
└─────┴──────────────────────────┴────────────┴──────────────────────────┘\n`;
    } else if (preset === "sessions") {
      table = `\n┌─────┬────────────┬────────────────────────┬────────────────────────────┐
│  م  │ تاريخ الجلسة│ منطوق وقرار المحكمة    │ الإجراء المطلوب اتخاذه     │
├─────┼────────────┼────────────────────────┼────────────────────────────┤
│  ١  │ ٢٠٢٤/٠٣/٠٥ │ التأجيل لإعلان الخصوم   │ استلام الإعلان من المحضرين │
├─────┼────────────┼────────────────────────┼────────────────────────────┤
│  ٢  │ ٢٠٢٤/٠٤/١٢ │ ندب خبير هندسي         │ سداد أمانة الخبير ومتابعة  │
└─────┴────────────┴────────────────────────┴────────────────────────────┘\n`;
    } else if (preset === "finance") {
      table = `\n┌─────┬──────────────────────────┬──────────────┬────────────────────────┐
│  م  │ بيان البند المستحق        │ المبلغ (ج.م) │ السند القانوني / التعاقدي│
├─────┼──────────────────────────┼──────────────┼────────────────────────┤
│  ١  │ أصل المبلغ المطالب به     │  ٥٠,٠٠٠      │ الشيك البنكي / الإيصال  │
├─────┼──────────────────────────┼──────────────┼────────────────────────┤
│  ٢  │ فوائد التأخير القانونية   │  ٥,٠٠٠       │ المادة ٢٢٦ مدني        │
├─────┼──────────────────────────┼──────────────┼────────────────────────┤
│     │ الإجمالي الكلي           │  ٥٥,٠٠٠      │ خمسة وخمسون ألف جنيه   │
└─────┴──────────────────────────┴──────────────┴────────────────────────┘\n`;
    } else if (preset === "parties") {
      table = `\n┌─────┬──────────────────────────┬────────────┬──────────────────────────┐
│  م  │ اسم الخصم / الطرف         │ صفته بالدعوى│ موطنه ومحل إعلانه الرسمي │
├─────┼──────────────────────────┼────────────┼──────────────────────────┤
│  ١  │ [اسم الخصم الأول]        │ مدعى عليه  │ [عنوان الخصم بالتفصيل]   │
├─────┼──────────────────────────┼────────────┼──────────────────────────┤
│  ٢  │ [اسم الخصم الثاني]       │ مدخل للخصومة│ [عنوان الخصم الثاني]     │
└─────┴──────────────────────────┴────────────┴──────────────────────────┘\n`;
    }
    handleInsertToken(table);
    setShowTableModal(false);
  };

  // Insert Pre-made Callouts & Text Boxes
  const handleInsertCalloutBox = (boxType: "defense" | "facts" | "demands" | "decision" | "attorney_cert") => {
    let boxText = "";
    if (boxType === "defense") {
      boxText = `\n╔══════════════════════════════════════════════════════════════════════╗
║ ⚖️ دفع جوهري جازم: الدفع ببطلان الإجراءات وانعدام أركان الاتهام        ║
╠══════════════════════════════════════════════════════════════════════╣
║ السند القانوني: إعمالاً لنص المواد (...) من قانون (...)                 ║
║ التطبيق القضائي: من المستقر عليه في قضاء محكمة النقض أن:              ║
║ «الإجراءات الجوهرية شُرعت لصيانة حقوق الدفاع، وإغفالها يبطل العمل»    ║
╚══════════════════════════════════════════════════════════════════════╝\n`;
    } else if (boxType === "facts") {
      boxText = `\n┌──────────────────────────────────────────────────────────────────────┐
│ 📌 حصر وقائع الدعوى بإيجاز غير مخل:                                  │
│ • الواقعة الأولى: [تاريخ الواقعة والتصرف القانوني الثابت بالأوراق]    │
│ • الواقعة الثانية: [الإخلال الواقع من جانب الخصم المعلن إليه]         │
│ • النتيجة: [ترتب الضرر المباشر الثابت بحافظة المستندات المودعة]       │
└──────────────────────────────────────────────────────────────────────┘\n`;
    } else if (boxType === "demands") {
      boxText = `\n╔══════════════════════════════════════════════════════════════════════╗
║ 🎯 الطلبات الختامية الجازمة لدفاع الموكل:                             ║
╠══════════════════════════════════════════════════════════════════════╣
║ أصلياً: القضاء برفض الدعوى وتبرئة ذمة الموكل وإلزام رافعها بالمصاريف  ║
║ احتياطياً: ندب خبير حسابي أو هندسي لتحقيق عناصر النزاع وتحديد الحق   ║
╚══════════════════════════════════════════════════════════════════════╝\n`;
    } else if (boxType === "decision") {
      boxText = `\n┌──────────────────────────────────────────────────────────────────────┐
│ ⚖️ منطوق الحكم / القرار المطلوب القضاء به:                            │
│ «حكمت المحكمة: بإلزام المدعى عليه بأن يؤدي للمدعي مبلغ (...) ج.م      │
│ مع الفوائد القانونية بواقع ٤٪ من تاريخ المطالبة القضائية وحتى السداد»  │
└──────────────────────────────────────────────────────────────────────┘\n`;
    } else if (boxType === "attorney_cert") {
      boxText = `\n┌──────────────────────────────────────────────────────────────────────┐
│ 🏛️ اعتماد وتوثيق ديوان المحاماة:                                     │
│ صادر عن: ديوان الأستاذ وسام الشناوي - المحامي بالنقض والدستورية العليا│
│ التوكيل: توكيل رسمي عام قضايا رقم [....] لسنة [....] توثيق [....]     │
│ التوقيع: ........................... | التاريخ: ..................... │
└──────────────────────────────────────────────────────────────────────┘\n`;
    }
    handleInsertToken(boxText);
    setShowCalloutModal(false);
  };

  // Helper for dynamic A4 simulator border class
  const getPageBorderClass = () => {
    switch (pageBorderStyle) {
      case "single": return "border-2 border-slate-900";
      case "double": return "border-4 border-double border-slate-900";
      case "gold_luxury": return "border-4 border-double border-amber-600 outline outline-1 outline-amber-700 -outline-offset-6 shadow-2xl";
      case "dotted": return "border-2 border-dashed border-slate-700";
      default: return "border border-slate-300 dark:border-slate-700";
    }
  };

  // Helper for dynamic A4 simulator margins class
  const getPageMarginClass = () => {
    switch (pageMargin) {
      case "narrow": return "p-4 sm:p-6";
      case "wide": return "p-10 sm:p-16";
      case "court": return "pt-8 pb-8 pl-6 sm:pl-8 pr-12 sm:pr-16";
      default: return "p-8 sm:p-12";
    }
  };

  // AI Assistant Action on active page or whole doc
  const handleAiAction = async (action: "rephrase" | "arguments" | "summarize" | "grammar") => {
    setIsAiProcessing(true);
    setAiActionType(action);
    setAiFeedback(null);

    let promptAction = "";
    if (action === "rephrase") {
      promptAction = "أعد صياغة هذا النص القضائي بأسلوب قانوني رصين وبليغ متوافق مع صياغات محكمة النقض المصرية والقضاء العربي، مع الحفاظ على كافة الوقائع والأسماء والأرقام دون تغيير:";
    } else if (action === "arguments") {
      promptAction = "اقترح دفوعاً قانونية جوهرية إضافية ومواد قانونية مناسبة لموضوع هذا المستند لتعزيز موقف الموكل في الدعوى:";
    } else if (action === "summarize") {
      promptAction = "قم بتلخيص هذا المستند القضائي في نقاط محددة وشاملة تتضمن: الوقائع، الدفوع، والطلبات الختامية:";
    } else if (action === "grammar") {
      promptAction = "قم بالتدقيق اللغوي والإملائي والقانوني الشامل لهذا المستند وتصحيح أي أخطاء طباعية أو لغوية:";
    }

    try {
      const activeText = pages[activePageIndex] || "";
      const textToProcess = activeText.trim() ? activeText : fullDocumentText;

      const res = await fetch("/api/ai/defense-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseType: docTitle,
          courtType: "محكمة النقض والمحاكم الابتدائية",
          evidencePoints: [textToProcess],
          demands: promptAction,
          language: "ar"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.brief) {
          if (action === "rephrase" || action === "grammar") {
            // If active page was chosen, update active page, or repartition if large
            if (data.brief.length > 2000) {
              const partitioned = partitionRawTextIntoA4Pages(data.brief);
              setPages(partitioned);
            } else {
              handlePageChange(activePageIndex, data.brief);
            }
            setAiFeedback("✔️ تم تحديث وصياغة الصفحة بالذكاء الاصطناعي بنجاح!");
          } else {
            setAiFeedback(data.brief);
          }
        }
      } else {
        setAiFeedback("تعذر الاتصال بمحرك الذكاء الاصطناعي، يرجى المحاولة لاحقاً.");
      }
    } catch (err) {
      console.error(err);
      setAiFeedback("حدث خطأ أثناء المعالجة الذكية للمستند.");
    } finally {
      setIsAiProcessing(false);
      setAiActionType(null);
    }
  };

  // Copy entire document
  const handleCopyAll = () => {
    navigator.clipboard.writeText(fullDocumentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Print Document with True Physical A4 Multi-Page Layout
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const selectedClient = clients.find(c => c.id === selectedClientId);
    const selectedCs = cases.find(c => c.id === selectedCaseId);
    const currentDateStr = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });

    const pagesHtml = pages.map((pageContent, idx) => {
      const pageNum = idx + 1;
      const isFirstPage = pageNum === 1;
      const isLastPage = pageNum === pages.length;

      return `
        <div class="a4-sheet-page">
          <!-- Official Letterhead Header -->
          <div class="a4-header">
            ${isFirstPage ? `
              <div class="first-page-banner">
                <div class="header-right">
                  <div class="rep-title">جمهورية مصر العربية</div>
                  <div class="office-name">مكتب الأستاذ / ${currentUser.name}</div>
                  <div class="office-sub">المحامي بالنقض والدستورية العليا</div>
                  <div class="office-phone">هاتف: ${currentUser.phone || "٠١٢٨٣٢٣٣٥٥٥"} | ديوان الإفتاء والقضايا</div>
                </div>
                <div class="header-center">
                  <div class="eagle-crest">🦅</div>
                  <div class="crest-caption">رسمياً بالنقض</div>
                </div>
                <div class="header-left">
                  <div class="doc-date">التاريخ: ${currentDateStr}</div>
                  <div class="doc-ref">قيد رقم: EGY-${Date.now().toString().slice(-6)}</div>
                  ${selectedCs ? `<div class="case-meta">قضية رقم: ${selectedCs.caseNumber}/${selectedCs.caseYear}</div>` : ""}
                  ${selectedClient ? `<div class="client-meta">الموكل: ${selectedClient.name}</div>` : ""}
                </div>
              </div>
              <div class="doc-main-title">
                <h2>${docTitle}</h2>
              </div>
            ` : `
              <div class="continuation-header">
                <div class="cont-right">مكتب الأستاذ / ${currentUser.name} - المحامي بالنقض</div>
                <div class="cont-center">تابع: ${docTitle}</div>
                <div class="cont-left">صفحة (${pageNum}) من (${pages.length})</div>
              </div>
            `}
          </div>

          <!-- A4 Page Body Text -->
          <div class="a4-body" style="font-family: '${fontFamily}', 'Amiri', serif; font-size: ${fontSizePt}pt; line-height: ${lineHeight}; text-align: ${textAlign};">
            ${pageContent.replace(/\n/g, "<br />")}
          </div>

          <!-- Official Page Footer -->
          <div class="a4-footer">
            ${isLastPage ? `
              <div class="closing-sign-block">
                <div class="sign-seal">
                  <div class="sign-title">خاتم وتوقيع ديوان المحاماة</div>
                  <div class="sign-name">الأستاذ / ${currentUser.name} المحامي</div>
                  <div class="sign-badge">معتمد بالنقض والدستورية العليا ⚖️</div>
                </div>
                <div class="sign-date">
                  تحريراً في: ${currentDateStr}
                </div>
              </div>
            ` : ""}
            <div class="footer-bottom-bar">
              <div class="footer-legal">محرر ومعتمد رقمياً - منظومة ديوان الأستاذ وسام الشناوي المحامي بالنقض</div>
              <div class="footer-page-num">صفحة ${pageNum} من ${pages.length}</div>
              <div class="footer-hash">REF: #${Date.now().toString().slice(-8)}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    const printBorderCss = 
      pageBorderStyle === "single" ? "border: 2.5px solid #0f172a;" :
      pageBorderStyle === "double" ? "border: 4px double #0f172a;" :
      pageBorderStyle === "gold_luxury" ? "border: 3.5px double #b45309; outline: 1.5px solid #78350f; outline-offset: -7px;" :
      pageBorderStyle === "dotted" ? "border: 2px dashed #475569;" : "border: 1px solid #e2e8f0;";

    const printPadding =
      pageMargin === "narrow" ? "12mm 14mm" :
      pageMargin === "wide" ? "26mm 28mm" :
      pageMargin === "court" ? "18mm 14mm 18mm 32mm" : "20mm 20mm";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>${docTitle} - طباعة A4 رسمية</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: #fff;
              direction: rtl;
              text-align: right;
              color: #0f172a;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .a4-sheet-page {
              width: 210mm;
              height: 297mm;
              max-height: 297mm;
              min-height: 297mm;
              padding: ${printPadding};
              ${printBorderCss}
              margin: 0 auto;
              page-break-after: always;
              break-after: page;
              position: relative;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: #fff;
              overflow: hidden;
            }
            .first-page-banner {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #b45309;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .rep-title {
              font-size: 11pt;
              font-weight: 700;
              color: #475569;
            }
            .office-name {
              font-size: 16pt;
              font-weight: 900;
              color: #78350f;
              margin: 2px 0;
            }
            .office-sub {
              font-size: 11pt;
              font-weight: 700;
              color: #1e293b;
            }
            .office-phone {
              font-size: 9pt;
              color: #64748b;
            }
            .eagle-crest {
              font-size: 32pt;
              text-align: center;
            }
            .crest-caption {
              font-size: 8pt;
              font-weight: bold;
              color: #b45309;
              text-align: center;
            }
            .header-left {
              text-align: left;
              font-size: 9.5pt;
              color: #334155;
            }
            .continuation-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1.5px solid #cbd5e1;
              padding-bottom: 8px;
              margin-bottom: 18px;
              font-size: 10pt;
              font-weight: bold;
              color: #64748b;
            }
            .doc-main-title {
              text-align: center;
              margin-bottom: 14px;
            }
            .doc-main-title h2 {
              margin: 0;
              font-size: 16pt;
              font-weight: 900;
              color: #0f172a;
              text-decoration: underline;
              text-underline-offset: 4px;
            }
            .a4-body {
              flex: 1;
              text-align: justify;
              color: #0f172a;
              overflow: hidden;
            }
            .a4-footer {
              margin-top: auto;
              padding-top: 10px;
            }
            .closing-sign-block {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-top: 1px dashed #cbd5e1;
              padding-top: 12px;
              margin-bottom: 12px;
            }
            .sign-title {
              font-size: 10pt;
              font-weight: bold;
              color: #475569;
            }
            .sign-name {
              font-size: 13pt;
              font-weight: 900;
              color: #78350f;
              margin-top: 4px;
            }
            .sign-badge {
              font-size: 9pt;
              color: #059669;
              font-weight: bold;
            }
            .footer-bottom-bar {
              border-top: 1.5px solid #e2e8f0;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              font-size: 9pt;
              color: #94a3b8;
            }
            @media screen {
              body {
                background-color: #f1f5f9;
                padding: 20px 0;
              }
              .a4-sheet-page {
                box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
                margin-bottom: 25px;
                border: 1px solid #cbd5e1;
              }
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 600);
  };

  // Download as Word Document (.doc) with native page breaks
  const handleDownloadWordDoc = () => {
    const selectedClient = clients.find(c => c.id === selectedClientId);
    const selectedCs = cases.find(c => c.id === selectedCaseId);

    const docBodyHtml = pages.map((pageText, idx) => `
      <div class="WordSection">
        <p align="center" style="font-weight: bold; font-size: 16pt; color: #78350f;">مكتب الأستاذ / ${currentUser.name} - المحامي بالنقض</p>
        <p align="center" style="font-size: 11pt; color: #475569;">${docTitle} - صفحة (${idx + 1} من ${pages.length})</p>
        <hr color="#b45309" size="2" />
        <div style="font-size: 14pt; line-height: 1.8; text-align: justify; font-family: 'Traditional Arabic', serif;">
          ${pageText.replace(/\n/g, "<br />")}
        </div>
        <p align="center" style="font-size: 9pt; color: #94a3b8; margin-top: 30pt;">-- صفحة ${idx + 1} من ${pages.length} --</p>
      </div>
      ${idx < pages.length - 1 ? '<br clear="all" style="page-break-before:always" />' : ""}
    `).join("");

    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>${docTitle}</title>
          <style>
            @page WordSection {
              size: 21.0cm 29.7cm;
              margin: 2.0cm 2.0cm 2.0cm 2.0cm;
              mso-page-orientation: portrait;
            }
            div.WordSection { page: WordSection; }
            body { font-family: 'Traditional Arabic', 'Arial', serif; direction: rtl; }
          </style>
        </head>
        <body dir="rtl">
          ${docBodyHtml}
        </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + fullHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle.replace(/\s+/g, "_")}_A4_${pages.length}صفحات.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save Document to Archive
  const handleSaveDocument = () => {
    if (onSaveToVault) {
      onSaveToVault({
        title: docTitle,
        content: fullDocumentText,
        type: "judicial_brief"
      });
    }

    setVersions(prev => [{
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      title: docTitle,
      pages: [...pages]
    }, ...prev]);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className={`space-y-4 font-sans text-right transition-all ${isFullScreen ? "fixed inset-0 z-50 bg-slate-900 p-4 overflow-y-auto" : ""}`} dir="rtl">
      
      {/* 1. TOP HEADER & WORKSPACE TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        
        {/* Title, Templates & Primary Actions */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          
          <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="p-2 bg-amber-500/15 rounded-xl text-amber-600 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-1.5 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-amber-500 shadow-inner"
              placeholder="عنوان المستند القضائي..."
            />
            <span className="text-[11px] font-black px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-500/20 whitespace-nowrap">
              A4 • {pages.length} {pages.length === 1 ? "ورقة" : "أوراق"}
            </span>
          </div>

          {/* Quick Action Operations */}
          <div className="flex flex-wrap items-center gap-1.5">
            
            {/* Dedicated OCR Scan Import */}
            <button
              onClick={() => setIsOcrModalOpen(true)}
              className="px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="استيراد مسح ضوئي أو خط يد عبر Lexmark / OCR"
            >
              <Scan className="w-3.5 h-3.5 text-purple-500" />
              <span>ماسح Lexmark / OCR خط اليد</span>
            </button>

            {/* Print Official A4 */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              title="طباعة رسمية متطابقة مع أوراق A4 وترويسة ديوان النقض"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>طباعة A4 رسمية ({pages.length})</span>
            </button>

            {/* Word Export (.doc) */}
            <button
              onClick={handleDownloadWordDoc}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="تحميل كملف Word مقسم لصفحات A4"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Word (.doc)</span>
            </button>

            {/* Copy All */}
            <button
              onClick={handleCopyAll}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="نسخ النص بالكامل"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "تم النسخ!" : "نسخ الكل"}</span>
            </button>

            {/* Save to Vault */}
            <button
              onClick={handleSaveDocument}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="حفظ في أرشيف المكتب وسجل الإصدارات"
            >
              {saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? "تم الحفظ!" : "حفظ المستند"}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer"
              title={isFullScreen ? "تصغير الشاشة" : "توسيع الشاشة بالكامل"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Templates Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              <span>النماذج القضائية:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {LEGAL_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleApplyTemplate(t.id)}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-50 dark:bg-slate-800 hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            صفحات A4: <span className="font-bold text-amber-500">{pages.length}</span> | الكلمات: <span className="font-bold text-slate-800 dark:text-slate-200">{totalWords}</span> | الأحرف: {totalChars}
          </div>
        </div>
      </div>

      {/* Auto Page-break Alert Banner */}
      {autoPageBreakAlert && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-200 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{autoPageBreakAlert}</span>
          </div>
          <button onClick={() => setAutoPageBreakAlert(null)} className="text-amber-700 hover:text-white">✕</button>
        </div>
      )}

      {/* 2. FORMATTING TOOLBAR & WORKBENCH CONTROLS */}
      <div className="sticky top-2 z-20 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs">
        
        {/* ROW 1: Typography, Sentence Formatting & Text Tools */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Font Family */}
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              title="نوع الخط القضائي"
            >
              <option value="Traditional Arabic">الخط العربي التقليدي (المحاكم)</option>
              <option value="Amiri">الخط الأميري القضائي</option>
              <option value="Cairo">خط القاهرة (حديث)</option>
              <option value="Arial">خط قياسي (Arial)</option>
            </select>

            {/* Font Size Pt */}
            <select
              value={fontSizePt}
              onChange={(e) => setFontSizePt(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              title="حجم الخط بالنقاط"
            >
              <option value={13}>13 pt</option>
              <option value={14}>14 pt</option>
              <option value={15}>15 pt</option>
              <option value={16}>16 pt (قياسي)</option>
              <option value={18}>18 pt (عريض)</option>
              <option value={20}>20 pt (عناوين)</option>
            </select>

            {/* Line Height */}
            <select
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              title="تباعد الأسطر"
            >
              <option value={1.5}>تباعد 1.5 سطر</option>
              <option value={1.8}>تباعد 1.8 (قضائي رصين)</option>
              <option value={2.0}>تباعد مضاعف 2.0</option>
            </select>

            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* Word & Sentence Formatting Buttons */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => handleFormatText("bold")}
                className="p-1 rounded text-slate-700 dark:text-slate-200 hover:bg-amber-500/20 hover:text-amber-600 transition"
                title="تغميق الخط (Bold)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFormatText("italic")}
                className="p-1 rounded text-slate-700 dark:text-slate-200 hover:bg-amber-500/20 hover:text-amber-600 transition"
                title="إمالة الخط (Italic)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFormatText("underline")}
                className="p-1 rounded text-slate-700 dark:text-slate-200 hover:bg-amber-500/20 hover:text-amber-600 transition"
                title="تسطير الكلمات (Underline)"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFormatText("highlight")}
                className="p-1 rounded text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition"
                title="تمييز الكلمات باللون الذهبي القضائي"
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFormatText("quote")}
                className="p-1 rounded text-slate-700 dark:text-slate-200 hover:bg-amber-500/20 hover:text-amber-600 transition"
                title="علامات تنصيص لأحكام النقض «...»"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFormatText("bullet")}
                className="p-1 rounded text-slate-700 dark:text-slate-200 hover:bg-amber-500/20 hover:text-amber-600 transition"
                title="قائمة نقطية (•)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFormatText("number")}
                className="p-1 rounded text-slate-700 dark:text-slate-200 hover:bg-amber-500/20 hover:text-amber-600 transition"
                title="قائمة رقمية (١.)"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFormatText("divider")}
                className="p-1 rounded text-slate-700 dark:text-slate-200 hover:bg-amber-500/20 hover:text-amber-600 transition"
                title="خط فاصل بين الموضوعات"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* Alignment */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTextAlign("right")}
                className={`p-1 rounded ${textAlign === "right" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100"}`}
                title="محاذاة لليمين"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTextAlign("center")}
                className={`p-1 rounded ${textAlign === "center" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100"}`}
                title="توسيط"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTextAlign("justify")}
                className={`p-1 rounded ${textAlign === "justify" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100"}`}
                title="ضبط المحاذاة (Justify)"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTextAlign("left")}
                className={`p-1 rounded ${textAlign === "left" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100"}`}
                title="محاذاة لليسار"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Topic Headings Presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleFormatText("h1")}
              className="px-2 py-1 text-[10.5px] bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 font-bold transition"
              title="إدراج عنوان رئيسي: أولاً: بيان الوقائع"
            >
              🏷️ أولاً: الوقائع
            </button>
            <button
              onClick={() => handleFormatText("h2")}
              className="px-2 py-1 text-[10.5px] bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 font-bold transition"
              title="إدراج دفع جوهري: ١. الدفع بـ..."
            >
              ⚖️ دفع فرعي (١.)
            </button>
            <button
              onClick={() => handleInsertToken(`[تاريخ اليوم: ${new Date().toLocaleDateString("ar-EG")}]`)}
              className="px-2 py-1 text-[10.5px] bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 font-bold transition"
            >
              📅 التاريخ
            </button>
          </div>
        </div>

        {/* ROW 2: Page Margins, Border Framing, Tables & Callout Boxes */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-800">
          
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Page Margin Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Frame className="w-3.5 h-3.5 text-amber-500" />
                <span>الهوامش:</span>
              </span>
              <select
                value={pageMargin}
                onChange={(e) => setPageMargin(e.target.value as any)}
                className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="standard">متوازنة (20 مم - قياسي)</option>
                <option value="narrow">ضيقة (12 مم - استيعاب مكثف)</option>
                <option value="wide">عريضة (28 مم - فاخرة)</option>
                <option value="court">قلم المحضرين والمحكمة (32 مم يمين)</option>
              </select>
            </div>

            {/* Page Border / Framing Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Square className="w-3.5 h-3.5 text-amber-500" />
                <span>إطار الصفحة:</span>
              </span>
              <select
                value={pageBorderStyle}
                onChange={(e) => setPageBorderStyle(e.target.value as any)}
                className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="gold_luxury">إطار مذهب فاخر للمحاماة (Luxury Gold)</option>
                <option value="double">إطار مزدوج رسمي قضائي (Official Double)</option>
                <option value="single">إطار مفرد كلاسيكي (Single Frame)</option>
                <option value="dotted">إطار منقط وقور (Dotted Frame)</option>
                <option value="none">بدون إطار (Plain Sheet)</option>
              </select>
            </div>

            {/* Table Insertion Button */}
            <button
              onClick={() => setShowTableModal(true)}
              className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="إضافة جداول قضائية وحسابية وجداول حوافظ"
            >
              <Table className="w-3.5 h-3.5 text-amber-500" />
              <span>إدراج جدول قضائي 📊</span>
            </button>

            {/* Text Box / Callout Insertion Button */}
            <button
              onClick={() => setShowCalloutModal(true)}
              className="px-2.5 py-1 bg-sky-500/15 hover:bg-sky-500/25 text-sky-800 dark:text-sky-300 border border-sky-500/30 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="إضافة مربعات نصية بارزة للدفوع والوقائع والطلبات"
            >
              <Box className="w-3.5 h-3.5 text-sky-500" />
              <span>إدراج مربع نص / دفوع 🔲</span>
            </button>
          </div>

          {/* Zoom & View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono">
              <button
                onClick={() => setZoomLevel(prev => Math.max(75, prev - 10))}
                className="text-slate-500 hover:text-amber-500 p-0.5"
                title="تصغير العرض"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
                className="text-slate-500 hover:text-amber-500 p-0.5"
                title="تكبير العرض"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode("continuous")}
                className={`px-2 py-1 rounded text-[11px] font-bold ${viewMode === "continuous" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-600 dark:text-slate-300"}`}
                title="عرض كل الأوراق متتابعة في صفحة واحدة"
              >
                ورق متتابع ({pages.length})
              </button>
              <button
                onClick={() => setViewMode("single")}
                className={`px-2 py-1 rounded text-[11px] font-bold ${viewMode === "single" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-600 dark:text-slate-300"}`}
                title="عرض ورقة واحدة فقط والتركيز عليها"
              >
                ورقة مستقلة
              </button>
            </div>

            {/* Add A4 Page Button */}
            <button
              onClick={() => handleAddNewPage()}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              title="إضافة ورقة A4 جديدة بالمحرر"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة ورقة A4</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CONTEXT AUTO-FILL BAR */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
          <span className="font-bold text-slate-600 dark:text-slate-400">ربط القضية والموكل لملء المتغيرات:</span>
          
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="">-- اختر موكلاً --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.phone || "بدون هاتف"})</option>
            ))}
          </select>

          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="">-- اختر ملف القضية --</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>رقم {c.caseNumber} لسنة {c.caseYear} - {c.subject}</option>
            ))}
          </select>

          <button
            onClick={handleAutoFillVariables}
            disabled={!selectedClientId && !selectedCaseId}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-lg text-xs transition cursor-pointer"
          >
            ⚡ استبدال المتغيرات
          </button>
        </div>

        {/* Page Thumbnail Navigator Ribbon */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActivePageIndex(idx);
                // Scroll to that page if continuous
                const targetEl = pageRefs.current[idx];
                if (targetEl) {
                  targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                activePageIndex === idx
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs ring-1 ring-amber-400"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              ورقة {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 4. MAIN A4 DRAFTING DESK (EXPANDED WORKSPACE) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* The Authentic A4 Physical Sheet Simulator (3 Columns on Large) */}
        <div className="lg:col-span-3 space-y-8 bg-slate-200/70 dark:bg-slate-950/80 p-4 sm:p-8 rounded-3xl border border-slate-300 dark:border-slate-800 min-h-[900px] flex flex-col items-center overflow-x-auto">
          
          {pages.map((pageText, pageIdx) => {
            // In single page mode, hide other pages
            if (viewMode === "single" && pageIdx !== activePageIndex) {
              return null;
            }

            const pageNumber = pageIdx + 1;
            const isFirstPage = pageNumber === 1;
            const isLastPage = pageNumber === pages.length;

            return (
              <div
                key={pageIdx}
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center",
                  width: "210mm",
                  minHeight: "297mm",
                  maxWidth: "100%",
                }}
                className={`relative bg-white text-slate-900 shadow-2xl rounded-sm flex flex-col justify-between transition-all duration-200 ${getPageBorderClass()} ${
                  activePageIndex === pageIdx ? "ring-2 ring-amber-500/60" : ""
                }`}
                onClick={() => setActivePageIndex(pageIdx)}
              >
                
                {/* Visual Watermark in Page Center */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none">
                  <GoldenEagleEmblem size="xl" />
                </div>

                {/* Top Page Meta Badge & Action Ribbon (Screen only) */}
                <div className="no-print absolute -top-3 left-4 right-4 flex justify-between items-center z-10 pointer-events-auto">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-amber-400 border border-amber-500/30 shadow-md">
                    📄 ورقة A4 رقم ({pageNumber} من {pages.length})
                  </span>

                  <div className="flex items-center gap-1 bg-slate-900/90 text-white p-0.5 rounded-lg shadow-md border border-slate-700">
                    {pageIdx > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMergeWithPrevious(pageIdx); }}
                        className="px-1.5 py-0.5 text-[9.5px] hover:bg-slate-700 rounded text-slate-300 font-bold"
                        title="دمج هذه الورقة مع الورقة السابقة"
                      >
                        دمج للسابق 🔗
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicatePage(pageIdx); }}
                      className="px-1.5 py-0.5 text-[9.5px] hover:bg-slate-700 rounded text-slate-300 font-bold"
                      title="تكرار هذه الورقة"
                    >
                      تكرار 📋
                    </button>
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePage(pageIdx); }}
                        className="p-1 hover:bg-red-900/50 rounded text-red-400"
                        title="حذف هذه الورقة"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Printable Margins Container (Dynamic Page Margin) */}
                <div className={`${getPageMarginClass()} flex flex-col flex-1 justify-between min-h-[297mm]`}>
                  
                  {/* Official Letterhead Header */}
                  <div className="border-b-2 border-amber-800/80 pb-3 mb-4 select-none">
                    {isFirstPage ? (
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          {/* Right: Law Firm Info */}
                          <div className="text-right space-y-0.5">
                            <span className="text-[11px] font-bold text-slate-500 block">جمهورية مصر العربية</span>
                            <h1 className="text-base sm:text-lg font-black text-amber-950 font-serif m-0">
                              مكتب الأستاذ / {currentUser.name}
                            </h1>
                            <p className="text-xs font-bold text-slate-800 m-0">المحامي بالنقض والدستورية العليا</p>
                            <p className="text-[10px] text-slate-500 m-0 font-mono">
                              هاتف: {currentUser.phone || "٠١٢٨٣٢٣٣٥٥٥"} | ديوان الإفتاء والقضايا
                            </p>
                          </div>

                          {/* Center: Golden Eagle Emblem */}
                          <div className="text-center shrink-0">
                            <GoldenEagleEmblem size="sm" />
                            <span className="text-[9px] font-black text-amber-700 block mt-0.5">معتمد بالنقض ⚖️</span>
                          </div>

                          {/* Left: Metadata */}
                          <div className="text-left text-[10.5px] text-slate-700 space-y-0.5">
                            <div>التاريخ: <span className="font-bold">{new Date().toLocaleDateString("ar-EG")}</span></div>
                            <div>الرقم المرجعي: <span className="font-mono text-[9.5px]">EGY-DOC-{Date.now().toString().slice(-6)}</span></div>
                            {selectedCaseId && (
                              <div className="text-amber-800 font-bold">قضية رقم: {cases.find(c => c.id === selectedCaseId)?.caseNumber}</div>
                            )}
                          </div>
                        </div>

                        {/* Title Banner */}
                        <div className="mt-3 text-center border-t border-amber-700/20 pt-2">
                          <h2 className="text-sm sm:text-base font-black text-slate-900 underline underline-offset-4 decoration-amber-600">
                            {docTitle}
                          </h2>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600 pb-1">
                        <div>مكتب الأستاذ / {currentUser.name} - المحامي بالنقض</div>
                        <div className="text-amber-900 font-black">تابع: {docTitle}</div>
                        <div className="font-mono text-[10px]">ورقة ({pageNumber} من {pages.length})</div>
                      </div>
                    )}
                  </div>

                  {/* Editable Body Area - Exact A4 Printable Height */}
                  <div className="flex-1 relative flex flex-col">
                    <textarea
                      ref={(el) => { pageRefs.current[pageIdx] = el; }}
                      value={pageText}
                      onChange={(e) => handlePageChange(pageIdx, e.target.value)}
                      onFocus={() => setActivePageIndex(pageIdx)}
                      placeholder={`اكتب محتويات ورقة A4 رقم (${pageNumber})... عند امتلاء الورقة سيتم فتح ورقة جديدة تلقائياً.`}
                      style={{
                        fontFamily: fontFamily,
                        fontSize: `${fontSizePt}pt`,
                        lineHeight: lineHeight,
                        textAlign: textAlign
                      }}
                      className="w-full flex-1 bg-transparent text-slate-900 outline-none resize-none overflow-hidden text-right leading-relaxed font-serif placeholder:text-slate-400"
                      rows={isFirstPage ? 22 : 28}
                    />

                    {/* Word & Char counter on bottom left */}
                    <div className="no-print self-end text-[9.5px] text-slate-400 font-mono select-none pt-2">
                      كلمات الورقة: {pageText.trim() ? pageText.trim().split(/\s+/).length : 0} | الأحرف: {pageText.length}
                    </div>
                  </div>

                  {/* Official Page Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-200 text-slate-600 select-none">
                    {isLastPage && (
                      <div className="flex justify-between items-end pb-3 mb-2 border-b border-dashed border-slate-300">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 block">وكيل الموكل بموجب التوكيل الرسمي:</span>
                          <span className="text-xs font-black text-amber-950 block mt-0.5">الأستاذ / {currentUser.name} المحامي</span>
                          <span className="text-[9px] text-emerald-700 font-bold">المحامي بالنقض والدستورية العليا</span>
                        </div>
                        <div className="text-center">
                          <div className="w-20 h-10 border border-slate-300 rounded-lg flex items-center justify-center text-[9px] text-slate-400 bg-slate-50">
                            خاتم المكتب
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <div>ديوان المحاماة الرقمي - الأستاذ وسام الشناوي المحامي بالنقض</div>
                      <div className="font-bold text-slate-700">صفحة {pageNumber} من {pages.length}</div>
                      <div className="font-mono">REF: #{Date.now().toString().slice(-6)}</div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}

          {/* Quick Add Page at Bottom of Workbench */}
          <div className="no-print py-4 flex items-center justify-center gap-3 w-full">
            <button
              onClick={() => handleAddNewPage()}
              className="px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-800 dark:text-slate-200 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-sm hover:border-amber-500 active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-500" />
              <span>إضافة ورقة A4 جديدة بالمستند (+)</span>
            </button>
          </div>

        </div>

        {/* AI & Legal Drafting Assistant (1 Column on Large) */}
        <div className="space-y-4">
          
          {/* AI Legal Assistant Panel */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>مساعد الصياغة القضائية بالذكاء الاصطناعي</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              معالجة الورقة الحالية (ورقة {activePageIndex + 1}) بأسلوب قضاء محكمة النقض:
            </p>

            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => handleAiAction("rephrase")}
                disabled={isAiProcessing}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black transition text-right flex items-center justify-between cursor-pointer"
              >
                <span>✨ إعادة صياغة بأسلوب النقض</span>
                <span className="text-[10px] opacity-70">صياغة</span>
              </button>

              <button
                onClick={() => handleAiAction("grammar")}
                disabled={isAiProcessing}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black transition text-right flex items-center justify-between cursor-pointer"
              >
                <span>🔍 تدقيق لغوي ونحوي وقانوني</span>
                <span className="text-[10px] opacity-70">تدقيق</span>
              </button>

              <button
                onClick={() => handleAiAction("arguments")}
                disabled={isAiProcessing}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black transition text-right flex items-center justify-between cursor-pointer"
              >
                <span>⚖️ اقتراح دفوع قانونية إضافية</span>
                <span className="text-[10px] opacity-70">دفوع</span>
              </button>

              <button
                onClick={() => handleAiAction("summarize")}
                disabled={isAiProcessing}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black transition text-right flex items-center justify-between cursor-pointer"
              >
                <span>📑 تلخيص الوقائع والطلبات</span>
                <span className="text-[10px] opacity-70">إيجاز</span>
              </button>
            </div>

            {isAiProcessing && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center text-amber-500 text-xs font-black animate-pulse">
                جارٍ التحليل والصياغة الذكية لصفحات A4...
              </div>
            )}
          </div>

          {/* AI Result Feedback Pane */}
          {aiFeedback && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 text-slate-200 text-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-amber-400 font-bold border-b border-slate-800 pb-1.5">
                <span>نتائج التحليل الذكي:</span>
                <button onClick={() => setAiFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300 max-h-60 overflow-y-auto">
                {aiFeedback}
              </p>
            </div>
          )}

          {/* Official Law Office Watermark Box */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-4 rounded-3xl border border-amber-500/30 text-center space-y-2 shadow-sm">
            <GoldenEagleEmblem size="md" />
            <span className="text-xs font-black text-amber-400 block">ديوان مكتب المحامي / {currentUser.name}</span>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              محاكاة طباعة A4 دقيقة مع تقسيم أوتوماتيكي للصفحات وترويسة المحاماة بالنقض.
            </p>
          </div>

          {/* Quick Page Insertion Tool */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs">
            <span className="font-black text-slate-800 dark:text-slate-200 block">إدارة صفحات المستند:</span>
            <div className="space-y-1.5">
              <button
                onClick={() => handleAddNewPage(activePageIndex)}
                className="w-full py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-slate-700 dark:text-slate-300 font-bold flex items-center justify-between"
              >
                <span>إدراج ورقة A4 بعد هذه الورقة</span>
                <Plus className="w-3.5 h-3.5 text-amber-500" />
              </button>
              {pages.length > 1 && (
                <button
                  onClick={() => handleDeletePage(activePageIndex)}
                  className="w-full py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl font-bold flex items-center justify-between"
                >
                  <span>حذف الورقة الحالية ({activePageIndex + 1})</span>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Dedicated Section OCR & Lexmark X54de Modal */}
      <SectionDedicatedOcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        section="doc_editor"
        language={language}
        onApplyData={(res) => {
          if (res.docTitle) setDocTitle(res.docTitle);
          if (res.rawText) {
            const partitioned = partitionRawTextIntoA4Pages(res.rawText);
            setPages(partitioned);
            setActivePageIndex(0);
          }
        }}
      />

      {/* 5. TABLE GENERATOR MODAL */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 text-right animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/15 rounded-xl text-amber-600 dark:text-amber-400">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">إدراج جدول قضائي منسق</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">جداول مهيأة ومطابقة لمعايير أوراق A4 القضائية</p>
                </div>
              </div>
              <button
                onClick={() => setShowTableModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">نماذج جداول قضائية جاهزة:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleInsertPresetTable("dockets")}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500/15 hover:border-amber-500/40 border border-slate-200 dark:border-slate-700 rounded-xl text-right transition"
                >
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 block">📁 جدول حوافظ المستندات</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">م، بيان المستند، التاريخ، وجه الدلالة</span>
                </button>
                <button
                  onClick={() => handleInsertPresetTable("sessions")}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500/15 hover:border-amber-500/40 border border-slate-200 dark:border-slate-700 rounded-xl text-right transition"
                >
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 block">📅 جدول حصر الجلسات</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">م، تاريخ الجلسة، منطوق القرار، المطلوب</span>
                </button>
                <button
                  onClick={() => handleInsertPresetTable("finance")}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500/15 hover:border-amber-500/40 border border-slate-200 dark:border-slate-700 rounded-xl text-right transition"
                >
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 block">💰 جدول المطالبات المالية</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">م، بيان الحق، القيمة بالجنية، السند</span>
                </button>
                <button
                  onClick={() => handleInsertPresetTable("parties")}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500/15 hover:border-amber-500/40 border border-slate-200 dark:border-slate-700 rounded-xl text-right transition"
                >
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 block">👥 جدول الخصوم والصفات</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">م، اسم الخصم، صفته، موطن إعلانه</span>
                </button>
              </div>
            </div>

            {/* Custom Table Builder */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">أو إنشاء جدول مخصص:</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">عدد الصفوف:</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={tableRows}
                    onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">عدد الأعمدة:</label>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={tableCols}
                    onChange={(e) => setTableCols(Math.max(2, Math.min(6, parseInt(e.target.value) || 2)))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  عناوين الأعمدة (مفصولة بفاصلة):
                </label>
                <input
                  type="text"
                  value={tableHeadersInput}
                  onChange={(e) => setTableHeadersInput(e.target.value)}
                  placeholder="م، بيان المستند، التاريخ، الملاحظات"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleInsertCustomTable(tableRows, tableCols, tableHeadersInput)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition"
                >
                  إدراج الجدول بالورقة الآن ✍️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. CALLOUT & TEXT BOXES MODAL */}
      {showCalloutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 text-right animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/15 rounded-xl text-sky-600 dark:text-sky-400">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">إدراج مربع نص ومربع دفوع بارز</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">مربعات نصية مؤطرة مخصصة للدفوع الجوهرية والوقائع والطلبات</p>
                </div>
              </div>
              <button
                onClick={() => setShowCalloutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleInsertCalloutBox("defense")}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500/15 hover:border-amber-500/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-right transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">⚖️ مربع دفع شكلي أو موضوعي جازم</span>
                  <span className="text-[10px] text-slate-400">إطار مزدوج رسمي</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  يحتوي على: اسم الدفع، السند القانوني الصريح، والمبدأ المستقر عليه في قضاء النقض.
                </p>
              </button>

              <button
                onClick={() => handleInsertCalloutBox("facts")}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-500/15 hover:border-sky-500/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-right transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-sky-600 dark:text-sky-400">📌 مربع حصر وقائع الدعوى بإيجاز</span>
                  <span className="text-[10px] text-slate-400">إطار كلاسيكي أنيق</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  يبرز تسلسل الوقائع، إخلال الخصم، والأضرار الموجبة للحكم القضائي.
                </p>
              </button>

              <button
                onClick={() => handleInsertCalloutBox("demands")}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-500/15 hover:border-emerald-500/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-right transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">🎯 مربع الطلبات الختامية الجازمة</span>
                  <span className="text-[10px] text-slate-400">مزدوج عريض</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  تنظيم الطلبات الأصلية والاحتياطية والمصاريف القضائية والنفاذ المعجل.
                </p>
              </button>

              <button
                onClick={() => handleInsertCalloutBox("decision")}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-purple-500/15 hover:border-purple-500/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-right transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400">⚖️ مربع منطوق الحكم المطلوب القضاء به</span>
                  <span className="text-[10px] text-slate-400">صيغة قضائية</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  إدراج صيغة منطوق الحكم والفوائد القانونية ومصروفات المحاماة المقترحة للمحكمة.
                </p>
              </button>

              <button
                onClick={() => handleInsertCalloutBox("attorney_cert")}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500/15 hover:border-amber-500/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-right transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-700 dark:text-amber-300">🏛️ مربع اعتماد وتوثيق ديوان المحاماة</span>
                  <span className="text-[10px] text-slate-400">تذييل واعتماد</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  بيانات ديوان الأستاذ وسام الشناوي، رقم التوكيل الرسمي، ومكان التوقيع والخاتم.
                </p>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowCalloutModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
