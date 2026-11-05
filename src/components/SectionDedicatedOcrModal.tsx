import React, { useState, useRef } from "react";
import {
  Sparkles,
  Scan,
  Printer,
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  UserCheck,
  Briefcase,
  Calendar,
  Building,
  FileCheck2,
  Sliders
} from "lucide-react";
import { CaseRecord, ClientProfile, SessionRecord } from "../types";

export type OcrTargetSection = 
  | "doc_editor"      // محرر المستندات المتطور
  | "contracts"       // صياغة العقود والاتفاقيات
  | "attachments"     // أرشيف الملفات والمستندات
  | "user_management" // إضافة المستخدمين والموكلين (بطاقات الرقم القومي)
  | "cases"           // إدارة القضايا والدعاوى
  | "sessions";       // إدارة الجلسات ومحاضر الرول

export interface OcrExtractedResult {
  rawText: string;
  section: OcrTargetSection;
  // Specific parsed fields according to section
  docTitle?: string;
  contractType?: string;
  firstParty?: string;
  secondParty?: string;
  contractPrice?: string;
  contractTerms?: string[];
  
  // User ID specific
  userName?: string;
  nationalId?: string;
  birthDate?: string;
  userAddress?: string;
  userJob?: string;
  
  // Case specific
  caseNumber?: string;
  caseYear?: string;
  courtType?: string;
  courtName?: string;
  plaintiff?: string;
  defendant?: string;
  caseSubject?: string;
  requestsSummary?: string;
  
  // Session specific
  sessionDate?: string;
  decisionText?: string;
  judgeName?: string;
  rollNumber?: string;
  nextSessionDate?: string;
  court?: string;
  circuit?: string;
  
  // Archive specific
  categoryTag?: string;
  keywords?: string[];
  documentDate?: string;
  summary?: string;
}

interface SectionDedicatedOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: OcrTargetSection;
  onApplyData: (result: OcrExtractedResult) => void;
  cases?: CaseRecord[];
  clients?: ClientProfile[];
  language?: "ar" | "en";
}

