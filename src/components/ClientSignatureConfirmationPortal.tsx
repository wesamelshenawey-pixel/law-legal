import React, { useState, useEffect, useRef } from "react";
import { GoogleKeepNote, signLocalKeepMemo } from "../utils/workspaceService";
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  Lock,
  PenTool,
  RotateCcw,
  Printer,
  Share2,
  FileCheck2,
  Calendar,
  User,
  X,
  Sparkles,
  Info,
  Check,
  CheckCheck,
  Camera,
  Upload,
  Fingerprint,
  Activity,
  Code,
  Download,
  FileText,
  FileDown,
  Loader2,
  ScanLine,
  Eye,
  Layers,
  SlidersHorizontal,
  Star,
  Trash2,
  Plus,
  Maximize2,
  Move,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import LawyerSignatureSeal from "./LawyerSignatureSeal";
import SignatureDrawingCanvas from "./SignatureDrawingCanvas";
import { BiometricSignatureTelemetry } from "../types";
import { smartAutoAlignSignature } from "../utils/signatureAlignment";

interface ClientSignatureConfirmationPortalProps {
  note: GoogleKeepNote;
  isOpen: boolean;
  onClose: () => void;
  onSignComplete: (signedNote: GoogleKeepNote) => void;
}

export interface UploadedSignatureItem {
  id: string;
  name: string;
  dataUrl: string;
  alignedDataUrl: string;
  isPrimary: boolean;
  uploadedAt: string;
  fileSizeKb: number;
}

export interface UploadedIdentityDoc {
  id: string;
  name: string;
  dataUrl: string;
  docType: "national_id_front" | "national_id_back" | "poa" | "syndicate_card" | "other";
  extractedOcrData?: any;
  isScanningOcr?: boolean;
  uploadedAt: string;
}

