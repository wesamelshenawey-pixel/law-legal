import React, { useState, useRef, useEffect } from "react";
import { PlatformUser, UserRole } from "../types";
import { 
  Scale, 
  Sparkles, 
  BookOpen, 
  Search, 
  ShieldAlert, 
  FileText, 
  HeartHandshake, 
  Building2, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Send, 
  HelpCircle, 
  RefreshCw, 
  ArrowRight, 
  Gavel, 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink,
  MessageSquare,
  Calculator,
  Sliders,
  Upload,
  FileUp,
  AlertTriangle,
  FileCheck,
  Share2,
  Lock,
  Eye,
  Columns3
} from "lucide-react";
import { 
  EGYPTIAN_LEGAL_BRANCHES, 
  EGYPTIAN_CASSATION_DATABASE, 
  TOP_EGYPTIAN_LEGAL_CONSULTATIONS,
  EgyptianLawBranch,
  CassationPrecedent
} from "../data/egyptianLegalSources";

interface EgyptianLawyerAiViewProps {
  currentUser: PlatformUser;
  language: "ar" | "en";
  onNavigate?: (section: string) => void;
}

type TabMode = 
  | "consultation" 
  | "memo_analysis"
  | "penal_defense" 
  | "family_court" 
  | "cassation_library" 
  | "brief_drafter" 
  | "statutes_browser";

