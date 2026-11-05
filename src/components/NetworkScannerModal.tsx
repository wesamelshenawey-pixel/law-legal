import React, { useState, useEffect } from "react";
import { CaseRecord, ClientProfile, SystemAttachment } from "../types";
import { 
  Scan, 
  Wifi, 
  Settings2, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  Trash2, 
  Eye, 
  Upload, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  FolderPlus, 
  Check, 
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Maximize2
} from "lucide-react";

interface NetworkScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CaseRecord[];
  clients: ClientProfile[];
  onSaveAttachments: (newAttachments: SystemAttachment[]) => void;
  onNavigateToSection?: (section: string) => void;
  language?: "ar" | "en";
}

export interface ScannedPageItem {
  id: string;
  pageNumber: number;
  dataUrl: string;
  rotation: number; // 0, 90, 180, 270
  ocrText?: string;
}

export default function NetworkScannerModal({
  isOpen,
  onClose,
  cases,
  clients,
  onSaveAttachments,
  onNavigateToSection,
  language = "ar"
}: NetworkScannerModalProps) {
  // Network scanner connection parameters
  const [scannerIp, setScannerIp] = useState("192.168.1.150");
  const [scannerPort, setScannerPort] = useState("8080");
  const [protocol, setProtocol] = useState<"escl" | "wsd" | "twain_ip" | "http_rest">("escl");
  const [scannerModel, setScannerModel] = useState("Lexmark X54de / Network ADF Scanner");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "offline">("connected");
  const [pingLatency, setPingLatency] = useState<number>(14);

  // Scan settings
  const [sourceMode, setSourceMode] = useState<"adf_multipage" | "flatbed">("adf_multipage");
  const [scanPageCount, setScanPageCount] = useState<number>(3);
  const [resolution, setResolution] = useState<number>(300);
  const [colorMode, setColorMode] = useState<"color" | "grayscale" | "bw_legal">("bw_legal");
  const [duplex, setDuplex] = useState<boolean>(true);

  // Scanning progress & pages
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedPages, setScannedPages] = useState<ScannedPageItem[]>([]);
  const [selectedPageForPreview, setSelectedPageForPreview] = useState<ScannedPageItem | null>(null);

  // Destination & indexing target
  const [targetSection, setTargetSection] = useState<"attachments" | "cases" | "clients" | "advanced_editor" | "police_reports">("attachments");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [documentTitle, setDocumentTitle] = useState("مستند ممسوح ضوئياً عبر شبكة المكتب");
  const [documentCategory, setDocumentCategory] = useState<SystemAttachment["category"]>("claim_statement");
  const [autoExtractOcr, setAutoExtractOcr] = useState(true);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Reset or initialize demo pages when opened if empty
  useEffect(() => {
    if (isOpen && scannedPages.length === 0) {
      // Set default selected case if available
      if (cases.length > 0 && !selectedCaseId) {
        setSelectedCaseId(cases[0].id);
      }
      if (clients.length > 0 && !selectedClientId) {
        setSelectedClientId(clients[0].id);
      }
    }
  }, [isOpen, cases, clients]);

  // Test Ping to Scanner IP
  const handleTestPing = () => {
    setConnectionStatus("connecting");
    setTimeout(() => {
      const mockLatency = Math.floor(8 + Math.random() * 20);
      setPingLatency(mockLatency);
      setConnectionStatus("connected");
    }, 800);
  };

  // Generate simulated legal document canvas for multi-page scanning
  const generateSimulatedScannedPage = (pageNum: number, total: number): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754; // A4 ratio @ 150dpi
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Paper background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle paper scan grain
    ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
    for (let i = 0; i < 50; i++) {
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    // Top official header
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 32px Cairo, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("جمهورية مصر العربية - وزارة العدل", canvas.width / 2, 100);
    ctx.font = "bold 26px Cairo, sans-serif";
    ctx.fillText("محكمة جنوب القاهرة الابتدائية - الدائرة المدنية", canvas.width / 2, 145);

    // Scanner watermark stamp
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 3;
    ctx.strokeRect(80, 70, canvas.width - 160, 110);

    // Body lines simulation
    ctx.fillStyle = "#1e293b";
    ctx.textAlign = "right";
    ctx.font = "bold 24px Cairo, sans-serif";
    ctx.fillText(`الصفحة رقم (${pageNum} من ${total}) - مسح ضوئي شبكي مباشر IP: ${scannerIp}`, canvas.width - 100, 240);

    ctx.font = "normal 22px Cairo, sans-serif";
    ctx.fillText("إنه في يوم الجلسة المنعقدة علناً بمقر المحكمة الموقرة،", canvas.width - 100, 310);
    ctx.fillText("حضر الأستاذ وسام الشناوي المحامي بالنقض والدستورية العليا،", canvas.width - 100, 360);
    ctx.fillText(`بصفته وكيلاً رسمياً بالتوكيل القضائي المودع ملف الدعوى،`, canvas.width - 100, 410);
    ctx.fillText("وقدم حافظة مستندات معتمدة طويت على المستندات والبيانات الجوهرية،", canvas.width - 100, 460);

    // Simulated paragraph lines
    ctx.fillStyle = "#475569";
    for (let y = 520; y < 1400; y += 45) {
      const lineLen = canvas.width - 200 - (Math.random() * 80);
      ctx.fillRect(100, y, lineLen, 12);
    }

    // Official Seal / Stamp on page 1 & last page
    if (pageNum === 1 || pageNum === total) {
      ctx.save();
      ctx.translate(220, 1500);
      ctx.rotate(-0.1);
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#1d4ed8";
      ctx.font = "bold 15px Cairo, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("خاتم شعار الجمهورية", 0, -10);
      ctx.fillText("مكتب الشناوي للمحاماة", 0, 15);
      ctx.restore();
    }

    return canvas.toDataURL("image/jpeg", 0.85);
  };

  // Perform multi-page scan from network scanner
  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setSavedSuccessMsg(null);

    const targetPages = sourceMode === "flatbed" ? 1 : scanPageCount;
    let current = 0;
    const newScannedList: ScannedPageItem[] = [];

    const interval = setInterval(() => {
      current++;
      setScanProgress(Math.round((current / targetPages) * 100));

      const pageDataUrl = generateSimulatedScannedPage(current, targetPages);
      newScannedList.push({
        id: `scan_page_${Date.now()}_${current}`,
        pageNumber: current,
        dataUrl: pageDataUrl,
        rotation: 0,
        ocrText: `نص ممسوح ضوئياً من الصفحة ${current}: محضر جلسة ومستندات رسمية مقدمة من مكتب الأستاذ وسام الشناوي المحامي بالنقض.`
      });

      if (current >= targetPages) {
        clearInterval(interval);
        setIsScanning(false);
        setScannedPages(prev => [...prev, ...newScannedList]);
      }
    }, 900);
  };

  // Rotate a scanned page
  const handleRotatePage = (pageId: string) => {
    setScannedPages(prev => prev.map(p => {
      if (p.id === pageId) {
        const nextRot = (p.rotation + 90) % 360;
        return { ...p, rotation: nextRot };
      }
      return p;
    }));
  };

  // Delete a scanned page
  const handleDeletePage = (pageId: string) => {
    setScannedPages(prev => {
      const filtered = prev.filter(p => p.id !== pageId);
      return filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    });
  };

  // Save all scanned pages to selected destination
  const handleSaveToDestination = () => {
    if (scannedPages.length === 0) {
      alert("لا توجد صفحات ممسوحة ضوئياً لحفظها.");
      return;
    }

    const matchedCase = cases.find(c => c.id === selectedCaseId);
    const matchedClient = clients.find(c => c.id === selectedClientId);

    // Create attachments for each page or bundle
    const newRecords: SystemAttachment[] = scannedPages.map((page, idx) => ({
      id: `att_netscan_${Date.now()}_${idx + 1}`,
      name: `${documentTitle || "مستند شبكي ممسوح"} - صفحة ${page.pageNumber}.jpg`,
      type: "image",
      size: `${(resolution * 4.2).toFixed(0)} KB`,
      category: documentCategory,
      categoryArabic: 
        documentCategory === "claim_statement" ? "صحيفة دعوى رسمية" :
        documentCategory === "power_of_attorney" ? "توكيل قضايا رسمي" :
        documentCategory === "judgment" ? "حكم قضائي صادر" :
        documentCategory === "defense_memo" ? "مذكرة دفاع وطعن" : "مستند رسمي ممسوح",
      clientId: matchedClient?.id,
      clientName: matchedClient?.name,
      caseNumber: matchedCase?.caseNumber,
      caseYear: matchedCase?.caseYear,
      uploadedBy: `ماسح الشبكة (${scannerIp})`,
      uploadedAt: new Date().toISOString(),
      notes: `تم مسحه ضوئياً عبر ماسح الشبكة ${scannerModel} بدقة ${resolution} DPI (${colorMode === "color" ? "ألوان" : "أبيض وأسود قضائي"}). الوجهة: ${targetSection}. ${page.ocrText || ""}`
    }));

    onSaveAttachments(newRecords);
    setSavedSuccessMsg(`تم بنجاح حفظ ورفع ${scannedPages.length} صفحات ممسوحة ضوئياً إلى قسم [${targetSection}] وربطها بالملفات المعنية!`);

    setTimeout(() => {
      if (onNavigateToSection && targetSection !== "attachments") {
        onNavigateToSection(targetSection);
      }
      onClose();
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex justify-between items-center border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20">
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  المسح الضوئي المباشر عبر ماسح الشبكة (Network IP Scanner)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {connectionStatus === "connected" ? `متصل (${pingLatency}ms)` : connectionStatus === "connecting" ? "جاري الفحص..." : "غير متصل"}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                الاتصال بماسك ضوئي عبر بروتوكولات eSCL / WSD / TWAIN-IP ومسح صفحات متعددة ورفعها فوراً
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* 1. Network Scanner IP & Protocol Configuration Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">إعدادات الماسح الضوئي على الشبكة المحلية (LAN):</span>
              </div>
              <button
                type="button"
                onClick={handleTestPing}
                disabled={connectionStatus === "connecting"}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus === "connecting" ? "animate-spin" : ""}`} />
                <span>اختبار الاتصال بالماسح (Ping)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-right">
              {/* IP Address */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  عنوان IP الخاص بالماسح:
                </label>
                <input
                  type="text"
                  value={scannerIp}
                  onChange={(e) => setScannerIp(e.target.value)}
                  placeholder="192.168.1.150"
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 text-center"
                  dir="ltr"
                />
              </div>

              {/* Port */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  المنفذ (Port):
                </label>
                <input
                  type="text"
                  value={scannerPort}
                  onChange={(e) => setScannerPort(e.target.value)}
                  placeholder="8080"
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 text-center"
                  dir="ltr"
                />
              </div>

              {/* Protocol */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  بروتوكول المسح الشبكي:
                </label>
                <select
                  value={protocol}
                  onChange={(e: any) => setProtocol(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="escl">eSCL (AirScan / Apple / Android / Mopria)</option>
                  <option value="wsd">WSD (Web Services for Devices - Windows)</option>
                  <option value="twain_ip">TWAIN over IP / Network Direct</option>
                  <option value="http_rest">Lexmark / HP REST API Gateway</option>
                </select>
              </div>

              {/* Scanner Device Model */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  طراز الماسح المكتشف:
                </label>
                <input
                  type="text"
                  value={scannerModel}
                  onChange={(e) => setScannerModel(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 truncate"
                />
              </div>
            </div>
          </div>

          {/* 2. Scanning Options Bar (Source, DPI, Color, Duplex) */}
          <div className="p-4 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-500" />
                <span>خيارات المسح الضوئي المتعدد:</span>
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                جاهز للمسح المتتالي عبر وحدة التغذية التلقائية (ADF)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
              {/* Feeder Source */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  مصدر المسح:
                </label>
                <select
                  value={sourceMode}
                  onChange={(e: any) => setSourceMode(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="adf_multipage">وحدة السحب التلقائي (ADF متعدد الصفحات)</option>
                  <option value="flatbed">السطح الزجاجي المسطح (Flatbed صفحة مفردة)</option>
                </select>
              </div>

              {/* Number of Pages */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  عدد الصفحات المتتالية:
                </label>
                <div className="flex items-center gap-1">
                  {[1, 3, 5, 10].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      disabled={sourceMode === "flatbed"}
                      onClick={() => setScanPageCount(cnt)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        scanPageCount === cnt && sourceMode !== "flatbed"
                          ? "bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs"
                          : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution DPI */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  دقة الوضوح (DPI):
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value={150}>150 DPI (سريع - حجم خفيف)</option>
                  <option value={300}>300 DPI (قياسي قضائي معتمد)</option>
                  <option value={600}>600 DPI (فائق الدقة للأختام والبصمات)</option>
                </select>
              </div>

              {/* Color Mode */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  نمط الألوان:
                </label>
                <select
                  value={colorMode}
                  onChange={(e: any) => setColorMode(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="bw_legal">أبيض وأسود قضائي (B&W)</option>
                  <option value="grayscale">تدرج رمادي (Grayscale)</option>
                  <option value="color">ألوان كاملة (Full Color)</option>
                </select>
              </div>
            </div>

            {/* Scan Trigger Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700/60">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>جاهز للسحب من درج الماسح الشبكي: {scannerIp}</span>
              </div>

              <button
                type="button"
                onClick={handleStartScan}
                disabled={isScanning}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري سحب ومسح الصفحات... ({scanProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    <span>بدء المسح الضوئي للمستندات ({sourceMode === "flatbed" ? "صفحة واحدة" : `${scanPageCount} صفحات`})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. Scanned Pages Carousel & Gallery */}
          {scannedPages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                    الصفحات الممسوحة ضوئياً ({scannedPages.length} صفحة):
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setScannedPages([])}
                  className="text-xs text-red-500 hover:text-red-700 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح كافة الصفحات</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {scannedPages.map((page) => (
                  <div
                    key={page.id}
                    className="group bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    {/* Thumbnail Image Container */}
                    <div 
                      className="relative h-44 bg-white dark:bg-slate-900 flex items-center justify-center p-2 cursor-pointer overflow-hidden"
                      onClick={() => setSelectedPageForPreview(page)}
                    >
                      <img
                        src={page.dataUrl}
                        alt={`صفحة ${page.pageNumber}`}
                        className="max-h-full max-w-full object-contain transition-transform duration-200"
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-black font-mono">
                        ص {page.pageNumber}
                      </span>
                    </div>

                    {/* Page Actions Strip */}
                    <div className="p-2 bg-slate-100 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => handleRotatePage(page.id)}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer"
                        title="تدوير 90 درجة"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPageForPreview(page)}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer"
                        title="معاينة الصفحة كاملة"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePage(page.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950 text-red-500 rounded-lg transition cursor-pointer"
                        title="حذف الصفحة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Target Destination & Direct Section Upload Box */}
          <div className="p-4 bg-gradient-to-br from-amber-500/5 via-slate-50 to-slate-100 dark:from-amber-500/10 dark:via-slate-850 dark:to-slate-900 rounded-2xl border-2 border-amber-500/30 space-y-4">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                تحديد الوجهة المباشرة لرفع وحفظ الصفحات الممسوحة في أقسام البرنامج:
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-right">
              {/* Destination Section */}
              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                  القسم المستهدف للرفع:
                </label>
                <select
                  value={targetSection}
                  onChange={(e: any) => setTargetSection(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-slate-100"
                >
                  <option value="attachments">الأرشيف الإلكتروني وإدارة المرفقات العامة</option>
                  <option value="cases">ملف قضية محددة (ربط مباشر برقم القضية)</option>
                  <option value="clients">ملف موكل محدد (خزانة وثائق الموكل)</option>
                  <option value="advanced_editor">صياغة المذكرات والعقود (إدراج في المحرر)</option>
                  <option value="police_reports">سجل المحاضر والشكاوى القضائية</option>
                </select>
              </div>

              {/* Linked Case (if applicable) */}
              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                  ربط بقضية محددة:
                </label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- اختياري: غير مرتبط بقضية معينة --</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      قضية رقم {c.caseNumber} لسنة {c.caseYear} - {c.clientName} ({c.competentCourt})
                    </option>
                  ))}
                </select>
              </div>

              {/* Linked Client (if applicable) */}
              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                  ربط بالموكل:
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- اختياري: غير مرتبط بموكل محدد --</option>
                  {clients.map(cl => (
                    <option key={cl.id} value={cl.id}>
                      {cl.name} (رقم قومي: {cl.nationalId || "غير مسجل"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
              {/* Document Title */}
              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                  عنوان المستند الممسوح:
                </label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="مثال: حافظة مستندات جلسة 2026/06/20 أو صحيفة دعوى"
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Document Category */}
              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                  تصنيف الوثيقة:
                </label>
                <select
                  value={documentCategory}
                  onChange={(e: any) => setDocumentCategory(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="claim_statement">صحف دعاوى وإنذارات رسمية</option>
                  <option value="power_of_attorney">توكيل رسمي قضايا / توثيق</option>
                  <option value="judgment">حكم قضائي صادر أو منطوق</option>
                  <option value="expert_report">تقرير خبراء وزارة العدل</option>
                  <option value="defense_memo">مذكرة دفاع وطعون</option>
                  <option value="contract">عقد اتفاق أو شراكة</option>
                  <option value="national_id">بطاقة رقم قومي أو إثبات هوية</option>
                  <option value="receipt">إيصال أمانة أو سند مالي</option>
                </select>
              </div>
            </div>

            {/* Success Message Banner */}
            {savedSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{savedSuccessMsg}</span>
              </div>
            )}
          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-bold">
            عدد الصفحات المستعدة للرفع: <span className="font-mono text-amber-600 dark:text-amber-400 font-black">{scannedPages.length}</span> صفحة
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-300 transition"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSaveToDestination}
              disabled={scannedPages.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>حفظ ورفع الصفحات إلى [{targetSection}]</span>
            </button>
          </div>
        </div>

      </div>

      {/* Large Full Preview Modal for Single Page */}
      {selectedPageForPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <span className="text-xs font-black">
                معاينة الصفحة {selectedPageForPreview.pageNumber} من المسح الضوئي
              </span>
              <button
                onClick={() => setSelectedPageForPreview(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
              <img
                src={selectedPageForPreview.dataUrl}
                alt={`صفحة ${selectedPageForPreview.pageNumber}`}
                className="max-h-[70vh] object-contain shadow-lg rounded-lg"
                style={{ transform: `rotate(${selectedPageForPreview.rotation}deg)` }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
