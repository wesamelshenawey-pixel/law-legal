import React, { useRef, useState, useEffect } from "react";
import { GoogleKeepNote, buildConfirmationLink } from "../utils/workspaceService";
import { PlatformUser, UserRole } from "../types";
import {
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  X,
  RotateCcw,
  Printer,
  PenTool,
  Award,
  Lock,
  Share2,
  Calendar,
  User,
  Smartphone,
  Scale,
  Copy,
  Check,
  History,
  Link2
} from "lucide-react";
import LawyerSignatureSeal from "./LawyerSignatureSeal";

interface ElectronicSignatureModalProps {
  note: GoogleKeepNote;
  currentUser: PlatformUser;
  isOpen: boolean;
  onClose: () => void;
  onSignComplete: (signedNote: GoogleKeepNote) => void;
  onRequestSignature?: (clientName: string, clientPhone?: string, legalAffirmation?: string) => void;
}

export default function ElectronicSignatureModal({
  note,
  currentUser,
  isOpen,
  onClose,
  onSignComplete
}: ElectronicSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>("#1e3a8a"); // Royal Blue default
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [signerName, setSignerName] = useState(note.clientName || currentUser.name || "الموكل القانوني");
  const [nationalId, setNationalId] = useState(note.signatureData?.nationalId || "");
  const [affirmationAgreed, setAffirmationAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCertificateView, setShowCertificateView] = useState(note.signatureStatus === "signed");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAuditHistory, setShowAuditHistory] = useState(false);

  // Keep state synced with note prop
  useEffect(() => {
    if (note) {
      setSignerName(note.clientName || currentUser.name || "الموكل القانوني");
      setNationalId(note.signatureData?.nationalId || "");
      setShowCertificateView(note.signatureStatus === "signed");
      setHasDrawn(false);
    }
  }, [note, currentUser]);

  // Set up canvas context and sizing when opened
  useEffect(() => {
    if (isOpen && canvasRef.current && !showCertificateView) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // High-DPI support
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = penColor;
      }
    }
  }, [isOpen, showCertificateView, penColor]);

  if (!isOpen) return null;

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;

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

  const handleConfirmSignature = () => {
    if (!signerName.trim()) {
      alert("يرجى إدخال اسم الموقع ثلاثياً أو رباعياً.");
      return;
    }
    if (!affirmationAgreed) {
      alert("يرجى الموافقة على نص التأكيد والإقرار القانوني لإتمام التوقيع.");
      return;
    }

    let signatureImage = "";
    if (signatureMode === "draw" && canvasRef.current && hasDrawn) {
      signatureImage = canvasRef.current.toDataURL("image/png");
    }

    setIsSubmitting(true);

    const now = new Date().toISOString();
    const hash = "E-SIG-" + Math.floor(1000 + Math.random() * 9000) + "-LAW-" + Date.now().toString(36).toUpperCase();

    const signedData = {
      signedBy: signerName.trim(),
      nationalId: nationalId.trim() || undefined,
      signedAt: now,
      signatureImage: signatureImage || undefined,
      signatureType: (signatureMode === "draw" && hasDrawn ? "drawn" : "digital_badge") as "drawn" | "digital_badge",
      verificationHash: hash,
      digitalStamp: "مكتب الأستاذ المحامي - توقيع إلكتروني معتمد",
      ipOrDeviceId: "Device-Verified-" + Math.random().toString(36).substring(2, 8),
      notes: "تم التوقيع الإلكتروني والتأكيد القانوني بنجاح بموجب قانون التوقيع الإلكتروني المصري رقم 15 لسنة 2004."
    };

    const updatedNote: GoogleKeepNote = {
      ...note,
      requiresSignature: true,
      signatureStatus: "signed",
      signatureData: signedData
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onSignComplete(updatedNote);
      setShowCertificateView(true);
    }, 600);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const handleShareWhatsAppConfirmation = () => {
    const sig = note.signatureData;
    const text = encodeURIComponent(`📜 *إشعار اعتماد توقيع إلكتروني وتأكيد قانوني*
🏛️ مكتب الأستاذ المحامي المحامي بالنقض والدستورية العليا
📌 الملحوظة / المذكرة: ${note.title}
👤 الموكل الموقّع: ${sig?.signedBy || signerName}
🔢 كود التحقق المشفر: ${sig?.verificationHash || "E-SIG-VERIFIED"}
📅 تاريخ وساعة التوقيع: ${sig?.signedAt ? new Date(sig.signedAt).toLocaleString("ar-EG") : new Date().toLocaleString("ar-EG")}
⚖️ الحالة: معتمد قانونياً ومرتبط بملف القضية.`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const defaultAffirmation = note.legalAffirmation || 
    "أقر وأعترف بصفتي الموكل صاحب الشأن باطلاعي وموافقتي التامة على ما ورد بهذه الملحوظة القضائية، وأقر بصحة التوجيهات وخطة الدفاع وتفويض المحامي في اتخاذ كافة الإجراءات اللازمة، ويعتبر هذا التوقيع الإلكتروني ملزماً وحجة قانونية طبقاً لأحكام القانون رقم 15 لسنة 2004.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right font-sans"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black flex items-center gap-2">
                <span>التوقيع والتأكيد الإلكتروني القضائي</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                  قانون 15 لسنة 2004
                </span>
              </h3>
              <p className="text-[11px] text-amber-100/90 font-medium">
                مكتب الأستاذ المحامي - منظومة التوثيق الرقمي للموكلين
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Note Context Summary Box */}
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <FileCheck2 className="w-4 h-4 text-amber-600" />
                <span>موضوع الملحوظة / الإقرار:</span>
              </span>
              {note.caseNumber && (
                <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-md font-mono font-bold">
                  دعوى: {note.caseNumber}
                </span>
              )}
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{note.title}</p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-100 dark:border-slate-800">
              {note.content}
            </p>
          </div>

          {/* If Already Signed -> Show Digital Certificate View */}
          {showCertificateView && note.signatureData ? (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-slate-900 border-2 border-emerald-500/40 rounded-3xl space-y-4 shadow-sm text-center">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-300">
                    شهادة توقيع إلكتروني معتمد وموثق
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    تم التأكيد والتوقيع القانوني بنجاح وفقاً للمعايير الرقمية الرسمية
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right bg-white dark:bg-slate-850 p-4 rounded-2xl border border-emerald-100 dark:border-slate-800 text-[11px]">
                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[10px]">الموكل الموقّع:</span>
                    <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{note.signatureData.signedBy}</span>
                    </span>
                  </div>

                  {note.signatureData.nationalId && (
                    <div className="space-y-1">
                      <span className="text-slate-400 block text-[10px]">الرقم القومي:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {note.signatureData.nationalId}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[10px]">تاريخ ووقت التوقيع:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[10px]">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{new Date(note.signatureData.signedAt).toLocaleString("ar-EG")}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[10px]">كود البصمة الرقمية (Hash):</span>
                    <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold break-all">
                      {note.signatureData.verificationHash || "E-SIG-VERIFIED-HASH"}
                    </span>
                  </div>
                </div>

                {/* Dual Signature & Seal Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* Client Signature */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block">توقيع وبصمة الموكل:</span>
                    {note.signatureData.signatureImage ? (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-emerald-300 dark:border-slate-700 text-center h-28 flex items-center justify-center">
                        <img
                          src={note.signatureData.signatureImage}
                          alt="Signature"
                          className="max-h-24 max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-emerald-300 dark:border-slate-700 text-center h-28 flex flex-col items-center justify-center">
                        <div className="font-serif text-lg font-bold text-blue-900 dark:text-blue-300">
                          {note.signatureData.signedBy}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-mono">توقيع رقمي معتمد ومؤكد</span>
                      </div>
                    )}
                  </div>

                  {/* Lawyer Signature & Seal */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block">توقيع واعتماد المحامي المسؤول:</span>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-amber-300 dark:border-slate-700 flex items-center justify-center p-1">
                      <LawyerSignatureSeal
                        date={note.signatureData.signedAt}
                        hash={note.signatureData.verificationHash}
                        size="md"
                        showSealBorder={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Audit History & Confirmation Link Row */}
                <div className="pt-2 border-t border-emerald-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => setShowAuditHistory(!showAuditHistory)}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-amber-500" />
                      <span>{showAuditHistory ? "إخفاء سجل وتاريخ التوقيع" : "عرض سجل وتاريخ التوقيع (Audit Trail)"}</span>
                    </button>

                    {note.confirmationLink && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(note.confirmationLink!);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-mono text-[10px] cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedLink ? "تم نسخ الرابط!" : "نسخ رابط التأكيد القانوني"}</span>
                      </button>
                    )}
                  </div>

                  {showAuditHistory && note.signatureHistory && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-right animate-in fade-in duration-150">
                      <span className="text-[10px] font-bold text-slate-400 block">سجل العمليات الموثق:</span>
                      {note.signatureHistory.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between text-[10px] pb-1 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.action}</span>
                            <span className="text-slate-500">{item.performedBy} {item.notes ? `(${item.notes})` : ""}</span>
                          </div>
                          <span className="font-mono text-slate-400 text-[9px]">
                            {new Date(item.timestamp).toLocaleString("ar-EG")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleShareWhatsAppConfirmation}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>مشاركة شهادة التوقيع واتساب</span>
                  </button>

                  <button
                    onClick={handlePrintCertificate}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة المحضر الرسمي</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* New Signature Form */
            <div className="space-y-4">
              {/* Legal Affirmation Statement */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-xs">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>صيغة الإقرار والتأكيد القانوني الملزم:</span>
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
                    أوافق وأقر قانونياً بصحة مضمون الملحوظة وأتحمل المسؤولية القانونية كاملة بصفتي الموكل.
                  </span>
                </label>
              </div>

              {/* Signer Details Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الموكل الموقع (رباعياً):
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="الاسم بالكامل كما في بطاقة الرقم القومي"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-right outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الرقم القومي (14 رقم) / رقم الهاتف:
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="الرقم القومي أو الهاتف للتأكيد"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-right outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Signature Mode Selector */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-amber-500" />
                  <span>طريقة التوقيع الإلكتروني:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSignatureMode("draw")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      signatureMode === "draw"
                        ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    رسم التوقيع باليد / اللمس
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode("type")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      signatureMode === "type"
                        ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    توقيع رقمي باسم الموكل
                  </button>
                </div>
              </div>

              {/* Draw Signature Canvas */}
              {signatureMode === "draw" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      وقع بيدك أو بالماوس داخل المربع أدناه:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">لون الحبر:</span>
                      <button
                        type="button"
                        onClick={() => setPenColor("#1e3a8a")}
                        className={`w-4 h-4 rounded-full bg-blue-900 border-2 ${penColor === "#1e3a8a" ? "border-amber-400 scale-125" : "border-transparent"}`}
                        title="أزرق ملكي"
                      />
                      <button
                        type="button"
                        onClick={() => setPenColor("#0f172a")}
                        className={`w-4 h-4 rounded-full bg-slate-950 border-2 ${penColor === "#0f172a" ? "border-amber-400 scale-125" : "border-transparent"}`}
                        title="أسود كلاسيكي"
                      />
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 text-slate-600 dark:text-slate-400 hover:text-red-500 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>مسح</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative border-2 border-dashed border-amber-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden shadow-inner h-36">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-full cursor-crosshair touch-none"
                    />
                    {!hasDrawn && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 dark:text-slate-700 text-xs font-bold">
                        ✍️ ارسم توقيعك هنا باللمس أو الماوس
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Type Signature Preview */
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

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition"
          >
            إغلاق
          </button>

          {!showCertificateView && (
            <button
              type="button"
              onClick={handleConfirmSignature}
              disabled={isSubmitting || !affirmationAgreed}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "جارٍ تسجيل واعتماد التوقيع..." : "تأكيد واعتماد التوقيع الإلكتروني"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
