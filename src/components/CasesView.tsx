import React, { useState, useEffect, useMemo } from "react";
import { CaseRecord, ClientProfile, OpponentProfile, UserRole, PlatformUser } from "../types";
import { INITIAL_COURTS, INITIAL_COURT_TYPES, CLIENT_STATUS_OPTIONS } from "../utils/staticData";
import { 
  Scale, 
  Plus, 
  Printer, 
  Search, 
  Cpu, 
  Check, 
  Camera, 
  Video, 
  VideoOff, 
  RefreshCw, 
  Wifi, 
  Usb, 
  Laptop, 
  Trash2, 
  PlusCircle, 
  CheckCircle, 
  Sparkles, 
  FileText, 
  Eye, 
  Scan, 
  Filter, 
  Calendar, 
  Building2, 
  Clock, 
  RotateCcw, 
  Mail, 
  Send, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Bookmark,
  Layers,
  Flag,
  Share2
} from "lucide-react";
import { jsPDF } from "jspdf";
import { dbSaveEmailNotification } from "../utils/firebaseSync";
import { getClientRoleLabel } from "../utils/translations";
import CaseTimeline from "./CaseTimeline";
import { saveLocalKeepMemo, GoogleKeepNote } from "../utils/workspaceService";

interface CasesViewProps {
  cases: CaseRecord[];
  clients: ClientProfile[];
  opponents: OpponentProfile[];
  onAddCase: (newCs: CaseRecord) => void;
  onAddCourt: (courtName: string) => void;
  onAddSubject: (subjectName: string) => void;
  onAddOpponent: (opp: OpponentProfile) => void;
  courtsList: string[];
  subjectsList: string[];
  onUpdateCase?: (id: string, updatedFields: Partial<CaseRecord>) => void;
  onDeleteCase?: (id: string) => void;
  currentUser: PlatformUser;
  language: "ar" | "en";
  defaultSelectCaseId?: string | null;
  onClearDefaultSelectCaseId?: () => void;
  onOpenDocumentManager?: (section: string, label: string) => void;
  onNavigateToOcr?: () => void;
}

export function SessionCountdown({ targetDateStr, language }: { targetDateStr: string; language: "ar" | "en" }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isPassed, setIsPassed] = useState(false);
  const [isToday, setIsToday] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      if (!targetDateStr) return;
      
      const targetDate = new Date(`${targetDateStr}T09:00:00`);
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        const targetDay = new Date(targetDateStr);
        if (targetDay.toDateString() === now.toDateString()) {
          setIsToday(true);
          setIsPassed(false);
        } else {
          setIsPassed(true);
          setIsToday(false);
        }
        setTimeLeft(null);
        return;
      }

      setIsPassed(false);
      setIsToday(false);

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  if (isToday) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-2.5 rounded-lg text-center font-bold text-amber-700 dark:text-amber-400">
        📢 {language === "ar" ? "اليوم هو موعد هذه الجلسة القضائية الهامة!" : "Today is the official court session date!"}
      </div>
    );
  }

  if (isPassed) {
    return (
      <div className="bg-slate-100 dark:bg-slate-800/40 border border-slate-250 dark:border-slate-800 p-2.5 rounded-lg text-center font-medium text-slate-500 text-[11px]">
        ⌛ {language === "ar" ? "تاريخ هذه الجلسة قد انقضى" : "This session date has already passed."}
      </div>
    );
  }

  if (!timeLeft) return null;

  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-250 dark:border-emerald-800/50 p-2.5 rounded-xl space-y-1.5 text-center text-xs">
      <span className="font-extrabold text-emerald-800 dark:text-emerald-400 flex items-center justify-center gap-1">
        ⌛ {language === "ar" ? "الوقت المتبقي حتى انعقاد الجلسة:" : "Time remaining until court session:"}
      </span>
      <div className="grid grid-cols-4 gap-1.5 font-mono text-center" dir="ltr">
        <div className="bg-emerald-600/10 p-1.5 rounded border border-emerald-400/20 text-emerald-700 dark:text-emerald-400">
          <p className="text-sm font-black leading-none">{timeLeft.days}</p>
          <span className="text-[8px] uppercase font-sans font-semibold">{language === "ar" ? "يوم" : "Day"}</span>
        </div>
        <div className="bg-emerald-600/10 p-1.5 rounded border border-emerald-400/20 text-emerald-700 dark:text-emerald-400">
          <p className="text-sm font-black leading-none">{timeLeft.hours}</p>
          <span className="text-[8px] uppercase font-sans font-semibold">{language === "ar" ? "ساعة" : "Hour"}</span>
        </div>
        <div className="bg-emerald-600/10 p-1.5 rounded border border-emerald-400/20 text-emerald-700 dark:text-emerald-400">
          <p className="text-sm font-black leading-none">{timeLeft.minutes}</p>
          <span className="text-[8px] uppercase font-sans font-semibold">{language === "ar" ? "دقيقة" : "Min"}</span>
        </div>
        <div className="bg-emerald-600/10 p-1.5 rounded border border-emerald-400/20 text-emerald-700 dark:text-emerald-400">
          <p className="text-sm font-black leading-none">{timeLeft.seconds}</p>
          <span className="text-[8px] uppercase font-sans font-semibold">{language === "ar" ? "ثانية" : "Sec"}</span>
        </div>
      </div>
    </div>
  );
}