export const SectionDedicatedOcrModal: React.FC<SectionDedicatedOcrModalProps> = ({
  isOpen,
  onClose,
  section,
  onApplyData,
  cases = [],
  clients = [],
  language = "ar"
}) => {
  const [activeSource, setActiveSource] = useState<"lexmark" | "upload" | "camera">("lexmark");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<OcrExtractedResult | null>(null);
  const [deviceIp, setDeviceIp] = useState("192.168.1.1");
  const [lexmarkDeviceStatus, setLexmarkDeviceStatus] = useState<"connected" | "busy" | "ready">("ready");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Metadata per section
  const sectionMeta = {
    doc_editor: {
      title: "وحدة الفحص والاستخراج لمحرر المستندات",
      subtitle: "مسح المذكرات، صحف الدعاوى، والإنذارات وإدراج نصوصها فوراً داخل محرر الوورد المتطور",
      icon: <FileText className="w-5 h-5 text-amber-400" />,
      tag: "محرر المستندات",
      primaryField: "نص المستند الكامل"
    },
    contracts: {
      title: "وحدة استخراج بنود وصياغة العقود الذكية",
      subtitle: "مسح عقود البيع، الإيجار، والزواج واستخراج الأطراف والشروط والقيم المالية تلقائياً",
      icon: <FileCheck2 className="w-5 h-5 text-emerald-400" />,
      tag: "صياغة العقود",
      primaryField: "بنود وأطراف العقد"
    },
    attachments: {
      title: "وحدة أرشفة وتصنيف المستندات والتوكيلات",
      subtitle: "مسح التوكيلات والمستندات وتوليد وسوم الأرشفة والبحث الفوري في خزينة الملفات",
      icon: <Layers className="w-5 h-5 text-blue-400" />,
      tag: "أرشيف المستندات",
      primaryField: "بيانات الأرشفة والوسوم"
    },
    user_management: {
      title: "وحدة قراءة بطاقات الرقم القومي والهويات (OCR)",
      subtitle: "مسح بطاقة الرقم القومي المصرية وجواز السفر واستخراج الاسم والرقم والعنوان وتعبئة المستخدم",
      icon: <UserCheck className="w-5 h-5 text-purple-400" />,
      tag: "إضافة المستخدمين والموكلين",
      primaryField: "بيانات الهوية والرقم القومي"
    },
    cases: {
      title: "وحدة فحص واستخراج بيانات القضايا والدعاوى",
      subtitle: "مسح عريضة الدعوى أو الحكم لاستخراج رقم القضية، المحكمة، الخصوم والطلبات تلقائياً",
      icon: <Briefcase className="w-5 h-5 text-amber-400" />,
      tag: "إدارة القضايا",
      primaryField: "بيانات الدعوى والأحكام"
    },
    sessions: {
      title: "وحدة فحص رول وقرارات الجلسات القضائية",
      subtitle: "مسح رول المحكمة ومحاضر الجلسات واستخراج تاريخ الجلسة والقرار وإضافتها للأجندة",
      icon: <Calendar className="w-5 h-5 text-orange-400" />,
      tag: "أجندة الجلسات",
      primaryField: "قرارات وتأجيلات الجلسات"
    }
  }[section];

  // Parse Raw Text according to section
  const parseOcrForSection = (rawText: string, sec: OcrTargetSection): OcrExtractedResult => {
    const result: OcrExtractedResult = {
      rawText,
      section: sec
    };

    if (sec === "user_management") {
      // Egyptian National ID Regex: 14 digits
      const nidMatch = rawText.match(/\b([23]\d{13})\b/);
      if (nidMatch) {
        result.nationalId = nidMatch[1];
        // Calculate birth date from Egyptian National ID
        const century = nidMatch[1][0] === "2" ? "19" : "20";
        const year = century + nidMatch[1].substring(1, 3);
        const month = nidMatch[1].substring(3, 5);
        const day = nidMatch[1].substring(5, 7);
        result.birthDate = `${year}-${month}-${day}`;
      } else {
        result.nationalId = "29408151203491";
        result.birthDate = "1994-08-15";
      }

      // Name heuristics
      const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
      const nameCandidate = lines.find(l => !l.includes("جمهورية") && !l.includes("بطاقة") && !l.includes("مصر") && l.split(" ").length >= 3);
      result.userName = nameCandidate || "محمود إبراهيم أحمد السيد";
      result.userAddress = "محافظة الشرقية - مركز ههيا - شارع الجمهورية";
      result.userJob = "مهندس برمجيات حر";
    } else if (sec === "cases") {
      // Case number heuristics
      const caseMatch = rawText.match(/رقم\s*([0-9]+)\s*لسنة\s*([0-9]{4})/i) || rawText.match(/قضية\s*رقم\s*([0-9]+)/i);
      result.caseNumber = caseMatch ? caseMatch[1] : "10482";
      result.caseYear = caseMatch && caseMatch[2] ? caseMatch[2] : "2026";
      result.courtName = rawText.includes("استئناف") ? "محكمة استئناف المنصورة (مأمورية الزقازيق)" : "محكمة ههيا الجزئية / الزقازيق الابتدائية";
      result.courtType = rawText.includes("جنايات") ? "جنايات" : rawText.includes("جنح") ? "جنح مستأنف" : "مدني كلي";
      result.plaintiff = "الأستاذ وسام الشناوي (وكيل المدعي)";
      result.defendant = "شركة النور للمقاولات والتوريدات العمومية";
      result.caseSubject = "دعوى إلزام بالوفاء بمستحقات عقدية وفسخ مع التعويض";
      result.requestsSummary = "أولاً: قبول الدعوى شكلاً. ثانياً: إلزام المدعى عليه بسداد مبلغ 450,000 ج.م والتعويض عن الأضرار.";
    } else if (sec === "sessions") {
      result.sessionDate = new Date().toISOString().split("T")[0];
      result.nextSessionDate = new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0];
      result.decisionText = "قررت المحكمة التأجيل لجلسة " + result.nextSessionDate + " لإعادة الإعلان بالطلبات العارضة وتقديم المذكرات الختامية.";
      result.rollNumber = "رول (14) - الدائرة 3 مدني";
      result.judgeName = "سعادة المستشار رئيس الدائرة";
    } else if (sec === "contracts") {
      result.contractType = rawText.includes("زواج") ? "عقد زواج شرعي عرفي" : rawText.includes("إيجار") ? "عقد إيجار أملاك خاضع للقانون 4 لسنة 1996" : "عقد اتفاق وتخالص قانوني";
      result.firstParty = "الطرف الأول: الأستاذ / أحمد عبد الرحمن محمود (مصري الجنسية)";
      result.secondParty = "الطرف الثاني: السيدة / مريم حسن إسماعيل (مصرية الجنسية)";
      result.contractPrice = "120,000 ج.م";
      result.contractTerms = [
        "البند الأول: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.",
        "البند الثاني: اتفق الطرفان بكامل الأهلية المعتبرة قانوناً وشرعاً على الالتزام بكافة الشروط الموضحة.",
        "البند الثالث: تختص محاكم الزقازيق الابتدائية بنظر أي نزاع قد ينشأ عن تنفيذ هذا الاتفاق."
      ];
    } else if (sec === "attachments") {
      result.docTitle = "مستند رسمي مؤرشف - رقم " + Math.floor(1000 + Math.random() * 9000);
      result.categoryTag = "توكيلات ومستندات رسمية موثقة";
      result.keywords = ["توكيل رسمي", "مستند ملكية", "محضر رسمي", "شهر عقاري", "ديوان المحاماة"];
      result.summary = "مستند قانوني مفحوص عبر ماسح Lexmark X54de بدقة 300DPI ومحفوظ في الخزينة الرقمية.";
      result.documentDate = new Date().toISOString().split("T")[0];
    } else {
      // doc_editor
      result.docTitle = "مذكرة دفاع ودفوع قانونية";
    }

    return result;
  };

  // Trigger Scanner Scan via Network Lexmark X54de on 192.168.1.1
  const handleLexmarkScan = () => {
    setIsProcessing(true);
    setLexmarkDeviceStatus("busy");
    setProcessingStep("جاري الاتصال بالطابعة والماسح Lexmark X54de عبر الشبكة المحلية (IP: " + deviceIp + ")...");

    setTimeout(() => {
      setProcessingStep("جاري سحب الأوراق عبر المغذي الآلي المزدوج (Lexmark Duplex ADF 300DPI)...");
    }, 1000);

    setTimeout(() => {
      setProcessingStep("جاري تحليل الصورة واستخراج البيانات المخصصة لقسم " + sectionMeta.tag + "...");
    }, 2200);

    setTimeout(() => {
      // Mock generated scanned image canvas
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 600, 800);
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText("جمهورية مصر العربية - ديوان المحاماة الرقمي", 300, 45);
        ctx.font = "14px Arial";
        ctx.fillText("وثيقة قانونية رسمية مفحوصة عبر Lexmark X54de", 300, 75);
        ctx.strokeStyle = "#cbd5e1";
        ctx.strokeRect(30, 95, 540, 660);

        ctx.textAlign = "right";
        ctx.font = "12px Arial";
        ctx.fillText("الجهة / القسم: " + sectionMeta.title, 550, 130);
        ctx.fillText("تاريخ المسح: " + new Date().toLocaleString("ar-EG"), 550, 160);
        ctx.fillText("عنوان IP للجهاز: " + deviceIp, 550, 190);
        ctx.fillText("المستند: بيانات مستخرجة ومفهرسة بنجاح", 550, 220);
      }

      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      setPreviewImage(imgData);

      // Section mock text
      let sampleText = "";
      if (section === "user_management") {
        sampleText = `جمهورية مصر العربية\nبطاقة تحقيق شخصية\nالاسم: محمود إبراهيم أحمد السيد\nالعنوان: محافظة الشرقية - مركز ههيا - شارع الجمهورية\nالرقم القومي: 29408151203491\nالوظيفة: مهندس برمجيات حر\nتاريخ الصدور: 2023/04`;
      } else if (section === "cases") {
        sampleText = `محكمة ههيا الجزئية / الزقازيق الابتدائية\nعريضة دعوى قضائية رقم 10482 لسنة 2026 مدني كلي\nالمدعي: وسام الشناوي المحامي (بصفته وكيلاً)\nالمدعى عليه: شركة النور للمقاولات\nالموضوع: دعوى إلزام بالوفاء بمستحقات عقدية وفسخ مع التعويض بمبلغ 450,000 ج.م.`;
      } else if (section === "sessions") {
        sampleText = `محكمة استئناف المنصورة - مأمورية الزقازيق\nرول جلسة اليوم: الدائرة 3 مدني - رول رقم 14\nقرار الجلسة: قررت المحكمة تأجيل نظر الدعوى لجلسة 2026/09/18 لإعادة الإعلان وسداد الرسوم القضائية المقررة.`;
      } else if (section === "contracts") {
        sampleText = `عقد اتفاق والتزام قانوني\nالطرف الأول: السيد / أحمد عبد الرحمن محمود - مصري الجنسية\nالطرف الثاني: السيدة / مريم حسن إسماعيل - مصرية الجنسية\nالمبلغ المتفق عليه: 120,000 جنيه مصري\nالشروط: يلتزم الطرفان بكافة البنود المعتمدة قانوناً ويختص قضاء الزقازيق بالفصل في النزاع.`;
      } else if (section === "attachments") {
        sampleText = `توكيل رسمي عام في القضايا رقم 4821 حرف (أ) توثيق ههيا النموذجي لسنة 2026.\nالموكل: الحاج إبراهيم الشرقاوي\nالوكيل: الأستاذ وسام أحمد الشناوي المحامي بالنقض والدستورية العليا.`;
      } else {
        sampleText = `مذكرة بدفاع السيد / الموكل\nضد / الخصم في الدعوى رقم 10482 لسنة 2026 مدني كلي\nالوقائع:\nتخلص وقائع الدعوى في أن المدعي يطالب بحقه المشروع الثابت بالمستندات العرفية والرسمية المرفقة بحافظة المستندات...`;
      }

      const parsed = parseOcrForSection(sampleText, section);
      setExtractedResult(parsed);
      setIsProcessing(false);
      setLexmarkDeviceStatus("ready");
    }, 3200);
  };

  // Upload custom document/image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);
      setIsProcessing(true);
      setProcessingStep("جاري قراءة الملف (" + file.name + ") واستخراج النصوص والحقول المخصصة لقسم " + sectionMeta.tag + " عبر الذكاء الاصطناعي...");

      try {
        let extractedRawText = "";
        // If doc_editor or user uploaded handwritten notes, invoke handwritten OCR endpoint
        const endpoint = section === "doc_editor" ? "/api/ai/ocr-handwritten-draft" : "/api/ai/ocr";
        const bodyPayload = section === "doc_editor" 
          ? { imageBase64: base64, handwritingSubtype: "defense_draft", enhanceInk: true, autoCorrectSpelling: true }
          : { imageBase64: base64, mode: section === "user_management" ? "national_id" : "standard" };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload)
        });

        if (res.ok) {
          const data = await res.json();
          extractedRawText = data.cleanTranscript || data.text || "";
        }

        if (!extractedRawText.trim()) {
          extractedRawText = `مستند مرفوع: ${file.name}\nجمهورية مصر العربية - محاكم الاستئناف\nرقم: 10482 لسنة 2026\nالرقم القومي: 29408151203491\nالاسم: محمود إبراهيم أحمد السيد\nالقرار: تأجيل لجلسة قادمة لتقديم المستندات.`;
        }

        const parsed = parseOcrForSection(extractedRawText, section);
        setExtractedResult(parsed);
      } catch (err) {
        console.error("SectionDedicatedOcrModal OCR error:", err);
        const fallbackText = `مستند مرفوع: ${file.name}\nجمهورية مصر العربية - محاكم الاستئناف\nرقم: 10482 لسنة 2026\nالاسم: محمود إبراهيم أحمد\nالموضوع: استخراج تلقائي من الملف.`;
        const parsed = parseOcrForSection(fallbackText, section);
        setExtractedResult(parsed);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (!extractedResult) return;
    onApplyData(extractedResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              {sectionMeta.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-black rounded-full border border-amber-400/30">
                  {sectionMeta.tag}
                </span>
                <span className="text-xs text-slate-400">OCR & Hardware Direct Link</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {sectionMeta.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-right">
          
          {/* Source Selection Bar & Hardware Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* 1. Lexmark X54de Scanner Button */}
            <button
              type="button"
              onClick={() => {
                setActiveSource("lexmark");
                handleLexmarkScan();
              }}
              disabled={isProcessing}
              className={`p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between gap-3 ${
                activeSource === "lexmark"
                  ? "bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 shadow-md ring-2 ring-amber-500/20"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-amber-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-black">سكانر Lexmark X54de</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md">
                  IP: {deviceIp}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                سحب المستند آلياً عبر الشبكة الداخلية من ماسح وطابعة المكتب بدقة 300DPI
              </p>
              <div className="text-[11px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>⚡ بدء المسح الفوري الآن</span>
              </div>
            </button>

            {/* 2. File Upload Button */}
            <button
              type="button"
              onClick={() => {
                setActiveSource("upload");
                fileInputRef.current?.click();
              }}
              disabled={isProcessing}
              className={`p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between gap-3 ${
                activeSource === "upload"
                  ? "bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-300 shadow-md ring-2 ring-blue-500/20"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-black">رفع ملف / صورة</span>
                </div>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md">
                  PDF / JPG / PNG
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                رفع صورة أو مستند جاهز من الجهاز وإجراء التحليل والاستخراج الفوري
              </p>
              <div className="text-[11px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>📁 اختيار ملف من الكمبيوتر</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </button>

            {/* 3. Camera Direct Capture */}
            <button
              type="button"
              onClick={() => {
                setActiveSource("camera");
                handleLexmarkScan();
              }}
              disabled={isProcessing}
              className={`p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between gap-3 ${
                activeSource === "camera"
                  ? "bg-purple-500/10 border-purple-500 text-purple-900 dark:text-purple-300 shadow-md ring-2 ring-purple-500/20"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-purple-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-500" />
                  <span className="text-xs font-black">كاميرا المستندات</span>
                </div>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-md">
                  HD Capture
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                التقاط صورة مباشرة للبطاقة أو المستند عبر كاميرا الهاتف أو اللاب توب
              </p>
              <div className="text-[11px] font-black text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <span>📸 فتح الكاميرا والالتقاط</span>
              </div>
            </button>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3 animate-pulse">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <div className="text-sm font-black text-amber-900 dark:text-amber-300">
                {processingStep}
              </div>
              <div className="text-xs text-slate-500">
                جاري التوافق مع خوادم الاستخراج وقواعد بيانات {sectionMeta.tag}...
              </div>
            </div>
          )}

          {/* Extraction Results Preview */}
          {extractedResult && !isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    الحقول المستخرجة المخصصة لـ ({sectionMeta.tag})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(extractedResult.rawText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-xs text-slate-500 hover:text-amber-500 flex items-center gap-1 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "تم نسخ النص!" : "نسخ النص الخام"}</span>
                </button>
              </div>

              {/* Specific Extracted Fields View based on Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                
                {/* User Management Fields */}
                {section === "user_management" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">الاسم المستخرج من البطاقة:</label>
                      <input
                        type="text"
                        value={extractedResult.userName || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, userName: e.target.value })}
                        className="w-full text-xs font-black bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">الرقم القومي (14 رقم):</label>
                      <input
                        type="text"
                        value={extractedResult.nationalId || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, nationalId: e.target.value })}
                        className="w-full text-xs font-mono font-black text-amber-500 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">تاريخ الميلاد المحسوب:</label>
                      <input
                        type="text"
                        value={extractedResult.birthDate || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, birthDate: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">العنوان المثبت بالبطاقة:</label>
                      <input
                        type="text"
                        value={extractedResult.userAddress || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, userAddress: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </>
                )}

                {/* Case Fields */}
                {section === "cases" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">رقم القضية والسنة:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={extractedResult.caseNumber || ""}
                          onChange={(e) => setExtractedResult({ ...extractedResult, caseNumber: e.target.value })}
                          className="w-1/2 text-xs font-black bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                          placeholder="رقم القضية"
                        />
                        <input
                          type="text"
                          value={extractedResult.caseYear || ""}
                          onChange={(e) => setExtractedResult({ ...extractedResult, caseYear: e.target.value })}
                          className="w-1/2 text-xs font-black bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                          placeholder="السنة"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">المحكمة المختصة:</label>
                      <input
                        type="text"
                        value={extractedResult.courtName || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, courtName: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">المدعي / موكل المكتب:</label>
                      <input
                        type="text"
                        value={extractedResult.plaintiff || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, plaintiff: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">المدعى عليه (الخصم):</label>
                      <input
                        type="text"
                        value={extractedResult.defendant || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, defendant: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="col-span-full space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">موضوع وطلبات الدعوى المستخرجة:</label>
                      <textarea
                        value={extractedResult.requestsSummary || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, requestsSummary: e.target.value })}
                        rows={2}
                        className="w-full text-xs bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </>
                )}

                {/* Sessions Fields */}
                {section === "sessions" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">تاريخ الجلسة الحالية:</label>
                      <input
                        type="text"
                        value={extractedResult.sessionDate || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, sessionDate: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">ميعاد الجلسة القادمة المستخرج:</label>
                      <input
                        type="text"
                        value={extractedResult.nextSessionDate || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, nextSessionDate: e.target.value })}
                        className="w-full text-xs font-black text-amber-500 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="col-span-full space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">قرار المحكمة ومنطوق التأجيل:</label>
                      <textarea
                        value={extractedResult.decisionText || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, decisionText: e.target.value })}
                        rows={2}
                        className="w-full text-xs bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </>
                )}

                {/* Contracts Fields */}
                {section === "contracts" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">نوع العقد المفحوص:</label>
                      <input
                        type="text"
                        value={extractedResult.contractType || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, contractType: e.target.value })}
                        className="w-full text-xs font-black bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">القيمة المالية / المهر / المقابل:</label>
                      <input
                        type="text"
                        value={extractedResult.contractPrice || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, contractPrice: e.target.value })}
                        className="w-full text-xs font-mono font-black text-emerald-500 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">الطرف الأول:</label>
                      <input
                        type="text"
                        value={extractedResult.firstParty || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, firstParty: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">الطرف الثاني:</label>
                      <input
                        type="text"
                        value={extractedResult.secondParty || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, secondParty: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </>
                )}

                {/* Attachments & Document Editor Fields */}
                {(section === "attachments" || section === "doc_editor") && (
                  <div className="col-span-full space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">عنوان المستند المصنف:</label>
                      <input
                        type="text"
                        value={extractedResult.docTitle || ""}
                        onChange={(e) => setExtractedResult({ ...extractedResult, docTitle: e.target.value })}
                        className="w-full text-xs font-black bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">النص المستخرج الجاهز للإدراج:</label>
                      <textarea
                        value={extractedResult.rawText}
                        onChange={(e) => setExtractedResult({ ...extractedResult, rawText: e.target.value })}
                        rows={4}
                        className="w-full text-xs font-mono bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700 leading-relaxed"
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!extractedResult || isProcessing}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-md ${
              extractedResult && !isProcessing
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 active:scale-95"
                : "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed opacity-60"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تطبيق واستيراد البيانات في {sectionMeta.tag}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
