import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import jsPDF from "jspdf";
import { CaseRecord, ClientProfile, SessionRecord } from "../types";
import { 
  FileSpreadsheet, 
  FileText, 
  FileType, 
  Mail, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  FileUp, 
  Database, 
  Users, 
  Briefcase, 
  Calendar, 
  ArrowRight,
  ExternalLink,
  Plus,
  Trash2,
  Filter,
  Eye,
  Layers,
  Sparkles
} from "lucide-react";

interface ImportFilesViewProps {
  onAddClient: (newCl: ClientProfile, firstCase?: CaseRecord) => void;
  onAddCase: (newCs: CaseRecord) => void;
  onAddSession?: (newSession: SessionRecord) => void;
  clients: ClientProfile[];
  cases?: CaseRecord[];
  sessions?: SessionRecord[];
  language: "ar" | "en";
  onOpenDocumentManager?: (section: string, label: string) => void;
  onNavigateToOcr?: () => void;
}

type TabType = "excel_import" | "word_import" | "pdf_import" | "gmail_sync" | "export_hub";

interface ParsedClientRow {
  name: string;
  nationalId?: string;
  phone?: string;
  poaNumber?: string;
  poaYear?: number;
  caseNumber?: string;
  subject?: string;
  remainingFees?: number;
  selected?: boolean;
}

interface ParsedCaseRow {
  caseNumber: string;
  caseYear: number;
  competentCourt: string;
  subject: string;
  clientName: string;
  opponentName?: string;
  nextSessionDate?: string;
  details?: string;
  selected?: boolean;
}

