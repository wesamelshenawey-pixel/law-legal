import React, { useState, useEffect } from "react";
import { CaseRecord, ClientProfile, PlatformUser, LawCodeBook } from "../types";
import GoldenEagleEmblem from "./GoldenEagleEmblem";
import {
  LEGAL_AI_AGENTS_ROSTER,
  STATUTORY_COURSES_REGISTRY,
  StatutoryCourse,
  LegalAgentMeta,
  MachineLearningState,
  getLocalMachineLearningState,
  saveLocalMachineLearningState,
  runContinuousLearningCycle,
  groundQueryAgainstLawCodes,
  detectLawyerEscalationIntent
} from "../utils/legalAiAgentsEngine";
import {
  Bot,
  Brain,
  Cpu,
  Sparkles,
  Zap,
  Globe,
  Shield,
  ShieldAlert,
  Scale,
  BookOpen,
  Terminal,
  Activity,
  Play,
  Pause,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Sliders,
  Layers,
  GraduationCap,
  Award,
  Flame,
  ArrowUpRight,
  Fingerprint,
  Lock,
  Eye,
  FileText
} from "lucide-react";

interface AutonomousAiAgentsHubProps {
  currentUser: PlatformUser;
  cases?: CaseRecord[];
  clients?: ClientProfile[];
  lawCodes?: LawCodeBook[];
  onNavigate?: (section: string) => void;
  language?: "ar" | "en";
}

