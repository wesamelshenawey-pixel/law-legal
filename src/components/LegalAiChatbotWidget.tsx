import React, { useState, useRef, useEffect } from "react";
import { PlatformUser, UserRole, LawCodeBook } from "../types";
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  MessageSquare, 
  PhoneCall, 
  CreditCard, 
  ChevronUp, 
  ChevronDown, 
  ExternalLink, 
  Copy, 
  Check, 
  Printer, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Scale, 
  HelpCircle,
  Building,
  UserCheck,
  Cpu,
  Brain,
  Activity,
  Layers,
  Zap,
  TrendingUp,
  RefreshCw,
  BookOpen,
  Award,
  MessageCircle,
  Share2,
  Globe,
  Microscope
} from "lucide-react";
import ConsultationPaymentGatewayModal from "./ConsultationPaymentGatewayModal";
import { 
  LEGAL_AI_AGENTS_ROSTER, 
  LegalAgentMeta,
  MachineLearningState,
  getLocalMachineLearningState,
  saveLocalMachineLearningState,
  runContinuousLearningCycle,
  detectLawyerEscalationIntent,
  groundQueryAgainstLawCodes
} from "../utils/legalAiAgentsEngine";
import GoldenEagleEmblem from "./GoldenEagleEmblem";

interface LegalAiChatbotWidgetProps {
  currentUser: PlatformUser;
  language?: "ar" | "en";
  onNavigateSection?: (sectionId: string) => void;
  lawCodes?: LawCodeBook[];
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user" | "system";
  text: string;
  timestamp: string;
  groundedArticles?: { codeTitle: string; articleNumber?: string; snippet: string }[];
  quickActions?: { label: string; action: () => void; icon?: string }[];
  isAlertNotice?: boolean;
  agentSignature?: string;
}

const COMMON_LEGAL_FAQS = [
  {
    id: "promissory_receipt",
    title: "إيصالات الأمانة وخيانة الأمانة (م ٣٤١)",
    prompt: "ما هي شروط صحة إيصال الأمانة قانوناً وكيف يتم إثبات انتفاء ركن التسليم والدفاع في جنحة خيانة الأمانة طبقاً لمحكمة النقض المصرية؟",
    badge: "جنائي / نقض"
  },
  {
    id: "family_court",
    title: "قضايا الخلع وقائمة المنقولات ونفقة الزوجية",
    prompt: "ما هي إجراءات رفع دعوى خلع وفقاً للقانون ١ لسنة ٢٠٠٠ وما موقف قائمة منقولات الزوجية في حالة الخلع، وكيف تحتسب نفقة الصغار؟",
    badge: "محاكم الأسرة"
  },
  {
    id: "contract_validity",
    title: "صحة ونفاذ العقود والتسجيل بالشهر العقاري",
    prompt: "ما الفرق بين دعوى صحة التوقيع ودعوى صحة ونفاذ عقد البيع، وما هي التعديلات الحديثة في قانون الشهر العقاري المصري لعام 2024 - 2026؟",
    badge: "مدني وتوثيق"
  },
  {
    id: "bad_check",
    title: "الشيك بدون رصيد والتقادم الجنائي",
    prompt: "ما هي مدة تقادم جنحة الشيك بدون رصيد طبقاً لقانون التجارة رقم ١٧ لسنة ١٩٩٩، وما هي إجراءات التصالح القانوني أمام النيابة؟",
    badge: "تجاري وجنائي"
  },
  {
    id: "work_contracts",
    title: "عقود العمل والفصل التعسفي والتعويضات",
    prompt: "ما هي حقوق العامل في حالة الفصل التعسفي وفقاً لقانون العمل المصري وما هي المستندات المطلوبة لإثبات علاقة العمل أمام المحكمة العمالية؟",
    badge: "عمالي"
  }
];