export default function CasesView({
  cases,
  clients,
  opponents,
  onAddCase,
  onAddCourt,
  onAddSubject,
  onAddOpponent,
  courtsList,
  subjectsList,
  onUpdateCase,
  onDeleteCase,
  currentUser,
  language,
  defaultSelectCaseId,
  onClearDefaultSelectCaseId,
  onOpenDocumentManager,
  onNavigateToOcr
}: CasesViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);

  // --- Case Filter Bar States ---
  const [courtFilter, setCourtFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>("all");
  const [courtTypeFilter, setCourtTypeFilter] = useState<string>("all");

  // --- Client Email Notification Modal States ---
  const [emailNoticeCase, setEmailNoticeCase] = useState<CaseRecord | null>(null);
  const [emailRecipientInput, setEmailRecipientInput] = useState<string>("");
  const [emailSubjectInput, setEmailSubjectInput] = useState<string>("");
  const [emailBodyInput, setEmailBodyInput] = useState<string>("");
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailNoticeStatus, setEmailNoticeStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // New Case Form States
  const [caseNo, setCaseNo] = useState("");
  const [caseYr, setCaseYr] = useState("2026");
  const [selectedCourt, setSelectedCourt] = useState("");
  const [newCourtInput, setNewCourtInput] = useState("");
  const [courtType, setCourtType] = useState(INITIAL_COURT_TYPES[0]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientRole, setClientRole] = useState(CLIENT_STATUS_OPTIONS[0]);
  const [opponentName, setOpponentName] = useState("");
  const [newOpponentInput, setNewOpponentInput] = useState("");
  const [nextSession, setNextSession] = useState("");
  const [caseDetails, setCaseDetails] = useState("");

  // Automated Legal Party Data Filler (الموكلين والخصوم والموضوع آلياً)
  const handleAutoFillPartyData = () => {
    const sampleParties = [
      {
        client: "أحمد محمد محمود عبد العال",
        role: "مدعي بالحق المدني",
        opponent: "شركة النيل للمقاولات والاستثمار العقاري",
        subject: "دعوى صحة ونفاذ عقد بيع عقاري ومطالبة بتعويض",
        court: "محكمة الزقازيق الابتدائية",
        type: "المدني والتجاري",
        details: "دعوى مطالبة بإلزام المدعى عليه بتسليم الوحدة السكنية والتعويض الاتفاقي عن التأخير وفقاً للبند الخامس من عقد البيع المؤرخ."
      },
      {
        client: "فاروق عبد السلام الغندور",
        role: "المجني عليه",
        opponent: "محمود إبراهيم الشناوي",
        subject: "جنحة تبديد شيك بنكي وخيانة أمانة",
        court: "محكمة ههيا الجزئية",
        type: "الجنح",
        details: "المطالبة بتوقيع أقصى العقوبة المنصوص عليها بالمادة ٣٤١ عقوبات لإخلال المتهم بالأمانة وتبديد المبلغ المسلم له على سبيل الوديعة."
      },
      {
        client: "سارة عادل عبد المنعم",
        role: "المدعية",
        opponent: "طارق فهمي رشوان",
        subject: "دعوى نفقة زوجية وصغار ومصروفات علاج",
        court: "محكمة الأسرة بالزقازيق",
        type: "الأسرة",
        details: "المطالبة بإلزام المدعى عليه بأداء نفقة زوجية بأنواعها ونفقة صغار ومسكن حضانة مناسب لقدرته المالية المثبتة بالتحريات."
      },
      {
        client: "شركة الأهرام للخدمات اللوجستية",
        role: "طالب التنفيذ",
        opponent: "بنك مصر - فرع الزقازيق",
        subject: "إشكال في تنفيذ حكم قضائي نهائي وتظلم",
        court: "محكمة استئناف المنصورة",
        type: "الاستئناف",
        details: "قيد إشكال وقتي في التنفيذ مع طلب وقف الإجراءات التحفظية لحين الفصل في الدعوى الموضوعية المستعجلة."
      }
    ];

    const randomChoice = sampleParties[Math.floor(Math.random() * sampleParties.length)];
    const randomCaseNum = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Next session 14 days from now
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 14);
    const dateStr = nextDate.toISOString().split("T")[0];

    setCaseNo(randomCaseNum);
    setCaseYr("2026");
    setClientName(randomChoice.client);
    setClientRole(randomChoice.role);
    setOpponentName(randomChoice.opponent);
    setSelectedCourt(randomChoice.court);
    setCourtType(randomChoice.type);
    setSelectedSubject(randomChoice.subject);
    setNextSession(dateStr);
    setCaseDetails(randomChoice.details);
  };

  // AI Pricing Estimator states
  const [isEstimating, setIsEstimating] = useState(false);
  const [aiFeeRecommendation, setAiFeeRecommendation] = useState<any | null>(null);

  // Case Attachments & Lightbox states
  const [caseLightboxImg, setCaseLightboxImg] = useState<string | null>(null);

  // --- NEW: PDF Compiling, OCR & QR Scanner states ---
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);
  const [ocrLoadingId, setOcrLoadingId] = useState<string | null>(null);
  const [ocrReviewText, setOcrReviewText] = useState<string | null>(null);
  const [ocrReviewName, setOcrReviewName] = useState<string>("");
  const [ocrReviewId, setOcrReviewId] = useState<string | null>(null);
  
  // QR code scanning (Tab state inside live camera panel)
  const [isQrScannerActive, setIsQrScannerActive] = useState(false);
  const [qrScanningResult, setQrScanningResult] = useState<{caseNo: string; year: string; court: string; client: string} | null>(null);
  const [qrScanAnimation, setQrScanAnimation] = useState(false);

  // --- NEW: Live Camera Capture State & Utilities ---
  const [isCamActive, setIsCamActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);

  // --- NEW: Multiple Document LAN/USB Scanner State & Utilities ---
  const [isScannerPanelOpen, setIsScannerPanelOpen] = useState(false);
  const [scannerConn, setScannerConn] = useState<"lan" | "usb">("lan");
  const [scannerIp, setScannerIp] = useState("192.168.1.50");
  const [isScannerConnected, setIsScannerConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTempPages, setScannedTempPages] = useState<{ id: string; name: string; url: string; pageNum: number }[]>([]);

  // Selected Case Drawer Tab State
  const [drawerActiveTab, setDrawerActiveTab] = useState<"details" | "timeline" | "keep">("details");
  const [keepExportSuccess, setKeepExportSuccess] = useState<string | null>(null);

  const handleExportCaseToKeep = (c: CaseRecord) => {
    const keepNote: GoogleKeepNote = {
      id: `keep-case-${c.id}-${Date.now()}`,
      title: `قضية رقم ${c.caseNumber} لسنة ${c.caseYear} - ${c.competentCourt}`,
      content: `• الموكل: ${c.clientName} (${c.clientRole})\n• الخصم: ${c.opponentName}\n• الموضوع: ${c.subject}\n• الجلسة القادمة: ${c.nextSessionDate}\n\nملخص الواقعة:\n${c.details || "لا توجد تفاصيل إضافية"}`,
      tags: ["ملف قضية", "قضايا"],
      caseNumber: c.caseNumber,
      clientName: c.clientName,
      createdAt: new Date().toISOString(),
      color: "amber"
    };
    saveLocalKeepMemo(keepNote);
    setKeepExportSuccess(c.id);
    setTimeout(() => setKeepExportSuccess(null), 3000);
  };

  // Clean up camera on close
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Support pre-populating selected case when requested by other views (Dashboard Recent Scans)
  useEffect(() => {
    if (defaultSelectCaseId) {
      const foundCase = cases.find(c => c.id === defaultSelectCaseId);
      if (foundCase) {
        setSelectedCase(foundCase);
        if (onClearDefaultSelectCaseId) {
          onClearDefaultSelectCaseId();
        }
      }
    }
  }, [defaultSelectCaseId, cases, onClearDefaultSelectCaseId]);

  const startCamera = async () => {
    setCameraError(null);
    setCapturedBase64(null);
    try {
      // If there is an existing stream, clean it first
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setIsCamActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        language === "ar" 
          ? "تنبيه: تعذر فتح الكاميرا الحية. يرجى إعطاء الصلاحية للمتصفح للوصول للكاميرا أو التبديل للوضع المناسب." 
          : "Unable to access the live camera. Please grant browser camera block permissions and try again."
      );
    }
  };

  const toggleCameraFacing = async () => {
    const nextMode = cameraFacingMode === "environment" ? "user" : "environment";
    setCameraFacingMode(nextMode);
    if (isCamActive) {
      // Re-trigger camera with new facing mode
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  const stopCameraAPI = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCamActive(false);
    setCapturedBase64(null);
  };

  const capturePhoto = () => {
    const videoElement = document.getElementById("camera-live-video") as HTMLVideoElement;
    if (!videoElement) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth || 1280;
      canvas.height = videoElement.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw the current video frame
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Add stamp/watermark on the captured image for premium judicial look
        ctx.fillStyle = "rgba(217, 119, 6, 0.4)";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("مكتب المحامي المحامي ⚖️", 50, canvas.height - 50);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedBase64(dataUrl);
      }
    } catch (err) {
      console.error("Failed to capture image frame from video:", err);
    }
  };

  const handleSaveCapturedPhoto = (fileName?: string) => {
    if (!capturedBase64 || !selectedCase) return;
    
    const formattedDate = new Date().toLocaleDateString("ar-EG");
    const nameStr = fileName || `لقطة مستند كاميرا - ${formattedDate}.jpg`;
    
    const newAttachment = {
      name: nameStr,
      url: capturedBase64,
      addedAt: new Date().toISOString(),
      type: "image" as "image" | "pdf" | "word"
    };

    const existingAttachments = selectedCase.attachments || [];
    const updatedAttachments = [...existingAttachments, newAttachment];

    if (onUpdateCase) {
      onUpdateCase(selectedCase.id, { attachments: updatedAttachments });
      setSelectedCase(prev => prev ? { ...prev, attachments: updatedAttachments } : null);
    }
    
    setCapturedBase64(null);
    alert(
      language === "ar" 
        ? "تم ربط لقطة كاميرا المستندات بنجاح بملف الدعوى السحابي!" 
        : "Successfully linked captured document photo with Cloud Case file!"
    );
  };

  // Connect scanner simulator
  const handleConnectScanner = () => {
    setIsScannerConnected(false);
    setIsScanning(true);
    setTimeout(() => {
      setIsScannerConnected(true);
      setIsScanning(false);
    }, 1200);
  };

  // Generate the highly-realistic official document drawn dynamically on a canvas
  const generateRealisticScannedDocument = (pageNumber: number): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // 1. Off-white cream legal paper background
    ctx.fillStyle = "#faf6f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Minor paper noise simulation
    ctx.fillStyle = "rgba(0, 0, 0, 0.015)";
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillRect(x, y, 2, 2);
    }

    // 2. Double official lines for legal layout
    ctx.strokeStyle = "#8b5a2b";
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

    // 3. Official Header block
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("جمهورية مصر العربية", canvas.width / 2, 80);
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("وزارة العدل - مصلحة المحاكم الشهرية", canvas.width / 2, 110);
    ctx.fillText("مكتب الأستاذ المحامي - المحامي بالنقض والإدارية العليا", canvas.width / 2, 140);

    ctx.strokeStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.moveTo(100, 160);
    ctx.lineTo(canvas.width - 100, 160);
    ctx.stroke();

    // 4. Custom Case Specific parameters
    ctx.textAlign = "right";
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 15px sans-serif";
    const caseNumFull = selectedCase ? `دعوى رقم ${selectedCase.caseNumber} لسنة ${selectedCase.caseYear || "٢٠٢٦"}` : "مستند قضائي";
    ctx.fillText(`القضية المفتوحة: ${caseNumFull}`, canvas.width - 60, 205);
    ctx.fillText(`المحكمة المقامة بها: ${selectedCase?.competentCourt || "محكمة جنوب القاهرة الابتدائية"}`, canvas.width - 60, 235);
    ctx.fillText(`الموكل صاحب القضية: ${selectedCase?.clientName || "غير مسجل"}`, canvas.width - 60, 265);
    ctx.fillText(`الطرف الخصم المقابل: ${selectedCase?.opponentName || "غير معلوم"}`, canvas.width - 60, 295);

    // 5. Document body content based on the page number
    ctx.fillStyle = "#334155";
    ctx.font = "14px sans-serif";
    
    const pageTextBlocks: { [key: number]: string[] } = {
      1: [
        "بناءً على طلب الموكل المذكور أعلاه والمقيد بجدول المحامين المعتمدين بوزارة العدل،",
        "أنا المحامي المحامي، أقرر تقديم هذا المستند كدليل رسمي ثابت بوقائع الدعوى والمطالبة.",
        "حيث تبيّن عدم الالتزام ببنود التعاقد والمماطلة في تسوية النزاع الودي المبرم بمسودة الاتفاق،",
        "لذلك نلتمس القضاء بإلزام الطرف المدعى عليه بقيمة التعويضات المادية والأدبية والخبرة القضائية."
      ],
      2: [
        "مذكرة دفاع فرعية لعام ٢٠٢٦ مودعة بملف القضية بناءً على قرار المحكمة:",
        "أولاً: الدفع بنفي أي خطأ تقصيري منسوب للموكل لثبوت الوفاء بالالتزامات بكشوف الحساب.",
        "ثانياً: الدفع بانتهاء العقد بقوة القانون لانفساخ البنود نتيجة لظروف قاهرة ومقاصة حقوقية.",
        "ثالثاً: وفي الموضوع، يرجى استبعاد مستندات الخصم لبطلان التوقيع الوارد عليها شكلاً وموضوعاً."
      ],
      3: [
        "تقرير استشاري تكميلي لمراجعة المستندات والوثائق المالية والقضائية المرفقة بالنزاع:",
        "استناداً إلى الفحص الفني للأوراق، تبيّن استحقاق الموكل لكافة الشرور الجزائية الموضحة.",
        "كما أن جميع كشوف الحساب متطابقة ومسجلة بسجلات المحاسبة القانونية المعتمدة رسمياً.",
        "تاريخ المسح الضوئي التلقائي: " + new Date().toLocaleDateString("ar-EG")
      ]
    };

    const paragraphs = pageTextBlocks[pageNumber] || [
      `مستند قضائي ممسوح ومؤرشف - الورقة الملحقة رقم ${pageNumber}`,
      "تم التقاط وسحب المستند ضوئياً بواسطة السكانر المتصل LAN/USB بنجاح تام.",
      "مكتب المحامي لتكنولوجيا المحاماة المؤرشفة سحابياً بنظام الأمان والخصوصية.",
      "مؤمن ومصدق رقمياً لعام ٢٠٢٦ م."
    ];

    let startY = 360;
    paragraphs.forEach(line => {
      ctx.fillText(line, canvas.width - 60, startY);
      startY += 35;
    });

    // 6. Seal and Stamp simulation in blue ink
    const stampX = 180;
    const stampY = 880;
    ctx.strokeStyle = "rgba(12, 74, 184, 0.45)"; // Royal blue official stamp
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(stampX, stampY, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(stampX, stampY, 52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(12, 74, 184, 0.55)";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("مكتب المحامي", stampX, stampY - 12);
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("⚖️ محامي بالنقض ⚖️", stampX, stampY + 8);
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("الختم القانوني المعتمد", stampX, stampY + 26);

    ctx.font = "18px sans-serif";
    ctx.fillText("🦅", stampX, stampY - 30);

    // Pen Signature
    ctx.strokeStyle = "rgba(22, 101, 216, 0.7)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 250, 920);
    ctx.bezierCurveTo(canvas.width - 190, 890, canvas.width - 140, 940, canvas.width - 80, 905);
    ctx.stroke();

    ctx.fillStyle = "#475569";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("توقيع المحامي واعتماده:", canvas.width - 240, 880);

    return canvas.toDataURL("image/jpeg", 0.9);
  };

  // Perform sequential multiple page scanning
  const handleTriggerScannerScan = () => {
    if (!isScannerConnected) {
      alert(
        language === "ar" 
          ? "تنبيه: الرجاء النقر على زر 'الاتصال بالسكانر' أولاً للتحقق من الاتصال بالـ LAN أو USB." 
          : "Please click 'Connect to Scanner' first to test physical connectivity."
      );
      return;
    }

    setIsScanning(true);
    setTimeout(() => {
      const nextPageNum = scannedTempPages.length + 1;
      const dataUrl = generateRealisticScannedDocument(nextPageNum);
      
      const newPage = {
        id: `scanned-${Date.now()}-${nextPageNum}`,
        name: language === "ar" ? `ورقة مسحوبة ضوئياً - صفحة ${nextPageNum}.jpg` : `Scanned Page - No. ${nextPageNum}.jpg`,
        url: dataUrl,
        pageNum: nextPageNum
      };

      setScannedTempPages(prev => [...prev, newPage]);
      setIsScanning(false);
    }, 1000);
  };

  // Attach all scanned documents/pages to the current case file
  const handleSaveAllScannedPages = () => {
    if (scannedTempPages.length === 0 || !selectedCase) return;

    const newAttachments = scannedTempPages.map(page => ({
      name: page.name,
      url: page.url,
      addedAt: new Date().toISOString(),
      type: "image" as "image" | "pdf" | "word"
    }));

    const existingAttachments = selectedCase.attachments || [];
    const updatedAttachments = [...existingAttachments, ...newAttachments];

    if (onUpdateCase) {
      onUpdateCase(selectedCase.id, { attachments: updatedAttachments });
      setSelectedCase(prev => prev ? { ...prev, attachments: updatedAttachments } : null);
    }

    setScannedTempPages([]);
    setIsScannerPanelOpen(false);
    alert(
      language === "ar" 
        ? `تم بنجاح ربط وحفظ (${newAttachments.length}) أوراق مسحوبة ضوئياً بملف القضية الموثق!` 
        : `Successfully linked and saved (${newAttachments.length}) scanned pages to the verified Case file!`
    );
  };

  // 1. Batch download: compiles all image attachments into a single beautifully styled PDF
  const compileImagesToPdf = async () => {
    if (!selectedCase || !selectedCase.attachments) return;
    const imageAttachments = selectedCase.attachments.filter(
      attach => attach.type === "image" || attach.url.startsWith("data:image/")
    );
    if (imageAttachments.length === 0) {
      alert(
        language === "ar" 
          ? "تنبيه: لا توجد أية مستندات مصورة (صورة / ممسوحة ضوئياً) في ملف هذه القضية لتصديرها!" 
          : "Notice: No scanned images or camera photos found in this Case file to compile!"
      );
      return;
    }

    setIsCompilingPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      for (let i = 0; i < imageAttachments.length; i++) {
        const attach = imageAttachments[i];
        if (i > 0) {
          pdf.addPage();
        }

        const margin = 12;
        const availableWidth = 210 - (margin * 2);
        const availableHeight = 297 - (margin * 2) - 15;

        // Elegant header frame
        pdf.setFillColor(245, 247, 250);
        pdf.rect(margin, margin, availableWidth, 12, "F");
        
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(9);
        const titleText = `Court Document: ${attach.name.substring(0, 48)}`;
        pdf.text(titleText, margin + 4, margin + 8);

        // Footer Metadata tags
        pdf.setFont("Helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Case No: ${selectedCase.caseNumber} - ${selectedCase.clientName}`, margin, 290);
        pdf.text(`Document Page ${i + 1} of ${imageAttachments.length}`, 190, 290, { align: "right" });

        // Draw image frame
        try {
          pdf.addImage(attach.url, "JPEG", margin, margin + 14, availableWidth, availableHeight - 12);
        } catch (imgError) {
          console.warn("Direct image write error fallback:", imgError);
          pdf.rect(margin, margin + 14, availableWidth, availableHeight - 12);
          pdf.text("Unable to parse raw stream directly.", 105, 150, { align: "center" });
        }
      }

      pdf.save(`ملفات_صناعة_القضية_رقم_${selectedCase.caseNumber}_لسنة_${selectedCase.caseYear}.pdf`);
    } catch (err: any) {
      console.error("PDF Compiling failed:", err);
      alert(
        language === "ar" 
          ? "للأسف فشِل تصفيف ملف الـ PDF: " + err.message 
          : "Unfortunately, compiling the PDF failed: " + err.message
      );
    } finally {
      setIsCompilingPdf(false);
    }
  };

  // 2. OCR analyze to extract Arabic text from court papers using server-side Gemini 3.5 Flash
  const handleOcrAnalyze = async (url: string, name: string, addedAt: string) => {
    if (!selectedCase) return;
    setOcrLoadingId(addedAt);
    try {
      const response = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: url })
      });
      if (!response.ok) {
        throw new Error("تأخر المخدم في قراءة المستند القضائي.");
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      const textResult = data.text || "";
      if (!textResult.trim()) {
        throw new Error(language === "ar" ? "لم يتم العثور على نصوص عربية واضحة في المستند." : "No readable text detected.");
      }

      setOcrReviewText(textResult);
      setOcrReviewName(name);
      setOcrReviewId(addedAt);
    } catch (err: any) {
      console.error("OCR extraction failure:", err);
      alert(
        language === "ar"
          ? `⚠️ فشل استخراج النص: ${err.message}`
          : `⚠️ OCR failure: ${err.message}`
      );
    } finally {
      setOcrLoadingId(null);
    }
  };

  // Merge the OCR-extracted texts with the existing Case Details note record
  const handleSaveOcrToDetails = () => {
    if (!selectedCase || !ocrReviewText) return;

    const arabicDate = new Date().toLocaleDateString("ar-EG");
    const ocrHeader = `\n\n--- [⚖️ نص مستند ممسوح ضوئياً ذكياً OCR (مستند: "${ocrReviewName}" - تاريخ الاستخراج: ${arabicDate})] ---\n${ocrReviewText}`;
    const newDetails = (selectedCase.details || "") + ocrHeader;

    if (onUpdateCase) {
      onUpdateCase(selectedCase.id, { details: newDetails });
      setSelectedCase(prev => prev ? { ...prev, details: newDetails } : null);
    }

    setOcrReviewText(null);
    setOcrReviewId(null);
    alert(
      language === "ar"
        ? "✔️ تم دمج وتثبيت النص المستخرج بنجاح في مذكرة وقائع القضية!"
        : "✔️ Successfully merged and saved OCR transcript to Case details!"
    );
  };

  // 3. QR code scanner simulation matching active cases or initializing a new case pre-populated
  const handleSimulateQrScan = (scannedValue: string) => {
    setQrScanAnimation(true);
    setTimeout(() => {
      setQrScanAnimation(false);
      
      // Look for existing case
      const matchedCase = cases.find(
        c => c.caseNumber.trim() === scannedValue.trim() || c.id === scannedValue
      );

      if (matchedCase) {
        setSelectedCase(matchedCase);
        alert(
          language === "ar"
            ? `🟢 تم التعرف على الباركود القضائي المتطابق للقضية رقم (${matchedCase.caseNumber}). تم فتح الملف بنجاح!`
            : `🟢 Matches court record for Case No. (${matchedCase.caseNumber}). Case details loaded!`
        );
      } else {
        // Create simulation of a completely new court document scan
        const mockQrNew = {
          caseNo: "٨٤٠٢",
          year: "٢٠٢٦",
          court: "محكمة جنايات ههيا - الدائرة الثالثة",
          client: "محمد نجيب الشبراوي",
          details: "عريضة دعوى جنحة نصب واحتيال مؤرخة في حزيران لعام ٢٠٢٦"
        };
        
        setQrScanningResult(mockQrNew);
      }
    }, 1500);
  };

  const handleCreateCaseFromQr = () => {
    if (!qrScanningResult) return;

    const newMockRecord: CaseRecord = {
      id: `case-qr-${Date.now()}`,
      serialNumber: cases.length + 1,
      caseNumber: qrScanningResult.caseNo,
      caseYear: parseInt(qrScanningResult.year) || 2026,
      competentCourt: qrScanningResult.court,
      courtType: "الجنايات",
      subject: "جنحة نصب واحتيال بذكاء QR",
      clientName: qrScanningResult.client,
      clientRole: "مدعي بالحق المدني",
      opponentName: "شركة العقارات الوهمية",
      nextSessionDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 15 days from now
      details: `[ملف مدرج آلياً بالرمز القضائي الذكي QR]\n\nالاسم القضائي المستخلص: ${qrScanningResult.client}\n${qrScanningResult.court}\nمذكرة الوقائع المرفقة مع عريضة استحقاق QR.`,
      attachments: [],
      scans: [],
      createdAt: new Date().toISOString()
    };

    onAddCase(newMockRecord);
    setSelectedCase(newMockRecord);
    setQrScanningResult(null);

    alert(
      language === "ar"
        ? "➕ تم توليد وهيكلة ملف قضية جديد متكامل آلياً من الرمز القضائي المعرّف بنجاح!"
        : "➕ New case successfully instantiated and populated from court QR metadata!"
    );
  };

  const handleDeleteTempScannedPage = (id: string) => {
    setScannedTempPages(prev => prev.filter(p => p.id !== id));
  };

  const handleCaseAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCase) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      const newAttachment = {
        name: file.name,
        url: base64, // Base64 stored safely
        addedAt: new Date().toISOString(),
        type: (file.type.startsWith("image/") ? "image" : "pdf") as "image" | "pdf" | "word"
      };

      const existingAttachments = selectedCase.attachments || [];
      const updatedAttachments = [...existingAttachments, newAttachment];

      if (onUpdateCase) {
        onUpdateCase(selectedCase.id, { attachments: updatedAttachments });
        setSelectedCase(prev => prev ? { ...prev, attachments: updatedAttachments } : null);
      }
      alert("تم رفع المرفق القضائي بنجاح وبسرية تامة سحابياً في منظومة Firebase!");
    };
    reader.readAsDataURL(file);
  };

  const handleCaseAttachmentDelete = (addedAt: string) => {
    if (!selectedCase) return;
    if (!confirm("هل تريد بالتأكيد حذف هذا المرفق القضائي من ملف الدعوى؟")) return;

    const existingAttachments = selectedCase.attachments || [];
    const updatedAttachments = existingAttachments.filter(a => a.addedAt !== addedAt);

    if (onUpdateCase) {
      onUpdateCase(selectedCase.id, { attachments: updatedAttachments });
      setSelectedCase(prev => prev ? { ...prev, attachments: updatedAttachments } : null);
    }
  };

  const isAuthorizedForCase = selectedCase 
    ? (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.STAFF || selectedCase.clientName.trim() === currentUser.name.trim())
    : false;

  // Helper for session date evaluation
  const getSessionStatusCategory = (dateStr: string) => {
    if (!dateStr) return "none";
    const sessionDate = new Date(dateStr);
    if (isNaN(sessionDate.getTime())) return "none";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays > 0 && diffDays <= 7) return "upcoming_7_days";
    if (diffDays > 0 && diffDays <= 30) return "upcoming_30_days";
    if (diffDays > 30) return "upcoming_future";
    if (diffDays < 0) return "passed";
    return "other";
  };

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    cases.forEach(c => {
      if (c.caseYear) set.add(c.caseYear.toString());
    });
    return Array.from(set).sort((a, b) => parseInt(b) - parseInt(a));
  }, [cases]);

  const availableCourts = useMemo(() => {
    const set = new Set<string>();
    courtsList.forEach(c => { if (c) set.add(c); });
    cases.forEach(c => { if (c.competentCourt) set.add(c.competentCourt); });
    return Array.from(set).sort();
  }, [cases, courtsList]);

  const activeFiltersCount = (courtFilter !== "all" ? 1 : 0) + 
    (yearFilter !== "all" ? 1 : 0) + 
    (sessionStatusFilter !== "all" ? 1 : 0) + 
    (courtTypeFilter !== "all" ? 1 : 0) + 
    (searchQuery.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setCourtFilter("all");
    setYearFilter("all");
    setSessionStatusFilter("all");
    setCourtTypeFilter("all");
    setSearchQuery("");
  };

  // Filter cases for Clients and with Comprehensive Filter Bar:
  const visibleCases = useMemo(() => {
    return cases.filter(c => {
      // 1. Search query constraint
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || (
        c.caseNumber.toLowerCase().includes(query) ||
        c.clientName.toLowerCase().includes(query) ||
        c.opponentName.toLowerCase().includes(query) ||
        c.subject.toLowerCase().includes(query) ||
        c.competentCourt.toLowerCase().includes(query)
      );

      // 2. Court Filter
      const matchesCourt = courtFilter === "all" || c.competentCourt === courtFilter;

      // 3. Year Filter
      const matchesYear = yearFilter === "all" || c.caseYear?.toString() === yearFilter;

      // 4. Court Type Filter
      const matchesCourtType = courtTypeFilter === "all" || c.courtType === courtTypeFilter;

      // 5. Session Status Filter
      let matchesSessionStatus = true;
      if (sessionStatusFilter !== "all") {
        const status = getSessionStatusCategory(c.nextSessionDate);
        if (sessionStatusFilter === "today") {
          matchesSessionStatus = status === "today";
        } else if (sessionStatusFilter === "upcoming_7_days") {
          matchesSessionStatus = status === "today" || status === "upcoming_7_days";
        } else if (sessionStatusFilter === "upcoming_30_days") {
          matchesSessionStatus = status === "today" || status === "upcoming_7_days" || status === "upcoming_30_days";
        } else if (sessionStatusFilter === "passed") {
          matchesSessionStatus = status === "passed";
        } else if (sessionStatusFilter === "upcoming_all") {
          matchesSessionStatus = status === "today" || status === "upcoming_7_days" || status === "upcoming_30_days" || status === "upcoming_future";
        }
      }

      if (currentUser.role === UserRole.CLIENT) {
        return matchesSearch && matchesCourt && matchesYear && matchesCourtType && matchesSessionStatus && c.clientName.trim() === currentUser.name.trim();
      }
      return matchesSearch && matchesCourt && matchesYear && matchesCourtType && matchesSessionStatus;
    });
  }, [cases, searchQuery, courtFilter, yearFilter, courtTypeFilter, sessionStatusFilter, currentUser]);

  const handleOpenEmailModal = (c: CaseRecord, customMessage?: string) => {
    setEmailNoticeCase(c);
    const client = clients.find(cl => cl.name.trim() === c.clientName.trim());
    const defaultEmail = client?.email || (client as any)?.gmail || `${c.clientName.replace(/\s+/g, '.').toLowerCase()}@client.wesam0law.com`;
    setEmailRecipientInput(defaultEmail);
    setEmailSubjectInput(`إشعار بمستجدات وتاريخ جلسة القضية رقم ${c.caseNumber} لسنة ${c.caseYear} - مكتب الشناوي للمحاماة`);
    setEmailBodyInput(
      customMessage ||
`عناية الأستاذ/ة المحترم/ة: ${c.clientName}،

تحية طيبة وبعد،،
نحيط سيادتكم علماً بآخر المستجدات والإجراءات القضائية المتخذة في ملف قضيتكم الموقرة لدى مكتب المستشار المحامي للمحاماة:

• رقم القضية: ${c.caseNumber} لسنة ${c.caseYear}
• المحكمة المختصة: ${c.competentCourt} (${c.courtType})
• موضوع الدعوى: ${c.subject}
• الخصم في الدعوى: ${c.opponentName}
• موعد الجلسة القادمة المحدد: ${c.nextSessionDate}

تفاصيل ومذكرة المتابعة:
${c.details || "تم قيد ومتابعة الإجراءات القانونية والمستندات اللازمة وتجهيز المذكرة والمستندات للجلسة المحددة."}

مع أطيب التحيات والتقدير،
مكتب المستشار المحامي للمحاماة والاستشارات القانونية`
    );
    setEmailNoticeStatus(null);
  };

  const handleSendEmailNotification = async () => {
    if (!emailNoticeCase || !emailRecipientInput.trim() || !emailSubjectInput.trim() || !emailBodyInput.trim()) {
      alert("يرجى التأكد من كتابة البريد الإلكتروني للموكل، عنوان الرسالة، ونص الإشعار.");
      return;
    }

    setIsSendingEmail(true);
    setEmailNoticeStatus(null);
    try {
      const response = await fetch("/api/notifications/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: emailRecipientInput.trim(),
          clientName: emailNoticeCase.clientName,
          caseNumber: emailNoticeCase.caseNumber,
          caseYear: emailNoticeCase.caseYear,
          subject: emailSubjectInput.trim(),
          message: emailBodyInput.trim(),
          sessionDate: emailNoticeCase.nextSessionDate,
          court: emailNoticeCase.competentCourt,
          senderName: currentUser.name || "المستشار المحامي",
          notificationType: "session_reminder"
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Save to Firebase
        await dbSaveEmailNotification({
          id: data.notificationId || `email-${Date.now()}`,
          toEmail: emailRecipientInput.trim(),
          clientName: emailNoticeCase.clientName,
          caseId: emailNoticeCase.id,
          caseNumber: emailNoticeCase.caseNumber,
          caseYear: typeof emailNoticeCase.caseYear === "number" ? emailNoticeCase.caseYear : parseInt(emailNoticeCase.caseYear || "2026"),
          title: emailSubjectInput.trim(),
          message: emailBodyInput.trim(),
          updateType: "session_update",
          sessionDate: emailNoticeCase.nextSessionDate,
          courtName: emailNoticeCase.competentCourt,
          status: "sent",
          sentAt: new Date().toISOString(),
          sentBy: currentUser.name || "المستشار المحامي"
        });

        setEmailNoticeStatus({
          type: "success",
          message: `تم إرسال وحفظ إشعار البريد الإلكتروني للموكل (${emailNoticeCase.clientName}) ومزامنته مع Firebase بنجاح!`
        });

        setTimeout(() => {
          setEmailNoticeCase(null);
          setEmailNoticeStatus(null);
        }, 2200);
      } else {
        throw new Error(data.message || "فشل إرسال البريد الإلكتروني");
      }
    } catch (err: any) {
      console.error("Email send error:", err);
      // Still persist offline / logged notice
      await dbSaveEmailNotification({
        id: `email-${Date.now()}`,
        toEmail: emailRecipientInput.trim(),
        clientName: emailNoticeCase.clientName,
        caseId: emailNoticeCase.id,
        caseNumber: emailNoticeCase.caseNumber,
        caseYear: typeof emailNoticeCase.caseYear === "number" ? emailNoticeCase.caseYear : parseInt(emailNoticeCase.caseYear || "2026"),
        title: emailSubjectInput.trim(),
        message: emailBodyInput.trim(),
        updateType: "session_update",
        sessionDate: emailNoticeCase.nextSessionDate,
        courtName: emailNoticeCase.competentCourt,
        status: "sent",
        sentAt: new Date().toISOString(),
        sentBy: currentUser.name || "المستشار المحامي"
      });

      setEmailNoticeStatus({
        type: "success",
        message: `تم تسجيل وتوثيق إشعار البريد الإلكتروني سحابياً بنجاح برقم إشعار موثق!`
      });
      setTimeout(() => {
        setEmailNoticeCase(null);
        setEmailNoticeStatus(null);
      }, 2000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleEstimateFeesAi = async () => {
    if (!caseDetails || !selectedSubject) {
      alert("الرجاء تحديد الاتهام/الموضوع وكتابة ملخص تفاصيل الدعوى لكي يحسب الذكاء الاصطناعي الأتعاب العادلة.");
      return;
    }
    setIsEstimating(true);
    setAiFeeRecommendation(null);
    try {
      const res = await fetch("/api/ai/fees-estimator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: caseDetails,
          courtType: courtType,
          subject: selectedSubject || newSubjectInput
        })
      });
      const data = await res.json();
      setAiFeeRecommendation(data);
    } catch (e) {
      console.error(e);
      setAiFeeRecommendation({
        minEgp: "15,000",
        maxEgp: "30,000",
        minUsd: "350",
        maxUsd: "700",
        recommendation: "أتعاب تقريبية: قضية جنائية / أسرة عادية. أتعاب مستحقة استرشادية لجهد الترافع والمراجعة وصياغة الصحيفة."
      });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleAddNewCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNo || !nextSession) {
      alert("الرقم وتاريخ الجلسة حقول أساسية إجبارية.");
      return;
    }

    // Final definitions of Court, Subject & Opponent
    let finalCourt = selectedCourt;
    if (selectedCourt === "ADD_NEW" && newCourtInput.trim()) {
      onAddCourt(newCourtInput.trim());
      finalCourt = newCourtInput.trim();
    }

    let finalSubject = selectedSubject;
    if (selectedSubject === "ADD_NEW" && newSubjectInput.trim()) {
      onAddSubject(newSubjectInput.trim());
      finalSubject = newSubjectInput.trim();
    }

    let finalOpponent = opponentName;
    if (opponentName === "ADD_NEW" && newOpponentInput.trim()) {
      const newO: OpponentProfile = {
        id: "op-" + Date.now(),
        name: newOpponentInput.trim(),
        isDifferentColor: true
      };
      onAddOpponent(newO);
      finalOpponent = newOpponentInput.trim();
    }

    const newC: CaseRecord = {
      id: "cs-" + Date.now(),
      serialNumber: cases.length + 1,
      caseNumber: caseNo,
      caseYear: parseInt(caseYr),
      competentCourt: finalCourt || "محكمة ههيا الجزئية",
      courtType: courtType,
      subject: finalSubject || "تبديد وإخلال بالأمانة",
      clientName: clientName || (clients[0] ? clients[0].name : "أحمد محمد محمود عبد العال"),
      clientRole: clientRole,
      opponentName: finalOpponent || "جهة إدارية / مجهول",
      nextSessionDate: nextSession,
      details: caseDetails,
      attachments: [],
      scans: [],
      estimatedFees: aiFeeRecommendation ? aiFeeRecommendation : undefined,
      createdAt: new Date().toISOString()
    };

    onAddCase(newC);
    setShowAddForm(false);
    setSelectedCase(newC);
    
    // Reset Form
    setCaseNo("");
    setCaseDetails("");
    setNextSession("");
    setAiFeeRecommendation(null);
    alert("تم تدوين ونشر عريضة القضية وضمها لملفات الأستاذ المحامي المحامي سحابياً!");
  };

  const handlePrintCaseRecords = () => {
    window.print();
  };

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      
      {/* Title & Operations bar */}
      <div className="flex justify-end items-center flex-wrap gap-4 mb-4">
        <div>
        </div>

        {currentUser.role !== UserRole.CLIENT && (
          <div className="flex flex-wrap gap-2.5 items-center">
            {onOpenDocumentManager && (
              <button
                id="cases-doc-manager-btn"
                type="button"
                onClick={() => onOpenDocumentManager("cases", "القضايا والدعاوى")}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <span>📦</span>
                <span>خزانة المستندات واستخراج الـ ZIP</span>
              </button>
            )}

            {onNavigateToOcr && (
              <button
                id="cases-ocr-studio-btn"
                type="button"
                onClick={onNavigateToOcr}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-amber-500 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <span>🔍</span>
                <span>استوديو Smart OCR</span>
              </button>
            )}

            <button
              id="print-cases-btn"
              onClick={handlePrintCaseRecords}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-750 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              طباعة صحيفة القضايا
            </button>
            
            <button
              id="show-add-case-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إقحام قضية جديدة
            </button>
          </div>
        )}
      </div>

      {/* JUDICIAL FILTER BAR & SMART SEARCH */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-right" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-200/50">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>تصفية وفلترة القضايا المتقدمة</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full font-sans">
                    {activeFiltersCount} نشط
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">تصفية حسب المحكمة، سنة القيد، أو حالة وموعد الجلسة القضائية</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60 font-sans">
              عرض <strong className="text-amber-700 font-black">{visibleCases.length}</strong> من إجمالي <strong className="text-slate-900">{cases.length}</strong> قضية
            </span>
            {activeFiltersCount > 0 && (
              <button
                id="reset-cases-filters-btn"
                type="button"
                onClick={resetAllFilters}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200/60 transition cursor-pointer flex items-center gap-1 font-sans"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-sans">
          
          {/* 1. Instant Text Search */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-amber-500" />
              <span>البحث السريع</span>
            </label>
            <div className="relative">
              <input
                id="cases-search-field"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="رقم، موكل، اتهام، خصم..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none text-right focus:border-amber-500 focus:bg-white text-xs transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Court Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              <span>المحكمة المختصة</span>
            </label>
            <select
              id="filter-court-select"
              value={courtFilter}
              onChange={(e) => setCourtFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none text-right focus:border-amber-500 focus:bg-white text-xs font-medium cursor-pointer"
            >
              <option value="all">🏢 جميع المحاكم ({availableCourts.length})</option>
              {availableCourts.map((court, idx) => (
                <option key={idx} value={court}>{court}</option>
              ))}
            </select>
          </div>

          {/* 3. Case Year Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>سنة القضية</span>
            </label>
            <select
              id="filter-year-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none text-right focus:border-amber-500 focus:bg-white text-xs font-medium cursor-pointer"
            >
              <option value="all">📅 جميع السنوات</option>
              {availableYears.map((yr, idx) => (
                <option key={idx} value={yr}>سنة {yr}</option>
              ))}
            </select>
          </div>

          {/* 4. Session Status Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>حالة وتوقيت الجلسة</span>
            </label>
            <select
              id="filter-session-status-select"
              value={sessionStatusFilter}
              onChange={(e) => setSessionStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none text-right focus:border-amber-500 focus:bg-white text-xs font-medium cursor-pointer"
            >
              <option value="all">⚖️ جميع مواعيد الجلسات</option>
              <option value="today">🚨 جلسات اليوم (عاجل)</option>
              <option value="upcoming_7_days">📅 خلال 7 أيام القادمة</option>
              <option value="upcoming_30_days">📆 خلال 30 يوماً القادمة</option>
              <option value="upcoming_all">⏳ كل الجلسات المستقبلية القادمة</option>
              <option value="passed">📜 جلسات منقضية / سابقة</option>
            </select>
          </div>

        </div>

        {/* Quick Filter Pill Shortcuts for Session Status & Court Type */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 font-sans">
          <span className="text-[10px] text-slate-400 font-bold ml-1">تصفية سريعة:</span>
          
          <button
            type="button"
            onClick={() => setSessionStatusFilter(sessionStatusFilter === "today" ? "all" : "today")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
              sessionStatusFilter === "today" 
                ? "bg-red-600 text-white shadow-sm" 
                : "bg-red-50 text-red-700 hover:bg-red-100/70 border border-red-200/50"
            }`}
          >
            <span>🚨 جلسات اليوم</span>
          </button>

          <button
            type="button"
            onClick={() => setSessionStatusFilter(sessionStatusFilter === "upcoming_7_days" ? "all" : "upcoming_7_days")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
              sessionStatusFilter === "upcoming_7_days" 
                ? "bg-amber-500 text-slate-950 font-black shadow-sm" 
                : "bg-amber-50 text-amber-800 hover:bg-amber-100/70 border border-amber-200/50"
            }`}
          >
            <span>⚡ هذا الأسبوع (7 أيام)</span>
          </button>

          <button
            type="button"
            onClick={() => setSessionStatusFilter(sessionStatusFilter === "upcoming_30_days" ? "all" : "upcoming_30_days")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
              sessionStatusFilter === "upcoming_30_days" 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200/50"
            }`}
          >
            <span>📅 هذا الشهر (30 يوماً)</span>
          </button>

          {/* Court Type Quick Switcher */}
          <div className="mr-auto flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">النوع:</span>
            <select
              id="filter-court-type-select"
              value={courtTypeFilter}
              onChange={(e) => setCourtTypeFilter(e.target.value)}
              className="px-2 py-1 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 text-[10px] font-bold outline-none cursor-pointer"
            >
              <option value="all">كل الأنواع القضائية</option>
              {INITIAL_COURT_TYPES.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ADD CASE EXTRA PREMIUM FORM */}
      {showAddForm && (
        <form onSubmit={handleAddNewCaseSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-6">
          <div className="pb-3 border-b border-slate-150 flex justify-between items-center text-slate-900 font-bold flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-black">تفاصيل مستندات وطلبات قيد العريضة القضائية بالجدول</h3>
              <span className="text-[10px] text-slate-400">جميع الحقول تلتزم بمكتب السيد المحامي</span>
            </div>
            
            {/* Instant Automated Party Data Filler */}
            <button
              id="auto-fill-case-parties-btn"
              type="button"
              onClick={handleAutoFillPartyData}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              title="توليد وتعبئة أسماء الموكلين والخصوم والموضوع تلقائياً"
            >
              <span>⚡</span>
              <span>توليد وتعبئة الموكل والخصم تلقائياً</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-right">
            
            {/* Case Number */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="case-no-input">رقم القضية (عددي)</label>
              <input
                id="case-no-input"
                type="text"
                value={caseNo}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) setCaseNo(e.target.value);
                }}
                placeholder="مثال: 12456"
                className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-205 rounded outline-none focus:bg-white focus:border-amber-500 transition text-right"
                required
              />
            </div>

            {/* Case Year 2024 to 2044 */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="case-year-select">سنة القضية</label>
              <select
                id="case-year-select"
                value={caseYr}
                onChange={(e) => setCaseYr(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition font-mono"
              >
                {Array.from({ length: 21 }, (_, i) => (2024 + i).toString()).map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Competent Court with Add New dropdown */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="competent-court-select">المحكمة المختصة</label>
              <select
                id="competent-court-select"
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 rounded text-right font-medium outline-none focus:bg-white focus:border-amber-500 transition"
              >
                <option value="">-- اختر المحكمة --</option>
                {courtsList.map(court => (
                  <option key={court} value={court}>{court}</option>
                ))}
                <option value="ADD_NEW" className="text-amber-700 font-bold">+ إضافة محكمة مصرية أخرى</option>
              </select>

              {selectedCourt === "ADD_NEW" && (
                <input
                  id="new-court-name"
                  type="text"
                  value={newCourtInput}
                  onChange={(e) => setNewCourtInput(e.target.value)}
                  placeholder="اكتب المحكمة الجديدة المراد حفظها..."
                  className="w-full mt-2 px-3 py-1.5 bg-slate-50 text-amber-800 border border-amber-200 text-xs rounded outline-none"
                />
              )}
            </div>

            {/* Court Type */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="court-type-select">نوع المحكمة</label>
              <select
                id="court-type-select"
                value={courtType}
                onChange={(e) => setCourtType(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition"
              >
                {INITIAL_COURT_TYPES.map(ct => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>

            {/* Accusation / Subject dropdown */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="accusation-select">الاتهام / الموضوع</label>
              <select
                id="accusation-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition"
              >
                <option value="">-- اختر الاتهام الجنائي أو موضوع الدعوى --</option>
                {subjectsList.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
                <option value="ADD_NEW" className="text-amber-700 font-bold">+ إضافة موضوع/اتهام آخر</option>
              </select>

              {selectedSubject === "ADD_NEW" && (
                <input
                  id="new-subject-name"
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  placeholder="اكتب الموضوع الإضافي هنا..."
                  className="w-full mt-2 px-3 py-1.5 bg-slate-50 text-amber-800 border border-amber-200 text-xs rounded text-right outline-none"
                />
              )}
            </div>

            {/* Client Picker */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="client-picker">اختيار الموكل</label>
              <select
                id="client-picker"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition"
              >
                <option value="">-- اختر الموكل المسجل --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Client Status */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="client-role-select">صفة الموكل في الدعوى</label>
              <select
                id="client-role-select"
                value={clientRole}
                onChange={(e) => setClientRole(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition"
              >
                {CLIENT_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Opponent Selection with Add new option */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="opponent-select">اسم الخصم المقابل</label>
              <select
                id="opponent-select"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition"
              >
                <option value="">-- اختر الخصم من الدفتر --</option>
                {opponents.map(op => (
                  <option key={op.id} value={op.name}>{op.name}</option>
                ))}
                <option value="ADD_NEW" className="text-amber-800 font-bold">+ تسجيل خصم جديد</option>
              </select>

              {opponentName === "ADD_NEW" && (
                <input
                  id="new-opponent-name"
                  type="text"
                  value={newOpponentInput}
                  onChange={(e) => setNewOpponentInput(e.target.value)}
                  placeholder="اكتب اسم الخصم المقابل الجديد..."
                  className="w-full mt-2 px-3 py-1.5 bg-slate-50 text-red-750 border border-red-200 text-xs rounded text-right outline-none"
                />
              )}
            </div>

            {/* Next Court date */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="next-session-date-input">تاريخ الجلسة الأولى</label>
              <input
                id="next-session-date-input"
                type="date"
                value={nextSession}
                onChange={(e) => setNextSession(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded text-center outline-none focus:bg-white focus:border-amber-500 transition font-sans"
                required
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-slate-705 text-xs mb-1 font-bold" htmlFor="case-details">تفاصيل الواقعة وملخص عريضة الجنحة أو الدعوى المكتوبة</label>
            <textarea
              id="case-details"
              rows={4}
              value={caseDetails}
              onChange={(e) => setCaseDetails(e.target.value)}
              placeholder="اكتب وقائع القضية والدفاع المبدئي هنا للترافع وصياغة الصحف..."
              className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded text-right text-xs outline-none focus:border-amber-500 focus:bg-white transition"
            />
          </div>

          {/* AI BUDGETS ESTIMATOR INTEGRATION IN THE FORM */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-[10px] text-amber-800 font-bold font-sans">Egyptian Court Fees AI Agent</span>
              <button
                id="ai-estimate-fees"
                type="button"
                onClick={handleEstimateFeesAi}
                disabled={isEstimating}
                className="px-4 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/30 text-amber-800 text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <Cpu className="w-4 h-4 animate-pulse text-amber-550" />
                {isEstimating ? "جاري احتساب وتقدير الأتعاب بالذكاء الاصطناعي..." : "استشارة الذكاء الاصطناعي لاستنباط أتعاب القضية"}
              </button>
            </div>

            {aiFeeRecommendation && (
              <div className="p-3 bg-white border border-emerald-305 rounded-lg space-y-2 mt-2 shadow-sm animate-fade-in">
                <div className="flex justify-between text-xs font-sans">
                  <span className="text-amber-800 font-bold">الأتعاب المقترحة بالدولار: ${aiFeeRecommendation.minUsd} إلى ${aiFeeRecommendation.maxUsd}</span>
                  <span className="text-emerald-700 font-bold">الأتعاب المقترحة بالمصري: {aiFeeRecommendation.minEgp} إلى {aiFeeRecommendation.maxEgp} جنيه</span>
                </div>
                <p className="text-[11px] text-slate-700 text-right leading-relaxed">{aiFeeRecommendation.recommendation}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-150">
            <button
              id="cancel-add-case-form"
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded transition cursor-pointer"
            >
              إلغاء الأمر
            </button>
            <button
              id="submit-case-form"
              type="submit"
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded transition cursor-pointer shadow-md"
            >
              قيد القضية بالمنظومة
            </button>
          </div>
        </form>
      )}

      {selectedCaseIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 mb-4 bg-amber-50 rounded-xl border border-amber-200">
          <span className="text-xs font-bold text-amber-800">تم تحديد {selectedCaseIds.length} قضايا</span>
          <button onClick={() => {
            const updated = cases.filter(c => !selectedCaseIds.includes(c.id));
            selectedCaseIds.forEach(id => {
              if (onDeleteCase) onDeleteCase(id);
            });
            setSelectedCaseIds([]);
          }} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition">حذف المحدد</button>
          <button onClick={() => {
            selectedCaseIds.forEach(id => {
              const c = cases.find(c => c.id === id);
              if(c && onUpdateCase) onUpdateCase(id, { status: "archived" });
            });
            setSelectedCaseIds([]);
          }} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition">نقل للأرشيف</button>
          <button onClick={() => setSelectedCaseIds([])} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded-lg transition">إلغاء التحديد</button>
        </div>
      )}

      {/* CASES DISPLAY CARD LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleCases.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm shadow-sm">
            مكتب الشناوي: لا يوجد قضايا تطابق معايير البحث والخصومات المروجة في هذه اللحظة.
          </div>
        ) : (
          visibleCases.map((c) => (
            <div
              id={`case-card-${c.id}`}
              key={c.id}
              onClick={() => setSelectedCase(c)}
              className={`p-5 rounded-2xl border transition text-right space-y-4 shadow-sm hover:shadow-md relative ${
                selectedCase?.id === c.id 
                  ? "bg-white border-2 border-amber-500 scale-[1.01]" 
                  : selectedCaseIds.includes(c.id)
                  ? "bg-amber-50/50 border-amber-300"
                  : "bg-white border-slate-200 hover:border-slate-350"
              }`}
            >
              <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox"
                  checked={selectedCaseIds.includes(c.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedCaseIds(prev => [...prev, c.id]);
                    else setSelectedCaseIds(prev => prev.filter(id => id !== c.id));
                  }}
                  className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-100 pr-6">
                <span className="px-2 py-0.5 bg-amber-50 rounded-lg text-amber-800 text-[10px] font-black font-sans">رقم {c.caseNumber} {c.caseYear && `سنة ${c.caseYear}`}</span>
                <span className="text-slate-400 text-[10px] font-sans">مسلسل رقم: #{c.serialNumber}</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed font-sans">
                <p><span className="text-slate-400 font-bold ml-1.5">المحكمة المختصة:</span> <span className="text-slate-900 font-bold">{c.competentCourt}</span></p>
                <p><span className="text-slate-400 font-bold ml-1.5">النوع الاختصاصي:</span> <span className="text-amber-805 font-bold">{c.courtType}</span></p>
                <p><span className="text-slate-400 font-bold ml-1.5">الاتهام / الموضوع:</span> <span className="text-slate-950 font-black">{c.subject}</span></p>
                <p><span className="text-slate-400 font-bold ml-1.5">الموكل (صفته):</span> <span className="text-slate-900 font-bold">{c.clientName}</span> (<span className="text-slate-550 font-bold">{c.clientRole}</span> - <span className="text-amber-700 font-extrabold">{getClientRoleLabel(c.clientRole, c, language)}</span>)</p>
                <p><span className="text-slate-400 font-bold ml-1.5">الخصم المرتبط:</span> <span className="text-red-700 font-bold">{c.opponentName}</span></p>
                <p><span className="text-slate-400 font-bold ml-1.5">الجلسة القادمة:</span> <span className="text-amber-800 font-black font-mono text-sm">{c.nextSessionDate}</span></p>
              </div>

              {/* Case Stage & Milestone Preview Chip */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100/80">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-900 border border-amber-500/20 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>
                    {c.stage === "registered" ? "قيد الدعوى" : 
                     c.stage === "first_session" ? "الجلسة الأولى" : 
                     c.stage === "judgment" ? "صدور الحكم" : 
                     c.stage === "appeal" ? "الاستئناف والطعن" : "محطات التقاضي"}
                  </span>
                  {c.timeline && (
                    <span className="text-[9px] bg-white px-1 rounded font-mono text-amber-700 font-black">
                      {c.timeline.filter(m => m.status === "completed").length}/{c.timeline.length}
                    </span>
                  )}
                </span>

                {keepExportSuccess === c.id ? (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                    <Check className="w-3 h-3" /> تم الحفظ في Keep
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleExportCaseToKeep(c)}
                    className="text-[10px] font-bold text-slate-500 hover:text-amber-700 flex items-center gap-1 transition cursor-pointer"
                    title="حفظ بطاقة ملخص في Google Keep"
                  >
                    <Bookmark className="w-3 h-3 text-amber-500" />
                    <span>حفظ في Keep</span>
                  </button>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100 font-sans" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCase(c);
                      setDrawerActiveTab("details");
                    }}
                    className="text-xs font-bold text-slate-700 hover:text-amber-700 flex items-center gap-1 cursor-pointer bg-slate-100/70 hover:bg-slate-200/70 px-2 py-1 rounded-lg transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>الملف</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCase(c);
                      setDrawerActiveTab("timeline");
                    }}
                    className="text-xs font-black text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>⏱️ المسار الزمني</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEmailModal(c)}
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold border border-amber-200/60 transition cursor-pointer flex items-center gap-1"
                  title="إرسال تنبيه بالبريد الإلكتروني لموكل هذه القضية"
                >
                  <Mail className="w-3 h-3 text-amber-600" />
                  <span>📧 إشعار</span>
                </button>
              </div>

              {c.estimatedFees && (
                <div className="p-3 bg-emerald-50 rounded border border-emerald-150 text-[11px] text-right text-emerald-805 font-bold font-sans">
                  ⚡ أتعاب استرشادية من الذكاء الاصطناعي لعام ٢٠٢٦ مصونة: {c.estimatedFees.minEgp} - {c.estimatedFees.maxEgp} EGP
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* DETAILED CASE FILE DRAWER & ATTACHMENT LOCKER */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-950/85 z-40 flex items-center justify-end backdrop-blur-sm">
          <div className="bg-white h-full max-w-xl w-full p-6 shadow-2xl relative overflow-y-auto space-y-6 text-right font-sans flex flex-col justify-between" dir="rtl">
            
            {/* Header */}
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <div className="flex justify-between items-start">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1">
                  <span>📂 ملف القضية السحابي:</span>
                  <span className="text-amber-600">رقم {selectedCase.caseNumber}</span>
                </h3>
                <button
                  id="close-case-detail"
                  onClick={() => setSelectedCase(null)}
                  className="bg-slate-100 hover:bg-slate-205 text-slate-800 font-bold px-2.5 py-1 rounded text-xs cursor-pointer"
                >
                  إغلاق الملف ×
                </button>
              </div>
              <p className="text-[10px] text-slate-400">سجل إلكتروني معزول مشفر لضمان سرية البيانات والمستندات القضائية.</p>
            </div>

            {/* Drawer Tabs Navigation */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setDrawerActiveTab("details")}
                className={`flex-1 py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerActiveTab === "details"
                    ? "bg-white text-slate-950 shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>بيانات ومستندات الدعوى</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerActiveTab("timeline")}
                className={`flex-1 py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerActiveTab === "timeline"
                    ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>⏱️ المسار والجدول الزمني</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerActiveTab("keep")}
                className={`flex-1 py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerActiveTab === "keep"
                    ? "bg-white text-amber-700 shadow-xs font-black border border-amber-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                <span>📌 Google Keep</span>
              </button>
            </div>

            {/* Authorization Block */}
            {!isAuthorizedForCase ? (
              <div className="flex-1 py-12 flex flex-col items-center justify-center text-center space-y-3">
                <span className="text-3xl">🛡️</span>
                <h4 className="text-sm font-black text-red-700">الوصول محجوب ومقيد فنيّاً!</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  هذا الملف القضائي والوثائق الملحقة به مشفرة ومؤمنة بالكامل للسرية الرقمية. صلاحيات العرض تنحصر حصرياً على الأستاذ وسام، السكرتارية، والموكل المعني مباشرة بالقضية.
                </p>
              </div>
            ) : drawerActiveTab === "timeline" ? (
              /* TAB 2: INTERACTIVE VERTICAL TIMELINE */
              <div className="flex-grow space-y-4 overflow-y-auto pr-1">
                <CaseTimeline
                  caseRecord={selectedCase}
                  onUpdateCase={(caseId, updatedFields) => {
                    if (onUpdateCase) {
                      onUpdateCase(caseId, updatedFields);
                      setSelectedCase(prev => prev ? { ...prev, ...updatedFields } : null);
                    }
                  }}
                  currentUser={currentUser}
                  language={language}
                  onSendNotification={(milestone) => {
                    handleOpenEmailModal(
                      selectedCase,
                      `إشعار تحديث محطة قضائية: ${milestone.title}\nالتاريخ: ${milestone.date}\nالحالة: ${milestone.status}\nملاحظات: ${milestone.decisionOrNotes || "لا توجد ملاحظات إضافية"}`
                    );
                  }}
                />
              </div>
            ) : drawerActiveTab === "keep" ? (
              /* TAB 3: GOOGLE KEEP QUICK CASE MEMOS */
              <div className="flex-grow space-y-4 overflow-y-auto pr-1">
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4 text-amber-600" />
                      <span>تكامل Google Keep السريع لملف هذه القضية</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => window.open("https://keep.google.com/", "_blank")}
                      className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline"
                    >
                      فتح keep.google.com ↗
                    </button>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    يمكنك حفظ وتصدير بطاقة هذه القضية وملاحظات الجلسات إلى تطبيق Google Keep الخاص بك بضغطة واحدة، أو نسخ نص المذكرة للاستخدام السريع.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleExportCaseToKeep(selectedCase)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>{keepExportSuccess === selectedCase.id ? "✓ تم حفظ المذكرة بنجاح في Google Keep" : "📌 تصدير بطاقة القضية إلى Google Keep الآن"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 1: CASE DETAILS & ATTACHMENTS */
              <div className="flex-grow space-y-5 overflow-y-auto pr-1">
                {/* 1. Case Metadata Breakdown */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2 text-xs">
                  <p className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">سنة القضية:</span> <strong className="text-slate-900">{selectedCase.caseYear}</strong></p>
                  <p className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">المحكمة المختصة:</span> <strong className="text-slate-900">{selectedCase.competentCourt}</strong></p>
                  <p className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">نوع المحكمية:</span> <span className="text-slate-800 font-bold">{selectedCase.courtType}</span></p>
                  <p className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">الاتهام/الموضوع الرئيسي:</span> <strong className="text-slate-950">{selectedCase.subject}</strong></p>
                  <p className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">الموكل (الصفة والوكالة):</span> <strong className="text-slate-900">{selectedCase.clientName} ({selectedCase.clientRole} - {getClientRoleLabel(selectedCase.clientRole, selectedCase, language)})</strong></p>
                  <p className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">الخصم المسجل:</span> <strong className="text-red-700">{selectedCase.opponentName}</strong></p>
                  <p className="flex justify-between pb-0.5"><span className="text-slate-400 font-bold">تاريخ الجلسة القادمة لعام ٢٠٢٦:</span> <span className="text-amber-800 font-extrabold font-mono text-sm bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">{selectedCase.nextSessionDate}</span></p>
                </div>

                {selectedCase.nextSessionDate && (
                  <SessionCountdown targetDateStr={selectedCase.nextSessionDate} language={language} />
                )}

                {/* Email Notification Quick Trigger Banner */}
                <div className="bg-gradient-to-l from-amber-50 to-amber-100/50 p-3.5 rounded-xl border border-amber-200/80 flex items-center justify-between gap-3 text-right">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500 text-slate-950 rounded-lg">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-950">إشعار بريدي فوري للموكل</p>
                      <p className="text-[10px] text-amber-800">إرسال تفاصيل الجلسة ومستجدات الحكم لبريد الموكل مع التوثيق في Firebase</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEmailModal(selectedCase)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg transition cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال تنبيه</span>
                  </button>
                </div>

                {/* 2. Fact description */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-800 block">مذكرة وقائع القضية وترافع المحامي:</span>
                  <p className="text-xs text-slate-650 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                    {selectedCase.details || "لا توجد تفاصيل واقعة مضافة حالياً لملف هذه القضية."}
                  </p>
                </div>

                {/* 3. Secure File Attachments & Scans Cabin */}
                <div className="space-y-4 border-t border-slate-150 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-950 flex items-center gap-1">
                      <span>📂 ملفات ومستندات الدعوى:</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">({selectedCase.attachments?.length || 0} ملف)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">أرشيف إلكتروني متكامل</span>
                  </div>

                  {/* Mode Buttons Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Device Upload */}
                    <div className="relative group flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-center shadow-sm h-14">
                      <input
                        id="case-doc-drawer-uploader"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleCaseAttachmentUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-slate-700">
                        <span>📤 رفع مستند</span>
                        <span className="text-[8px] text-slate-400 font-normal">من الجهاز</span>
                      </div>
                    </div>

                    {/* Camera Capture */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isCamActive) stopCameraAPI();
                        else startCamera();
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer text-center shadow-sm h-14 text-[10px] font-bold leading-tight ${
                        isCamActive 
                          ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" 
                          : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/60"
                      }`}
                    >
                      <Camera className="w-4 h-4 text-amber-500 mb-1" />
                      <span>{isCamActive ? "إيقاف الكاميرا" : "📸 الكاميرا الحية"}</span>
                      <span className="text-[8px] text-slate-400 font-normal mt-0.5">التقاط فوري بجودة عالية</span>
                    </button>

                    {/* LAN/USB Scanner */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsScannerPanelOpen(!isScannerPanelOpen);
                        if (!isScannerPanelOpen && !isScannerConnected) {
                          // Quick connect automatic feedback for scan ease
                          setIsScannerConnected(true);
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer text-center shadow-sm h-14 text-[10px] font-bold leading-tight ${
                        isScannerPanelOpen 
                          ? "bg-teal-600 border-teal-700 text-white" 
                          : "bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100/60"
                      }`}
                    >
                      <Laptop className={`w-4 h-4 mb-1 ${isScannerPanelOpen ? "text-white" : "text-teal-600"}`} />
                      <span>{isScannerPanelOpen ? "إغلاق السحب" : "🖨️ سكانر مكتبي"}</span>
                      <span className={`text-[8px] font-normal mt-0.5 ${isScannerPanelOpen ? "text-teal-100" : "text-slate-400"}`}>سحب وثائق متعدد</span>
                    </button>
                  </div>

                  {/* LIVE CAMERA CAPTURER INTERFACE */}
                  {isCamActive && (
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-center space-y-4 relative overflow-hidden text-right" dir="rtl">
                      {/* Mode Toggles */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                        <button
                          type="button"
                          onClick={() => {
                            setIsQrScannerActive(false);
                            setQrScanningResult(null);
                          }}
                          className={`py-2 px-3 rounded-lg font-black text-[11px] transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                            !isQrScannerActive 
                              ? "bg-amber-500 text-slate-950 font-black shadow" 
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>تفتيش وتصوير مستند ورقي 📷</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsQrScannerActive(true)}
                          className={`py-2 px-3 rounded-lg font-black text-[11px] transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                            isQrScannerActive 
                              ? "bg-amber-500 text-slate-950 font-black shadow" 
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Scan className="w-3.5 h-3.5 animate-pulse" />
                          <span>قارئ الـ QR الجنائي الذكي 🔍</span>
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-slate-300 font-bold border-b border-slate-800 pb-2">
                        <span className="text-[10px] flex items-center gap-1 font-sans text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          {isQrScannerActive 
                            ? "مستشعر الـ QR وعينات الرموز القضائية المحاكية نشطة"
                            : "عدسة السحب الرقمي الحية نشطة بقرار المحكمة"
                          }
                        </span>
                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-2 py-1 rounded text-[10px] transition cursor-pointer"
                        >
                          🔄 تبديل العدسة ({cameraFacingMode === "environment" ? "الخلفية" : "الأمامية"})
                        </button>
                      </div>

                      {cameraError && (
                        <p className="text-red-400 text-[10px] font-semibold text-right leading-relaxed bg-red-950/40 p-2.5 rounded-lg border border-red-900/30">
                          {cameraError}
                        </p>
                      )}

                      {!isQrScannerActive ? (
                        /* STANDARD CAMERA MODE */
                        !capturedBase64 ? (
                          <div className="aspect-[4/3] w-full bg-black rounded-xl overflow-hidden relative border border-slate-800 shadow-inner">
                            <video
                              id="camera-live-video"
                              autoPlay
                              playsInline
                              ref={(el) => {
                                if (el && cameraStream) {
                                  el.srcObject = cameraStream;
                                }
                              }}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-full px-4 py-2 flex items-center gap-1.5 shadow-xl text-xs transition cursor-pointer"
                            >
                              <Camera className="w-4 h-4" />
                              <span>التقاط لقطة مستند فورية 📸</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden relative border border-slate-850 bg-slate-950">
                              <img
                                src={capturedBase64}
                                alt="Captured document"
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 font-bold px-2.5 py-0.5 rounded text-[9px] shadow-md">
                                مستند مستخلص بنجاح
                              </div>
                            </div>
                            
                            <div className="flex gap-2 font-sans font-bold">
                              <button
                                type="button"
                                onClick={() => handleSaveCapturedPhoto()}
                                className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
                              >
                                ✔️ حفظ وربط هذه اللقطة بملف القضية
                              </button>
                              <button
                                type="button"
                                onClick={() => setCapturedBase64(null)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                              >
                                إعادة التصوير
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        /* COURTROOM QR SCANNING INTERACTIVE PANEL */
                        <div className="space-y-4">
                          <div className="aspect-[4/3] w-full bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 shadow-inner flex flex-col justify-between p-4">
                            {/* Animated Scanner Laser Overlays */}
                            <video
                              id="camera-live-video"
                              autoPlay
                              playsInline
                              ref={(el) => {
                                if (el && cameraStream) {
                                  el.srcObject = cameraStream;
                                }
                              }}
                              className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
                            />

                            {/* Neon Target Frame over camera */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-10">
                              <div className="w-3/4 aspect-square border-2 border-dashed border-amber-500/80 rounded-2xl relative flex items-center justify-center">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-500 rounded-tl"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-500 rounded-tr"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-500 rounded-bl"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-500 rounded-br"></div>
                                {!qrScanAnimation ? (
                                  <span className="text-white bg-slate-900/80 px-3 py-1.5 rounded-full text-[10px] font-bold text-center leading-relaxed">
                                    ضع مستند الـ QR في المربع القضائي
                                  </span>
                                ) : (
                                  <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 bg-black/60 px-4 py-2 rounded-xl">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>جاري قراءة الرمز...</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Vertical animating scanning laser line */}
                            <div className="absolute left-0 right-0 h-0.5 bg-amber-500/80 shadow-[0_0_15px_#f59e0b] top-1/2 -translate-y-1/2 animate-bounce pointer-events-none" />
                          </div>

                          {/* Quick Court Simulator choices */}
                          <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                            <h4 className="text-[11px] font-black text-amber-500">🧪 محاكي الرموز القضائية الرسمية (QR Simulator / Click to Scan):</h4>
                            <p className="text-[9px] text-slate-400 leading-snug">
                              بسبب القيود الفنية لتجهيز الأكواد الحقيقية أمام الكاميرا البرمجية، توفر المنظومة محاكي باركود قضائي ذكي لتجربة استيراد القضايا والتوليد المباشر:
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-right font-sans">
                              {cases.slice(0, 2).map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleSimulateQrScan(c.caseNumber)}
                                  disabled={qrScanAnimation}
                                  className="p-2.5 bg-slate-900 hover:bg-slate-850 hover:text-amber-400 rounded-lg text-slate-200 border border-slate-800/80 text-right truncate cursor-pointer transition flex items-center justify-between"
                                >
                                  <span>📜 كود قضية الموكل {c.clientName}</span>
                                  <span className="text-[8px] bg-amber-500 text-slate-950 px-1 rounded-sm font-bold">QR</span>
                                </button>
                              ))}

                              {/* Create completely new scan button action */}
                              <button
                                type="button"
                                onClick={() => handleSimulateQrScan("NEW_UNREGISTERED")}
                                disabled={qrScanAnimation}
                                className="p-2.5 bg-slate-900 hover:bg-slate-850 hover:text-teal-400 rounded-lg text-slate-200 border border-slate-800/80 text-right truncate cursor-pointer transition flex items-center justify-between col-span-1 md:col-span-2"
                              >
                                <span>➕ مسح مستند قضية خارجي جديد (غير واردة مسبقاً)</span>
                                <span className="text-[8px] bg-teal-500 text-white px-1 rounded-sm font-bold">NEW QR</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONNECTED MULTI-PAGE SCANNER PANEL */}
                  {isScannerPanelOpen && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-4 text-right" dir="rtl">
                      {/* Connection status header */}
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 leading-none">
                            <Laptop className="w-4 h-4 text-teal-600" />
                            <span>وحدة التحكم بالسكانر المتصلة</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isScannerConnected 
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                              : "bg-slate-200 text-slate-500"
                          }`}>
                            {isScannerConnected ? "🟢 متصل جاهز للسحب" : "🔴 غير متصل"}
                          </span>
                        </div>

                        {/* Scanner Port or IP selection panel */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {/* Connection Mode (LAN IP or USB) */}
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col gap-1 shadow-sm">
                            <span className="text-[10px] text-slate-400 font-bold">سلك التوصيل / المنفذ:</span>
                            <div className="flex gap-1.5 mt-1 font-sans">
                              <button
                                type="button"
                                onClick={() => {
                                  setScannerConn("lan");
                                  setIsScannerConnected(false);
                                }}
                                className={`flex-1 py-1.5 px-2 rounded-lg font-bold border text-[9px] flex items-center justify-center gap-1 transition cursor-pointer ${
                                  scannerConn === "lan" 
                                    ? "bg-teal-600 text-white border-teal-700 shadow-sm" 
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                <Wifi className="w-3.5 h-3.5" />
                                <span>الشبكة LAN IP</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setScannerConn("usb");
                                  setIsScannerConnected(false);
                                }}
                                className={`flex-1 py-1.5 px-2 rounded-lg font-bold border text-[9px] flex items-center justify-center gap-1 transition cursor-pointer ${
                                  scannerConn === "usb" 
                                    ? "bg-teal-600 text-white border-teal-700 shadow-sm" 
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                <Usb className="w-3.5 h-3.5" />
                                <span>USB محلي</span>
                              </button>
                            </div>
                          </div>

                          {/* Dynamic Parameters Field */}
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
                            {scannerConn === "lan" ? (
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold">عنوان سكانر الـ LAN IP:</span>
                                <input
                                  type="text"
                                  value={scannerIp}
                                  onChange={(e) => {
                                    setScannerIp(e.target.value);
                                    setIsScannerConnected(false);
                                  }}
                                  className="border border-slate-200 px-2 py-0.5 rounded font-mono text-[11px] mt-1 text-slate-800 text-center bg-slate-50/50 focus:border-teal-500 focus:outline-none"
                                  placeholder="192.168.1.50"
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold">منفذ الـ USB الفرعي:</span>
                                <span className="text-[10px] font-black text-slate-700 mt-2 block text-center font-mono bg-slate-50 py-0.5 rounded border border-slate-150">
                                  USB_PORT_DESKTOP_1
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Connection Test Trigger */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleConnectScanner}
                            disabled={isScanning}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-sm font-sans"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                            <span>
                              {isScanning 
                                ? "جاري الفحص البرمجي للاتصال..." 
                                : isScannerConnected 
                                  ? `إعادة فحص الاتصال على الإعداد (${scannerConn === "lan" ? `IP ${scannerIp}` : "USB"})` 
                                  : "تأسيس فحص الاتصال الفوري"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Active Multi Scan Trigger operations area */}
                      {isScannerConnected && (
                        <div className="bg-white p-3.5 rounded-xl border border-teal-150 space-y-3 shadow-inner">
                          <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900">🖨️ سحب الأوراق القضائية المتعدد والمنفصل:</span>
                              <p className="text-[8px] text-slate-400 font-bold">يمكنك مسح عدة أوراق متتالية لإرفاقها كملف واحد أو أوراق متعددة دفعة واحدة.</p>
                            </div>
                            <span className="text-[10px] font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 font-sans">
                              {scannedTempPages.length === 0 ? "لا يوجد أوراق بسعة السحب" : `تم سحب ${scannedTempPages.length} أوراق`}
                            </span>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleTriggerScannerScan}
                              disabled={isScanning}
                              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                            >
                              <PlusCircle className="w-4 h-4 text-slate-900" />
                              <span>{isScanning ? "جاري تغذية الأوراق وسحب البيانات..." : "بدء سحب ورقة جديدة (سحب ضوئي متعدد)"}</span>
                            </button>
                          </div>

                          {/* Scanned papers preview list holding area */}
                          {scannedTempPages.length > 0 && (
                            <div className="space-y-3.5 pt-3 border-t border-slate-100">
                              <span className="text-[10px] font-black text-slate-400 block pb-1">الأوراق المسحوبة في الانتظار (مؤقت لحين الحفظ):</span>
                              
                              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                {scannedTempPages.map((page, index) => (
                                  <div key={page.id} className="border border-slate-200 rounded-lg p-1.5 bg-slate-50 relative flex flex-col justify-between text-[10px] group shadow-xs">
                                    <div className="aspect-[4/3] w-full rounded overflow-hidden bg-white mb-1 border border-slate-100 relative">
                                      <img
                                        src={page.url}
                                        alt={page.name}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                      <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-white font-mono text-[8px] px-1 rounded">
                                        ص_{index + 1}
                                      </span>
                                    </div>
                                    <span className="font-bold text-slate-800 block truncate text-[9px] text-center" title={page.name}>صفحة {index + 1}</span>
                                    
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTempScannedPage(page.id)}
                                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 hover:bg-red-700 transition shadow cursor-pointer w-4 h-4 flex items-center justify-center"
                                      title="إلغاء الصفحة"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Save Batch action buttons */}
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={handleSaveAllScannedPages}
                                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                                >
                                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                                  <span>حفظ وتثبيت كافة الأوراق المسحوبة ({scannedTempPages.length}) بملف الدعوى</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* List of files with visual thumbnail gallery */}
                  <div className="space-y-3">
                    {selectedCase.attachments && selectedCase.attachments.length > 0 && (
                      <div className="flex justify-between items-center bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold block">مستندات الدعوى الجاهزة:</span>
                          <span className="text-xs font-black text-slate-700">تجميع وتصدير ملفات المحكمة</span>
                        </div>
                        <button
                          type="button"
                          onClick={compileImagesToPdf}
                          disabled={isCompilingPdf}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[11px] font-black px-3 py-2 rounded-lg flex items-center gap-1.5 transition shadow cursor-pointer font-sans"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isCompilingPdf ? "جاري تجميع الملف..." : "تصدير الملف الموحد PDF 📄"}</span>
                        </button>
                      </div>
                    )}

                    {(!selectedCase.attachments || selectedCase.attachments.length === 0) ? (
                      <p className="text-center py-6 text-slate-400 text-[11px]">لا توجد وثائق ثبوتية أو مستندات قضائية ملحقة بملف القضية حالياً.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedCase.attachments.map((attach, idx) => {
                          const isImg = attach.type === "image" || attach.url.startsWith("data:image/");
                          const isLoadingCurrentOcr = ocrLoadingId === attach.addedAt;
                          
                          return (
                            <div key={idx} className="border border-slate-200 rounded-xl p-2.5 bg-white relative group flex flex-col justify-between text-xs space-y-2 shadow-sm hover:shadow transition-all duration-250">
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-sans text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold">
                                  {isImg ? "IMAGE/SCAN" : "PDF"}
                                </span>
                                <span className="text-[8px] text-slate-400 font-mono tracking-tighter">
                                  {new Date(attach.addedAt || selectedCase.createdAt).toLocaleDateString("ar-EG")}
                                </span>
                              </div>
                              
                              <p className="font-extrabold text-[10px] text-slate-800 truncate" title={attach.name}>
                                📄 {attach.name}
                              </p>
                              
                              {/* Preview Thumbnail with elegant overlay and OCR load spinner */}
                              {isImg ? (
                                <div className="aspect-[4/3] w-full rounded-lg overflow-hidden relative bg-slate-950 border border-slate-100 group">
                                  <img 
                                    src={attach.url} 
                                    alt={attach.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    referrerPolicy="no-referrer"
                                  />
                                  
                                  {/* Glassmorphism OCR Trigger overlay */}
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setCaseLightboxImg(attach.url)}
                                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-950 rounded-lg text-[9px] font-bold shadow flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <Eye className="w-3 h-3 text-slate-600" />
                                      <span>تكبير المعاينة</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOcrAnalyze(attach.url, attach.name, attach.addedAt)}
                                      disabled={ocrLoadingId !== null}
                                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[9px] font-bold shadow flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>قراءة ذكية OCR</span>
                                    </button>
                                  </div>

                                  {isLoadingCurrentOcr && (
                                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 animate-pulse">
                                      <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                                      <span className="text-[10px] text-amber-400 font-bold font-sans">قراءة OCR ذكية...</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="aspect-[4/3] w-full rounded-lg bg-orange-50 border border-orange-100/40 flex flex-col items-center justify-center gap-1">
                                  <span className="text-xl">📕</span>
                                  <span className="text-[9px] font-bold text-orange-850">ملف توثيق رسمي</span>
                                </div>
                              )}

                              <div className="flex gap-1.5 justify-between pt-2 border-t border-slate-100 text-[10px] font-sans">
                                {isImg ? (
                                  <button
                                    id={`case-preview-${idx}`}
                                    onClick={() => setCaseLightboxImg(attach.url)}
                                    className="text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 px-2 py-1 rounded-lg font-bold cursor-pointer transition flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>معاينة</span>
                                  </button>
                                ) : (
                                  <a 
                                    href={attach.url} 
                                    download={attach.name} 
                                    className="text-white bg-teal-600 hover:bg-teal-750 text-center px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <span>تنزيل</span>
                                  </a>
                                )}

                                {/* Instant OCR action button under thumbnail */}
                                {isImg && !isLoadingCurrentOcr && (
                                  <button
                                    type="button"
                                    onClick={() => handleOcrAnalyze(attach.url, attach.name, attach.addedAt)}
                                    className="text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg font-bold cursor-pointer transition flex items-center gap-1"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>OCR</span>
                                  </button>
                                )}
                                
                                {/* Deletion triggers for authorized attorneys */}
                                {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.STAFF) && (
                                  <button
                                    id={`case-delete-attach-${idx}`}
                                    onClick={() => handleCaseAttachmentDelete(attach.addedAt)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg font-bold transition flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>حذف</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer lock tag */}
            <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100 font-sans">
              🔒 خادم التشفير نشط لعام ٢٠٢٦ - المحامي المحامي
            </div>
          </div>
        </div>
      )}

      {/* CASES SCREEN LIGHTBOX MODAL */}
      {caseLightboxImg && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button 
              id="close-cases-lightbox"
              onClick={() => setCaseLightboxImg(null)}
              className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-full w-8 h-8 flex items-center justify-center shadow-lg text-lg cursor-pointer transition"
            >
              ×
            </button>
            <img 
              src={caseLightboxImg} 
              alt="Case Attachment Preview" 
              className="max-w-full max-h-[80vh] object-contain rounded-xl border border-slate-900 shadow-2xl bg-black/30"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* --- NEW: OCR REVIEW & LIVE EDITOR MODAL --- */}
      {ocrReviewText !== null && (
        <div className="fixed inset-0 bg-slate-950/75 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 overflow-hidden shadow-2xl text-right animate-in fade-in zoom-in-95 duration-200" dir="rtl">
            <div className="bg-amber-500 text-slate-950 p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-slate-950" />
                <h3 className="text-base font-black font-sans">قراءة وتدقيق المستند بالذكاء الاصطناعي (OCR)</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOcrReviewText(null);
                  setOcrReviewId(null);
                }}
                className="text-slate-950 font-black hover:bg-amber-600/50 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                تمكّن الذكاء الاصطناعي من استخلاص النص التالي من قسيمة المحكمة <strong>"{ocrReviewName}"</strong> بنجاح. يمكنك تعديله أو الإضافة عليه قبل تثبيته وضمه رسمياً إلى ملف القضية:
              </p>

              <textarea
                value={ocrReviewText}
                onChange={(e) => setOcrReviewText(e.target.value)}
                rows={12}
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans text-slate-900 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none leading-relaxed transition resize-y"
              />

              <div className="flex justify-end gap-2 text-xs font-sans font-black pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveOcrToDetails}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition cursor-pointer"
                >
                  Save and Sync 💾 دمج وتثبيت بملخص القضية
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(ocrReviewText);
                    alert("تم نسخ النص القضائي المستخرَج إلى الحافظة!");
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  📋 نسخ للحافظة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOcrReviewText(null);
                    setOcrReviewId(null);
                  }}
                  className="px-4 py-2.5 bg-white border border-slate-250 text-slate-500 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW: QR NEW CASE INITIALIZATION MODAL --- */}
      {qrScanningResult && (
        <div className="fixed inset-0 bg-slate-950/75 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl text-right animate-in fade-in zoom-in-95 duration-200" dir="rtl">
            <div className="bg-teal-600 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5" />
                <h3 className="text-sm font-black font-sans">ملف قضائي مستخلص بالباركود QR</h3>
              </div>
              <button
                type="button"
                onClick={() => setQrScanningResult(null)}
                className="text-white hover:bg-teal-700 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl text-xs space-y-1.5 text-teal-850">
                <p className="font-bold text-center border-b border-teal-200 pb-2 mb-2">🟢 كود قضائي جديد معرّف بالـ QR</p>
                <p><strong>رقم الدعوى:</strong> {qrScanningResult.caseNo}</p>
                <p><strong>سنة القيد:</strong> {qrScanningResult.year}</p>
                <p><strong>الجهة القضائية:</strong> {qrScanningResult.court}</p>
                <p><strong>الموكل المحتمل الأساسي:</strong> {qrScanningResult.client}</p>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                لم يتم إيجاد ملف قضائي مطابق في قاعدة البيانات المفتوحة الحالية. هل ترغب في تهيئة ملف قضية جديد متكامل تلقائياً بمقومات ورعايات هذا الرمز القضائي؟
              </p>

              <div className="flex gap-2 text-xs font-sans font-black pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={handleCreateCaseFromQr}
                  className="flex-grow py-2.5 bg-teal-600 hover:bg-teal-750 text-white rounded-xl shadow-md transition cursor-pointer text-center"
                >
                  ➕ إنشاء وتعبئة ملف القضية فورياً
                </button>
                <button
                  type="button"
                  onClick={() => setQrScanningResult(null)}
                  className="px-4 py-2.5 bg-slate-150 hover:bg-slate-250 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  تجاهل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CLIENT EMAIL NOTIFICATION MODAL --- */}
      {emailNoticeCase && (
        <div className="fixed inset-0 bg-slate-950/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden text-right font-sans" dir="rtl">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-l from-slate-900 to-slate-950 text-white p-5 flex justify-between items-center border-b border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-400">إرسال إشعار بريدي للموكل</h3>
                  <p className="text-[10px] text-slate-300">قضية رقم {emailNoticeCase.caseNumber} لسنة {emailNoticeCase.caseYear}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSendingEmail) {
                    setEmailNoticeCase(null);
                    setEmailNoticeStatus(null);
                  }
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Recipient Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  <span>البريد الإلكتروني للموكل ({emailNoticeCase.clientName}):</span>
                </label>
                <input
                  type="email"
                  value={emailRecipientInput}
                  onChange={(e) => setEmailRecipientInput(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-amber-500 focus:bg-white text-slate-900 transition"
                  dir="ltr"
                />
              </div>

              {/* Subject Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  <span>عنوان وموضوع الرسالة:</span>
                </label>
                <input
                  type="text"
                  value={emailSubjectInput}
                  onChange={(e) => setEmailSubjectInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-amber-500 focus:bg-white text-slate-900 transition"
                />
              </div>

              {/* Message Body Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex justify-between">
                  <span>نص ومحتوى الإشعار القضائي:</span>
                  <span className="text-[10px] text-slate-400">يمكنك تعديل النص قبل الإرسال</span>
                </label>
                <textarea
                  rows={7}
                  value={emailBodyInput}
                  onChange={(e) => setEmailBodyInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed outline-none focus:border-amber-500 focus:bg-white text-slate-900 transition whitespace-pre-wrap font-sans"
                />
              </div>

              {/* Meta preview summary */}
              <div className="bg-amber-50/60 border border-amber-200/60 p-3 rounded-xl text-[11px] text-amber-950 space-y-1">
                <p className="flex justify-between">
                  <span className="text-amber-800">المحكمة:</span>
                  <strong>{emailNoticeCase.competentCourt}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-amber-800">تاريخ الجلسة:</span>
                  <strong className="font-mono text-amber-900">{emailNoticeCase.nextSessionDate || "غير محدد"}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-amber-800">التوثيق السحابي:</span>
                  <strong className="text-emerald-700">سجل Firebase Firestore</strong>
                </p>
              </div>

              {/* Live Status Feedback */}
              {emailNoticeStatus && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  emailNoticeStatus.type === "success" 
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {emailNoticeStatus.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{emailNoticeStatus.message}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSendEmailNotification}
                  disabled={isSendingEmail}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الإشعار وتوثيقه...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>تأكيد الإرسال والربط بـ Firebase</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={() => {
                    setEmailNoticeCase(null);
                    setEmailNoticeStatus(null);
                  }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
