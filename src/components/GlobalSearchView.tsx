import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  Search, 
  X, 
  FileText, 
  Briefcase, 
  Users, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  ShieldAlert, 
  ClipboardList, 
  ArrowRight, 
  Sparkles, 
  FileSpreadsheet, 
  Image as ImageIcon,
  Building,
  Filter,
  Layers, 
  Mic, 
  MicOff,
  StickyNote,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Download,
  Printer
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { 
  CaseRecord, 
  ClientProfile, 
  SessionRecord, 
  FeeTransfer, 
  LawCodeBook,
  Announcement,
  ClientNote
} from "../types";
import { getLocalKeepMemos, GoogleKeepNote } from "../utils/workspaceService";

export interface GlobalSearchResult {
  id: string;
  category: "section" | "case" | "client" | "session" | "document" | "police_report" | "admin_task" | "fee" | "law_code" | "note";
  categoryLabel: string;
  title: string;
  subtitle: string;
  snippet?: string;
  date?: string;
  targetSection: string;
  badgeColor: string;
  icon: React.ReactNode;
  metadata?: any;
}

interface GlobalSearchViewProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CaseRecord[];
  clients: ClientProfile[];
  sessions: SessionRecord[];
  fees: FeeTransfer[];
  lawCodes: LawCodeBook[];
  announcements?: Announcement[];
  managedDocuments?: any[];
  policeReports?: any[];
  adminTasks?: any[];
  clientNotes?: ClientNote[];
  onNavigateTo: (section: string, metadata?: any) => void;
  language: "ar" | "en";
}

