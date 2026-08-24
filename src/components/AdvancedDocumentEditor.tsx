import React, { useState, useRef } from "react";
import { CaseRecord, ClientProfile, PlatformUser } from "../types";
import GoldenEagleEmblem from "./GoldenEagleEmblem";
import {
  FileText,
  Save,
  Printer,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
  List,
  ListOrdered,
  BookOpen,
  Scale,
  ShieldCheck,
  FileCheck,
  Send,
  HelpCircle,
  Undo
} from "lucide-react";

interface AdvancedDocumentEditorProps {
  currentUser: PlatformUser;
  clients: ClientProfile[];
  cases: CaseRecord[];
  initialContent?: string;
  onSaveToVault?: (doc: { title: string; content: string; type: string }) => void;
  language?: "ar" | "en";
}

// Pre-packaged Judicial Templates
const LEGAL_TEMPLATES = [
  {
    id: "defense_brief",
    title: "مذكرة دفاع ودفوع قانونية أمام المحكمة",
    category: "قضائي",
    content: `بسم الله الرحمن الرحيم

محكمة [المحكمة المختصة]
الدائرة: [رقم الدائرة] - [نوع الدائرة]

مذكرة بدفاع السيد / [اسم الموكل] (صفته: [المدعي / المتهم])
ضد السيد / [اسم الخصم] (صفته: [المدعى عليه / المجني عليه])

في الدعوى رقم [رقم القضية] لسنة [سنة القضية]
والمحدد لنظرها جلسة يوم [اليوم] الموافق [تاريخ الجلسة]

أولاً: الوقائع
تتحصل وقائع الدعوى الماثلة في أن [شرح موجز للوقائع المثبتة بالأوراق والمستندات]...

ثانياً: الدفوع القانونية الجوهرية
1. الدفع ببطلان الإجراءات لمخالفتها صريح نص القانون.
2. الدفع بانتفاء أركان الجريمة / الواقعة المنسوبة للموكل.
3. الدفع بعدم قبول الدعوى لرفعها من غير ذي صفة.

ثالثاً: الطلبات الختامية
يلتمس دفاع الموكل من عدالة المحكمة الموقرة التفضل بالقضاء:
أصلياً: بالبراءة ورفض الدعوى المدنية وإلزام رافعها بالمصروفات ومقابل أتعاب المحاماة.
احتياطياً: إعادة الدعوى لمكتب الخبراء / التحقيق لتحقيق عناصر النزاع.

وكيل الموكل
الأستاذ / وسام حمدي الشناوي
المحامي بالنقض والدستورية العليا`
  },
  {
    id: "lawsuit_petition",
    title: "صحيفة افتتاح دعوى قضائية (عريضة دعوى)",
    category: "عرائض",
    content: `بسم الله الرحمن الرحيم

إنه في يوم [اليوم] الموافق [تاريخ اليوم]
بناءً على طلب السيد / [اسم الموكل]، ومحله المختار مكتب الأستاذ وسام حمدي الشناوي المحامي بالنقض.

أنا [اسم المحضر] محضر محكمة [المحكمة المختصة] الجزئية قد انتقلت وأعلنت:
السيد / [اسم الخصم]، المقيم في [عنوان الخصم].
مخاطباً مع / [اسم المستلم].

وأعلنته بالآتي:
[شرح موضوع النزاع والسند القانوني لحق الطالب بالأدلة والمستندات المرفقة]...

بناءً عليه
أنا المحضر سالف الذكر قد انتقلت وسلمت المعلن إليه صورة من هذه الصحيفة وكلفته بالحضور أمام محكمة [المحكمة المختصة] الكائن مقرها في [مقر المحكمة] بجلستها المنعقدة علناً يوم [تاريخ الجلسة] لسماع الحكم بـ:
1. [الطلب الأول].
2. إلزام المعلن إليه بالمصروفات ومقابل أتعاب المحاماة والنفاذ المعجل.

ولأجل العلم ،،،`
  },
  {
    id: "formal_warning",
    title: "إنذار رسمي على يد محضر",
    category: "إنذارات",
    content: `بسم الله الرحمن الرحيم

إنه في يوم [اليوم] الموافق [تاريخ اليوم]
بناءً على طلب السيد / [اسم الموكل]، ومحله المختار مكتب الأستاذ وسام حمدي الشناوي المحامي.

أنا [اسم المحضر] محضر محكمة [المحكمة المختصة] قد انتقلت في تاريخه إلى حيث إقامة:
السيد / [اسم المنذر إليه]، المقيم في [عنوان المنذر إليه].
مخاطباً مع / [المستلم].

وأنذرته بالآتي:
بموجب [سند الإنذار] فإن للمنذر في ذمة المنذر إليه مبلغ وقدره [المبلغ بالأرقام والحروف]...
وحيث أن المنذر إليه قد امتنع عن الوفاء رغم استحقاق الأجل...

لذلك
ينبه المنذر على المنذر إليه بضرورة الوفاء بالتزامه وتسليم المبلغ خلال مهلة أقصاها [المدة] أيام من تاريخ استلام هذا الإنذار، وإلا سيضطر الطالب لاتخاذ كافة الإجراءات القانونية والقضائية والرجوع عليه بالتعويض والمصروفات.

ولأجل العلم ،،،`
  },
  {
    id: "legal_fees_contract",
    title: "عقد اتفاق وتوكيل أتعاب محاماة",
    category: "عقود",
    content: `بسم الله الرحمن الرحيم

عقد اتفاق أتعاب ومباشرة دعاوى قانونية

إنه في يوم [اليوم] الموافق [التاريخ]، تم الاتفاق والتراضي بين كل من:
الطرف الأول: الأستاذ وسام حمدي الشناوي - المحامي بالنقض والدستورية العليا. (الوكيل)
الطرف الثاني: السيد / [اسم الموكل]، بطاقة رقم [الرقم القومي]. (الموكل)

البند الأول (موضوع الوكالة):
يقوم الطرف الأول بتمثيل ومباشرة الدفاع في الدعوى رقم [رقم القضية] لسنة [سنة القضية] أمام محكمة [المحكمة المختصة].

البند الثاني (الأتعاب):
اتفق الطرفان على أن تكون أتعاب المحاماة الإجمالية مبلغاً وقدره [مبلغ الأتعاب] جنيه مصري، تدفع على النحو التالي:
1. مقدم أتعاب عند التوقيع: [المقدم].
2. الباقي على دفعات بحسب مراحل التقاضي.

توقيع الطرف الأول (المحامي)              توقيع الطرف الثاني (الموكل)`
  }
];

