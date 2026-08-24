import React, { useState } from "react";
import { FileCheck2, Sparkles, Copy, Check, FileText, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import Markdown from "react-markdown";

interface OcrContractClausesAnalysisProps {
  extractedText: string;
  onOpenInEditor?: (text: string, title?: string) => void;
}

export default function OcrContractClausesAnalysis({
  extractedText,
  onOpenInEditor
}: OcrContractClausesAnalysisProps) {
  const [clausesResult, setClausesResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunClausesAnalysis = async () => {
    if (!extractedText.trim()) {
      alert("يرجى استخراج النص من المستندات أولاً لتحليل بنود العقد.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/ocr-clauses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText })
      });

      if (res.ok) {
        const data = await res.json();
        setClausesResult(data.clausesReport || "لم يتمكن المحرك من إنشاء تقرير بنود العقد.");
      } else {
        alert("فشل تحليل بنود العقد بالذكاء الاصطناعي.");
      }
    } catch (e: any) {
      console.error(e);
      alert("خطأ في الاتصال بالخادم: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!clausesResult) return;
    navigator.clipboard.writeText(clausesResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>تحليل وتفكيك بنود العقود والاشتراطات المجحفة (Contract Clauses & Risk Matrix)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono">
                CLAUSE AUDITOR
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              استخراج الشروط الجزائية، فض النزاعات، التحكيم، وبنود الفسخ التلقائي لحماية الموكل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunClausesAnalysis}
            disabled={isLoading || !extractedText}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "جارٍ تحليل البنود..." : "تشغيل تدقيق بنود العقد"}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            جارٍ فحص التزامات الأطراف واستخراج الشروط الجزائية والبنود المحتاجة لتعديل فوري...
          </p>
        </div>
      ) : clausesResult ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-indigo-500">
              <ShieldCheck className="w-4 h-4" />
              <span>تقرير تدقيق بنود العقد والتقييم الوقائي جاهز</span>
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
                  onClick={() => onOpenInEditor(clausesResult, "تقرير تدقيق بنود العقد والمخاطر")}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-1 text-[11px] font-bold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>فتح في المحرر</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs leading-relaxed max-h-[500px] overflow-y-auto space-y-3 font-sans">
            <Markdown>{clausesResult}</Markdown>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <AlertCircle className="w-8 h-8 mx-auto text-indigo-500" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            اضغط على "تشغيل تدقيق بنود العقد" لتبويب الالتزامات والشرط الجزائي وشروط الفسخ والتحكيم.
          </p>
        </div>
      )}
    </div>
  );
}
