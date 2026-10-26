import React, { useState, useRef, useEffect } from "react";
import { CaseRecord, ClientProfile, PlatformUser, OpponentProfile } from "../types";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Edit3,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Copy,
  FolderPlus,
  UserPlus,
  FileText,
  Scale,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  Scan,
  Crosshair,
  Printer,
  ChevronDown
} from "lucide-react";

export interface InteractiveHotspotField {
  id: string;
  label: string;
  key: "competentCourt" | "caseNumber" | "caseYear" | "clientName" | "nationalId" | "opponentName" | "subject" | "demands";
  value: string;
  originalValue: string;
  box: { top: number; left: number; width: number; height: number };
  category: "header" | "case_meta" | "parties" | "body" | "verdict";
  confidence: number;
  isModified?: boolean;
}

interface OcrSideBySideCorrectorProps {
  documentName: string;
  imageSrc: string;
  rawExtractedText: string;
  initialEntities?: {
    caseNumber?: string;
    caseYear?: string;
    competentCourt?: string;
    courtType?: string;
    clientName?: string;
    opponentName?: string;
    nationalId?: string;
    phone?: string;
    subject?: string;
    demands?: string;
  };
  currentUser: PlatformUser;
  clients: ClientProfile[];
  cases: CaseRecord[];
  opponents?: OpponentProfile[];
  onAddClient?: (client: ClientProfile) => void;
  onAddCase?: (newCase: CaseRecord) => void;
  onAddOpponent?: (opponent: OpponentProfile) => void;
  onOpenInEditor?: (text: string, title?: string, clientName?: string, caseNumber?: string) => void;
  onSaveCorrections?: (correctedEntities: any, correctedText: string) => void;
  onBack?: () => void;
  language?: "ar" | "en";
}

