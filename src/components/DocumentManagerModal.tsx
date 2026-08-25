import React, { useState, useRef } from "react";
import JSZip from "jszip";
import {
  UploadCloud,
  FileArchive,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCode,
  FolderSymlink,
  Copy,
  Sparkles,
  Printer,
  Trash2,
  Download, QrCode, History,
  Camera,
  CheckSquare,
  Square,
  Search,
  Scan,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Tag,
  BookOpen, X
} from "lucide-react";

export interface DocumentVersion {
  id: string;
  dataUrl: string;
  size: string;
  uploadedAt: string;
}

export interface ManagedDocument {
  id: string;
  name: string;
  size?: string;
  type: "pdf" | "image" | "word" | "excel" | "archive" | "text" | "other";
  section: "cases" | "documentation" | "adminwork" | "clients" | string;
  sectionLabel: string;
  fileBase64?: string;
  versions?: DocumentVersion[];
  url?: string;
  addedAt: string;
  aiSummary?: string;
  aiSuggestedName?: string;
  aiTags?: string[];
  aiAnalyzed?: boolean;
}

interface DocumentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: string;
  currentSectionLabel: string;
  onAddDocuments: (docs: ManagedDocument[]) => void;
  existingDocuments?: ManagedDocument[];
  onUpdateDocuments?: (docs: ManagedDocument[]) => void;
  language?: "ar" | "en";
}

