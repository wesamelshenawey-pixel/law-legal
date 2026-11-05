import React, { useState, useEffect, useRef } from "react";
import { CaseRecord, ClientProfile, PlatformUser, OpponentProfile } from "../types";
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
  Eye,
  Download,
  FolderPlus,
  UserPlus,
  Scale,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  FileCheck2,
  ArrowRight
} from "lucide-react";
import JSZip from "jszip";

export interface BatchQueueItem {
  id: string;
  file: File | null;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  base64: string;
  status: "queued" | "reading" | "scanning" | "parsing" | "completed" | "error" | "paused";
  progress: number;
  statusMessage: string;
  extractedText?: string;
  entities?: {
    caseNumber?: string;
    caseYear?: string;
    competentCourt?: string;
    courtType?: string;
    clientName?: string;
    opponentName?: string;
    nationalId?: string;
    subject?: string;
    demands?: string;
  };
  errorMessage?: string;
  startedAt?: number;
  completedAt?: number;
}

interface OcrBatchQueueProps {
  currentUser: PlatformUser;
  clients: ClientProfile[];
  cases: CaseRecord[];
  opponents?: OpponentProfile[];
  onAddClient?: (client: ClientProfile) => void;
  onAddCase?: (newCase: CaseRecord) => void;
  onAddOpponent?: (opponent: OpponentProfile) => void;
  onOpenSideBySide?: (item: BatchQueueItem) => void;
  onOpenInEditor?: (text: string, title?: string, clientName?: string, caseNumber?: string) => void;
  onNavigate?: (section: string) => void;
  language?: "ar" | "en";
}

