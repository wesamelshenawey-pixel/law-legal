import React, { useState } from "react";
import { GitCompare, Sparkles, Copy, Check, FileText, RefreshCw, AlertCircle, ArrowLeftRight } from "lucide-react";
import Markdown from "react-markdown";

interface OcrDocumentComparatorProps {
  currentExtractedText: string;
  onOpenInEditor?: (text: string, title?: string) => void;
}

export default function OcrDocumentComparator({
  currentExtractedText,
  onOpenInEditor
}: OcrDocumentComparatorProps) {
  const [doc1Text, setDoc1Text] = useState(currentExtractedText);
  const [doc2Text, setDoc2Text] = useState("");
  const [doc1Label, setDoc1Label] = useState("المستند الأول (النسخة الأصلية / الحكم الابتدائي)");
  const [doc2Label, setDoc2Label] = useState("المستند الثاني (النسخة المعدلة / صحيفة الاستئناف)");
  const [comparisonResult, setComparisonResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunComparison = async () => {
    if (!doc1Text.trim() || !doc2Text.trim()) {
      alert("يرجى إدخال نص المستندين الأول والثاني للمقارنة.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/ocr-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc1: doc1Text,
          doc2: doc2Text,
          doc1Label,
          doc2Label
        })
      });

      if (res.ok) {
        const data = await res.json();
        setComparisonResult(data.comparison || "لم يتمكن المحرك من إتمام المقارنة.");
      } else {
        alert("فشل إجراء المقارنة الذكية.");
      }
    } catch (e: any) {
      console.error(e);
      alert("خطأ في الاتصال بالخادم: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!comparisonResult) return;
    navigator.clipboard.writeText(comparisonResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-2xl border border-purple-500/20">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>مقارنة وتدقيق نسختين من المستندات والعقود (Smart Legal Diff & Comparator)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-mono">
                DIFF & AMENDMENTS DETECTOR
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              كشف الفروق الجوهرية، البنود المعدلة أو المحذوفة، والآثار القانونية المترتبة على التعديل
            </p>
          </div>
        </div>

        <button
          onClick={handleRunComparison}
          disabled={isLoading || !doc1Text.trim() || !doc2Text.trim()}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "جارٍ المقارنة..." : "بدء المقارنة الذكية"}</span>
        </button>
      </div>

      {/* Input Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Doc 1 */}
        <div className="space-y-2">
          <input
            type="text"
            value={doc1Label}
            onChange={(e) => setDoc1Label(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500"
          />
          <textarea
            rows={8}
            value={doc1Text}
            onChange={(e) => setDoc1Text(e.target.value)}
            placeholder="الصق نص المستند أو العقد الأول هنا..."
            className="w-full p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs leading-relaxed outline-none focus:border-purple-500 font-sans resize-y"
          />
        </div>

        {/* Doc 2 */}
        <div className="space-y-2">
          <input
            type="text"
            value={doc2Label}
            onChange={(e) => setDoc2Label(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500"
          />
          <textarea
            rows={8}
            value={doc2Text}
            onChange={(e) => setDoc2Text(e.target.value)}
            placeholder="الصق نص المستند أو العقد الثاني هنا لمقارنته مع الأول..."
            className="w-full p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs leading-relaxed outline-none focus:border-purple-500 font-sans resize-y"
          />
        </div>
      </div>

      {/* Comparison Output */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            يقوم الذكاء الاصطناعي بمقارنة البنود فقرة بفقرة ورصد التعديلات والمخاطر...
          </p>
        </div>
      ) : comparisonResult ? (
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-purple-500">
              <ArrowLeftRight className="w-4 h-4" />
              <span>تقرير الفروق والتعديلات والمخاطر القانونية</span>
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
                  onClick={() => onOpenInEditor(comparisonResult, "تقرير مقارنة المستندين")}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition flex items-center gap-1 text-[11px] font-bold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>فتح في المحرر</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs leading-relaxed max-h-[500px] overflow-y-auto space-y-3 font-sans">
            <Markdown>{comparisonResult}</Markdown>
          </div>
        </div>
      ) : null}
    </div>
  );
}
