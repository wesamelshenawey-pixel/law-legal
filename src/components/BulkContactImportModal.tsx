import React, { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Clipboard, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Filter, 
  Database, 
  Sparkles, 
  X, 
  Search, 
  ArrowRight, 
  UserCheck, 
  ShieldAlert, 
  Smartphone, 
  Users, 
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus
} from "lucide-react";
import { ClientProfile, OpponentProfile, LeadProfile } from "../types";
import { 
  getStoredWorkspaceToken, 
  requestWorkspaceAuth, 
  fetchGoogleContacts, 
  GoogleContact 
} from "../utils/workspaceService";

export interface ParsedContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  nationalId?: string;
  address?: string;
  jobTitle?: string;
  notes?: string;
  source: string;
  isDuplicate?: boolean;
  selected?: boolean;
}

interface BulkContactImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkAddClients: (newClients: ClientProfile[]) => void;
  onBulkAddOpponents: (newOpponents: OpponentProfile[]) => void;
  onBulkAddLeads: (newLeads: LeadProfile[]) => void;
  existingClients: ClientProfile[];
  existingOpponents: OpponentProfile[];
  existingLeads: LeadProfile[];
  language?: "ar" | "en";
}

const MAX_CAPACITY = 10000;

// Authentic Egyptian/Arab generator data pools
const ARAB_FIRST_NAMES = [
  "محمد", "أحمد", "محمود", "علي", "حسين", "حسن", "إبراهيم", "طارق", "سامح", "خالد",
  "مصطفى", "يوسف", "عمر", "كريم", "حازم", "عمرو", "هاني", "أشرف", "ماجد", "رامي",
  "فاطمة", "مريم", "سارة", "نورهان", "ياسمين", "منى", "دعاء", "ريهام", "هبة", "إيمان",
  "مروة", "سلمى", "دينا", "رانيا", "نهى", "أماني", "شيماء", "آية", "جهاد", "رضوى"
];

const ARAB_MIDDLE_NAMES = [
  "عبد الرحمن", "عبد الله", "عبد العزيز", "عز الدين", "سعد الدين", "كمال", "فتحي",
  "جمال", "صلاح", "نبيل", "عادل", "ممدوح", "توفيق", "شريف", "سامي", "رأفت", "مدحت",
  "فاروق", "أنور", "حلمي", "رمضان", "شعبان", "حمدي", "راضي", "متولي", "شوقي"
];

const ARAB_LAST_NAMES = [
  "الشناوي", "الشاذلي", "البحيري", "السيد", "المهدي", "الهلالي", "منصور", "الشرقاوي",
  "العوضي", "الطنطاوي", "المغربي", "الدسوقي", "النجار", "الحداد", "الصاوي", "القاضي",
  "الباز", "زهران", "غنيم", "عكاشة", "عاشور", "خاطر", "عفيفي", "سليمان", "بركات"
];

const EGYPTIAN_CITIES = [
  "القاهرة - مدينة نصر", "الجيزة - الدقي", "الإسكندرية - سموحة", "المنصورة - حي الجامعة",
  "طنطا - شارع البحر", "الزقازيق - القومية", "أسيوط - المحطة", "الإسماعيلية - الشيخ زايد",
  "بورسعيد - الشرق", "سوهاج - الكورنيش", "قنا - الشؤون", "دمياط - الأعصر", "الغردقة - الدهار"
];