export default function AdvancedDocumentEditor({
  currentUser,
  clients,
  cases,
  initialContent = "",
  onSaveToVault,
  language = "ar"
}: AdvancedDocumentEditorProps) {
  const [docTitle, setDocTitle] = useState("مذكرة دفاع قضائية جديدة");
  const [docContent, setDocContent] = useState(() => initialContent || LEGAL_TEMPLATES[0].content);
  
  // Selected Context for Auto-Fill
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  
  // AI Tools State
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiActionType, setAiActionType] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Apply Template
  const handleApplyTemplate = (templateId: string) => {
    const tmpl = LEGAL_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setDocTitle(tmpl.title);
      setDocContent(tmpl.content);
    }
  };

  // Smart Auto-Fill variables with selected client/case data
  const handleAutoFillVariables = () => {
    let updated = docContent;
    const client = clients.find(c => c.id === selectedClientId);
    const cs = cases.find(c => c.id === selectedCaseId);

    if (client) {
      updated = updated.replace(/\[اسم الموكل\]/g, client.name);
      if (client.nationalId) updated = updated.replace(/\[الرقم القومي\]/g, client.nationalId);
      if (client.address) updated = updated.replace(/\[عنوان الموكل\]/g, client.address);
    }

    if (cs) {
      updated = updated.replace(/\[رقم القضية\]/g, cs.caseNumber);
      updated = updated.replace(/\[سنة القضية\]/g, cs.caseYear.toString());
      updated = updated.replace(/\[المحكمة المختصة\]/g, cs.competentCourt || "محكمة جنوب القاهرة الابتدائية");
      updated = updated.replace(/\[اسم الخصم\]/g, cs.opponentName || "الخصم المعلن إليه");
      if (cs.nextSessionDate) updated = updated.replace(/\[تاريخ الجلسة\]/g, cs.nextSessionDate);
    }

    const todayStr = new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    updated = updated.replace(/\[تاريخ اليوم\]/g, todayStr);
    updated = updated.replace(/\[اليوم\]/g, new Date().toLocaleDateString("ar-EG", { weekday: "long" }));

    setDocContent(updated);
  };

  // AI Assistant Feature (Legal Rephrase, Spell Check, Add Arguments)
  const handleAiAction = async (action: "rephrase" | "arguments" | "summarize" | "grammar") => {
    setIsAiProcessing(true);
    setAiActionType(action);
    setAiFeedback(null);

    let promptAction = "";
    if (action === "rephrase") {
      promptAction = "أعد صياغة هذا النص القانوني بأسلوب قضائي رصين وفصيح متوافق مع صياغات محكمة النقض المصرية والقضاء العربي، مع الحفاظ على كافة الوقائع والأسماء والأرقام دون تغيير:";
    } else if (action === "arguments") {
      promptAction = "اقترح دفوعاً قانونية جوهرية ومواد قانونية إضافية مناسبة لموضوع هذا المستند لتعزيز موقف الموكل في الدعوى:";
    } else if (action === "summarize") {
      promptAction = "قم بتلخيص هذا المستند القضائي في نقاط محددة وشاملة تتضمن: الوقائع، الدفوع، والطلبات الختامية:";
    } else if (action === "grammar") {
      promptAction = "قم بالتدقيق اللغوي والإملائي والقانوني الشامل لهذا المستند وتصحيح أي أخطاء طباعية أو لغوية:";
    }

    try {
      const res = await fetch("/api/ai/defense-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseType: docTitle,
          courtType: "محكمة النقض والمحاكم الابتدائية",
          evidencePoints: [docContent],
          demands: promptAction,
          language: "ar"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.brief) {
          if (action === "rephrase" || action === "grammar") {
            setDocContent(data.brief);
            setAiFeedback("✔️ تم تحديث وصياغة المستند بالذكاء الاصطناعي بنجاح!");
          } else {
            setAiFeedback(data.brief);
          }
        }
      } else {
        setAiFeedback("تعذر الاتصال بمحرك الذكاء الاصطناعي، يرجى المحاولة لاحقاً.");
      }
    } catch (err) {
      console.error(err);
      setAiFeedback("حدث خطأ أثناء المعالجة الذكية للمستند.");
    } finally {
      setIsAiProcessing(false);
      setAiActionType(null);
    }
  };

  // Copy Content
  const handleCopy = () => {
    navigator.clipboard.writeText(docContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Print Document with Official Judicial Letterhead & Crest
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>${docTitle}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body {
              font-family: 'Amiri', 'Traditional Arabic', 'Segoe UI', serif;
              font-size: 15pt;
              line-height: 1.8;
              color: #0f172a;
              direction: rtl;
              text-align: right;
              padding: 0;
              margin: 0;
            }
            .header-banner {
              border-bottom: 2px solid #b45309;
              padding-bottom: 15px;
              margin-bottom: 25px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .header-banner .title-block h1 {
              font-size: 18pt;
              margin: 0;
              color: #78350f;
              font-weight: 900;
            }
            .header-banner .title-block p {
              font-size: 11pt;
              margin: 2px 0 0 0;
              color: #475569;
            }
            .doc-body {
              white-space: pre-wrap;
              text-align: justify;
            }
            .footer-seal {
              margin-top: 40px;
              border-top: 1px solid #cbd5e1;
              padding-top: 15px;
              display: flex;
              justify-content: space-between;
              font-size: 10pt;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div class="title-block">
              <h1>مكتب الأستاذ وسام حمدي الشناوي</h1>
              <p>المحامي بالنقض والدستورية العليا - ديوان الإفتاء والقضايا</p>
              <p>هاتف: 01283233555 | بريد: wesam.elshenawey.law@gmail.com</p>
            </div>
            <div style="text-align: left; font-size: 10pt; color: #92400e; font-weight: bold;">
              <span>تاريخ التحرير: ${new Date().toLocaleDateString("ar-EG")}</span>
            </div>
          </div>

          <div class="doc-body">${docContent}</div>

          <div class="footer-seal">
            <div>محرر بواسطة المنظومة الرقمية للمكتب القضائي الذكي</div>
            <div>توقيع الأستاذ وسام الشناوي المحامي بالنقض</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Download as Word Document (.doc / .txt)
  const handleDownloadDoc = () => {
    const blob = new Blob([docContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${docTitle.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Save to Local Archive
  const handleSaveDocument = () => {
    if (onSaveToVault) {
      onSaveToVault({
        title: docTitle,
        content: docContent,
        type: "judicial_brief"
      });
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* 1. TOP OPERATIONS & TEMPLATES BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-500" />
              <span>النماذج القضائية الجاهزة:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {LEGAL_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleApplyTemplate(t.id)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-50 dark:bg-slate-800 hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="نسخ النص بالكامل"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "تم النسخ!" : "نسخ"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="طباعة برسم النسر الرسمي للجمهورية وترويسة المكتب"
            >
              <Printer className="w-3.5 h-3.5 text-amber-500" />
              <span>طباعة رسمية</span>
            </button>

            <button
              onClick={handleDownloadDoc}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="تصدير كملف نصي"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>تصدير</span>
            </button>

            <button
              onClick={handleSaveDocument}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveSuccess ? "تم الحفظ!" : "حفظ بالأرشيف"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SMART AUTO-FILL VARIABLE INJECTION BAR */}
      <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>المزامنة وملء المتغيرات التلقائي (Smart Auto-Fill):</span>
          </span>
          <span className="text-[10px] text-slate-400">حدد الموكل أو القضية لاستبدال الأقواس [اسم الموكل، رقم القضية] بالبيانات الحقيقية</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Client select */}
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 font-sans"
          >
            <option value="">-- اختر موكلاً لملء البيانات --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.phone || "بدون هاتف"})</option>
            ))}
          </select>

          {/* Case select */}
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 font-sans"
          >
            <option value="">-- اختر قضية لاستيراد بياناتها --</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>رقم {c.caseNumber} لسنة {c.caseYear} - {c.subject}</option>
            ))}
          </select>

          {/* Trigger auto-fill */}
          <button
            onClick={handleAutoFillVariables}
            disabled={!selectedClientId && !selectedCaseId}
            className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>⚡ تطبيق الملء التلقائي للمتغيرات</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN EDITOR WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Editor Body (3 Columns) */}
        <div className="lg:col-span-3 space-y-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          
          {/* Document Title Input */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400">عنوان المستند:</span>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-amber-500"
              placeholder="اكتب عنوان المذكرة أو العريضة..."
            />
          </div>

          {/* Document Content Textarea */}
          <div className="relative">
            <textarea
              rows={22}
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="w-full p-5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm leading-loose outline-none focus:border-amber-500 font-serif text-right shadow-inner resize-y transition"
              placeholder="اكتب أو الصق نصوص المستند القضائي هنا..."
            />
            
            <div className="absolute bottom-3 left-4 text-[10px] text-slate-400 font-mono">
              عدد الكلمات: {docContent.trim() ? docContent.trim().split(/\s+/).length : 0} | الأحرف: {docContent.length}
            </div>
          </div>
        </div>

        {/* AI & Drafting Toolkit Sidebar (1 Column) */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>مساعد الصياغة الذكي (AI)</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              محرك الصياغة القضائية المتقدم لتدقيق وتطوير مذكرات الدفاع تلقائياً:
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleAiAction("rephrase")}
                disabled={isAiProcessing}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black transition text-right flex items-center justify-between cursor-pointer"
              >
                <span>✨ إعادة صياغة قضائية رصينة</span>
                <span className="text-[10px] opacity-70">نقض</span>
              </button>

              <button
                onClick={() => handleAiAction("grammar")}
                disabled={isAiProcessing}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black transition text-right flex items-center justify-between cursor-pointer"
              >
                <span>🔍 تدقيق لغوي وإملائي</span>
                <span className="text-[10px] opacity-70">تدقيق</span>
              </button>

              <button
                onClick={() => handleAiAction("arguments")}
                disabled={isAiProcessing}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black transition text-right flex items-center justify-between cursor-pointer"
              >
                <span>⚖️ اقتراح دفوع قانونية إضافية</span>
                <span className="text-[10px] opacity-70">دفوع</span>
              </button>

              <button
                onClick={() => handleAiAction("summarize")}
                disabled={isAiProcessing}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black transition text-right flex items-center justify-between cursor-pointer"
              >
                <span>📑 تلخيص الوقائع والطلبات</span>
                <span className="text-[10px] opacity-70">إيجاز</span>
              </button>
            </div>

            {isAiProcessing && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center text-amber-500 text-xs font-black animate-pulse">
                جارٍ تحليل وصياغة المستند بالذكاء الاصطناعي...
              </div>
            )}
          </div>

          {/* AI Result Feedback Pane */}
          {aiFeedback && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 text-slate-200 text-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-amber-400 font-bold border-b border-slate-800 pb-1.5">
                <span>نتائج التحليل الذكي:</span>
                <button onClick={() => setAiFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300 max-h-60 overflow-y-auto">
                {aiFeedback}
              </p>
            </div>
          )}

          {/* Official Law Office Watermark Box */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-4 rounded-3xl border border-amber-500/30 text-center space-y-2">
            <GoldenEagleEmblem size="md" />
            <span className="text-xs font-black text-amber-400 block">ديوان الأستاذ وسام الشناوي</span>
            <p className="text-[10px] text-slate-400">ترويسة الطباعة الرسمية مفعلة ومعتمدة تلقائياً في كافة المستندات الصادرة.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
