import React, { useState } from "react";
import {
  FlaskConical,
  Dna,
  Search,
  BookOpen,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Microscope,
  FileCheck2,
  Copy,
  Check,
  RefreshCw,
  Scale
} from "lucide-react";

interface OcrForensicScienceLabProps {
  initialDocumentText?: string;
  onInsertToEditor?: (text: string) => void;
}

export default function OcrForensicScienceLab({
  initialDocumentText = "",
  onInsertToEditor
}: OcrForensicScienceLabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"evaluate" | "pubchem" | "pubmed">("evaluate");

  // Science Evaluation State
  const [caseDescription, setCaseDescription] = useState(
    initialDocumentText ? initialDocumentText.slice(0, 1500) : ""
  );
  const [medicalReportText, setMedicalReportText] = useState(
    initialDocumentText ? initialDocumentText.slice(0, 3000) : ""
  );
  const [suspectedSubstances, setSuspectedSubstances] = useState("مورفين، ترامادول، ميثامفيتامين، سم الزرنيخ");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<string>("");

  // PubChem Chemical Search State
  const [chemQuery, setChemQuery] = useState("Tramadol");
  const [isSearchingChem, setIsSearchingChem] = useState(false);
  const [chemResults, setChemResults] = useState<any[]>([]);

  // PubMed Literature Search State
  const [pubmedQuery, setPubmedQuery] = useState("forensic autopsy cause of death blunt force trauma head");
  const [isSearchingPubmed, setIsSearchingPubmed] = useState(false);
  const [pubmedArticles, setPubmedArticles] = useState<any[]>([]);

  const [copied, setCopied] = useState(false);

  // Handle Forensic Evaluation
  const handleRunEvaluation = async () => {
    if (!caseDescription.trim() && !medicalReportText.trim()) {
      alert("يرجى إدخال ملخص الواقعة أو تقرير الطب الشرعي للفحص.");
      return;
    }

    setIsEvaluating(true);
    setEvaluationResult("");

    try {
      const res = await fetch("/api/science/forensic-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseDescription,
          medicalReportText,
          suspectedSubstances
        })
      });

      if (!res.ok) throw new Error("فشل تقييم الأدلة الطبية الشرعية");
      const data = await res.json();
      setEvaluationResult(data.evaluation || "تم إعداد التقرير بنجاح.");
    } catch (e: any) {
      setEvaluationResult("تعذر إجراء الفحص الآلي: " + e.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Handle PubChem Chemical Search
  const handleSearchPubchem = async (term?: string) => {
    const q = (term || chemQuery).trim();
    if (!q) return;

    setIsSearchingChem(true);
    try {
      const res = await fetch(`/api/science/search-chemical?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setChemResults(data.compounds || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingChem(false);
    }
  };

  // Handle PubMed Search
  const handleSearchPubmed = async (term?: string) => {
    const q = (term || pubmedQuery).trim();
    if (!q) return;

    setIsSearchingPubmed(true);
    try {
      const res = await fetch(`/api/science/search-literature?query=${encodeURIComponent(q)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setPubmedArticles(data.articles || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingPubmed(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 text-right font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-teal-600 to-emerald-500 text-white rounded-2xl shadow-md">
            <Microscope className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                مختبر العلوم والطب الشرعي وتحليل السموم والبصمة الوراثية (Bioscience & Forensic Lab)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
                NCBI PubMed + PubChem
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ربط التقارير الطبية الجنائية بالقوانين المصرية (قانون العقوبات، مكافحة المخدرات 182/1960، ومبادئ محكمة النقض)
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveSubTab("evaluate")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "evaluate"
                ? "bg-teal-600 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>التقييم الفني المتكامل للطب الشرعي</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab("pubchem");
              if (chemResults.length === 0) handleSearchPubchem();
            }}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "pubchem"
                ? "bg-teal-600 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>فحص المركبات والسموم (PubChem)</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab("pubmed");
              if (pubmedArticles.length === 0) handleSearchPubmed();
            }}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "pubmed"
                ? "bg-teal-600 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>الدوريات والمراجع الطبية (PubMed)</span>
          </button>
        </div>
      </div>

      {/* SubTab 1: Forensic Evaluation */}
      {activeSubTab === "evaluate" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                موضوع الواقعة / ملخص ظروف الدعوى الجنائية:
              </label>
              <textarea
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                placeholder="مثال: وفاة المجني عليه إثر ادعاء اعتداء بالضرب أو تسمم دوائي، وتنازع حول علاقة السببية بين الفعل والوفاة..."
                className="w-full h-32 p-3 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl outline-none focus:border-teal-500 font-sans"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                نص تقرير الطبيب الشرعي أو المعمل الكيماوي / البصمة الوراثية:
              </label>
              <textarea
                value={medicalReportText}
                onChange={(e) => setMedicalReportText(e.target.value)}
                placeholder="الصق هنا ما تم استخراجه من تقرير الصفة التشريحية، أو نتيجة تحليل البصمة الوراثية DNA، أو نسب الكحول والسموم في الدم..."
                className="w-full h-32 p-3 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl outline-none focus:border-teal-500 font-sans"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 bg-teal-500/5 border border-teal-500/20 p-4 rounded-2xl">
            <div className="flex-1 min-w-[280px]">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                المواد أو العقاقير المشتبه بها (للبحث والربط بجداول المخدرات المصرية):
              </label>
              <input
                type="text"
                value={suspectedSubstances}
                onChange={(e) => setSuspectedSubstances(e.target.value)}
                placeholder="ترامادول، هيروين، حشيش، سيانيد، زرنيخ..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 font-sans"
              />
            </div>

            <button
              onClick={handleRunEvaluation}
              disabled={isEvaluating}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black text-xs rounded-xl shadow-md hover:scale-105 active:scale-95 transition cursor-pointer flex items-center gap-2 self-end disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جارٍ الفحص والتأصيل الطبي الجنائي...</span>
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4" />
                  <span>تحليل الدليل الطبي وبناء خطة الدفاع الجنائي</span>
                </>
              )}
            </button>
          </div>

          {evaluationResult && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-teal-500/40 rounded-2xl p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-black text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>تقرير التقييم الطبي الشرعي والدفوع الجنائية المستخلصة</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(evaluationResult)}
                    className="p-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:text-teal-600 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "تم النسخ" : "نسخ التقرير"}</span>
                  </button>
                  {onInsertToEditor && (
                    <button
                      onClick={() => onInsertToEditor(evaluationResult)}
                      className="p-1.5 px-3 bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-teal-700 transition"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>إدراج في محرر المذكرات</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-sans">
                {evaluationResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SubTab 2: PubChem Search */}
      {activeSubTab === "pubchem" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={chemQuery}
                onChange={(e) => setChemQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchPubchem()}
                placeholder="ابحث بالاسم الكيميائي أو التجاري (Morphine, Tramadol, Methamphetamine, Cyanide)..."
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium outline-none focus:border-teal-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
            <button
              onClick={() => handleSearchPubchem()}
              disabled={isSearchingChem}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-2xl text-xs font-black hover:bg-teal-700 transition cursor-pointer flex items-center gap-2"
            >
              {isSearchingChem ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>بحث المركب</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-bold">عقاقير شائعة في القضايا:</span>
            {["Tramadol", "Pregabalin", "Morphine", "Heroin", "Cannabidiol", "Methamphetamine", "Arsenic"].map((drug) => (
              <button
                key={drug}
                onClick={() => {
                  setChemQuery(drug);
                  handleSearchPubchem(drug);
                }}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-mono text-[11px] hover:border-teal-500 border border-transparent transition"
              >
                {drug}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {chemResults.map((chem, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 hover:border-teal-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-bold">
                    CID: {chem.cid}
                  </span>
                  <a
                    href={`https://pubchem.ncbi.nlm.nih.gov/compound/${chem.cid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-teal-500 text-[10px] flex items-center gap-1 font-bold"
                  >
                    <span>عرض بالمرجع</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono truncate">
                  {chem.title}
                </h4>
                <div className="text-[11px] text-slate-500 space-y-1 font-mono">
                  {chem.mf && <div>الصيغة الجزيئية: <span className="text-slate-800 dark:text-slate-200 font-bold">{chem.mf}</span></div>}
                  {chem.mw && <div>الوزن الجزيئي: <span className="text-slate-800 dark:text-slate-200">{chem.mw} g/mol</span></div>}
                  {chem.iupac && (
                    <div className="truncate text-[10px] text-slate-400" title={chem.iupac}>
                      IUPAC: {chem.iupac}
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>خاضع للرقابة / السموم</span>
                  </span>
                  <button
                    onClick={() => {
                      setSuspectedSubstances((prev) => (prev ? `${prev}، ${chem.title}` : chem.title));
                      setActiveSubTab("evaluate");
                    }}
                    className="text-[11px] font-bold text-teal-600 hover:underline"
                  >
                    إضافة للتقييم الجنائي &larr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 3: PubMed Literature Search */}
      {activeSubTab === "pubmed" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={pubmedQuery}
                onChange={(e) => setPubmedQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchPubmed()}
                placeholder="ابحث في الأبحاث والطب الشرعي (مثال: blunt force injury, cause of death, DNA STR profiling)..."
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium outline-none focus:border-teal-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
            <button
              onClick={() => handleSearchPubmed()}
              disabled={isSearchingPubmed}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-2xl text-xs font-black hover:bg-teal-700 transition cursor-pointer flex items-center gap-2"
            >
              {isSearchingPubmed ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>بحث الدوريات</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            {pubmedArticles.map((art, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 hover:border-teal-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                    PMID: {art.uid}
                  </span>
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${art.uid}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-teal-500 text-[10px] flex items-center gap-1 font-bold"
                  >
                    <span>قراءة البحث الكامل</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 line-clamp-2" dir="ltr">
                  {art.title}
                </h4>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div>المجلة / التاريخ: <span className="font-bold text-slate-700 dark:text-slate-300">{art.source}</span> ({art.pubdate})</div>
                  {art.authors && art.authors.length > 0 && (
                    <div className="text-[10px] text-slate-400 truncate" dir="ltr">
                      الباحثون: {art.authors.map((a: any) => a.name).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
