import React, { useState } from "react";
import { PlatformUser, CaseRecord } from "../types";
import {
  Printer,
  Scan,
  Cpu,
  Wifi,
  Usb,
  Settings2,
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  RotateCw,
  Copy,
  Download,
  Flame,
  ShieldAlert,
  Gauge
} from "lucide-react";

interface LexmarkDeviceStudioProps {
  currentUser: PlatformUser;
  cases: CaseRecord[];
  onScanComplete?: (scannedDoc: { title: string; imageBase64: string; ocrText: string; caseId?: string }) => void;
  language: "ar" | "en";
}

export default function LexmarkDeviceStudio({
  currentUser,
  cases,
  onScanComplete,
  language = "ar"
}: LexmarkDeviceStudioProps) {
  const [activeTab, setActiveTab] = useState<"scanner" | "printer" | "diagnostics">("scanner");

  // Device connection settings
  const [deviceIp, setDeviceIp] = useState("192.168.1.150");
  const [connectionType, setConnectionType] = useState<"network" | "usb">("network");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "offline">("connected");

  // Scanner settings for Lexmark X654de
  const [scanSource, setScanSource] = useState<"adf_duplex" | "adf_simplex" | "flatbed">("adf_duplex");
  const [scanResolution, setScanResolution] = useState<number>(300);
  const [scanColorMode, setScanColorMode] = useState<"bw_legal" | "grayscale" | "color">("bw_legal");
  const [scanPaperSize, setScanPaperSize] = useState<"A4" | "Legal" | "Letter">("Legal");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedPreview, setScannedPreview] = useState<string | null>(null);
  const [extractedOcrText, setExtractedOcrText] = useState<string>("");

  // Printer settings for Lexmark X654de
  const [printDuplex, setPrintDuplex] = useState<"duplex_long" | "duplex_short" | "simplex">("duplex_long");
  const [printTray, setPrintTray] = useState<"tray1_a4" | "tray2_legal" | "multipurpose">("tray2_legal");
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [applyEagleSeal, setApplyEagleSeal] = useState<boolean>(true);
  const [applyOfficeWatermark, setApplyOfficeWatermark] = useState<boolean>(true);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  // Consumables status (Lexmark X654de telemetry)
  const [tonerLevel, setTonerLevel] = useState(84); // %
  const [drumLevel, setDrumLevel] = useState(72); // %
  const [tray1Paper, setTray1Paper] = useState(90); // %
  const [tray2Paper, setTray2Paper] = useState(65); // %
  const [fuserTemp, setFuserTemp] = useState("195°C (جاهز)");

  const handleTestConnection = () => {
    setConnectionStatus("connecting");
    setTimeout(() => {
      setConnectionStatus("connected");
    }, 800);
  };

  const handleExecuteScan = () => {
    setIsScanning(true);
    setScanProgress(10);
    setScannedPreview(null);
    setExtractedOcrText("");

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          finishScan();
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  const finishScan = () => {
    setTimeout(() => {
      setIsScanning(false);
      // High-resolution legal document canvas mock
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header border
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 4;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 32px Tahoma, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("جمهورية مصر العربية - وزارة العدل", canvas.width / 2, 110);
        ctx.fillText("محكمة الزقازيق الابتدائية / مأمورية ههيا", canvas.width / 2, 160);

        ctx.font = "24px Tahoma, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(`رول جلسة قضائية - فحص ضوئي Lexmark X654de (${scanResolution} DPI)`, canvas.width - 80, 240);
        ctx.fillText(`تاريخ الفحص: ${new Date().toLocaleDateString("ar-EG")}`, canvas.width - 80, 280);

        // Mock legal document lines
        ctx.font = "20px Tahoma, sans-serif";
        const lines = [
          "بناءً على طلب الأستاذ / المحامي - المحامي المقيد بالنقض والدستورية العليا",
          "في الدعوى رقم 4582 لسنة 2026 جنح مستأنف الزقازيق",
          "الموضوع: مذكرة دفاع في جنحة إيصال أمانة / طعن بالتزوير صلباً وتوقيعاً",
          "وقائع الدعوى: حيث أقام الخصم دعواه الماثلة بموجب سند مجحود...",
          "الدفوع القانونية الجوهرية:",
          "1. الدفع بانتفاء ركن التسليم المكون للجريمة المنصوص عليها بالمادة 341 عقوبات.",
          "2. الدفع ببطلان استكتاب الخصم لعدم مطابقة الشروط الفنية المقررة بالطب الشرعي.",
          "3. التمسك بإحالة الأوراق لمضاهاة الخطوط وقسم أبحاث التزييف والتزوير.",
          "بناءً عليه: نلتمس أصلياً البراءة ورفض الدعوى المدنية وإلزام رافعها بالمصاريف."
        ];

        let yPos = 360;
        lines.forEach((line) => {
          ctx.fillText(line, canvas.width - 80, yPos);
          yPos += 55;
        });

        // Watermark Seal
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 1250, 90, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#b45309";
        ctx.font = "bold 20px Tahoma, sans-serif";
        ctx.fillText("مكتب الأستاذ المحامي", canvas.width / 2, 1240);
        ctx.fillText("محامٍ بالنقض", canvas.width / 2, 1275);
      }

      const base64 = canvas.toDataURL("image/jpeg", 0.9);
      setScannedPreview(base64);

      const generatedOcr = `جمهورية مصر العربية - وزارة العدل
محكمة الزقازيق الابتدائية / مأمورية ههيا
رول ومذكرة قضائية مفحوصة عبر Lexmark X654de
الدعوى: 4582 لسنة 2026 جنح
الأستاذ المحامي - المحامي بالنقض
الدفوع:
1. انتفاء ركن التسليم بالمادة 341 عقوبات.
2. بطلان الاستكتاب ومضاهاة الخطوط.
الطلبات: البراءة ورفض الدعوى المدنية.`;

      setExtractedOcrText(generatedOcr);

      if (onScanComplete) {
        onScanComplete({
          title: `مسح ضوئي Lexmark X654de - ${new Date().toLocaleTimeString("ar-EG")}`,
          imageBase64: base64,
          ocrText: generatedOcr,
          caseId: selectedCaseId || undefined
        });
      }
    }, 400);
  };

  const handleExecutePrint = () => {
    setIsPrinting(true);
    setPrintFeedback(null);
    setTimeout(() => {
      setIsPrinting(false);
      setPrintFeedback(`تم إرسال أمر الطباعة (${printCopies} نسخة) بنجاح إلى Lexmark X654de عبر درج ${printPaperSizeName(printTray)} مع تفعيل الطباعة المزدوجة والأختام الرسمية.`);
      window.print();
    }, 700);
  };

  const printPaperSizeName = (tray: string) => {
    switch (tray) {
      case "tray1_a4":
        return "الدرج 1 (A4 قياسي)";
      case "tray2_legal":
        return "الدرج 2 (Legal 8.5x14 مخصص للصحف القضائية)";
      default:
        return "الدرج اليدوي متعدد الأغراض";
    }
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* Device Header & Hardware Telemetry status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-6 rounded-3xl border border-amber-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 inline-flex">
              <Printer className="w-6 h-6" />
            </span>
            <span className="text-xs font-black text-amber-300 bg-black/40 px-3 py-1 rounded-full uppercase tracking-wider">
              Lexmark X654de Enterprise Series
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
              connectionStatus === "connected" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-red-500/20 text-red-300"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === "connected" ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
              {connectionStatus === "connected" ? "متصل بالشبكة المحلية" : "جارٍ الاتصال..."}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black">مركز التحكم بالماسح الضوئي والطابعة الليزرية Lexmark X654de</h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            إدارة متطورة للمسح الضوئي المزدوج السريع (55 صفحة/دقيقة)، طباعة المذكرات والحوافظ على ورق Legal وA4 مع الأختام المائية.
          </p>
        </div>

        {/* Telemetry quick gauges */}
        <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/10">
          <div className="text-center px-2">
            <p className="text-[10px] text-slate-400 font-bold">الحبر (Toner)</p>
            <p className="text-sm font-black text-amber-400">{tonerLevel}%</p>
            <div className="w-12 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${tonerLevel}%` }} />
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center px-2">
            <p className="text-[10px] text-slate-400 font-bold">الدرام (Drum)</p>
            <p className="text-sm font-black text-emerald-400">{drumLevel}%</p>
            <div className="w-12 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${drumLevel}%` }} />
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center px-2">
            <p className="text-[10px] text-slate-400 font-bold">درج Legal</p>
            <p className="text-sm font-black text-blue-400">{tray2Paper}%</p>
            <div className="w-12 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${tray2Paper}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-1.5 gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab("scanner")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "scanner"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Scan className="w-4 h-4" />
          <span>الماسحة الضوئية المتطورة (Lexmark Scanner ADF/Duplex)</span>
        </button>

        <button
          onClick={() => setActiveTab("printer")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "printer"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>الطابعة الليزرية فائقة السرعة (Lexmark Laser Controls)</span>
        </button>

        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "diagnostics"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>حالة العتاد والصيانة والشبكة (IP / Diagnostic)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. LEXMARK SCANNER STUDIO                                */}
      {/* ======================================================== */}
      {activeTab === "scanner" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Scan className="w-4 h-4 text-amber-500" />
              <span>إعدادات الفحص الضوئي وسحب الأوراق</span>
            </h3>

            {/* Source */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">مصدر التغذية:</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScanSource("adf_duplex")}
                  className={`p-2.5 rounded-xl border font-bold text-center transition cursor-pointer ${
                    scanSource === "adf_duplex"
                      ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-slate-750 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  تلقائي وجهين (Duplex ADF)
                </button>
                <button
                  type="button"
                  onClick={() => setScanSource("adf_simplex")}
                  className={`p-2.5 rounded-xl border font-bold text-center transition cursor-pointer ${
                    scanSource === "adf_simplex"
                      ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-slate-750 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  تلقائي وجه واحد (ADF)
                </button>
                <button
                  type="button"
                  onClick={() => setScanSource("flatbed")}
                  className={`p-2.5 rounded-xl border font-bold text-center transition cursor-pointer ${
                    scanSource === "flatbed"
                      ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-slate-750 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  السطح الزجاجي (Flatbed)
                </button>
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">دقة الوضوح (Resolution):</label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[150, 300, 600, 1200].map((dpi) => (
                  <button
                    key={dpi}
                    type="button"
                    onClick={() => setScanResolution(dpi)}
                    className={`py-2 rounded-xl border font-black text-center transition cursor-pointer ${
                      scanResolution === dpi
                        ? "bg-amber-500 text-slate-900 border-amber-500"
                        : "border-slate-200 dark:border-slate-750 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {dpi} DPI
                  </button>
                ))}
              </div>
            </div>

            {/* Color mode & Paper */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">نمط المعالجة:</label>
                <select
                  value={scanColorMode}
                  onChange={(e: any) => setScanColorMode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl p-2.5 outline-none text-right"
                >
                  <option value="bw_legal">أبيض وأسود عالي التباين (Legal Doc)</option>
                  <option value="grayscale">تدرج رمادي (Grayscale)</option>
                  <option value="color">ألوان طبيعية (Full Color 24-bit)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">حجم الورقة:</label>
                <select
                  value={scanPaperSize}
                  onChange={(e: any) => setScanPaperSize(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl p-2.5 outline-none text-right"
                >
                  <option value="Legal">Legal (8.5 × 14 بوصة - صحف ومحاضر)</option>
                  <option value="A4">A4 (210 × 297 مم)</option>
                  <option value="Letter">Letter (8.5 × 11 بوصة)</option>
                </select>
              </div>
            </div>

            {/* Link to Case */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">ربط المستند المفحوص بملف قضية:</label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl p-2.5 outline-none text-right"
              >
                <option value="">-- حفظ كوثيقة عامة مستقلة --</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    قضية {c.caseNumber} لسنة {c.caseYear} - {c.clientName}
                  </option>
                ))}
              </select>
            </div>

            {/* Scan Action Button */}
            <button
              onClick={handleExecuteScan}
              disabled={isScanning}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              <Scan className={`w-5 h-5 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? `جارٍ الفحص والسحب الضوئي (${scanProgress}%)...` : "بدء الفحص الضوئي المباشر من Lexmark"}</span>
            </button>

            {isScanning && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
              </div>
            )}
          </div>

          {/* Result & OCR Preview */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>المعاينة المباشرة والاستخراج الذكي للنصوص (OCR)</span>
              </span>
              {scannedPreview && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                  جاهز ومحفوظ بالملف
                </span>
              )}
            </h3>

            {scannedPreview ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">صورة المسح الضوئي (High Resolution):</p>
                  <div className="border border-slate-200 dark:border-slate-750 rounded-2xl overflow-hidden shadow-inner bg-slate-100 max-h-[380px] overflow-y-auto">
                    <img src={scannedPreview} alt="Scanned Document" className="w-full h-auto object-contain" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">النصوص المستخرجة آلياً (OCR Extraction):</p>
                  <textarea
                    value={extractedOcrText}
                    onChange={(e) => setExtractedOcrText(e.target.value)}
                    rows={15}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-right leading-relaxed outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-3 text-slate-400">
                <Scan className="w-16 h-16 text-slate-300 stroke-1" />
                <div>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">لا توجد وثيقة مفحوصة حالياً</p>
                  <p className="text-xs text-slate-400 mt-1">اضغط على زر "بدء الفحص الضوئي" لسحب المستندات عبر وحدة التغذية الآلية (ADF).</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. LEXMARK PRINTER CONTROLS                              */}
      {/* ======================================================== */}
      {activeTab === "printer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Printer className="w-4 h-4 text-amber-500" />
              <span>إعدادات وخيارات الطباعة الليزرية المتقدمة</span>
            </h3>

            {/* Duplex */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">الطباعة على الوجهين (Duplex):</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPrintDuplex("duplex_long")}
                  className={`p-2.5 rounded-xl border font-bold text-center transition cursor-pointer ${
                    printDuplex === "duplex_long"
                      ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-slate-750 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  وجهين - حافة طويلة (كتاب)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintDuplex("duplex_short")}
                  className={`p-2.5 rounded-xl border font-bold text-center transition cursor-pointer ${
                    printDuplex === "duplex_short"
                      ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-slate-750 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  وجهين - حافة قصيرة (تقويم)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintDuplex("simplex")}
                  className={`p-2.5 rounded-xl border font-bold text-center transition cursor-pointer ${
                    printDuplex === "simplex"
                      ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-slate-750 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  وجه واحد فقط (Simplex)
                </button>
              </div>
            </div>

            {/* Tray Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">درج التغذية الورقي (Paper Tray):</label>
              <div className="space-y-2 text-xs">
                <div
                  onClick={() => setPrintTray("tray2_legal")}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    printTray === "tray2_legal"
                      ? "bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-slate-900 dark:text-white"
                      : "border-slate-200 dark:border-slate-750 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <span className="font-bold block">الدرج 2: ورق Legal (8.5 × 14 بوصة)</span>
                    <span className="text-[11px] text-slate-400">مخصص لصحف الدعاوى القضائية وحوافظ المستندات الرسمية</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-600">650 ورقة</span>
                </div>

                <div
                  onClick={() => setPrintTray("tray1_a4")}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    printTray === "tray1_a4"
                      ? "bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-slate-900 dark:text-white"
                      : "border-slate-200 dark:border-slate-750 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <span className="font-bold block">الدرج 1: ورق A4 القياسي</span>
                    <span className="text-[11px] text-slate-400">مخصص للمذكرات الداخلية والفواتير ومحاضر الجلسات</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600">250 ورقة</span>
                </div>
              </div>
            </div>

            {/* Official Seals and Watermark */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">العلامات المائية والأختام التوثيقية:</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyEagleSeal}
                    onChange={(e) => setApplyEagleSeal(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>إدراج شعار النسر والجمهورية</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyOfficeWatermark}
                    onChange={(e) => setApplyOfficeWatermark(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>إدراج خاتم مكتب الأستاذ المحامي</span>
                </label>
              </div>
            </div>

            {/* Print Action */}
            <button
              onClick={handleExecutePrint}
              disabled={isPrinting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              <Printer className="w-5 h-5" />
              <span>{isPrinting ? "جارٍ معالجة وبث أمر الطباعة..." : "إرسال للطباعة الفورية على Lexmark X654de"}</span>
            </button>

            {printFeedback && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {printFeedback}
              </div>
            )}
          </div>

          {/* Print Specification & Layout Card */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>مواصفات الطباعة الصادرة عن مكتب الأستاذ وسام</span>
            </h3>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 text-xs space-y-3 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold">الموديل:</span>
                <span className="font-mono font-bold text-amber-600">Lexmark X654de Laser Multi-Function</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold">السرعة القصوى:</span>
                <span className="font-mono">55 صفحة في الدقيقة (ppm)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold">دقة الليزر:</span>
                <span className="font-mono">1200 × 1200 DPI حقيقي</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold">نوع الحبر:</span>
                <span className="font-mono">High Yield Toner (X651H21A - 25,000 صفحة)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-bold">حالة بروتوكول الشبكة:</span>
                <span className="font-mono text-emerald-600 font-bold">IPDS / PostScript 3 / PCL 6 Active</span>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              💡 <strong>تنبيه قضائي:</strong> صحف الدعاوى المطبوعة عبر درج Legal تتوافق تلقائياً مع معايير أقلام المحضرين ومحاكم الاستئناف والجهات القضائية بمصر مع مساحات التعلية ودمغة المحاماة المقررة.
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. HARDWARE DIAGNOSTICS & NETWORK                        */}
      {/* ======================================================== */}
      {activeTab === "diagnostics" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-500" />
              <span>لوحة مراقبة عتاد الطابعة والشبكة (Embedded Web Server)</span>
            </h3>
            <button
              onClick={handleTestConnection}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              فحص الاتصال الشبكي
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 space-y-2">
              <span className="text-[11px] font-bold text-slate-500">عنوان الآي بي المكتبي (IP Address):</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deviceIp}
                  onChange={(e) => setDeviceIp(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-1.5 font-mono text-left outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 space-y-1">
              <span className="text-[11px] font-bold text-slate-500">درجة حرارة وحدة التثبيت (Fuser):</span>
              <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{fuserTemp}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 space-y-1">
              <span className="text-[11px] font-bold text-slate-500">إجمالي الصفحات المطبوعة تراكمياً:</span>
              <p className="text-sm font-black text-amber-600 font-mono">142,850 صفحة قضائية</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