export default function GlobalSearchView({
  isOpen,
  onClose,
  cases,
  clients,
  sessions,
  fees,
  lawCodes,
  announcements = [],
  managedDocuments = [],
  policeReports = [],
  adminTasks = [],
  clientNotes = [],
  onNavigateTo,
  language
}: GlobalSearchViewProps) {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [extractedFileIndex, setExtractedFileIndex] = useState<{ id: string; name: string; type: string; text: string; section: string; parentTitle: string }[]>([]);
  const [keepNotes, setKeepNotes] = useState<GoogleKeepNote[]>([]);
  
  // Voice Search States
  const [isListening, setIsListening] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load Google Keep Notes from workspace service for local search indexing
  useEffect(() => {
    if (isOpen) {
      const memos = getLocalKeepMemos();
      setKeepNotes(memos);
    }
  }, [isOpen]);

  // Clean up Web Audio & Recognition resources
  const stopAudioAnalyser = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      microphoneStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setVoiceVolume(0);
  }, []);

  const stopVoiceSearch = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    stopAudioAnalyser();
    setIsListening(false);
  }, [stopAudioAnalyser]);

  // Intelligent Arabic Voice Command Parser
  const parseArabicVoiceQuery = useCallback((spokenText: string) => {
    if (!spokenText.trim()) return;

    let text = spokenText.trim();
    let targetFilter = "all";
    let intentFeedback = "تم التقاط صوتك بنجاح";

    // Detect category keywords
    const lower = text.toLowerCase();

    if (/(قضية|قضايا|دعوى|دعاوى|حكم|أحكام|جنحة|جناية|نقض|محكمة)/i.test(lower)) {
      targetFilter = "cases";
      intentFeedback = "البحث في القضايا والدعاوى";
    } else if (/(موكل|موكلين|عميل|عملاء|خصم|خصوم|توكيل|توكيلات|بطاقة)/i.test(lower)) {
      targetFilter = "clients";
      intentFeedback = "البحث في الموكلين والخصوم";
    } else if (/(ملاحظة|ملاحظات|مذكرة|مذكرات|كيب|keep|note|ملاحظه|تنبه)/i.test(lower)) {
      targetFilter = "notes";
      intentFeedback = "البحث في الملاحظات ومذكرات Google Keep";
    } else if (/(جلسة|جلسات|رول|أجندة|اجندة|تأجيل|قرار)/i.test(lower)) {
      targetFilter = "sessions";
      intentFeedback = "البحث في الجلسات والتقويم القضائي";
    } else if (/(أتعاب|اتعاب|خزينة|مستحق|مستحقات|فلوس|دفعة|ايصال|إيصال)/i.test(lower)) {
      targetFilter = "fees";
      intentFeedback = "البحث في الخزينة والأتعاب";
    } else if (/(قانون|كود|مادة|تشريع|عقوبات|مدني|إجراءات|اجراءات)/i.test(lower)) {
      targetFilter = "law_codes";
      intentFeedback = "البحث في الأكواد ومواد القانون";
    } else if (/(مستند|مستندات|ملف|ملفات|وورد|word|pdf|ocr|فحص)/i.test(lower)) {
      targetFilter = "documents";
      intentFeedback = "البحث في المستندات والملفات المرفوعة";
    } else if (/(محضر|محاضر|قسم|شكوى|بلاغ)/i.test(lower)) {
      targetFilter = "police_reports";
      intentFeedback = "البحث في المحاضر والشكاوى";
    }

    // Clean conversational voice command filler phrases in Egyptian & Formal Arabic
    const fillerPatterns = [
      /^ابحث لي عن\s+/i,
      /^ابحث عن\s+/i,
      /^ابحثلي عن\s+/i,
      /^بحث عن\s+/i,
      /^دور على\s+/i,
      /^دور لي على\s+/i,
      /^عايز اعرف\s+/i,
      /^عايز\s+/i,
      /^هاتلي\s+/i,
      /^هات\s+/i,
      /^افتح\s+/i,
      /^عرض\s+/i,
      /^فين\s+/i,
      /^ممكن تبحث عن\s+/i,
      /^وريني\s+/i
    ];

    let cleanedQuery = text;
    for (const pattern of fillerPatterns) {
      if (pattern.test(cleanedQuery)) {
        cleanedQuery = cleanedQuery.replace(pattern, "").trim();
        break;
      }
    }

    // Update state
    setQuery(cleanedQuery || text);
    setSelectedFilter(targetFilter);
    setVoiceFeedback(`${intentFeedback}: "${cleanedQuery || text}"`);
    setTimeout(() => {
      setVoiceFeedback(null);
    }, 4000);
  }, []);

  // Start Real-Time Voice Recognition with Web Audio API Mic Analyser
  const startVoiceSearch = async () => {
    setVoiceError(null);
    setInterimTranscript("");
    setVoiceFeedback(null);

    // Check Speech Recognition capability
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setVoiceError("عذراً، متصفحك لا يدعم واجهة الأوامر الصوتية SpeechRecognition. يرجى استخدام Google Chrome أو Edge.");
      return;
    }

    try {
      // 1. Request Microphone Access and setup Web Audio Meter for live wave visualization
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          microphoneStreamRef.current = stream;

          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setVoiceVolume(Math.min(100, Math.round((avg / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        } catch (mediaErr) {
          console.warn("Microphone stream meter visualizer unavailable or permission prompt deferred:", mediaErr);
        }
      }

      // 2. Initialize Speech Recognition Engine with Arabic
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;
      recognition.lang = "ar-EG";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = "";
        let finalTrans = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTrans += transcriptPiece;
          } else {
            currentInterim += transcriptPiece;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalTrans) {
          setInterimTranscript("");
          parseArabicVoiceQuery(finalTrans);
          stopVoiceSearch();
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setVoiceError("تم رفض إذن الوصول إلى الميكروفون. يرجى تفعيل إذن الميكروفون من إعدادات المتصفح.");
        } else if (event.error === "no-speech") {
          setVoiceError("لم يتم التقاط أي صوت، يرجى المحاولة والتحدث بصوت واضح.");
        } else {
          setVoiceError(`خطأ في التسجيل الصوتي (${event.error})`);
        }
        stopVoiceSearch();
      };

      recognition.onend = () => {
        stopVoiceSearch();
      };

      recognition.start();
    } catch (err: any) {
      console.error("Could not start voice recognition:", err);
      setVoiceError("تعذر تشغيل الميكروفون. تأكد من منح الصلاحيات المناسبة.");
      stopVoiceSearch();
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery("");
      setSelectedFilter("all");
      stopVoiceSearch();
      setVoiceError(null);
      setVoiceFeedback(null);
    }
    return () => {
      stopVoiceSearch();
    };
  }, [isOpen, stopVoiceSearch]);

  // Index client-side and stored documents
  useEffect(() => {
    const docsIndex: { id: string; name: string; type: string; text: string; section: string; parentTitle: string }[] = [];

    // 1. Index documents in cases
    cases.forEach(c => {
      if (c.attachments) {
        c.attachments.forEach((att, idx) => {
          docsIndex.push({
            id: `case-att-${c.id}-${idx}`,
            name: att.name,
            type: att.type,
            text: `${att.name} ${c.caseNumber} ${c.subject} ${c.clientName} ${c.competentCourt}`,
            section: "cases",
            parentTitle: `قضية رقم ${c.caseNumber} لسنة ${c.caseYear} - ${c.clientName}`
          });
        });
      }
    });

    // 2. Index personal documents in clients
    clients.forEach(cl => {
      if (cl.personalDocuments) {
        cl.personalDocuments.forEach(docItem => {
          docsIndex.push({
            id: `client-doc-${docItem.id}`,
            name: docItem.name,
            type: "document",
            text: `${docItem.name} ${cl.name} ${cl.nationalId} ${cl.poaNumber} ${cl.phone || ""}`,
            section: "clients",
            parentTitle: `ملف الموكل: ${cl.name}`
          });
        });
      }
    });

    // 3. Index stored smart ocr docs from localStorage
    try {
      const savedOcr = localStorage.getItem("law_ocr_items");
      if (savedOcr) {
        const parsedOcr = JSON.parse(savedOcr);
        if (Array.isArray(parsedOcr)) {
          parsedOcr.forEach((item: any) => {
            docsIndex.push({
              id: item.id || `ocr-${Math.random()}`,
              name: item.name || item.fileName || "مستند فحص OCR",
              type: "ocr",
              text: `${item.name || ""} ${item.text || item.extractedText || ""} ${item.notes || ""}`,
              section: "smart_ocr",
              parentTitle: "استوديو الفحص الضوئي واستخراج النصوص"
            });
          });
        }
      }
      
      const savedPoa = localStorage.getItem("law_poa_docs");
      if (savedPoa) {
        const parsedPoa = JSON.parse(savedPoa);
        if (Array.isArray(parsedPoa)) {
          parsedPoa.forEach((p: any) => {
            docsIndex.push({
              id: p.id || `poa-${Math.random()}`,
              name: `توكيل للموكل: ${p.clientName || "غير محدد"}`,
              type: "poa",
              text: `توكيل رسمي موكل ${p.clientName || ""} ${p.textResult || ""}`,
              section: "smart_ocr",
              parentTitle: "استخراج التوكيلات السريع"
            });
          });
        }
      }

      const savedEditorDocs = localStorage.getItem("law_saved_editor_documents");
      if (savedEditorDocs) {
        const parsedDocs = JSON.parse(savedEditorDocs);
        if (Array.isArray(parsedDocs)) {
          parsedDocs.forEach((ed: any) => {
            docsIndex.push({
              id: ed.id || `editor-doc-${Math.random()}`,
              name: ed.title || "مستند صياغة قضائية",
              type: "word",
              text: `${ed.title || ""} ${ed.content || ""}`,
              section: "doc_editor",
              parentTitle: "محرر المستندات والصياغة القضائية"
            });
          });
        }
      }
    } catch (e) {
      console.warn("Could not index local storage docs:", e);
    }

    setExtractedFileIndex(docsIndex);
  }, [cases, clients]);

  // Main application sections index for instant section jump
  const appSections = useMemo(() => [
    { id: "system_structures", title: "محرك توسعة الهياكل والواجهات (AI ENGINE)", keywords: "توسعة هياكل واجهات نظام ذكاء اصطناعي أقسام برامج محاماة قواعد بيانات", icon: <Sparkles className="w-4 h-4" /> },
    { id: "dashboard", title: "لوحة المتابعة الشاملة (Dashboard)", keywords: "رئيسية احصائيات تقارير متابعة ملخص", icon: <Layers className="w-4 h-4" /> },
    { id: "cases", title: "إدارة القضايا والدعاوى", keywords: "قضايا دعاوى أحكام عريضة جنح جنايات محكمة", icon: <Briefcase className="w-4 h-4" /> },
    { id: "clients", title: "سجل الموكلين وجهات الاتصال", keywords: "موكلين عملاء أرقام توكيلات بطاقات هواتف", icon: <Users className="w-4 h-4" /> },
    { id: "sessions", title: "الأجندة والتقويم القضائي الموحد", keywords: "جلسات تقويم أجندة سرود محكمة تأجيل قرار رول", icon: <Calendar className="w-4 h-4" /> },
    { id: "contacts", title: "دليل جهات الاتصال ونقل الأرقام للموكلين", keywords: "جهات اتصال دليل هواتف ارقام نقل موكلين زملاء محامين محضرين خبراء تليفونات", icon: <Users className="w-4 h-4" /> },
    { id: "attachments", title: "الأرشيف الإلكتروني للوثائق والمستندات", keywords: "ارشيف مستندات وثائق عقود توكيلات احكام ملفات مرفقات صور", icon: <Layers className="w-4 h-4" /> },
    { id: "legal_templates", title: "قوالب العقود والصيغ والدعاوى القضائية", keywords: "قوالب عقود صيغ دعاوى نماذج عريضة صحيفة انذار شركات بيع ايجار", icon: <FileText className="w-4 h-4" /> },
    { id: "fees", title: "الخزينة والأتعاب والتحصيلات", keywords: "أتعاب فلوس خزينة دفعات أقساط إيصالات مصاريف مستحقات", icon: <DollarSign className="w-4 h-4" /> },
    { id: "google_workspace", title: "مركز Google Workspace (Keep, Drive, Gmail, Docs)", keywords: "جوجل كيب keep درايف drive جيميل ملاحظات مذكرات سحابية", icon: <StickyNote className="w-4 h-4" /> },
    { id: "doc_editor", title: "محرر المستندات والصياغة القضائية", keywords: "محرر صياغة عقود مذكرات دفاع عرائض وورد طباعة", icon: <FileText className="w-4 h-4" /> },
    { id: "smart_ocr", title: "استوديو الفحص واستخراج النصوص (AI OCR)", keywords: "ocr ماسح ضوئي قراءة صور توكيلات نصوص ذكاء اصطناعي", icon: <Sparkles className="w-4 h-4" /> },
    { id: "lawcodes", title: "المكتبة والأكواد القضائية المصرية", keywords: "قانون عقوبات مدني إجراءات أحوال شخصية نقض تشريعات", icon: <BookOpen className="w-4 h-4" /> },
    { id: "adminwork", title: "الأعمال الإدارية وشؤون المحاكم", keywords: "إداري استخراج شهادة سداد تنفيذ إعلان خبير محضرين", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "companies", title: "إدارة الشركات والمؤسسات", keywords: "شركات سجل تجاري ضرائب جمعيات عقود تأسيس", icon: <Building className="w-4 h-4" /> },
    { id: "announcements", title: "شريط الإعلانات والتعميمات القضائية", keywords: "إعلانات تعميمات نشرة قرارات نقابة", icon: <ShieldAlert className="w-4 h-4" /> },
    { id: "ai", title: "المستشار الذكي (AI Legal Assistant)", keywords: "مستشار ذكي شات روبوت استشارة ثغرات تقدير أتعاب", icon: <Sparkles className="w-4 h-4" /> },
    { id: "social", title: "ديوان التواصل والاستشارات", keywords: "تواصل استشارات واتساب رسائل استفسارات ملاحظات", icon: <Users className="w-4 h-4" /> },
    { id: "settings", title: "إعدادات النظام والتراخيص", keywords: "إعدادات ترخيص نسخة تفعيل حماية أمان", icon: <Layers className="w-4 h-4" /> },
  ], []);

  // Filter Categories
  const categoriesList = [
    { id: "all", label: "الكل" },
    { id: "cases", label: "القضايا والدعاوى" },
    { id: "clients", label: "الموكلين والخصوم" },
    { id: "notes", label: "الملاحظات ومذكرات Keep" },
    { id: "sessions", label: "الجلسات والتقويم" },
    { id: "documents", label: "المستندات والملفات المرفوعة (Word/PDF/OCR)" },
    { id: "police_reports", label: "المحاضر والشكاوى" },
    { id: "admin_tasks", label: "الأعمال الإدارية" },
    { id: "fees", label: "الأتعاب والخزينة" },
    { id: "law_codes", label: "الأكواد ومواد القانون" },
    { id: "sections", label: "أقسام المنصة" }
  ];

  // Perform multi-dimensional search
  const searchResults: GlobalSearchResult[] = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const results: GlobalSearchResult[] = [];

    // Helper to check match
    const isMatch = (...strings: (string | undefined | null)[]) => {
      return strings.some(s => s && s.toLowerCase().includes(cleanQuery));
    };

    // 1. Search Platform Sections
    if (selectedFilter === "all" || selectedFilter === "sections") {
      appSections.forEach(sec => {
        if (isMatch(sec.title, sec.keywords)) {
          results.push({
            id: `sec-${sec.id}`,
            category: "section",
            categoryLabel: "قسم في المنظومة",
            title: sec.title,
            subtitle: "انتقال فوري إلى القسم",
            targetSection: sec.id,
            badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200",
            icon: sec.icon
          });
        }
      });
    }

    // 2. Search Cases
    if (selectedFilter === "all" || selectedFilter === "cases") {
      cases.forEach(c => {
        const matchedTimeline = c.timeline?.find(m => isMatch(m.title, m.decisionOrNotes));
        const matchedAttachment = c.attachments?.find(a => isMatch(a.name));

        if (isMatch(
          c.caseNumber,
          String(c.caseYear || ""),
          c.clientName,
          c.opponentName,
          c.subject,
          c.competentCourt,
          c.courtType,
          c.details,
          c.status,
          c.nextSessionDate
        ) || matchedTimeline || matchedAttachment) {
          let snippet = c.details;
          if (matchedTimeline && matchedTimeline.decisionOrNotes?.toLowerCase().includes(cleanQuery)) {
            snippet = `[ملاحظة جلسة]: ${matchedTimeline.decisionOrNotes}`;
          } else if (matchedAttachment && matchedAttachment.name.toLowerCase().includes(cleanQuery)) {
            snippet = `[مرفق]: ${matchedAttachment.name}`;
          }

          results.push({
            id: `case-${c.id}`,
            category: "case",
            categoryLabel: "ملف قضية",
            title: `قضية رقم ${c.caseNumber} لسنة ${c.caseYear || "2026"} - ${c.subject || "بدون موضوع"}`,
            subtitle: `الموكل: ${c.clientName} | الخصم: ${c.opponentName || "غير محدد"} | المحكمة: ${c.competentCourt || "المحكمة المختصة"}`,
            snippet: snippet,
            date: c.nextSessionDate ? `تاريخ الجلسة القادمة: ${c.nextSessionDate}` : undefined,
            targetSection: "cases",
            badgeColor: "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200",
            icon: <Briefcase className="w-4 h-4 text-blue-600" />,
            metadata: { caseId: c.id }
          });
        }
      });
    }

    // 3. Search Clients & Contacts
    if (selectedFilter === "all" || selectedFilter === "clients") {
      clients.forEach(cl => {
        if (isMatch(
          cl.name,
          cl.nationalId,
          cl.poaNumber,
          cl.phone,
          cl.address,
          cl.subject,
          cl.caseNumber,
          cl.competentCourt
        )) {
          results.push({
            id: `client-${cl.id}`,
            category: "client",
            categoryLabel: "سجل موكل",
            title: cl.name,
            subtitle: `الرقم القومي: ${cl.nationalId || "غير مسجل"} | التوكيل: ${cl.poaNumber || "بدون توكيل"} | الهاتف: ${cl.phone || "غير متوفر"}`,
            snippet: cl.subject,
            targetSection: "clients",
            badgeColor: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
            icon: <Users className="w-4 h-4 text-emerald-600" />,
            metadata: { clientId: cl.id }
          });
        }
      });
    }

    // 4. Search Notes & Google Keep Memos
    if (selectedFilter === "all" || selectedFilter === "notes") {
      // 4.1 Google Keep Notes
      keepNotes.forEach(kn => {
        if (isMatch(kn.title, kn.content, ...(kn.tags || []))) {
          results.push({
            id: `keep-${kn.id}`,
            category: "note",
            categoryLabel: "مذكرة Google Keep",
            title: kn.title || "ملاحظة بدون عنوان",
            subtitle: `التصنيفات: ${(kn.tags && kn.tags.length > 0) ? kn.tags.join("، ") : "عام"} | آخر تحديث: ${kn.updatedAt ? new Date(kn.updatedAt).toLocaleDateString("ar-EG") : "اليوم"}`,
            snippet: kn.content,
            date: kn.updatedAt ? new Date(kn.updatedAt).toLocaleDateString("ar-EG") : undefined,
            targetSection: "google_workspace",
            badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200",
            icon: <StickyNote className="w-4 h-4 text-amber-500" />,
            metadata: { tab: "keep", noteId: kn.id }
          });
        }
      });

      // 4.2 Client Notes & Requests
      const allClientNotes: ClientNote[] = [...clientNotes];
      try {
        const savedNotes = localStorage.getItem("law_clientNotes");
        if (savedNotes) {
          const parsed = JSON.parse(savedNotes);
          if (Array.isArray(parsed)) {
            parsed.forEach((pn: ClientNote) => {
              if (!allClientNotes.some(x => x.id === pn.id)) {
                allClientNotes.push(pn);
              }
            });
          }
        }
      } catch (e) {}

      allClientNotes.forEach(cn => {
        if (isMatch(cn.clientName, cn.text, cn.category, cn.clientPhone, cn.status)) {
          results.push({
            id: `cn-${cn.id}`,
            category: "note",
            categoryLabel: "ملاحظة واستفسار موكل",
            title: cn.category || `استفسار من: ${cn.clientName}`,
            subtitle: `الموكل: ${cn.clientName} | الهاتف: ${cn.clientPhone || "غير محدد"} | الحالة: ${cn.status || "جديدة"}`,
            snippet: cn.text,
            date: cn.date,
            targetSection: "social",
            badgeColor: "bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200",
            icon: <StickyNote className="w-4 h-4 text-teal-600" />,
            metadata: { noteId: cn.id }
          });
        }
      });
    }

    // 5. Search Sessions & Agenda
    if (selectedFilter === "all" || selectedFilter === "sessions") {
      sessions.forEach(s => {
        if (isMatch(
          s.caseInfo?.caseNumber,
          String(s.caseInfo?.caseYear || ""),
          s.caseInfo?.competentCourt,
          s.caseInfo?.circuit,
          s.caseInfo?.clientName,
          s.caseInfo?.opponentName,
          s.caseInfo?.subject,
          s.date,
          s.decision,
          s.requiredWork
        )) {
          results.push({
            id: `session-${s.id}`,
            category: "session",
            categoryLabel: "جلسة قضائية ورول",
            title: `جلسة ${s.date}: قضية ${s.caseInfo?.caseNumber || "رقم مجهول"} (${s.caseInfo?.clientName || "موكل"})`,
            subtitle: `المحكمة: ${s.caseInfo?.competentCourt || "المحكمة المختصة"} | الدائرة: ${s.caseInfo?.circuit || "الدائرة"}`,
            snippet: s.decision ? `القرار / الحكم: ${s.decision}` : s.requiredWork ? `المطلوب بالجلسة: ${s.requiredWork}` : undefined,
            date: s.date,
            targetSection: "sessions",
            badgeColor: "bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200",
            icon: <Calendar className="w-4 h-4 text-purple-600" />,
            metadata: { sessionId: s.id }
          });
        }
      });
    }

    // 6. Search Documents, Extracted Files, Word & OCR
    if (selectedFilter === "all" || selectedFilter === "documents") {
      extractedFileIndex.forEach(docItem => {
        if (isMatch(docItem.name, docItem.text, docItem.parentTitle)) {
          const isDocx = docItem.name.toLowerCase().endsWith(".docx") || docItem.type === "word";
          const isXlsx = docItem.name.toLowerCase().endsWith(".xlsx") || docItem.name.toLowerCase().endsWith(".csv") || docItem.type === "excel";
          const isOcr = docItem.type === "ocr" || docItem.type === "poa";

          results.push({
            id: `doc-${docItem.id}`,
            category: "document",
            categoryLabel: isDocx ? "مستند Word" : isXlsx ? "شيت Excel" : isOcr ? "نص مستخرج بـ AI OCR" : "ملف مرفوع",
            title: docItem.name,
            subtitle: `المصدر: ${docItem.parentTitle}`,
            snippet: docItem.text ? docItem.text.slice(0, 160) + "..." : undefined,
            targetSection: docItem.section,
            badgeColor: isDocx ? "bg-blue-100 text-blue-900 border-blue-300" : isXlsx ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "bg-cyan-100 text-cyan-900 border-cyan-300",
            icon: isDocx ? <FileText className="w-4 h-4 text-blue-600" /> : isXlsx ? <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> : <ImageIcon className="w-4 h-4 text-cyan-600" />,
            metadata: { docId: docItem.id }
          });
        }
      });
    }

    // 7. Search Police Reports & Complaints
    if (selectedFilter === "all" || selectedFilter === "police_reports") {
      policeReports.forEach((pr: any, idx) => {
        if (isMatch(pr.reportNumber, pr.station || pr.policeStation, pr.clientName, pr.subject, pr.prosecutionStatus || pr.prosecutionOffice, pr.details)) {
          results.push({
            id: `police-${pr.id || idx}`,
            category: "police_report",
            categoryLabel: "محضر شرطة وشكوى",
            title: `محضر رقم ${pr.reportNumber || "بدون رقم"} - قسم ${pr.station || pr.policeStation || "الشرطة"}`,
            subtitle: `الشاكي: ${pr.clientName || "الموكل"} | الموضوع: ${pr.subject || "شكوى"} | نيابة: ${pr.prosecutionStatus || pr.prosecutionOffice || "قيد التحقيق"}`,
            snippet: pr.details,
            date: pr.date,
            targetSection: "cases",
            badgeColor: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200",
            icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
            metadata: { tab: "police" }
          });
        }
      });
    }

    // 8. Search Administrative Work & Tasks
    if (selectedFilter === "all" || selectedFilter === "admin_tasks") {
      adminTasks.forEach((task: any, idx) => {
        if (isMatch(task.title, task.court, task.assignedTo, task.details, task.status, task.notes)) {
          results.push({
            id: `adm-${task.id || idx}`,
            category: "admin_task",
            categoryLabel: "عمل إداري قضائي",
            title: task.title || "مهمة إدارية",
            subtitle: `المحكمة: ${task.court || "المحكمة المختصة"} | المكلف بالمتابعة: ${task.assignedTo || "المحامي"} | الحالة: ${task.status || "قيد التنفيذ"}`,
            snippet: task.details || task.notes,
            date: task.deadline ? `آخر موعد: ${task.deadline}` : undefined,
            targetSection: "sessions",
            badgeColor: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200",
            icon: <ClipboardList className="w-4 h-4 text-indigo-600" />,
            metadata: { tab: "admin_tasks" }
          });
        }
      });
    }

    // 9. Search Fees & Treasury
    if (selectedFilter === "all" || selectedFilter === "fees") {
      fees.forEach(f => {
        if (isMatch(f.clientName, String(f.amount), f.notes, f.type, f.caseNumber, f.date)) {
          results.push({
            id: `fee-${f.id}`,
            category: "fee",
            categoryLabel: "سند خزينة وأتعاب",
            title: `تحصيل مبلغ ${f.amount.toLocaleString()} ${f.currency || "EGP"} (${f.clientName})`,
            subtitle: `طريقة الدفع: ${f.type === "cash" ? "نقدي" : f.type === "bank" ? "تحويل بنكي" : "محفظة إلكترونية"} | التاريخ: ${f.date}`,
            snippet: f.notes ? `ملاحظات: ${f.notes}` : undefined,
            date: f.date,
            targetSection: "fees",
            badgeColor: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
            icon: <DollarSign className="w-4 h-4 text-emerald-600" />
          });
        }
      });
    }

    // 10. Search Law Codes & Legislation
    if (selectedFilter === "all" || selectedFilter === "law_codes") {
      lawCodes.forEach(lc => {
        if (isMatch(lc.title, lc.category, lc.contentMarkdown)) {
          results.push({
            id: `code-${lc.id}`,
            category: "law_code",
            categoryLabel: "المكتبة والأكواد القانونية",
            title: lc.title,
            subtitle: `التصنيف: ${lc.category || "التشريعات المصرية"}`,
            snippet: lc.contentMarkdown ? lc.contentMarkdown.slice(0, 160).replace(/[#*`_]/g, "") + "..." : undefined,
            targetSection: "lawcodes",
            badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300",
            icon: <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          });
        }
      });
    }

    return results;
  }, [query, selectedFilter, cases, clients, keepNotes, clientNotes, sessions, fees, lawCodes, appSections, extractedFileIndex, policeReports, adminTasks]);

  const highlightMatch = (text: string | undefined, highlight: string) => {
    if (!text || !highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 dark:bg-amber-500/40 text-slate-950 dark:text-amber-200 rounded-xs px-0.5 font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleSelectResult = (item: GlobalSearchResult) => {
    onNavigateTo(item.targetSection, item.metadata);
    onClose();
  };

  // Export search results to Excel
  const handleExportExcel = () => {
    try {
      const rows = searchResults.map((item, idx) => ({
        "م": idx + 1,
        "التصنيف": item.categoryLabel,
        "العنوان الرئيسي": item.title,
        "التفاصيل والوصف": item.subtitle,
        "مقتطف نصي": item.snippet || "-",
        "التاريخ": item.date || "-",
        "القسم": item.targetSection
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "نتائج_البحث");
      
      const safeQuery = query ? query.replace(/[\/\\?%*:|"<>]/g, '_').trim() : "شامل";
      const fileName = `نتائج_البحث_${safeQuery}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (e) {
      console.error("Failed to export search results to Excel:", e);
    }
  };

  // Export search results to PDF
  const handleExportPdf = () => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(15);
      doc.text("Wesam El-Shenawey Law Firm - Global Search Report", 14, 20);
      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      doc.text(`Query: "${query || 'All Records'}" | Category Filter: ${selectedFilter} | Found: ${searchResults.length} results`, 14, 27);
      doc.text(`Generated on: ${new Date().toLocaleString()} | User: Confidential Legal Search`, 14, 33);
      doc.line(14, 36, 196, 36);

      let y = 43;
      searchResults.slice(0, 30).forEach((item, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(10);
        doc.setFont("Helvetica", "bold");
        doc.text(`${idx + 1}. [${item.categoryLabel}] ${item.title.substring(0, 55)}`, 14, y);
        y += 5;
        doc.setFontSize(8);
        doc.setFont("Helvetica", "normal");
        doc.text(`   Details: ${item.subtitle.substring(0, 80)}`, 14, y);
        y += 4.5;
        if (item.snippet) {
          doc.text(`   Excerpt: ${item.snippet.substring(0, 85)}`, 14, y);
          y += 4.5;
        }
        y += 2;
      });

      const safeQuery = query ? query.replace(/[\/\\?%*:|"<>]/g, '_').trim() : "all";
      doc.save(`Search_Report_${safeQuery}_${Date.now()}.pdf`);
    } catch (e) {
      console.error("Failed to export search results to PDF:", e);
    }
  };

  // Print search results
  const handlePrintResults = () => {
    window.print();
  };

  // Print single search result
  const handlePrintSingleResult = (item: GlobalSearchResult) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>${item.title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; direction: rtl; text-align: right; }
            .header { border-bottom: 2px solid #d97706; padding-bottom: 15px; margin-bottom: 20px; }
            .badge { display: inline-block; padding: 4px 10px; background: #fef3c7; color: #92400e; border-radius: 6px; font-weight: bold; font-size: 12px; }
            h2 { color: #0f172a; margin-top: 15px; margin-bottom: 8px; font-size: 20px; }
            .meta { color: #64748b; font-size: 13px; margin-bottom: 15px; }
            .content { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 14px; line-height: 1.6; }
            .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">${item.categoryLabel}</span>
            <h2>${item.title}</h2>
            <div class="meta">${item.subtitle} ${item.date ? `• التاريخ: ${item.date}` : ""}</div>
          </div>
          ${item.snippet ? `<div class="content"><p><strong>المقتطف / البيانات:</strong></p><p>${item.snippet}</p></div>` : ""}
          <div class="footer">
            مكتب الأستاذ الدكتور / وسام الشناوي للمحاماة والاستشارات القانونية • تم استخراج هذا البيان عبر البحث الشامل بتاريخ ${new Date().toLocaleString("ar-EG")}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      
      {/* Search Modal Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-all">
        
        {/* Header and Search Input */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
              <Search className="w-5 h-5" />
            </div>
            
            <div className="flex-1 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالاسم، رقم القضية، الملاحظات، مستندات Word، أو اضغط الميكروفون للبحث الصوتي..."
                className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm sm:text-base font-bold outline-none text-right"
              />
              
              {/* Prominent Voice Search Mic Button with Live State Feedback */}
              <button 
                type="button"
                onClick={handleToggleVoice}
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 font-bold text-xs cursor-pointer shadow-xs ${
                  isListening 
                    ? 'bg-red-600 text-white animate-pulse shadow-red-500/30' 
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}
                title={isListening ? "إيقاف الاستماع الصوتي" : "البحث الصوتي باللغة العربية"}
              >
                {isListening ? (
                  <>
                    <Mic className="w-4 h-4 text-white animate-bounce" />
                    <span>جاري الاستماع...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="hidden sm:inline">بحث صوتي</span>
                  </>
                )}
              </button>
            </div>

            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 px-3 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer text-xs font-bold"
            >
              إلغاء [ESC]
            </button>
          </div>

          {/* Active Voice Search Assistant Live Banner */}
          {isListening && (
            <div className="mt-3 p-3.5 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-emerald-500/10 border border-red-500/30 dark:border-red-500/40 rounded-2xl animate-in slide-in-from-top duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center animate-pulse">
                      <Mic className="w-5 h-5" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>المستمع الصوتي القضائي الذكي</span>
                      <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-extrabold">LIVE</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      تحدث باللغة العربية الآن (مثال: <span className="font-bold text-amber-700 dark:text-amber-300">"ابحث عن قضية رقم 104"</span> أو <span className="font-bold text-amber-700 dark:text-amber-300">"ملاحظات Google Keep"</span>)
                    </p>
                  </div>
                </div>

                {/* Animated Audio Equalizer Waveform */}
                <div className="flex items-center gap-1 self-center sm:self-auto bg-slate-950/10 dark:bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  <Volume2 className="w-3.5 h-3.5 text-red-500" />
                  <div className="flex items-end gap-0.5 h-5">
                    {[12, 24, 18, 32, 20, 28, 14, 26, 16].map((baseHeight, idx) => {
                      const dynamicHeight = Math.max(4, Math.min(20, (baseHeight * (voiceVolume + 15)) / 70));
                      return (
                        <span
                          key={idx}
                          className="w-1 bg-red-500 dark:bg-red-400 rounded-full transition-all duration-75"
                          style={{ height: `${dynamicHeight}px` }}
                        ></span>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={stopVoiceSearch}
                    className="mr-2 text-[10px] font-black bg-slate-200 dark:bg-slate-800 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg transition cursor-pointer"
                  >
                    إنهاء والتنفيذ
                  </button>
                </div>
              </div>

              {/* Interim Real-Time Transcription Text */}
              {interimTranscript && (
                <div className="mt-2 pt-2 border-t border-red-500/20 text-xs font-mono text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="text-red-500 font-black font-sans text-[11px]">🎙️ النص الملتقط:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-300 animate-pulse">{interimTranscript}</span>
                </div>
              )}
            </div>
          )}

          {/* Voice Success or Notification Feedback */}
          {voiceFeedback && !isListening && (
            <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم تنفيذ الأمر الصوتي: {voiceFeedback}</span>
            </div>
          )}

          {/* Voice Error Notice */}
          {voiceError && !isListening && (
            <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{voiceError}</span>
            </div>
          )}

          {/* Categories Tab Filter Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] pt-3 pb-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
            {categoriesList.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedFilter(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedFilter === cat.id
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {!query.trim() ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">البحث الشامل والصوتي في ديوان المحاماة</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  ابحث بالصوت أو الكتابة عن: القضايا، الموكلين، مذكرات وملاحظات Google Keep، الجلسات، الأتعاب، أو نصوص مستندات Word والإكسيل المرفوعة ومواد القانون.
                </p>
              </div>

              {/* Voice Prompt Suggestions */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 max-w-xl mx-auto text-right">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                  <Mic className="w-3.5 h-3.5 text-amber-500" />
                  <span>نماذج لأوامر البحث الصوتي السريعة باللغة العربية:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { cmd: "ابحث عن قضية رقم 104", desc: "ينتقل لتصنيف القضايا ويبحث عن رقم 104" },
                    { cmd: "موكل أحمد الشناوي", desc: "يعرض بطاقة الموكل والتوكيل فوراً" },
                    { cmd: "ملاحظات Google Keep", desc: "يبحث في المذكرات والملاحظات السحابية" },
                    { cmd: "أتعاب شهر يونيو ومستحقات", desc: "يفرز سندات الخزينة والمقبوضات" }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(item.cmd);
                        parseArabicVoiceQuery(item.cmd);
                      }}
                      className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 rounded-xl text-right transition cursor-pointer group"
                    >
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                        🎙️ "{item.cmd}"
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Shortcuts Suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="text-[11px] text-slate-500 font-bold">اقتراحات شائعة:</span>
                {["قضية", "ملاحظات Keep", "توكيل", "استخراج", "جلسة", "عقد", "أتعاب", "محضر"].map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setQuery(tag);
                      if (tag.includes("Keep")) setSelectedFilter("notes");
                    }}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-500 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">لم يتم العثور على نتائج مطابقة لـ "{query}"</p>
              <p className="text-xs text-slate-400">جرب البحث بكلمة أخرى، أو اختيار تصنيف "الكل" من التصفية بالأعلى.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <span>تم العثور على {searchResults.length} نتيجة بحث:</span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">اضغط على أي نتيجة للانتقال إليها</span>
                </div>

                {/* Export & Print Toolbar */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 cursor-pointer shadow-xs"
                    title="تصدير النتائج إلى ملف Excel"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>تصدير Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-200 dark:border-rose-800 cursor-pointer shadow-xs"
                    title="استخراج تقرير النتائج كملف PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تقرير PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintResults}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
                    title="طباعة تقرير البحث"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة</span>
                  </button>
                </div>
              </div>

              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectResult(item)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer group flex items-start gap-3.5"
                >
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 mt-0.5 group-hover:scale-105 transition">
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${item.badgeColor}`}>
                        {item.categoryLabel}
                      </span>
                      {item.date && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.date}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition truncate">
                      {highlightMatch(item.title, query)}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {highlightMatch(item.subtitle, query)}
                    </p>

                    {item.snippet && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                        {highlightMatch(item.snippet, query)}
                      </div>
                    )}
                  </div>

                  <div className="self-center flex items-center gap-1 text-slate-400 group-hover:text-amber-500 transition text-xs font-bold">
                    <span className="hidden sm:inline">انتقال</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500 px-5">
          <div className="flex items-center gap-2">
            <span>البحث الصوتي الذكي مدعوم باللغة العربية</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <span>اختصار سريع: اضغط <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded font-mono font-bold">Ctrl + K</kbd> من أي مكان</span>
        </div>

      </div>
    </div>
  );
}
