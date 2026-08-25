import React, { useState } from "react";
import { CaseRecord as Case, ClientProfile as Client } from "../types";
import { FileText, Calculator, PenTool, MessageSquare, AlertCircle, Upload, CheckCircle2, FileSearch, Sparkles, X, Settings, Download } from "lucide-react";

interface LegalAiAnalysisViewProps {
  cases: Case[];
  clients: Client[];
  language: "ar" | "en";
}

export default function LegalAiAnalysisView({ cases, clients, language }: LegalAiAnalysisViewProps) {
  const [activeTab, setActiveTab] = useState<"document_analyzer" | "fee_estimator" | "document_drafting" | "consultation_bot">("document_analyzer");

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>{language === "ar" ? "مركز الذكاء الاصطناعي القانوني" : "Legal AI Center"}</span>
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("document_analyzer")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "document_analyzer"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            <FileSearch className="w-4 h-4" />
            {language === "ar" ? "تحليل المستندات والثغرات" : "Document & Loophole Analysis"}
          </button>
          
          <button
            onClick={() => setActiveTab("fee_estimator")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "fee_estimator"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            <Calculator className="w-4 h-4" />
            {language === "ar" ? "مُقدّر أتعاب القضايا الذكي" : "Smart Fee Estimator"}
          </button>
          
          <button
            onClick={() => setActiveTab("document_drafting")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "document_drafting"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            <PenTool className="w-4 h-4" />
            {language === "ar" ? "مساعد صياغة المذكرات" : "Memo Drafting Assistant"}
          </button>
        </div>

        {/* Active Tab Content */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 min-h-[500px]">
          
          {activeTab === "document_analyzer" && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300 font-bold leading-relaxed">
                  {language === "ar" 
                    ? "يقوم المحلل بقراءة العقود والمذكرات القانونية، لاستخراج البنود الأساسية، وتسليط الضوء على المخاطر والثغرات المحتملة في صياغة العقد." 
                    : "The analyzer reads contracts and legal memos to extract key clauses, highlighting potential risks and loopholes."}
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-500 transition-colors bg-slate-50 dark:bg-slate-950">
                <Upload className="w-10 h-10 text-slate-400 mb-3" />
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
                  {language === "ar" ? "قم برفع المستند للتحليل" : "Upload Document for Analysis"}
                </h3>
                <p className="text-xs text-slate-500 mt-2 max-w-xs">
                  {language === "ar" ? "يدعم ملفات PDF, Word, والصور الممسوحة ضوئياً" : "Supports PDF, Word, and Scanned Images"}
                </p>
              </div>

              {/* Placeholder for results */}
              <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
                <h4 className="text-sm font-black mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  {language === "ar" ? "أحدث التحليلات السابقة" : "Recent Analyses"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">عقد شراكة تجارية - شركة الأمل</h5>
                      <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">عالي الخطورة</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">تم العثور على 3 ثغرات في بند فسخ التعاقد.</p>
                    <button className="text-[10px] font-bold text-amber-600 hover:underline">عرض التقرير المفصل &larr;</button>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">مذكرة دفاع - قضية عمالية</h5>
                      <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">سليم</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">الحجج القانونية متماسكة وتدعم موقف الموكل.</p>
                    <button className="text-[10px] font-bold text-amber-600 hover:underline">عرض التقرير المفصل &larr;</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "fee_estimator" && (
            <div className="space-y-6">
               <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                <Calculator className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300 font-bold leading-relaxed">
                  {language === "ar" 
                    ? "أدخل تفاصيل القضية ليقوم الذكاء الاصطناعي بحساب التكلفة التقديرية للأتعاب والرسوم القضائية بناءً على القضايا المماثلة السابقة والجهد المتوقع." 
                    : "Enter case details for the AI to estimate fees and court costs based on similar past cases and expected effort."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">نوع القضية</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-amber-500">
                    <option>مدني - تعويضات</option>
                    <option>جنائي - جنح</option>
                    <option>أسرة - أحوال شخصية</option>
                    <option>تجاري - منازعات شركات</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الدرجة القضائية</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-amber-500">
                    <option>أول درجة (ابتدائي)</option>
                    <option>استئناف</option>
                    <option>نقض</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">قيمة النزاع (إن وجدت)</label>
                  <input type="text" placeholder="مثال: 500,000 ج.م" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-amber-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">تقدير الجهد ووقت المحامي</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-amber-500">
                    <option>متوسط (إجراءات معتادة)</option>
                    <option>معقد (يحتاج خبراء ومذكرات طويلة)</option>
                    <option>بسيط (حضور جلسات فقط)</option>
                  </select>
                </div>
              </div>
              <button className="w-full md:w-auto px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-black hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer">
                {language === "ar" ? "حساب التقدير" : "Calculate Estimate"}
              </button>
            </div>
          )}

          {activeTab === "document_drafting" && (
            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
                <PenTool className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold leading-relaxed">
                  {language === "ar" 
                    ? "اختر نوع المستند وقدم التفاصيل الأساسية، وسيقوم الذكاء الاصطناعي بصياغة مسودة أولية احترافية باللغة القانونية." 
                    : "Choose document type and provide key details, and the AI will draft a professional preliminary document in legal language."}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">نوع المسودة المطلوبة</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-amber-500">
                    <option>صحيفة دعوى</option>
                    <option>إنذار رسمي على يد محضر</option>
                    <option>عقد بيع ابتدائي</option>
                    <option>مذكرة دفاع مدني</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">التفاصيل والوقائع (اشرح باختصار)</label>
                  <textarea 
                    rows={5}
                    placeholder={language === "ar" ? "مثال: أريد صياغة إنذار بسداد متأخرات إيجار بقيمة 10 آلاف جنيه عن شهري يناير وفبراير..." : "Provide case facts..."} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-amber-500 resize-none"
                  ></textarea>
                </div>
                <button className="px-6 py-3 bg-amber-500 text-slate-950 rounded-xl text-xs font-black hover:bg-amber-600 transition-colors shadow-sm cursor-pointer flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {language === "ar" ? "توليد المسودة" : "Generate Draft"}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
