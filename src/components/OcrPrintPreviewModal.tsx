import React, { useRef } from "react";
import { Printer, Download, X, Scale, FileText, CheckCircle2 } from "lucide-react";
import GoldenEagleEmblem from "./GoldenEagleEmblem";
import { PlatformUser } from "../types";

interface OcrPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  currentUser: PlatformUser;
  caseNumber?: string;
  caseYear?: string;
  courtName?: string;
  clientName?: string;
  opponentName?: string;
  documentTitle?: string;
}

export default function OcrPrintPreviewModal({
  isOpen,
  onClose,
  text,
  currentUser,
  caseNumber,
  caseYear,
  courtName,
  clientName,
  opponentName,
  documentTitle = "محرر مستخرج وموثق من المسح الضوئي الذكي"
}: OcrPrintPreviewModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDoc = () => {
    const header = `جمهورية مصر العربية\nمكتب الأستاذ / وسام الشناوي\nالمحامي بالاستئناف العالي ومجلس الدولة\n---------------------------------------\n${documentTitle}\nالقضية رقم: ${caseNumber || "..."} لسنة ${caseYear || "2026"} - ${courtName || "..."}\nالموكل: ${clientName || "..."}\nالخصم: ${opponentName || "..."}\n---------------------------------------\n\n`;
    const fullContent = header + text;
    const blob = new Blob([fullContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle.replace(/\s+/g, "_")}_${Date.now()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                معاينة الطباعة القضائية الرسمية (Official Judicial Print Layout)
              </h3>
              <p className="text-[11px] text-slate-500">
                ترويسة المحاماة، نسر الدولة، خانات التوثيق والتوقيع الرسمية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDoc}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل ملف Word / DOC</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة فورية</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            ref={printAreaRef}
            className="w-full max-w-[800px] bg-white text-slate-950 p-8 sm:p-12 shadow-xl border border-slate-300 rounded-lg min-h-[950px] relative font-serif text-right space-y-6"
          >
            {/* Watermark Emblem */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <GoldenEagleEmblem className="w-96 h-96" />
            </div>

            {/* Official Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">جمهورية مصر العربية</p>
                <h2 className="text-lg font-black tracking-tight text-slate-950">
                  مكتب الأستاذ / وسام الشناوي
                </h2>
                <p className="text-xs font-bold text-slate-700">
                  المحامي بالنقض والدستورية العليا ومجلس الدولة
                </p>
                <p className="text-[11px] text-slate-600">
                  هاتف: 01002345678 | القاهرة - الجيزة
                </p>
              </div>

              <div className="flex flex-col items-center">
                <GoldenEagleEmblem className="w-16 h-16" />
                <span className="text-[9px] font-black tracking-widest text-slate-800 mt-1 uppercase">
                  LEGAL PRACTICE
                </span>
              </div>
            </div>

            {/* Document Context Header */}
            {(caseNumber || clientName) && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  {caseNumber && (
                    <span className="font-bold">
                      القضية رقم: <strong className="font-mono">{caseNumber}</strong> لسنة <strong>{caseYear || "2026"}</strong>
                    </span>
                  )}
                  {courtName && <span>أمام: <strong>{courtName}</strong></span>}
                </div>
                <div className="flex justify-between text-slate-700">
                  {clientName && <span>الموكل (الطالب): <strong>{clientName}</strong></span>}
                  {opponentName && <span>الخصم (المعلن إليه): <strong>{opponentName}</strong></span>}
                </div>
              </div>
            )}

            {/* Document Title */}
            <div className="text-center py-2">
              <h3 className="text-base font-black underline underline-offset-8 text-slate-950 inline-block">
                {documentTitle}
              </h3>
            </div>

            {/* Document Extracted Text Content */}
            <div className="text-sm leading-loose whitespace-pre-wrap text-slate-900 min-h-[400px]">
              {text || "لا يوجد نص متاح للطباعة."}
            </div>

            {/* Official Signature Box */}
            <div className="pt-12 border-t border-slate-300 flex justify-between items-end text-xs">
              <div className="text-center space-y-1">
                <p className="font-bold text-slate-600">خاتم وتوثيق المكتب</p>
                <div className="w-24 h-24 border border-dashed border-slate-300 rounded-full flex items-center justify-center text-[10px] text-slate-400">
                  ختم النسر / القيد
                </div>
              </div>

              <div className="text-center space-y-3">
                <p className="font-bold text-slate-800">وكيل الموكل / المستشار القانوني</p>
                <div className="pt-4 font-black text-sm text-slate-950 font-serif">
                  وسام الشناوي (المحامي)
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  حرر في: {new Date().toLocaleDateString("ar-EG")}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>تم إعداد وتنسيق المحرر عبر منظومة Smart OCR القانونية</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
