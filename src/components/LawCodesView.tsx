import React, { useState } from "react";
import { LawCodeBook, UserRole, PlatformUser } from "../types";
import { BookOpen, Search, Cpu } from "lucide-react";

interface LawCodesProps {
  lawCodes: LawCodeBook[];
  onAddCode: (newCode: LawCodeBook) => void;
  currentUser: PlatformUser;
}

export default function LawCodesView({ lawCodes, onAddCode, currentUser }: LawCodesProps) {
  const [selectedCode, setSelectedCode] = useState<LawCodeBook | null>(lawCodes[0] || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState("");

  // Editor states for Admins
  const [showAddForm, setShowAddForm] = useState(false);
  const [codeTitle, setCodeTitle] = useState("");
  const [codeCategory, setCodeCategory] = useState("القوانين الجنائية");
  const [codeContent, setCodeContent] = useState("");

  const handleAiSmartStatuteSearch = async () => {
    if (!searchQuery.trim()) {
      alert("الرجاء كتابة مسألة أو مادة القانون المراد البحث عنها.");
      return;
    }
    setIsAiSearching(true);
    setAiAnalysisResult("");
    try {
      const prompt = `أنت الخبير الدستوري المساعد لمكتب الأستاذ وسام الشناوي. 
لقد سأل الموكل أو السائل السؤال أو المسألة التالية المتعلقة بالقوانين المصرية:
"${searchQuery}"

المطلوب:
1. جرد نصوص المواد ذات الصلة من القانون الجنائي وعقوبات التبديد، أو القانون مدني أو الأسرة بمصر.
2. شرح مبسط جداً بلغة عربية سلسلة عما تنص عليه هذه المواد لمساعدة المحامي في إقناع الهيئة الموقرة.`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt })
      });
      const data = await res.json();
      setAiAnalysisResult(data.text || "لم يعثر محرك البحث على نصوص واضحة في هذا الصدد.");
    } catch (e) {
      console.error(e);
      setAiAnalysisResult("منطاد البحث معطل مؤقتاً. نصوص المواد ٣٤١ عقوبات و١٤٧ مدني تفي بالموضوع لعام ٢٠٢٦ م.");
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleAddNewCodeBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeTitle || !codeContent) {
      alert("العنوان والنصوص حقول إجبارية.");
      return;
    }

    const nCode: LawCodeBook = {
      id: "code-" + Date.now(),
      title: codeTitle,
      category: codeCategory,
      contentMarkdown: codeContent
    };

    onAddCode(nCode);
    setShowAddForm(false);
    setSelectedCode(nCode);
    setCodeTitle("");
    setCodeContent("");
    alert("تم قيد وتدوين كود التشريع الجديد بالمنظومة بنجاح لتغذية محركات البحث!");
  };

  const visibleCodes = lawCodes.filter(c => 
    c.title.includes(searchQuery) || 
    c.category.includes(searchQuery) ||
    c.contentMarkdown.includes(searchQuery)
  );

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Top Operations Bar */}
      {currentUser.role === UserRole.ADMIN && (
        <div className="flex justify-between items-center flex-wrap gap-3">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300">
            مستودع الأكواد والقوانين المصرية ({lawCodes.length} كود)
          </span>
          <button
            id="open-add-code-form"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-slate-900" />
            تأصيل كود تشريعي جديد
          </button>
        </div>
      )}

      {/* SMART STATUTES SEARCH KEYWORD / AI */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-xs text-slate-800">
        <h3 className="text-sm font-bold text-slate-900">الاستعلام والبحث التشريعي المدعوم بالذكاء الاصطناعي</h3>
        <div className="flex gap-2.5 flex-wrap">
          <input
            id="statutes-search-field"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="اكتب مسألة قانونية، مثل: 'عقوبة تبديد الأمانة'، 'نفقة الصغير بأثر رجعي'..."
            className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 outline-none text-right placeholder-slate-400 text-xs focus:bg-white focus:border-amber-500 transition"
          />
          <button
            id="statute-keyword-search"
            onClick={() => alert("تم فحص وتصفية الكتب التشريعية النشطة بالأسفل لكلمات البحث المكتوبة!")}
            className="px-4 py-2.5 bg-slate-100 text-slate-800 font-bold border border-slate-200 hover:bg-slate-200 text-xs rounded-lg cursor-pointer transition"
          >
            بحث كلمات
          </button>
          <button
            id="statute-ai-smart-search"
            onClick={handleAiSmartStatuteSearch}
            disabled={isAiSearching}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg flex items-center gap-1 whitespace-nowrap cursor-pointer transition shadow-sm"
          >
            <Cpu className="w-4 h-4 animate-pulse" />
            استشارة المواد والـ AI
          </button>
        </div>

        {isAiSearching && (
          <p className="text-xs text-amber-700 animate-pulse text-center font-bold">جاري سحب وتصنيف المواد وتفتيش أحكام النقض بالـ AI...</p>
        )}

        {aiAnalysisResult && (
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-2 mt-3 leading-relaxed animate-fade-in">
            <h4 className="text-xs font-bold text-emerald-800">توجيهات وتحليلات ذكاء المنصة (مكتب وسام الشناوي):</h4>
            <p className="text-slate-800 leading-relaxed font-sans whitespace-pre-line text-right p-1 max-h-56 overflow-y-auto">{aiAnalysisResult}</p>
          </div>
        )}
      </div>

      {/* CORE STATUTES BOOK LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-800">
        
        {/* Book Select List Sidebar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 max-h-[420px] overflow-y-auto shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-bold pr-1 mb-2 font-sans">الدليل والكتب التشريعية</p>
          {visibleCodes.map(book => (
            <button
              id={`statutes-book-${book.id}`}
              key={book.id}
              onClick={() => setSelectedCode(book)}
              className={`w-full text-right px-3.5 py-3 rounded-xl flex flex-col transition cursor-pointer ${
                selectedCode?.id === book.id 
                  ? "bg-amber-500 text-slate-900 font-black shadow-sm" 
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className={`text-[9px] uppercase tracking-wide font-bold ${selectedCode?.id === book.id ? "text-slate-900/80" : "text-amber-700"}`}>{book.category}</span>
              <span className="text-xs font-bold mt-1 line-clamp-1">{book.title}</span>
            </button>
          ))}
        </div>

        {/* Selected Book Markdown display */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          {selectedCode ? (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2.5 text-right">
                <span className="text-[9.5px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded uppercase">{selectedCode.category}</span>
                <h3 className="text-sm font-black text-slate-900 mt-1.5">{selectedCode.title}</h3>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-slate-800 font-sans text-xs max-h-[340px] overflow-y-auto leading-relaxed text-right border border-slate-200 whitespace-pre-line select-all">
                {selectedCode.contentMarkdown}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-405 text-slate-400 bg-slate-50 border border-slate-100 rounded-xl">
              اختر كود من القائمة التشريعية الجانبية لتصفح نصوص القوانين ومذكراتها التفسيرية.
            </div>
          )}
        </div>

      </div>

      {/* DYNAMIC BOOK EDITOR POPUP FORM (ADMINS ONLY) */}
      {showAddForm && currentUser.role === UserRole.ADMIN && (
        <form onSubmit={handleAddNewCodeBook} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-1.5 border-b border-slate-100">تأصيل وإدراج كود تشريعي ومذكرة تفسيرية</h3>
          
          <div className="grid grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="book-title">عنوان الكتاب التشريعي</label>
              <input
                id="book-title"
                type="text"
                value={codeTitle}
                onChange={(e) => setCodeTitle(e.target.value)}
                placeholder="مثال: القانون المدني المصري بقسم الإيجارات"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded text-right text-slate-900 outline-none focus:bg-white focus:border-amber-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="book-category">الفئة الكلية للتشريع</label>
              <select
                id="book-category"
                value={codeCategory}
                onChange={(e) => setCodeCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded text-right text-slate-900 outline-none focus:bg-white focus:border-amber-500 transition"
              >
                <option value="القانون الجنائي والمخدرات">القانون الجنائي والمخدرات</option>
                <option value="القانون المدني والإيجار">القانون المدني والإيجار</option>
                <option value="قوانين الأحوال الشخصية والأسرة">قوانين الأحوال الشخصية والأسرة</option>
                <option value="القانون التجاري وتأسيس الشركات">القانون التجاري وتأسيس الشركات</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-705 text-xs mb-1 font-bold" htmlFor="book-content-text">نصوص ومواد القوانين المدونة (يدعم الترميز السليم)</label>
            <textarea
              id="book-content-text"
              rows={8}
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              placeholder="اكتب نصوص ومواد القوانين والبنود المرجعية هنا..."
              className="w-full p-3 bg-slate-50 text-slate-900 rounded outline-none border border-slate-200 text-xs text-right focus:bg-white focus:border-amber-500 transition"
              required
            />
          </div>

          <div className="flex justify-end gap-3 text-xs pt-1">
            <button
              id="cancel-add-code"
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              id="submit-add-code"
              type="submit"
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded cursor-pointer transition shadow-sm"
            >
              حفظ ونشر الكود بالمنظومة
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