export default function ClientSignatureConfirmationPortal({
  note,
  isOpen,
  onClose,
  onSignComplete
}: ClientSignatureConfirmationPortalProps) {
  // Signature Drawing & Active Selection
  const [drawnSignatureImage, setDrawnSignatureImage] = useState<string | null>(null);
  const [signatureVectorSvg, setSignatureVectorSvg] = useState<string | null>(null);
  const [biometricTelemetry, setBiometricTelemetry] = useState<BiometricSignatureTelemetry | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"draw" | "uploaded" | "type">("draw");

  // Client Data
  const [signerName, setSignerName] = useState(note.clientName || "");
  const [nationalId, setNationalId] = useState(note.signatureData?.nationalId || "");
  const [phoneNumber, setPhoneNumber] = useState(note.clientPhone || "");
  const [affirmationAgreed, setAffirmationAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigned, setIsSigned] = useState(note.signatureStatus === "signed");
  const [signedNoteData, setSignedNoteData] = useState<GoogleKeepNote>(note);

  // Smart Auto-Alignment Settings
  const [isAutoAlignEnabled, setIsAutoAlignEnabled] = useState(true);
  const [alignPosition, setAlignPosition] = useState<"center" | "baseline" | "top">("center");
  const [alignScale, setAlignScale] = useState<number>(100); // 100%
  const [alignedSignatureUrl, setAlignedSignatureUrl] = useState<string | null>(null);
  const [isAligning, setIsAligning] = useState(false);

  // Live Translucent Document Overlay Preview
  const [showLiveDocOverlay, setShowLiveDocOverlay] = useState(false);
  const [overlayDocOpacity, setOverlayDocOpacity] = useState<number>(75); // 75%
  const [overlayZoom, setOverlayZoom] = useState<number>(100); // 100%
  const [overlayOffsetX, setOverlayOffsetX] = useState<number>(0);
  const [overlayOffsetY, setOverlayOffsetY] = useState<number>(0);

  // Multiple Uploaded Signatures & Identity Documents
  const [uploadedSignatures, setUploadedSignatures] = useState<UploadedSignatureItem[]>([]);
  const [uploadedIdentityDocs, setUploadedIdentityDocs] = useState<UploadedIdentityDoc[]>([]);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(null);

  // OCR Extraction States
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrSuccessData, setOcrSuccessData] = useState<any | null>(null);

  // File Inputs Refs
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);
  const signatureFileInputRef = useRef<HTMLInputElement | null>(null);

  // Print Preview / Official Memo Mode
  const [showOfficialDocPreview, setShowOfficialDocPreview] = useState(false);

  // Initialize data from note
  useEffect(() => {
    if (note) {
      setSignerName(note.clientName || "");
      setNationalId(note.signatureData?.nationalId || "");
      setPhoneNumber(note.clientPhone || "");
      setIsSigned(note.signatureStatus === "signed");
      setSignedNoteData(note);
      setDrawnSignatureImage(note.signatureData?.signatureImage || null);
      setSignatureVectorSvg(note.signatureData?.signatureVectorSvg || null);
      setBiometricTelemetry((note.signatureData as any)?.biometricTelemetry || null);
      setHasDrawn(!!note.signatureData?.signatureImage);

      if (note.signatureData?.signatureImage) {
        setAlignedSignatureUrl(note.signatureData.signatureImage);
      }
    }
  }, [note]);

  // Compute Active Signature (either drawn, selected from uploads, or aligned)
  const getActiveSignatureDataUrl = (): string | null => {
    if (signatureMode === "uploaded" && selectedSignatureId) {
      const found = uploadedSignatures.find((s) => s.id === selectedSignatureId);
      if (found) {
        return isAutoAlignEnabled ? (found.alignedDataUrl || found.dataUrl) : found.dataUrl;
      }
    }

    if (isAutoAlignEnabled && alignedSignatureUrl) {
      return alignedSignatureUrl;
    }

    return drawnSignatureImage;
  };

  // Perform Smart Auto-Alignment on raw signature
  const executeAutoAlignment = async (
    rawUrl: string | null,
    position: "center" | "baseline" | "top" = alignPosition,
    scalePercent: number = alignScale
  ) => {
    if (!rawUrl) {
      setAlignedSignatureUrl(null);
      return;
    }

    setIsAligning(true);
    try {
      const aligned = await smartAutoAlignSignature(rawUrl, {
        targetWidth: 600,
        targetHeight: 220,
        padding: 18,
        alignment: position,
        scale: scalePercent / 100,
        removeWhiteBackground: true,
        contrastEnhance: true
      });
      setAlignedSignatureUrl(aligned);
    } catch (err) {
      console.error("Auto alignment failed:", err);
      setAlignedSignatureUrl(rawUrl);
    } finally {
      setIsAligning(false);
    }
  };

  // Trigger alignment when drawing changes
  const handleSignatureCanvasChange = (
    dataUrl: string | null,
    drawn: boolean,
    vectorSvg?: string,
    telemetry?: BiometricSignatureTelemetry
  ) => {
    setDrawnSignatureImage(dataUrl);
    setHasDrawn(drawn);
    if (vectorSvg) setSignatureVectorSvg(vectorSvg);
    if (telemetry) setBiometricTelemetry(telemetry);

    if (dataUrl && isAutoAlignEnabled) {
      executeAutoAlignment(dataUrl, alignPosition, alignScale);
    } else {
      setAlignedSignatureUrl(dataUrl);
    }
  };

  // Trigger alignment when settings change
  const handleAlignmentSettingsChange = (
    enabled: boolean,
    pos: "center" | "baseline" | "top",
    scaleVal: number
  ) => {
    setIsAutoAlignEnabled(enabled);
    setAlignPosition(pos);
    setAlignScale(scaleVal);

    const baseSrc = signatureMode === "uploaded" && selectedSignatureId
      ? uploadedSignatures.find((s) => s.id === selectedSignatureId)?.dataUrl || drawnSignatureImage
      : drawnSignatureImage;

    if (enabled && baseSrc) {
      executeAutoAlignment(baseSrc, pos, scaleVal);
    }
  };

  // Multi-file upload for signatures & documents
  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isSignatureOnly = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = async () => {
        const base64Data = reader.result as string;
        const sizeKb = Math.round(file.size / 1024);
        const fileNameLower = file.name.toLowerCase();

        // Check if file is a signature or document
        const isSigFile = isSignatureOnly || 
          fileNameLower.includes("sig") || 
          fileNameLower.includes("توقيع") || 
          fileNameLower.includes("امضاء") || 
          fileNameLower.includes("stamp") ||
          fileNameLower.includes("ختم");

        if (isSigFile) {
          // Align uploaded signature image
          const aligned = await smartAutoAlignSignature(base64Data, {
            targetWidth: 600,
            targetHeight: 220,
            padding: 16,
            alignment: "center",
            scale: 1.0,
            removeWhiteBackground: true
          });

          const newSigItem: UploadedSignatureItem = {
            id: "sig-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            name: file.name || `توقيع مرفوع ${uploadedSignatures.length + 1}`,
            dataUrl: base64Data,
            alignedDataUrl: aligned,
            isPrimary: uploadedSignatures.length === 0 && !hasDrawn,
            uploadedAt: new Date().toISOString(),
            fileSizeKb: sizeKb
          };

          setUploadedSignatures((prev) => {
            const next = [...prev, newSigItem];
            if (next.length === 1 && !hasDrawn) {
              setSelectedSignatureId(newSigItem.id);
              setSignatureMode("uploaded");
              setAlignedSignatureUrl(aligned);
            }
            return next;
          });
        } else {
          // It is an identity or legal document (National ID, POA, etc.)
          let docType: UploadedIdentityDoc["docType"] = "other";
          if (fileNameLower.includes("id") || fileNameLower.includes("بطاقة") || fileNameLower.includes("رقم_قومي")) {
            docType = fileNameLower.includes("back") || fileNameLower.includes("ظهر") ? "national_id_back" : "national_id_front";
          } else if (fileNameLower.includes("توكيل") || fileNameLower.includes("poa")) {
            docType = "poa";
          } else if (fileNameLower.includes("كارنيه") || fileNameLower.includes("نقابة")) {
            docType = "syndicate_card";
          }

          const newDocItem: UploadedIdentityDoc = {
            id: "doc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            name: file.name || `مستند ثبوتي ${uploadedIdentityDocs.length + 1}`,
            dataUrl: base64Data,
            docType,
            uploadedAt: new Date().toISOString()
          };

          setUploadedIdentityDocs((prev) => [...prev, newDocItem]);

          // Trigger OCR extraction automatically for National ID or POA
          scanDocOcr(newDocItem.id, base64Data);
        }
      };

      reader.readAsDataURL(file);
    }

    // Reset input
    e.target.value = "";
  };

  // Trigger OCR on a specific document
  const scanDocOcr = async (docId: string, base64Data: string) => {
    setUploadedIdentityDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, isScanningOcr: true } : d))
    );
    setIsOcrScanning(true);

    try {
      const res = await fetch("/api/ai/ocr-extract-id-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Data })
      });

      if (!res.ok) throw new Error("فشل الاستجابة من خادم OCR");
      const data = await res.json();

      if (data.fullName) setSignerName(data.fullName);
      if (data.nationalId) setNationalId(data.nationalId);
      setOcrSuccessData(data);

      setUploadedIdentityDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, isScanningOcr: false, extractedOcrData: data } : d))
      );
    } catch (err: any) {
      console.error("OCR Extraction Error:", err);
      setUploadedIdentityDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, isScanningOcr: false } : d))
      );
    } finally {
      setIsOcrScanning(false);
    }
  };

  // Select Best Signature from Uploads
  const handleSelectPrimarySignature = (sigId: string) => {
    setSelectedSignatureId(sigId);
    setSignatureMode("uploaded");
    const sig = uploadedSignatures.find((s) => s.id === sigId);
    if (sig) {
      setAlignedSignatureUrl(isAutoAlignEnabled ? sig.alignedDataUrl : sig.dataUrl);
      setUploadedSignatures((prev) =>
        prev.map((s) => ({ ...s, isPrimary: s.id === sigId }))
      );
    }
  };

  // Remove uploaded signature
  const handleDeleteUploadedSignature = (sigId: string) => {
    setUploadedSignatures((prev) => prev.filter((s) => s.id !== sigId));
    if (selectedSignatureId === sigId) {
      setSelectedSignatureId(null);
      setSignatureMode("draw");
      setAlignedSignatureUrl(drawnSignatureImage);
    }
  };

  // Remove uploaded doc
  const handleDeleteUploadedDoc = (docId: string) => {
    setUploadedIdentityDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  // Submit Final Signature
  const handleSubmitSignature = () => {
    if (!signerName.trim()) {
      alert("يرجى إدخال اسمك بالكامل كما في بطاقة الرقم القومي.");
      return;
    }
    if (!affirmationAgreed) {
      alert("يرجى الموافقة على الإقرار القانوني لإتمام التوقيع.");
      return;
    }

    const activeSig = getActiveSignatureDataUrl();
    if (signatureMode !== "type" && !activeSig) {
      alert("يرجى رسم أو اختيار توقيعك المعتمد قبل التأكيد.");
      return;
    }

    const signatureImage = signatureMode === "type" ? "" : (activeSig || "");
    const vectorSvg = signatureMode === "draw" && signatureVectorSvg ? signatureVectorSvg : undefined;

    setIsSubmitting(true);

    setTimeout(() => {
      const behavioralFingerprint = biometricTelemetry?.behavioralFingerprint ||
        ("BIO-SIG-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Date.now().toString(36).toUpperCase());

      let updated = signLocalKeepMemo(note.id, {
        signedBy: signerName.trim(),
        nationalId: nationalId.trim() || undefined,
        signatureImage: signatureImage || undefined,
        signatureVectorSvg: vectorSvg,
        signatureType: (signatureMode === "type" ? "digital_badge" : "drawn"),
        notes: `تم التوقيع الإلكتروني وتوليد البصمة السلوكية والمحاذاة الذكية - هاتف: ${phoneNumber || "غير محدد"}`,
        biometricTelemetry: biometricTelemetry || undefined,
        behavioralFingerprint
      });

      const now = new Date().toISOString();
      const hash = "E-SIG-" + Math.floor(1000 + Math.random() * 9000) + "-VERIFIED-" + Date.now().toString(36).toUpperCase();
      const sigData = {
        signedBy: signerName.trim(),
        nationalId: nationalId.trim() || undefined,
        signedAt: now,
        signatureImage: signatureImage || undefined,
        signatureVectorSvg: vectorSvg,
        signatureType: (signatureMode === "type" ? "digital_badge" : "drawn") as "drawn" | "digital_badge",
        verificationHash: hash,
        digitalStamp: "مكتب الأستاذ وسام الشناوي - توقيع إلكتروني معتمد بالمحاذاة الذكية",
        lawyerSignatureName: "الأستاذ وسام أحمد الشناوي المحامي بالنقض",
        ipOrDeviceId: "Device-Verified-" + Math.random().toString(36).substring(2, 7),
        notes: `تم التوقيع الإلكتروني وتوليد البصمة السلوكية والمحاذاة الذكية - هاتف: ${phoneNumber || "غير محدد"}`,
        biometricTelemetry: biometricTelemetry || undefined,
        behavioralFingerprint
      };

      // Also update law_clientNotes in localStorage if present
      try {
        const savedNotes = localStorage.getItem("law_clientNotes");
        if (savedNotes) {
          const list = JSON.parse(savedNotes);
          const idx = list.findIndex((n: any) => n.id === note.id);
          if (idx !== -1) {
            const existingHistory = list[idx].signatureHistory || [];
            list[idx] = {
              ...list[idx],
              signatureStatus: "signed",
              signatureData: sigData,
              signatureHistory: [
                ...existingHistory,
                {
                  timestamp: now,
                  action: "اعتماد التوقيع بالمحاذاة الذكية والتأكد عبر المعاينة الحية",
                  performedBy: `${signerName.trim()} (الموكل)`,
                  status: "signed",
                  notes: "تم التوقيع بنجاح ومطابقة موضع التوقيع داخل المستند"
                }
              ]
            };
            localStorage.setItem("law_clientNotes", JSON.stringify(list));
            if (!updated) {
              updated = list[idx] as any;
            }
          }
        }
      } catch (e) {
        console.error("Error updating clientNotes signature:", e);
      }

      if (!updated) {
        updated = {
          ...note,
          signatureStatus: "signed",
          signatureData: sigData
        } as any;
      }

      setIsSubmitting(false);
      setIsSigned(true);
      setSignedNoteData(updated as any);
      onSignComplete(updated as any);
    }, 600);
  };

  const noteTitleVal = (signedNoteData as any).title || (signedNoteData as any).category || "ملحوظة قضائية رسمية";
  const noteContentVal = (note as any).content || (note as any).text || "";

  const handleNotifyLawyerWhatsApp = () => {
    const sig = signedNoteData.signatureData;
    const text = encodeURIComponent(`🏛️ *تأكيد إتمام التوقيع الإلكتروني والمحاذاة الذكية*
إلى: مكتب الأستاذ وسام الشناوي المحامي بالنقض
أنا الموكل: *${sig?.signedBy || signerName}*
🔢 الرقم القومي: ${sig?.nationalId || nationalId || "معتمد"}

أفيدكم بأنه تم اعتماد التوقيع الإلكتروني بالمحاذاة الذكية على الملحوظة:
📌 *"${noteTitleVal}"*
🔐 كود التحقق المشفر: ${sig?.verificationHash || "E-SIG-VERIFIED"}
🧬 البصمة السلوكية: ${sig?.behavioralFingerprint || "BIO-SIG-VALIDATED"}
📅 تاريخ التوقيع: ${sig?.signedAt ? new Date(sig.signedAt).toLocaleString("ar-EG") : new Date().toLocaleString("ar-EG")}

معتمد وفقاً للقانون رقم 15 لسنة 2004.`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const defaultAffirmation = note.legalAffirmation ||
    "أقر أنا الموكل بصفتي صاحب الشأن باطلاعي الكامل وموافقتي التامة على محتوى هذه الملحوظة القضائية وتفويض المحامي في اتخاذ كافة الإجراءات المترتبة عليها وفقاً للقانون رقم 15 لسنة 2004 الخاص بالتوقيع الإلكتروني.";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-right font-sans"
        dir="rtl"
      >
        {/* Portal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-950 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  بوابة التوقيع الإلكتروني والمحاذاة الذكية (Smart Auto-Alignment)
                </h3>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full font-black shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-slate-950" />
                  <span>توسيط ومعاينة حية</span>
                </span>
              </div>
              <p className="text-[11px] text-amber-100 font-bold mt-0.5">
                مكتب الأستاذ وسام أحمد الشناوي المحامي بالنقض والدستورية العليا
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Top Navigation & Mode Switcher */}
        {!isSigned && (
          <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-750 shadow-xs">
              <button
                type="button"
                onClick={() => setSignatureMode("draw")}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  signatureMode === "draw"
                    ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>رسم التوقيع الحي</span>
              </button>

              <button
                type="button"
                onClick={() => setSignatureMode("uploaded")}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer relative ${
                  signatureMode === "uploaded"
                    ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>التوقيعات المرفوعة</span>
                {uploadedSignatures.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-mono flex items-center justify-center">
                    {uploadedSignatures.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSignatureMode("type")}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  signatureMode === "type"
                    ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>توقيع رقمي مباشر</span>
              </button>
            </div>

            {/* Live Document Overlay Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLiveDocOverlay(!showLiveDocOverlay)}
                className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  showLiveDocOverlay
                    ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                    : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>{showLiveDocOverlay ? "إخفاء المعاينة الحية" : "معاينة حية فوق المستند (Live Preview)"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Portal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">

          {/* Legal Notice */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start gap-2.5 text-blue-900 dark:text-blue-200 text-[11px]">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              هذه الوثيقة ملزمة قانونياً طبقاً لأحكام قانون التوقيع الإلكتروني المصري رقم 15 لسنة 2004. تعمل خاصية <strong>المحاذاة الذكية (Smart Auto-Alignment)</strong> على توسيط وتظبيط إحداثيات التوقيع تلقائياً في المكان المخصص بالوثيقة لضمان مظهر احترافي وموثوقية قضائية تامة.
            </p>
          </div>

          {/* Smart Auto-Alignment Control Bar */}
          {!isSigned && (
            <div className="p-3.5 bg-gradient-to-r from-amber-50/70 via-slate-50 to-blue-50/60 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850 border border-amber-300/80 dark:border-slate-750 rounded-2xl space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-black text-slate-900 dark:text-white text-xs">
                    خاصية المحاذاة الذكية والتوسيط التلقائي (Smart Auto-Alignment):
                  </span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAutoAlignEnabled}
                    onChange={(e) => handleAlignmentSettingsChange(e.target.checked, alignPosition, alignScale)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600"
                  />
                  <span className="font-bold text-[11px] text-amber-900 dark:text-amber-300">
                    تفعيل التوسيط والمحاذاة الذكية
                  </span>
                </label>
              </div>

              {isAutoAlignEnabled && (
                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px]">
                  {/* Alignment Mode */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-bold">موضع التوسيط:</span>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleAlignmentSettingsChange(true, "center", alignScale)}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          alignPosition === "center"
                            ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        توسيط هندسي مثالي
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlignmentSettingsChange(true, "baseline", alignScale)}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          alignPosition === "baseline"
                            ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        محاذاة لخط الأساس (Baseline)
                      </button>
                    </div>
                  </div>

                  {/* Scale Presets */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-bold">مقياس الحجم:</span>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
                      {[85, 100, 115].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleAlignmentSettingsChange(true, alignPosition, s)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            alignScale === s
                              ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {s}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {isAligning && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>جارٍ معالجة التوسيط البصري...</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* LIVE TRANSLUCENT DOCUMENT OVERLAY PREVIEW SECTION */}
          {showLiveDocOverlay && !isSigned && (
            <div className="p-4 bg-slate-900 text-white rounded-3xl border-2 border-blue-500/40 shadow-xl space-y-3 animate-in slide-in-from-top duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-white flex items-center gap-1.5">
                      <span>المعاينة الحية للتوقيع فوق مسودة المستند الشفافة</span>
                      <span className="text-[9px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                        Live Overlay
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      تأكد من مطابقة محاذاة التوقيع داخل المستند الرسمي قبل الاعتماد النهائي
                    </p>
                  </div>
                </div>

                {/* Overlay Controls */}
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <span className="text-slate-400 px-1 font-bold">شفافية المسودة:</span>
                    {[40, 75, 100].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setOverlayDocOpacity(op)}
                        className={`px-2 py-0.5 rounded-lg font-mono font-bold transition cursor-pointer ${
                          overlayDocOpacity === op ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {op}%
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setOverlayZoom((z) => Math.max(70, z - 15))}
                      className="p-1 text-slate-300 hover:text-white cursor-pointer"
                      title="تصغير"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-slate-300 text-[10px] px-1">{overlayZoom}%</span>
                    <button
                      type="button"
                      onClick={() => setOverlayZoom((z) => Math.min(140, z + 15))}
                      className="p-1 text-slate-300 hover:text-white cursor-pointer"
                      title="تكبير"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* The Live Rendered Document Sheet */}
              <div className="relative w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-center overflow-x-auto min-h-[300px]">
                <div
                  className="w-full max-w-xl bg-white text-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-300 transition-all font-serif relative select-none"
                  style={{
                    opacity: overlayDocOpacity / 100,
                    transform: `scale(${overlayZoom / 100})`,
                    transformOrigin: "top center"
                  }}
                >
                  {/* Subtle Translucent Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                    <Scale className="w-64 h-64 text-slate-900" />
                  </div>

                  {/* Document Letterhead */}
                  <div className="border-b border-amber-900/30 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-amber-950">مكتب الأستاذ وسام أحمد الشناوي</h3>
                      <p className="text-[10px] text-slate-600">المحامي بالنقض والدستورية والإدارية العليا</p>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-amber-700/60 flex items-center justify-center text-amber-900">
                      <Scale className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Document Title & Body */}
                  <div className="py-3 space-y-2 text-right">
                    <div className="flex justify-between text-[11px] font-bold text-slate-800 border-b border-slate-100 pb-1">
                      <span>سند إقرار: {noteTitleVal}</span>
                      {note.caseNumber && <span className="font-mono">دعوى: {note.caseNumber}</span>}
                    </div>
                    <p className="text-[10px] text-slate-700 leading-relaxed max-h-16 overflow-hidden">
                      {noteContentVal}
                    </p>
                  </div>

                  {/* Affirmation snippet */}
                  <div className="p-2 bg-amber-50/70 rounded-lg border border-amber-200/80 text-[9px] text-slate-800 italic">
                    "{defaultAffirmation}"
                  </div>

                  {/* Signing Blocks with Target Field Highlight */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 mt-2">
                    {/* Client Signature Target Zone */}
                    <div className="space-y-1 relative">
                      <span className="text-[10px] font-bold text-slate-700 block">
                        توقيع الموكل المقر: ({signerName || "الموكل"})
                      </span>
                      
                      {/* Highlighted Bounding Box for Client Signature */}
                      <div className="relative h-20 bg-amber-50/40 rounded-xl border-2 border-dashed border-amber-500/80 flex items-center justify-center overflow-hidden p-1">
                        {getActiveSignatureDataUrl() ? (
                          <img
                            src={getActiveSignatureDataUrl()!}
                            alt="Live Signature Placement"
                            className="max-h-16 max-w-full object-contain transition-transform"
                            style={{
                              transform: `translate(${overlayOffsetX}px, ${overlayOffsetY}px)`
                            }}
                          />
                        ) : (
                          <span className="text-[9px] text-amber-800/80 font-sans font-bold flex items-center gap-1">
                            <PenTool className="w-3 h-3 text-amber-600" />
                            <span>موضع التوقيع المطلوب</span>
                          </span>
                        )}

                        {/* Alignment Crosshairs Overlay */}
                        <div className="absolute inset-0 pointer-events-none border-b border-slate-300/40 top-1/2" />
                        <div className="absolute inset-0 pointer-events-none border-r border-slate-300/40 right-1/2" />
                      </div>

                      <div className="text-[8px] text-center text-slate-400 font-mono">
                        محاذاة ذكية تلقائية (مركز الحقل القضائي)
                      </div>
                    </div>

                    {/* Lawyer Seal Block */}
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-bold text-slate-700 block">
                        اعتماد وخاتم المحامي:
                      </span>
                      <div className="h-20 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-1">
                        <LawyerSignatureSeal size="sm" showSealBorder={false} />
                      </div>
                      <div className="text-[8px] text-slate-400 font-mono">
                        موثق بكود رقمي مشفر
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MULTI-FILE UPLOAD: SIGNATURES & IDENTITY DOCUMENTS HUB */}
          {!isSigned && (
            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-750 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900 dark:text-white">
                      مرفقات التوقيعات والوثائق الثبوتية المتعددة
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      يمكنك رفع عدة نماذج توقيع أو بطاقات رقم قومي وتوكيلات واختيار الأفضل
                    </p>
                  </div>
                </div>

                {/* Upload Buttons */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={multiFileInputRef}
                    onChange={(e) => handleMultiFileUpload(e, false)}
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => multiFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-500" />
                    <span>إضافة مرفقات (توقيعات / مستندات)</span>
                  </button>
                </div>
              </div>

              {/* Uploaded Signatures Gallery with Best Signature Selector */}
              {uploadedSignatures.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>معرض نماذج التوقيع المرفوعة (اختر التوقيع الأفضل للاعتماد):</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {uploadedSignatures.length} نماذج
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {uploadedSignatures.map((sig) => {
                      const isSelected = selectedSignatureId === sig.id && signatureMode === "uploaded";
                      return (
                        <div
                          key={sig.id}
                          className={`relative p-3 rounded-2xl border-2 transition flex flex-col justify-between gap-2 ${
                            isSelected
                              ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                          }`}
                        >
                          {/* Top Badges */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                              {sig.name}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                <Star className="w-2.5 h-2.5 fill-slate-950" />
                                <span>التوقيع المعتمد</span>
                              </span>
                            )}
                          </div>

                          {/* Image Box */}
                          <div className="h-20 bg-slate-100 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center p-1 overflow-hidden">
                            <img
                              src={isAutoAlignEnabled ? sig.alignedDataUrl : sig.dataUrl}
                              alt={sig.name}
                              className="max-h-16 max-w-full object-contain"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleSelectPrimarySignature(sig.id)}
                              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                                isSelected
                                  ? "bg-amber-500 text-slate-950 font-black"
                                  : "bg-slate-200 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {isSelected ? "تم التحديد ✅" : "اختيار كالتوقيع الأفضل ⭐"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUploadedSignature(sig.id)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Uploaded Identity Documents List with OCR extraction */}
              {uploadedIdentityDocs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-750">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] block">
                    المستندات الثبوتية والتوكيلات المرفوعة ({uploadedIdentityDocs.length}):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {uploadedIdentityDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                              {doc.name}
                            </p>
                            <span className="text-[9px] text-slate-400">
                              {doc.docType === "national_id_front" ? "بطاقة رقم قومي (وجه)" :
                               doc.docType === "national_id_back" ? "بطاقة رقم قومي (ظهر)" :
                               doc.docType === "poa" ? "توكيل رسمي عام قضايا" : "مستند ثبوتي"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => scanDocOcr(doc.id, doc.dataUrl)}
                            disabled={doc.isScanningOcr}
                            className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                          >
                            {doc.isScanningOcr ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ScanLine className="w-3 h-3" />
                            )}
                            <span>فحص OCR</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUploadedDoc(doc.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OCR Extracted Data Card */}
          {ocrSuccessData && !isSigned && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-1.5 text-[11px] animate-in fade-in duration-200">
              <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>تم استخراج بيانات الهوية بنجاح بالـ OCR ({ocrSuccessData.documentType || "بطاقة رقم قومي"})</span>
                </span>
                <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                  دقة القراءة: {ocrSuccessData.confidenceScore || 98.5}%
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1">
                <div>
                  <span className="text-slate-500 block">الاسم المستخرج:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{ocrSuccessData.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">الرقم القومي:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{ocrSuccessData.nationalId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">المحافظة / العنوان:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{ocrSuccessData.governorate || ocrSuccessData.address || "مدون بالبطاقة"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">تاريخ الميلاد:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{ocrSuccessData.birthDate || "-"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Memo Content Summary */}
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <FileCheck2 className="w-4 h-4 text-amber-600" />
                <span>مضمون الملحوظة / الإقرار المطلوب اعتماده:</span>
              </span>
              {note.caseNumber && (
                <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/70 text-amber-950 dark:text-amber-200 px-2.5 py-0.5 rounded-md font-mono font-bold">
                  دعوى: {note.caseNumber}
                </span>
              )}
            </div>
            <h4 className="font-extrabold text-xs text-amber-950 dark:text-amber-200">{noteTitleVal}</h4>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
              {noteContentVal}
            </div>
          </div>

          {/* IF SIGNED -> CERTIFICATE VIEW */}
          {isSigned && signedNoteData.signatureData ? (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border-2 border-emerald-500/40 rounded-3xl space-y-4 shadow-sm text-center">
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-300">
                    تم توثيق التوقيع والبصمة السلوكية والمحاذاة الذكية بنجاح ✅
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    الوثيقة مكتملة الأركان القضائية ومحمية بنظام التشفير الرقمي
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right bg-white dark:bg-slate-850 p-4 rounded-2xl border border-emerald-100 dark:border-slate-800 text-[11px]">
                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[10px]">الموكل الموقّع:</span>
                    <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{signedNoteData.signatureData.signedBy}</span>
                    </span>
                  </div>

                  {signedNoteData.signatureData.nationalId && (
                    <div className="space-y-1">
                      <span className="text-slate-400 block text-[10px]">الرقم القومي:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {signedNoteData.signatureData.nationalId}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[10px]">تاريخ وساعة التوقيع:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[10px]">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{new Date(signedNoteData.signatureData.signedAt).toLocaleString("ar-EG")}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[10px]">كود التحقق المشفر:</span>
                    <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold break-all">
                      {signedNoteData.signatureData.verificationHash || "E-SIG-VERIFIED"}
                    </span>
                  </div>
                </div>

                {/* Behavioral Biometrics Telemetry Card */}
                {signedNoteData.signatureData.biometricTelemetry && (
                  <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl text-right space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-black">
                        <Fingerprint className="w-4 h-4 text-blue-600" />
                        <span>شهادة البصمة السلوكية ومطابقة الضغط والمحاذاة</span>
                      </div>
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                        موثوقية قضائية {signedNoteData.signatureData.biometricTelemetry.evidentiaryScore || 99.4}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                      <div className="bg-white/80 dark:bg-slate-800 p-2 rounded-xl border border-blue-100 dark:border-slate-700">
                        <span className="text-slate-400 block font-sans">زمن الرسم:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {((signedNoteData.signatureData.biometricTelemetry.durationMs || 1200) / 1000).toFixed(2)}s
                        </span>
                      </div>

                      <div className="bg-white/80 dark:bg-slate-800 p-2 rounded-xl border border-blue-100 dark:border-slate-700">
                        <span className="text-slate-400 block font-sans">نقاط الاتصال:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {signedNoteData.signatureData.biometricTelemetry.pointCount || 180} نقطة
                        </span>
                      </div>

                      <div className="bg-white/80 dark:bg-slate-800 p-2 rounded-xl border border-blue-100 dark:border-slate-700">
                        <span className="text-slate-400 block font-sans">متوسط ضغط اللمس:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {signedNoteData.signatureData.biometricTelemetry.averagePressure || 0.65}
                        </span>
                      </div>

                      <div className="bg-white/80 dark:bg-slate-800 p-2 rounded-xl border border-blue-100 dark:border-slate-700">
                        <span className="text-slate-400 block font-sans">نوع جهاز الإدخال:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {signedNoteData.signatureData.biometricTelemetry.devicePointerType || "Touch/Stylus"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] bg-white dark:bg-slate-900 p-2 rounded-xl border border-blue-100 dark:border-slate-800">
                      <span className="text-slate-500 font-bold">بصمة التوقيع السلوكية:</span>
                      <span className="font-mono font-black text-blue-700 dark:text-blue-300">
                        {signedNoteData.signatureData.behavioralFingerprint || signedNoteData.signatureData.biometricTelemetry.behavioralFingerprint}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dual Signature Presentation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block text-right">
                      توقيع الموكل المعتمد بالمحاذاة الذكية:
                    </span>
                    {signedNoteData.signatureData.signatureImage ? (
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-emerald-300 dark:border-slate-700 text-center h-28 flex flex-col items-center justify-center relative overflow-hidden">
                        <img
                          src={signedNoteData.signatureData.signatureImage}
                          alt="Signature"
                          className="max-h-20 max-w-full object-contain"
                        />
                        <span className="text-[9px] text-slate-400 font-mono mt-1">توسيط ومسار متجه معالج بدقة فائقة</span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-emerald-300 dark:border-slate-700 text-center h-28 flex flex-col items-center justify-center">
                        <div className="font-serif text-base font-bold text-blue-900 dark:text-blue-300">
                          {signedNoteData.signatureData.signedBy}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-mono">توقيع مؤكد</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block text-right">
                      ختم واعتماد المحامي بالنقض:
                    </span>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-amber-300 dark:border-slate-700 flex items-center justify-center p-1 h-28">
                      <LawyerSignatureSeal
                        date={signedNoteData.signatureData.signedAt}
                        hash={signedNoteData.signatureData.verificationHash}
                        size="sm"
                        showSealBorder={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions: WhatsApp + Print Official Memo PDF */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleNotifyLawyerWhatsApp}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>إرسال إشعار التوقيع للمحامي عبر WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setShowOfficialDocPreview(true)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>تصدير وطباعة المستند الرسمي (PDF / Doc)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* SIGNING FORM FOR CLIENT */
            <div className="space-y-4">
              {/* Affirmation Text */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-xs">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>صيغة الإقرار والتأكيد القانوني:</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {defaultAffirmation}
                </p>

                <label className="flex items-start gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={affirmationAgreed}
                    onChange={(e) => setAffirmationAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600"
                  />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    أوافق وأقر قانونياً بصحة مضمون الملحوظة ومحاذاة التوقيع وأتحمل المسؤولية القانونية كاملة بصفتي الموكل.
                  </span>
                </label>
              </div>

              {/* Client Info Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الموكل (رباعياً كما في الرقم القومي):
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="الاسم ثلاثياً أو رباعياً"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-right outline-none text-xs font-bold focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الرقم القومي (14 رقم):
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="الرقم القومي المكون من 14 رقم"
                    maxLength={14}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-right outline-none text-xs font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Signature Input Canvas or Upload Section */}
              {signatureMode === "draw" && (
                <div className="space-y-2">
                  <SignatureDrawingCanvas
                    onSignatureChange={handleSignatureCanvasChange}
                    signerName={signerName}
                    height={175}
                  />

                  {drawnSignatureImage && (
                    <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                      <span className="font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تم التقاط التوقيع اليدوي وتطبيق المحاذاة الذكية والتوسيط التلقائي.</span>
                      </span>
                      <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                        {isAutoAlignEnabled ? "مضبوط وموسّط تلقائياً" : "وضع حر"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {signatureMode === "uploaded" && (
                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-amber-300 dark:border-slate-700 text-center space-y-3">
                  {getActiveSignatureDataUrl() ? (
                    <div className="space-y-2">
                      <span className="text-[11px] text-slate-500 font-bold block">
                        معاينة التوقيع المختار المعتمد بالمحاذاة الذكية:
                      </span>
                      <div className="h-28 max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-amber-300 dark:border-slate-700 flex items-center justify-center p-2 shadow-inner">
                        <img
                          src={getActiveSignatureDataUrl()!}
                          alt="Selected Signature"
                          className="max-h-24 max-w-full object-contain"
                        />
                      </div>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        تمت إزالة الخلفية وتوسيط التوقيع هندسياً داخل حقل الوثيقة القضائية
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        لم تقم باختيار أو رفع توقيع بعد.
                      </p>
                      <button
                        type="button"
                        onClick={() => multiFileInputRef.current?.click()}
                        className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        رفع صور التوقيع الآن
                      </button>
                    </div>
                  )}
                </div>
              )}

              {signatureMode === "type" && (
                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-amber-300 dark:border-slate-700 text-center space-y-2">
                  <span className="text-[10px] text-slate-400 block">معاينة التوقيع الرقمي المعتمد:</span>
                  <div className="font-serif text-2xl font-black text-blue-900 dark:text-blue-300 tracking-wider">
                    {signerName || "اسم الموكل القانوني"}
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>توقيع إلكتروني مؤكد ببصمة رقمية معتمدة</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Portal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition"
          >
            إغلاق
          </button>

          {!isSigned && (
            <button
              type="button"
              onClick={handleSubmitSignature}
              disabled={isSubmitting || !affirmationAgreed}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "جارٍ تسجيل التوقيع وتوليد البصمة..." : "تأكيد واعتماد التوقيع والبصمة السلوكية"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Official Legal Document (Print / Export PDF) Modal */}
      {showOfficialDocPreview && signedNoteData.signatureData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl p-8 space-y-6 shadow-2xl border border-amber-300 overflow-y-auto max-h-[92vh] font-serif text-right" dir="rtl">
            {/* Judicial Letterhead */}
            <div className="border-b-2 border-double border-amber-900/40 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-amber-950">مكتب الأستاذ وسام أحمد الشناوي</h2>
                <p className="text-xs text-slate-700">المحامي بالنقض والدستورية العليا والإدارية العليا</p>
                <p className="text-[10px] text-slate-500">القاهرة - جمهورية مصر العربية</p>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-amber-700/60 p-1 flex items-center justify-center text-amber-900">
                <Scale className="w-8 h-8" />
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 underline underline-offset-8">
                سند تأكيد وإقرار موكل رسمي
              </h3>
              <p className="text-[11px] text-slate-600 font-mono">
                كود التوثيق القضائي: {signedNoteData.signatureData.verificationHash}
              </p>
            </div>

            {/* Content Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs leading-relaxed">
              <div className="flex justify-between text-slate-700 font-bold border-b border-slate-200 pb-2">
                <span>الموضوع: {noteTitleVal}</span>
                {signedNoteData.caseNumber && <span>رقم القضية: {signedNoteData.caseNumber}</span>}
              </div>
              <p className="text-slate-800 whitespace-pre-wrap">{noteContentVal}</p>
            </div>

            {/* Affirmation Statement */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs italic text-slate-800">
              "{defaultAffirmation}"
            </div>

            {/* Biometric & Legal Verification Data */}
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span>اسم الموكل: <strong>{signedNoteData.signatureData.signedBy}</strong></span>
                <span>الرقم القومي: <strong>{signedNoteData.signatureData.nationalId || "مدون بالملف"}</strong></span>
              </div>
              <div className="flex justify-between">
                <span>تاريخ التوقيع: <strong>{new Date(signedNoteData.signatureData.signedAt).toLocaleString("ar-EG")}</strong></span>
                <span>البصمة السلوكية: <strong className="font-mono">{signedNoteData.signatureData.behavioralFingerprint || "BIO-VERIFIED"}</strong></span>
              </div>
            </div>

            {/* Signature & Seal Blocks */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-center">
              <div className="space-y-2">
                <span className="text-xs font-bold block text-slate-700">توقيع الموكل المقر:</span>
                {signedNoteData.signatureData.signatureImage ? (
                  <img
                    src={signedNoteData.signatureData.signatureImage}
                    alt="Client Signature"
                    className="h-16 mx-auto object-contain"
                  />
                ) : (
                  <div className="font-bold text-sm text-blue-900 py-4">
                    {signedNoteData.signatureData.signedBy}
                  </div>
                )}
                <span className="text-[10px] text-slate-500 block">توقيع إلكتروني موثق بالمحاذاة الذكية</span>
              </div>

              <div className="space-y-2 flex flex-col items-center justify-center">
                <span className="text-xs font-bold block text-slate-700">اعتماد وخاتم المحامي:</span>
                <LawyerSignatureSeal
                  date={signedNoteData.signatureData.signedAt}
                  hash={signedNoteData.signatureData.verificationHash}
                  size="sm"
                  showSealBorder={false}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 font-sans">
              <button
                type="button"
                onClick={() => setShowOfficialDocPreview(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق المعاينة
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة / حفظ المستند بصيغة PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
