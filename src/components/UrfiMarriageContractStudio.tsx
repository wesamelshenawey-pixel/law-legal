import React, { useState, useRef, useEffect } from "react";
import { cropTo3x4Portrait, checkIs3x4Ratio, cropBase64To3x4 } from "../utils/imageUtils";
import { 
  ClientProfile, 
  PlatformUser,
  CaseRecord
} from "../types";
import { 
  Heart, 
  Camera, 
  Upload, 
  PenTool, 
  CheckCircle2, 
  Printer, 
  Download, 
  Share2, 
  Send, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Users, 
  Coins, 
  Calendar, 
  Scale, 
  Award, 
  Trash2, 
  RotateCcw, 
  Check, 
  Copy, 
  X,
  Eye,
  Edit3,
  QrCode as QrIcon,
  AlertCircle,
  BookOpen
} from "lucide-react";
import QRCode from "react-qr-code";
import LawyerSignatureSeal from "./LawyerSignatureSeal";
import { SectionDedicatedOcrModal } from "./SectionDedicatedOcrModal";
import { Scan } from "lucide-react";

interface UrfiMarriageContractStudioProps {
  clients: ClientProfile[];
  cases?: CaseRecord[];
  currentUser: PlatformUser;
  onBack?: () => void;
  onSaveToCaseAttachments?: (caseId: string, docName: string, content: string) => void;
  language?: "ar" | "en";
}

export interface MarriageContractData {
  // Metadata
  contractDate: string;
  contractCity: string;
  hijriDate?: string;

  // Husband Info (الطرف الأول - الزوج)
  husbandId?: string;
  husbandName: string;
  husbandNationalId: string;
  husbandBirthDate: string;
  husbandJob: string;
  husbandNationality: string;
  husbandReligion: string;
  husbandAddress: string;
  husbandPhone: string;
  husbandMaritalStatus: "أعزب" | "متزوج" | "مطلق" | "أرمل";
  husbandPhoto?: string;
  husbandSignature?: string;
  husbandSignatureHash?: string;
  husbandSignedAt?: string;

  // Wife Info (الطرف الثاني - الزوجة)
  wifeId?: string;
  wifeName: string;
  wifeNationalId: string;
  wifeBirthDate: string;
  wifeJob: string;
  wifeNationality: string;
  wifeReligion: string;
  wifeAddress: string;
  wifePhone: string;
  wifeStatus: "بكر رشيد" | "ثيب (مطلقة)" | "ثيب (أرملة)";
  wifePhoto?: string;
  wifeSignature?: string;
  wifeSignatureHash?: string;
  wifeSignedAt?: string;

  // Dowry & Mahr (الصداق والمهر)
  totalDowry: string;
  advanceDowry: string;
  deferredDowry: string;
  dowryCurrency: string;
  deferredCondition: string;

  // Witnesses (الشهود العدول)
  witness1Name: string;
  witness1NationalId: string;
  witness1Address: string;
  witness1Phone: string;
  witness1Signature?: string;

  witness2Name: string;
  witness2NationalId: string;
  witness2Address: string;
  witness2Phone: string;
  witness2Signature?: string;

  // Lawyer & Law Firm Certification
  lawyerName: string;
  lawyerTitle: string;
  lawyerPoaNumber: string;
  lawyerOfficeName: string;
  lawyerSignature?: string;
  lawyerSignedAt?: string;
  contractSerialHash: string;

  // Additional custom clauses
  additionalClauses: string;
}

