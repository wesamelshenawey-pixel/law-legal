import React, { useState } from "react";
import { Languages, Sparkles, Copy, Check, FileText, RefreshCw, Download } from "lucide-react";

interface OcrTranslationHubProps {
  extractedText: string;
  onOpenInEditor?: (text: string, title?: string) => void;
}

export default function OcrTranslationHub({
  extractedText,
  onOpenInEditor
}: OcrTranslationHubProps) {
  const [targetLang, setTargetLang] = useState<"en" | "fr" | "ar">("en");
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!extractedText.trim()) {
      alert("يرجى استخراج النص من المستندات أولاً لإجراء الترجمة القضائية.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/ocr-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText, targetLang })
      });

      if (res.ok) {
        const data = await res.json();
        setTranslatedText(data.translatedText || "تعذر إتمام الترجمة.");
      } else {
        alert("فشل إجراء الترجمة بالذكاء الاصطناعي.");
      }
    } catch (e: any) {
      console.error(e);
      alert("خطأ في الاتصال بالخادم: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Legal-Translation-${targetLang.toUpperCase()}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-sky-500/10 text-sky-500 rounded-2xl border border-sky-500/20">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>الترجمة القضائية المعتمدة للمستندات (Certified Judicial Translation)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 font-mono">
                LEGAL AI GLOSSARY
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ترجمة العقود، التوكيلات، والأحكام القضائية مع الحفاظ على المصطلحات القانونية المعتمدة
            </p>
          </div>
        </div>

        {/* Translation Controls */}
        <div className="flex items-center gap-2">
          <select
            value={targetLang}
            onChange={(e: any) => setTargetLang(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="en">🇬🇧 الإنجليزية القضائية (Judicial English)</option>
            <option value="fr">🇫🇷 الفرنسية القانونية (French Legal)</option>
            <option value="ar">🇪🇬 الصياغة القضائية العربية الموثقة</option>
          </select>

          <button
            onClick={handleTranslate}
            disabled={isLoading || !extractedText}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "جارٍ الترجمة..." : "بدء الترجمة القانونية"}</span>
          </button>
        </div>
      </div>

      {/* Side-by-side / Output */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            يقوم المترجم القضائي الذكي بصياغة المستند طبقاً للمصطلحات القانونية الدولية...
          </p>
        </div>
      ) : translatedText ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original Source */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
              <span>النص العربي الأصلي:</span>
            </div>
            <textarea
              readOnly
              value={extractedText}
              rows={14}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs leading-relaxed outline-none resize-none font-sans"
            />
          </div>

          {/* Translated Target */}
          <div className="space-y-2" dir={targetLang === "ar" ? "rtl" : "ltr"}>
            <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
              <span>{targetLang === "en" ? "Translated Judicial Document (English):" : "Document Juridique Traduit (Français):"}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
                {onOpenInEditor && (
                  <button
                    onClick={() => onOpenInEditor(translatedText, "Translated Legal Document")}
                    className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Editor</span>
                  </button>
                )}
              </div>
            </div>
            <textarea
              readOnly
              value={translatedText}
              rows={14}
              className="w-full p-3.5 bg-sky-50/40 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-sky-200 dark:border-slate-800 rounded-2xl text-xs leading-relaxed outline-none resize-none font-sans"
            />
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Languages className="w-8 h-8 mx-auto text-sky-500" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            حدد اللغة المستهدفة واضغط "بدء الترجمة القانونية" لترجمة المستند مع توثيق المصطلحات.
          </p>
        </div>
      )}
    </div>
  );
}