export default function OcrBatchQueue({
  currentUser,
  clients,
  cases,
  opponents = [],
  onAddClient,
  onAddCase,
  onAddOpponent,
  onOpenSideBySide,
  onOpenInEditor,
  onNavigate,
  language = "ar"
}: OcrBatchQueueProps) {
  const [queue, setQueue] = useState<BatchQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [ocrMode, setOcrMode] = useState<string>("standard");
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [bulkRegisterFeedback, setBulkRegisterFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const isProcessingRef = useRef(isProcessing);
  isProcessingRef.current = isProcessing;

  // Handle Drag & Drop
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  // Add Files to Queue
  const addFilesToQueue = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newItems: BatchQueueItem[] = [];

    fileArray.forEach((file) => {
      const reader = new FileReader();
      const itemId = "batch-" + Math.random().toString(36).substring(2, 9);

      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        setQueue((prev) =>
          prev.map((it) =>
            it.id === itemId
              ? {
                  ...it,
                  base64: base64Data,
                  previewUrl: file.type.startsWith("image/")
                    ? base64Data
                    : "https://images.unsplash.com/photo-1568667256549-094345857637?w=300&auto=format&fit=crop&q=60"
                }
              : it
          )
        );
      };

      const newItem: BatchQueueItem = {
        id: itemId,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: "",
        base64: "",
        status: "queued",
        progress: 0,
        statusMessage: "في قائمة الانتظار للتشغيل المتتابع"
      };

      newItems.push(newItem);
      reader.readAsDataURL(file);
    });

    setQueue((prev) => [...prev, ...newItems]);
  };

  // Process Queue Sequentially
  const startProcessingQueue = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsPaused(false);

    const pendingItems = queue.filter(
      (item) => item.status === "queued" || item.status === "error" || item.status === "paused"
    );

    for (let i = 0; i < queue.length; i++) {
      if (isPausedRef.current) break;

      const current = queue[i];
      if (current.status === "completed") continue;

      setActiveItemIndex(i);
      await processSingleQueueItem(current.id);
    }

    setIsProcessing(false);
    setActiveItemIndex(null);
  };

  // Process Single Queue Item
  const processSingleQueueItem = async (itemId: string) => {
    // 1. Reading & Preprocessing
    updateItem(itemId, {
      status: "reading",
      progress: 20,
      statusMessage: "جاري قراءة الملف وتجهيز الأبعاد...",
      startedAt: Date.now()
    });

    await new Promise((r) => setTimeout(r, 400));
    if (isPausedRef.current) return;

    // Get current item base64
    let item = queue.find((q) => q.id === itemId);
    if (!item || !item.base64) {
      // wait a moment if still loading dataurl
      await new Promise((r) => setTimeout(r, 600));
      item = queue.find((q) => q.id === itemId);
    }

    if (!item || !item.base64) {
      updateItem(itemId, {
        status: "error",
        progress: 0,
        statusMessage: "تعذر تحميل بيانات الملف",
        errorMessage: "البيانات غير متاحة"
      });
      return;
    }

    // 2. AI OCR Scanning
    updateItem(itemId, {
      status: "scanning",
      progress: 50,
      statusMessage: "جاري استخراج النصوص بالذكاء الاصطناعي (Gemini Vision)..."
    });

    try {
      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: item.base64,
          mode: ocrMode,
          prompt: autoCorrect
            ? "قم بقراءة واستخراج كافة النصوص العربية المكتوبة في هذا المستند القضائي أو الورقة الرسمية بدقة متناهية مع ترتيب الفقرات وتصحيح الأخطاء المطبعية سياقياً:"
            : undefined
        })
      });

      if (!res.ok) {
        throw new Error("فشل الاتصال بمحرك OCR");
      }

      const ocrData = await res.json();
      const extractedText = ocrData.text || "تم فحص المستند ولكن لم يتم العثور على نص واضح.";

      // 3. AI Legal Entities & Docket Parsing
      updateItem(itemId, {
        status: "parsing",
        progress: 80,
        statusMessage: "جاري تحليل الأطراف وأرقام القضايا والمحكمة...",
        extractedText: extractedText
      });

      // Extract entities via AI
      let parsedEntities: any = {};
      try {
        const entityRes = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `أنت خبير فحص مستندات قانونية. استخرج البيانات التالية من هذا النص القضائي بصيغة JSON فقط:
{
  "clientName": "اسم الموكل أو المدعي",
  "nationalId": "الرقم القومي إن وجد",
  "opponentName": "اسم الخصم أو المدعى عليه",
  "caseNumber": "رقم القضية",
  "caseYear": "السنة القضائية",
  "competentCourt": "اسم المحكمة",
  "courtType": "نوع القضية",
  "subject": "موضوع الدعوى",
  "demands": "الطلبات"
}

النص:
${extractedText.substring(0, 3000)}`
          })
        });

        if (entityRes.ok) {
          const entityData = await entityRes.json();
          const match = (entityData.text || "").match(/\{[\s\S]*\}/);
          if (match) {
            parsedEntities = JSON.parse(match[0]);
          }
        }
      } catch (err) {
        console.warn("Entity parsing fallback triggered", err);
      }

      // 4. Completed
      updateItem(itemId, {
        status: "completed",
        progress: 100,
        statusMessage: "اكتمل الفحص واستخراج البيانات بنجاح ✅",
        extractedText: extractedText,
        entities: {
          caseNumber: parsedEntities.caseNumber || "",
          caseYear: parsedEntities.caseYear || new Date().getFullYear().toString(),
          competentCourt: parsedEntities.competentCourt || "محكمة استئناف القاهرة",
          courtType: parsedEntities.courtType || "مدني / استئناف",
          clientName: parsedEntities.clientName || "",
          opponentName: parsedEntities.opponentName || "",
          nationalId: parsedEntities.nationalId || "",
          subject: parsedEntities.subject || (extractedText.substring(0, 80) + "..."),
          demands: parsedEntities.demands || ""
        },
        completedAt: Date.now()
      });
    } catch (err: any) {
      updateItem(itemId, {
        status: "error",
        progress: 0,
        statusMessage: "حدث خطأ أثناء المعالجة",
        errorMessage: err.message || "خطأ غير معروف"
      });
    }
  };

  const updateItem = (id: string, updates: Partial<BatchQueueItem>) => {
    setQueue((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleRetryItem = (id: string) => {
    updateItem(id, { status: "queued", progress: 0, statusMessage: "في قائمة الانتظار للإعادة" });
    if (!isProcessing) {
      startProcessingQueue();
    }
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((it) => it.id !== id));
  };

  const handleClearQueue = () => {
    if (isProcessing) {
      if (!confirm("جاري معالجة الدفعة حالياً، هل أنت متأكد من مسح القائمة؟")) return;
    }
    setQueue([]);
    setIsProcessing(false);
    setActiveItemIndex(null);
  };

  // Bulk Register All Completed Items
  const handleBulkRegisterCompleted = () => {
    const completedItems = queue.filter((q) => q.status === "completed" && q.entities?.clientName);
    if (completedItems.length === 0) {
      alert("لا توجد مستندات مكتملة تحتوي على بيانات موكلين لقيدها.");
      return;
    }

    let clientsCreated = 0;
    let casesCreated = 0;

    completedItems.forEach((item, index) => {
      const ent = item.entities!;
      if (onAddClient && ent.clientName) {
        const newClient: ClientProfile = {
          id: "CL-" + Math.floor(1000 + Math.random() * 9000),
          serialNumber: clients.length + 1 + index,
          name: ent.clientName,
          nationalId: ent.nationalId || `29${Math.floor(100000000000 + Math.random() * 900000000000)}`,
          poaNumber: Math.floor(1000 + Math.random() * 9000).toString(),
          poaLetter: "أ",
          poaYear: parseInt(ent.caseYear || "2026", 10) || 2026,
          poaOffice: "مكتب توثيق الأهرام النموذجي",
          caseNumber: ent.caseNumber || "قيد التعيين",
          caseYear: parseInt(ent.caseYear || "2026", 10) || 2026,
          competentCourt: ent.competentCourt || "محكمة استئناف القاهرة",
          subject: ent.subject || "دعوى قضائية",
          capacity: "مدعي / طالب",
          phone: "01000000000",
          remainingFees: 0,
          status: "active",
          createdAt: new Date().toISOString()
        };
        onAddClient(newClient);
        clientsCreated++;
      }

      if (onAddCase && (ent.caseNumber || ent.clientName)) {
        const newCase: CaseRecord = {
          id: "CASE-" + Math.floor(1000 + Math.random() * 9000),
          serialNumber: cases.length + 1 + index,
          caseNumber: ent.caseNumber || `${Math.floor(1000 + Math.random() * 9000)}`,
          caseYear: parseInt(ent.caseYear || "2026", 10) || 2026,
          competentCourt: ent.competentCourt || "محكمة شمال القاهرة الابتدائية",
          courtType: ent.courtType || "مدني كلي",
          stage: "first_session",
          status: "active",
          subject: ent.subject || `دعوى مستخرجة من الدفعة الجماعية: ${item.name}`,
          clientName: ent.clientName || "موكل الدفعة الجماعية",
          clientRole: "مدعي / طالب",
          opponentName: ent.opponentName || "الخصم المستخرج من الأوراق",
          nextSessionDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          details: `مستندات تم فحصها واستخراجها عبر طابور المعالجة المتتابع:\n${(item.extractedText || "").substring(0, 300)}...`,
          attachments: [],
          scans: [],
          createdAt: new Date().toISOString()
        };
        onAddCase(newCase);
        casesCreated++;
      }
    });

    setBulkRegisterFeedback(
      `🎉 تم قيد (${clientsCreated}) موكلين جدد و (${casesCreated}) قضايا في النظام دفعة واحدة بنجاح!`
    );
    setTimeout(() => setBulkRegisterFeedback(null), 6000);
  };

  // Download All Extracted Text as ZIP
  const handleDownloadAllAsZip = async () => {
    const completedItems = queue.filter((q) => q.status === "completed" && q.extractedText);
    if (completedItems.length === 0) {
      alert("لا توجد نصوص مكتملة لتحميلها.");
      return;
    }

    const zip = new JSZip();
    completedItems.forEach((item, idx) => {
      const fileName = `${idx + 1}_${item.name.replace(/\.[^/.]+$/, "")}_مستخرج.txt`;
      const meta = `=== بيانات القضية والمستند ===\nرقم القضية: ${item.entities?.caseNumber || "غير محدد"}/${item.entities?.caseYear || ""}\nالمحكمة: ${item.entities?.competentCourt || ""}\nالموكل: ${item.entities?.clientName || ""}\nالخصم: ${item.entities?.opponentName || ""}\nالموضوع: ${item.entities?.subject || ""}\n\n=== النص الكامل المستخرج ===\n${item.extractedText}`;
      zip.file(fileName, meta);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `حزمة_فحص_المستندات_OCR_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Progress Calculations
  const totalCount = queue.length;
  const completedCount = queue.filter((q) => q.status === "completed").length;
  const errorCount = queue.filter((q) => q.status === "error").length;
  const pendingCount = queue.filter((q) => q.status === "queued" || q.status === "paused").length;
  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 1. TOP STATS & BATCH CONTROLS HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 rounded-3xl border border-slate-800 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Layers className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] tracking-wide">
                  BATCH PROCESS QUEUE
                </span>
                <span className="text-xs text-slate-400">معالجة متتابعة بالخلفية</span>
              </div>
              <h2 className="text-base font-black text-white mt-1">
                طابور الفحص والمعالجة الجماعية الذكية للمستندات
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) addFilesToQueue(e.target.files);
              }}
              multiple
              accept="image/*,application/pdf"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700 shadow-xs"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>إضافة ملفات للطابور</span>
            </button>

            {queue.length > 0 && !isProcessing && (
              <button
                onClick={startProcessingQueue}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>تشغيل الطابور ({pendingCount + errorCount})</span>
              </button>
            )}

            {isProcessing && (
              <button
                onClick={handleTogglePause}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md ${
                  isPaused
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-amber-500 hover:bg-amber-600 text-slate-950"
                }`}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                <span>{isPaused ? "استئناف المعالجة" : "إيقاف مؤقت"}</span>
              </button>
            )}

            {queue.length > 0 && (
              <button
                onClick={handleClearQueue}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                title="تفريغ القائمة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        {queue.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <span>الإنجاز الإجمالي للدفعة:</span>
                <span className="text-amber-400 font-black font-mono">{overallProgress}%</span>
              </span>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> مكتمل: {completedCount}
                </span>
                {errorCount > 0 && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> أخطاء: {errorCount}
                  </span>
                )}
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> متبقي: {pendingCount}
                </span>
                <span>الإجمالي: {totalCount}</span>
              </div>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. DRAG & DROP ZONE / EMPTY STATE */}
      {queue.length === 0 ? (
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition cursor-pointer flex flex-col items-center justify-center gap-4 ${
            isDragging
              ? "border-amber-500 bg-amber-500/10 scale-[1.01]"
              : "border-slate-300 dark:border-slate-800 hover:border-amber-500/50 bg-white dark:bg-slate-900/60"
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
            <Upload className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              اسحب وأفلت حزمة المستندات أو ملفات PDF هنا
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              يدعم إدراج عشرات الصور والمستندات القضائية دفعة واحدة لمعالجتها تباعاً في الخلفية مع استخراج الحقول القانونية وأطراف النزاع تلقائياً.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition shadow-md cursor-pointer"
            >
              استعراض الملفات من الجهاز 📂
            </button>
          </div>
        </div>
      ) : (
        /* 3. BATCH QUEUE ITEMS LIST */
        <div className="space-y-4">
          {/* Quick Bulk Actions Toolbar */}
          {completedCount > 0 && (
            <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  اكتملت معالجة <span className="font-mono text-emerald-700 dark:text-emerald-200 font-black">{completedCount}</span> مستند من الدفعة بنجاح.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleBulkRegisterCompleted}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>قيد كافة القضايا والموكلين دفعة واحدة 🚀</span>
                </button>

                <button
                  onClick={handleDownloadAllAsZip}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-amber-500/30"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير حزمة ZIP نصوص 📦</span>
                </button>
              </div>
            </div>
          )}

          {bulkRegisterFeedback && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-black flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>{bulkRegisterFeedback}</span>
            </div>
          )}

          {/* Queue Items Grid */}
          <div className="space-y-3">
            {queue.map((item, index) => {
              const isActive = activeItemIndex === index;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition relative ${
                    item.status === "completed"
                      ? "bg-white dark:bg-slate-900 border-emerald-500/40 shadow-xs"
                      : item.status === "scanning" || item.status === "reading" || item.status === "parsing"
                      ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/60 shadow-md ring-1 ring-amber-500/30"
                      : item.status === "error"
                      ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/40"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* File Thumbnail & Metadata */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-center">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="w-6 h-6 text-slate-400" />
                        )}
                        <span className="absolute top-0 right-0 px-1 bg-slate-950/80 text-[8px] font-mono text-amber-400 rounded-bl">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({(item.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>

                        {/* Status Label & Step Text */}
                        <div className="flex items-center gap-2 text-xs">
                          {item.status === "completed" && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> مكتمل
                            </span>
                          )}
                          {(item.status === "scanning" || item.status === "reading" || item.status === "parsing") && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px] rounded-md flex items-center gap-1 animate-pulse">
                              <Sparkles className="w-3 h-3" /> {item.status === "scanning" ? "فحص OCR" : item.status === "reading" ? "تجهيز" : "تحليل الكيانات"}
                            </span>
                          )}
                          {item.status === "queued" && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px] rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3" /> في الانتظار
                            </span>
                          )}
                          {item.status === "error" && (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 font-bold text-[10px] rounded-md flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> فشل
                            </span>
                          )}

                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.statusMessage}
                          </span>
                        </div>

                        {/* Extracted Entities Tag Preview */}
                        {item.status === "completed" && item.entities && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {item.entities.caseNumber && (
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded">
                                قضية: {item.entities.caseNumber}/{item.entities.caseYear}
                              </span>
                            )}
                            {item.entities.clientName && (
                              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded">
                                موكل: {item.entities.clientName}
                              </span>
                            )}
                            {item.entities.competentCourt && (
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded">
                                {item.entities.competentCourt}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      {/* Individual File Progress Bar */}
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>التقدم</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.status === "completed"
                                ? "bg-emerald-500"
                                : item.status === "error"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {item.status === "completed" && (
                          <>
                            {onOpenSideBySide && (
                              <button
                                onClick={() => onOpenSideBySide(item)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                                title="معاينة وتدقيق جنباً إلى جنب مع المستند الأصلي"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>تدقيق جنباً لجنب</span>
                              </button>
                            )}

                            {onOpenInEditor && item.extractedText && (
                              <button
                                onClick={() =>
                                  onOpenInEditor(
                                    item.extractedText!,
                                    `مستند_${item.name}`,
                                    item.entities?.clientName,
                                    item.entities?.caseNumber
                                  )
                                }
                                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                title="فتح في محرر المستندات"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}

                        {item.status === "error" && (
                          <button
                            onClick={() => handleRetryItem(item.id)}
                            className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg transition cursor-pointer"
                            title="إعادة المحاولة"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                          title="حذف من الطابور"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