export default function BulkContactImportModal({
  isOpen,
  onClose,
  onBulkAddClients,
  onBulkAddOpponents,
  onBulkAddLeads,
  existingClients,
  existingOpponents,
  existingLeads,
  language = "ar"
}: BulkContactImportModalProps) {
  const [activeImportTab, setActiveImportTab] = useState<"paste" | "excel" | "google" | "vcf" | "generator">("paste");
  const [targetCategory, setTargetCategory] = useState<"leads" | "clients" | "opponents">("leads");
  
  // Staging contact buffer
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterDuplicatesOnly, setFilterDuplicatesOnly] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vcfInputRef = useRef<HTMLInputElement>(null);

  // Normalization & duplicate identification
  const normalizePhoneNumber = (raw: string): string => {
    let clean = raw.replace(/[^\d+]/g, "").trim();
    if (clean.startsWith("0020")) clean = "0" + clean.substring(4);
    else if (clean.startsWith("+20")) clean = "0" + clean.substring(3);
    else if (clean.startsWith("20") && clean.length === 12) clean = "0" + clean.substring(2);
    return clean;
  };

  // Check if a phone already exists in local system
  const existingPhoneSet = useMemo(() => {
    const set = new Set<string>();
    existingClients.forEach(c => c.phone && set.add(normalizePhoneNumber(c.phone)));
    existingOpponents.forEach(o => o.phone && set.add(normalizePhoneNumber(o.phone)));
    existingLeads.forEach(l => l.phone && set.add(normalizePhoneNumber(l.phone)));
    return set;
  }, [existingClients, existingOpponents, existingLeads]);

  // Parse Raw Text (Supports comma, tab, semicolon, colon, pipe, newline)
  const handleParsePasteText = () => {
    if (!pasteText.trim()) {
      setStatusMessage("يرجى لصق نصوص أو أرقام جهات الاتصال أولاً.");
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);

    setTimeout(() => {
      const lines = pasteText.split(/\r?\n/);
      const newItems: ParsedContact[] = [];
      const seenPhones = new Set<string>();

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Regex for detecting Egyptian & international numbers
        const phoneMatch = trimmed.match(/(?:\+?20|0020)?\b0?1[0125]\d{8}\b|\b(?:\+?\d{1,4})?\d{8,14}\b/);
        let phone = phoneMatch ? normalizePhoneNumber(phoneMatch[0]) : "";
        
        // Email detection
        const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const email = emailMatch ? emailMatch[0] : undefined;

        // Name cleanup
        let name = trimmed;
        if (phoneMatch) name = name.replace(phoneMatch[0], "");
        if (emailMatch) name = name.replace(emailMatch[0], "");
        name = name.replace(/^[ \t،,:\-\|\\\/]+|[ \t،,:\-\|\\\/]+$/g, "").trim();

        if (!name && phone) {
          name = `جهة اتصال ${idx + 1}`;
        }

        if (name.length > 0 || phone.length > 0) {
          const isDup = (phone && (seenPhones.has(phone) || existingPhoneSet.has(phone))) || false;
          if (phone) seenPhones.add(phone);

          newItems.push({
            id: `p-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            name: name || "بدون اسم",
            phone: phone || "غير محدد",
            email,
            source: "نسخ ولصق يدوي (Direct Paste)",
            isDuplicate: isDup,
            selected: true
          });
        }
      });

      setParsedContacts(prev => {
        const combined = [...prev, ...newItems].slice(0, MAX_CAPACITY);
        return combined;
      });

      setIsProcessing(false);
      setProgressPercent(100);
      setStatusMessage(`تم تحليل واستخراج ${newItems.length} جهة اتصال بنجاح.`);
      setPasteText("");
    }, 50);
  };

  // Parse Excel or CSV using SheetJS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage("جاري قراءة وتحليل ملف الإكسيل/CSV...");
    setProgressPercent(20);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!json || json.length === 0) {
          setIsProcessing(false);
          setStatusMessage("الملف فارغ أو لا يحتوي على صفوف بيانات صالحة.");
          return;
        }

        // Auto detect column headers
        const headerRow: string[] = json[0] ? json[0].map((h: any) => String(h).trim().toLowerCase()) : [];
        let nameIdx = -1;
        let phoneIdx = -1;
        let emailIdx = -1;
        let nationalIdIdx = -1;
        let addressIdx = -1;
        let jobIdx = -1;

        headerRow.forEach((col, idx) => {
          if (col.includes("name") || col.includes("اسم") || col.includes("موكل") || col.includes("عميل") || col.includes("خصم")) nameIdx = idx;
          if (col.includes("phone") || col.includes("هاتف") || col.includes("موبايل") || col.includes("جوال") || col.includes("تليفون") || col.includes("tel") || col.includes("mobile")) phoneIdx = idx;
          if (col.includes("email") || col.includes("بريد") || col.includes("mail")) emailIdx = idx;
          if (col.includes("national") || col.includes("رقم قومي") || col.includes("بطاقة") || col.includes("id")) nationalIdIdx = idx;
          if (col.includes("address") || col.includes("عنوان") || col.includes("محل إقامة") || col.includes("city")) addressIdx = idx;
          if (col.includes("job") || col.includes("وظيفة") || col.includes("عمل") || col.includes("مهنة")) jobIdx = idx;
        });

        const dataRows = (nameIdx !== -1 || phoneIdx !== -1) ? json.slice(1) : json;
        const newItems: ParsedContact[] = [];
        const seenPhones = new Set<string>();

        dataRows.forEach((row: any[], idx) => {
          if (!row || row.length === 0) return;

          let name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : "";
          let rawPhone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : "";
          let email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : undefined;
          let nationalId = nationalIdIdx !== -1 && row[nationalIdIdx] ? String(row[nationalIdIdx]).trim() : undefined;
          let address = addressIdx !== -1 && row[addressIdx] ? String(row[addressIdx]).trim() : undefined;
          let jobTitle = jobIdx !== -1 && row[jobIdx] ? String(row[jobIdx]).trim() : undefined;

          // If no specific header match, try positional scanning
          if (!name && !rawPhone) {
            row.forEach(cell => {
              const cellStr = String(cell).trim();
              if (/^\+?\d{8,15}$/.test(cellStr.replace(/[^\d+]/g, "")) && !rawPhone) {
                rawPhone = cellStr;
              } else if (cellStr.length > 2 && !name && isNaN(Number(cellStr))) {
                name = cellStr;
              }
            });
          }

          const phone = normalizePhoneNumber(rawPhone);
          if (name || phone) {
            const isDup = (phone && (seenPhones.has(phone) || existingPhoneSet.has(phone))) || false;
            if (phone) seenPhones.add(phone);

            newItems.push({
              id: `excel-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
              name: name || `جهة اتصال ${idx + 1}`,
              phone: phone || "غير محدد",
              email,
              nationalId,
              address,
              jobTitle,
              source: `شيت إكسيل (${file.name})`,
              isDuplicate: isDup,
              selected: true
            });
          }
        });

        setParsedContacts(prev => {
          const combined = [...prev, ...newItems].slice(0, MAX_CAPACITY);
          return combined;
        });

        setIsProcessing(false);
        setProgressPercent(100);
        setStatusMessage(`تم استخراج ${newItems.length} جهة اتصال بنجاح من ملف الإكسيل.`);
      } catch (err: any) {
        console.error(err);
        setIsProcessing(false);
        setStatusMessage(`فشل تحليل الملف: ${err.message || "تنسيق غير مدعوم"}`);
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Parse vCard (.vcf)
  const handleVcfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage("جاري استخراج جهات الاتصال من ملف vCard (.vcf)...");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const vcards = text.split(/END:VCARD/i);
        const newItems: ParsedContact[] = [];
        const seenPhones = new Set<string>();

        vcards.forEach((card, idx) => {
          if (!card.trim()) return;
          const fnMatch = card.match(/FN(?:;[^:]+)?:(.*)/i);
          const telMatches = [...card.matchAll(/TEL(?:;[^:]+)?:(.*)/gi)];
          const emailMatch = card.match(/EMAIL(?:;[^:]+)?:(.*)/i);
          const orgMatch = card.match(/ORG(?:;[^:]+)?:(.*)/i);

          const name = fnMatch ? fnMatch[1].trim() : `جهة اتصال VCF ${idx + 1}`;
          let phone = telMatches.length > 0 ? normalizePhoneNumber(telMatches[0][1].trim()) : "";
          const email = emailMatch ? emailMatch[1].trim() : undefined;
          const jobTitle = orgMatch ? orgMatch[1].trim() : undefined;

          if (name || phone) {
            const isDup = (phone && (seenPhones.has(phone) || existingPhoneSet.has(phone))) || false;
            if (phone) seenPhones.add(phone);

            newItems.push({
              id: `vcf-${Date.now()}-${idx}`,
              name,
              phone: phone || "غير محدد",
              email,
              jobTitle,
              source: `ملف vCard (${file.name})`,
              isDuplicate: isDup,
              selected: true
            });
          }
        });

        setParsedContacts(prev => [...prev, ...newItems].slice(0, MAX_CAPACITY));
        setIsProcessing(false);
        setStatusMessage(`تم استخراج ${newItems.length} جهة اتصال بنجاح من أرشيف vCard.`);
      } catch (err: any) {
        setIsProcessing(false);
        setStatusMessage(`فشل تحليل vCard: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (vcfInputRef.current) vcfInputRef.current.value = "";
  };

  // Google Contacts Cloud Sync
  const handleGoogleContactsSync = async () => {
    let tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) {
      requestWorkspaceAuth((newState) => {
        executeGoogleSync(newState.accessToken!);
      }, () => {
        setStatusMessage("تم إلغاء الاتصال بـ Google Contacts أو رفض الأذونات.");
      });
      return;
    }
    executeGoogleSync(tokenState.accessToken);
  };

  const executeGoogleSync = async (token: string) => {
    setIsProcessing(true);
    setStatusMessage("جاري استيراد جهات الاتصال عبر Google People API...");
    try {
      const gContacts: GoogleContact[] = await fetchGoogleContacts(token);
      const seenPhones = new Set<string>();
      const newItems: ParsedContact[] = gContacts.map((gc, idx) => {
        const phone = normalizePhoneNumber(gc.phone || "");
        const isDup = (phone && (seenPhones.has(phone) || existingPhoneSet.has(phone))) || false;
        if (phone) seenPhones.add(phone);

        return {
          id: `g-${Date.now()}-${idx}`,
          name: gc.name || "بدون اسم",
          phone: phone || "غير محدد",
          email: gc.email,
          jobTitle: gc.jobTitle,
          notes: gc.notes,
          source: "Google Contacts (مزامنة سحابية)",
          isDuplicate: isDup,
          selected: true
        };
      });

      setParsedContacts(prev => [...prev, ...newItems].slice(0, MAX_CAPACITY));
      setIsProcessing(false);
      setStatusMessage(`تم استيراد ${newItems.length} جهة اتصال سحابية من Google.`);
    } catch (e: any) {
      setIsProcessing(false);
      setStatusMessage(`خطأ في مزامنة Google Contacts: ${e.message || e}`);
    }
  };

  // Massive Synthetic Contact Generator (up to 10,000)
  const handleGenerateSyntheticContacts = (count: number) => {
    setIsProcessing(true);
    setStatusMessage(`جاري توليد ${count.toLocaleString()} جهة اتصال مصرية ذكية بالكامل...`);
    setProgressPercent(15);

    setTimeout(() => {
      const generated: ParsedContact[] = [];
      const prefixes = ["010", "011", "012", "015"];
      
      for (let i = 0; i < count; i++) {
        const fn = ARAB_FIRST_NAMES[Math.floor(Math.random() * ARAB_FIRST_NAMES.length)];
        const mn = ARAB_MIDDLE_NAMES[Math.floor(Math.random() * ARAB_MIDDLE_NAMES.length)];
        const ln = ARAB_LAST_NAMES[Math.floor(Math.random() * ARAB_LAST_NAMES.length)];
        const name = `${fn} ${mn} ${ln}`;
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
        const phone = `${prefix}${randomDigits}`;

        const nationalYear = 70 + Math.floor(Math.random() * 34); // 1970 to 2004
        const nationalId = `2${nationalYear}0101${Math.floor(1000000 + Math.random() * 9000000)}`;
        const city = EGYPTIAN_CITIES[Math.floor(Math.random() * EGYPTIAN_CITIES.length)];

        generated.push({
          id: `gen-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          phone,
          email: `client.${i + 1}@example.eg`,
          nationalId,
          address: city,
          jobTitle: i % 4 === 0 ? "رجل أعمال" : i % 4 === 1 ? "طبيب استشاري" : i % 4 === 2 ? "مهندس مدني" : "محاسب قانوني",
          source: "توليد ذكي عالي الكثافة (Bulk Synthesizer)",
          isDuplicate: false,
          selected: true
        });
      }

      setParsedContacts(prev => {
        const total = [...prev, ...generated].slice(0, MAX_CAPACITY);
        return total;
      });

      setIsProcessing(false);
      setProgressPercent(100);
      setStatusMessage(`⚡ تم بنجاح توليد وإدراج ${count.toLocaleString()} جهة اتصال مصرية معتمدة.`);
    }, 100);
  };

  // Clean Duplicates
  const handleRemoveDuplicates = () => {
    const uniqueMap = new Map<string, ParsedContact>();
    let removedCount = 0;

    parsedContacts.forEach(c => {
      const p = c.phone !== "غير محدد" ? c.phone : `${c.name}-${c.id}`;
      if (!uniqueMap.has(p)) {
        uniqueMap.set(p, { ...c, isDuplicate: false });
      } else {
        removedCount++;
      }
    });

    setParsedContacts(Array.from(uniqueMap.values()));
    setStatusMessage(`تمت تنقية البيانات وحذف ${removedCount} جهة اتصال مكررة بنجاح.`);
  };

  // Bulk Selection Toggles
  const handleToggleSelectAll = () => {
    const allSelected = parsedContacts.every(c => c.selected);
    setParsedContacts(prev => prev.map(c => ({ ...c, selected: !allSelected })));
  };

  const handleInvertSelection = () => {
    setParsedContacts(prev => prev.map(c => ({ ...c, selected: !c.selected })));
  };

  const handleDeleteSelected = () => {
    const remaining = parsedContacts.filter(c => !c.selected);
    const deletedCount = parsedContacts.length - remaining.length;
    setParsedContacts(remaining);
    setStatusMessage(`تم حذف ${deletedCount} جهة اتصال محددة من القائمة.`);
  };

  // Export Staged Contacts to Excel
  const handleExportStagedToExcel = () => {
    if (parsedContacts.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(
      parsedContacts.map(c => ({
        "الاسم": c.name,
        "الهاتف": c.phone,
        "البريد الإلكتروني": c.email || "",
        "الرقم القومي": c.nationalId || "",
        "العنوان / المحافظة": c.address || "",
        "الوظيفة": c.jobTitle || "",
        "المصدر": c.source
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "جهات الاتصال المستوردة");
    XLSX.writeFile(wb, `جهات_اتصال_مكتب_الشناوي_${parsedContacts.length}.xlsx`);
  };

  // EXECUTE FINAL BULK INGESTION INTO OFFICE DATABASE
  const handleExecuteFinalImport = () => {
    const selectedContacts = parsedContacts.filter(c => c.selected);
    if (selectedContacts.length === 0) {
      alert("يرجى تحديد جهة اتصال واحدة على الأقل للاستيراد.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage(`جاري ترحيل ${selectedContacts.length.toLocaleString()} جهة اتصال إلى قاعدة البيانات...`);

    setTimeout(() => {
      if (targetCategory === "leads") {
        const newLeads: LeadProfile[] = selectedContacts.map((c, idx) => ({
          id: `lead-bulk-${Date.now()}-${idx}`,
          name: c.name,
          phone: c.phone,
          email: c.email,
          notes: `${c.source} ${c.jobTitle ? `- ${c.jobTitle}` : ""} ${c.address ? `- ${c.address}` : ""}`.trim(),
          source: c.source,
          status: "new",
          createdAt: new Date().toISOString()
        }));
        onBulkAddLeads(newLeads);
      } else if (targetCategory === "clients") {
        const newClients: ClientProfile[] = selectedContacts.map((c, idx) => ({
          id: `cl-bulk-${Date.now()}-${idx}`,
          serialNumber: existingClients.length + idx + 1,
          name: c.name,
          phone: c.phone,
          nationalId: c.nationalId || "2900101" + Math.floor(1000000 + Math.random() * 9000000),
          address: c.address || "العنوان مسجل عبر الاستيراد الجماعي",
          subject: c.notes || `مستورد من: ${c.source}`,
          poaNumber: "0000",
          poaLetter: "أ",
          poaYear: new Date().getFullYear(),
          poaOffice: "مكتب التوثيق",
          caseNumber: "0000",
          caseYear: new Date().getFullYear(),
          competentCourt: "محكمة عامة",
          remainingFees: 0,
          createdAt: new Date().toISOString()
        }));
        onBulkAddClients(newClients);
      } else {
        const newOpponents: OpponentProfile[] = selectedContacts.map((c, idx) => ({
          id: `op-bulk-${Date.now()}-${idx}`,
          name: c.name,
          phone: c.phone !== "غير محدد" ? c.phone : undefined,
          isDifferentColor: true
        }));
        onBulkAddOpponents(newOpponents);
      }

      setIsProcessing(false);
      alert(`🎉 تم بنجاح استيراد وتخزين ${selectedContacts.length.toLocaleString()} جهة اتصال كـ [${
        targetCategory === "leads" ? "عملاء محتملين" : targetCategory === "clients" ? "موكلين رسميين" : "خصوم قضائيين"
      }]!`);
      onClose();
    }, 150);
  };

  // Filtered & Paginated List
  const filteredList = useMemo(() => {
    let list = parsedContacts;
    if (filterDuplicatesOnly) {
      list = list.filter(c => c.isDuplicate);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.phone.includes(q) || 
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }
    return list;
  }, [parsedContacts, searchQuery, filterDuplicatesOnly]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  const selectedCount = parsedContacts.filter(c => c.selected).length;
  const duplicatesCount = parsedContacts.filter(c => c.isDuplicate).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 font-sans text-right" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-amber-500/30 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl font-black shadow-lg">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-amber-400">
                  منظومة إدارة واستيراد جهات الاتصال العملاقة
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-black">
                  سعة حتى {MAX_CAPACITY.toLocaleString()} جهة اتصال
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                استيراد سريع من الإكسيل، النسخ واللصق، Google Contacts، ملفات vCard، أو التوليد التلقائي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center font-black transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INPUT CHANNEL TABS */}
        <div className="bg-slate-100 dark:bg-slate-950/60 p-2 border-b border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto select-none">
          <button
            onClick={() => setActiveImportTab("paste")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeImportTab === "paste"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Clipboard className="w-4 h-4" />
            <span>نسخ ولصق نصوص (Copy & Paste)</span>
          </button>

          <button
            onClick={() => setActiveImportTab("excel")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeImportTab === "excel"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>رفع ملف إكسيل / CSV (.xlsx, .csv)</span>
          </button>

          <button
            onClick={() => setActiveImportTab("google")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeImportTab === "google"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <span>مزامنة Google Contacts</span>
          </button>

          <button
            onClick={() => setActiveImportTab("vcf")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeImportTab === "vcf"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-500" />
            <span>ملفات vCard / الهاتف (.vcf)</span>
          </button>

          <button
            onClick={() => setActiveImportTab("generator")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeImportTab === "generator"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>توليد بيانات ضخمة (حتى 10,000)</span>
          </button>
        </div>

        {/* ACTIVE TAB CONTENT BOX */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
          
          {/* TAB 1: COPY & PASTE */}
          {activeImportTab === "paste" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clipboard className="w-4 h-4 text-amber-500" />
                  <span>الصق قائمة جهات الاتصال (كل سطر يمثل جهة اتصال):</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  يتعرف النظام تلقائياً على الأسماء، أرقام الهواتف المصرية والدولية، والبريد الإلكتروني
                </span>
              </div>
              <textarea
                rows={4}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"أحمد محمود عبد العال, 01012345678, ahmed@example.com&#10;المستشار طارق الشناوي	01198765432&#10;سارة إبراهيم - 01233445566&#10;+201555544433 شركة المقاولات الحديثة"}
                className="w-full p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-mono outline-none focus:border-amber-500 transition"
              />
              <div className="flex justify-between items-center">
                <button
                  onClick={handleParsePasteText}
                  disabled={!pasteText.trim() || isProcessing}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>تحليل وإدراج النص في المعاينة</span>
                </button>
                <span className="text-[11px] text-slate-400 font-mono">
                  {pasteText.split(/\r?\n/).filter(l => l.trim()).length} سطر جاهز للتحليل
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: EXCEL / CSV */}
          {activeImportTab === "excel" && (
            <div className="space-y-3">
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".xlsx, .xls, .csv, .tsv" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-white dark:bg-slate-900 p-6 rounded-2xl text-center cursor-pointer transition space-y-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  اضغط هنا لاختيار ملف إكسيل أو CSV أو اسحبه هنا
                </h4>
                <p className="text-xs text-slate-500">
                  يدعم ملفات .xlsx, .xls, .csv, .tsv مع مطابقة الأعمدة تلقائياً حتى 10,000 صف
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE CONTACTS */}
          {activeImportTab === "google" && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    مزامنة مباشرة عبر Google People API
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    سحب جهات الاتصال المسجلة في حساب Gmail / Google Workspace الخاص بالمكتب بضغطة زر
                  </p>
                </div>
              </div>
              <button
                onClick={handleGoogleContactsSync}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
                <span>بدء مزامنة Google Contacts</span>
              </button>
            </div>
          )}

          {/* TAB 4: VCARD */}
          {activeImportTab === "vcf" && (
            <div className="space-y-3">
              <input 
                ref={vcfInputRef} 
                type="file" 
                accept=".vcf, text/vcard" 
                onChange={handleVcfUpload} 
                className="hidden" 
              />
              <div 
                onClick={() => vcfInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-white dark:bg-slate-900 p-6 rounded-2xl text-center cursor-pointer transition space-y-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  استيراد ملف جهات اتصال الهاتف (.vcf / vCard)
                </h4>
                <p className="text-xs text-slate-500">
                  متوافق مع النسخ الاحتياطية المصدرة من هواتف iPhone و Android و Outlook و WhatsApp
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: SYNTHETIC GENERATOR */}
          {activeImportTab === "generator" && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>مولد جهات الاتصال المصرية للاختبار واكتمال السعة الكبرى:</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    توليد أسماء ثلاثية ورباعية مصرية حقيقية، أرقام شبكات (010, 011, 012, 015)، أرقام قومية ومحافظات
                  </p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleGenerateSyntheticContacts(100)}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 text-xs font-black rounded-xl transition cursor-pointer"
                >
                  + ١٠٠ جهة اتصال
                </button>
                <button
                  onClick={() => handleGenerateSyntheticContacts(500)}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 text-xs font-black rounded-xl transition cursor-pointer"
                >
                  + ٥٠٠ جهة اتصال
                </button>
                <button
                  onClick={() => handleGenerateSyntheticContacts(1000)}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-sm"
                >
                  + ١,٠٠٠ جهة اتصال
                </button>
                <button
                  onClick={() => handleGenerateSyntheticContacts(2500)}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-sm"
                >
                  + ٢,٥٠٠ جهة اتصال
                </button>
                <button
                  onClick={() => handleGenerateSyntheticContacts(5000)}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer shadow-sm"
                >
                  + ٥,٠٠٠ جهة اتصال
                </button>
                <button
                  onClick={() => handleGenerateSyntheticContacts(10000)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer shadow-md"
                >
                  ⚡ الحد الأقصى الكامل (١٠,٠٠٠ جهة اتصال)
                </button>
              </div>
            </div>
          )}

        </div>

        {/* STATUS & FEEDBACK BAR */}
        {statusMessage && (
          <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
          </div>
        )}

        {/* DATA CONTROL & FILTER TOOLBAR */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative w-48 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="بحث في الأسماء أو الهواتف..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Quick Actions */}
            <button
              onClick={handleToggleSelectAll}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-bold transition cursor-pointer"
            >
              {parsedContacts.every(c => c.selected) ? "إلغاء التحديد" : "تحديد الكل"}
            </button>

            <button
              onClick={handleInvertSelection}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-bold transition cursor-pointer"
            >
              عكس التحديد
            </button>

            {duplicatesCount > 0 && (
              <button
                onClick={handleRemoveDuplicates}
                className="px-2.5 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center gap-1"
                title="حذف الأرقام والأسماء المكررة تلقائياً"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تنقية المكرر ({duplicatesCount})</span>
              </button>
            )}

            {parsedContacts.length > 0 && (
              <button
                onClick={handleExportStagedToExcel}
                className="px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                title="تصدير القائمة المعروضة إلى ملف إكسيل"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير إكسيل</span>
              </button>
            )}
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-400">
              إجمالي: <span className="font-mono font-black text-slate-900 dark:text-white">{parsedContacts.length.toLocaleString()}</span> / {MAX_CAPACITY.toLocaleString()}
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              المحدد: <span className="font-mono font-black">{selectedCount.toLocaleString()}</span>
            </span>
          </div>

        </div>

        {/* CONTACTS DATA TABLE (VIRTUAL-READY PAGINATION) */}
        <div className="flex-1 overflow-y-auto max-h-[45vh] p-4">
          {parsedContacts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold">لا توجد جهات اتصال قيد المعاينة حالياً.</p>
              <p className="text-[11px] text-slate-500">اختر إحدى الطرق أعلاه (إكسيل، لصق نصوص، Google Contacts، أو التوليد) للبدء.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-2 text-center w-8">#</th>
                    <th className="pb-2">الاسم</th>
                    <th className="pb-2">رقم الهاتف</th>
                    <th className="pb-2">البريد الإلكتروني</th>
                    <th className="pb-2">الرقم القومي / العنوان</th>
                    <th className="pb-2">المصدر</th>
                    <th className="pb-2 text-center w-12">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedList.map((c, idx) => {
                    const rowIdx = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => {
                          setParsedContacts(prev => prev.map(item => item.id === c.id ? { ...item, selected: !item.selected } : item));
                        }}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                          c.selected ? "bg-amber-500/5" : ""
                        }`}
                      >
                        <td className="py-2.5 text-center font-mono text-[10px] text-slate-400" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={c.selected || false}
                            onChange={() => {
                              setParsedContacts(prev => prev.map(item => item.id === c.id ? { ...item, selected: !item.selected } : item));
                            }}
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="py-2.5 font-mono font-bold text-amber-700 dark:text-amber-400">
                          {c.phone}
                        </td>
                        <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                          {c.email || "-"}
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-400 text-[11px]">
                          {c.nationalId ? <span className="font-mono ml-1">{c.nationalId}</span> : null}
                          {c.address ? <span>({c.address})</span> : (!c.nationalId && "-")}
                        </td>
                        <td className="py-2.5 text-slate-400 text-[10px]">
                          {c.source}
                        </td>
                        <td className="py-2.5 text-center">
                          {c.isDuplicate ? (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded text-[9px] font-black">
                              مكرر
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded text-[9px] font-bold">
                              جديد
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        {filteredList.length > pageSize && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">عرض في الصفحة:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
              <span className="text-slate-400 text-[11px]">
                الصفحة {currentPage} من {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-bold">{currentPage}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* MODAL FOOTER & TARGET DISPATCH SELECTION */}
        <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Target destination selection */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-black text-amber-400">
              📂 ترحيل واستيراد القائمة إلى:
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setTargetCategory("leads")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  targetCategory === "leads"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                عملاء محتملين (Leads)
              </button>
              <button
                onClick={() => setTargetCategory("clients")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  targetCategory === "clients"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                موكلين رسميين (Clients)
              </button>
              <button
                onClick={() => setTargetCategory("opponents")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  targetCategory === "opponents"
                    ? "bg-red-600 text-white font-black shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                خصوم قضائيين (Opponents)
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>

            <button
              onClick={handleExecuteFinalImport}
              disabled={selectedCount === 0 || isProcessing}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                تأكيد حفظ ({selectedCount.toLocaleString()}) جهة اتصال
              </span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
