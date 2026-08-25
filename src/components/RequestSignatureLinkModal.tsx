import React, { useState } from "react";
import { GoogleKeepNote, requestSignatureForKeepMemo, buildConfirmationLink } from "../utils/workspaceService";
import { ClientProfile, CaseRecord, PlatformUser } from "../types";
import {
  SendHorizontal,
  Copy,
  Check,
  Share2,
  QrCode,
  Link2,
  FileCheck2,
  X,
  Clock,
  ShieldCheck,
  Sparkles,
  Smartphone,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import LawyerSignatureSeal from "./LawyerSignatureSeal";

interface RequestSignatureLinkModalProps {
  note: GoogleKeepNote;
  clients: ClientProfile[];
  cases: CaseRecord[];
  currentUser?: PlatformUser;
  isOpen: boolean;
  onClose: () => void;
  onRequestCompleted: (updatedNote: GoogleKeepNote) => void;
  onOpenClientSigningView?: (note: GoogleKeepNote) => void;
}

export default function RequestSignatureLinkModal({
  note,
  clients,
  cases,
  currentUser,
  isOpen,
  onClose,
  onRequestCompleted,
  onOpenClientSigningView
}: RequestSignatureLinkModalProps) {
  const [selectedClientId, setSelectedClientId] = useState(note.clientId || "");
  const [clientName, setClientName] = useState(note.clientName || "");
  const [clientPhone, setClientPhone] = useState(note.clientPhone || "");
  const [caseNumber, setCaseNumber] = useState(note.caseNumber || "");
  const [legalAffirmation, setLegalAffirmation] = useState(
    note.legalAffirmation ||
    "أقر أنا الموكل بصفتي صاحب الشأن باطلاعي الكامل وموافقتي التامة على محتوى هذه الملحوظة القضائية وتفويض المحامي في اتخاذ كافة الإجراءات المترتبة عليها وفقاً للقانون رقم 15 لسنة 2004."
  );
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isGenerated, setIsGenerated] = useState(!!note.confirmationLink);

  if (!isOpen) return null;

  const currentToken = note.confirmationToken || "SIG-" + Math.random().toString(36).substring(2, 9).toUpperCase();
  const confirmationLink = note.confirmationLink || buildConfirmationLink(note.id, currentToken);

  const handleSelectClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find(c => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientPhone(found.phone || "");
    }
  };

  const handleSaveAndGenerateLink = () => {
    if (!clientName.trim()) {
      alert("يرجى تحديد أو إدخال اسم الموكل المطلوب توقيعه.");
      return;
    }

    const token = note.confirmationToken || "SIG-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const link = buildConfirmationLink(note.id, token);
    const now = new Date().toISOString();

    let updated = requestSignatureForKeepMemo(note.id, {
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      caseNumber: caseNumber.trim(),
      legalAffirmation: legalAffirmation.trim(),
      requestedBy: "lawyer"
    });

    // Also update in law_clientNotes if present
    try {
      const savedNotes = localStorage.getItem("law_clientNotes");
      if (savedNotes) {
        const list = JSON.parse(savedNotes);
        const idx = list.findIndex((n: any) => n.id === note.id);
        if (idx !== -1) {
          const existingHistory = list[idx].signatureHistory || [];
          list[idx] = {
            ...list[idx],
            requiresSignature: true,
            signatureStatus: "pending",
            signatureRequestedBy: "lawyer",
            signatureRequestedAt: now,
            confirmationToken: token,
            confirmationLink: link,
            clientName: clientName.trim(),
            clientPhone: clientPhone.trim(),
            legalAffirmation: legalAffirmation.trim(),
            signatureHistory: [
              ...existingHistory,
              {
                timestamp: now,
                action: "طلب توقيع رقمي وإصدار رابط تأكيد",
                performedBy: "الأستاذ المحامي (المحامي)",
                status: "pending",
                notes: `تم توليد رابط التأكيد القانوني للموكل: ${clientName.trim()}`
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
      console.error("Error updating clientNotes:", e);
    }

    if (!updated) {
      updated = {
        ...note,
        requiresSignature: true,
        signatureStatus: "pending",
        signatureRequestedBy: "lawyer",
        signatureRequestedAt: now,
        confirmationToken: token,
        confirmationLink: link,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        caseNumber: caseNumber.trim(),
        legalAffirmation: legalAffirmation.trim()
      } as any;
    }

    setIsGenerated(true);
    onRequestCompleted(updated as any);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(confirmationLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const noteTitleDisplay = (note as any).title || (note as any).category || "ملحوظة قضائية";
  const noteContentDisplay = (note as any).content || (note as any).text || "";

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`🏛️ *طلب توقيع وتأكيد إلكتروني قانوني عاجل*
من: مكتب الأستاذ المحامي المحامي بالنقض والدستورية العليا
إلى: الموكل الفاضل / ${clientName || "صاحب الشأن"}

📌 *موضوع الملحوظة / الإقرار:*
"${noteTitleDisplay}"

⚖️ *التفاصيل:*
${noteContentDisplay.substring(0, 120)}...

🔗 *رابط التأكيد والتوقيع الإلكتروني المباشر:*
${confirmationLink}

يرجى الضغط على الرابط أعلاه لتسجيل توقيعك وبصمتك الرقمية للاعتماد وتقديمها بالجلسة الرسمية.
شكراً لثقتكم الغالية.`);

    const phoneClean = clientPhone.replace(/\D/g, "");
    window.open(`https://wa.me/${phoneClean ? (phoneClean.startsWith("2") ? phoneClean : "2" + phoneClean) : ""}?text=${text}`, "_blank");
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(confirmationLink)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-right font-sans"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black flex items-center gap-2">
                <span>طلب التوقيع الرقمي وإصدار رابط التأكيد القانوني</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                  تأكيد موكل
                </span>
              </h3>
              <p className="text-[11px] text-amber-100/90 font-medium">
                إرسال رابط توقيع إلكتروني مشفر للموكل مع تتبع حالة التوقيع آلياً
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Note Info Card */}
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-amber-600" />
                <span>الملحوظة القانونية موضوع التوقيع:</span>
              </span>
              <span className="text-[10px] bg-amber-200/70 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 px-2.5 py-0.5 rounded-md font-bold">
                {note.tags?.[0] || "مذكرة"}
              </span>
            </div>
            <p className="font-black text-xs text-amber-950 dark:text-amber-200">{note.title}</p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
              {note.content}
            </p>
          </div>

          {/* Configuration Form */}
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اختر الموكل من السجل:
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleSelectClientChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-right outline-none text-xs font-bold"
                >
                  <option value="">-- اختر من قائمة الموكلين --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || "بدون هاتف"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الموكل رباعياً (المطلوب توقيعه):
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="الاسم بالكامل كما في التوكيل"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-right outline-none text-xs font-bold focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الهاتف (لإرسال الرابط عبر واتساب):
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="مثال: 01012345678"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-right outline-none text-xs font-mono focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  القضية المرتبطة (اختياري):
                </label>
                <select
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-right outline-none text-xs"
                >
                  <option value="">-- بدون ربط بقضية --</option>
                  {cases.map((cs) => (
                    <option key={cs.id} value={`${cs.caseNumber} لسنة ${cs.caseYear} - ${cs.competentCourt}`}>
                      {cs.caseNumber} لسنة {cs.caseYear} ({cs.clientName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                صيغة الإقرار والتأكيد القانوني المعتمدة:
              </label>
              <textarea
                value={legalAffirmation}
                onChange={(e) => setLegalAffirmation(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-right outline-none text-[11px] leading-relaxed focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Generated Legal Confirmation Link Box */}
          <div className="p-4 bg-gradient-to-br from-amber-500/10 via-slate-900/5 to-slate-900/10 dark:from-amber-950/30 dark:to-slate-850 rounded-2xl border-2 border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-amber-600" />
                <span>رابط التأكيد والتوقيع القانوني للموكل:</span>
              </span>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
                حالة: بانتظار التوقيع
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={confirmationLink}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-left font-mono text-[11px] text-slate-700 dark:text-slate-300 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 shrink-0 transition cursor-pointer ${
                  copiedLink
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs"
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الرابط</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>إرسال الرابط عبر WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-500" />
                  <span>{showQrCode ? "إخفاء رمز QR" : "عرض رمز QR"}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleSaveAndGenerateLink();
                  onOpenClientSigningView(note);
                }}
                className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-blue-900 dark:text-blue-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>معاينة وتوقيع الرابط الآن</span>
              </button>
            </div>

            {/* QR Code Section */}
            {showQrCode && (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2 animate-in zoom-in-95 duration-150">
                <span className="text-[10px] text-slate-500 font-bold block">
                  امسح رمز الاستجابة السريعة (QR) بكاميرا هاتف الموكل لفتح صفحة التوقيع مباشرة:
                </span>
                <img
                  src={qrImageUrl}
                  alt="QR Code for Legal Signature"
                  className="w-36 h-36 mx-auto rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white"
                />
                <span className="text-[9px] font-mono text-slate-400 block break-all">
                  {confirmationLink}
                </span>
              </div>
            )}
          </div>

          {/* Lawyer Official Seal Preview */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <span className="text-[11px] font-black text-slate-900 dark:text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>الاعتماد والختم القانوني للمكتب:</span>
              </span>
              <p className="text-[10px] text-slate-500">
                يتم إرفاق توقيع وختم الأستاذ المحامي المحامي بالنقض تلقائياً على شهادة التأكيد.
              </p>
            </div>
            <LawyerSignatureSeal size="sm" showSealBorder={false} />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSaveAndGenerateLink}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
          >
            <Check className="w-4 h-4" />
            <span>حفظ طلب التوقيع وتحديث السجل</span>
          </button>
        </div>
      </div>
    </div>
  );
}