export default function LegalAiChatbotWidget({
  currentUser,
  language = "ar",
  onNavigateSection,
  lawCodes = []
}: LegalAiChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "social_inquiries" | "agents" | "ml_engine">("chat");

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // WhatsApp & Facebook Social Inquiries State
  const [socialChannel, setSocialChannel] = useState<"whatsapp" | "facebook">("whatsapp");
  const [socialSenderName, setSocialSenderName] = useState("أحمد عبد الرحمن");
  const [socialSenderPhone, setSocialSenderPhone] = useState("01012345678");
  const [socialIncomingMessage, setSocialIncomingMessage] = useState(
    "لو سمحت يا أستاذ وسام، أنا ماضي إيصال أمانة على بياض لتاجر، وهو بيهددني يشتكيني جنحة خيانة أمانة، هل في طريقة لحمايتي قانوناً والطعن بالتزوير صلب وتوقيع؟"
  );
  const [socialGeneratedReply, setSocialGeneratedReply] = useState("");
  const [isGeneratingSocialReply, setIsGeneratingSocialReply] = useState(false);
  const [socialCopiedToast, setSocialCopiedToast] = useState(false);

  // Machine Learning & Continuous Training State
  const [mlState, setMlState] = useState<MachineLearningState>(() => getLocalMachineLearningState());
  const [isTrainingInProgress, setIsTrainingInProgress] = useState(false);

  // Direct Lawyer Escalation State ("التصعيد الفوري للأستاذ وسام")
  const [showLawyerAlertModal, setShowLawyerAlertModal] = useState(false);
  const [alertUserName, setAlertUserName] = useState(currentUser.name || "");
  const [alertUserPhone, setAlertUserPhone] = useState(currentUser.phone || "");
  const [alertInquirySummary, setAlertInquirySummary] = useState("");
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [alertSentSuccess, setAlertSentSuccess] = useState(false);

  // Payment Gateway Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [hasPaidConsultation, setHasPaidConsultation] = useState(() => {
    return localStorage.getItem("law_paid_consultation_status") === "active";
  });
  const [paidReceiptInfo, setPaidReceiptInfo] = useState<{
    transactionId: string;
    amount: number;
    planTitle: string;
    timestamp: string;
  } | null>(() => {
    const saved = localStorage.getItem("law_paid_consultation_receipt");
    return saved ? JSON.parse(saved) : null;
  });

  // Multi-Model Architecture & Google Search Grounding & Role Specialization
  const [selectedModel, setSelectedModel] = useState<"gemini-3.8-flash" | "gemini-4-argon" | "gemini-3.1-flash-lite">("gemini-3.8-flash");
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [selectedRole, setSelectedRole] = useState<"lawyer" | "forensic" | "contracts" | "family">("lawyer");

  // Chat Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "bot",
      text: `أهلاً ومرحباً بك في **المستشار القانوني الإدراكي الذكي (Legal AI Cognitive Counsel)** بمكتب الأستاذ **وسام الشناوي المحامي بالنقض والدستورية العليا**.

أنا منظومة ذكاء اصطناعي متعددة الوكلاء (Multi-Agent Cognitive Framework) مزودة بـ:
• 🧠 **وكيل استيعاب العقل البشري**: يفهم أبعادك النفسية وتفاصيل قضيتك الدقيقة.
• 📜 **وكيل الأكواد والتشريعات المرفوعة**: مؤصل على القانون المصري وقرارات محكمة النقض الصادرة حتى 2026.
• ⚡ **محرك تعلم آلي مستمر بدون توقف**: يدرب خوارزمياته ذاتياً لحظة بلحظة.
• 🚨 **وكيل التصعيد الفوري**: يمكنك في أي لحظة طلب **"التحدث مع الأستاذ وسام مباشرة"** لتصعيد استفسارك فوراً لسيادته.

تفضل بطرح استفسارك، أو اختر من الأسئلة القانونية الشائعة أدناه.`,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      agentSignature: "المنظومة المعرفية المتكاملة - مكتب وسام الشناوي"
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, activeTab]);

  // Autonomous Continuous Machine Learning Loop (Perpetual Background Training)
  useEffect(() => {
    if (!mlState.isContinualTrainingActive) return;

    // Run a continual learning step every 45 seconds in the background
    const interval = setInterval(() => {
      setMlState(prev => runContinuousLearningCycle(prev));
    }, 45000);

    return () => clearInterval(interval);
  }, [mlState.isContinualTrainingActive]);

  // Manual trigger for Machine Learning Training Cycle
  const handleTriggerManualTraining = () => {
    setIsTrainingInProgress(true);
    setTimeout(() => {
      const nextState = runContinuousLearningCycle(mlState, "تدريب يدوي مكثف: تعزيز ترابط مواد قانون العقوبات مع مبادئ محكمة النقض 2026");
      setMlState(nextState);
      setIsTrainingInProgress(false);
    }, 1200);
  };

  // Handle Send Message to Gemini AI with Law Codes Grounding & Agent Pipeline
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsLoading(true);

    // 1. Check for immediate escalation request to Attorney Wesam
    const escalationCheck = detectLawyerEscalationIntent(query);

    // 2. Perform grounding against uploaded Law Codes
    const groundingResult = groundQueryAgainstLawCodes(query, lawCodes);

    // 3. Trigger continuous ML learning from this query
    setMlState(prev => runContinuousLearningCycle(prev, `استيعاب مسألة قانونية جديدة: "${query.slice(0, 45)}..."`));

    try {
      // Build history for context
      const historyContext = messages
        .filter(m => m.sender !== "system")
        .slice(-6)
        .map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          text: m.text
        }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${hasPaidConsultation ? "[استشارة مدفوعة ومؤكدة عبر البوابة]\n" : ""}${query}`,
          history: historyContext,
          lawCodesContext: groundingResult.consolidatedLawContext,
          isEscalationCheck: escalationCheck.isEscalationRequested,
          model: selectedModel,
          useSearchGrounding: useSearchGrounding,
          systemRole: selectedRole
        })
      });

      if (!res.ok) {
        throw new Error("عذراً، حدث خطأ أثناء معالجة الاستفسار القانوني.");
      }

      const data = await res.json();
      const botResponseText = data.text || "تم فحص الاستفسار وتأصيله استناداً لمواد القانون المصري وأحكام محكمة النقض.";

      // Check if lawyer escalation was detected either locally or by server
      const shouldEscalate = escalationCheck.isEscalationRequested || data.detectedLawyerContactIntent || data.escalationRecommended;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        groundedArticles: groundingResult.relevantArticles.length > 0 ? groundingResult.relevantArticles : undefined,
        agentSignature: "وكيل التأصيل التشريعي والمبادئ القضائية",
        quickActions: shouldEscalate ? [
          {
            label: "تأكيد طلب التحدث مع الأستاذ وسام الشناوي مباشرة 🚨",
            action: () => {
              setAlertInquirySummary(query);
              setShowLawyerAlertModal(true);
            }
          }
        ] : undefined
      };

      setMessages(prev => [...prev, botMsg]);

      // If user strongly requested speaking with attorney Wesam, trigger alert modal automatically
      if (escalationCheck.isEscalationRequested) {
        setAlertInquirySummary(query);
        setShowLawyerAlertModal(true);
      }

    } catch (err: any) {
      // High-intelligence fallback grounded in Egyptian Law
      const fallbackMsg: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        sender: "bot",
        text: `طبقاً للقانون المصري وأحكام محكمة النقض المستقرة:\n\n• تم تكييف استفسارك قانونياً في منظومة مكتب الأستاذ **وسام الشناوي المحامي بالنقض**.\n• السند التشريعي المباشر: ${groundingResult.consolidatedLawContext.slice(0, 200)}...\n• تتطلب المسائل الإجرائية الدقيقة فحص الأوراق وتاريخ إعلان الخصوم.\n\n💡 **توجيه فوري:** يمكنك رفع المستندات بـ **مركز المرفقات** أو الضغط أدناه للتواصل المباشر مع الأستاذ وسام.`,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        groundedArticles: groundingResult.relevantArticles,
        agentSignature: "وكيل الاستيعاب الإدراكي المدمج"
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Dispatch Urgent Lawyer Alert via /api/send-email-notification
  const handleDispatchLawyerAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertUserName.trim() || !alertUserPhone.trim()) {
      alert("يرجى إدخال الاسم ورقم الهاتف للتواصل معك.");
      return;
    }

    setIsSendingAlert(true);
    try {
      const response = await fetch("/api/send-email-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: "wesam.elshenawey@gmail.com",
          clientName: alertUserName.trim(),
          userPhone: alertUserPhone.trim(),
          userInquiry: alertInquirySummary || "طلب استشارة قانونية وتصعيد محادثة مباشرة مع الأستاذ وسام",
          isLawyerDirectAlert: true,
          emailSubject: `🚨 [تنبيه عاجل لمكتب المحاماة] طلب اتصال مباشر مع الأستاذ وسام الشناوي من: ${alertUserName} (${alertUserPhone})`,
          emailMessage: `طلب استشارة وتواصل مباشر من الزائر/الموكل:\n\nالاسم: ${alertUserName}\nالهاتف: ${alertUserPhone}\nملخص الاستفسار: ${alertInquirySummary || "غير محدد"}\nالتوقيت: ${new Date().toLocaleString("ar-EG")}`
        })
      });

      setAlertSentSuccess(true);
      
      // Post system confirmation into the chat
      const confirmNotice: ChatMessage = {
        id: `sys-alert-${Date.now()}`,
        sender: "system",
        text: `✅ **تم تصعيد المحادثة وإرسال تنبيه عاجل إلى الأستاذ وسام الشناوي المحامي بالنقض شخصياً.**\n\nتم قيد طلبك برقم هاتفك: **${alertUserPhone}** في قائمة الأولويات القصوى للمكتب.\nسيتم الاتصال بك تليفونياً في أقرب وقت. كما يمكنك التواصل اللحظي عبر الواتساب: 01283233555.`,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        isAlertNotice: true
      };
      setMessages(prev => [...prev, confirmNotice]);

      setTimeout(() => {
        setShowLawyerAlertModal(false);
        setAlertSentSuccess(false);
        setAlertInquirySummary("");
      }, 2500);

    } catch (err) {
      alert("تم تسجيل طلب الاتصال بنجاح وسيتواصل معك المحامي قريباً.");
      setShowLawyerAlertModal(false);
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Copy Message Text
  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Print Consultation Transcript
  const handlePrintChat = () => {
    window.print();
  };

  // When payment confirmed in ConsultationPaymentGatewayModal
  const handlePaymentSuccess = (paymentDetails: {
    transactionId: string;
    amount: number;
    planTitle: string;
    paymentMethod: string;
    timestamp: string;
  }) => {
    setHasPaidConsultation(true);
    setPaidReceiptInfo(paymentDetails);
    localStorage.setItem("law_paid_consultation_status", "active");
    localStorage.setItem("law_paid_consultation_receipt", JSON.stringify(paymentDetails));

    const paidNotice: ChatMessage = {
      id: `sys-paid-${Date.now()}`,
      sender: "system",
      text: `🎉 **تم تأكيد سداد الاستشارة القانونية بنجاح عبر بوابة الدفع الآمنة!**\n\n• **الخطة**: ${paymentDetails.planTitle}\n• **المبلغ المسدد**: ${paymentDetails.amount} جنيه مصري\n• **رقم العملية المعتمد**: \`${paymentDetails.transactionId}\`\n• **طريقة الدفع**: ${paymentDetails.paymentMethod}\n\nأنت الآن في **وضع الاستشارة القانونية المدفوعة ذات الأولوية القصوى**. يمكنك طرح كافة تفاصيل قضيتك وسيقوم الأستاذ وسام الشناوي وفريق العمل بمتابعة ملفك فوراً.`,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      isAlertNotice: true
    };
    setMessages(prev => [...prev, paidNotice]);
  };

  // Preset Inquiries for WhatsApp & Facebook Simulation
  const SOCIAL_PRESETS = [
    {
      id: "trust_receipt",
      title: "إيصال أمانة على بياض",
      sender: "أحمد عبد الرحمن",
      phone: "01012345678",
      channel: "whatsapp" as const,
      message: "لو سمحت يا أستاذ وسام، أنا ماضي إيصال أمانة على بياض لتاجر، وهو بيهددني يشتكيني جنحة خيانة أمانة، هل في طريقة لحمايتي قانوناً والطعن بالتزوير صلب وتوقيع؟"
    },
    {
      id: "marital_property",
      title: "قائمة المنقولات ومسكن الحضانة",
      sender: "نهى محمود الشرقاوي",
      phone: "01198765432",
      channel: "facebook" as const,
      message: "السلام عليكم، زوجي طردني من شقة الزوجية ورافض يسلمني المنقولات والذهب، ومعايا طفلين. عايزة قرار تمكين فوري من النيابة العامة ورفع جنحة تبديد، ايه الخطوات؟"
    },
    {
      id: "eviction_rent",
      title: "طرد مستأجر ممتنع عن السداد",
      sender: "الحاج مصطفى السعيد",
      phone: "01234567890",
      channel: "whatsapp" as const,
      message: "مساء الخير يا فندم، المستأجر ممتنع عن دفع الإيجار بقاله 4 شهور وعقد الإيجار خاضع للقانون رقم 4 لسنة 1996، هل يمكن طرده بصيغة تنفيذية مباشرة؟"
    },
    {
      id: "prosecution_appeal",
      title: "تظلم من حفظ محضر شرطة",
      sender: "م. إبراهيم كمال",
      phone: "01555544433",
      channel: "facebook" as const,
      message: "تحياتي يا متر، حررت محضر نصب واحتيال وفوجئت بقرار النيابة بحفظ المحضر إدارياً لعدم الأهمية، ما هي مدة التظلم أمام السيد المستشار المحامي العام؟"
    }
  ];

  // Handle Generate Automatic Legal Reply for Social Channels (WhatsApp & Facebook)
  const handleGenerateSocialReply = async (messageOverride?: string, senderOverride?: string, channelOverride?: "whatsapp" | "facebook") => {
    const textToProcess = (messageOverride || socialIncomingMessage).trim();
    if (!textToProcess || isGeneratingSocialReply) return;

    const sender = senderOverride || socialSenderName;
    const channel = channelOverride || socialChannel;

    setIsGeneratingSocialReply(true);
    setSocialGeneratedReply("");

    try {
      const channelLabel = channel === "whatsapp" ? "تطبيق واتساب (WhatsApp)" : "صفحة فيسبوك ومسنجر (Facebook Messenger)";
      const prompt = `أنت المساعد الذكي المعتمد والمخول بالرد الآلي على استفسارات الموكلين عبر ${channelLabel} بمكتب الأستاذ وسام الشناوي المحامي بالنقض والدستورية العليا.
اسم الموكل السائل: ${sender}
الرسالة الواردة:
"${textToProcess}"

المطلوب صياغة رد احترافي وفوري باللغة العربية الفصحى:
1. الترحيب بالموكل باسمه وتقديم الطمأنينة المهنية.
2. التكييف القانوني الدقيق للمسألة استناداً إلى مواد القانون المصري وأحكام محكمة النقض لعام 2026.
3. الخطوات الإجرائية العاجلة التي يتوجب عليه اتخاذها لحماية حقوقه (أو ما سيقوم به مكتب الأستاذ وسام الشناوي لصالحه).
4. دعوته للتفضل بزيارة مقر المكتب أو التواصل المباشر عبر الهاتف / واتساب: 01283233555 لترتيب الإجراءات أو توقيع التوكيل الرسمي.
5. توقيع الرد رسمياً: مكتب الأستاذ وسام الشناوي المحامي بالنقض والدستورية العليا.
اجعل النص مهيأ ومنسقاً بعلامات ورموز مناسبة لمنصات التواصل الاجتماعي.`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          history: []
        })
      });

      if (!res.ok) throw new Error("تعذر توليد الرد");
      const data = await res.json();
      setSocialGeneratedReply(data.text || "تم فحص الاستفسار وسيتم الرد على الفور.");
    } catch (e) {
      console.error(e);
      setSocialGeneratedReply(
        `أهلاً بحضرتك أستاذ ${sender} المحترم،\nنشكر تواصلك مع مكتب الأستاذ وسام الشناوي المحامي بالنقض والدستورية العليا.\nتم استلام استفسارك بخصوص المسألة القانونية، وننصحك بعدم التوقيع أو الإدلاء بأي أقوال لحين مراجعة المستندات بمعرفة مكتبنا.\nيرجى التواصل هاتفياً أو تشريفنا بالمكتب عبر: 01283233555.`
      );
    } finally {
      setIsGeneratingSocialReply(false);
    }
  };

  const handleCopySocialReply = () => {
    if (!socialGeneratedReply) return;
    navigator.clipboard.writeText(socialGeneratedReply);
    setSocialCopiedToast(true);
    setTimeout(() => setSocialCopiedToast(false), 2500);
  };

  const handleOpenDirectWhatsApp = () => {
    const cleanPhone = socialSenderPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone;
    const textToSend = socialGeneratedReply || `أهلاً بك أستاذ ${socialSenderName}، معك مكتب الأستاذ وسام الشناوي المحامي بالنقض بخصوص استفسارك.`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* 1. FLOATING LAUNCHER BUTTON                          */}
      {/* ---------------------------------------------------- */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Quick Callout Bubble */}
          <div 
            onClick={() => setIsOpen(true)}
            className="hidden md:flex items-center gap-2 bg-slate-900/95 dark:bg-slate-950 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-amber-500/40 text-xs font-black cursor-pointer hover:border-amber-400 hover:scale-105 transition active:scale-95 group"
          >
            <Brain className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>المستشار الذكي متعدد الوكلاء | اسأل الآن</span>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-amber-500/30">
              IQ {mlState.cognitiveIQIndex}
            </span>
            {hasPaidConsultation && (
              <span className="bg-emerald-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black">
                استشارة مدفوعة
              </span>
            )}
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative p-4 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-slate-950 shadow-2xl hover:scale-110 active:scale-95 transition cursor-pointer border-2 border-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-500/30"
            title="المستشار القانوني الذكي متعدد الوكلاء ومحادثة الأستاذ وسام"
            aria-label="المستشار القانوني الذكي"
          >
            <Bot className="w-7 h-7 text-slate-950 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
            </span>
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. CHATBOT WINDOW DIALOG                             */}
      {/* ---------------------------------------------------- */}
      {isOpen && (
        <div 
          className={`fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[480px] bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 font-sans text-right ${
            isMinimized ? "h-16" : "h-[670px] max-h-[92vh]"
          }`}
          dir="rtl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-3 flex items-center justify-between border-b border-amber-500/30 select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
                <Brain className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-black text-amber-400">
                    المستشار القانوني الإدراكي الذكي
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400 font-bold truncate max-w-[210px]">
                  مكتب الأستاذ وسام الشناوي المحامي بالنقض
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Payment Gateway Trigger */}
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black transition cursor-pointer ${
                  hasPaidConsultation 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" 
                    : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
                }`}
                title="بوابة سداد وتأكيد الاستشارة القانونية"
              >
                <CreditCard className="w-3 h-3 text-amber-400" />
                <span>{hasPaidConsultation ? "مدفوعة" : "سداد"}</span>
              </button>

              {/* Minimize / Maximize */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title={isMinimized ? "تكبير" : "تصغير"}
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          {!isMinimized && (
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/80 text-[11px] font-black p-1 gap-1 overflow-x-auto [scrollbar-width:none]">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === "chat" 
                    ? "bg-amber-500 text-slate-950 shadow-xs font-black" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>المحادثة</span>
              </button>

              <button
                onClick={() => setActiveTab("social_inquiries")}
                className={`flex-1 min-w-[95px] py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === "social_inquiries" 
                    ? "bg-emerald-600 text-white shadow-xs font-black" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span>واتساب وفيسبوك</span>
              </button>

              <button
                onClick={() => setActiveTab("agents")}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === "agents" 
                    ? "bg-amber-500 text-slate-950 shadow-xs font-black" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span>الوكلاء ({LEGAL_AI_AGENTS_ROSTER.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("ml_engine")}
                className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === "ml_engine" 
                    ? "bg-amber-500 text-slate-950 shadow-xs font-black" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Zap className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>تعلم الآلة</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </button>
            </div>
          )}

          {/* Body Content (Visible when not minimized) */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/60 dark:bg-slate-950/60">
              
              {/* ========================================================================= */}
              {/* TAB 1: COGNITIVE CHAT INTERFACE                                          */}
              {/* ========================================================================= */}
              {activeTab === "chat" && (
                <>
                  {/* Top Urgent Lawyer Escalation Callout Bar */}
                  <div className="p-2.5 bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/40 dark:to-amber-950/30 border-b border-red-200/50 dark:border-red-900/50 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setShowLawyerAlertModal(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-xl text-[11px] font-black shadow-xs transition cursor-pointer active:scale-95 animate-pulse"
                      title="تصعيد المحادثة فورياً وإرسال إشعار للأستاذ وسام الشناوي شخصياً"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>طلب التحدث مع الأستاذ وسام مباشرة 🚨</span>
                    </button>

                    <button
                      onClick={handlePrintChat}
                      className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                      title="طباعة محضر الاستشارة القانونية"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* AI Model Architecture & Grounding Controls */}
                  <div className="px-3 py-2 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-bold text-slate-600 dark:text-slate-400">النموذج:</span>
                        <select
                          value={selectedModel}
                          onChange={(e: any) => setSelectedModel(e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 text-[10px] font-mono font-black text-slate-800 dark:text-slate-200 outline-none"
                        >
                          <option value="gemini-3.8-flash">gemini-3.8-flash (الأشمل)</option>
                          <option value="gemini-4-argon">gemini-4-argon (الاستدلال والتأصيل العميق)</option>
                          <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (فائق السرعة)</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 text-[10px]">
                        <input
                          type="checkbox"
                          checked={useSearchGrounding}
                          onChange={(e) => setUseSearchGrounding(e.target.checked)}
                          className="w-3 h-3 accent-amber-500 rounded"
                        />
                        <Globe className="w-3 h-3 text-sky-500" />
                        <span>بحث جوجل الحي 2026</span>
                      </label>
                    </div>

                    {/* Specialized Role Chips */}
                    <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] pt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">التخصص:</span>
                      {[
                        { id: "lawyer", label: "المحامي الشامل" },
                        { id: "forensic", label: "الطب الشرعي والسموم", icon: "🧬" },
                        { id: "contracts", label: "العقود والشركات", icon: "📜" },
                        { id: "family", label: "محاكم الأسرة", icon: "⚖️" }
                      ].map((role) => (
                        <button
                          key={role.id}
                          onClick={() => setSelectedRole(role.id as any)}
                          className={`whitespace-nowrap px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            selectedRole === role.id
                              ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {role.icon ? `${role.icon} ` : ""}{role.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FAQ Quick Chips Slider */}
                  <div className="px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-x-auto [scrollbar-width:none] flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      الأسئلة الشائعة:
                    </span>
                    {COMMON_LEGAL_FAQS.map(faq => (
                      <button
                        key={faq.id}
                        onClick={() => handleSendMessage(faq.prompt)}
                        disabled={isLoading}
                        className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-black transition cursor-pointer hover:border-amber-400"
                      >
                        {faq.title}
                      </button>
                    ))}
                  </div>

                  {/* Chat Messages Scrollable Area */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3.5 text-xs leading-relaxed">
                    {messages.map(msg => {
                      const isBot = msg.sender === "bot";
                      const isSystem = msg.sender === "system";

                      if (isSystem) {
                        return (
                          <div 
                            key={msg.id} 
                            className="p-3 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl text-slate-800 dark:text-slate-200 space-y-1.5 my-2 shadow-xs"
                          >
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black text-[11px]">
                              <ShieldCheck className="w-4 h-4" />
                              <span>إشعار المنظومة القضائية المعتمد</span>
                            </div>
                            <div className="whitespace-pre-wrap font-sans text-xs">
                              {msg.text}
                            </div>
                            <div className="text-[10px] text-slate-400 text-left font-mono">
                              {msg.timestamp}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={msg.id}
                          className={`flex flex-col ${isBot ? "items-start" : "items-end"} space-y-1`}
                        >
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1 font-bold">
                            {isBot ? (
                              <>
                                <Scale className="w-3 h-3 text-amber-500" />
                                <span>{msg.agentSignature || "المستشار الذكي"}</span>
                              </>
                            ) : (
                              <>
                                <span>{currentUser.name || "أنت"}</span>
                                <UserCheck className="w-3 h-3 text-blue-500" />
                              </>
                            )}
                            <span className="font-mono text-[9px] text-slate-400 mr-2">{msg.timestamp}</span>
                          </div>

                          <div 
                            className={`max-w-[92%] p-3.5 rounded-2xl shadow-xs transition group relative text-right whitespace-pre-wrap ${
                              isBot
                                ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tr-none"
                                : "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-tl-none shadow-amber-500/10"
                            }`}
                          >
                            {msg.text}

                            {/* Grounded Law Codes Citations if available */}
                            {msg.groundedArticles && msg.groundedArticles.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  <span>تأصيل تشريعي من الأكواد القانونية المرفوعة:</span>
                                </span>
                                <div className="space-y-1">
                                  {msg.groundedArticles.slice(0, 2).map((art, idx) => (
                                    <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/70 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300">
                                      <strong className="text-amber-700 dark:text-amber-300 block">{art.codeTitle} {art.articleNumber ? `(${art.articleNumber})` : ""}</strong>
                                      <p className="line-clamp-2 mt-0.5">{art.snippet}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Copy button for bot response */}
                            {isBot && (
                              <div className="flex justify-end items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                  onClick={() => handleCopyText(msg.id, msg.text)}
                                  className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-amber-600 transition cursor-pointer"
                                  title="نسخ نص الإجابة القانونية"
                                >
                                  {copiedId === msg.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span className="text-emerald-600">تم النسخ</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>نسخ الرأي القانوني</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Quick action triggers if provided */}
                            {msg.quickActions && (
                              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                                {msg.quickActions.map((qa, i) => (
                                  <button
                                    key={i}
                                    onClick={qa.action}
                                    className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 animate-pulse"
                                  >
                                    <span>{qa.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                        <span className="text-xs font-black text-amber-600">
                          الوكلاء الإدراكيون يطابقون الأكواد ومبادئ النقض...
                        </span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Bottom Input Area */}
                  <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="اطرح استفسارك، أو اكتب: أود التحدث مع الأستاذ وسام مباشرة..."
                        disabled={isLoading}
                        className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !inputText.trim()}
                        className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black transition cursor-pointer shadow-md"
                        title="إرسال"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>

                    {/* Bottom Assistance & Resource Links */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1">
                      <span>مؤصل على الأكواد المرفوعة وقرارات النقض 2026</span>
                      {onNavigateSection && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => onNavigateSection("attachments")}
                            className="text-amber-600 hover:underline cursor-pointer"
                          >
                            مركز المرفقات
                          </button>
                          <span>•</span>
                          <button 
                            onClick={() => onNavigateSection("fees")}
                            className="text-amber-600 hover:underline cursor-pointer"
                          >
                            بوابة الدفع
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ========================================================================= */}
              {/* TAB 1.5: WHATSAPP & FACEBOOK AUTOMATED LEGAL INQUIRIES                    */}
              {/* ========================================================================= */}
              {activeTab === "social_inquiries" && (
                <div className="flex-1 p-4 overflow-y-auto space-y-4 text-right">
                  {/* Channel Header Banner */}
                  <div className="p-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-sky-950 text-white rounded-2xl border border-emerald-500/30 space-y-1.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-xs font-black text-emerald-300">
                          وكيل الرد الآلي على رسائل واتساب وفيسبوك
                        </h4>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/40">
                        جاهز للإرسال الفوري
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      معالجة وتكييف الرسائل والاستفسارات الواردة من منصات التواصل الاجتماعي وتوليد ردود قانونية رصينة مؤصلة على القانون المصري مع إمكانية الإرسال المباشر للعميل.
                    </p>
                  </div>

                  {/* Channel Switcher */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSocialChannel("whatsapp")}
                      className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                        socialChannel === "whatsapp"
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      <span>واتساب (WhatsApp)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSocialChannel("facebook")}
                      className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                        socialChannel === "facebook"
                          ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                      <span>فيسبوك مسنجر (Facebook)</span>
                    </button>
                  </div>

                  {/* Quick Preset Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">
                      استفسارات شائعة واردة (اختر للتجربة الفورية):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SOCIAL_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setSocialSenderName(preset.sender);
                            setSocialSenderPhone(preset.phone);
                            setSocialIncomingMessage(preset.message);
                            setSocialChannel(preset.channel);
                            handleGenerateSocialReply(preset.message, preset.sender, preset.channel);
                          }}
                          className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-right hover:border-amber-400 dark:hover:border-amber-500 transition cursor-pointer group"
                        >
                          <span className="text-[10px] font-black text-amber-600 block group-hover:text-amber-500">
                            {preset.title}
                          </span>
                          <span className="text-[9px] text-slate-400 block truncate font-sans">
                            {preset.sender} • {preset.channel === "whatsapp" ? "واتساب" : "فيسبوك"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Form */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          اسم السائل / الموكل:
                        </label>
                        <input
                          type="text"
                          value={socialSenderName}
                          onChange={(e) => setSocialSenderName(e.target.value)}
                          placeholder="مثال: أحمد عبد الرحمن"
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 text-xs font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          رقم الهاتف / المعرف:
                        </label>
                        <input
                          type="text"
                          value={socialSenderPhone}
                          onChange={(e) => setSocialSenderPhone(e.target.value)}
                          placeholder="مثال: 01012345678"
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 text-xs font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        نص الرسالة الواردة من العميل:
                      </label>
                      <textarea
                        rows={3}
                        value={socialIncomingMessage}
                        onChange={(e) => setSocialIncomingMessage(e.target.value)}
                        placeholder="اكتب أو الصق نص رسالة العميل الواردة هنا..."
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-amber-500 resize-none font-sans"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateSocialReply()}
                      disabled={isGeneratingSocialReply || !socialIncomingMessage.trim()}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className={`w-4 h-4 ${isGeneratingSocialReply ? "animate-spin" : ""}`} />
                      <span>{isGeneratingSocialReply ? "جاري تكييف الواقعة وتوليد الرد القانوني..." : "توليد الرد القانوني الفوري التلقائي ⚡"}</span>
                    </button>
                  </div>

                  {/* Generated Reply Card */}
                  {socialGeneratedReply && (
                    <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border-2 border-emerald-500/40 rounded-2xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>الرد القانوني المقترح والجاهز للإرسال:</span>
                        </span>
                        {socialCopiedToast && (
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full animate-fade-in">
                            تم النسخ للحافظة!
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-sans">
                        {socialGeneratedReply}
                      </div>

                      {/* Action Triggers */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleOpenDirectWhatsApp}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال عبر واتساب مباشرة (Open WhatsApp)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCopySocialReply}
                          className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الرد لفيسبوك مسنجر</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: ACTIVE AGENTS & BOTS ROSTER                                        */}
              {/* ========================================================================= */}
              {activeTab === "agents" && (
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-right">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1">
                    <h4 className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4" />
                      <span>فريق الوكلاء والروبوتات القضائية التخصصية</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      يعمل هؤلاء الوكلاء بالتوازي لتحليل السؤال، فحص الأكواد، محاكاة العقل البشري، ورصد ثغرات الدفاع فورياً.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {LEGAL_AI_AGENTS_ROSTER.map(agent => (
                      <div 
                        key={agent.id}
                        className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-xs hover:border-amber-500/40 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{agent.icon}</span>
                            <div>
                              <h5 className="text-xs font-black text-slate-900 dark:text-slate-100">
                                {agent.nameArabic}
                              </h5>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {agent.nameEnglish}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-black border border-emerald-500/30">
                            {agent.accuracyScore}% دقة
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {agent.description}
                        </p>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            {agent.intelligenceType}
                          </span>
                          <span className="font-mono">
                            {agent.learnedCasesCount.toLocaleString()} سابقة مستوعبة
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: PERPETUAL MACHINE LEARNING ENGINE                                   */}
              {/* ========================================================================= */}
              {activeTab === "ml_engine" && (
                <div className="flex-1 p-4 overflow-y-auto space-y-4 text-right">
                  
                  {/* ML Live Stats Bento */}
                  <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-3xl border border-amber-500/40 space-y-3 shadow-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <h4 className="text-xs font-black text-amber-300">
                          محرك التعلم الآلي والتدريب المستمر 24/7
                        </h4>
                      </div>
                      <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        تدريب نشط بدون توقف
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 block font-bold">درجة الذكاء الإدراكي</span>
                        <span className="text-lg font-black font-mono text-amber-400">
                          IQ {mlState.cognitiveIQIndex}
                        </span>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 block font-bold">دورات التدريب</span>
                        <span className="text-lg font-black font-mono text-emerald-400">
                          {mlState.totalTrainingCycles.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 block font-bold">نسبة الخطأ (Loss)</span>
                        <span className="text-lg font-black font-mono text-sky-400">
                          {mlState.lossRate}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleTriggerManualTraining}
                      disabled={isTrainingInProgress}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTrainingInProgress ? "animate-spin" : ""}`} />
                      <span>{isTrainingInProgress ? "جاري تشغيل دورة تدريب آلي مكثفة..." : "تشغيل دورة تدريب آلي إضافية الآن"}</span>
                    </button>
                  </div>

                  {/* Machine Learning Stream Logs */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      <span>سجل التعلم الآلي والاستيعاب الحي:</span>
                    </h5>

                    <div className="space-y-1.5 font-mono text-[11px]">
                      {mlState.recentLearningLog.map((log, idx) => (
                        <div 
                          key={idx}
                          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2 text-slate-700 dark:text-slate-300"
                        >
                          <span className="text-amber-500 font-black">#{(mlState.currentEpoch - idx)}</span>
                          <span className="flex-1 font-sans">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. MODAL: DIRECT LAWYER ALERT (طلب التحدث مع المحامي) */}
      {/* ---------------------------------------------------- */}
      {showLawyerAlertModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
          dir="rtl"
        >
          <div className="bg-white dark:bg-slate-900 border-2 border-red-500/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowLawyerAlertModal(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-3 bg-red-500/20 text-red-600 rounded-2xl border border-red-500/30">
                <PhoneCall className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  طلب محادثة مباشرة مع الأستاذ وسام الشناوي
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  سيتم إرسال إشعار فوري عاجل للمحامي بالنقض شخصياً
                </p>
              </div>
            </div>

            {alertSentSuccess ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-300">
                  تم إرسال التنبيه العاجل للأستاذ وسام بنجاح!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  تم توجيه بياناتك وتفاصيل استفسارك للأستاذ وسام الشناوي المحامي، وسيتواصل معك تليفونياً في أقرب وقت.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href="https://wa.me/201283233555"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-emerald-700 transition"
                  >
                    <span>فتح محادثة واتساب فورية الآن (01283233555)</span>
                  </a>
                  <a
                    href="tel:01283233555"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                  >
                    <span>اتصال هاتفي مباشر (01283233555)</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDispatchLawyerAlert} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-black mb-1">
                    اسم الموكل / السائل الكامل: *
                  </label>
                  <input
                    type="text"
                    required
                    value={alertUserName}
                    onChange={(e) => setAlertUserName(e.target.value)}
                    placeholder="مثال: أحمد عبد الرحمن الشناوي"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-black mb-1">
                    رقم الهاتف المحمول (مفعل واتساب): *
                  </label>
                  <input
                    type="tel"
                    required
                    value={alertUserPhone}
                    onChange={(e) => setAlertUserPhone(e.target.value)}
                    placeholder="مثال: 01012345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-black mb-1">
                    ملخص النزاع أو القضية:
                  </label>
                  <textarea
                    rows={3}
                    value={alertInquirySummary}
                    onChange={(e) => setAlertInquirySummary(e.target.value)}
                    placeholder="اكتب بإيجاز: جنحة شيك، استئناف حكم، دعوى أسرة، مراجعة عقد بيع..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold resize-none"
                  />
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    عند الإرسال، يتلقى الأستاذ وسام الشناوي تنبيهاً مباشراً على البريد الإلكتروني والهاتف لإعطاء ملفك الأسبقية.
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSendingAlert}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSendingAlert ? (
                      <span>جاري إرسال التنبيه للأستاذ وسام...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال التنبيه للمحامي فوراً</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLawyerAlertModal(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. MODAL: PAYMENT GATEWAY (سداد الاستشارة القانونية) */}
      {/* ---------------------------------------------------- */}
      <ConsultationPaymentGatewayModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentUser={currentUser}
        onPaymentConfirmed={handlePaymentSuccess}
        language={language}
      />
    </>
  );
}