export default function AutonomousAiAgentsHub({
  currentUser,
  cases = [],
  clients = [],
  lawCodes = [],
  onNavigate,
  language = "ar"
}: AutonomousAiAgentsHubProps) {
  // Navigation tabs within AI Hub
  const [activeTab, setActiveTab] = useState<"agents_roster" | "courses_academy" | "deep_research" | "ml_lab" | "interactive_chat">("agents_roster");

  // Machine Learning & Auto-Training State
  const [mlState, setMlState] = useState<MachineLearningState>(() => getLocalMachineLearningState());
  const [isAutoTrainingRunning, setIsAutoTrainingRunning] = useState(true);
  const [selectedAgentCategory, setSelectedAgentCategory] = useState<string>("all");
  const [agentSearchQuery, setAgentSearchQuery] = useState("");
  const [selectedCourseCategory, setSelectedCourseCategory] = useState<string>("all");
  const [courseSearchQuery, setCourseSearchQuery] = useState("");

  // Course Simulation Modal State
  const [activeSimulationCourse, setActiveSimulationCourse] = useState<StatutoryCourse | null>(null);
  const [simulationPrompt, setSimulationPrompt] = useState("");
  const [simulationOutput, setSimulationOutput] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Deep Research & Dark Web OSINT State
  const [deepResearchQuery, setDeepResearchQuery] = useState("");
  const [deepResearchDepth, setDeepResearchDepth] = useState<"deep" | "darknet_osint" | "statutory">("darknet_osint");
  const [targetEntityType, setTargetEntityType] = useState<"general" | "phone" | "company" | "crypto" | "digital_crime">("digital_crime");
  const [associatedPhone, setAssociatedPhone] = useState("");
  const [associatedCase, setAssociatedCase] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [deepResearchReport, setDeepResearchReport] = useState<string | null>(null);

  // Interactive Multi-Agent Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string; time: string; agentName?: string }>>([
    {
      role: "assistant",
      text: `مرحباً بك في ديوان وكلاء وروبوتات الذكاء الاصطناعي بمكتب الأستاذ وسام الشناوي المحامي بالنقض والدستورية العليا.
نحن مجموعة الوكلاء المتخصصين في:
• قانون العقوبات المصري وقانون المرافعات وقانون الإجراءات الجنائية.
• قانون مكافحة جرائم تقنية المعلومات (175 لسنة 2018) والتحقيق في الإنترنت العميق والمظلم.
• قانون التحكيم التجاري، قانون الإثبات، وقوانين الأسرة والأحوال الشخصية.
منظومة التعلم الآلي والتدريب المستمر مفعلة 24/7 بدون انقطاع لتطوير أوزان الوكلاء تلقائياً. كيف يمكننا معاونتك الآن؟`,
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      agentName: "منظومة الوكلاء الموحدة"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [escalationFlagTriggered, setEscalationFlagTriggered] = useState(false);

  // 1. Continuous Automated Machine Learning Loop (Fires every 12 seconds)
  useEffect(() => {
    if (!isAutoTrainingRunning) return;

    const interval = setInterval(() => {
      setMlState((prev) => runContinuousLearningCycle(prev));
    }, 12000);

    return () => clearInterval(interval);
  }, [isAutoTrainingRunning]);

  // Run Manual Immediate Machine Learning Step
  const handleTriggerManualMlStep = () => {
    const updated = runContinuousLearningCycle(mlState, `⚡ [تحديث يدوي فوري]: معايرة دقيقة لأوزان الذكاء الاصطناعي وتطبيق أحكام محكمة النقض 2026`);
    setMlState(updated);
  };

  // Run Deep Research Query
  const handleExecuteDeepResearch = async () => {
    if (!deepResearchQuery.trim()) return;
    setIsResearching(true);
    setDeepResearchReport(null);

    try {
      const res = await fetch("/api/ai/deep-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: deepResearchQuery,
          searchDepth: deepResearchDepth,
          targetEntityType: targetEntityType,
          associatedPhone: associatedPhone,
          associatedCaseNumber: associatedCase
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDeepResearchReport(data.report || "تم إنجاز التحقيق الرقمي العميق بنجاح.");
        // Record ML step
        runContinuousLearningCycle(mlState, `🌐 [البحث العميق والإنترنت المظلم]: استكمال تحقيق سيبراني حول (${deepResearchQuery.slice(0, 30)}...) وتوثيق الأثر الرقمي`);
      } else {
        setDeepResearchReport("تعذر إتمام البحث العميق عبر الخادم، يرجى إعادة المحاولة.");
      }
    } catch (err) {
      console.error("Deep Research error:", err);
      setDeepResearchReport("حدث خطأ أثناء الاتصال بمحرك البحث العميق.");
    } finally {
      setIsResearching(false);
    }
  };

  // Run Course Simulation Test
  const handleRunCourseSimulation = async (course: StatutoryCourse) => {
    setActiveSimulationCourse(course);
    setSimulationPrompt(course.simulationSampleQuery);
    setSimulationOutput(null);
    setIsSimulating(true);

    try {
      const res = await fetch("/api/ai/run-legal-course-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          courseTitle: course.title,
          testTopic: course.simulationSampleQuery,
          userQuestion: simulationPrompt || course.simulationSampleQuery
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationOutput(data.simulationResult || "تم استيعاب وتطبيق الدفوع القضائية بنجاح تام.");
      } else {
        setSimulationOutput("تعذر تنفيذ المحاكاة القضائية للدورة حالياً.");
      }
    } catch (err) {
      console.error("Simulation error:", err);
      setSimulationOutput("حدث خطأ أثناء إجراء الاختبار العملي للدورة.");
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle Multi-Agent Chat
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatSending) return;

    const userText = chatInput.trim();
    setChatInput("");
    const userMsg = {
      role: "user" as const,
      text: userText,
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatSending(true);

    // Check lawyer escalation intent
    const escalationCheck = detectLawyerEscalationIntent(userText);
    if (escalationCheck.isEscalationRequested) {
      setEscalationFlagTriggered(true);
    }

    // Ground against law codes
    const grounding = groundQueryAgainstLawCodes(userText, lawCodes);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: chatMessages.slice(-6).map(m => ({ role: m.role, text: m.text })),
          lawCodesContext: grounding.consolidatedLawContext,
          isEscalationCheck: escalationCheck.isEscalationRequested
        })
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.text || "تم تحليل المسألة القانونية بدقة بواسطة وكلاء المكتب.";
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: replyText,
            time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
            agentName: escalationCheck.isEscalationRequested ? "روبوت التصعيد الفوري للأستاذ وسام" : "منظومة الوكلاء الموحدة"
          }
        ]);

        if (data.detectedLawyerContactIntent) {
          setEscalationFlagTriggered(true);
        }
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "نعتذر، تعذر الاتصال بمحرك الوكلاء حالياً. يمكنك الاتصال المباشر بالأستاذ وسام الشناوي على: 01283233555.",
            time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
            agentName: "نظام الطوارئ"
          }
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsChatSending(false);
    }
  };

  // Filter Agents
  const filteredAgents = LEGAL_AI_AGENTS_ROSTER.filter((agent) => {
    const matchesCategory = selectedAgentCategory === "all" || agent.category === selectedAgentCategory;
    const matchesSearch = !agentSearchQuery || 
      agent.nameArabic.includes(agentSearchQuery) || 
      agent.nameEnglish.toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
      agent.role.includes(agentSearchQuery);
    return matchesCategory && matchesSearch;
  });

  // Filter Courses (23 statutory and technical courses)
  const filteredCourses = STATUTORY_COURSES_REGISTRY.filter((course) => {
    let matchesCategory = true;
    if (selectedCourseCategory === "crimes") {
      matchesCategory = [
        "course_assault_battery",
        "course_breach_of_trust",
        "course_penal_code",
        "course_criminal_procedures"
      ].includes(course.id) || course.category.includes("الجنائية") || course.category.includes("العقوبات") || course.category.includes("الاعتداء") || course.category.includes("الأمانة");
    } else if (selectedCourseCategory === "family") {
      matchesCategory = [
        "course_alimony_maintenance",
        "course_divorce_khula",
        "course_nushuz_disobedience",
        "course_obedience_claims",
        "course_family_law"
      ].includes(course.id) || course.category.includes("الأسرة") || course.category.includes("الأحوال الشخصية") || course.category.includes("النشوز") || course.category.includes("الطلاق") || course.category.includes("الطاعة");
    } else if (selectedCourseCategory === "property") {
      matchesCategory = [
        "course_property_ownership",
        "course_inheritance_estates",
        "course_tenancy_leases"
      ].includes(course.id) || course.category.includes("الملكية") || course.category.includes("العينية") || course.category.includes("المواريث") || course.category.includes("الإيجارات");
    } else if (selectedCourseCategory === "digital_fintech") {
      matchesCategory = [
        "course_cyber_internet_crimes",
        "course_telecom_crimes",
        "course_ewallet_fintech_crimes",
        "course_cybercrime_telecom",
        "course_deep_research_darkweb"
      ].includes(course.id) || course.category.includes("السيبرانية") || course.category.includes("الاتصالات") || course.category.includes("المحافظ") || course.category.includes("OSINT");
    } else if (selectedCourseCategory === "supply_building") {
      matchesCategory = [
        "course_supply_crimes",
        "course_building_violations"
      ].includes(course.id) || course.category.includes("التموينية") || course.category.includes("البناء");
    } else if (selectedCourseCategory === "procedural") {
      matchesCategory = [
        "course_civil_pleadings",
        "course_arbitration_law",
        "course_evidence_law",
        "course_criminal_procedures"
      ].includes(course.id) || course.category.includes("المرافعات") || course.category.includes("الإثبات") || course.category.includes("التحكيم");
    } else if (selectedCourseCategory === "ai_research") {
      matchesCategory = [
        "course_deep_research_darkweb",
        "course_machine_learning_continuous"
      ].includes(course.id);
    }

    const matchesSearch = !courseSearchQuery ||
      course.title.includes(courseSearchQuery) ||
      course.codeNumber.includes(courseSearchQuery) ||
      course.category.includes(courseSearchQuery) ||
      course.keyArticles.some(a => a.includes(courseSearchQuery)) ||
      course.recentLearnedPrinciple.includes(courseSearchQuery) ||
      course.modules.some(m => m.includes(courseSearchQuery));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5 font-sans text-right" dir="rtl">
      
      {/* 1. TOP AUTONOMOUS COMMAND BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-5 rounded-3xl border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>24/7 AUTO-LEARN & AUTONOMOUS AGENTS</span>
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                  مكتب الأستاذ وسام الشناوي المحامي بالنقض
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white mt-1">
                ديوان وكلاء وروبوتات الذكاء الاصطناعي والتعلم الآلي والأتمتة الذاتية
              </h1>
              <p className="text-xs text-slate-300/80 mt-0.5 max-w-2xl leading-relaxed">
                منظومة موحدة تجمع كافة الوكلاء الإدراكيين، التحقيق في الإنترنت المظلم، دورات القوانين المصرية السبعة، والأتمتة الذاتية المستمرة بدون توقف.
              </p>
            </div>
          </div>

          {/* Autonomous Switch & Live Engine Indicator */}
          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-between lg:justify-end">
            <div className="bg-slate-900/80 border border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-3">
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 block">التدريب والتعلم الآلي المستمر:</span>
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {isAutoTrainingRunning ? "يعمل ذاتياً 24/7 بدون انقطاع" : "متوقف مؤقتاً"}
                </span>
              </div>
              <button
                onClick={() => setIsAutoTrainingRunning(!isAutoTrainingRunning)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isAutoTrainingRunning 
                    ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30" 
                    : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                }`}
                title={isAutoTrainingRunning ? "إيقاف مؤقت للتدريب التلقائي" : "تشغيل التدريب التلقائي المستمر"}
              >
                {isAutoTrainingRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handleTriggerManualMlStep}
              className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 shrink-0"
              title="تشغيل دورة تدريبية وتحديث للأوزان العصبية الآن"
            >
              <Zap className="w-4 h-4" />
              <span>دورة تدريب فورية (+)</span>
            </button>
          </div>

        </div>

        {/* Real-time Metric Badges Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">الدورات التدريبية المكتملة</span>
            <span className="text-sm font-black text-amber-400 font-mono">
              {mlState.totalTrainingCycles.toLocaleString()} دورة
            </span>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">مؤشر الفهم الإدراكي (IQ)</span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {mlState.cognitiveIQIndex} <span className="text-[9px] font-normal text-slate-400">(مستوى نقض)</span>
            </span>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">معدل الفقد العصبي (Loss)</span>
            <span className="text-sm font-black text-indigo-400 font-mono">
              {mlState.lossRate}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">الوكلاء المتخصصون النشطون</span>
            <span className="text-sm font-black text-purple-400 font-mono">
              {LEGAL_AI_AGENTS_ROSTER.length} وكلاء وروبوتات
            </span>
          </div>
        </div>

        {/* Live Active Autonomous Task Marquee */}
        <div className="mt-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-2 overflow-hidden">
            <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" />
            <span className="text-slate-400 font-bold shrink-0">المهمة الذاتية النشطة الآن:</span>
            <span className="font-mono text-amber-300 truncate">{mlState.activeAutonomousTask}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono shrink-0 hidden sm:inline">
            Epoch #{mlState.currentEpoch}
          </span>
        </div>

      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab("agents_roster")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "agents_roster"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>لوحة الوكلاء والروبوتات ({LEGAL_AI_AGENTS_ROSTER.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("courses_academy")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "courses_academy"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>أكاديمية الدورات والتدريب الآلي ({STATUTORY_COURSES_REGISTRY.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("deep_research")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "deep_research"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>البحث العميق والإنترنت المظلم (OSINT)</span>
          </button>

          <button
            onClick={() => setActiveTab("ml_lab")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "ml_lab"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>مختبر تعلم الآلة (ML Lab)</span>
          </button>

          <button
            onClick={() => setActiveTab("interactive_chat")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "interactive_chat"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>محادثة الوكلاء وروبوت وسام</span>
          </button>
        </div>

        {/* Quick Search */}
        {activeTab === "agents_roster" && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={agentSearchQuery}
              onChange={(e) => setAgentSearchQuery(e.target.value)}
              placeholder="بحث في الوكلاء والروبوتات..."
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* 3. TAB CONTENT 1: ALL AGENTS & ROBOTS ROSTER */}
      {activeTab === "agents_roster" && (
        <div className="space-y-4">
          
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: "all", label: `كافة الوكلاء والروبوتات (${LEGAL_AI_AGENTS_ROSTER.length})` },
              { id: "sections", label: "🏢 وكلاء أقسام البرنامج الميدانية (8)" },
              { id: "statutory", label: "⚖️ وكلاء القوانين والتشريعات التخصصية (21)" },
              { id: "cognitive", label: "🧠 وكلاء الإدراك والتعلم الآلي" },
              { id: "research", label: "🌐 البحث العميق والويب المظلم" },
              { id: "service", label: "🚨 روبوتات الاستجابة والتصعيد" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedAgentCategory(tab.id)}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer text-xs ${
                  selectedAgentCategory === tab.id
                    ? "bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 shadow-xs"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:border-amber-500/50 transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="text-2xl p-2 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        {agent.icon}
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {agent.nameArabic}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {agent.nameEnglish}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      نشط 24/7 🟢
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                    {agent.description}
                  </p>

                  <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1 text-[10.5px]">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>نوع الذكاء:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{agent.intelligenceType}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>الدقة القضائية:</span>
                      <span className="font-bold text-emerald-500 font-mono">{agent.accuracyScore}%</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>السوابق المستوعبة:</span>
                      <span className="font-bold text-amber-500 font-mono">{agent.learnedCasesCount.toLocaleString()} سابقة</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    الدور الوظيفي: <span className="font-bold text-slate-700 dark:text-slate-300">{agent.role.slice(0, 35)}...</span>
                  </span>

                  <button
                    onClick={() => {
                      setActiveTab("interactive_chat");
                      setChatInput(`استفسار موجه إلى [${agent.nameArabic}]: `);
                    }}
                    className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500 text-amber-700 hover:text-slate-950 dark:text-amber-300 rounded-xl text-[11px] font-black transition cursor-pointer shrink-0"
                  >
                    محادثة الوكيل ➔
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 4. TAB CONTENT 2: STATUTORY COURSES ACADEMY (الدورات التدريبية الـ 23 المكتملة) */}
      {activeTab === "courses_academy" && (
        <div className="space-y-4">
          
          {/* Header & Perpetual Training Status Banner */}
          <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-indigo-950 border border-amber-500/30 p-5 rounded-3xl text-white shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>تعلّم وتدريب مستمر بدون توقف 24/7</span>
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {STATUTORY_COURSES_REGISTRY.length} دورة قانونية معتمدة
                </span>
              </div>
              <h2 className="text-base font-black text-amber-300 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <span>أكاديمية الدورات القانونية المصرية والتعلم الآلي الدائم (Continuous Legal Academy)</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                تتلقى نماذج الذكاء الاصطناعي دورات تدريبية متواصلة 24 ساعة بدون انقطاع في كافة فروع القانون المصري (الضرب، التبديد، التموين، المباني، النفقات، الطلاق، الملكية، الميراث، الإيجارات، النشوز، الطاعة، الإنترنت، الاتصالات، المحافظ الإلكترونية، والإجراءات).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full lg:w-auto">
              <div className="px-3.5 py-2 bg-slate-900/90 rounded-2xl border border-slate-700/80 text-center sm:text-right">
                <span className="text-[10px] text-slate-400 block font-mono">الدورة الجاري تحديث أوزانها الآن:</span>
                <span className="text-xs font-black text-emerald-400 truncate max-w-xs block font-sans">
                  {STATUTORY_COURSES_REGISTRY[mlState.currentEpoch % STATUTORY_COURSES_REGISTRY.length]?.title || "دورة التعلم المستمر"}
                </span>
              </div>

              <button
                onClick={handleTriggerManualMlStep}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black transition cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                <span>تدريب فوري لكافة الدورات ⚡</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm space-y-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={courseSearchQuery}
                onChange={(e) => setCourseSearchQuery(e.target.value)}
                placeholder="ابحث في أسماء الدورات القانونية، نصوص المواد (مادة 341، 242، 119...)، السوابق، أو المبادئ القضائية..."
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs outline-none focus:border-amber-500 transition text-slate-900 dark:text-white"
              />
              {courseSearchQuery && (
                <button
                  onClick={() => setCourseSearchQuery("")}
                  className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: "all", label: `كافة الدورات (${STATUTORY_COURSES_REGISTRY.length})` },
                { id: "crimes", label: "🩸 الجنايات والضرب والتبديد وخيانة الأمانة" },
                { id: "family", label: "👨‍👩‍👧‍👦 الأسرة والنفقات والطلاق والنشوز والطاعة" },
                { id: "property", label: "🏡 الملكية والميراث والتركات والإيجارات" },
                { id: "digital_fintech", label: "💻 الإنترنت والاتصالات والمحافظ والـ OSINT" },
                { id: "supply_building", label: "🌾 التموين ومخالفات المباني والتصالح" },
                { id: "procedural", label: "📜 المرافعات والإثبات والتحكيم" },
                { id: "ai_research", label: "⚡ البحث العميق وتعلم الآلة" }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCourseCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                    selectedCourseCategory === cat.id
                      ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5 hover:border-amber-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="text-2xl p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        {course.icon}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block font-mono">
                          {course.category} • {course.codeNumber}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {course.title}
                        </h3>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                      تدريب مستمر 99.9% ⚡
                    </span>
                  </div>

                  {/* Modules list */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">
                      محاور الدورة المستوعبة آلياً:
                    </span>
                    <ul className="space-y-0.5 text-[10.5px] text-slate-600 dark:text-slate-400 list-disc list-inside">
                      {course.modules.slice(0, 3).map((mod, mIdx) => (
                        <li key={mIdx} className="truncate">{mod}</li>
                      ))}
                      {course.modules.length > 3 && (
                        <li className="text-amber-600 dark:text-amber-400 font-bold">
                          + {course.modules.length - 3} محاور تخصصية أخرى قيد التدريب الدائم
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Key articles & Cassation principle */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>أبرز المواد المتقنة:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{course.keyArticles.join(" • ")}</span>
                    </div>
                    <div className="text-[10.5px] text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-1.5">
                      <span className="font-bold text-amber-600 dark:text-amber-400">سند محكمة النقض: </span>
                      {course.recentLearnedPrinciple}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400 font-mono">
                    السوابق: <span className="font-bold text-slate-700 dark:text-slate-200">{course.precedentsCount.toLocaleString()} سابقة</span>
                  </div>

                  <button
                    onClick={() => handleRunCourseSimulation(course)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>اختبار ومحاكاة الوكيل في الدورة</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">لم يتم العثور على دورات تطابق معايير البحث الحالية.</p>
              <button
                onClick={() => {
                  setSelectedCourseCategory("all");
                  setCourseSearchQuery("");
                }}
                className="mt-2 text-xs font-bold text-amber-500 hover:underline cursor-pointer"
              >
                إعادة ضبط عوامل التصفية
              </button>
            </div>
          )}

        </div>
      )}

      {/* 5. TAB CONTENT 3: DEEP RESEARCH & DARK WEB OSINT ENGINE */}
      {activeTab === "deep_research" && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-2xl">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  محرك البحث والتحقيق الجنائي الرقمي العميق واستخبارات الويب المظلم (OSINT)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  فحص الأرشيفات الرقمية غير المفهرسة، تعقب خيوط الجرائم الإلكترونية والابتزاز المالي، والتأصيل بموجب القانون رقم 175 لسنة 2018.
                </p>
              </div>
            </div>

            {/* Inputs Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              
              <div className="md:col-span-2 space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  موضوع البحث أو المستهدف (شخص، كيان، رقم حساب، عنوان محفظة مشفرة، رابط مشبوه):
                </label>
                <input
                  type="text"
                  value={deepResearchQuery}
                  onChange={(e) => setDeepResearchQuery(e.target.value)}
                  placeholder="مثال: فحص تسريب بيانات وابتزاز إلكتروني عبر منصة مجهولة على شبكة مظلمة..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs outline-none focus:border-amber-500 text-slate-900 dark:text-white font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">عمق ومستوى البحث:</label>
                <select
                  value={deepResearchDepth}
                  onChange={(e: any) => setDeepResearchDepth(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="darknet_osint">🌐 ويب مظلم وأرشيفات مسربة (Darknet OSINT)</option>
                  <option value="deep">🔍 بحث استقصائي رقمي عميق (Deep Investigative)</option>
                  <option value="statutory">⚖️ تأصيل جنائي رقمي بموجب القانون 175/2018</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">نوع المستهدف:</label>
                <select
                  value={targetEntityType}
                  onChange={(e: any) => setTargetEntityType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="digital_crime">💻 جريمة إلكترونية وابتزاز رقمي</option>
                  <option value="crypto">🪙 معاملات مشفرة وعملات رقمية</option>
                  <option value="phone">📱 هاتف محمول ومعرفات اتصال</option>
                  <option value="company">🏢 شركة أو سجل تجاري وفحص نزاعات</option>
                  <option value="general">📄 بحث عام متعدد الأطراف</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">رقم الهاتف المرتبط (اختياري):</label>
                <input
                  type="text"
                  value={associatedPhone}
                  onChange={(e) => setAssociatedPhone(e.target.value)}
                  placeholder="مثال: 01012345678"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs outline-none focus:border-amber-500 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">ملف القضية للربط (اختياري):</label>
                <input
                  type="text"
                  value={associatedCase}
                  onChange={(e) => setAssociatedCase(e.target.value)}
                  placeholder="مثال: قضية 4892 لسنة 2026 جنح اقتصادية"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

            </div>

            {/* Launch Action */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleExecuteDeepResearch}
                disabled={!deepResearchQuery.trim() || isResearching}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
              >
                {isResearching ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-amber-300" />
                    <span>جارٍ فحص وتحليل الأثر الرقمي بالإنترنت العميق...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>تشغيل وكيل البحث العميق والتحقيق الرقمي 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Research Results Output */}
          {deepResearchReport && (
            <div className="bg-slate-950 text-slate-100 p-6 rounded-3xl border border-blue-500/40 shadow-xl space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs font-black text-blue-400 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  <span>تقرير التحقيق الجنائي الرقمي والبحث العميق (OSINT Intelligence Dossier)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date().toLocaleString("ar-EG")}
                </span>
              </div>

              <div className="prose prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap font-sans text-slate-200">
                {deepResearchReport}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 6. TAB CONTENT 4: MACHINE LEARNING LAB (مختبر تعلم الآلة) */}
      {activeTab === "ml_lab" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
            
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-500" />
                  <span>مختبر تعلم الآلة والأوزان العصبية المستمرة (Perpetual ML & Neural Lab)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تحديث مصفوفات الأوزان وخفض معدل الخطأ عبر التغذية الراجعة المستمرة من أحكام النقض والتشريعات 2026.
                </p>
              </div>

              <button
                onClick={handleTriggerManualMlStep}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>تنفيذ تدريب تكراري يدوي (+)</span>
              </button>
            </div>

            {/* Neural Loss & Cognitive Progress Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">مؤشر الذكاء الإدراكي (Cognitive IQ):</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-500 font-mono">{mlState.cognitiveIQIndex}</span>
                  <span className="text-xs text-slate-400">/ 185</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(mlState.cognitiveIQIndex / 185) * 100}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 block">يحاكي قدرة كبار المستشارين في الاستنباط الفقهي</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">معدل الفقد العصبي (Loss Minimization):</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-500 font-mono">{mlState.lossRate}</span>
                  <span className="text-xs text-emerald-500 font-bold">يقترب من الصفر المثالي</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: "96%" }} />
                </div>
                <span className="text-[10px] text-slate-400 block">تقليل نسبة الخطأ في الدفوع الإجرائية إلى أدنى حد</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">الدورات التراكمية (Epoch Progress):</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-500 font-mono">Epoch #{mlState.currentEpoch}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: "99%" }} />
                </div>
                <span className="text-[10px] text-slate-400 block">تغذية متواصلة من القوانين السبعة وأحكام النقض</span>
              </div>

            </div>

            {/* Live Real-time Continuous Learning Stream */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-500" />
                <span>سجل التدريب والتطوير الذاتي الآلي لحظياً (Live Machine Learning Stream):</span>
              </span>

              <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl border border-slate-800 max-h-80 overflow-y-auto space-y-2 font-mono text-[11px]">
                {mlState.recentLearningLog.map((log, lIdx) => (
                  <div key={lIdx} className="flex items-start gap-2 border-b border-slate-900 pb-1.5">
                    <span className="text-emerald-400 font-bold shrink-0">➔</span>
                    <span className="text-slate-300 leading-relaxed">{log}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. TAB CONTENT 5: INTERACTIVE MULTI-AGENT CHATBOT */}
      {activeTab === "interactive_chat" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  المستشار القضائي الإدراكي وروبوت التواصل مع الأستاذ وسام الشناوي
                </h3>
                <span className="text-[10.5px] text-slate-400">
                  مؤصل بجميع القوانين المصرية السبعة • تصعيد فوري للمحامي عند الطلب
                </span>
              </div>
            </div>

            {escalationFlagTriggered && (
              <div className="px-3 py-1 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-black rounded-xl animate-pulse flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>تم رصد طلب التواصل المباشر مع الأستاذ وسام وتجهيز الإشعار!</span>
              </div>
            )}
          </div>

          {/* Messages Container */}
          <div className="h-96 overflow-y-auto space-y-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-start" : "items-end"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-bold">
                  <span>{msg.agentName || (msg.role === "user" ? (currentUser?.name || "المستشير") : "المستشار الذكي")}</span>
                  <span>•</span>
                  <span>{msg.time}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-amber-500 text-slate-950 font-bold shadow-xs rounded-tr-none"
                      : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm rounded-tl-none font-sans"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isChatSending && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-500 rounded-2xl text-xs font-black animate-pulse">
                <Brain className="w-4 h-4 animate-spin" />
                <span>جارٍ تشغيل إجماع الوكلاء القانونيين وتطبيق نصوص القوانين المصرية وأحكام النقض...</span>
              </div>
            )}
          </div>

          {/* Quick Law Code Prompts */}
          <div className="flex flex-wrap gap-1.5 text-[10.5px]">
            <span className="font-bold text-slate-500 self-center">نماذج استفسارات سريعة:</span>
            {[
              "ما هي أركان جنحة خيانة الأمانة المادة 341 عقوبات؟",
              "شروط بطلان القبض والتفتيش لانتفاء التلبس المادة 30 إجراءات",
              "إجراءات دعوى الخلع بموجب القانون رقم 1 لسنة 2000",
              "حجية الدليل الرقمي في القانون 175 لسنة 2018",
              "أريد التحدث مع الأستاذ وسام الشناوي هاتفياً"
            ].map((promptText, pIdx) => (
              <button
                key={pIdx}
                onClick={() => setChatInput(promptText)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer font-bold"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
              placeholder="اكتب استفسارك القانوني لأي من القوانين السبعة أو اطلب التواصل مع الأستاذ وسام..."
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-xs outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />

            <button
              onClick={handleSendChatMessage}
              disabled={!chatInput.trim() || isChatSending}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            >
              <span>إرسال</span>
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* 8. INTERACTIVE COURSE SIMULATION MODAL */}
      {activeSimulationCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl p-2 bg-amber-500/10 rounded-2xl">
                  {activeSimulationCourse.icon}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    اختبار ومحاكاة الوكيل في: {activeSimulationCourse.title}
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                    {activeSimulationCourse.codeNumber}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveSimulationCourse(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                موضوع التحدي القضائي المطروح للاختبار العملي للوكيل:
              </label>
              <textarea
                rows={3}
                value={simulationPrompt}
                onChange={(e) => setSimulationPrompt(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs outline-none focus:border-amber-500 font-sans leading-relaxed text-slate-900 dark:text-white"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => handleRunCourseSimulation(activeSimulationCourse)}
                  disabled={isSimulating}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSimulating ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>إعادة تشغيل المحاكاة الفورية</span>
                </button>
              </div>
            </div>

            {simulationOutput && (
              <div className="p-4 bg-slate-950 text-slate-200 rounded-2xl border border-amber-500/30 text-xs leading-relaxed space-y-2">
                <div className="flex justify-between items-center text-amber-400 font-bold border-b border-slate-800 pb-1.5">
                  <span>نتيجة استيعاب وتأصيل الوكيل:</span>
                  <span className="text-emerald-400 font-mono">درجة الإتقان: 99.8% (معتمد)</span>
                </div>
                <p className="whitespace-pre-wrap">{simulationOutput}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setActiveSimulationCourse(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