export default function OcrSideBySideCorrector({
  documentName,
  imageSrc,
  rawExtractedText,
  initialEntities,
  currentUser,
  clients,
  cases,
  opponents = [],
  onAddClient,
  onAddCase,
  onAddOpponent,
  onOpenInEditor,
  onSaveCorrections,
  onBack,
  language = "ar"
}: OcrSideBySideCorrectorProps) {
  // Document Viewer Controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [filterMode, setFilterMode] = useState<"normal" | "bw" | "grayscale" | "contrast">("normal");
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>("case_number_field");
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);

  // Correction Editor States
  const [extractedFullText, setExtractedFullText] = useState(rawExtractedText || "");
  const [viewMode, setViewMode] = useState<"fields" | "fulltext">("fields");
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Structured Hotspot Fields with default and AI-provided coordinates
  const [hotspotFields, setHotspotFields] = useState<InteractiveHotspotField[]>([
    {
      id: "court_header_field",
      label: "المحكمة والدائرة المختصة",
      key: "competentCourt",
      value: initialEntities?.competentCourt || "محكمة استئناف القاهرة - الدائرة 14 عمال",
      originalValue: initialEntities?.competentCourt || "محكمة استئناف القاهرة - الدائرة 14 عمال",
      box: { top: 4, left: 10, width: 80, height: 9 },
      category: "header",
      confidence: 96
    },
    {
      id: "case_number_field",
      label: "رقم القضية",
      key: "caseNumber",
      value: initialEntities?.caseNumber || "1245",
      originalValue: initialEntities?.caseNumber || "1245",
      box: { top: 14, left: 55, width: 35, height: 7 },
      category: "case_meta",
      confidence: 98
    },
    {
      id: "case_year_field",
      label: "السنة القضائية",
      key: "caseYear",
      value: initialEntities?.caseYear || new Date().getFullYear().toString(),
      originalValue: initialEntities?.caseYear || new Date().getFullYear().toString(),
      box: { top: 14, left: 15, width: 35, height: 7 },
      category: "case_meta",
      confidence: 95
    },
    {
      id: "client_name_field",
      label: "اسم الموكل / المدعي (الطالب)",
      key: "clientName",
      value: initialEntities?.clientName || "أحمد محمود إبراهيم النجار",
      originalValue: initialEntities?.clientName || "أحمد محمود إبراهيم النجار",
      box: { top: 23, left: 8, width: 84, height: 9 },
      category: "parties",
      confidence: 94
    },
    {
      id: "national_id_field",
      label: "الرقم القومي للموكل",
      key: "nationalId",
      value: initialEntities?.nationalId || "29004150102458",
      originalValue: initialEntities?.nationalId || "29004150102458",
      box: { top: 33, left: 8, width: 84, height: 6 },
      category: "parties",
      confidence: 91
    },
    {
      id: "opponent_name_field",
      label: "اسم الخصم / المدعى عليه (المعلن إليه)",
      key: "opponentName",
      value: initialEntities?.opponentName || "شركة الأهرام للصناعات الهندسية والتجارة",
      originalValue: initialEntities?.opponentName || "شركة الأهرام للصناعات الهندسية والتجارة",
      box: { top: 41, left: 8, width: 84, height: 9 },
      category: "parties",
      confidence: 93
    },
    {
      id: "subject_field",
      label: "موضوع الدعوى والوقائع",
      key: "subject",
      value: initialEntities?.subject || "دعوى بطلب إلزام المدعى عليه بسداد مستحقات مالية وتعويض عن الفصل التعسفي",
      originalValue: initialEntities?.subject || "دعوى بطلب إلزام المدعى عليه بسداد مستحقات مالية وتعويض عن الفصل التعسفي",
      box: { top: 52, left: 6, width: 88, height: 22 },
      category: "body",
      confidence: 89
    },
    {
      id: "demands_field",
      label: "الطلبات ومنطوق الحكم",
      key: "demands",
      value: initialEntities?.demands || "إلزام المدعى عليه بأن يؤدي للمدعي مبلغ 250,000 جنيه مصري مع الفوائد والمصاريف",
      originalValue: initialEntities?.demands || "إلزام المدعى عليه بأن يؤدي للمدعي مبلغ 250,000 جنيه مصري مع الفوائد والمصاريف",
      box: { top: 76, left: 6, width: 88, height: 18 },
      category: "verdict",
      confidence: 92
    }
  ]);

  const docContainerRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Auto-fetch fine-grained AI interactive hotspots if text is provided
  useEffect(() => {
    const fetchFineGrainedHotspots = async () => {
      if (!rawExtractedText || rawExtractedText.length < 20) return;
      try {
        const res = await fetch("/api/ai/ocr-interactive-fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: rawExtractedText })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.fields && Array.isArray(data.fields) && data.fields.length > 0) {
            setHotspotFields((prev) =>
              prev.map((existing) => {
                const found = data.fields.find((f: any) => f.key === existing.key);
                if (found && found.value) {
                  return {
                    ...existing,
                    value: found.value,
                    originalValue: found.value,
                    box: found.box || existing.box,
                    confidence: found.confidence || existing.confidence
                  };
                }
                return existing;
              })
            );
          }
        }
      } catch (err) {
        console.warn("Could not fetch automatic interactive bounding boxes:", err);
      }
    };

    fetchFineGrainedHotspots();
  }, [rawExtractedText]);

  // Update Field Value
  const handleUpdateFieldValue = (id: string, newValue: string) => {
    setHotspotFields((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, value: newValue, isModified: newValue !== f.originalValue } : f
      )
    );
  };

  // Click on Document Hotspot
  const handleHotspotClick = (fieldId: string) => {
    setActiveHotspotId(fieldId);
    if (fieldRefs.current[fieldId]) {
      fieldRefs.current[fieldId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = (deg: number) => setRotation((prev) => (prev + deg + 360) % 360);

  // Compute CSS filter string
  const getFilterClass = () => {
    if (filterMode === "bw") return "grayscale(100%) contrast(250%) brightness(110%)";
    if (filterMode === "grayscale") return "grayscale(100%)";
    if (filterMode === "contrast") return "contrast(180%) brightness(105%)";
    return "none";
  };

  // Save All Corrections
  const handleSaveAll = () => {
    const correctedEntities = hotspotFields.reduce((acc: any, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    if (onSaveCorrections) {
      onSaveCorrections(correctedEntities, extractedFullText);
    }

    setSaveFeedback("تم حفظ وتثبيت التصحيحات بنجاح ✅");
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  // Register Case Directly
  const handleRegisterAsCase = () => {
    const values = hotspotFields.reduce((acc: any, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    if (onAddCase) {
      const newCase: CaseRecord = {
        id: "CASE-" + Math.floor(1000 + Math.random() * 9000),
        serialNumber: cases.length + 1,
        caseNumber: values.caseNumber || `${Math.floor(1000 + Math.random() * 9000)}`,
        caseYear: parseInt(values.caseYear || "2026", 10) || 2026,
        competentCourt: values.competentCourt || "محكمة استئناف القاهرة",
        courtType: "مدني / استئناف",
        stage: "first_session",
        status: "active",
        subject: values.subject || `مستند تم تدقيقه: ${documentName}`,
        clientName: values.clientName || "موكل مدقق",
        clientRole: "مدعي / طالب",
        opponentName: values.opponentName || "الخصم الوارد بالأوراق",
        nextSessionDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        details: `تم التدقيق جنباً إلى جنب مع المستند الأصلي.\nالطلبات: ${values.demands || "لا توجد"}\n\nالنص المستخرج:\n${extractedFullText.substring(0, 300)}...`,
        attachments: [],
        scans: [],
        createdAt: new Date().toISOString()
      };
      onAddCase(newCase);
    }

    if (onAddClient && values.clientName) {
      const newClient: ClientProfile = {
        id: "CL-" + Math.floor(1000 + Math.random() * 9000),
        serialNumber: clients.length + 1,
        name: values.clientName,
        nationalId: values.nationalId || `29${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        poaNumber: Math.floor(1000 + Math.random() * 9000).toString(),
        poaLetter: "أ",
        poaYear: parseInt(values.caseYear || "2026", 10) || 2026,
        poaOffice: "مكتب توثيق الأهرام النموذجي",
        caseNumber: values.caseNumber || "قيد التعيين",
        caseYear: parseInt(values.caseYear || "2026", 10) || 2026,
        competentCourt: values.competentCourt || "محكمة استئناف القاهرة",
        subject: values.subject || "دعوى قضائية مدققة",
        capacity: "مدعي / طالب",
        phone: "01000000000",
        remainingFees: 0,
        status: "active",
        createdAt: new Date().toISOString()
      };
      onAddClient(newClient);
    }

    setSaveFeedback("🎉 تم قيد ملف القضية والموكل في النظام بنجاح!");
    setTimeout(() => setSaveFeedback(null), 5000);
  };

  const modifiedCount = hotspotFields.filter((f) => f.isModified).length;

  return (
    <div className="space-y-4 text-right font-sans" dir="rtl">
      {/* 1. TOP HEADER & WORKFLOW BAR */}
      <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              title="رجوع"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Eye className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                SIDE-BY-SIDE OCR CORRECTION
              </span>
              <span className="text-xs text-slate-400 truncate max-w-xs">{documentName}</span>
            </div>
            <h2 className="text-sm font-black text-white mt-0.5">
              المعاينة التفاعلية جنباً إلى جنب وتدقيق الأخطاء البصرية
            </h2>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {modifiedCount > 0 && (
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-bold">
              {modifiedCount} حقول تم تعديلها
            </span>
          )}

          <button
            onClick={handleSaveAll}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>حفظ واعتماد التصحيحات</span>
          </button>

          <button
            onClick={handleRegisterAsCase}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>قيد الموكل والقضية في النظام 🚀</span>
          </button>
        </div>
      </div>

      {saveFeedback && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-black flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* 2. SPLIT-SCREEN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[650px]">
        {/* LEFT PANE: ORIGINAL DOCUMENT VIEWER WITH INTERACTIVE HOTSPOTS (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-950 p-4 rounded-3xl border border-slate-800 flex flex-col space-y-3 shadow-lg">
          {/* Document Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-bold">المستند الأصلي</span>
              <span className="px-2 py-0.5 bg-slate-800 text-amber-400 rounded text-[10px] font-mono">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Viewer Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="تصغير"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="إعادة تعيين"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleRotate(90)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="تدوير 90 درجة"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Filter Select */}
              <select
                value={filterMode}
                onChange={(e: any) => setFilterMode(e.target.value)}
                className="bg-slate-800 text-slate-200 text-[11px] rounded-lg px-2 py-1 border border-slate-700 outline-none cursor-pointer"
              >
                <option value="normal">ألوان عادية</option>
                <option value="contrast">عالي التباين (Contrast)</option>
                <option value="bw">أبيض وأسود (B&W)</option>
                <option value="grayscale">رمادي (Grayscale)</option>
              </select>
            </div>
          </div>

          {/* Interactive Document Image Stage */}
          <div
            ref={docContainerRef}
            className="flex-1 min-h-[500px] max-h-[600px] overflow-auto bg-slate-900/80 rounded-2xl p-4 flex items-center justify-center relative border border-slate-800/80 select-none cursor-crosshair"
          >
            <div
              className="relative transition-transform duration-200 origin-center"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                filter: getFilterClass()
              }}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={documentName}
                  className="max-w-full h-auto rounded-lg shadow-2xl block select-none pointer-events-none"
                  style={{ maxHeight: "560px" }}
                />
              ) : (
                <div className="w-96 h-[500px] bg-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 p-6 text-center space-y-2">
                  <FileText className="w-12 h-12 text-slate-600" />
                  <p className="text-xs">المستند المستخرج متاح كنص، لا تتوفر صورة أصلية مباشرة.</p>
                </div>
              )}

              {/* Interactive Bounding Box Overlays */}
              {hotspotFields.map((field) => {
                const isSelected = activeHotspotId === field.id;
                const isHovered = hoveredHotspotId === field.id;
                return (
                  <div
                    key={field.id}
                    onClick={() => handleHotspotClick(field.id)}
                    onMouseEnter={() => setHoveredHotspotId(field.id)}
                    onMouseLeave={() => setHoveredHotspotId(null)}
                    style={{
                      top: `${field.box.top}%`,
                      left: `${field.box.left}%`,
                      width: `${field.box.width}%`,
                      height: `${field.box.height}%`
                    }}
                    className={`absolute rounded-md cursor-pointer transition-all duration-200 border flex items-start justify-end p-1 group ${
                      isSelected
                        ? "border-amber-400 bg-amber-500/25 ring-2 ring-amber-400/80 shadow-lg z-20"
                        : isHovered
                        ? "border-amber-300/80 bg-amber-400/15 z-15"
                        : "border-blue-400/40 bg-blue-500/10 hover:border-amber-400 hover:bg-amber-400/15 z-10"
                    }`}
                    title={`انقر لتعديل وتدقيق: ${field.label}`}
                  >
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs transition ${
                        isSelected
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-950/80 text-amber-300 group-hover:bg-amber-500 group-hover:text-slate-950"
                      }`}
                    >
                      {field.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>انقر على أي منطقة مظللة في المستند لمطابقتها وتصحيحها فوراً</span>
            </span>
            <span className="font-mono text-slate-500">{hotspotFields.length} حقول نشطة</span>
          </div>
        </div>

        {/* RIGHT PANE: STRUCTURED FIELD CORRECTION & TEXT EDITOR (6 Cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-4 shadow-sm">
          {/* Tabs: Fields vs Full Text */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("fields")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "fields"
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>الحقول القانونية المستخرجة ({hotspotFields.length})</span>
              </button>

              <button
                onClick={() => setViewMode("fulltext")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "fulltext"
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>النص الكامل المستخرج</span>
              </button>
            </div>

            {onOpenInEditor && (
              <button
                onClick={() =>
                  onOpenInEditor(
                    extractedFullText,
                    `تدقيق_${documentName}`,
                    hotspotFields.find((f) => f.key === "clientName")?.value,
                    hotspotFields.find((f) => f.key === "caseNumber")?.value
                  )
                }
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>محرر المستندات</span>
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* VIEW MODE 1: STRUCTURED LEGAL FIELDS WITH INLINE CORRECTION */}
          {viewMode === "fields" && (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[520px]">
              {hotspotFields.map((field) => {
                const isSelected = activeHotspotId === field.id;
                const isHovered = hoveredHotspotId === field.id;
                return (
                  <div
                    key={field.id}
                    ref={(el) => {
                      fieldRefs.current[field.id] = el;
                    }}
                    onClick={() => setActiveHotspotId(field.id)}
                    onMouseEnter={() => setHoveredHotspotId(field.id)}
                    onMouseLeave={() => setHoveredHotspotId(null)}
                    className={`p-3.5 rounded-2xl border transition text-right relative ${
                      isSelected
                        ? "bg-amber-500/5 border-amber-500 shadow-sm ring-1 ring-amber-500/40"
                        : isHovered
                        ? "bg-slate-50 dark:bg-slate-850 border-amber-300"
                        : "bg-slate-50/70 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            field.confidence >= 95
                              ? "bg-emerald-500"
                              : field.confidence >= 90
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {field.label}
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        {field.isModified && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            معدل ✍️
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          دقة {field.confidence}%
                        </span>
                      </div>
                    </div>

                    {/* Field Input */}
                    {field.key === "subject" || field.key === "demands" ? (
                      <textarea
                        value={field.value}
                        onChange={(e) => handleUpdateFieldValue(field.id, e.target.value)}
                        rows={2}
                        className="w-full text-xs font-medium p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition leading-relaxed"
                        placeholder={`أدخل أو صحح ${field.label}...`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleUpdateFieldValue(field.id, e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                        placeholder={`أدخل أو صحح ${field.label}...`}
                      />
                    )}

                    {/* Show diff note if modified */}
                    {field.isModified && (
                      <div className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
                        <span className="truncate max-w-xs">
                          الأصل المستخرج: <span className="line-through">{field.originalValue}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateFieldValue(field.id, field.originalValue);
                          }}
                          className="text-amber-500 hover:underline font-bold"
                        >
                          تراجع للأصل
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: FULL EXTRACTED TEXT EDITOR */}
          {viewMode === "fulltext" && (
            <div className="flex-1 flex flex-col space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>تعديل مباشر على المسودة والنص الكامل:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(extractedFullText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-amber-500 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "تم النسخ" : "نسخ النص"}</span>
                </button>
              </div>

              <textarea
                value={extractedFullText}
                onChange={(e) => setExtractedFullText(e.target.value)}
                rows={18}
                className="w-full flex-1 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-mono leading-relaxed outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                placeholder="النص الكامل المستخرج من المستند..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