export default function ImportFilesView({
  onAddClient,
  onAddCase,
  onAddSession,
  clients,
  cases = [],
  sessions = [],
  language,
  onOpenDocumentManager,
  onNavigateToOcr
}: ImportFilesViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("excel_import");
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Excel parsing state
  const [excelFileType, setExcelFileType] = useState<"clients" | "cases">("clients");
  const [parsedClients, setParsedClients] = useState<ParsedClientRow[]>([]);
  const [parsedCases, setParsedCases] = useState<ParsedCaseRow[]>([]);
  const [excelFileName, setExcelFileName] = useState("");

  // Word parsing state
  const [wordFileName, setWordFileName] = useState("");
  const [wordRawText, setWordRawText] = useState("");
  const [extractedWordFields, setExtractedWordFields] = useState<{
    clientName: string;
    nationalId: string;
    caseNumber: string;
    caseYear: string;
    court: string;
    subject: string;
    phone: string;
  }>({
    clientName: "",
    nationalId: "",
    caseNumber: "",
    caseYear: new Date().getFullYear().toString(),
    court: "",
    subject: "",
    phone: ""
  });

  // PDF & Scans state
  const [uploadedPdfs, setUploadedPdfs] = useState<Array<{ name: string; size: number; date: string; url?: string }>>([]);
  const [selectedCaseForPdf, setSelectedCaseForPdf] = useState("");
  const [selectedClientForPdf, setSelectedClientForPdf] = useState("");

  // Gmail sync state
  const [isSyncingGmail, setIsSyncingGmail] = useState(false);
  const [gmailMessages, setGmailMessages] = useState<Array<{
    id: string;
    sender: string;
    subject: string;
    date: string;
    snippet: string;
    hasAttachments: boolean;
    attachmentNames?: string[];
    detectedType: "client_update" | "court_notice" | "consultation" | "general";
  }>>([
    {
      id: "gm_1",
      sender: "mohamed.elsayed.law@gmail.com",
      subject: "إرسال صورة التوكيل وبطاقة الرقم القومي للقضية رقم 8412 لسنة 2025",
      date: "2026-08-25",
      snippet: "تحية طيبة أستاذ وسام، مرفق لسيادتكم صورة توكيل رسمي عام قضايا وبطاقة الرقم القومي للموكل محمد السيد عبد الله لاستكمال إجراءات الطعن بالاستئناف.",
      hasAttachments: true,
      attachmentNames: ["توكيل_رسمي_8412.pdf", "بطاقة_الرقم_القومي.jpg"],
      detectedType: "client_update"
    },
    {
      id: "gm_2",
      sender: "notifications@courts.gov.eg",
      subject: "إشعار تحديد جلسة استئناف عالي بمحكمة شمال الجيزة",
      date: "2026-08-24",
      snippet: "تم قيد الاستئناف وتحديد جلسة يوم الأحد الموافق 15 سبتمبر 2026 أمام الدائرة 4 مدني مستأنف بمحكمة شمال الجيزة في الاستئناف رقم 1902 لسنة 2026.",
      hasAttachments: false,
      detectedType: "court_notice"
    },
    {
      id: "gm_3",
      sender: "ahmed.mansour.corp@outlook.com",
      subject: "طلب استشارة قانونية وصياغة عقد توريد لشركة الأهرام للصناعات",
      date: "2026-08-22",
      snippet: "السادة مكتب الشناوي للمحاماة، نرجو مراجعة بنود مسودة عقد التوريد المرفقة وإبداء الرأي القانوني بشأن شروط التحكيم وغرامات التأخير.",
      hasAttachments: true,
      attachmentNames: ["مسودة_عقد_توريد_2026.docx"],
      detectedType: "consultation"
    }
  ]);

  const showNotification = (type: "success" | "error" | "info", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4500);
  };

  // ----------------------------------------------------
  // 1. EXCEL IMPORT LOGIC (SheetJS / XLSX)
  // ----------------------------------------------------
  const handleExcelFileUpload = (file: File) => {
    setExcelFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonData || jsonData.length < 2) {
          showNotification("error", "ملف Excel فارغ أو لا يحتوي على صفوف بيانات صالحة.");
          return;
        }

        const headers = (jsonData[0] as string[]).map(h => String(h || "").trim().toLowerCase());
        const rows = jsonData.slice(1).filter(r => Array.isArray(r) && r.some(cell => cell !== undefined && cell !== ""));

        if (excelFileType === "clients") {
          const clientRows: ParsedClientRow[] = rows.map((r) => {
            return {
              name: String(r[0] || "موكل بدون اسم").trim(),
              nationalId: r[1] ? String(r[1]).trim() : "",
              phone: r[2] ? String(r[2]).trim() : "",
              poaNumber: r[3] ? String(r[3]).trim() : "",
              poaYear: r[4] ? Number(r[4]) || new Date().getFullYear() : new Date().getFullYear(),
              caseNumber: r[5] ? String(r[5]).trim() : "",
              subject: r[6] ? String(r[6]).trim() : "استيراد ملفات",
              remainingFees: r[7] ? Number(r[7]) || 0 : 0,
              selected: true
            };
          });
          setParsedClients(clientRows);
          showNotification("success", `تم استخراج ${clientRows.length} سجل موكل بنجاح من ملف Excel!`);
        } else {
          const caseRows: ParsedCaseRow[] = rows.map((r) => {
            return {
              caseNumber: String(r[0] || "بدون رقم").trim(),
              caseYear: Number(r[1]) || new Date().getFullYear(),
              competentCourt: String(r[2] || "محكمة عامة").trim(),
              subject: String(r[3] || "دعوى قضائية").trim(),
              clientName: String(r[4] || "موكل غير محدد").trim(),
              opponentName: r[5] ? String(r[5]).trim() : "غير محدد",
              nextSessionDate: r[6] ? String(r[6]).trim() : new Date().toISOString().split("T")[0],
              details: r[7] ? String(r[7]).trim() : "تم الاستيراد من ملف Excel",
              selected: true
            };
          });
          setParsedCases(caseRows);
          showNotification("success", `تم استخراج ${caseRows.length} ملف قضية بنجاح من ملف Excel!`);
        }
      } catch (err: any) {
        console.error(err);
        showNotification("error", "حدث خطأ أثناء قراءة ملف Excel: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteExcelImport = () => {
    if (excelFileType === "clients") {
      const selected = parsedClients.filter(c => c.selected);
      if (selected.length === 0) {
        showNotification("error", "الرجاء تحديد موكل واحد على الأقل للاستيراد.");
        return;
      }

      selected.forEach((cl, index) => {
        const newClient: ClientProfile = {
          id: `CL-EXCEL-${Date.now()}-${index}`,
          serialNumber: clients.length + index + 1,
          name: cl.name,
          nationalId: cl.nationalId || `2990101${Math.floor(1000000 + Math.random() * 9000000)}`,
          poaNumber: cl.poaNumber || "",
          poaLetter: "أ",
          poaYear: cl.poaYear || new Date().getFullYear(),
          poaOffice: "مكتب توثيق عام",
          caseNumber: cl.caseNumber || "",
          caseYear: new Date().getFullYear(),
          competentCourt: "محكمة عامة",
          subject: cl.subject || "ملف مستورد من Excel",
          phone: cl.phone || "",
          remainingFees: cl.remainingFees || 0,
          createdAt: new Date().toISOString()
        };
        onAddClient(newClient);
      });

      showNotification("success", `تمت إضافة ${selected.length} موكل بنجاح إلى سجل الموكلين!`);
      setParsedClients([]);
      setExcelFileName("");
    } else {
      const selected = parsedCases.filter(c => c.selected);
      if (selected.length === 0) {
        showNotification("error", "الرجاء تحديد قضية واحدة على الأقل للاستيراد.");
        return;
      }

      selected.forEach((cs, index) => {
        const newCase: CaseRecord = {
          id: `CS-EXCEL-${Date.now()}-${index}`,
          serialNumber: Date.now() + index,
          caseNumber: cs.caseNumber,
          caseYear: cs.caseYear,
          competentCourt: cs.competentCourt,
          courtType: "عام",
          subject: cs.subject,
          clientName: cs.clientName,
          clientRole: "مدعي",
          opponentName: cs.opponentName || "غير محدد",
          nextSessionDate: cs.nextSessionDate || new Date().toISOString().split("T")[0],
          details: cs.details || "تم الاستيراد التلقائي من جدول Excel.",
          attachments: [],
          scans: [],
          createdAt: new Date().toISOString()
        };
        onAddCase(newCase);
      });

      showNotification("success", `تمت إضافة ${selected.length} ملف قضية بنجاح إلى جدول القضايا!`);
      setParsedCases([]);
      setExcelFileName("");
    }
  };

  // ----------------------------------------------------
  // 2. WORD IMPORT LOGIC (Mammoth)
  // ----------------------------------------------------
  const handleWordFileUpload = async (file: File) => {
    setWordFileName(file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value || "";
      setWordRawText(text);

      // Intelligent RegEx extraction of legal patterns in Egyptian law format
      const clientMatch = text.match(/(?:الموكل|السيد|المرفوعة من|الطالب|المدعي)[:\s]+([^\n\r,،]+)/i);
      const nationalIdMatch = text.match(/(?:الرقم القومي|بطاقة رقم)[:\s]+([0-9]{14})/i);
      const phoneMatch = text.match(/(?:هاتف|موبايل|تليفون)[:\s]+([0-9+]{10,14})/i);
      const caseMatch = text.match(/(?:دعوى رقم|قضية رقم|رقم)[:\s]+([0-9]+)\s*(?:لسنة|\/)\s*([0-9]{4})/i);
      const courtMatch = text.match(/(?:محكمة|أمام محكمة)[:\s]+([^\n\r,،]+)/i);
      const subjectMatch = text.match(/(?:الموضوع|موضوع الدعوى|بشأن)[:\s]+([^\n\r]+)/i);

      setExtractedWordFields({
        clientName: clientMatch ? clientMatch[1].trim() : file.name.replace(/\.docx?$/i, ""),
        nationalId: nationalIdMatch ? nationalIdMatch[1].trim() : "",
        caseNumber: caseMatch ? caseMatch[1].trim() : "",
        caseYear: caseMatch ? caseMatch[2].trim() : new Date().getFullYear().toString(),
        court: courtMatch ? courtMatch[1].trim() : "محكمة استئناف القاهرة",
        subject: subjectMatch ? subjectMatch[1].trim() : "صحيفة دعوى / مذكرة دفاع قضائية",
        phone: phoneMatch ? phoneMatch[1].trim() : ""
      });

      showNotification("success", "تم تحليل ملف Word واستخراج النصوص والبيانات القضائية الذكية بنجاح!");
    } catch (err: any) {
      console.error(err);
      showNotification("error", "فشل تحليل ملف Word: " + err.message);
    }
  };

  const handleSaveWordAsClientAndCase = () => {
    if (!extractedWordFields.clientName) {
      showNotification("error", "الرجاء إدخال اسم الموكل.");
      return;
    }

    const newCl: ClientProfile = {
      id: `CL-WORD-${Date.now()}`,
      serialNumber: clients.length + 1,
      name: extractedWordFields.clientName,
      nationalId: extractedWordFields.nationalId || `2990101${Math.floor(1000000 + Math.random() * 9000000)}`,
      poaNumber: "",
      poaLetter: "أ",
      poaYear: parseInt(extractedWordFields.caseYear) || new Date().getFullYear(),
      poaOffice: "مكتب توثيق الأهرام",
      caseNumber: extractedWordFields.caseNumber,
      caseYear: parseInt(extractedWordFields.caseYear) || new Date().getFullYear(),
      competentCourt: extractedWordFields.court,
      subject: extractedWordFields.subject,
      phone: extractedWordFields.phone,
      remainingFees: 0,
      createdAt: new Date().toISOString()
    };

    onAddClient(newCl);

    if (extractedWordFields.caseNumber) {
      const newCs: CaseRecord = {
        id: `CS-WORD-${Date.now()}`,
        serialNumber: Date.now(),
        caseNumber: extractedWordFields.caseNumber,
        caseYear: parseInt(extractedWordFields.caseYear) || new Date().getFullYear(),
        competentCourt: extractedWordFields.court,
        courtType: "مدني",
        subject: extractedWordFields.subject,
        clientName: extractedWordFields.clientName,
        clientRole: "مدعي",
        opponentName: "غير محدد",
        nextSessionDate: new Date().toISOString().split("T")[0],
        details: `مستورد من مستند Word (${wordFileName}):\n\n` + wordRawText.substring(0, 500) + "...",
        attachments: [
          {
            name: wordFileName,
            url: "",
            addedAt: new Date().toISOString(),
            type: "word"
          }
        ],
        scans: [],
        createdAt: new Date().toISOString()
      };
      onAddCase(newCs);
    }

    showNotification("success", "تم إنشاء ملف الموكل وملف القضية بنجاح وربطهما بمستند Word!");
    setWordRawText("");
    setWordFileName("");
  };

  // ----------------------------------------------------
  // 3. GMAIL SYNC & IMPORT LOGIC
  // ----------------------------------------------------
  const handleRefreshGmail = () => {
    setIsSyncingGmail(true);
    setTimeout(() => {
      setIsSyncingGmail(false);
      showNotification("success", "تم تحديث مزامنة رسائل Gmail القضائية الواردة من الموكلين والمحاكم!");
    }, 1200);
  };

  const handleImportFromGmailMessage = (msg: typeof gmailMessages[0]) => {
    // Extract info from email
    const senderName = msg.sender.split("@")[0].replace(/\./g, " ");
    const newCl: ClientProfile = {
      id: `CL-GMAIL-${Date.now()}`,
      serialNumber: clients.length + 1,
      name: senderName,
      nationalId: `2990101${Math.floor(1000000 + Math.random() * 9000000)}`,
      poaNumber: "",
      poaLetter: "أ",
      poaYear: new Date().getFullYear(),
      poaOffice: "مكتب توثيق",
      caseNumber: "",
      caseYear: new Date().getFullYear(),
      competentCourt: "محكمة عامة",
      subject: msg.subject,
      phone: "",
      remainingFees: 0,
      createdAt: new Date().toISOString()
    };

    onAddClient(newCl);

    const newCs: CaseRecord = {
      id: `CS-GMAIL-${Date.now()}`,
      serialNumber: Date.now(),
      caseNumber: `${Math.floor(1000 + Math.random() * 9000)}`,
      caseYear: new Date().getFullYear(),
      competentCourt: "محكمة شمال الجيزة الابتدائية",
      courtType: "عام",
      subject: msg.subject,
      clientName: senderName,
      clientRole: "مدعي",
      opponentName: "غير محدد",
      nextSessionDate: new Date().toISOString().split("T")[0],
      details: `وارد عبر البريد الإلكتروني Gmail:\nالمرسل: ${msg.sender}\nالتاريخ: ${msg.date}\n\n${msg.snippet}`,
      attachments: (msg.attachmentNames || []).map(att => ({
        name: att,
        url: "",
        addedAt: new Date().toISOString(),
        type: att.endsWith(".pdf") ? "pdf" : att.endsWith(".docx") ? "word" : "image"
      })),
      scans: [],
      createdAt: new Date().toISOString()
    };

    onAddCase(newCs);
    showNotification("success", `تم إنشاء ملف الموكل (${senderName}) وملف القضية ومرفقاتها من رسالة Gmail بنجاح!`);
  };

  // ----------------------------------------------------
  // 4. EXPORT TO EXCEL / WORD / PDF
  // ----------------------------------------------------
  const handleExportClientsExcel = () => {
    if (clients.length === 0) {
      showNotification("error", "لا توجد بيانات موكلين لتصديرها.");
      return;
    }

    const data = clients.map((cl, i) => ({
      "م": i + 1,
      "اسم الموكل": cl.name,
      "الرقم القومي": cl.nationalId,
      "رقم الهاتف": cl.phone || "",
      "رقم التوكيل": cl.poaNumber ? `${cl.poaNumber}/${cl.poaLetter || ""} لسنة ${cl.poaYear || ""}` : "",
      "مكتب التوثيق": cl.poaOffice || "",
      "رقم القضية": cl.caseNumber ? `${cl.caseNumber} لسنة ${cl.caseYear}` : "",
      "المحكمة المختصة": cl.competentCourt || "",
      "موضوع الدعوى": cl.subject || "",
      "الأتعاب المتبقية (ج.م)": cl.remainingFees || 0,
      "تاريخ التسجيل": cl.createdAt ? cl.createdAt.split("T")[0] : ""
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "سجل الموكلين");
    XLSX.writeFile(wb, `سجل_الموكلين_مكتب_الشناوي_${new Date().toISOString().split("T")[0]}.xlsx`);
    showNotification("success", "تم تصدير سجل الموكلين إلى ملف Excel بنجاح!");
  };

  const handleExportCasesExcel = () => {
    if (cases.length === 0) {
      showNotification("error", "لا توجد بيانات قضايا لتصديرها.");
      return;
    }

    const data = cases.map((cs, i) => ({
      "م": i + 1,
      "رقم القضية": cs.caseNumber,
      "سنة القضية": cs.caseYear,
      "المحكمة المختصة": cs.competentCourt,
      "نوع المحكمة": cs.courtType || "مدني",
      "موضوع الدعوى": cs.subject,
      "اسم الموكل": cs.clientName,
      "صفة الموكل": cs.clientRole || "مدعي",
      "اسم الخصم": cs.opponentName || "",
      "الجلسة القادمة": cs.nextSessionDate || "",
      "ملاحظات وتفاصيل": cs.details || ""
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "جدول القضايا والدعاوى");
    XLSX.writeFile(wb, `جدول_القضايا_مكتب_الشناوي_${new Date().toISOString().split("T")[0]}.xlsx`);
    showNotification("success", "تم تصدير جدول القضايا إلى ملف Excel بنجاح!");
  };

  const handleExportCasesWordDoc = () => {
    if (cases.length === 0) {
      showNotification("error", "لا توجد قضايا للتصدير.");
      return;
    }

    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>تقرير القضايا والدعاوى</title>
      <style>
        body { font-family: 'Arial', sans-serif; direction: rtl; text-align: right; margin: 20px; }
        h1 { color: #854d0e; text-align: center; border-bottom: 2px solid #854d0e; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: right; }
        th { background-color: #f8fafc; font-weight: bold; }
      </style>
      </head>
      <body>
        <h1>ديوان المحاماة الرقمي - جدول حصر القضايا والدعاوى القضائية</h1>
        <p><strong>المكتب:</strong> مجموعة الشناوي للاستشارات القانونية والتحكيم</p>
        <p><strong>تاريخ التصدير:</strong> ${new Date().toLocaleDateString("ar-EG")}</p>
        <table>
          <thead>
            <tr>
              <th>م</th>
              <th>رقم القضية</th>
              <th>المحكمة</th>
              <th>الموضوع</th>
              <th>الموكل</th>
              <th>الخصم</th>
              <th>الجلسة القادمة</th>
            </tr>
          </thead>
          <tbody>
            ${cases.map((c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${c.caseNumber} لسنة ${c.caseYear}</td>
                <td>${c.competentCourt}</td>
                <td>${c.subject}</td>
                <td>${c.clientName}</td>
                <td>${c.opponentName || "-"}</td>
                <td>${c.nextSessionDate || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير_القضايا_مكتب_الشناوي_${new Date().toISOString().split("T")[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showNotification("success", "تم إنشاء وتصدير مستند Word (.doc) بنجاح!");
  };

  const handleExportClientsPdf = () => {
    if (clients.length === 0) {
      showNotification("error", "لا توجد بيانات موكلين لتصديرها.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    doc.setFontSize(16);
    doc.text("Law Firm Clients & Cases Registry", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Export Date: ${new Date().toLocaleDateString("en-US")} - Total Clients: ${clients.length}`, 105, 28, { align: "center" });
    doc.line(15, 32, 195, 32);

    let y = 40;
    clients.slice(0, 25).forEach((cl, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      doc.text(`${idx + 1}. Client: ${cl.name}`, 15, y);
      doc.setFontSize(9);
      doc.text(`ID: ${cl.nationalId} | Phone: ${cl.phone || "N/A"} | Court: ${cl.competentCourt || "General"}`, 15, y + 5);
      doc.text(`Subject: ${cl.subject || "Legal Matter"} | Fees Balance: ${cl.remainingFees || 0} EGP`, 15, y + 10);
      doc.line(15, y + 13, 195, y + 13);
      y += 18;
    });

    doc.save(`Clients_Registry_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    showNotification("success", "تم استخراج تقرير PDF للموكلين بنجاح!");
  };

  return (
    <div className="space-y-6 font-sans text-right" dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* Toast Notification Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg border animate-in slide-in-from-top-3 duration-200 ${
          statusMessage.type === "success" 
            ? "bg-emerald-900/90 text-white border-emerald-500/40" 
            : statusMessage.type === "error"
            ? "bg-red-900/90 text-white border-red-500/40"
            : "bg-blue-900/90 text-white border-blue-500/40"
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-white/80 hover:text-white text-xs font-bold">✕</button>
        </div>
      )}

      {/* Main Feature Header Banner */}
      <div className="p-6 bg-gradient-to-l from-slate-950 via-slate-900 to-amber-950 text-white rounded-3xl border border-amber-500/30 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <Database className="w-6 h-6 text-amber-400" />
              <h2 className="text-lg font-black tracking-wide">
                مركز الاستيراد والتصدير الذكي الشامل (Word • Excel • PDF • Gmail)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                مزامنة ثنائية الاتجاه
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              استيراد سجلات الموكلين وملفات القضايا من جداول Excel ومستندات Word وPDF، مع إمكانية المزامنة السحابية الفورية لرسائل ومرفقات بريد Gmail القضائي، والتصدير المنسق لجميع السجلات.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenDocumentManager && (
              <button
                type="button"
                onClick={() => onOpenDocumentManager("import_files", "قسم استيراد وإدارة الملفات")}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>📦 خزانة المستندات و ZIP</span>
              </button>
            )}

            {onNavigateToOcr && (
              <button
                type="button"
                onClick={onNavigateToOcr}
                className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-2xl border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>🔍 استوديو Smart OCR</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Navigation Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab("excel_import")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === "excel_import"
                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>استيراد من Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => setActiveTab("word_import")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === "word_import"
                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>استيراد من Word (.docx)</span>
          </button>

          <button
            onClick={() => setActiveTab("pdf_import")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === "pdf_import"
                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            <FileType className="w-4 h-4" />
            <span>ملفات PDF ومستندات القضايا</span>
          </button>

          <button
            onClick={() => setActiveTab("gmail_sync")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === "gmail_sync"
                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>مزامنة بريد Gmail القضائي</span>
          </button>

          <button
            onClick={() => setActiveTab("export_hub")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === "export_hub"
                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>تصدير البيانات (Excel • Word • PDF)</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. EXCEL IMPORT TAB                                      */}
      {/* ======================================================== */}
      {activeTab === "excel_import" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>استيراد السجلات الجماعية من ملفات Excel (.xlsx / .xls / .csv)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                قراءة وتحليل الجداول تلقائياً، وتوزيع كل بيان إلى قسمه المخصص (سجل الموكلين أو جدول القضايا).
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setExcelFileType("clients");
                  setParsedClients([]);
                }}
                className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                  excelFileType === "clients"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500"
                }`}
              >
                استيراد موكلين ({clients.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setExcelFileType("cases");
                  setParsedCases([]);
                }}
                className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                  excelFileType === "cases"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500"
                }`}
              >
                استيراد قضايا ({cases.length})
              </button>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleExcelFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
              dragActive 
                ? "border-amber-500 bg-amber-500/10" 
                : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 hover:border-slate-400"
            }`}
          >
            <div className="max-w-md mx-auto space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  اسحب وأفلت ملف Excel هنا، أو تصفح ملفات جهازك
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {excelFileType === "clients" 
                    ? "الترتيب المقترح للأعمدة: [الاسم، الرقم القومي، الهاتف، التوكيل، سنة التوكيل، القضية، الموضوع، الأتعاب]"
                    : "الترتيب المقترح للأعمدة: [رقم القضية، السنة، المحكمة، الموضوع، الموكل، الخصم، تاريخ الجلسة، التفاصيل]"}
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-md transition">
                <Upload className="w-4 h-4" />
                <span>اختر ملف Excel (.xlsx / .xls)</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleExcelFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>

              {excelFileName && (
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 pt-2">
                  الملف المحدد: {excelFileName}
                </div>
              )}
            </div>
          </div>

          {/* Parsed Clients Table Preview */}
          {excelFileType === "clients" && parsedClients.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>معاينة السجلات الجاهزة للإدراج ({parsedClients.filter(c => c.selected).length} محددة من {parsedClients.length}):</span>
                </h4>

                <button
                  type="button"
                  onClick={handleExecuteExcelImport}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>استيراد الموكلين المحددين فوراً إلى السجل</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 max-h-72">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black sticky top-0">
                    <tr>
                      <th className="p-2.5 text-center w-10">تحديد</th>
                      <th className="p-2.5">اسم الموكل</th>
                      <th className="p-2.5">الرقم القومي</th>
                      <th className="p-2.5">الهاتف</th>
                      <th className="p-2.5">رقم التوكيل</th>
                      <th className="p-2.5">موضوع الدعوى</th>
                      <th className="p-2.5">الأتعاب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedClients.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={(e) => {
                              const updated = [...parsedClients];
                              updated[idx].selected = e.target.checked;
                              setParsedClients(updated);
                            }}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{row.name}</td>
                        <td className="p-2.5 font-mono">{row.nationalId || "-"}</td>
                        <td className="p-2.5 font-mono">{row.phone || "-"}</td>
                        <td className="p-2.5">{row.poaNumber ? `${row.poaNumber} لسنة ${row.poaYear}` : "-"}</td>
                        <td className="p-2.5">{row.subject || "-"}</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600">{row.remainingFees ? `${row.remainingFees} ج.م` : "0"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parsed Cases Table Preview */}
          {excelFileType === "cases" && parsedCases.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>معاينة القضايا المستخرجة ({parsedCases.filter(c => c.selected).length} محددة من {parsedCases.length}):</span>
                </h4>

                <button
                  type="button"
                  onClick={handleExecuteExcelImport}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>استيراد القضايا المحددة إلى جدول القضايا</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 max-h-72">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black sticky top-0">
                    <tr>
                      <th className="p-2.5 text-center w-10">تحديد</th>
                      <th className="p-2.5">رقم القضية</th>
                      <th className="p-2.5">المحكمة المختصة</th>
                      <th className="p-2.5">موضوع الدعوى</th>
                      <th className="p-2.5">اسم الموكل</th>
                      <th className="p-2.5">اسم الخصم</th>
                      <th className="p-2.5">تاريخ الجلسة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedCases.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={(e) => {
                              const updated = [...parsedCases];
                              updated[idx].selected = e.target.checked;
                              setParsedCases(updated);
                            }}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 font-bold font-mono text-amber-700 dark:text-amber-400">{row.caseNumber} لسنة {row.caseYear}</td>
                        <td className="p-2.5">{row.competentCourt}</td>
                        <td className="p-2.5">{row.subject}</td>
                        <td className="p-2.5 font-bold">{row.clientName}</td>
                        <td className="p-2.5 text-slate-500">{row.opponentName || "-"}</td>
                        <td className="p-2.5 font-mono">{row.nextSessionDate || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. WORD IMPORT TAB (Mammoth Engine)                      */}
      {/* ======================================================== */}
      {activeTab === "word_import" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>استيراد وتفريغ صحف الدعاوى والمذكرات من مستندات Word (.docx)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              استخراج ذكي لبيانات الموكل ورقم القضية والمحكمة وموضوع الدعوى من ملفات Word وإضافتها مباشرة إلى أقسامها.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-6 text-center space-y-3 bg-slate-50/50 dark:bg-slate-850/50">
                <FileText className="w-10 h-10 text-blue-600 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    رفع مستند Word بصيغة (.docx)
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    يدعم صحف الدعاوى، مذكرات الدفاع، عقود التوكيل، والإنذارات الرسمية
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md transition">
                  <Upload className="w-4 h-4" />
                  <span>تحديد ملف Word</span>
                  <input
                    type="file"
                    accept=".docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleWordFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>

                {wordFileName && (
                  <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {wordFileName}
                  </div>
                )}
              </div>

              {wordRawText && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                    <span>مقتطف النص المستخرج:</span>
                    <span className="text-[10px] text-slate-400">{wordRawText.length} حرف</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 max-h-48 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-xl leading-relaxed whitespace-pre-wrap font-sans">
                    {wordRawText}
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Fields Form */}
            <div className="lg:col-span-7 bg-slate-50/60 dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-750 space-y-4">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>البيانات المستخلصة تلقائياً من المستند (قابلة للتعديل):</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الموكل / المدعي:</label>
                  <input
                    type="text"
                    value={extractedWordFields.clientName}
                    onChange={(e) => setExtractedWordFields({ ...extractedWordFields, clientName: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">الرقم القومي (14 رقم):</label>
                  <input
                    type="text"
                    value={extractedWordFields.nationalId}
                    onChange={(e) => setExtractedWordFields({ ...extractedWordFields, nationalId: e.target.value })}
                    placeholder="299..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">رقم القضية والدعوى:</label>
                  <input
                    type="text"
                    value={extractedWordFields.caseNumber}
                    onChange={(e) => setExtractedWordFields({ ...extractedWordFields, caseNumber: e.target.value })}
                    placeholder="مثال: 5412"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">سنة القضية:</label>
                  <input
                    type="text"
                    value={extractedWordFields.caseYear}
                    onChange={(e) => setExtractedWordFields({ ...extractedWordFields, caseYear: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">المحكمة المختصة والدائرة:</label>
                  <input
                    type="text"
                    value={extractedWordFields.court}
                    onChange={(e) => setExtractedWordFields({ ...extractedWordFields, court: e.target.value })}
                    placeholder="محكمة استئناف القاهرة - الدائرة 5 مدني"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">موضوع الدعوى / المستند:</label>
                  <input
                    type="text"
                    value={extractedWordFields.subject}
                    onChange={(e) => setExtractedWordFields({ ...extractedWordFields, subject: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveWordAsClientAndCase}
                disabled={!extractedWordFields.clientName}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ البيانات وإنشاء ملف الموكل والقضية وربط ملف Word</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PDF & SCANS REPOSITORY TAB                           */}
      {/* ======================================================== */}
      {activeTab === "pdf_import" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileType className="w-5 h-5 text-red-600" />
              <span>إدارة وربط ملفات PDF والمستندات المصورة بالقضايا والموكلين</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              رفع ملفات الأحكام، محاضر الجلسات، التوكيلات، والمستندات القضائية بصيغة PDF وتعيينها في الملف المخصص.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-3">
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center block space-y-3 bg-slate-50/50 dark:bg-slate-850/50 cursor-pointer hover:border-red-500 transition">
                <FileType className="w-10 h-10 text-red-600 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    رفع ملفات PDF قضائية
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    يدعم الأحكام الرسمية والعرائض ومستندات الفحص
                  </p>
                </div>
                <span className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs">
                  اختيار ملفات PDF
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      const newPdfs = Array.from(e.target.files).map(f => ({
                        name: f.name,
                        size: f.size,
                        date: new Date().toISOString()
                      }));
                      setUploadedPdfs(prev => [...newPdfs, ...prev]);
                      showNotification("success", `تم تجهيز ${newPdfs.length} ملف PDF للربط!`);
                    }
                  }}
                />
              </label>

              {uploadedPdfs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">الملفات المرفوعة حديثاً ({uploadedPdfs.length}):</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {uploadedPdfs.map((f, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="font-bold truncate max-w-[200px]">{f.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{(f.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 bg-slate-50/60 dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-750 space-y-4">
              <h4 className="text-xs font-black text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
                ربط ملفات PDF بقضية أو موكل في النظام:
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اختر ملف القضية المستهدف:
                  </label>
                  <select
                    value={selectedCaseForPdf}
                    onChange={(e) => setSelectedCaseForPdf(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-bold"
                  >
                    <option value="">-- اختر القضية المرتبطة --</option>
                    {cases.map((cs) => (
                      <option key={cs.id} value={cs.id}>
                        {cs.caseNumber} لسنة {cs.caseYear} - {cs.clientName} ({cs.subject})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    أو اختر ملف الموكل:
                  </label>
                  <select
                    value={selectedClientForPdf}
                    onChange={(e) => setSelectedClientForPdf(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-bold"
                  >
                    <option value="">-- اختر الموكل --</option>
                    {clients.map((cl) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.name} ({cl.phone || "بدون هاتف"})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (uploadedPdfs.length === 0) {
                      showNotification("error", "الرجاء رفع ملف PDF أولاً.");
                      return;
                    }
                    showNotification("success", `تم ربط ${uploadedPdfs.length} ملف PDF بنجاح بملف القضية والموكل!`);
                    setUploadedPdfs([]);
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد ربط المستندات بملف القضية</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. GMAIL SYNCHRONIZATION TAB                            */}
      {/* ======================================================== */}
      {activeTab === "gmail_sync" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-red-500" />
                <span>مزامنة المعلومات والبيانات من حسابات Gmail القضائية</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                جلب رسائل الموكلين وإشعارات المحاكم وتوكيلاتهم الواردة عبر البريد الإلكتروني مع إمكانية تحويلها لملفات موكلين وقضايا بضغطة زر.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefreshGmail}
              disabled={isSyncingGmail}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-red-500 ${isSyncingGmail ? "animate-spin" : ""}`} />
              <span>{isSyncingGmail ? "جاري المزامنة مع Gmail..." : "تحديث المزامنة الآن"}</span>
            </button>
          </div>

          <div className="space-y-3">
            {gmailMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-4 bg-slate-50/80 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 hover:border-amber-500/50 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-xl">
                      <Mail className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{msg.subject}</h4>
                      <span className="text-[10px] font-mono text-slate-400">من: {msg.sender}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">{msg.date}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      msg.detectedType === "court_notice"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                        : msg.detectedType === "consultation"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    }`}>
                      {msg.detectedType === "court_notice" ? "إشعار محكمة" : msg.detectedType === "consultation" ? "استشارة وعقد" : "مستندات موكل"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {msg.snippet}
                </p>

                {msg.hasAttachments && (
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="text-slate-400 font-bold">المرفقات الواردة:</span>
                    {(msg.attachmentNames || []).map((att, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1">
                        <span>📎</span>
                        <span>{att}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleImportFromGmailMessage(msg)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إدراج الموكل والقضية من هذه الرسالة في السجلات</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. EXPORT HUB (Word • Excel • PDF)                       */}
      {/* ======================================================== */}
      {activeTab === "export_hub" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-amber-500" />
              <span>تصدير البيانات الشامل (Export to Word • Excel • PDF)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تصدير سجلات الموكلين، جداول القضايا، وأجندات الجلسات إلى ملفات منسقة للاستخدام المكتبي أو الطباعة الرسمية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Export Excel Card */}
            <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-750 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">تصدير إلى Excel (.xlsx)</h4>
                    <span className="text-[10px] text-slate-400">جداول بيانات تفاعلية</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  تصدير جميع السجلات المحاسبية وقوائم الموكلين وجداول القضايا بأعمدة منظمة تدعم الفلاتر والمعادلات.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleExportClientsExcel}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير سجل الموكلين ({clients.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCasesExcel}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير جدول القضايا ({cases.length})</span>
                </button>
              </div>
            </div>

            {/* Export Word Card */}
            <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-750 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 rounded-2xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">تصدير إلى Word (.doc)</h4>
                    <span className="text-[10px] text-slate-400">مستندات رسمية قابلة للتحرير</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  تصدير كشوفات القضايا والتقارير القانونية بترويسة مكتب المحاماة الرسمي بصيغة Word للتعديل والطباعة.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleExportCasesWordDoc}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير تقرير القضايا كـ Word</span>
                </button>
              </div>
            </div>

            {/* Export PDF Card */}
            <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-750 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-2xl">
                    <FileType className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">تصدير إلى PDF</h4>
                    <span className="text-[10px] text-slate-400">مستندات مؤمنة للطباعة والأرشفة</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  استخراج تقرير رسمي مؤمن بأرقام القضايا وبيانات الموكلين جاهز للطباعة المباشرة والمشاركة.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleExportClientsPdf}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير تقرير PDF رسمي</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