export default function DocumentManagerModal({
  isOpen,
  onClose,
  currentSection,
  currentSectionLabel,
  onAddDocuments,
  existingDocuments = [],
  onUpdateDocuments,
  language = "ar"
}: DocumentManagerModalProps) {
  const [documents, setDocuments] = useState<ManagedDocument[]>(() => {
    const saved = localStorage.getItem("law_managed_documents");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return existingDocuments.length > 0 ? existingDocuments : [
      {
        id: "doc-sample-1",
        name: "عريضة_دعوى_تعويض_مدني_مستشار_وسام.pdf",
        size: "245 KB",
        type: "pdf",
        section: "cases",
        sectionLabel: "ديوان القضايا والدعاوى",
        addedAt: new Date().toISOString(),
        aiSummary: "دعوى مطالبة بتعويض مادي وأدبي عن أضرار ناشئة عن إخلال تعاقدي، موجهة لمحكمة شمال القاهرة الابتدائية.",
        aiTags: ["تعويض مدني", "عريضة افتتاحية", "محكمة شمال القاهرة"],
        aiAnalyzed: true
      },
      {
        id: "doc-sample-2",
        name: "صورة_توكيل_رسمي_عام_قضايا_توثيق_ههيا.jpg",
        size: "1.2 MB",
        type: "image",
        section: "clients",
        sectionLabel: "شؤون الموكلين",
        addedAt: new Date().toISOString(),
        aiSummary: "صورة ضوئية لتوكيل رسمي عام في القضايا برقم 102 لسنة 2026 مكتب توثيق ههيا النموذجي لصالح الأستاذ المحامي.",
        aiTags: ["توكيل رسمي", "مكتب ههيا", "إثبات صفة"],
        aiAnalyzed: true
      }
    ];
  });

  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [showVersionsForDoc, setShowVersionsForDoc] = useState<string | null>(null);
  const [showQrForDoc, setShowQrForDoc] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [isExtractingZip, setIsExtractingZip] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisProgress, setAiAnalysisProgress] = useState("");
  
  // Transfer / Copy Target Section state
  const [targetSection, setTargetSection] = useState<string>("documentation");
  const [showMoveCopyModal, setShowMoveCopyModal] = useState<"move" | "copy" | null>(null);

  // Live Camera Scanner states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const saveDocs = (newDocs: ManagedDocument[]) => {
    setDocuments(newDocs);
    localStorage.setItem("law_managed_documents", JSON.stringify(newDocs));
    if (onUpdateDocuments) onUpdateDocuments(newDocs);
  };

  const sectionsList = [
    { id: "cases", label: "🏛️ ديوان القضايا والخدمات القانونية" },
    { id: "documentation", label: "⚖️ الخزانة والتوثيقات والأحوال" },
    { id: "adminwork", label: "📑 الشؤون والأعمال الإدارية" },
    { id: "clients", label: "📁 ملفات وحسابات الموكلين" }
  ];

  // Helper to detect document type
  const getDocType = (fileName: string): ManagedDocument["type"] => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) return "pdf";
    if (["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(ext)) return "image";
    if (["doc", "docx"].includes(ext)) return "word";
    if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
    if (["txt", "rtf"].includes(ext)) return "text";
    return "other";
  };

  // MULTI-FILE UPLOAD HANDLER WITH AUTO ZIP EXTRACTION
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newExtractedDocs: ManagedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isZip = file.name.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed";

      if (isZip) {
        setIsExtractingZip(true);
        try {
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(file);

          const entries = Object.keys(zipContent.files);
          for (const filename of entries) {
            const zipEntry = zipContent.files[filename];
            if (!zipEntry.dir) {
              const base64Data = await zipEntry.async("base64");
              const docType = getDocType(filename);
              let mime = "application/octet-stream";
              if (docType === "pdf") mime = "application/pdf";
              if (docType === "image") mime = "image/jpeg";
              if (docType === "word") mime = "application/msword";

              const fullBase64 = `data:${mime};base64,${base64Data}`;
              newExtractedDocs.push({
                id: "zip-doc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
                name: filename.split("/").pop() || filename,
                size: `${Math.round(base64Data.length * 0.75 / 1024)} KB`,
                type: docType,
                section: currentSection || "documentation",
                sectionLabel: currentSectionLabel || "الخزانة والتوثيقات",
                fileBase64: fullBase64,
                addedAt: new Date().toISOString()
              });
            }
          }
          alert(`🎉 تم فك وضغط واستخراج عدد (${newExtractedDocs.length}) ملفات من الأرشيف المضغوط [${file.name}] بنجاح!`);
        } catch (err: any) {
          console.error("ZIP Extraction error:", err);
          alert("تعذر استخراج بعض ملفات الأرشيف المضغوط: " + err.message);
        } finally {
          setIsExtractingZip(false);
        }
      } else {
        // Standard multi-file reading
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        newExtractedDocs.push({
          id: "doc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          type: getDocType(file.name),
          section: currentSection || "documentation",
          sectionLabel: currentSectionLabel || "الخزانة والتوثيقات",
          fileBase64: base64,
          addedAt: new Date().toISOString()
        });
      }
    }

    if (newExtractedDocs.length > 0) {
      let currentDocs = [...documents];
      const newlyAddedDocs: ManagedDocument[] = [];

      for (const newDoc of newExtractedDocs) {
        const existingDocIndex = currentDocs.findIndex(d => d.name === newDoc.name && d.section === newDoc.section);
        if (existingDocIndex >= 0) {
          const existingDoc = currentDocs[existingDocIndex];
          const newVersion = {
            id: existingDoc.id,
            name: existingDoc.name,
            size: newDoc.size,
            type: newDoc.type,
            section: existingDoc.section,
            sectionLabel: existingDoc.sectionLabel,
            fileBase64: newDoc.fileBase64,
            addedAt: newDoc.addedAt,
            aiSummary: existingDoc.aiSummary,
            aiTags: existingDoc.aiTags,
            versions: [
              ...(existingDoc.versions || []),
              {
                id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                dataUrl: existingDoc.fileBase64 || "",
                size: existingDoc.size,
                uploadedAt: existingDoc.addedAt
              }
            ]
          };
          currentDocs[existingDocIndex] = newVersion;
          newlyAddedDocs.push(newVersion);
        } else {
          currentDocs = [newDoc, ...currentDocs];
          newlyAddedDocs.push(newDoc);
        }
      }

      saveDocs(currentDocs);
      onAddDocuments(newlyAddedDocs);
    }
  };

  // LIVE CAMERA SCANNER
  const startCamera = async () => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error(err);
      alert("تعذر الوصول لكاميرا المسح الضوئي: " + err.message);
    }
  };

  const captureCameraSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      // Judicial watermark
      ctx.fillStyle = "rgba(217, 119, 6, 0.4)";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("مكتب الأستاذ المحامي المحامي ⚖️ - مسح ضوئي معتمد", 40, canvas.height - 40);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedPhoto(dataUrl);
    }
  };

  const saveScannedDocument = () => {
    if (!capturedPhoto) return;
    const docName = `مسح_ضوئي_مستند_${new Date().toLocaleDateString("ar-EG").replace(/\//g, "-")}_${Date.now().toString().slice(-4)}.jpg`;
    const newDoc: ManagedDocument = {
      id: "scan-" + Date.now(),
      name: docName,
      size: "420 KB",
      type: "image",
      section: currentSection || "documentation",
      sectionLabel: currentSectionLabel || "الخزانة والتوثيقات",
      fileBase64: capturedPhoto,
      addedAt: new Date().toISOString(),
      aiTags: ["مسح ضوئي", "كاميرا المكتب"]
    };

    saveDocs([newDoc, ...documents]);
    onAddDocuments([newDoc]);
    setCapturedPhoto(null);
    setIsCameraActive(false);
    if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    alert("🎉 تم حفظ المستند الممسوح ضوئياً بنجاح وإدراجه بالسجل!");
  };

  // MULTI-SELECTION TOGGLES
  const toggleSelectAll = () => {
    if (selectedDocIds.length === filteredDocuments.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocuments.map((d) => d.id));
    }
  };

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // BATCH MOVE / COPY BETWEEN SECTIONS
  const handleBatchMoveOrCopy = (action: "move" | "copy") => {
    if (selectedDocIds.length === 0) {
      alert("يرجى تحديد مستند واحد أو أكثر أولاً.");
      return;
    }

    const targetSecObj = sectionsList.find((s) => s.id === targetSection) || sectionsList[0];

    let updatedDocs = [...documents];
    if (action === "move") {
      updatedDocs = updatedDocs.map((d) => {
        if (selectedDocIds.includes(d.id)) {
          return {
            ...d,
            section: targetSection,
            sectionLabel: targetSecObj.label
          };
        }
        return d;
      });
      alert(`🚚 تم بنجاح نقل عدد (${selectedDocIds.length}) مستندات إلى قسم [${targetSecObj.label}]!`);
    } else {
      // Copy
      const copies: ManagedDocument[] = [];
      documents.forEach((d) => {
        if (selectedDocIds.includes(d.id)) {
          copies.push({
            ...d,
            id: "doc-copy-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            name: `نسخة_من_${d.name}`,
            section: targetSection,
            sectionLabel: targetSecObj.label,
            addedAt: new Date().toISOString()
          });
        }
      });
      updatedDocs = [...copies, ...updatedDocs];
      alert(`📑 تم بنجاح نسخ عدد (${copies.length}) مستندات وإيداعها في قسم [${targetSecObj.label}]!`);
    }

    saveDocs(updatedDocs);
    setSelectedDocIds([]);
    setShowMoveCopyModal(null);
  };

  // AI DOCUMENT ANALYSIS, AUTO-RENAME & SUMMARY GENERATION
  const handleAiAnalyzeSelected = async () => {
    if (selectedDocIds.length === 0) {
      alert("يرجى تحديد مستند أو أكثر لتشغيل تحليل الذكاء الاصطناعي.");
      return;
    }

    setIsAiAnalyzing(true);
    let updatedDocs = [...documents];

    for (let i = 0; i < selectedDocIds.length; i++) {
      const docId = selectedDocIds[i];
      const doc = updatedDocs.find((d) => d.id === docId);
      if (!doc) continue;

      setAiAnalysisProgress(`جاري تحليل المستند (${i + 1}/${selectedDocIds.length}): ${doc.name}...`);

      try {
        const response = await fetch("/api/ai/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: doc.name,
            fileContent: doc.name,
            currentSection: doc.section
          })
        });

        const data = await response.json();
        if (data.suggestedName) {
          updatedDocs = updatedDocs.map((d) => {
            if (d.id === docId) {
              return {
                ...d,
                name: data.suggestedName || d.name,
                aiSummary: data.summary,
                aiTags: data.tags || ["مستند قانوني"],
                aiAnalyzed: true
              };
            }
            return d;
          });
        }
      } catch (err) {
        console.error("AI Analysis error:", err);
      }
    }

    saveDocs(updatedDocs);
    setIsAiAnalyzing(false);
    setAiAnalysisProgress("");
    alert("✨ تم استكمال تحليل الذكاء الاصطناعي وتعديل أسماء المستندات وتوليد الملاحظات والملخصات بنجاح!");
  };

  // BATCH PRINT
  const handleBatchPrint = () => {
    if (selectedDocIds.length === 0) {
      alert("يرجى تحديد المستندات المراد طباعة بيانها أولاً.");
      return;
    }
    window.print();
  };

  // DELETE SELECTED
  const handleDeleteSelected = () => {
    if (selectedDocIds.length === 0) return;
    if (!confirm(`هل تريد بالتأكيد حذف عدد (${selectedDocIds.length}) مستندات محددة نهائياً؟`)) return;

    const updated = documents.filter((d) => !selectedDocIds.includes(d.id));
    saveDocs(updated);
    setSelectedDocIds([]);
  };

  // FILTERED LIST
  const filteredDocuments = documents.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.aiSummary && d.aiSummary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.aiTags && d.aiTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesSection = sectionFilter === "all" || d.section === sectionFilter;
    return matchesSearch && matchesSection;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto animate-fade-in font-sans"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-amber-500/30 flex justify-between items-center text-right">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500 rounded-xl flex items-center justify-center text-amber-500">
              <FolderSymlink className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                منظومة رفع وإدارة ونقل المستندات الذكية
                <span className="bg-amber-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                  AI & ZIP Multi-Engine
                </span>
              </h3>
              <p className="text-[11px] text-amber-400 font-bold">
                القسم الحالي: {currentSectionLabel} • يدعم استخراج ZIP والمسح الضوئي والتحليل الذكي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-black bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition"
          >
            ×
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Upload Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.zip,.rar"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition transform active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span>رفع ملف أو ملفات متعددة / ZIP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isCameraActive) {
                    if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
                    setIsCameraActive(false);
                  } else {
                    startCamera();
                  }
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>{isCameraActive ? "إغلاق الكاميرا" : "المسح الضوئي (Scanner)"}</span>
              </button>
            </div>

            {/* Batch Selection Action Buttons */}
            {selectedDocIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150">
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 ml-1">
                  ({selectedDocIds.length}) محدد
                </span>

                <button
                  type="button"
                  onClick={() => setShowMoveCopyModal("move")}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer transition shadow-sm"
                  title="نقل المستندات إلى قسم آخر"
                >
                  <FolderSymlink className="w-3.5 h-3.5" />
                  <span>نقل لقسم</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMoveCopyModal("copy")}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer transition shadow-sm"
                  title="نسخ المستندات إلى قسم آخر"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ لقسم</span>
                </button>

                <button
                  type="button"
                  disabled={isAiAnalyzing}
                  onClick={handleAiAnalyzeSelected}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white font-black text-[11px] rounded-lg flex items-center gap-1 cursor-pointer transition shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isAiAnalyzing ? "جاري التحليل..." : "تحليل ذكي وتعديل الاسم"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBatchPrint}
                  className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg cursor-pointer transition"
                  title="حذف المحدد"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Search & Section Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في أسماء المستندات، ملخصات الذكاء الاصطناعي، أو الكلمات المفتاحية..."
                className="w-full pl-3 pr-9 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full py-2 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 transition font-sans"
              >
                <option value="all">📁 جميع الأقسام ({documents.length})</option>
                {sectionsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({documents.filter((d) => d.section === s.id).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Extraction/AI Progress indicator */}
          {(isExtractingZip || isAiAnalyzing) && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span>{isExtractingZip ? "جاري فك ضغط واستخراج ملفات الأرشيف (ZIP/RAR)..." : aiAnalysisProgress}</span>
            </div>
          )}
        </div>

        {/* Live Camera Scanner Viewport */}
        {isCameraActive && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col items-center justify-center gap-3">
            <div className="relative w-full max-w-md aspect-video bg-black rounded-2xl overflow-hidden border-2 border-amber-500 shadow-xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-4 border border-dashed border-amber-400/70 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="bg-black/60 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono">
                  ضع المستند داخل الإطار
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={captureCameraSnapshot}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Camera className="w-4 h-4" />
                <span>التقاط صورة المستند</span>
              </button>

              {capturedPhoto && (
                <button
                  type="button"
                  onClick={saveScannedDocument}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد وحفظ المسح الضوئي</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Move / Copy Target Dialog Modal */}
        {showMoveCopyModal && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                {showMoveCopyModal === "move" ? "اختر القسم المستهدف للنقل:" : "اختر القسم المستهدف للنسخ:"}
              </span>
              <select
                value={targetSection}
                onChange={(e) => setTargetSection(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1 text-xs outline-none font-bold"
              >
                {sectionsList.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBatchMoveOrCopy(showMoveCopyModal)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg cursor-pointer transition shadow-sm"
              >
                تأكيد العملية الآن
              </button>
              <button
                type="button"
                onClick={() => setShowMoveCopyModal(null)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Documents Table / Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Select All Checkbox Header */}
          <div className="flex justify-between items-center px-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              {selectedDocIds.length === filteredDocuments.length && filteredDocuments.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-amber-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>تحديد الكل ({filteredDocuments.length})</span>
            </button>

            <span className="text-[11px] text-slate-500 font-mono">
              إجمالي المستندات: {documents.length}
            </span>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileArchive className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-500">لا توجد ملفات تطابق معايير البحث الحالية.</p>
              <p className="text-xs text-slate-400">
                يمكنك رفع ملفات فردية، أو ملفات متعددة دفعة واحدة، أو سحب ملف ZIP لفك ضغطه تلقائياً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredDocuments.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 space-y-2.5 text-right relative overflow-hidden ${
                      isSelected
                        ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 shadow-md ring-1 ring-amber-500"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSelectDoc(doc.id)}
                          className="mt-0.5 cursor-pointer text-slate-400 hover:text-amber-500"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate" title={doc.name}>
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-bold">
                              {doc.sectionLabel}
                            </span>
                            {doc.size && <span>{doc.size}</span>}
                            <span>{new Date(doc.addedAt).toLocaleDateString("ar-EG")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badge of type */}
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {doc.type}
                      </span>
                    </div>

                    {/* AI Summary note if available */}
                    {doc.aiSummary && (
                      <div className="p-2.5 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 rounded-xl space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
                          <Sparkles className="w-3 h-3" />
                          <span>ملخص وملاحظات الذكاء الاصطناعي:</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {doc.aiSummary}
                        </p>
                        {doc.aiTags && doc.aiTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {doc.aiTags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[9px] bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-bold"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center gap-2">
                        {doc.fileBase64 && (
                          <a
                            href={doc.fileBase64}
                            download={doc.name}
                            className="text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            تحميل
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowQrForDoc(doc.id)}
                          className="text-slate-500 hover:text-amber-500 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3 h-3" />
                          QR
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowVersionsForDoc(doc.id)}
                          className="text-slate-500 hover:text-amber-500 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <History className="w-3 h-3" />
                          النسخ
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = documents.filter((d) => d.id !== doc.id);
                          saveDocs(updated);
                        }}
                        className="text-red-500 hover:text-red-700 text-[10px] font-bold cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <p className="text-[11px] text-slate-500">
            مكتب الأستاذ المحامي للمحاماة • نظام إدارة المستندات السحابية المتكامل
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shadow-md"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>

      {showQrForDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 font-sans text-right">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm flex flex-col items-center gap-4 animate-in zoom-in-95">
            <h3 className="font-bold text-slate-900 dark:text-white">QR Code - مشاركة المستند</h3>
            <p className="text-xs text-slate-500 text-center">امسح الكود لفتح المستند على الهاتف الذكي</p>
            <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-200">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://law-app.local/doc/${showQrForDoc}`} alt="QR Code" className="w-48 h-48" />
            </div>
            <button
              onClick={() => setShowQrForDoc(null)}
              className="mt-2 px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl text-xs transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {showVersionsForDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 font-sans text-right">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 rounded-t-2xl">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                سجل إصدارات المستند
              </h3>
              <button onClick={() => setShowVersionsForDoc(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto space-y-3">
              {documents.find(d => d.id === showVersionsForDoc)?.versions?.length ? (
                documents.find(d => d.id === showVersionsForDoc)?.versions?.map((ver, idx) => (
                  <div key={ver.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">إصدار {idx + 1}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{new Date(ver.uploadedAt).toLocaleString('ar-EG')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={ver.dataUrl} download className="p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition" title="تحميل">
                        <Download className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => {
                          const updated = documents.map(d => {
                            if (d.id === showVersionsForDoc) {
                              return { ...d, fileBase64: ver.dataUrl, size: ver.size };
                            }
                            return d;
                          });
                          saveDocs(updated);
                          alert("تم استعادة المستند للإصدار المحدد بنجاح");
                          setShowVersionsForDoc(null);
                        }}
                        className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                        title="استعادة هذا الإصدار"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  لا يوجد سجل إصدارات محفوظ لهذا المستند.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