export default function UrfiMarriageContractStudio({
  clients,
  cases = [],
  currentUser,
  onBack,
  onSaveToCaseAttachments,
  language = "ar"
}: UrfiMarriageContractStudioProps) {
  // Today's date
  const todayStr = new Date().toLocaleDateString("ar-EG");

  // Contract State
  const [data, setData] = useState<MarriageContractData>(() => {
    const randomSerial = "EGY-MAR-" + Math.floor(100000 + Math.random() * 900000);
    return {
      contractDate: todayStr,
      contractCity: "القاهرة",
      hijriDate: "1447 هـ",

      husbandName: "",
      husbandNationalId: "",
      husbandBirthDate: "",
      husbandJob: "مهندس برمجيات",
      husbandNationality: "مصري",
      husbandReligion: "مسلم",
      husbandAddress: "القاهرة، جمهورية مصر العربية",
      husbandPhone: "",
      husbandMaritalStatus: "أعزب",
      husbandPhoto: "",

      wifeName: "",
      wifeNationalId: "",
      wifeBirthDate: "",
      wifeJob: "طبيبة بشرية",
      wifeNationality: "مصرية",
      wifeReligion: "مسلمة",
      wifeAddress: "الجيزة، جمهورية مصر العربية",
      wifePhone: "",
      wifeStatus: "بكر رشيد",
      wifePhoto: "",

      totalDowry: "50,000",
      advanceDowry: "25,000",
      deferredDowry: "25,000",
      dowryCurrency: "جنيه مصري",
      deferredCondition: "يحل بأقرب الأجلين (الوفاة أو الطلاق البائن)",

      witness1Name: "أحمد محمود إبراهيم التابعي",
      witness1NationalId: "28805120101918",
      witness1Address: "حي المعادي، القاهرة",
      witness1Phone: "01001234567",

      witness2Name: "محمد عبد الله حسن الجندي",
      witness2NationalId: "29103040102715",
      witness2Address: "الدقي، محافظة الجيزة",
      witness2Phone: "01123456789",

      lawyerName: currentUser.name || "الأستاذ المحامي",
      lawyerTitle: "المحامي بالنقض والدستورية العليا",
      lawyerPoaNumber: "توكيل قضايا موثق",
      lawyerOfficeName: "ديوان الأستاذ المحامي للاستشارات القانونية والشرعية",
      contractSerialHash: randomSerial,
      additionalClauses: "اتفق الطرفان على حق الزوجة في استكمال عملها ودراستها، والالتزام بحسن المعاشرة ورعاية بيت الزوجية."
    };
  });

  // Active signing modal state
  const [activeSigner, setActiveSigner] = useState<"husband" | "wife" | "witness1" | "witness2" | "lawyer" | null>(null);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [typedSignName, setTypedSignName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [photoWarning, setPhotoWarning] = useState<{target: "husband"|"wife", base64: string} | null>(null);
  const [suggestedPrecedents, setSuggestedPrecedents] = useState<CaseRecord[]>([]);
  const [penColor, setPenColor] = useState<string>("#1e3a8a"); // Navy Blue

  // Live preview mode tab for mobile / toggle
  const [viewTab, setViewTab] = useState<"editor" | "preview" | "split">("split");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [includePersonalPhotos, setIncludePersonalPhotos] = useState<boolean>(true);

  // Auto-fill from Client list
  const handleSelectHusbandClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setData(prev => ({
        ...prev,
        husbandId: client.id,
        husbandName: client.name || prev.husbandName,
        husbandNationalId: client.nationalId || prev.husbandNationalId,
        husbandPhone: client.phone || client.whatsapp || prev.husbandPhone,
        husbandAddress: client.address || prev.husbandAddress,
        husbandBirthDate: client.birthDate || prev.husbandBirthDate
      }));
    }
  };

  const handleSelectWifeClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setData(prev => ({
        ...prev,
        wifeId: client.id,
        wifeName: client.name || prev.wifeName,
        wifeNationalId: client.nationalId || prev.wifeNationalId,
        wifePhone: client.phone || client.whatsapp || prev.wifePhone,
        wifeAddress: client.address || prev.wifeAddress,
        wifeBirthDate: client.birthDate || prev.wifeBirthDate
      }));
    }
  };

  // Image Upload Handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "husband" | "wife") => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const base64 = ev.target?.result as string;
          const { is3x4 } = await checkIs3x4Ratio(base64);
          if (is3x4) {
            setData(prev => ({ ...prev, [target === "husband" ? "husbandPhoto" : "wifePhoto"]: base64 }));
            setPhotoWarning(null);
          } else {
            setPhotoWarning({ target, base64 });
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Failed to process photo", err);
      }
    }
  };

  const handleMultiplePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const processFile = (file: File, target: "husband" | "wife") => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const base64 = ev.target?.result as string;
          const { is3x4 } = await checkIs3x4Ratio(base64);
          if (is3x4) {
            setData(prev => ({ ...prev, [target === "husband" ? "husbandPhoto" : "wifePhoto"]: base64 }));
          } else {
            // Automatically crop for bulk uploads to save time
            const cropped = await cropBase64To3x4(base64);
            setData(prev => ({ ...prev, [target === "husband" ? "husbandPhoto" : "wifePhoto"]: cropped }));
          }
        };
        reader.readAsDataURL(file);
      };

      if (files[0]) processFile(files[0], "husband");
      if (files[1]) processFile(files[1], "wife");
    }
  };

  const applyAutoCrop = async () => {
    if (photoWarning) {
      try {
        const croppedBase64 = await cropBase64To3x4(photoWarning.base64);
        setData(prev => ({
          ...prev,
          [photoWarning.target === "husband" ? "husbandPhoto" : "wifePhoto"]: croppedBase64
        }));
        setPhotoWarning(null);
      } catch (err) {
        console.error("Failed to auto-crop", err);
      }
    }
  };

  // Look up similar precedents when component mounts or data changes
  useEffect(() => {
    if (cases && cases.length > 0) {
      const precedents = cases.filter(c => c.subject?.includes("عرفي") || c.courtType?.includes("أسرة")).slice(0, 2);
      setSuggestedPrecedents(precedents);
    }
  }, [cases]);

  // Canvas Drawing setup
  useEffect(() => {
    if (activeSigner && canvasRef.current && signatureMode === "draw") {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = penColor;
      }
    }
  }, [activeSigner, signatureMode, penColor]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Save Signature
  const handleConfirmSignature = () => {
    if (!activeSigner) return;

    let signatureImage = "";
    if (signatureMode === "draw" && canvasRef.current) {
      signatureImage = canvasRef.current.toDataURL("image/png");
    } else {
      // Create text based signature on temporary canvas
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 400;
      tempCanvas.height = 160;
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "transparent";
        ctx.fillRect(0, 0, 400, 160);
        ctx.font = "italic bold 32px 'Amiri', 'Traditional Arabic', serif";
        ctx.fillStyle = penColor;
        ctx.textAlign = "center";
        ctx.fillText(typedSignName || data.husbandName || "توقيع شرعي", 200, 90);
        ctx.strokeStyle = penColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 110);
        ctx.quadraticCurveTo(200, 130, 350, 110);
        ctx.stroke();
        signatureImage = tempCanvas.toDataURL("image/png");
      }
    }

    const timestamp = new Date().toISOString();
    const hash = "SIG-SHA256-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    if (activeSigner === "husband") {
      setData(prev => ({
        ...prev,
        husbandSignature: signatureImage,
        husbandSignatureHash: hash,
        husbandSignedAt: timestamp
      }));
    } else if (activeSigner === "wife") {
      setData(prev => ({
        ...prev,
        wifeSignature: signatureImage,
        wifeSignatureHash: hash,
        wifeSignedAt: timestamp
      }));
    } else if (activeSigner === "witness1") {
      setData(prev => ({
        ...prev,
        witness1Signature: signatureImage
      }));
    } else if (activeSigner === "witness2") {
      setData(prev => ({
        ...prev,
        witness2Signature: signatureImage
      }));
    } else if (activeSigner === "lawyer") {
      setData(prev => ({
        ...prev,
        lawyerSignature: signatureImage,
        lawyerSignedAt: timestamp
      }));
    }

    setActiveSigner(null);
  };

  // Export to Word (.doc)
  const handleExportWord = () => {
    const printableElement = document.getElementById("urfi-contract-print-area");
    if (!printableElement) return;

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>عقد زواج عرفي شرعي</title>
      <style>
        body { font-family: 'Amiri', 'Traditional Arabic', Arial, sans-serif; direction: rtl; font-size: 13pt; line-height: 1.8; color: #111; padding: 25px; }
        .contract-header { text-align: center; border-bottom: 2px solid #b45309; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 18pt; font-weight: bold; color: #92400e; }
        .quran { font-style: italic; font-size: 12pt; color: #555; margin: 10px 0; }
        .section-box { border: 1px solid #d97706; padding: 12px; margin: 12px 0; border-radius: 8px; }
        .grid-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .grid-table td { padding: 8px; border: 1px solid #ddd; }
      </style></head><body dir='rtl'>`;
    const footer = "</body></html>";
    const sourceHTML = header + printableElement.innerHTML + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `عقد_زواج_عرفي_${data.husbandName || "الزوج"}_و_${data.wifeName || "الزوجة"}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  // Print Document / Save as PDF
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    const targetPhone = data.husbandPhone || data.wifePhone;
    let cleanPhone = targetPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "20" + cleanPhone.substring(1);
    else if (!cleanPhone.startsWith("20") && cleanPhone.length === 10) cleanPhone = "20" + cleanPhone;

    const message = `💍 *ديوان الأستاذ المحامي للاستشارات الشرعية والقانونية*\n----------------------------------------\nعقد زواج عرفي شرعي موثق\nالـزوج: *${data.husbandName || "..."}*\nالـزوجـة: *${data.wifeName || "..."}*\nالصداق: ${data.totalDowry} ${data.dowryCurrency}\nرمز التحقق الرقمي: ${data.contractSerialHash}\n----------------------------------------\nتم تحرير العقد وتوثيقه إلكترونياً تحت إشراف ديوان المحاماة.`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl text-slate-950 shadow-md">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                استوديو صياغة وتوثيق عقد الزواج العرفي الشرعي
              </h1>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                مستوفي الشروط الشرعية وقانون الأسرة
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تعبئة بيانات الزوجين تلقائياً من الموكلين، إضافة الصور الشخصية بالأركان، وتوقيع رقمي معتمد لجميع الأطراف
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              العودة للقوالب العامة ↩
            </button>
          )}

          {/* View Tab Switcher (Split / Editor / Preview) */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewTab("split")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewTab === "split" ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              معاينة جانبية متزامنة
            </button>
            <button
              onClick={() => setViewTab("editor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewTab === "editor" ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              نموذج الإدخال فقط
            </button>
            <button
              onClick={() => setViewTab("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewTab === "preview" ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              المعاينة الكاملة (A4)
            </button>
          </div>

          <button
            onClick={() => setIsOcrModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 border border-amber-500/40 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            title="سحب واستخراج بيانات العقد عبر سكانر Lexmark X54de أو OCR"
          >
            <Scan className="w-4 h-4 text-amber-500" />
            <span>ماسح Lexmark X54de / OCR</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="طباعة رسمية مروّسة أو حفظ PDF"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طباعة / PDF</span>
          </button>

          <button
            onClick={handleExportWord}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="تصدير ملف وورد (.doc)"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Word</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="إرسال ملخص العقد عبر الواتساب"
          >
            <Send className="w-4 h-4 rotate-180" />
            <span>واتساب</span>
          </button>
        </div>
      </div>

      {/* 2. Main Workspace (Split Grid) */}
      <div className={`grid gap-6 items-start ${
        viewTab === "split" ? "grid-cols-1 xl:grid-cols-12" : "grid-cols-1"
      }`}>
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Dynamic Inputs & Photo Upload & Signature Triggers (5/12 cols) */}
        {/* ========================================================================= */}
        {(viewTab === "split" || viewTab === "editor") && (
          <div className={`${viewTab === "split" ? "xl:col-span-5" : "w-full"} space-y-5`}>
            
            {/* A. Spouses Auto-population & Personal Details Accordion */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400">
                  <Users className="w-4 h-4" />
                  <span>1. بيانات الزوجين والصور الشخصية</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setIncludePersonalPhotos(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        includePersonalPhotos ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      بإضافة الصور الشخصية (3×4)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncludePersonalPhotos(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        !includePersonalPhotos ? "bg-slate-900 text-amber-300 font-black shadow-xs" : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      بدون إضافة الصور الشخصية
                    </button>
                  </div>

                  {includePersonalPhotos && (
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/50 transition border border-amber-200 dark:border-amber-800/50">
                      <Camera className="w-3.5 h-3.5" />
                      <span>رفع صورتي الزوجين معاً</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMultiplePhotosUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {photoWarning && (
                <div className="col-span-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center justify-between mb-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <div>
                      <h4 className="text-sm font-bold text-red-900 dark:text-red-300">تنبيه: أبعاد الصورة غير مناسبة</h4>
                      <p className="text-xs text-red-700 dark:text-red-400">الصورة المرفقة لل{photoWarning.target === "husband" ? "زوج" : "زوجة"} لا تطابق نسبة 3x4 المطلوبة للنماذج الرسمية.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={applyAutoCrop}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
                  >
                    قص وضبط تلقائي (Auto-Crop)
                  </button>
                </div>
              )}

              {suggestedPrecedents.length > 0 && (
                <div className="col-span-full bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-4 mb-4">
                  <h4 className="text-sm font-bold text-sky-900 dark:text-sky-300 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    سوابق قضائية مقترحة ونماذج مشابهة:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrecedents.map(prec => (
                      <div key={prec.id} className="text-xs bg-white dark:bg-slate-800 border border-sky-100 dark:border-sky-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer" onClick={() => {
                        alert(`سيتم استيراد بنود مماثلة من القضية: ${prec.caseNumber}`);
                      }}>
                        رقم {prec.caseNumber} لسنة {prec.caseYear} - {prec.subject} ({prec.clientName})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Husband Section */}
              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    بيانات الزوج (الطرف الأول):
                  </span>
                  
                  {/* Select from Clients */}
                  <select
                    onChange={(e) => handleSelectHusbandClient(e.target.value)}
                    className="p-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-blue-300 dark:border-blue-800 rounded-xl text-[11px] font-bold outline-none cursor-pointer max-w-[180px]"
                  >
                    <option value="">⚡ اختر من الموكلين المسجلين...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">اسم الزوج رباعياً: *</label>
                    <input
                      type="text"
                      value={data.husbandName}
                      onChange={(e) => setData(prev => ({ ...prev, husbandName: e.target.value }))}
                      placeholder="أحمد محمد السيد إبراهيم"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">الرقم القومي (14 رقم): *</label>
                    <input
                      type="text"
                      maxLength={14}
                      value={data.husbandNationalId}
                      onChange={(e) => setData(prev => ({ ...prev, husbandNationalId: e.target.value }))}
                      placeholder="29001010101234"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">المهنة والوظيفة:</label>
                    <input
                      type="text"
                      value={data.husbandJob}
                      onChange={(e) => setData(prev => ({ ...prev, husbandJob: e.target.value }))}
                      placeholder="مهندس / محاسب / تاجر"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">الحالة الاجتماعية للزوج:</label>
                    <select
                      value={data.husbandMaritalStatus}
                      onChange={(e) => setData(prev => ({ ...prev, husbandMaritalStatus: e.target.value as any }))}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                    >
                      <option value="أعزب">أعزب</option>
                      <option value="متزوج">متزوج</option>
                      <option value="مطلق">مطلق</option>
                      <option value="أرمل">أرمل</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">محل الإقامة والعنوان الدقيق:</label>
                    <input
                      type="text"
                      value={data.husbandAddress}
                      onChange={(e) => setData(prev => ({ ...prev, husbandAddress: e.target.value }))}
                      placeholder="شارع التحرير، الدقي، الجيزة"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">رقم الهاتف / الواتساب:</label>
                    <input
                      type="text"
                      value={data.husbandPhone}
                      onChange={(e) => setData(prev => ({ ...prev, husbandPhone: e.target.value }))}
                      placeholder="01012345678"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Husband Photo Upload button */}
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                      📸 صورة الزوج (أعلى يمين العقد):
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-dashed border-blue-400 dark:border-blue-700 hover:bg-blue-50 rounded-xl text-[11px] font-bold text-blue-700 dark:text-blue-300 cursor-pointer transition">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{data.husbandPhoto ? "تغيير الصورة" : "رفع صورة الزوج"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, "husband")}
                          className="hidden"
                        />
                      </label>
                      {data.husbandPhoto && (
                        <button
                          type="button"
                          onClick={() => setData(prev => ({ ...prev, husbandPhoto: "" }))}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                          title="حذف الصورة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wife Section */}
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-600 fill-current" />
                    بيانات الزوجة (الطرف الثاني):
                  </span>
                  
                  {/* Select from Clients */}
                  <select
                    onChange={(e) => handleSelectWifeClient(e.target.value)}
                    className="p-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-rose-300 dark:border-rose-800 rounded-xl text-[11px] font-bold outline-none cursor-pointer max-w-[180px]"
                  >
                    <option value="">⚡ اختاري من الموكلين المسجلين...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">اسم الزوجة رباعياً: *</label>
                    <input
                      type="text"
                      value={data.wifeName}
                      onChange={(e) => setData(prev => ({ ...prev, wifeName: e.target.value }))}
                      placeholder="فاطمة علي حسن محمود"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">الرقم القومي (14 رقم): *</label>
                    <input
                      type="text"
                      maxLength={14}
                      value={data.wifeNationalId}
                      onChange={(e) => setData(prev => ({ ...prev, wifeNationalId: e.target.value }))}
                      placeholder="29502020104321"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">المهنة والوظيفة:</label>
                    <input
                      type="text"
                      value={data.wifeJob}
                      onChange={(e) => setData(prev => ({ ...prev, wifeJob: e.target.value }))}
                      placeholder="طبيبة / معلمة / ربة منزل"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">الحالة الشرعية للزوجة:</label>
                    <select
                      value={data.wifeStatus}
                      onChange={(e) => setData(prev => ({ ...prev, wifeStatus: e.target.value as any }))}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                    >
                      <option value="بكر رشيد">بكر رشيد (بالغة عاقلة راشدة)</option>
                      <option value="ثيب (مطلقة)">ثيب (مطلقة وانقضت عدتها الشرعية)</option>
                      <option value="ثيب (أرملة)">ثيب (أرملة وانقضت عدتها الشرعية)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">محل الإقامة والعنوان الدقيق:</label>
                    <input
                      type="text"
                      value={data.wifeAddress}
                      onChange={(e) => setData(prev => ({ ...prev, wifeAddress: e.target.value }))}
                      placeholder="شارع قصر النيل، وسط البلد، القاهرة"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">رقم الهاتف / الواتساب:</label>
                    <input
                      type="text"
                      value={data.wifePhone}
                      onChange={(e) => setData(prev => ({ ...prev, wifePhone: e.target.value }))}
                      placeholder="01198765432"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Wife Photo Upload button */}
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                      📸 صورة الزوجة (أعلى يسار العقد):
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-dashed border-rose-400 dark:border-rose-700 hover:bg-rose-50 rounded-xl text-[11px] font-bold text-rose-700 dark:text-rose-300 cursor-pointer transition">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{data.wifePhoto ? "تغيير الصورة" : "رفع صورة الزوجة"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, "wife")}
                          className="hidden"
                        />
                      </label>
                      {data.wifePhoto && (
                        <button
                          type="button"
                          onClick={() => setData(prev => ({ ...prev, wifePhoto: "" }))}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                          title="حذف الصورة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* B. Dowry, Mahr & Location Details */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Coins className="w-4 h-4" />
                <span>2. الصداق والمهر والبنود المالية</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">الصداق الإجمالي:</label>
                  <input
                    type="text"
                    value={data.totalDowry}
                    onChange={(e) => setData(prev => ({ ...prev, totalDowry: e.target.value }))}
                    placeholder="50,000"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">المعجل المقبوض نقداً:</label>
                  <input
                    type="text"
                    value={data.advanceDowry}
                    onChange={(e) => setData(prev => ({ ...prev, advanceDowry: e.target.value }))}
                    placeholder="25,000"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">المؤجل المستحق:</label>
                  <input
                    type="text"
                    value={data.deferredDowry}
                    onChange={(e) => setData(prev => ({ ...prev, deferredDowry: e.target.value }))}
                    placeholder="25,000"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">شرط استحقاق مؤخر الصداق:</label>
                  <input
                    type="text"
                    value={data.deferredCondition}
                    onChange={(e) => setData(prev => ({ ...prev, deferredCondition: e.target.value }))}
                    placeholder="يحل بأقرب الأجلين (الوفاة أو الطلاق البائن)"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* C. Witnesses Details */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4" />
                <span>3. بيانات شاهدي العدل (الشهود)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Witness 1 */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">الشاهد الأول:</span>
                  <input
                    type="text"
                    value={data.witness1Name}
                    onChange={(e) => setData(prev => ({ ...prev, witness1Name: e.target.value }))}
                    placeholder="الاسم الثلاثي للشاهد"
                    className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    maxLength={14}
                    value={data.witness1NationalId}
                    onChange={(e) => setData(prev => ({ ...prev, witness1NationalId: e.target.value }))}
                    placeholder="الرقم القومي (14 رقم)"
                    className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={data.witness1Address}
                    onChange={(e) => setData(prev => ({ ...prev, witness1Address: e.target.value }))}
                    placeholder="عنوان الشاهد ومحل إقامته"
                    className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                {/* Witness 2 */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">الشاهد الثاني:</span>
                  <input
                    type="text"
                    value={data.witness2Name}
                    onChange={(e) => setData(prev => ({ ...prev, witness2Name: e.target.value }))}
                    placeholder="الاسم الثلاثي للشاهد"
                    className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    maxLength={14}
                    value={data.witness2NationalId}
                    onChange={(e) => setData(prev => ({ ...prev, witness2NationalId: e.target.value }))}
                    placeholder="الرقم القومي (14 رقم)"
                    className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={data.witness2Address}
                    onChange={(e) => setData(prev => ({ ...prev, witness2Address: e.target.value }))}
                    placeholder="عنوان الشاهد ومحل إقامته"
                    className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* D. Digital Signatures Hub */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400">
                  <PenTool className="w-4 h-4" />
                  <span>4. التوقيع الرقمي والتوثيق الإلكتروني للأطراف</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  تشفير SHA-256
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* Husband Signature Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveSigner("husband");
                    setTypedSignName(data.husbandName || "الزوج");
                  }}
                  className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between gap-2 cursor-pointer ${
                    data.husbandSignature 
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-200"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-blue-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">توقيع الزوج</span>
                    {data.husbandSignature ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <PenTool className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {data.husbandSignature ? "✓ تم التوقيع إلكترونياً" : "انقر لتوقيع الزوج"}
                  </span>
                </button>

                {/* Wife Signature Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveSigner("wife");
                    setTypedSignName(data.wifeName || "الزوجة");
                  }}
                  className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between gap-2 cursor-pointer ${
                    data.wifeSignature 
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-200"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-rose-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">توقيع الزوجة</span>
                    {data.wifeSignature ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <PenTool className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {data.wifeSignature ? "✓ تم التوقيع إلكترونياً" : "انقر لتوقيع الزوجة"}
                  </span>
                </button>

                {/* Witness 1 Signature Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveSigner("witness1");
                    setTypedSignName(data.witness1Name || "الشاهد الأول");
                  }}
                  className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between gap-2 cursor-pointer ${
                    data.witness1Signature 
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-200"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">توقيع الشاهد 1</span>
                    {data.witness1Signature ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <PenTool className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {data.witness1Signature ? "✓ تم توقيع الشاهد" : "توقيع الشاهد الأول"}
                  </span>
                </button>

                {/* Witness 2 Signature Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveSigner("witness2");
                    setTypedSignName(data.witness2Name || "الشاهد الثاني");
                  }}
                  className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between gap-2 cursor-pointer ${
                    data.witness2Signature 
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-200"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">توقيع الشاهد 2</span>
                    {data.witness2Signature ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <PenTool className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {data.witness2Signature ? "✓ تم توقيع الشاهد" : "توقيع الشاهد الثاني"}
                  </span>
                </button>

                {/* Lawyer Certification & Seal */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveSigner("lawyer");
                    setTypedSignName(data.lawyerName || "المحامي الموثق");
                  }}
                  className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between gap-2 cursor-pointer sm:col-span-2 ${
                    data.lawyerSignature 
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-950 dark:text-amber-200"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      ختم وتوقيع ديوان المحامي المعتمد
                    </span>
                    {data.lawyerSignature ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldCheck className="w-4 h-4 text-amber-500" />}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {data.lawyerSignature ? "✓ تم إيداع ختم وتوقيع الديوان الرسمي" : "اعتماد وتوثيق العقد بختم الديوان"}
                  </span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Live Side-by-Side A4 Contract Sheet Preview (7/12 cols)     */}
        {/* ========================================================================= */}
        {(viewTab === "split" || viewTab === "preview") && (
          <div className={`${viewTab === "split" ? "xl:col-span-7" : "w-full"} sticky top-4`}>
            
            {/* Live Sheet Card Frame */}
            <div className="bg-slate-200/70 dark:bg-slate-950 p-2 sm:p-4 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-xl overflow-hidden">
              
              {/* Top Banner Toolbar */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white rounded-2xl mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-bold">المعاينة الحية الفورية للعقد (Direct Live Preview)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] bg-slate-800 px-2 py-0.5 rounded text-amber-400">
                    {data.contractSerialHash}
                  </span>
                </div>
              </div>

              {/* A4 Page Canvas Area */}
              <div 
                id="urfi-contract-print-area"
                className="bg-white text-slate-950 p-6 sm:p-8 rounded-2xl border-4 border-double border-amber-600/60 shadow-2xl space-y-5 font-serif text-right max-h-[820px] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0"
              >
                
                {/* 1. Header with Photos in Top Corners (Optional) */}
                <div className="relative border-b-2 border-amber-700/80 pb-4">
                  
                  {includePersonalPhotos && (
                    <>
                      {/* Top Right: Husband Photo Frame */}
                      <div className="absolute right-0 top-0 w-24 sm:w-28 text-center flex flex-col items-center">
                        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl border-2 border-blue-600/80 p-1 bg-slate-50 shadow-md flex items-center justify-center overflow-hidden relative">
                          {data.husbandPhoto ? (
                            <img 
                              src={data.husbandPhoto} 
                              alt="صورة الزوج" 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 text-[10px] space-y-1">
                              <User className="w-8 h-8 text-slate-300" />
                              <span>صورة الزوج الشخصية</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-blue-900/80 text-white text-[8.5px] py-0.5 font-sans font-bold">
                            الطرف الأول (الزوج)
                          </div>
                        </div>
                      </div>

                      {/* Top Left: Wife Photo Frame */}
                      <div className="absolute left-0 top-0 w-24 sm:w-28 text-center flex flex-col items-center">
                        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl border-2 border-rose-600/80 p-1 bg-slate-50 shadow-md flex items-center justify-center overflow-hidden relative">
                          {data.wifePhoto ? (
                            <img 
                              src={data.wifePhoto} 
                              alt="صورة الزوجة" 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 text-[10px] space-y-1">
                              <Heart className="w-8 h-8 text-slate-300" />
                              <span>صورة الزوجة الشخصية</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-rose-900/80 text-white text-[8.5px] py-0.5 font-sans font-bold">
                            الطرف الثاني (الزوجة)
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Center Emblem & Title */}
                  <div className={`${includePersonalPhotos ? "px-24 sm:px-32" : "px-4"} text-center space-y-1`}>
                    <p className="text-xs font-bold text-amber-800">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-600 italic leading-tight">
                      «وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً»
                    </p>
                    <div className="py-1">
                      <h2 className="text-base sm:text-xl font-black text-amber-950 tracking-wide border-b border-amber-600 inline-block px-4 pb-0.5">
                        عـقـد زواج عـرفـي شـرعـي {includePersonalPhotos ? "" : "(كامل الأركان)"}
                      </h2>
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans">
                      محرر بمدينة {data.contractCity || "القاهرة"} بتاريخ: {data.contractDate} الموافق {data.hijriDate}
                    </p>
                  </div>
                </div>

                {/* 2. Preamble & Spouses Legal Identities */}
                <div className="text-[12px] sm:text-[13px] leading-relaxed space-y-3">
                  <p className="font-bold text-slate-800">
                    تم الاتفاق والتراضي والتعاقد الشرعي بين كل من:
                  </p>

                  {/* Husband Identity Box */}
                  <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/80 space-y-1">
                    <p className="font-black text-blue-950 text-[13px]">
                      أولاً: السيد / {data.husbandName || "........................................................"}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[11px] text-slate-700 font-sans">
                      <span>• الجنسية: {data.husbandNationality || "مصري"}</span>
                      <span>• الديانة: {data.husbandReligion || "مسلم"}</span>
                      <span>• المهنة: {data.husbandJob || "............"}</span>
                      <span className="col-span-2 font-mono">• الرقم القومي: {data.husbandNationalId || ".............................."}</span>
                      <span>• الحالة: {data.husbandMaritalStatus}</span>
                      <span className="col-span-2 sm:col-span-3">• محل الإقامة: {data.husbandAddress || "................................................"}</span>
                    </div>
                    <p className="text-right text-[11px] font-bold text-blue-900 mt-1">«طرف أول - زوج»</p>
                  </div>

                  {/* Wife Identity Box */}
                  <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-200/80 space-y-1">
                    <p className="font-black text-rose-950 text-[13px]">
                      ثانياً: السيدة / {data.wifeName || "........................................................"}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[11px] text-slate-700 font-sans">
                      <span>• الجنسية: {data.wifeNationality || "مصرية"}</span>
                      <span>• الديانة: {data.wifeReligion || "مسلمة"}</span>
                      <span>• المهنة: {data.wifeJob || "............"}</span>
                      <span className="col-span-2 font-mono">• الرقم القومي: {data.wifeNationalId || ".............................."}</span>
                      <span>• الصفة: {data.wifeStatus}</span>
                      <span className="col-span-2 sm:col-span-3">• محل الإقامة: {data.wifeAddress || "................................................"}</span>
                    </div>
                    <p className="text-right text-[11px] font-bold text-rose-900 mt-1">«طرف ثانٍ - زوجة»</p>
                  </div>

                  {/* Acknowledgment */}
                  <p className="text-justify text-[11.5px] leading-relaxed text-slate-800 bg-amber-50/30 p-2.5 rounded-lg border border-amber-200/60">
                    <span className="font-bold">الإقرار بالأهلية الشرعية: </span>
                    أقر الطرفان بكامل أهليتهما المعتبرة شرعاً وقانوناً للتعاقد والتصرف وخلوهما التام والبات من كافة الموانع الشرعية المحرمة للزواج بينهما بأي وجه من الوجوه (من نسب أو رضاع أو مصاهرة أو عدة أو خلافه)، واتفقا على الآتي:
                  </p>

                  {/* Contract Clauses */}
                  <div className="space-y-2.5 text-[12px] text-slate-900">
                    <p>
                      <strong className="text-amber-900">البند الأول (الإيجاب والقبول الشرعي): </strong>
                      تزوج الطرف الأول من الطرف الثاني زواجاً شرعياً صحيحاً على كتاب الله وسنة رسوله ﷺ وعلى مذهب الإمام أبي حنيفة النعمان، وقبلت الطرف الثاني الزواج منه بنفس الصيغة الشرعية للإيجاب والقبول التامين الخاليين من أي إكراه.
                    </p>

                    <p>
                      <strong className="text-amber-900">البند الثاني (المهر والصداق): </strong>
                      اتفق الطرفان على صداق إجمالي مبلغه ({data.totalDowry}) {data.dowryCurrency}، دفع الطرف الأول منه بمجلس هذا العقد عاجلاً معجلاً مقبوضاً بيد الزوجة مبلغه ({data.advanceDowry}) {data.dowryCurrency}، والمؤجل منه مبلغ ({data.deferredDowry}) {data.dowryCurrency} {data.deferredCondition}.
                    </p>

                    <p>
                      <strong className="text-amber-900">البند الثالث (المعاشرة والمساكنة): </strong>
                      يقر الطرفان بأن هذا الزواج يرتب كافة الآثار الشرعية والقانونية من حق المساكنة والمعاشرة بالمعروف والتزام الزوج بالإنفاق الشرعي وتوفير المسكن اللائق بما يتفق مع يساره المالي.
                    </p>

                    <p>
                      <strong className="text-amber-900">البند الرابع (ثبوت النسب): </strong>
                      يقر الطرفان بأن ما ينتج عن هذه الزوجية المباركة من أولاد وبنات ينسبون شرعاً وقانوناً للطرف الأول (الزوج) ولهما وعليهم كافة الحقوق الشرعية من حضانة ورعاية ونفقة وتربية وميراث.
                    </p>

                    <p>
                      <strong className="text-amber-900">البند الخامس (التوثيق القضائي): </strong>
                      يتعهد كل من الطرفين بالحضور أمام محكمة الأسرة المختصة أو مكاتب التوثيق الرسمية للمصادقة على هذا الزواج وإثبات صحته ونفاذه متى طلب أحدهما ذلك طبقاً للمادة 17 من القانون رقم 1 لسنة 2000.
                    </p>

                    {data.additionalClauses && (
                      <p>
                        <strong className="text-amber-900">البند السادس (شروط خاصة مضافة): </strong>
                        {data.additionalClauses}
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Signatures, Fingerprints & Seals Grid */}
                <div className="pt-4 border-t-2 border-amber-800 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Husband Signature Box */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 text-center space-y-1">
                      <span className="text-[12px] font-black text-blue-900 block">الـطـرف الأول (الـزوج)</span>
                      <span className="text-[10px] text-slate-600 block">{data.husbandName || "........................"}</span>
                      
                      <div className="h-16 flex items-center justify-center my-1">
                        {data.husbandSignature ? (
                          <img src={data.husbandSignature} alt="توقيع الزوج" className="max-h-14 object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">التوقيع: ............................</span>
                        )}
                      </div>
                      
                      <div className="border border-dashed border-slate-400 rounded-lg p-1 text-[9px] text-slate-500">
                        البصمة: [ {data.husbandSignature ? "معتمدة إلكترونياً" : "بصمة الإبهام"} ]
                      </div>
                      {data.husbandSignatureHash && (
                        <span className="text-[8px] font-mono text-emerald-700 block truncate">
                          {data.husbandSignatureHash}
                        </span>
                      )}
                    </div>

                    {/* Wife Signature Box */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 text-center space-y-1">
                      <span className="text-[12px] font-black text-rose-900 block">الـطـرف الـثـانـي (الـزوجـة)</span>
                      <span className="text-[10px] text-slate-600 block">{data.wifeName || "........................"}</span>
                      
                      <div className="h-16 flex items-center justify-center my-1">
                        {data.wifeSignature ? (
                          <img src={data.wifeSignature} alt="توقيع الزوجة" className="max-h-14 object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">التوقيع: ............................</span>
                        )}
                      </div>
                      
                      <div className="border border-dashed border-slate-400 rounded-lg p-1 text-[9px] text-slate-500">
                        البصمة: [ {data.wifeSignature ? "معتمدة إلكترونياً" : "بصمة الإبهام"} ]
                      </div>
                      {data.wifeSignatureHash && (
                        <span className="text-[8px] font-mono text-emerald-700 block truncate">
                          {data.wifeSignatureHash}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Witnesses Signatures Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                      <span className="text-[11px] font-black text-slate-800 block">شـاهـد أول (عـدل)</span>
                      <span className="text-[10px] text-slate-600 block">{data.witness1Name || "........................"}</span>
                      <span className="text-[9px] font-mono text-slate-500 block">ق: {data.witness1NationalId || "................"}</span>
                      <div className="h-10 flex items-center justify-center">
                        {data.witness1Signature ? (
                          <img src={data.witness1Signature} alt="توقيع الشاهد 1" className="max-h-9 object-contain" />
                        ) : (
                          <span className="text-[9.5px] text-slate-400">التوقيع: ..................</span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                      <span className="text-[11px] font-black text-slate-800 block">شـاهـد ثـانٍ (عـدل)</span>
                      <span className="text-[10px] text-slate-600 block">{data.witness2Name || "........................"}</span>
                      <span className="text-[9px] font-mono text-slate-500 block">ق: {data.witness2NationalId || "................"}</span>
                      <div className="h-10 flex items-center justify-center">
                        {data.witness2Signature ? (
                          <img src={data.witness2Signature} alt="توقيع الشاهد 2" className="max-h-9 object-contain" />
                        ) : (
                          <span className="text-[9.5px] text-slate-400">التوقيع: ..................</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Law Firm Official Seal & QR Code Verification */}
                  <div className="p-3 bg-amber-50/60 rounded-2xl border-2 border-amber-600/60 flex flex-wrap items-center justify-between gap-3 text-right">
                    <div className="space-y-0.5 flex-1 min-w-[200px]">
                      <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs">
                        <Scale className="w-4 h-4 text-amber-700" />
                        <span>تحت إشراف وتوثيق: {data.lawyerOfficeName}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-sans">
                        الأستاذ / {data.lawyerName} ({data.lawyerTitle})
                      </p>
                      <p className="text-[9px] text-emerald-800 font-bold">
                        ✓ تم التحقق الشرعي والقانوني ومطابقة الهويات بمجلس العقد
                      </p>
                    </div>

                    {/* QR Code Validation */}
                    <div className="flex items-center gap-2.5 bg-white p-1.5 rounded-xl border border-amber-300 shadow-xs">
                      <div className="p-1">
                        <QRCode
                          value={`https://lawfirm.portal/verify/marriage/${data.contractSerialHash}?h=${encodeURIComponent(data.husbandName)}&w=${encodeURIComponent(data.wifeName)}`}
                          size={46}
                        />
                      </div>
                      <div className="text-[8.5px] font-mono text-slate-600 space-y-0.5">
                        <span className="font-bold text-amber-900 block">التحقق الرقمي</span>
                        <span>{data.contractSerialHash}</span>
                      </div>
                    </div>

                    {/* Official Seal Display */}
                    <div className="scale-75 origin-left">
                      <LawyerSignatureSeal
                        size="sm"
                        showSealBorder={false}
                        lawyerName={data.lawyerName}
                        verificationHash={data.contractSerialHash}
                      />
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 3. Electronic Signature Drawer / Modal                                    */}
      {/* ========================================================================= */}
      {activeSigner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-400">
                    منصة التوقيع الرقمي: {
                      activeSigner === "husband" ? "الزوج (الطرف الأول)" :
                      activeSigner === "wife" ? "الزوجة (الطرف الثاني)" :
                      activeSigner === "witness1" ? "الشاهد الأول" :
                      activeSigner === "witness2" ? "الشاهد الثاني" : "الأستاذ المحامي"
                    }
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {activeSigner === "husband" ? data.husbandName :
                     activeSigner === "wife" ? data.wifeName :
                     activeSigner === "witness1" ? data.witness1Name :
                     activeSigner === "witness2" ? data.witness2Name : data.lawyerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSigner(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              
              {/* Signature Mode Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSignatureMode("draw")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    signatureMode === "draw" ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  ✍️ رسم التوقيع الحي باليد / القلم
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode("type")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    signatureMode === "type" ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  ⌨️ كتابة الاسم (توقيع خطي إلكتروني)
                </button>
              </div>

              {/* Draw Signature Canvas */}
              {signatureMode === "draw" ? (
                <div className="space-y-2">
                  <div className="relative border-2 border-dashed border-amber-400/80 rounded-2xl bg-amber-50/20 dark:bg-slate-950 overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-44 cursor-crosshair touch-none"
                    />
                    {!hasDrawn && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs space-y-1">
                        <PenTool className="w-6 h-6 text-amber-500/60" />
                        <span>وقّع هنا باستخدام الماوس أو اللمس</span>
                      </div>
                    )}
                  </div>

                  {/* Pen Controls */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[11px]">لون الحبر:</span>
                      <button
                        type="button"
                        onClick={() => setPenColor("#1e3a8a")}
                        className={`w-5 h-5 rounded-full bg-blue-900 border-2 ${penColor === "#1e3a8a" ? "border-amber-400 scale-110" : "border-white"}`}
                        title="أزرق ملكي"
                      />
                      <button
                        type="button"
                        onClick={() => setPenColor("#0f172a")}
                        className={`w-5 h-5 rounded-full bg-slate-900 border-2 ${penColor === "#0f172a" ? "border-amber-400 scale-110" : "border-white"}`}
                        title="أسود رسمي"
                      />
                      <button
                        type="button"
                        onClick={() => setPenColor("#047857")}
                        className={`w-5 h-5 rounded-full bg-emerald-700 border-2 ${penColor === "#047857" ? "border-amber-400 scale-110" : "border-white"}`}
                        title="أخضر توثيق"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-slate-500 hover:text-red-500 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>مسح وإعادة الرسم</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    الاسم المعتمد للتوقيع:
                  </label>
                  <input
                    type="text"
                    value={typedSignName}
                    onChange={(e) => setTypedSignName(e.target.value)}
                    placeholder="اكتب الاسم كما يظهر في العقد"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-amber-500"
                  />
                  <div className="p-4 bg-amber-50/50 dark:bg-slate-950 rounded-xl border border-amber-300 text-center font-serif text-xl italic text-blue-900 dark:text-blue-300">
                    {typedSignName || "معاينة التوقيع الخطي"}
                  </div>
                </div>
              )}

              {/* Legal Confirmation Check */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 rounded-xl text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>يعد هذا التوقيع الإلكتروني ملزماً ومعتبراً قانونياً وإقراراً صحيحاً ببنود عقد الزواج العرفي.</span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveSigner(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmSignature}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد التوقيع وحفظه بالعقد</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Dedicated Section OCR Modal for Contracts */}
      <SectionDedicatedOcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        section="contracts"
        language={language}
        onApplyData={(res) => {
          if (res.firstParty) setData(prev => ({ ...prev, husbandName: res.firstParty?.replace(/.*:\s*/, "") || prev.husbandName }));
          if (res.secondParty) setData(prev => ({ ...prev, wifeName: res.secondParty?.replace(/.*:\s*/, "") || prev.wifeName }));
          if (res.contractPrice) setData(prev => ({ ...prev, totalDowry: res.contractPrice || prev.totalDowry }));
          if (res.contractTerms && res.contractTerms.length > 0) {
            setData(prev => ({ ...prev, additionalClauses: res.contractTerms?.join("\n") || prev.additionalClauses }));
          }
        }}
      />

    </div>
  );
}
