import React, { useState } from "react";
import { ShieldAlert, Sparkles, Copy, Check, FileText, AlertTriangle, Scale, Bookmark, RefreshCw } from "lucide-react";
import Markdown from "react-markdown";

interface OcrLegalFlawsAnalysisProps {
  extractedText: string;
  onOpenInEditor?: (text: string, title?: string) => void;
}

export default function OcrLegalFlawsAnalysis({
  extractedText,
  onOpenInEditor
}: OcrLegalFlawsAnalysisProps) {
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunAnalysis = async () => {
    if (!extractedText.trim()) {
      alert("يرجى استخراج النص من المستندات أولاً لإجراء الفحص والتحليل القانوني.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/ocr-deep-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText })
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data.analysis || "لم يتمكن المحرك من إنشاء التقرير.");
      } else {
        alert("فشل التحليل القانوني الذكي. يرجى المحاولة لاحقاً.");
      }
    } catch (e: any) {
      console.error(e);
      alert("خطأ أثناء الاتصال بالخادم: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>الفحص القضائي المعمق ورصد الثغرات الإجرائية (AI Legal Flaws & Defense Hub)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono">
                DEEP DEFENSE MATRIX
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              استخراج بطلان الإعلانات، المواعيد الحتمية، مخالفة قواعد الاختصاص، وخطة الدفاع الإستراتيجية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAnalysis}
            disabled={isLoading || !extractedText}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "جارٍ الفحص والاستنباط..." : "تشغيل فحص الثغرات والدفاع"}</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Body */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            يقوم الذكاء الاصطناعي بمطابقة نصوص المستند مع التشريعات وقانون الإجراءات ورصد المواعيد والبطلان...
          </p>
        </div>
      ) : analysisResult ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-rose-500">
              <Scale className="w-4 h-4" />
              <span>تقرير الفحص والاستراتيجية القضائية جاهز</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 rounded-lg text-slate-700 dark:text-slate-200 transition flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "تم النسخ" : "نسخ التقرير"}</span>
              </button>

              {onOpenInEditor && (
                <button
                  onClick={() => onOpenInEditor(analysisResult, "تقرير فحص الثغرات والخطة الدفاعية")}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition flex items-center gap-1 text-[11px] font-bold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>فتح في المحرر</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs leading-relaxed max-h-[500px] overflow-y-auto space-y-3 font-sans">
            <Markdown>{analysisResult}</Markdown>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            اضغط على "تشغيل فحص الثغرات والدفاع" لبدء استخراج أوجه البطلان والمواعيد ومذكرة الدفوع الجوهرية.
          </p>
          <p className="text-[11px] text-slate-500">
            يقوم النظام بفحص سلامة الإعلانات القضائية، مواعيد الطعن، ومطابقة الاختصاص الولائي والنوعي
          </p>
        </div>
      )}
    </div>
  );
}
