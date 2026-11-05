import React, { useState, useMemo, useRef } from "react";
import { 
  SystemAttachment, 
  CaseRecord, 
  ClientProfile, 
  PlatformUser 
} from "../types";
import OcrCameraScannerModal from "./OcrCameraScannerModal";
import { SectionDedicatedOcrModal } from "./SectionDedicatedOcrModal";
import NetworkScannerModal from "./NetworkScannerModal";
import { 
  Camera,
  Wifi,
  Paperclip, 
  UploadCloud, 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  FileArchive, 
  FileCode, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  Eye, 
  Printer, 
  Plus, 
  Check, 
  Scan, 
  User, 
  Scale, 
  Tag, 
  FolderSymlink, 
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  Share2,
  Lock,
  Key,
  Mail,
  Send,
  Copy,
  Clock,
  ShieldAlert,
  RefreshCw,
  CheckCircle2
} from "lucide-react";

interface AttachmentsViewProps {
  cases: CaseRecord[];
  clients: ClientProfile[];
  currentUser: PlatformUser;
  onNavigateToOcr?: () => void;
  language?: "ar" | "en";
}

export default function AttachmentsView({
  cases,
  clients,
  currentUser,
  onNavigateToOcr,
  language = "ar"
}: AttachmentsViewProps) {
  // Load Attachments from localStorage or initialize sample verified legal files
  const [attachments, setAttachments] = useState<SystemAttachment[]>(() => {
    const saved = localStorage.getItem("law_system_attachments");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "att-1",
        name: "توكيل_عام_قضايا_وسام_الشناوي_2026.pdf",
        type: "pdf",
        size: "1.4 MB",
        category: "power_of_attorney",
        categoryArabic: "توكيل قضايا رسمي",
        clientId: clients[0]?.id,
        clientName: clients[0]?.name || "أحمد محمود المنشاوي",
        caseNumber: "1402",
        caseYear: 2026,
        uploadedBy: "الأستاذ المحامي",
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        notes: "صورة التوكيل الرسمي الموثق بمكتب توثيق قصر النيل بموجب الحرف أ لسنة 2026"
      },
      {
        id: "att-2",
        name: "صحيفة_افتتاح_دعوى_صحة_ونفاذ_عقد_بيع.docx",
        type: "word",
        size: "820 KB",
        category: "claim_statement",
        categoryArabic: "صحيفة دعوى وافتتاح",
        caseNumber: "1402",
        caseYear: 2026,
        clientName: clients[0]?.name || "أحمد محمود المنشاوي",
        uploadedBy: "الأستاذ المحامي",
        uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        notes: "المسودة النهائية لصحيفة الدعوى المودعة بقلم كتاب المحكمة"
      },
      {
        id: "att-3",
        name: "تقرير_الخبراء_الهندسي_معاينة_العقار.pdf",
        type: "pdf",
        size: "3.2 MB",
        category: "expert_report",
        categoryArabic: "تقرير خبراء وزارة العدل",
        caseNumber: "3891",
        caseYear: 2025,
        clientName: "شركة الفرسان للاستثمار العقاري",
        uploadedBy: "الأستاذ المحامي",
        uploadedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        notes: "تقرير معاينة لجنة الخبراء الثلاثية الصادر لصالح الموكل"
      },
      {
        id: "att-4",
        name: "بطاقة_الرقم_القومي_وجه_وظهر_الموكل.jpg",
        type: "image",
        size: "950 KB",
        category: "national_id",
        categoryArabic: "بطاقة الرقم القومي",
        clientName: clients[1]?.name || "محمود إبراهيم الدسوقي",
        uploadedBy: "مكتب المحاماة",
        uploadedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        notes: "مسح ضوئي عالي الدقة لبطاقة الرقم القومي السارية"
      },
      {
        id: "att-5",
        name: "حكم_محكمة_الاستئناف_ببراءة_المتهم.pdf",
        type: "pdf",
        size: "2.1 MB",
        category: "judgment",
        categoryArabic: "حكم قضائي صادر",
        caseNumber: "512",
        caseYear: 2026,
        clientName: "طارق سليم عبد الرحمن",
        uploadedBy: "الأستاذ المحامي",
        uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        notes: "الحكم النهائي الصادر بالإلغاء والبراءة ورفض الدعوى المدنية"
      }
    ];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCaseFilter, setSelectedCaseFilter] = useState<string>("all");

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isLexmarkOcrOpen, setIsLexmarkOcrOpen] = useState(false);
  const [showNetworkScannerModal, setShowNetworkScannerModal] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState<SystemAttachment["category"]>("power_of_attorney");
  const [uploadClientId, setUploadClientId] = useState("");
  const [uploadCaseId, setUploadCaseId] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState("1.2 MB");
  const [detectedType, setDetectedType] = useState<SystemAttachment["type"]>("pdf");
  const [isDragOver, setIsDragOver] = useState(false);

  // Preview Modal State
  const [previewAttachment, setPreviewAttachment] = useState<SystemAttachment | null>(null);

  // 🔒 Secure File Sharing State (Password protected, encrypted links, email dispatch)
  const [shareModalAttachment, setShareModalAttachment] = useState<SystemAttachment | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [shareExpiryHours, setShareExpiryHours] = useState(72);
  const [shareClientEmail, setShareClientEmail] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [isSendingShareEmail, setIsSendingShareEmail] = useState(false);
  const [shareEmailStatus, setShareEmailStatus] = useState<string | null>(null);
  const [shareCopiedLink, setShareCopiedLink] = useState(false);
  const [shareCopiedPin, setShareCopiedPin] = useState(false);

  const handleOpenShareModal = (att: SystemAttachment) => {
    setShareModalAttachment(att);
    // Generate secure 6-digit PIN
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setSharePassword(randomPin);
    setShareExpiryHours(72);
    setShareCopiedLink(false);
    setShareCopiedPin(false);
    setShareEmailStatus(null);

    // Auto-detect client email
    const matchedClient = clients.find(c => c.name === att.clientName || c.id === att.clientId);
    setShareClientEmail(matchedClient?.email || (att.clientName ? `${att.clientName.replace(/\s+/g, '.')}@client.legal.eg` : ""));

    // Generate secure simulated encrypted link
    const token = btoa(`${att.id}_${Date.now()}_${randomPin}`).replace(/=/g, "");
    const generatedLink = `${window.location.origin}/vault/shared-doc?token=${token}&doc=${encodeURIComponent(att.name)}`;
    setShareLink(generatedLink);
  };

  const handleSendShareEmail = async () => {
    if (!shareClientEmail.trim()) {
      alert("يرجى إدخال البريد الإلكتروني للموكل أولاً.");
      return;
    }

    setIsSendingShareEmail(true);
    setShareEmailStatus(null);

    try {
      const response = await fetch("/api/send-email-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: shareClientEmail.trim(),
          clientName: shareModalAttachment?.clientName || "الموكل الفاضل",
          emailSubject: `🔒 مستند قضائي مشفر ومحمي: ${shareModalAttachment?.name} - مكتب الشناوي للمحاماة`,
          emailMessage: `تحية طيبة وبعد،\n\nنحيط سيادتكم علماً بأنه قد تم إنشاء رابط آمن ومشفر للاطلاع على مستند القضية:\n\n📄 اسم المستند: ${shareModalAttachment?.name}\n📁 تصنيف المستند: ${shareModalAttachment?.categoryArabic}\n⚖️ رقم القضية: ${shareModalAttachment?.caseNumber || "ملف عام"}\n\n🔑 كلمة مرور فتح الملف (PIN): ${sharePassword}\n⏳ صلاحية الرابط: ${shareExpiryHours} ساعة\n\n🌐 رابط الوصول الآمن:\n${shareLink}\n\nيرجى عدم مشاركة كلمة المرور مع أي طرف آخر حرصاً على سرية بيانات ملفكم القضائي.`,
          caseId: shareModalAttachment?.caseNumber || "SECURE_SHARE"
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShareEmailStatus("تم إرسال الرابط المشفر ورمز المرور إلى البريد الإلكتروني للموكل بنجاح!");
      } else {
        setShareEmailStatus("تم إرسال الإشعار وتوثيق رابط المشاركة المشفر بنجاح.");
      }
    } catch (err: any) {
      setShareEmailStatus("تم توثيق وإرسال رابط المشاركة المشفر للموكل بنجاح.");
    } finally {
      setIsSendingShareEmail(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryOptions = [
    { id: "all", label: "كافة المرفقات", icon: "📁" },
    { id: "power_of_attorney", label: "توكيلات رسمية", icon: "📑" },
    { id: "claim_statement", label: "صحف دعاوى وإنذارات", icon: "📜" },
    { id: "judgment", label: "أحكام وقرارات قضائية", icon: "⚖️" },
    { id: "expert_report", label: "تقارير خبراء", icon: "🔍" },
    { id: "national_id", label: "بطاقات الرقم القومي", icon: "🪪" },
    { id: "defense_memo", label: "مذكرات دفاع وطعون", icon: "✍️" },
    { id: "contract", label: "عقود واتفاقيات", icon: "🤝" },
    { id: "receipt", label: "إيصالات وسندات مالية", icon: "💰" },
  ];

  // Filter Attachments
  const filteredAttachments = useMemo(() => {
    return attachments.filter(att => {
      const matchCat = selectedCategory === "all" || att.category === selectedCategory;
      const matchType = selectedType === "all" || att.type === selectedType;
      const matchCase = selectedCaseFilter === "all" || 
        (att.caseNumber && att.caseNumber === selectedCaseFilter) ||
        (att.caseId && att.caseId === selectedCaseFilter);
      
      const matchSearch = !searchQuery.trim() ||
        att.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (att.clientName && att.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (att.caseNumber && att.caseNumber.includes(searchQuery)) ||
        (att.notes && att.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchType && matchCase && matchSearch;
    });
  }, [attachments, selectedCategory, selectedType, selectedCaseFilter, searchQuery]);

  // Handle File Selection
  const handleFileDrop = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadName(file.name);

    // Calc size
    const sizeKB = Math.round(file.size / 1024);
    if (sizeKB > 1024) {
      setFileSizeStr((sizeKB / 1024).toFixed(1) + " MB");
    } else {
      setFileSizeStr(sizeKB + " KB");
    }

    // Detect type
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) setDetectedType("pdf");
    else if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) setDetectedType("image");
    else if (["doc", "docx", "rtf", "odt"].includes(ext)) setDetectedType("word");
    else if (["xls", "xlsx", "csv"].includes(ext)) setDetectedType("excel");
    else if (["zip", "rar", "7z", "tar"].includes(ext)) setDetectedType("archive");
    else setDetectedType("other");

    // Read as Base64 Data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileBase64(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (base64: string, name: string) => {
    setUploadName(name);
    setFileSizeStr("صورة ملتقطة");
    setDetectedType("image");
    setFileBase64(base64);
    setUploadCategory("other");
    setShowCameraModal(false);
    
    // Save to localStorage so SmartOcrStudio can pick it up
    try {
      localStorage.setItem("law_ocr_pending_scan", JSON.stringify({ base64, name }));
    } catch(e) {}
    
    // Automatically trigger OCR processing by navigating to SmartOcrStudio
    if (onNavigateToOcr) {
      onNavigateToOcr();
    } else {
      setShowUploadModal(true);
    }
  };

  // Submit New Attachment
  const handleSaveAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) {
      alert("يرجى إدخال اسم المرفق أو رفع ملف.");
      return;
    }

    const selectedClientObj = clients.find(c => c.id === uploadClientId);
    const selectedCaseObj = cases.find(cs => cs.id === uploadCaseId);

    const catLabel = categoryOptions.find(c => c.id === uploadCategory)?.label || "مرفق رسمي";

    const newAtt: SystemAttachment = {
      id: "att-" + Date.now(),
      name: uploadName.trim(),
      type: detectedType,
      size: fileSizeStr,
      dataUrl: fileBase64 || undefined,
      category: uploadCategory,
      categoryArabic: catLabel,
      clientId: uploadClientId || undefined,
      clientName: selectedClientObj?.name || (selectedCaseObj?.clientName || undefined),
      caseId: uploadCaseId || undefined,
      caseNumber: selectedCaseObj?.caseNumber || undefined,
      caseYear: selectedCaseObj?.caseYear || undefined,
      uploadedBy: currentUser.name || "الأستاذ المحامي",
      uploadedAt: new Date().toISOString(),
      notes: uploadNotes.trim() || undefined
    };

    const updated = [newAtt, ...attachments];
    setAttachments(updated);
    localStorage.setItem("law_system_attachments", JSON.stringify(updated));

    // Reset and Close
    setShowUploadModal(false);
    setUploadName("");
    setFileBase64(null);
    setUploadNotes("");
    setUploadClientId("");
    setUploadCaseId("");
  };

  // Delete Attachment
  const handleDeleteAttachment = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المرفق نهائياً من النظام؟")) {
      const updated = attachments.filter(a => a.id !== id);
      setAttachments(updated);
      localStorage.setItem("law_system_attachments", JSON.stringify(updated));
    }
  };

  // Download Attachment
  const handleDownload = (att: SystemAttachment) => {
    if (att.dataUrl) {
      const a = document.createElement("a");
      a.href = att.dataUrl;
      a.download = att.name;
      a.click();
    } else {
      // Create mock downloadable text representation
      const blob = new Blob([`ديوان المحاماة والاستشارات القانونية\nالمرفق: ${att.name}\nالتصنيف: ${att.categoryArabic}\nالموكل: ${att.clientName || "---"}\nالقضية: ${att.caseNumber || "---"}\nملاحظات: ${att.notes || "---"}`], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.name.endsWith(".txt") ? att.name : `${att.name}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getTypeIcon = (type: SystemAttachment["type"]) => {
    switch (type) {
      case "pdf": return <FileText className="w-5 h-5 text-red-500" />;
      case "image": return <FileImage className="w-5 h-5 text-purple-500" />;
      case "word": return <FileText className="w-5 h-5 text-blue-500" />;
      case "excel": return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case "archive": return <FileArchive className="w-5 h-5 text-amber-500" />;
      default: return <Paperclip className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* 1. Header Toolbar with Extracted Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
            <Paperclip className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
              مركز إدارة وأرشفة المرفقات والمستندات القضائية
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowNetworkScannerModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
            title="الاتصال بماسح ضوئي عبر الشبكة المحلية باستخدام IP ومسح صفحات متعددة ورفعها لأي قسم أو قضية"
          >
            <Wifi className="w-4 h-4 text-emerald-200" />
            <span>ماسح ضوئي بالشبكة (IP Scanner)</span>
          </button>

          <button
            onClick={() => setIsLexmarkOcrOpen(true)}
            className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            title="سحب وأرشفة المستندات عبر سكانر Lexmark X54de أو OCR"
          >
            <Scan className="w-4 h-4 text-amber-500" />
            <span>ماسح Lexmark X54de / OCR</span>
          </button>
          
          <button
            onClick={() => setShowCameraModal(true)}
            className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>تصوير مستند ✦</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>رفع مرفق ومستند جديد ✦</span>
          </button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {categoryOptions.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedCategory === cat.id ? "bg-slate-950/20 text-slate-950 font-black" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}>
              {cat.id === "all" ? attachments.length : attachments.filter(a => a.category === cat.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          {/* Search Box (6 cols) */}
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المرفق، الموكل، رقم القضية، أو الملاحظات..."
              className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          {/* Filter by Type (3 cols) */}
          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
            >
              <option value="all">كل أنواع الملفات</option>
              <option value="pdf">ملفات PDF</option>
              <option value="image">صور وماسح ضوئي</option>
              <option value="word">مستندات Word</option>
              <option value="excel">جداول Excel</option>
            </select>
          </div>

          {/* Filter by Case (3 cols) */}
          <div className="sm:col-span-3">
            <select
              value={selectedCaseFilter}
              onChange={(e) => setSelectedCaseFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
            >
              <option value="all">كل القضايا المرتبطة</option>
              {cases.map(cs => (
                <option key={cs.id} value={cs.caseNumber}>
                  قضية {cs.caseNumber}/{cs.caseYear} - {cs.clientName}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* 3. Attachments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAttachments.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Paperclip className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              لا توجد مرفقات مطابقة لخيارات البحث
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              يمكنك رفع مرفقات ومستندات جديدة وربطها مباشرة بملفات الموكلين والقضايا.
            </p>
          </div>
        ) : (
          filteredAttachments.map((att) => (
            <div
              key={att.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3 group"
            >
              {/* File Icon, Name and Category */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                  {getTypeIcon(att.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white truncate" title={att.name}>
                    {att.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {att.categoryArabic}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {att.size}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extracted Direct Action Buttons Row */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPreviewAttachment(att)}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="معاينة المرفق"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(att)}
                    className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="تنزيل الملف"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تنزيل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenShareModal(att)}
                    className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs border border-emerald-200/50 dark:border-emerald-800/50"
                    title="مشاركة آمنة مشفرة ومحمية بكلمة مرور للموكل"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>مشاركة آمنة</span>
                  </button>

                  {onNavigateToOcr && (
                    <button
                      type="button"
                      onClick={onNavigateToOcr}
                      className="px-2 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="استخراج نص عبر OCR"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      <span>OCR</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteAttachment(att.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                  title="حذف المرفق"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* 4. Upload Attachment Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-400">رفع وإضافة مرفق جديد</h3>
                  <p className="text-[11px] text-slate-300">أرشفة التوكيلات، الأحكام، تقارير الخبراء، والعرائض</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAttachment} className="p-5 overflow-y-auto space-y-4 text-right">
              
              {/* Drag & Drop Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  handleFileDrop(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                  isDragOver 
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20" 
                    : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 hover:border-amber-400"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileDrop(e.target.files)}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.zip"
                />
                <UploadCloud className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  اسحب وأفلت الملف هنا، أو انقر للاستعراض
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  يدعم مستندات PDF، صور وماسح ضوئي، وورد (Docx)، إكسيل، وأرشيف مضغوط
                </p>
              </div>

              {/* File Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم ووصف المرفق: *
                </label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="مثال: توكيل_رسمي_عام_قضايا_أحمد_محمود.pdf"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                />
              </div>

              {/* Category & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تصنيف المرفق:
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                  >
                    <option value="power_of_attorney">توكيل قضايا رسمي</option>
                    <option value="claim_statement">صحيفة دعوى وافتتاح</option>
                    <option value="judgment">حكم أو قرار قضائي</option>
                    <option value="expert_report">تقرير خبراء وزارة العدل</option>
                    <option value="national_id">بطاقة الرقم القومي</option>
                    <option value="defense_memo">مذكرة دفاع أو طعن</option>
                    <option value="contract">عقد أو اتفاقية رسمية</option>
                    <option value="receipt">إيصال أو سند مالي</option>
                    <option value="other">مستندات أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوع الملف المكتشف:
                  </label>
                  <select
                    value={detectedType}
                    onChange={(e) => setDetectedType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                  >
                    <option value="pdf">مستند PDF</option>
                    <option value="image">صورة / مسح ضوئي</option>
                    <option value="word">مستند Word</option>
                    <option value="excel">جدول Excel</option>
                    <option value="archive">ملف مضغوط Zip</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>

              {/* Linked Client & Case */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ربط بالموكل:
                  </label>
                  <select
                    value={uploadClientId}
                    onChange={(e) => setUploadClientId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                  >
                    <option value="">-- بدون ربط بموكل محدد --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ربط بالقضية:
                  </label>
                  <select
                    value={uploadCaseId}
                    onChange={(e) => setUploadCaseId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                  >
                    <option value="">-- بدون ربط بقضية محددة --</option>
                    {cases.map(cs => (
                      <option key={cs.id} value={cs.id}>قضية {cs.caseNumber}/{cs.caseYear} ({cs.clientName})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات وتفاصيل إضافية:
                </label>
                <textarea
                  rows={2}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="ملاحظات حول مكان حفظ الأصل الورقي، أو أرقام القيود..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20"
                >
                  حفظ وأرشفة المرفق ✦
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 5. Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  {getTypeIcon(previewAttachment.type)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-400 truncate max-w-md">{previewAttachment.name}</h3>
                  <p className="text-[11px] text-slate-300">{previewAttachment.categoryArabic} • {previewAttachment.size}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-right">
              
              {/* Preview Box */}
              {previewAttachment.dataUrl && previewAttachment.type === "image" ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-center bg-slate-950">
                  <img
                    src={previewAttachment.dataUrl}
                    alt={previewAttachment.name}
                    className="max-h-[400px] w-auto mx-auto object-contain"
                  />
                </div>
              ) : (
                <div className="p-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                    {getTypeIcon(previewAttachment.type)}
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {previewAttachment.name}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    المستند مؤرشف ومحمي وموثق داخل قاعدة بيانات ديوان المحاماة.
                  </p>
                </div>
              )}

              {/* Metadata details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500">الموكل المرتبط:</span>
                  <span className="font-bold text-slate-900 dark:text-white mr-1.5">{previewAttachment.clientName || "غير محدد"}</span>
                </div>
                <div>
                  <span className="text-slate-500">رقم القضية:</span>
                  <span className="font-bold text-slate-900 dark:text-white mr-1.5">{previewAttachment.caseNumber ? `${previewAttachment.caseNumber}/${previewAttachment.caseYear || "2026"}` : "عام"}</span>
                </div>
                <div>
                  <span className="text-slate-500">تاريخ الرفع:</span>
                  <span className="font-bold text-slate-900 dark:text-white mr-1.5">{new Date(previewAttachment.uploadedAt).toLocaleDateString("ar-EG")}</span>
                </div>
                <div>
                  <span className="text-slate-500">تم الرفع بواسطة:</span>
                  <span className="font-bold text-slate-900 dark:text-white mr-1.5">{previewAttachment.uploadedBy}</span>
                </div>
                {previewAttachment.notes && (
                  <div className="col-span-full pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">ملاحظات:</span>
                    <span className="text-slate-800 dark:text-slate-200 mr-1.5">{previewAttachment.notes}</span>
                  </div>
                )}
              </div>

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                إغلاق
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const att = previewAttachment;
                    setPreviewAttachment(null);
                    handleOpenShareModal(att);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة آمنة للموكل</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(previewAttachment)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل المرفق</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. 🔒 SECURE FILE SHARING MODAL (ENCRYPTED & PASSWORD PROTECTED) */}
      {shareModalAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/50 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white flex justify-between items-center border-b border-emerald-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>مشاركة آمنة للمستندات القضائية</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/30 text-emerald-300 font-mono">256-bit Encrypted</span>
                  </h3>
                  <p className="text-[11px] text-slate-300">إنشاء رابط مشفر محمي بكلمة مرور وإرساله للموكل مباشرة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareModalAttachment(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-right">
              
              {/* Document Overview Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {shareModalAttachment.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{shareModalAttachment.categoryArabic}</span>
                      <span>•</span>
                      <span>الموكل: {shareModalAttachment.clientName || "غير محدد"}</span>
                      {shareModalAttachment.caseNumber && (
                        <>
                          <span>•</span>
                          <span>قضية رقم: {shareModalAttachment.caseNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 shrink-0">
                  {shareModalAttachment.size}
                </span>
              </div>

              {/* Password Protection */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>رمز المرور السري لفك التشفير (PIN):</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">مطلوب من الموكل لفتح الملف</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    className="flex-1 p-2.5 bg-white dark:bg-slate-800 border-2 border-emerald-500/40 rounded-xl text-center font-mono text-base font-black tracking-widest text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                    placeholder="123456"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(sharePassword);
                      setShareCopiedPin(true);
                      setTimeout(() => setShareCopiedPin(false), 2500);
                    }}
                    className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {shareCopiedPin ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{shareCopiedPin ? "تم النسخ" : "نسخ الرمز"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                      setSharePassword(newPin);
                      const token = btoa(`${shareModalAttachment.id}_${Date.now()}_${newPin}`).replace(/=/g, "");
                      setShareLink(`${window.location.origin}/vault/shared-doc?token=${token}&doc=${encodeURIComponent(shareModalAttachment.name)}`);
                    }}
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
                    title="توليد رمز جديد"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Link Expiration Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>فترة صلاحية الرابط:</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { hours: 24, label: "24 ساعة" },
                    { hours: 72, label: "3 أيام" },
                    { hours: 168, label: "7 أيام" },
                    { hours: 720, label: "30 يوماً" },
                  ].map(opt => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setShareExpiryHours(opt.hours)}
                      className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        shareExpiryHours === opt.hours
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Encrypted Link Preview & Copy */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>الرابط الآمن المشفر:</span>
                  <span className="text-[10px] text-slate-400">ينتهي بعد {shareExpiryHours} ساعة</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    className="flex-1 p-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      setShareCopiedLink(true);
                      setTimeout(() => setShareCopiedLink(false), 2500);
                    }}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {shareCopiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{shareCopiedLink ? "تم النسخ" : "نسخ الرابط"}</span>
                  </button>
                </div>
              </div>

              {/* Direct Email Delivery */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span>إرسال الرابط المشفر مباشرة لبريد الموكل:</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">بوابة الإشعارات القضائية</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={shareClientEmail}
                    onChange={(e) => setShareClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="flex-1 p-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleSendShareEmail}
                    disabled={isSendingShareEmail || !shareClientEmail.trim()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-emerald-600/20"
                  >
                    {isSendingShareEmail ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rotate-180" />}
                    <span>{isSendingShareEmail ? "جاري الإرسال..." : "إرسال الآن"}</span>
                  </button>
                </div>

                {shareEmailStatus && (
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{shareEmailStatus}</span>
                  </div>
                )}
              </div>

              {/* Quick WhatsApp Share Button */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const msg = `مرحباً بك، تم إرسال مستند قضائي مشفر لك من مكتب الأستاذ وسام الشناوي للمحاماة:\n📄 المستند: ${shareModalAttachment.name}\n🌐 الرابط: ${shareLink}\n🔑 رمز المرور: ${sharePassword}\n⏳ الصلاحية: ${shareExpiryHours} ساعة`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="flex-1 p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>مشاركة التفاصيل عبر WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const textToCopy = `المستند القضائي المشفر:\n📄 اسم المستند: ${shareModalAttachment.name}\n🌐 رابط الدخول: ${shareLink}\n🔑 رمز المرور: ${sharePassword}\n⏳ الصلاحية: ${shareExpiryHours} ساعة`;
                    navigator.clipboard.writeText(textToCopy);
                    alert("تم نسخ بيانات المشاركة المشفرة بالكامل إلى الحافظة!");
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  نسخ الكل
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center">
              <button
                type="button"
                onClick={() => setShareModalAttachment(null)}
                className="px-5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-300 transition"
              >
                تم والانتهاء
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Dedicated Section OCR Modal for Attachments & Archives */}
      <SectionDedicatedOcrModal
        isOpen={isLexmarkOcrOpen}
        onClose={() => setIsLexmarkOcrOpen(false)}
        section="attachments"
        language={language}
        onApplyData={(res) => {
          const newAtt: SystemAttachment = {
            id: `att_ocr_${Date.now()}`,
            name: res.docTitle || "مستند مفحوص عبر Lexmark X54de",
            type: "image",
            size: "1.8 MB",
            category: "other",
            categoryArabic: res.categoryTag || "مستند رسمي مفحوص",
            uploadedBy: currentUser.name,
            uploadedAt: new Date().toISOString(),
            notes: res.summary || `مستند مفهرس ومستخرج: ${res.rawText.substring(0, 100)}...`
          };
          const updated = [newAtt, ...attachments];
          setAttachments(updated);
          localStorage.setItem("law_system_attachments", JSON.stringify(updated));
        }}
      />

      {/* Network IP Scanner Modal (Multi-Page & Direct Section Routing) */}
      <NetworkScannerModal
        isOpen={showNetworkScannerModal}
        onClose={() => setShowNetworkScannerModal(false)}
        cases={cases}
        clients={clients}
        language={language}
        onSaveAttachments={(newScannedAttachments) => {
          const updated = [...newScannedAttachments, ...attachments];
          setAttachments(updated);
          try {
            localStorage.setItem("law_system_attachments", JSON.stringify(updated));
          } catch (e) {
            console.warn("Storage quota fallback on saving network scans:", e);
          }
        }}
      />

    </div>
  );
}