export default function EgyptianLawyerAiView({ currentUser, language, onNavigate }: EgyptianLawyerAiViewProps) {
  const [activeTab, setActiveTab] = useState<TabMode>("consultation");

  // Chat & Consultation State
  const [queryInput, setQueryInput] = useState("");
  const [selectedLawBranch, setSelectedLawBranch] = useState<string>("all");
  const [chatMessages, setChatMessages] = useState<{
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: string[];
    timestamp: string;
  }[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: `أهلاً ومرحباً بك في **منظومة المحامي المصري الذكي (Egyptian Lawyer AI)** التابعة لمكتب الأستاذ **وسام الشناوي** المحامي بالنقض والدستورية العليا.

أنا مستشارك القانوني الرقمي المعتمد، ومزود بقاعدة معرفية شاملة تضم:
- 🏛️ **أحدث نصوص ومواد القوانين المصرية (العقوبات، المدني، الإجراءات، الأحوال الشخصية، التجارة، والشهر العقاري حتى عام 2026)**.
- ⚖️ **موسوعة أحكام ومبادئ محكمة النقض المصرية (الدوائر الجنائية، المدنية، الإيجارات، والأحوال الشخصية)**.
- 👨‍👩‍👧‍👦 **أحكام وقواعد محاكم الأسرة ودعاوى النفقات والخلع والطلاق وقوائم المنقولات**.
- 🛡️ **صياغة المذكرات والدفوع الجوهرية (بطلان القبض، انتفاء التسليم، الدفوع الشكلية والموضوعية)**.

كيف يمكنني معاونتك في قضيتك أو استشارتك اليوم؟`,
      sources: ["قانون العقوبات المصري 58/1937", "القانون المدني 131/1948", "قانون الأسرة 1/2000", "أحكام محكمة النقض"],
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Memo Analysis & Judicial Precedents Redrafting State
  const [memoInputText, setMemoInputText] = useState("");
  const [memoType, setMemoType] = useState("مذكرة دفاع في جنحة خيانة أمانة");
  const [memoCourtLevel, setMemoCourtLevel] = useState("محكمة جنح مستأنف");
  const [memoClientRole, setMemoClientRole] = useState("المتهم (المستأنف)");
  const [memoOpponentRole, setMemoOpponentRole] = useState("المدعي بالحق المدني / النيابة العامة");
  const [memoObjectives, setMemoObjectives] = useState("القضاء ببراءة المتهم أصلياً لانتفاء ركن التسليم الفعلي واحتياطياً إحالة الدعوى للتحقيق أو الخبراء");
  const [memoAnalysisResult, setMemoAnalysisResult] = useState("");
  const [isAnalyzingMemo, setIsAnalyzingMemo] = useState(false);
  const [isUploadingMemo, setIsUploadingMemo] = useState(false);
  const [memoAnalysisSubTab, setMemoAnalysisSubTab] = useState<"full" | "redrafted" | "flaws" | "precedents">("full");
  const memoFileInputRef = useRef<HTMLInputElement>(null);

  // Preset Sample Memos for quick testing
  const SAMPLE_MEMOS = [
    {
      id: "trust_breach",
      title: "جنحة تبديد وإيصال أمانة (م 341)",
      court: "محكمة جنح مستأنف قصر النيل",
      type: "مذكرة دفاع في جنحة خيانة أمانة",
      client: "المتهم (المستأنف)",
      opponent: "المدعي بالحق المدني",
      objectives: "البراءة لانتفاء ركن التسليم وركن القصد الجنائي وصورية الإيصال المودع كضمان لمعاملة تجارية مدنية",
      text: `مذكرة بدفاع السيد / أحمد فؤاد (متهم مستأنف)
ضد السيد / محمود عبد العال (مدعٍ بالحق المدني)
في الجنحة رقم 1234 لسنة 2025 جنح مستأنف، والمحددة لنظرها جلسة اليوم.

الوقائع:
أسندت النيابة العامة للمتهم أنه بدد المبلغ النقدي المسلم إليه على سبيل الأمانة بموجب إيصال أمانة لتوصيله إلى طرف ثالث. وقد قضت محكمة أول درجة بحبسه سنة مع الشغل وكفالة.

الدفاع:
نلتمس البراءة استناداً إلى:
1. أن الإيصال سند الدعوى لم يسلم فيه أي مبلغ نقدي، وإنما كان موقعاً على بياض كضمان لشراكة تجارية بين الطرفين في تجارة قطع الغيار.
2. انتفاء ركن التسليم المادي الذي يشترطه القانون في جريمة خيانة الأمانة.
3. التمسك بإحالة الإيصال إلى مصلحة الطب الشرعي (أبحاث التزييف والتزوير) لإثبات معاصرة التوقيع لصلب الإيصال.

بناءً عليه: نلتمس إلغاء الحكم المستأنف والقضاء مجدداً ببراءة المتهم ورفض الدعوى المدنية.`
    },
    {
      id: "penal_arrest_nullity",
      title: "بطلان قبض وتفتيش وإحراز (م 30 إجراءات)",
      court: "محكمة جنايات القاهرة - الدائرة 15",
      type: "مذكرة دفاع في جناية إحراز",
      client: "المتهم",
      opponent: "النيابة العامة",
      objectives: "القضاء ببراءة المتهم لبطلان استيقافه وقبضه وتفتيشه وتلفيق حالة التلبس وانعدام إذن النيابة",
      text: `مذكرة بدفاع / كريم حسن مصطفى (متهم)
في الجناية رقم 5678 لسنة 2025 جنايات مدينة نصر.

الدفوع:
1. بطلان القبض والتفتيش لوقوعهما قبل صدور إذن النيابة العامة وفي غير حالات التلبس المنصوص عليها حصراً في المادة 30 من قانون الإجراءات الجنائية.
2. عدم معقولية تصوير ضابط الواقعة لكيفية الضبط المزعوم، إذ قرر أن المتهم تخلى طواعية عن اللفافة بمجرد رؤية القوة، وهو ما يتنافى مع الطبائع الإنسانية ومبادئ محكمة النقض.
3. انقطاع صلة المتهم بالحرز المضبوط وعدم رفع البصمات من عليه.

الطلبات: براءة المتهم مما نسب إليه.`
    },
    {
      id: "family_expenses_appeal",
      title: "استئناف نفقة صغار وأجور (م 18 مكرر)",
      court: "محكمة استئناف عالي الأسرة - دائرة شؤون الأسرة",
      type: "مذكرة دفاع في استئناف حكم نفقة",
      client: "المستأنف (الأب/الزوج)",
      opponent: "المستأنف ضدها (الحاضنة)",
      objectives: "تخفيض المفروض نفقة ومصروفات لعدم تناسبه مع الدخل الحقيقي ووجود التزامات عائلية أخرى وديون موثقة",
      text: `مذكرة بدفاع / السيد طارق إبراهيم (مستأنف)
ضد السيدة / رانيا ممدوح (مستأنف ضدها)
في الاستئناف رقم 4321 لسنة 140 ق أسرة القاهرة.

الموضوع: استئناف الحكم الصادر بإلزام المستأنف بأن يؤدي نفقة صغار بأنواعها بمبلغ 15,000 جنيه شهرياً.

الدفاع:
1. المغالاة الشديدة في تقدير النفقة بما يجاوز 70% من إجمالي دخل المستأنف الشهري الثابت رسمياً بمفردات مرتبه الصادرة من جهة عمله.
2. إغفال محكمة أول درجة بحث التحريات الدقيقة وإلزام الزوج بما لا يطيق بالمخالفة للمادة 18 مكرر ثانياً من القانون 25 لسنة 1929 والمعدل بالقانون 100 لسنة 1985.
3. المستأنف يعول والدته المسنة ولديه التزامات إيجارية وقروض بنكية مثبتة بالمستندات المرفقة بحافظة المستندات.

الطلبات: قبول الاستئناف شكلاً، وفي الموضوع بتعديل الحكم المستأنف وتخفيض المبلغ المقضي به ليتناسب مع دخل المستأنف الحقيقي ويساره.`
    }
  ];

  // Cassation Search State
  const [cassationSearchTerm, setCassationSearchTerm] = useState("");
  const [selectedCassationCircuit, setSelectedCassationCircuit] = useState<string>("الكل");
  const [activeCassationModal, setActiveCassationModal] = useState<CassationPrecedent | null>(null);

  // Family Court Calculator State
  const [familySalary, setFamilySalary] = useState<number>(10000);
  const [familyKidsCount, setFamilyKidsCount] = useState<number>(2);
  const [familyCaseType, setFamilyCaseType] = useState<"kids_expenses" | "wife_expense" | "housing_fee" | "school_fee">("kids_expenses");
  const [familyCalcResult, setFamilyCalcResult] = useState<{
    estimatedAmount: number;
    rangeMin: number;
    rangeMax: number;
    legalBasis: string;
    cassationPrinciple: string;
  } | null>(null);

  // Penal Defense Analysis State
  const [penalOffenseType, setPenalOffenseType] = useState("تبديد أمانة (المادة 341 عقوبات)");
  const [penalCaseFacts, setPenalCaseFacts] = useState("");
  const [penalDefenseOutput, setPenalDefenseOutput] = useState("");
  const [isGeneratingPenal, setIsGeneratingPenal] = useState(false);

  // Brief Drafter State
  const [briefCourt, setBriefCourt] = useState("محكمة جنح مستأنف");
  const [briefSubject, setBriefSubject] = useState("مذكرة دفاع في جنحة خيانة أمانة");
  const [briefClientRole, setBriefClientRole] = useState("المتهم (المستأنف)");
  const [briefOpponentRole, setBriefOpponentRole] = useState("المدعي بالحق المدني");
  const [briefFacts, setBriefFacts] = useState("");
  const [generatedBriefText, setGeneratedBriefText] = useState("");
  const [isDraftingBrief, setIsDraftingBrief] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle Main Legal Consultation Chat
  const handleSendQuery = async (customPrompt?: string) => {
    const textToSend = customPrompt || queryInput;
    if (!textToSend.trim()) return;

    const userMsgId = "msg-" + Date.now();
    const newMessages = [
      ...chatMessages,
      {
        id: userMsgId,
        role: "user" as const,
        content: textToSend,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
      }
    ];

    setChatMessages(newMessages);
    if (!customPrompt) setQueryInput("");
    setIsAiLoading(true);

    try {
      // Build rich Egyptian Legal prompt
      const systemContext = `أنت الخبير القانوني الأول والمحامي المصري الذكي (Egyptian Lawyer AI) بمكتب الأستاذ وسام الشناوي المحامي بالنقض والدستورية العليا.
مهمتك: تقديم استشارة قانونية تخصصية محكمة طبقاً للقوانين المصرية وأحدث أحكام محكمة النقض المصرية لعام 2026.
التزم دائماً بالهيكل التالي في إجابتك:
1. ⚖️ **التكييف القانوني الصحيح للواقعة**: تحديد نوع الدعوى أو النزاع والقانون الحاكم.
2. 📜 **السند القانوني والمواد الحاكمة**: ذكر أرقام المواد الدقيقة من (قانون العقوبات، القانون المدني، قانون الأسرة، قانون التجارة، أو قانون الإجراءات الجنائية).
3. 🏛️ **مبادئ وأحكام محكمة النقض المصرية ذات الصلة**: ذكر المبادئ المستقرة والقواعد القضائية الواجب الاستناد إليها.
4. 🛡️ **الدفوع القانونية الجوهرية وخطة الدفاع للمحامي**: الدفوع الشكلية والموضوعية.
5. 📋 **المستندات المطلوبة والإجراءات العملية**: الخطوات التنفيذية لدى أقسام الشرطة أو النيابة أو المحاكم أو الشهر العقاري.

السؤال أو المسألة المطروحة:
${textToSend}`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: systemContext,
          history: chatMessages.slice(-6).map(m => ({ role: m.role === "assistant" ? "model" : "user", text: m.content }))
        })
      });

      const data = await res.json();
      const aiReply = data.text || "عذراً، لم نتمكن من الحصول على رد فوري. يرجى إعادة المحاولة.";

      setChatMessages([
        ...newMessages,
        {
          id: "ai-" + Date.now(),
          role: "assistant",
          content: aiReply,
          sources: [
            selectedLawBranch === "penal_code" ? "قانون العقوبات وقانون الإجراءات الجنائية" :
            selectedLawBranch === "family_law" ? "قانون الأحوال الشخصية ومحاكم الأسرة" :
            selectedLawBranch === "civil_code" ? "القانون المدني والمرافعات" : "موسوعة القوانين المصرية وأحكام النقض",
            "مكتب وسام الشناوي للمحاماة 2026"
          ],
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err: any) {
      console.error("AI Error:", err);
      setChatMessages([
        ...newMessages,
        {
          id: "ai-err-" + Date.now(),
          role: "assistant",
          content: `وفقاً لأحكام القانون المصري وقواعد محكمة النقض المستقرة:\n- المادة 341 عقوبات وقانون الإجراءات الجنائية تشترط تسليماً فعلياً في خيانة الأمانة.\n- المادة 20 من القانون رقم 1 لسنة 2000 تحكم دعاوى الخلع بحكم نهائي مع حفظ حقوق الصغار.\n- المادة 147 من القانون المدني تقرر أن العقد شريعة المتعاقدين.\n(ملاحظة: يمكنك إعادة إرسال السؤال أو استخدام علامات التبويب التخصصية).`,
          sources: ["القانون المصري الموحد"],
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle Family Court Calculator
  const handleCalculateFamilyExpenses = () => {
    let percentage = 0.25;
    if (familyCaseType === "kids_expenses") {
      percentage = familyKidsCount === 1 ? 0.25 : familyKidsCount === 2 ? 0.35 : 0.45;
    } else if (familyCaseType === "wife_expense") {
      percentage = 0.20;
    } else if (familyCaseType === "housing_fee") {
      percentage = 0.20;
    } else if (familyCaseType === "school_fee") {
      percentage = 0.15;
    }

    const estimated = Math.round(familySalary * percentage);
    const min = Math.round(estimated * 0.85);
    const max = Math.round(estimated * 1.20);

    setFamilyCalcResult({
      estimatedAmount: estimated,
      rangeMin: min,
      rangeMax: max,
      legalBasis: "المادة 18 مكرر ثانياً من القانون 25 لسنة 1929 المعدل بالقانون 100 لسنة 1985 والمادة 76 مكرر من القانون 1 لسنة 2000.",
      cassationPrinciple: "قضاء النقض يلزم المحكمة بالتحري عن دخل الزوج الحقيقي من كافة المصادر الظاهرة والباطنة وتراعي المحكمة الحد الأدنى للمعيشة الكريمة للصغار والحاضنة."
    });
  };

  // Handle Penal Defense AI Generator
  const handleGeneratePenalDefense = async () => {
    if (!penalCaseFacts.trim()) {
      alert("الرجاء إدخال تفاصيل أو ملخص الواقعة الجنائية/محضر الشرطة.");
      return;
    }
    setIsGeneratingPenal(true);
    setPenalDefenseOutput("");

    try {
      const prompt = `أنت المحامي المصري الذكي المتخصص في الجنايات والجنح بمكتب الأستاذ وسام الشناوي المحامي.
نوع الجريمة/الاتهام: ${penalOffenseType}
وقائع المحضر/القضية: ${penalCaseFacts}

المطلوب:
1. 🚨 **التكييف القانوني الدقيق وأركان الجريمة (الركن المادي، الركن المعنوي، ركن الضرر، القصد الجنائي)**.
2. 🔍 **كشف الثغرات الجوهرية في محضر جمع الاستدلالات أو تحقيقات النيابة**.
3. ⚖️ **أهم الدفوع الشكلية والموضوعية مع السند من مواد قانون العقوبات والإجراءات الجنائية**:
   - (بطلان القبض والتفتيش لانتفاء حالة التلبس م 30 إجراءات، بطلان الإذن، انتفاء ركن التسليم م 341 عقوبات، كيدية الاتهام، التناقض بين الدليل القولي والفني، انقضاء الدعوى الجنائية).
4. 🏛️ **أهم أحكام محكمة النقض المصرية المؤيدة للبراءة في هذه الحالة**.
5. 📋 **الطلبات الجازمة التي يجب إثباتها في محضر الجلسة**.`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt })
      });
      const data = await res.json();
      setPenalDefenseOutput(data.text || "تم تحليل القضية بنجاح.");
    } catch (e) {
      console.error(e);
      setPenalDefenseOutput("تعذر استكمال الاتصال بالذكاء الاصطناعي الجنائي حالياً.");
    } finally {
      setIsGeneratingPenal(false);
    }
  };

  // Handle Brief Drafter
  const handleDraftCourtBrief = async () => {
    if (!briefFacts.trim()) {
      alert("الرجاء كتابة وقائع النزاع وتفاصيل الدعوى.");
      return;
    }
    setIsDraftingBrief(true);
    setGeneratedBriefText("");

    try {
      const prompt = `قم بصياغة مذكرة دفاع ومرافعة قانونية مصرية رفيعة المستوى لتقديمها أمام: ${briefCourt}
موضوع المذكرة: ${briefSubject}
صفة الموكل: ${briefClientRole}
صفة الخصم: ${briefOpponentRole}
وقائع النزاع وتفاصيل الجلسة: ${briefFacts}

المطلوب صياغة مذكرة دفاع كاملة ورسمية جاهزة للطباعة تتضمن:
- الديباجة القضائية المعتمدة (محكمة (...) الموقرة - الدائرة (...) - مذكرة بدفاع (...) ضد (...)).
- أولاً: الوقائع بإيجاز قانوني محكم.
- ثانياً: الدفوع القانونية الجوهرية مدعومة بنصوص القانون المصري ومبادئ محكمة النقض المصرية.
- ثالثاً: الرد على ادعاءات الخصم وتفنيدها.
- بناءً عليه: الطلبات الختامية الجازمة (أصلياً، واحتياطياً).
- التذييل الرسمي: وكيل الموكل / وسام الشناوي المحامي.`;

      const res = await fetch("/api/ai/defense-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: briefFacts,
          courtType: briefCourt,
          subject: briefSubject,
          clientName: briefClientRole,
          opponentName: briefOpponentRole
        })
      });
      const data = await res.json();
      setGeneratedBriefText(data.text || "");
    } catch (e) {
      console.error(e);
      setGeneratedBriefText("تعذر صياغة المذكرة حالياً.");
    } finally {
      setIsDraftingBrief(false);
    }
  };

  // Handle Memo Analysis & Redrafting using Judicial Precedents
  const handleAnalyzeMemoDraft = async () => {
    if (!memoInputText.trim()) {
      alert("الرجاء إدخال نص المذكرة القضائية أو رفع ملف المذكرة أولاً.");
      return;
    }
    setIsAnalyzingMemo(true);
    setMemoAnalysisResult("");

    try {
      const res = await fetch("/api/ai/analyze-memo-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memoText: memoInputText,
          courtLevel: memoCourtLevel,
          memoType: memoType,
          clientRole: memoClientRole,
          opponentRole: memoOpponentRole,
          targetObjectives: memoObjectives
        })
      });

      if (!res.ok) {
        throw new Error("HTTP error " + res.status);
      }

      const data = await res.json();
      setMemoAnalysisResult(data.analysis || data.text || "تم تحليل وتطوير المذكرة بنجاح.");
    } catch (e: any) {
      console.error("Memo Analysis error:", e);
      setMemoAnalysisResult("تعذر إكمال التحليل عبر الخادم، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsAnalyzingMemo(false);
    }
  };

  const handleUploadMemoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMemo(true);
    try {
      if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const text = await file.text();
        setMemoInputText(text);
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/ai/extract-document-text", {
          method: "POST",
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          if (data.extractedText) {
            setMemoInputText(data.extractedText);
          } else {
            const text = await file.text();
            setMemoInputText(text);
          }
        } else {
          const text = await file.text();
          setMemoInputText(text);
        }
      }
    } catch (err) {
      console.error("File upload parse error:", err);
      alert("تمت قراءة الملف، يمكنك مراجعة النص وتعديله في مربع الإدخال.");
    } finally {
      setIsUploadingMemo(false);
      if (memoFileInputRef.current) memoFileInputRef.current.value = "";
    }
  };

  const loadSampleMemo = (sample: typeof SAMPLE_MEMOS[0]) => {
    setMemoType(sample.type);
    setMemoCourtLevel(sample.court);
    setMemoClientRole(sample.client);
    setMemoOpponentRole(sample.opponent);
    setMemoObjectives(sample.objectives);
    setMemoInputText(sample.text);
  };

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Print helper
  const handlePrint = (content: string, title: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #0f172a; line-height: 1.8; }
            .header { text-align: center; border-bottom: 2px solid #b45309; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 20px; font-weight: 900; color: #b45309; }
            .subtitle { font-size: 13px; color: #475569; }
            .content { font-size: 14px; white-space: pre-wrap; text-align: justify; }
            .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 11px; text-align: center; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">مكتب الأستاذ وسام الشناوي المحامى</div>
            <div class="subtitle">المحامي بالنقض والدستورية العليا - المنظومة القضائية والذكاء الاصطناعي</div>
            <div style="margin-top: 10px; font-weight: bold;">${title}</div>
          </div>
          <div class="content">${content}</div>
          <div class="footer">طُبعت هذه الوثيقة عبر منظومة Egyptian Lawyer AI - جميع الحقوق محفوظة © 2026</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered Cassation Rulings
  const filteredCassation = EGYPTIAN_CASSATION_DATABASE.filter(item => {
    const matchesSearch = 
      item.topic.includes(cassationSearchTerm) ||
      item.legalPrinciple.includes(cassationSearchTerm) ||
      item.caseNumber.includes(cassationSearchTerm) ||
      item.keywords.some(k => k.includes(cassationSearchTerm));
    const matchesCircuit = selectedCassationCircuit === "الكل" || item.circuit === selectedCassationCircuit;
    return matchesSearch && matchesCircuit;
  });

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1. HERO BRAND BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="absolute -left-10 -top-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-2xl shadow-xl shadow-amber-500/20 text-3xl font-black shrink-0 border border-amber-300">
                ⚖️
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>المحامي المصري الذكي</span>
                    <span className="text-amber-400 font-mono text-sm sm:text-base font-bold">(Egyptian Lawyer AI)</span>
                  </h1>
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    موسوعة 2026
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  المنظومة الذكية الأولى المتخصصة في القوانين المصرية (قانون العقوبات، القانون المدني، محاكم الأسرة، الإجراءات الجنائية، وموسوعة أحكام محكمة النقض المصرية) تحت إشراف الأستاذ <strong>وسام الشناوي</strong> المحامي.
                </p>
              </div>
            </div>

            {/* Direct Vercel Project Link Banner */}
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="https://vercel.com/wesamelshenawey-9043s-projects/law-legal"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 text-amber-400 font-bold text-xs rounded-2xl transition flex items-center gap-2 shadow-sm group"
                title="رابط المشروع المباشر على Vercel"
              >
                <span>مشروع Vercel المباشر</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          {/* Quick Stats & Sources Pill Matrix */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { title: "قانون العقوبات", count: "المواد 1 - 395", icon: "🚨" },
              { title: "القانون المدني", count: "المواد 1 - 1149", icon: "📜" },
              { title: "محاكم الأسرة", count: "قوانين 1920 - 2000", icon: "👨‍👩‍👧‍👦" },
              { title: "الإجراءات الجنائية", count: "المواد 1 - 560", icon: "🛡️" },
              { title: "محكمة النقض", count: "أحكام الدوائر الموحدة", icon: "🏛️" },
              { title: "الشهر العقاري", count: "قانون 9/2022", icon: "🏢" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center">
                <div className="text-sm mb-0.5">{stat.icon}</div>
                <div className="text-[11px] font-black text-slate-200">{stat.title}</div>
                <div className="text-[9.5px] text-amber-400/90 font-mono mt-0.5">{stat.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
          {[
            { id: "consultation", label: "المستشار القانوني العام والفتوى", icon: Sparkles },
            { id: "memo_analysis", label: "تحليل وتعديل المذكرات بالسوابق القضائية", icon: FileCheck },
            { id: "penal_defense", label: "ديوان الجنايات ومحاضر الشرطة", icon: ShieldAlert },
            { id: "family_court", label: "مستشار محكمة الأسرة والنفقات", icon: HeartHandshake },
            { id: "cassation_library", label: "موسوعة أحكام محكمة النقض", icon: Gavel },
            { id: "brief_drafter", label: "صياغة المذكرات والدعاوى", icon: FileText },
            { id: "statutes_browser", label: "دليل القوانين والتشريعات", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabMode)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                    : "bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. TAB CONTENT */}

        {/* TAB: LEGAL MEMO ANALYSIS & JUDICIAL PRECEDENTS REDRAFTING */}
        {activeTab === "memo_analysis" && (
          <div className="space-y-6">
            
            {/* Top Explanatory Banner & Presets */}
            <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-3xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-black">منظومة تدقيق المذكرات القضائية وتعديل الصياغة بالسوابق</h3>
                    <p className="text-slate-400 text-[11px]">فحص المذكرات وعرائض الدعاوى المرفوعة، كشف الثغرات الشكلية والموضوعية، وإعادة صياغتها وفقاً لمبادئ محكمة النقض المصرية المعتمدة.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/60 px-2.5 py-1 rounded-xl font-bold">
                    معالجة Gemini 3.7 القضائية
                  </span>
                </div>
              </div>

              {/* Sample Memos Starters */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">نماذج جاهزة للاختبار والتحليل الفوري:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_MEMOS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => loadSampleMemo(sample)}
                      className="p-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/60 rounded-xl text-right transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-1">
                        <span>{sample.title}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition" />
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{sample.court}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Analysis Workspace (Grid: Inputs on Left, Results on Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Memo Inputs & Upload */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>بيانات المذكرة المراد فحصها وتطويرها</span>
                  </span>

                  {/* Hidden File Input & Upload Trigger */}
                  <input
                    type="file"
                    ref={memoFileInputRef}
                    onChange={handleUploadMemoFile}
                    accept=".txt,.md,.doc,.docx,.pdf,image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => memoFileInputRef.current?.click()}
                    disabled={isUploadingMemo}
                    className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {isUploadingMemo ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري استخراج النص...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع ملف المذكرة (DOCX/PDF)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Input Fields */}
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">نوع المذكرة / طبيعة الدعوى:</label>
                    <input
                      type="text"
                      value={memoType}
                      onChange={(e) => setMemoType(e.target.value)}
                      placeholder="مثال: مذكرة دفاع في جنحة خيانة أمانة / استئناف مدني..."
                      className="w-full bg-slate-850 text-white rounded-xl p-2.5 border border-slate-750 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">المحكمة المعروض أمامها النزاع:</label>
                    <input
                      type="text"
                      value={memoCourtLevel}
                      onChange={(e) => setMemoCourtLevel(e.target.value)}
                      placeholder="مثال: محكمة جنح مستأنف / استئناف عالي / محكمة النقض..."
                      className="w-full bg-slate-850 text-white rounded-xl p-2.5 border border-slate-750 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">صفة الموكل:</label>
                      <input
                        type="text"
                        value={memoClientRole}
                        onChange={(e) => setMemoClientRole(e.target.value)}
                        className="w-full bg-slate-850 text-white rounded-xl p-2.5 border border-slate-750 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">صفة الخصم:</label>
                      <input
                        type="text"
                        value={memoOpponentRole}
                        onChange={(e) => setMemoOpponentRole(e.target.value)}
                        className="w-full bg-slate-850 text-white rounded-xl p-2.5 border border-slate-750 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">الدفوع والطلبات المستهدفة في الحكم:</label>
                    <input
                      type="text"
                      value={memoObjectives}
                      onChange={(e) => setMemoObjectives(e.target.value)}
                      placeholder="مثال: البراءة لانتفاء ركن التسليم / بطلان القبض / تخفيض النفقة..."
                      className="w-full bg-slate-850 text-white rounded-xl p-2.5 border border-slate-750 focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Memo Text Input / Dropzone */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-300">نص المذكرة المرفوعة أو المسودة الحالية:</label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {memoInputText ? `${memoInputText.split(/\s+/).filter(Boolean).length} كلمة` : "فارغ"}
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      value={memoInputText}
                      onChange={(e) => setMemoInputText(e.target.value)}
                      placeholder="الصق هنا نص المذكرة أو عريضة الدعوى التي ترغب في تحليلها وكشف ثغراتها واقتراح تعديل صياغتها..."
                      className="w-full bg-slate-850 text-white placeholder-slate-500 text-xs rounded-xl p-3 border border-slate-750 focus:border-amber-500 outline-none resize-none font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="button"
                  onClick={handleAnalyzeMemoDraft}
                  disabled={isAnalyzingMemo || !memoInputText.trim()}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzingMemo ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري فحص الثغرات وصياغة التعديل بالسوابق القضائية...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>تحليل المذكرة واقتراح الصياغة المعدلة بالسوابق</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Analysis & Suggested Redrafting Report */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <Gavel className="w-4 h-4 text-amber-400" />
                        <span>تقرير الفحص والتدقيق والصياغة المقترحة</span>
                      </h3>
                      <span className="text-[10px] text-slate-400">
                        مؤسس على قواعد محكمة النقض المصرية ومواد القوانين المعمول بها
                      </span>
                    </div>

                    {memoAnalysisResult && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(memoAnalysisResult, "memo-analysis-copy")}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer border border-slate-700"
                          title="نسخ التقرير والصياغة"
                        >
                          {copiedId === "memo-analysis-copy" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === "memo-analysis-copy" ? "تم النسخ" : "نسخ الصياغة"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrint(memoAnalysisResult, `مذكرة قضائية معدلة - ${memoType}`)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer border border-slate-700"
                          title="طباعة على ترويسة المكتب"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>طباعة رسمية</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Result Content */}
                  <div className="mt-4">
                    {memoAnalysisResult ? (
                      <div className="bg-slate-850 p-5 rounded-2xl text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line text-justify max-h-[550px] overflow-y-auto border border-slate-750 font-sans select-text scrollbar-thin">
                        {memoAnalysisResult}
                      </div>
                    ) : isAnalyzingMemo ? (
                      <div className="p-16 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
                          <Gavel className="w-6 h-6 animate-bounce" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-amber-300">جاري التدقيق وفحص الثغرات القضائية...</p>
                          <p className="text-xs text-slate-400">نقوم بمقارنة الدفوع بأحكام محكمة النقض المصرية ذات الصلة وتوليد الصياغة القضائية المحكمة.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-14 text-center text-slate-400 space-y-4 border border-dashed border-slate-800 rounded-2xl">
                        <FileCheck className="w-12 h-12 text-slate-700 mx-auto" />
                        <div className="space-y-1 max-w-md mx-auto">
                          <h4 className="text-sm font-black text-slate-300">بانتظار إدخال المذكرة للتحليل</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            اختر أحد النماذج السريعة على اليسار، أو الصق مسودة مذكرتك، أو ارفع ملف (Word/PDF) واضغط زر التحليل لاستعراض كشف الثغرات والصياغة البديلة مع السوابق القضائية المفترضة.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Assurance */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span>تخضع الصياغات للمراجعة والاعتماد النهائي بموجب وكالة الأستاذ وسام الشناوي المحامي بالنقض.</span>
                  </span>
                  <span className="font-mono text-slate-500">Lawyer-AI v2.6</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 1: GENERAL CONSULTATION & SMART FATWA */}
        {activeTab === "consultation" && (
          <div className="space-y-6">
            
            {/* Fast Consultation Starters */}
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>نماذج استشارات سريعة وقضايا متكررة في المحاكم المصرية:</span>
                </span>
                <span className="text-[10px] text-slate-400">انقر للبدء الفوري</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {TOP_EGYPTIAN_LEGAL_CONSULTATIONS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSendQuery(q.prompt)}
                    className="p-3 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/60 rounded-2xl text-right transition group cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {q.category}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 group-hover:-translate-x-1 transition" />
                    </div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 line-clamp-2 leading-relaxed">
                      {q.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Chat Interface */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-black text-white">المحادثة القانونية الحية المتصلة بمواد القانون وأحكام النقض</span>
                </div>
                <button
                  onClick={() => setChatMessages([chatMessages[0]])}
                  className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>بدء جلسة جديدة</span>
                </button>
              </div>

              {/* Chat Message Stream */}
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
                {chatMessages.map((msg) => {
                  const isAssistant = msg.role === "assistant";
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
                    >
                      {isAssistant && (
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 mt-1">
                          ⚖️
                        </div>
                      )}

                      <div
                        className={`max-w-3xl rounded-3xl p-4 sm:p-5 space-y-2.5 ${
                          isAssistant
                            ? "bg-slate-850 border border-slate-750 text-slate-100 shadow-md"
                            : "bg-amber-500 text-slate-950 font-medium ml-4"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px] opacity-80 border-b border-white/10 pb-1.5">
                          <span className="font-bold">
                            {isAssistant ? "المحامي المصري الذكي (مكتب وسام الشناوي)" : currentUser.name || "أنت"}
                          </span>
                          <span className="font-mono">{msg.timestamp}</span>
                        </div>

                        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-justify font-sans">
                          {msg.content}
                        </div>

                        {/* Legal Sources Badge Footer */}
                        {isAssistant && msg.sources && msg.sources.length > 0 && (
                          <div className="pt-2 border-t border-slate-750 flex items-center justify-between gap-2 flex-wrap text-[10px]">
                            <div className="flex items-center gap-1.5 text-amber-400/90 font-bold flex-wrap">
                              <span>المصادر:</span>
                              {msg.sources.map((s, idx) => (
                                <span key={idx} className="bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                                  {s}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => copyToClipboard(msg.content, msg.id)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                                title="نسخ النص"
                              >
                                {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedId === msg.id ? "تم النسخ" : "نسخ"}</span>
                              </button>

                              <button
                                onClick={() => handlePrint(msg.content, "استشارة قانونية - المحامي المصري الذكي")}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                                title="طباعة رسمية"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>طباعة</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isAiLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 animate-pulse">
                      ⚖️
                    </div>
                    <div className="bg-slate-850 border border-slate-750 rounded-3xl p-4 text-xs text-amber-400 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري فحص وتأصيل المسألة في القانون المصري وأحكام محكمة النقض...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Field */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendQuery();
                      }
                    }}
                    placeholder="اكتب استشارتك أو مسألتك القانونية هنا (مثال: ما هو الدفع ببطلان التفتيش؟ أو شروط استرداد قائمة المنقولات؟)..."
                    className="flex-1 bg-slate-850 text-white placeholder-slate-400 text-xs sm:text-sm rounded-2xl p-3.5 border border-slate-750 focus:border-amber-500 outline-none resize-none transition"
                  />
                  <button
                    onClick={() => handleSendQuery()}
                    disabled={isAiLoading || !queryInput.trim()}
                    className="px-5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <span>إرسال</span>
                    <Send className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PENAL & CRIMINAL DEFENSE */}
        {activeTab === "penal_defense" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span>محلل الجنايات والجنح ومحاضر الشرطة</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">نوع الجريمة أو التهمة المسندة:</label>
                <select
                  value={penalOffenseType}
                  onChange={(e) => setPenalOffenseType(e.target.value)}
                  className="w-full bg-slate-850 text-white text-xs rounded-xl p-3 border border-slate-750 focus:border-amber-500 outline-none"
                >
                  <option value="تبديد أمانة وإيصالات أمانة (المادة 341 عقوبات)">تبديد أمانة وإيصالات أمانة (المادة 341 عقوبات)</option>
                  <option value="شيك بدون رصيد (المادة 534 قانون التجارة 17 لسنة 1999)">شيك بدون رصيد (المادة 534 قانون التجارة 17 لسنة 1999)</option>
                  <option value="نصب واحتيال (المادة 336 عقوبات)">نصب واحتيال (المادة 336 عقوبات)</option>
                  <option value="إحراز وتعاطي مواد مخدرة وبطلان التلبس (قانون 182 لسنة 1960)">إحراز وتعاطي مواد مخدرة وبطلان التلبس (قانون 182 لسنة 1960)</option>
                  <option value="تزوير واستعمال محررات عرفية أو رسمية (المواد 211 - 215 عقوبات)">تزوير واستعمال محررات عرفية أو رسمية (المواد 211 - 215 عقوبات)</option>
                  <option value="ضرب وجرح وعاهة مستديمة (المادتان 241 و 242 عقوبات)">ضرب وجرح وعاهة مستديمة (المادتان 241 و 242 عقوبات)</option>
                  <option value="جرائم الإنترنت والسب والقذف الإلكتروني (قانون 175 لسنة 2018)">جرائم الإنترنت والسب والقذف الإلكتروني (قانون 175 لسنة 2018)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">وقائع المحضر أو القضية (التاريخ، المكان، أقوال المتهم والشهود):</label>
                <textarea
                  rows={6}
                  value={penalCaseFacts}
                  onChange={(e) => setPenalCaseFacts(e.target.value)}
                  placeholder="اكتب هنا وقائع محضر الشرطة أو التهمة المنسوبة للمتهم وثغرات الواقعة..."
                  className="w-full bg-slate-850 text-white placeholder-slate-400 text-xs rounded-xl p-3 border border-slate-750 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <button
                onClick={handleGeneratePenalDefense}
                disabled={isGeneratingPenal}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/20"
              >
                {isGeneratingPenal ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري تحليل الثغرات واستخراج الدفوع الجنائية...</span>
                  </>
                ) : (
                  <>
                    <Gavel className="w-4 h-4" />
                    <span>استخراج الدفوع الجوهرية والثغرات الجنائية</span>
                  </>
                )}
              </button>
            </div>

            {/* Penal Output Display */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>تقرير الثغرات والدفوع الجنائية (قانون العقوبات والإجراءات)</span>
                </h3>
                {penalDefenseOutput && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard(penalDefenseOutput, "penal-copy")}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ</span>
                    </button>
                    <button
                      onClick={() => handlePrint(penalDefenseOutput, "تقرير الدفوع الجنائية - مكتب وسام الشناوي")}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة</span>
                    </button>
                  </div>
                )}
              </div>

              {penalDefenseOutput ? (
                <div className="bg-slate-850 p-4 sm:p-5 rounded-2xl text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line text-justify max-h-[550px] overflow-y-auto border border-slate-750">
                  {penalDefenseOutput}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-xs">
                    اختر نوع التهمة وضع وقائع القضية بالجانب الأيمن، ثم اضغط على زر استخراج الدفوع لتوليد خطة الدفاع المتكاملة مع نصوص القانون وأحكام النقض.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FAMILY COURT & PERSONAL STATUS CALCULATOR */}
        {activeTab === "family_court" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                <HeartHandshake className="w-5 h-5 text-pink-500" />
                <span>حاسبة النفقات ومستشار محكمة الأسرة</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">نوع الطلب أو الدعوى:</label>
                <select
                  value={familyCaseType}
                  onChange={(e) => setFamilyCaseType(e.target.value as any)}
                  className="w-full bg-slate-850 text-white text-xs rounded-xl p-3 border border-slate-750 focus:border-amber-500 outline-none"
                >
                  <option value="kids_expenses">نفقة صغار (مأكل وملبس ومصاريف)</option>
                  <option value="wife_expense">نفقة زوجية ونفقة متعة وعدة</option>
                  <option value="housing_fee">أجر مسكن حضانة وأجر رضاعة وحضانة</option>
                  <option value="school_fee">المصروفات الدراسية والتعليمية</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">صافي دخل الزوج/الملزم بالنفقة الشهري (بالجنيه المصري):</label>
                <input
                  type="number"
                  value={familySalary}
                  onChange={(e) => setFamilySalary(Number(e.target.value))}
                  className="w-full bg-slate-850 text-white text-xs rounded-xl p-3 border border-slate-750 focus:border-amber-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">عدد الأطفال المشمولين بالحضانة:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={familyKidsCount}
                  onChange={(e) => setFamilyKidsCount(Number(e.target.value))}
                  className="w-full bg-slate-850 text-white text-xs rounded-xl p-3 border border-slate-750 focus:border-amber-500 outline-none font-mono"
                />
              </div>

              <button
                onClick={handleCalculateFamilyExpenses}
                className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-black text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-600/20"
              >
                <Calculator className="w-4 h-4" />
                <span>حساب متوسط النفقة التقديرية طبقاً لقضاء محاكم الأسرة</span>
              </button>
            </div>

            {/* Family Output Display */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-black text-white border-b border-slate-800 pb-3">
                تقرير تقدير النفقات والأحكام القضائية المستقرة
              </h3>

              {familyCalcResult ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-5 bg-gradient-to-l from-pink-950/40 to-slate-850 border border-pink-500/30 rounded-2xl text-center space-y-2">
                    <span className="text-xs text-pink-300 font-bold">متوسط النفقة الشهرية التقديرية المقضي بها:</span>
                    <div className="text-3xl font-black text-white font-mono flex items-center justify-center gap-1 text-pink-400">
                      <span>{familyCalcResult.estimatedAmount.toLocaleString()}</span>
                      <span className="text-sm text-slate-300">جنيه مصري / شهرياً</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      النطاق التقديري المتوقع بالمحكمة: من <strong>{familyCalcResult.rangeMin.toLocaleString()}</strong> إلى <strong>{familyCalcResult.rangeMax.toLocaleString()}</strong> ج.م
                    </p>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-2 text-xs">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>السند القانوني من تشريعات الأحوال الشخصية:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{familyCalcResult.legalBasis}</p>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-2 text-xs">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Gavel className="w-4 h-4" />
                      <span>مبدأ محكمة النقض المصرية الحاكم:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{familyCalcResult.cassationPrinciple}</p>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <HeartHandshake className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-xs">
                    أدخل بيانات الدخل وعدد الصغار واضغط على زر الحساب للاطلاع على التقدير القضائي المعتمد طبقاً لأحكام محاكم الأسرة المصرية.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CASSATION COURT ENCYCLOPEDIA */}
        {activeTab === "cassation_library" && (
          <div className="space-y-5">
            {/* Search & Filter Toolbar */}
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={cassationSearchTerm}
                    onChange={(e) => setCassationSearchTerm(e.target.value)}
                    placeholder="ابحث في أحكام النقض (مثل: خيانة أمانة، بطلان التفتيش، خلع، فسخ عقد، إيجار قديم)..."
                    className="w-full bg-slate-850 text-white placeholder-slate-400 text-xs sm:text-sm rounded-2xl p-3.5 pr-10 border border-slate-750 focus:border-amber-500 outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-4" />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {["الكل", "جنائي", "مدني", "أحوال شخصية", "إيجارات", "تجاري وعمالي"].map((circuit) => (
                    <button
                      key={circuit}
                      onClick={() => setSelectedCassationCircuit(circuit)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        selectedCassationCircuit === circuit
                          ? "bg-amber-500 text-slate-950 font-black"
                          : "bg-slate-800 hover:bg-slate-750 text-slate-300"
                      }`}
                    >
                      {circuit}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Precedents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCassation.map((cas) => (
                <div
                  key={cas.id}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-5 rounded-3xl transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        الدائرة الـ{cas.circuit}ة
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        الطعن رقم {cas.caseNumber} لسنة {cas.judicialYear} ({cas.rulingDate})
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white">{cas.topic}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed text-justify line-clamp-3">
                      {cas.legalPrinciple}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {cas.keywords.slice(0, 3).map((kw, i) => (
                        <span key={i} className="text-[9.5px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                          #{kw}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => setActiveCassationModal(cas)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      عرض المبدأ كاملاً
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal for full cassation ruling */}
            {activeCassationModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 max-w-2xl w-full rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-bold text-amber-400">محكمة النقض المصرية - الدائرة {activeCassationModal.circuit}</span>
                      <h3 className="text-sm font-black text-white mt-0.5">{activeCassationModal.topic}</h3>
                    </div>
                    <button
                      onClick={() => setActiveCassationModal(null)}
                      className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-slate-200">
                    <div className="p-3 bg-slate-850 rounded-xl border border-slate-750 font-mono text-[11px] text-amber-300">
                      رقم الطعن: {activeCassationModal.caseNumber} لسنة {activeCassationModal.judicialYear} - جلسة {activeCassationModal.rulingDate}
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-white">منطوق القاعدة والمبدأ القضائي:</span>
                      <p className="bg-slate-850 p-4 rounded-xl border border-slate-800 text-justify text-slate-200 whitespace-pre-line">
                        {activeCassationModal.fullRuleText}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-amber-400">أهمية هذا الحكم في الدفاع والمرافعة:</span>
                      <p className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl text-amber-200">
                        {activeCassationModal.relevanceToDefense}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                    <button
                      onClick={() => copyToClipboard(activeCassationModal.fullRuleText, "cas-full")}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl"
                    >
                      نسخ الحكم
                    </button>
                    <button
                      onClick={() => setActiveCassationModal(null)}
                      className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BRIEF & PLEADING DRAFTER */}
        {activeTab === "brief_drafter" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                <FileText className="w-5 h-5" />
                <span>مساعد صياغة المذكرات القضائية الرسمية</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">المحكمة المختصة:</label>
                <input
                  type="text"
                  value={briefCourt}
                  onChange={(e) => setBriefCourt(e.target.value)}
                  className="w-full bg-slate-850 text-white text-xs rounded-xl p-3 border border-slate-750 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">موضوع المذكرة أو عريضة الدعوى:</label>
                <input
                  type="text"
                  value={briefSubject}
                  onChange={(e) => setBriefSubject(e.target.value)}
                  className="w-full bg-slate-850 text-white text-xs rounded-xl p-3 border border-slate-750 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">صفة الموكل:</label>
                  <input
                    type="text"
                    value={briefClientRole}
                    onChange={(e) => setBriefClientRole(e.target.value)}
                    className="w-full bg-slate-850 text-white text-xs rounded-xl p-3 border border-slate-750 focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">صفة الخصم:</label>
                  <input
                    type="text"
                    value={briefOpponentRole}
                    onChange={(e) => setBriefOpponentRole(e.target.value)}
                    className="w-full bg-slate-850 text-white text-xs rounded-xl p-3 border border-slate-750 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">وقائع النزاع والدفوع المطلوبة:</label>
                <textarea
                  rows={6}
                  value={briefFacts}
                  onChange={(e) => setBriefFacts(e.target.value)}
                  placeholder="اكتب هنا وقائع الدعوى باختصار وطلبات الموكل..."
                  className="w-full bg-slate-850 text-white placeholder-slate-400 text-xs rounded-xl p-3 border border-slate-750 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <button
                onClick={handleDraftCourtBrief}
                disabled={isDraftingBrief}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {isDraftingBrief ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري صياغة المذكرة القضائية باللغة القانونية البليغة...</span>
                  </>
                ) : (
                  <>
                    <Gavel className="w-4 h-4" />
                    <span>صياغة مذكرة الدفاع القضائية</span>
                  </>
                )}
              </button>
            </div>

            {/* Output Brief Display */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white">نص المذكرة القضائية الجاهزة للتقديم</h3>
                {generatedBriefText && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard(generatedBriefText, "brief-copy")}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ</span>
                    </button>
                    <button
                      onClick={() => handlePrint(generatedBriefText, briefSubject)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة</span>
                    </button>
                  </div>
                )}
              </div>

              {generatedBriefText ? (
                <div className="bg-slate-850 p-5 rounded-2xl text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line text-justify max-h-[550px] overflow-y-auto border border-slate-750 font-sans">
                  {generatedBriefText}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-xs">
                    قم بملء البيانات في اللوحة اليمنى واضغط على زر الصياغة للحصول على عريضة أو مذكرة دفاع قانونية نموذجية جاهزة للطباعة والتوقيع.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: STATUTES & CODES DIRECTORY */}
        {activeTab === "statutes_browser" && (
          <div className="space-y-6">
            {EGYPTIAN_LEGAL_BRANCHES.map((branch) => (
              <div key={branch.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-3 bg-slate-800 rounded-2xl border border-slate-700">{branch.icon}</span>
                    <div>
                      <h3 className="text-base font-black text-white">{branch.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{branch.shortDesc}</p>
                    </div>
                  </div>
                </div>

                {/* Key Statutes Pill */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-amber-400 font-bold">التشريعات المرجعية:</span>
                  {branch.primaryStatutes.map((stat, i) => (
                    <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-xl border border-slate-750">
                      {stat}
                    </span>
                  ))}
                </div>

                {/* Key Articles Cards */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-white">أهم المواد القانونية وتطبيقاتها القضائية:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {branch.keyArticles.map((art, idx) => (
                      <div key={idx} className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-black text-amber-400">{art.number}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{art.lawName}</span>
                        </div>
                        <h5 className="text-xs font-bold text-white">{art.topic}</h5>
                        <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                          "{art.text}"
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          <strong>الشرح العملي:</strong> {art.practicalExplanation}
                        </p>
                        {art.cassationRuleSummary && (
                          <div className="text-[10.5px] text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                            <strong>مبدأ النقض:</strong> {art.cassationRuleSummary}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
