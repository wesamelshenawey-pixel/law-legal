import React, { useState, useRef, useEffect } from "react";
import { CaseRecord, ClientProfile, PlatformUser, OpponentProfile } from "../types";
import GoldenEagleEmblem from "./GoldenEagleEmblem";
import {
  Scan,
  Upload,
  Image as ImageIcon,
  Sparkles,
  FileText,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  Download,
  Printer,
  Scale,
  Edit3,
  Wand2,
  RefreshCw,
  Eye,
  AlertCircle,
  UserPlus,
  FolderPlus,
  Link,
  ShieldCheck,
  Building,
  UserCheck,
  ExternalLink,
  FolderLock,
  CloudDownload,
  Bookmark,
  Share2,
  Camera,
  RotateCw,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Search,
  Replace,
  SlidersHorizontal,
  Layers,
  ShieldAlert,
  FileCheck2,
  Languages,
  GitCompare,
  ZoomIn,
  X
} from "lucide-react";
import { 
  getStoredWorkspaceToken, 
  requestWorkspaceAuth, 
  fetchGoogleDriveFiles, 
  downloadGoogleDriveFileAsBase64, 
  openGooglePicker,
  saveLocalKeepMemo,
  uploadFileToGoogleDrive
} from "../utils/workspaceService";

// Import modular OCR Intelligence sub-components
import OcrCameraScannerModal from "./OcrCameraScannerModal";
import OcrLegalFlawsAnalysis from "./OcrLegalFlawsAnalysis";
import OcrContractClausesAnalysis from "./OcrContractClausesAnalysis";
import OcrTranslationHub from "./OcrTranslationHub";
import OcrDocumentComparator from "./OcrDocumentComparator";
import OcrPrintPreviewModal from "./OcrPrintPreviewModal";

interface SmartOcrStudioProps {
  currentUser: PlatformUser;
  clients: ClientProfile[];
  cases: CaseRecord[];
  opponents?: OpponentProfile[];
  onAddClient?: (client: ClientProfile) => void;
  onAddCase?: (newCase: CaseRecord) => void;
  onAddOpponent?: (opponent: OpponentProfile) => void;
  onOpenInEditor?: (text: string, title?: string, clientName?: string, caseNumber?: string) => void;
  onNavigate?: (section: string) => void;
  language?: "ar" | "en";
}

interface UploadedScanItem {
  id: string;
  name: string;
  previewUrl: string;
  base64: string;
  size: number;
  extractedText?: string;
  entities?: ExtractedLegalEntities;
  isProcessing?: boolean;
  filter?: "normal" | "bw" | "grayscale" | "inverted";
}

interface ExtractedLegalEntities {
  clientName: string;
  nationalId?: string;
  phone?: string;
  opponentName?: string;
  caseNumber?: string;
  caseYear?: string;
  competentCourt?: string;
  courtType?: string;
  subject?: string;
  demands?: string;
}

export default function SmartOcrStudio({
  currentUser,
  clients,
  cases,
  opponents = [],
  onAddClient,
  onAddCase,
  onAddOpponent,
  onOpenInEditor,
  onNavigate,
  language = "ar"
}: SmartOcrStudioProps) {
  // Navigation tabs within Smart OCR Studio
  const [activeTab, setActiveTab] = useState<"ocr" | "flaws" | "clauses" | "translate" | "compare">("ocr");

  const [scanItems, setScanItems] = useState<UploadedScanItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [extractedOverallText, setExtractedOverallText] = useState("");
  const [copied, setCopied] = useState(false);
  
  // AI Drafting and Auto-Correction state
  const [autoCorrectSpelling, setAutoCorrectSpelling] = useState(true);
  const [extractEntities, setExtractEntities] = useState(true);
  const [ocrMode, setOcrMode] = useState<"standard" | "national_id" | "contract" | "court_verdict" | "handwritten" | "tables" | "poa">("standard");
  const [draftingMode, setDraftingMode] = useState<"raw" | "brief" | "summary">("raw");
  const [aiDraftedText, setAiDraftedText] = useState("");
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [isParsingEntities, setIsParsingEntities] = useState(false);

  // Extracted and Editable Legal Entities
  const [detectedEntities, setDetectedEntities] = useState<ExtractedLegalEntities>({
    clientName: "",
    nationalId: "",
    phone: "",
    opponentName: "",
    caseNumber: "",
    caseYear: new Date().getFullYear().toString(),
    competentCourt: "محكمة استئناف القاهرة",
    courtType: "استئناف مدني وتجاري",
    subject: "",
    demands: ""
  });

  // Action status feedbacks
  const [clientCreatedStatus, setClientCreatedStatus] = useState<string | null>(null);
  const [opponentCreatedStatus, setOpponentCreatedStatus] = useState<string | null>(null);
  const [caseCreatedStatus, setCaseCreatedStatus] = useState<string | null>(null);
  const [keepSavedStatus, setKeepSavedStatus] = useState<string | null>(null);
  const [driveSavedStatus, setDriveSavedStatus] = useState<string | null>(null);

  // Google Workspace Drive integration states
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveSearchQuery, setDriveSearchQuery] = useState("");

  // Modals
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);

  // Search & Replace inside OCR output
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);

  // Audio TTS Reader
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeechRate, setAudioSpeechRate] = useState<number>(1.0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update match count when search query changes
  useEffect(() => {
    const text = aiDraftedText || extractedOverallText;
    if (!searchQuery.trim() || !text) {
      setMatchCount(0);
      return;
    }
    try {
      const regex = new RegExp(searchQuery, "gi");
      const matches = text.match(regex);
      setMatchCount(matches ? matches.length : 0);
    } catch {
      setMatchCount(0);
    }
  }, [searchQuery, aiDraftedText, extractedOverallText]);

  // TTS Reader
  const handlePlayTTS = () => {
    const textToSpeak = aiDraftedText || extractedOverallText;
    if (!textToSpeak.trim()) {
      alert("لا يوجد نص للقراءة الصوتية.");
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = "ar-SA";
      utterance.rate = audioSpeechRate;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    } else {
      alert("القارئ الصوتي غير مدعوم في هذا المتصفح.");
    }
  };

  const handleStopTTS = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  // Search & Replace Execution
  const handleExecuteReplace = (replaceAll = false) => {
    if (!searchQuery) return;
    const currentText = aiDraftedText || extractedOverallText;
    let newText = "";
    if (replaceAll) {
      newText = currentText.split(searchQuery).join(replaceQuery);
    } else {
      newText = currentText.replace(searchQuery, replaceQuery);
    }

    if (aiDraftedText) {
      setAiDraftedText(newText);
    } else {
      setExtractedOverallText(newText);
    }
  };

  // Image Rotation Tool (Canvas Transformation)
  const handleRotateActiveItem = (angleDeg: number) => {
    if (!activeItemId) return;
    const item = scanItems.find((i) => i.id === activeItemId);
    if (!item) return;

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (Math.abs(angleDeg) === 90 || Math.abs(angleDeg) === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((angleDeg * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setScanItems((prev) =>
        prev.map((it) =>
          it.id === activeItemId
            ? { ...it, previewUrl: rotatedDataUrl, base64: rotatedDataUrl }
            : it
        )
      );
    };
    img.src = item.base64;
  };

  // Image Filter Preset
  const handleApplyFilter = (filterType: "normal" | "bw" | "grayscale" | "inverted") => {
    if (!activeItemId) return;
    setScanItems((prev) =>
      prev.map((it) =>
        it.id === activeItemId ? { ...it, filter: filterType } : it
      )
    );
  };

  // Load files from Google Drive
  const handleOpenGoogleDriveModal = async () => {
    let tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) {
      requestWorkspaceAuth(
        (newState) => {
          tokenState = newState;
          loadDriveFiles(newState.accessToken!);
        },
        () => {
          alert("تعذر الاتصال بـ Google Drive. يرجى التأكد من منح الإذن.");
        }
      );
      return;
    }
    loadDriveFiles(tokenState.accessToken);
  };

  const loadDriveFiles = async (token: string) => {
    setIsLoadingDrive(true);
    setShowDriveModal(true);
    try {
      const files = await fetchGoogleDriveFiles(token, driveSearchQuery);
      setDriveFiles(files);
    } catch (e: any) {
      console.error(e);
      alert("خطأ في جلب ملفات Google Drive: " + (e.message || e));
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleImportDriveFile = async (file: any) => {
    const tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) {
      alert("يرجى تسجيل الدخول إلى Google أولاً");
      return;
    }

    try {
      setIsLoadingDrive(true);
      const { base64 } = await downloadGoogleDriveFileAsBase64(
        tokenState.accessToken,
        file.id,
        file.mimeType
      );
      const itemId = "scan-" + Math.random().toString(36).substring(2, 9);
      const newItem: UploadedScanItem = {
        id: itemId,
        name: file.name,
        previewUrl: base64,
        base64: base64,
        size: 1024 * 100,
        isProcessing: false,
        filter: "normal"
      };

      setScanItems((prev) => [...prev, newItem]);
      if (!activeItemId) setActiveItemId(itemId);
      setShowDriveModal(false);
      setDriveSavedStatus(`تم استيراد الملف [${file.name}] من Google Drive بنجاح.`);
      setTimeout(() => setDriveSavedStatus(null), 4000);
    } catch (e: any) {
      alert("فشل استيراد الملف من Google Drive: " + e.message);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Launch Google Picker
  const handleLaunchGooglePicker = () => {
    let tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) {
      requestWorkspaceAuth((newState) => {
        tokenState = newState;
        launchPickerWithToken(newState.accessToken!);
      });
      return;
    }
    launchPickerWithToken(tokenState.accessToken);
  };

  const launchPickerWithToken = (token: string) => {
    openGooglePicker({
      token,
      onPicked: async (docs) => {
        for (const doc of docs) {
          try {
            const { base64 } = await downloadGoogleDriveFileAsBase64(
              token,
              doc.id,
              doc.mimeType
            );
            const itemId = "scan-" + Math.random().toString(36).substring(2, 9);
            const newItem: UploadedScanItem = {
              id: itemId,
              name: doc.name,
              previewUrl: base64,
              base64: base64,
              size: 1024 * 80,
              isProcessing: false,
              filter: "normal"
            };
            setScanItems((prev) => [...prev, newItem]);
            if (!activeItemId) setActiveItemId(itemId);
          } catch (e) {
            console.error("Picker doc download error:", e);
          }
        }
        setDriveSavedStatus(`تم استيراد ${docs.length} مستند بنجاح من Google Picker.`);
        setTimeout(() => setDriveSavedStatus(null), 4000);
      }
    });
  };

  // Save to Google Keep Memos
  const handleSaveToKeepNotes = () => {
    const textToSave = aiDraftedText || extractedOverallText;
    if (!textToSave.trim()) {
      alert("لا يوجد نص مستخرج لحفظه في Google Keep.");
      return;
    }

    const title = detectedEntities.caseNumber
      ? `ملاحظات مستند القضية ${detectedEntities.caseNumber}/${detectedEntities.caseYear} - ${detectedEntities.clientName}`
      : `ملاحظات فحص مستند ضوئي - ${detectedEntities.clientName || "مستند قضائي"}`;

    saveLocalKeepMemo({
      title,
      content: textToSave,
      tags: [detectedEntities.courtType || "محاكم", "مسح ضوئي OCR", detectedEntities.clientName || "موكل"],
      pinned: true
    });

    setKeepSavedStatus(`📌 تم حفظ المذكرة والنص المستخرج بنجاح في Google Keep والملاحظات القضائية للمكتب.`);
    setTimeout(() => setKeepSavedStatus(null), 5000);
  };

  // Upload processed OCR or Draft to Google Drive
  const handleExportToGoogleDrive = async () => {
    const textToSave = aiDraftedText || extractedOverallText;
    if (!textToSave.trim()) {
      alert("لا يوجد نص لحفظه على Google Drive.");
      return;
    }

    let tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) {
      requestWorkspaceAuth((newState) => {
        tokenState = newState;
        executeDriveUpload(newState.accessToken!, textToSave);
      });
      return;
    }
    executeDriveUpload(tokenState.accessToken, textToSave);
  };

  const executeDriveUpload = async (token: string, text: string) => {
    try {
      const fileName = `مستند_مستخرج_${detectedEntities.caseNumber || "قضائي"}_${Date.now()}.txt`;
      const base64Data = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(text)));
      await uploadFileToGoogleDrive(token, fileName, base64Data, "text/plain");
      setDriveSavedStatus(`☁️ تم تصدير وحفظ المستند [${fileName}] بنجاح إلى Google Drive!`);
      setTimeout(() => setDriveSavedStatus(null), 5000);
    } catch (e: any) {
      alert("فشل الرفع إلى Google Drive: " + e.message);
    }
  };

  // Deduplication Helpers
  const findExistingClient = (name: string, nationalId?: string) => {
    if (!name && !nationalId) return null;
    return clients.find((c) => {
      const nameMatch = name && c.name.trim().toLowerCase() === name.trim().toLowerCase();
      const idMatch = nationalId && c.nationalId && c.nationalId.trim() === nationalId.trim();
      return nameMatch || idMatch;
    });
  };

  const findExistingOpponent = (name: string, nationalId?: string) => {
    if (!name && !nationalId) return null;
    return opponents.find((o) => {
      const nameMatch = name && o.name.trim().toLowerCase() === name.trim().toLowerCase();
      const idMatch = nationalId && o.nationalId && o.nationalId.trim() === nationalId.trim();
      return nameMatch || idMatch;
    });
  };

  const findExistingCase = (caseNum: string, caseYr?: string, court?: string) => {
    if (!caseNum) return null;
    return cases.find((cs) => {
      const numMatch = cs.caseNumber.trim() === caseNum.trim();
      const yrMatch = !caseYr || cs.caseYear.toString().trim() === caseYr.trim();
      const courtMatch = !court || cs.competentCourt.trim().toLowerCase() === court.trim().toLowerCase();
      return numMatch && yrMatch && (courtMatch || !court);
    });
  };

  // Local Rule-based fallback entity parser
  const parseEntitiesFromArabicText = (rawText: string): ExtractedLegalEntities => {
    let clientName = "";
    let opponentName = "";
    let caseNumber = "";
    let caseYear = new Date().getFullYear().toString();
    let competentCourt = "محكمة شمال القاهرة الابتدائية";
    let subject = "";
    let phone = "";
    let nationalId = "";

    const clientMatch = rawText.match(/(?:بناءً على طلب|مقدمه|الطالب|المدعي|الشاكي|المستأنف|المتهم)\s*[:/]?\s*([^\n,،.]+)/);
    if (clientMatch) clientName = clientMatch[1].replace(/السيد|الأستاذ|المواطن/g, "").trim();

    const opponentMatch = rawText.match(/(?:ضد|المعلن إليه|المشكو في حقه|المدعى عليه|المستأنف ضده)\s*[:/]?\s*([^\n,،.]+)/);
    if (opponentMatch) opponentName = opponentMatch[1].replace(/السيد|الأستاذ|المواطن/g, "").trim();

    const caseMatch = rawText.match(/(?:رقم|القضية رقم|الدعوى رقم|جنحة رقم|حصر رقم)\s*[:/]?\s*([0-9]+)\s*(?:لسنة|\/)\s*([0-9]{4})/);
    if (caseMatch) {
      caseNumber = caseMatch[1];
      caseYear = caseMatch[2];
    } else {
      const singleNumMatch = rawText.match(/(?:رقم|الدعوى)\s*[:/]?\s*([0-9]{3,7})/);
      if (singleNumMatch) caseNumber = singleNumMatch[1];
    }

    const courtMatch = rawText.match(/(?:محكمة|بمحكمة|أمام محكمة)\s*[:/]?\s*([^\n,،.]+)/);
    if (courtMatch) competentCourt = courtMatch[0].trim();

    const subjectMatch = rawText.match(/(?:الموضوع|بشأن|موضوع الدعوى)\s*[:/]?\s*([^\n.]+)/);
    if (subjectMatch) subject = subjectMatch[1].trim();

    const idMatch = rawText.match(/(?:الرقم القومي|بطاقة رقم|قومي)\s*[:/]?\s*([0-9]{14})/);
    if (idMatch) nationalId = idMatch[1];

    const phoneMatch = rawText.match(/(?:01[0125][0-9]{8})/);
    if (phoneMatch) phone = phoneMatch[0];

    return {
      clientName: clientName || detectedEntities.clientName,
      opponentName: opponentName || detectedEntities.opponentName,
      caseNumber: caseNumber || detectedEntities.caseNumber,
      caseYear: caseYear || detectedEntities.caseYear,
      competentCourt: competentCourt || detectedEntities.competentCourt,
      courtType: "مدني / استئناف",
      subject: subject || (rawText.length > 30 ? rawText.substring(0, 70) + "..." : "دعوى مستخرجة من الفحص"),
      nationalId: nationalId || detectedEntities.nationalId,
      phone: phone || detectedEntities.phone,
      demands: "إلزام الخصم بالطلبات الواردة بصحيفة الدعوى والمصاريف وأتعاب المحاماة."
    };
  };

  // AI-Powered Deep Entity Extractor
  const handleDeepEntityExtraction = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsParsingEntities(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `أنت خبير فحص واستخراج بيانات قانونية في المحاكم المصرية. قم باستخراج البيانات التالية من هذا النص القضائي بدقة فائقة وأجب بصيغة JSON فقط:
{
  "clientName": "اسماء الموكلين أو المدعين أو الشاكين (إذا كان هناك أكثر من اسم، اذكرهم جميعاً وافصل بينهم بفاصلة عربية '،')",
  "nationalId": "الرقم القومي (إذا كان هناك أكثر من رقم افصل بينهم بفاصلة '،')",
  "phone": "رقم الهاتف إن وجد (إذا كان هناك أكثر من رقم افصل بينهم بفاصلة '،')",
  "opponentName": "اسماء الخصوم أو المدعى عليهم (إذا كان هناك أكثر من اسم، اذكرهم جميعاً وافصل بينهم بفاصلة عربية '،')",
  "caseNumber": "رقم القضية أو المحضر",
  "caseYear": "السنة القضائية 4 أرقام",
  "competentCourt": "اسم المحكمة المختصة أو الدائرة",
  "courtType": "نوع المحكمة مثل: جنايات / مدني كلي / أسرة / تجاري / إداري",
  "subject": "موضوع الدعوى أو النزاع",
  "demands": "الطلبات الختامية"
}

نص المستند:
${textToParse}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawContent = data.text || "";
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setDetectedEntities((prev) => ({
            ...prev,
            clientName: parsed.clientName || prev.clientName,
            nationalId: parsed.nationalId || prev.nationalId,
            phone: parsed.phone || prev.phone,
            opponentName: parsed.opponentName || prev.opponentName,
            caseNumber: parsed.caseNumber || prev.caseNumber,
            caseYear: parsed.caseYear || prev.caseYear,
            competentCourt: parsed.competentCourt || prev.competentCourt,
            courtType: parsed.courtType || prev.courtType,
            subject: parsed.subject || prev.subject,
            demands: parsed.demands || prev.demands
          }));
        } else {
          const fallback = parseEntitiesFromArabicText(textToParse);
          setDetectedEntities(fallback);
        }
      } else {
        const fallback = parseEntitiesFromArabicText(textToParse);
        setDetectedEntities(fallback);
      }
    } catch (e) {
      console.error("AI Entity Parse Error:", e);
      const fallback = parseEntitiesFromArabicText(textToParse);
      setDetectedEntities(fallback);
    } finally {
      setIsParsingEntities(false);
    }
  };

  // Add Item via Camera Snapshot
  const handleAddCameraSnapshot = (base64: string, name: string) => {
    const itemId = "scan-" + Math.random().toString(36).substring(2, 9);
    const newItem: UploadedScanItem = {
      id: itemId,
      name,
      previewUrl: base64,
      base64,
      size: 1024 * 120,
      isProcessing: false,
      filter: "normal"
    };
    setScanItems((prev) => [...prev, newItem]);
    if (!activeItemId) setActiveItemId(itemId);
  };

  // File Upload Handler (Supports multiple files)
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const itemId = "scan-" + Math.random().toString(36).substring(2, 9);

        const initialItem: UploadedScanItem = {
          id: itemId,
          name: file.name,
          previewUrl: base64Data,
          base64: base64Data,
          size: file.size,
          isProcessing: true,
          filter: "normal"
        };

        setScanItems((prev) => {
          const updated = [...prev, initialItem];
          if (!activeItemId) setActiveItemId(itemId);
          return updated;
        });

        // Auto-fix orientation if it's an image
        let finalBase64 = base64Data;
        if (file.type.startsWith("image/")) {
          try {
            const res = await fetch("/api/ai/detect-orientation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageBase64: base64Data })
            });
            if (res.ok) {
              const data = await res.json();
              const orientation = data.orientation;

              if (orientation && orientation !== "NORMAL") {
                finalBase64 = await new Promise<string>((resolve) => {
                  const img = new window.Image();
                  img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return resolve(base64Data);

                    if (orientation === "UPSIDE_DOWN") {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx.translate(img.width / 2, img.height / 2);
                      ctx.rotate(Math.PI);
                      ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    } else if (orientation === "LEFT") {
                      canvas.width = img.height;
                      canvas.height = img.width;
                      ctx.translate(canvas.width / 2, canvas.height / 2);
                      ctx.rotate(Math.PI / 2);
                      ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    } else if (orientation === "RIGHT") {
                      canvas.width = img.height;
                      canvas.height = img.width;
                      ctx.translate(canvas.width / 2, canvas.height / 2);
                      ctx.rotate(-Math.PI / 2);
                      ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    } else {
                      return resolve(base64Data);
                    }
                    resolve(canvas.toDataURL(file.type));
                  };
                  img.onerror = () => resolve(base64Data);
                  img.src = base64Data;
                });
              }
            }
          } catch (err) {
            console.error("Orientation auto-fix failed", err);
          }
        }

        setScanItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, base64: finalBase64, previewUrl: finalBase64, isProcessing: false }
              : item
          )
        );
      };
      reader.readAsDataURL(file);
    });
  };

  // Perform AI OCR on a single item
  const processOcr = async (item: UploadedScanItem) => {
    try {
      // 1. Specialized National ID extraction
      if (ocrMode === "national_id") {
        const res = await fetch("/api/ai/ocr-extract-id-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: item.base64 })
        });
        if (res.ok) {
          const data = await res.json();
          // Auto update detected entities directly
          setDetectedEntities((prev) => ({
            ...prev,
            clientName: data.name || data.fullName || prev.clientName,
            nationalId: data.national_id || data.nationalId || prev.nationalId,
            subject: data.profession || data.job ? `المهنة: ${data.profession || data.job}` : prev.subject
          }));
          return JSON.stringify({
            name: data.name || data.fullName || "",
            national_id: data.national_id || data.nationalId || "",
            address: data.address || "",
            profession: data.profession || data.job || ""
          }, null, 2);
        }
      }

      // 2. Specialized Contract and Legal Memos Archiving
      if (ocrMode === "contract") {
        const res = await fetch("/api/ai/ocr-contract-memo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: item.base64 })
        });
        if (res.ok) {
          const data = await res.json();
          return data.text || "";
        }
      }

      // 3. Specialized Court Ruling and Session Minutes Classification
      if (ocrMode === "court_verdict") {
        const res = await fetch("/api/ai/ocr-court-session-ruling", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: item.base64 })
        });
        if (res.ok) {
          const data = await res.json();
          return data.text || "";
        }
      }

      // 4. Specialized Handwritten Drafts and Legal Notes
      if (ocrMode === "handwritten") {
        const res = await fetch("/api/ai/ocr-handwritten-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: item.base64 })
        });
        if (res.ok) {
          const data = await res.json();
          return data.text || "";
        }
      }

      // Default & other modes
      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: item.base64,
          mode: ocrMode,
          prompt: autoCorrectSpelling
            ? "قم بقراءة واستخراج كافة النصوص العربية المكتوبة في هذا المستند القضائي أو الورقة الرسمية بدقة متناهية من جميع الاتجاهات، مع تصحيح أي أخطاء إملائية أو مطبعية ناتجة عن رداءة التصوير أو الخط اليدوي، وترتيب الفقرات وتنسيق الجداول بدقة:"
            : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.text || "";
        return text;
      }
      return "تعذر استخراج النص من الصورة المحددة.";
    } catch (err) {
      console.error(err);
      return "حدث خطأ أثناء معالجة المستند.";
    }
  };

  // Process all uploaded files in batch
  const handleBatchOcr = async () => {
    if (scanItems.length === 0) return;
    setIsProcessingAll(true);

    let combinedText = "";

    const updatedItems = await Promise.all(
      scanItems.map(async (item) => {
        const text = await processOcr(item);
        combinedText += `\n\n--- [مستند: ${item.name}] ---\n` + text;
        return {
          ...item,
          extractedText: text
        };
      })
    );

    const cleanCombined = combinedText.trim();
    setScanItems(updatedItems);
    setExtractedOverallText(cleanCombined);
    setIsProcessingAll(false);

    if (extractEntities && cleanCombined) {
      handleDeepEntityExtraction(cleanCombined);
    }
  };

  // AI Auto-Drafting & Synthesis
  const handleGenerateAiDraft = async (mode: "brief" | "summary") => {
    if (!extractedOverallText.trim()) return;
    setIsAiDrafting(true);
    setDraftingMode(mode);

    try {
      const res = await fetch("/api/ai/defense-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseType: mode === "brief" ? "صياغة مذكرة دفاع متكاملة من الأوراق المستخرجة" : "تلخيص وتحليل قضائي شامل للمستندات",
          courtType: detectedEntities.competentCourt || "محاكم الاستئناف والابتدائية",
          evidencePoints: [extractedOverallText],
          demands:
            mode === "brief"
              ? "قم بصياغة مذكرة دفاع قانونية نموذجية ورصينة بناءً على الوقائع والأدلة المستخرجة من المستندات:"
              : "قم باستخراج جدول الوقائع، أرقام القضايا، الدفوع المتاحة، والطلبات:",
          language: "ar"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiDraftedText(data.brief || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiDrafting(false);
    }
  };

  // ONE-CLICK CLIENT AUTO-CREATION (With Deduplication)
  const handleAutoCreateClient = () => {
    const rawNames = detectedEntities.clientName.trim();
    if (!rawNames) {
      alert("يرجى التأكد من استخراج أو إدخال اسم الموكل أولاً.");
      return;
    }

    const namesArray = rawNames.split(/[،,-]/).map((n) => n.replace(/^و\s+/, "").trim()).filter(Boolean);
    let createdCount = 0;
    let existingCount = 0;

    namesArray.forEach((clientName, index) => {
      const nIds = (detectedEntities.nationalId || "").split(/[،,-]/).map((id) => id.trim());
      const cNationalId = nIds[index] || nIds[0] || `29${Math.floor(100000000000 + Math.random() * 900000000000)}`;

      const existing = findExistingClient(clientName, cNationalId);
      if (existing) {
        existingCount++;
        return;
      }

      if (onAddClient) {
        const yearNum = parseInt(detectedEntities.caseYear || "2026", 10) || 2026;
        const newClient: ClientProfile = {
          id: "CL-" + Math.floor(1000 + Math.random() * 9000),
          serialNumber: clients.length + 1 + index,
          name: clientName,
          nationalId: cNationalId,
          poaNumber: Math.floor(1000 + Math.random() * 9000).toString(),
          poaLetter: "أ",
          poaYear: yearNum,
          poaOffice: "مكتب توثيق الأهرام النموذجي",
          caseNumber: detectedEntities.caseNumber || "قيد التعيين",
          caseYear: yearNum,
          competentCourt: detectedEntities.competentCourt || "محكمة استئناف القاهرة",
          subject: detectedEntities.subject || "دعوى قضائية مستخرجة من المسح الضوئي",
          phone: (detectedEntities.phone || "01000000000").split(/[،,-]/)[index] || detectedEntities.phone || "01000000000",
          countryCode: "+20",
          address: "جمهورية مصر العربية",
          remainingFees: 10000,
          createdAt: new Date().toISOString()
        };

        onAddClient(newClient);
        createdCount++;
      }
    });

    if (createdCount > 0 && existingCount === 0) {
      setClientCreatedStatus(`✔️ تم تسجيل (${createdCount}) موكل جديد بنجاح في سجل الموكلين.`);
    } else if (createdCount > 0 && existingCount > 0) {
      setClientCreatedStatus(`✔️ تم تسجيل (${createdCount}) موكل جديد، ووجدنا (${existingCount}) مسجلين مسبقاً.`);
    } else if (createdCount === 0 && existingCount > 0) {
      setClientCreatedStatus(`كافة الموكلين (${existingCount}) مسجلين مسبقاً بالفعل لمنع التكرار.`);
    }

    setTimeout(() => setClientCreatedStatus(null), 5000);
  };

  // ONE-CLICK OPPONENT AUTO-CREATION (With Deduplication)
  const handleAutoCreateOpponent = () => {
    const rawNames = detectedEntities.opponentName?.trim();
    if (!rawNames) {
      alert("يرجى التأكد من استخراج أو إدخال اسم الخصم أولاً.");
      return;
    }

    const namesArray = rawNames.split(/[،,-]/).map((n) => n.replace(/^و\s+/, "").trim()).filter(Boolean);
    let createdCount = 0;
    let existingCount = 0;

    namesArray.forEach((opponentName, index) => {
      const nIds = (detectedEntities.nationalId || "").split(/[،,-]/).map((id) => id.trim());
      const cNationalId = nIds[index] || nIds[0] || "غير محدد";

      const existing = findExistingOpponent(opponentName, cNationalId !== "غير محدد" ? cNationalId : undefined);
      if (existing) {
        existingCount++;
        return;
      }

      if (onAddOpponent) {
        const newOpponent: OpponentProfile = {
          id: "OPP-" + Math.floor(1000 + Math.random() * 900000),
          name: opponentName,
          phone: (detectedEntities.phone || "غير محدد").split(/[،,-]/)[index] || detectedEntities.phone || "غير محدد",
          nationalId: cNationalId,
          isDifferentColor: false
        };
        onAddOpponent(newOpponent);
        createdCount++;
      }
    });

    if (createdCount > 0 && existingCount === 0) {
      setOpponentCreatedStatus(`✔️ تم إنشاء وتوثيق (${createdCount}) خصم بنجاح.`);
    } else if (createdCount > 0 && existingCount > 0) {
      setOpponentCreatedStatus(`✔️ تم إنشاء (${createdCount}) خصم جديد، ووجدنا (${existingCount}) مسجلين مسبقاً.`);
    } else if (createdCount === 0 && existingCount > 0) {
      setOpponentCreatedStatus(`كافة الخصوم (${existingCount}) مسجلين مسبقاً بالفعل لمنع التكرار.`);
    }

    setTimeout(() => setOpponentCreatedStatus(null), 5000);
  };

  // ONE-CLICK CASE AUTO-CREATION (With Deduplication)
  const handleAutoCreateCase = () => {
    const caseNum = detectedEntities.caseNumber.trim();
    const caseYr = detectedEntities.caseYear.trim() || new Date().getFullYear().toString();
    const court = detectedEntities.competentCourt.trim() || "محكمة استئناف القاهرة";

    if (!caseNum) {
      alert("يرجى إدخال أو استخراج رقم القضية أولاً.");
      return;
    }

    const existing = findExistingCase(caseNum, caseYr, court);
    if (existing) {
      setCaseCreatedStatus(`ملف القضية رقم (${existing.caseNumber}/${existing.caseYear} - ${existing.competentCourt}) مسجل مسبقاً في ديوان القضايا. تم الربط بنجاح.`);
      setTimeout(() => setCaseCreatedStatus(null), 5000);
      return;
    }

    if (onAddCase) {
      const yearNum = parseInt(caseYr, 10) || 2026;
      const newCase: CaseRecord = {
        id: "CS-" + Math.floor(1000 + Math.random() * 9000),
        serialNumber: cases.length + 1,
        caseNumber: caseNum,
        caseYear: yearNum,
        competentCourt: court,
        courtType: detectedEntities.courtType || "مدني كلي",
        subject: detectedEntities.subject || "دعوى قضائية مستخرجة من أوراق المسح الضوئي",
        clientName: detectedEntities.clientName || "موكل مستخرج من الفحص الضوئي",
        clientRole: "مدعي / طالب",
        opponentName: detectedEntities.opponentName || "الخصم المستخرج من الأوراق",
        nextSessionDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        details: `مستندات تم استخراجها وتدقيقها عبر محرك OCR الذكي:\n${extractedOverallText.substring(0, 300)}...`,
        attachments: [],
        scans: [],
        createdAt: new Date().toISOString()
      };

      onAddCase(newCase);
      setCaseCreatedStatus(`📁 تم قيد ملف القضية الجديد بنجاح برقم (${newCase.caseNumber}/${newCase.caseYear}) وربطها بالموكل [${newCase.clientName}].`);
      setTimeout(() => setCaseCreatedStatus(null), 5000);
    }
  };

  // ONE-CLICK PROVISION AND LINK ALL THREE MODULES
  const handleAutoProvisionAndLinkAll = () => {
    handleAutoCreateClient();
    handleAutoCreateOpponent();
    handleAutoCreateCase();
    if (onOpenInEditor) {
      onOpenInEditor(
        aiDraftedText || extractedOverallText,
        `مذكرة دفاع - القضية رقم ${detectedEntities.caseNumber}/${detectedEntities.caseYear}`,
        detectedEntities.clientName,
        detectedEntities.caseNumber
      );
    }
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    setScanItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (activeItemId === id) {
        setActiveItemId(next[0]?.id || null);
      }
      return next;
    });
  };

  // Copy
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Existing entity checks for UI display
  const existingClientMatch = findExistingClient(detectedEntities.clientName, detectedEntities.nationalId);
  const existingOpponentMatch = findExistingOpponent(detectedEntities.opponentName || "", detectedEntities.nationalId);
  const existingCaseMatch = findExistingCase(detectedEntities.caseNumber, detectedEntities.caseYear, detectedEntities.competentCourt);

  const activeItem = scanItems.find((i) => i.id === activeItemId);

  // Compute CSS filter string for active item
  const getFilterStyle = (filter?: string) => {
    if (filter === "bw") return "grayscale(100%) contrast(250%) brightness(110%)";
    if (filter === "grayscale") return "grayscale(100%)";
    if (filter === "inverted") return "invert(100%) hue-rotate(180deg)";
    return "none";
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* 1. HEADER & SYSTEM TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
            <Scan className="w-5 h-5" />
          </div>
          <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <span>استوديو المسح الضوئي والذكاء القضائي الشامل (Smart OCR+ Studio Pro)</span>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono">
              FULL OCR SUITE
            </span>
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFilesSelected(e.target.files)}
            multiple
            accept="image/*,application/pdf"
            className="hidden"
          />

          {/* Camera Scanner Button */}
          <button
            onClick={() => setShowCameraModal(true)}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="التقاط فوري عبر كاميرا الموبايل أو اللابتوب"
          >
            <Camera className="w-4 h-4" />
            <span>مسح بالكاميرا</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>رفع ملفات</span>
          </button>

          {/* Google Drive Import Button */}
          <button
            onClick={handleOpenGoogleDriveModal}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="استيراد المستندات والقضايا مباشرة من Google Drive"
          >
            <CloudDownload className="w-4 h-4" />
            <span>Google Drive</span>
          </button>

          {/* Google Picker Button */}
          <button
            onClick={handleLaunchGooglePicker}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
            title="اختيار تفاعلي ذكي للملفات عبر Google Picker"
          >
            <FolderLock className="w-4 h-4" />
            <span>Picker</span>
          </button>

          {scanItems.length > 0 && (
            <button
              onClick={handleBatchOcr}
              disabled={isProcessingAll}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessingAll ? "جارٍ الفحص الشامل..." : "بدء الفحص واستخراج النصوص"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. NAVIGATION TABS FOR OCR+ MODULES */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("ocr")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "ocr"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Scan className="w-4 h-4" />
          <span>المسح الضوئي واستخراج النصوص (OCR Core)</span>
        </button>

        <button
          onClick={() => setActiveTab("flaws")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "flaws"
              ? "bg-rose-600 text-white shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>رصد الثغرات وبطلان الإجراءات (Flaws & Defense)</span>
        </button>

        <button
          onClick={() => setActiveTab("clauses")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "clauses"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>تدقيق بنود العقود والمخاطر (Contract Clauses)</span>
        </button>

        <button
          onClick={() => setActiveTab("translate")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "translate"
              ? "bg-sky-600 text-white shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Languages className="w-4 h-4" />
          <span>الترجمة القضائية المعتمدة (Certified Translation)</span>
        </button>

        <button
          onClick={() => setActiveTab("compare")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "compare"
              ? "bg-purple-600 text-white shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>مقارنة نسختين وتدقيق التعديلات (Diff)</span>
        </button>
      </div>

      {/* 3. FEEDBACK ALERTS */}
      {driveSavedStatus && (
        <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CloudDownload className="w-4 h-4 flex-shrink-0" />
          <span>{driveSavedStatus}</span>
        </div>
      )}

      {keepSavedStatus && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Bookmark className="w-4 h-4 flex-shrink-0" />
          <span>{keepSavedStatus}</span>
        </div>
      )}

      {clientCreatedStatus && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{clientCreatedStatus}</span>
        </div>
      )}

      {opponentCreatedStatus && (
        <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{opponentCreatedStatus}</span>
        </div>
      )}

      {caseCreatedStatus && (
        <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>{caseCreatedStatus}</span>
        </div>
      )}

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: OCR CORE */}
      {activeTab === "ocr" && (
        <div className="space-y-6">
          {/* Settings Bar */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={autoCorrectSpelling}
                  onChange={(e) => setAutoCorrectSpelling(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>التصحيح التلقائي للأخطاء الإملائية والمطبعية (AI Auto-Correct)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={extractEntities}
                  onChange={(e) => setExtractEntities(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>الاستخراج التلقائي للأطراف والقضايا ومنع التكرار (Auto Link)</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 dark:text-slate-400">نمط الاستخراج المتخصص:</span>
                <select
                  value={ocrMode}
                  onChange={(e: any) => setOcrMode(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="national_id">🪪 1. بطاقة الرقم القومي (للعملاء الجدد - JSON)</option>
                  <option value="contract">📜 2. العقود والمذكرات القانونية (أرشفة المستندات)</option>
                  <option value="court_verdict">⚖️ 3. محاضر الجلسات وأحكام المحاكم (أتمتة القضايا)</option>
                  <option value="handwritten">✍️ 4. النصوص والمسودات المكتوبة بخط اليد (تصحيح وتفريغ)</option>
                  <option value="standard">📄 استخراج نصوص قياسي شامل</option>
                  <option value="tables">📊 استخراج الجداول والبيانات المالية والمحاسبية</option>
                  <option value="poa">🏛️ التوكيلات ومحررات الشهر العقاري</option>
                </select>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              الملفات المستوردة: <span className="font-bold text-amber-500 font-mono">{scanItems.length}</span> ملف
            </div>
          </div>

          {/* 4 SPECIALIZED OCR QUICK ACTION WORKFLOWS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Workflow 1: National ID */}
            <div 
              onClick={() => setOcrMode("national_id")}
              className={`p-3.5 rounded-2xl border transition cursor-pointer text-right space-y-1.5 relative ${
                ocrMode === "national_id" 
                  ? "bg-amber-500/10 border-amber-500 shadow-sm ring-1 ring-amber-500/50" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  النمط 1 • للعملاء الجدد
                </span>
                <UserPlus className={`w-4 h-4 ${ocrMode === "national_id" ? "text-amber-500" : "text-slate-400"}`} />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                1. بطاقة الرقم القومي
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                استخراج الاسم الرباعي، الرقم القومي (14 رقماً)، العنوان بالتفصيل، والمهنة بتنسيق JSON.
              </p>
            </div>

            {/* Workflow 2: Contracts & Memos */}
            <div 
              onClick={() => setOcrMode("contract")}
              className={`p-3.5 rounded-2xl border transition cursor-pointer text-right space-y-1.5 relative ${
                ocrMode === "contract" 
                  ? "bg-emerald-500/10 border-emerald-500 shadow-sm ring-1 ring-emerald-500/50" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  النمط 2 • أرشفة المستندات
                </span>
                <FileCheck2 className={`w-4 h-4 ${ocrMode === "contract" ? "text-emerald-500" : "text-slate-400"}`} />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                2. العقود والمذكرات القانونية
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                استخراج النص بدقة فائقة مع حفظ الترقيم، وتجاهل الأختام ووضع الكلمات غير الواضحة بين [غير مقروء].
              </p>
            </div>

            {/* Workflow 3: Court Verdicts & Session Minutes */}
            <div 
              onClick={() => setOcrMode("court_verdict")}
              className={`p-3.5 rounded-2xl border transition cursor-pointer text-right space-y-1.5 relative ${
                ocrMode === "court_verdict" 
                  ? "bg-blue-500/10 border-blue-500 shadow-sm ring-1 ring-blue-500/50" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  النمط 3 • أتمتة القضايا
                </span>
                <Scale className={`w-4 h-4 ${ocrMode === "court_verdict" ? "text-blue-500" : "text-slate-400"}`} />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                3. محاضر الجلسات والأحكام
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                تصنيف واستخراج رقم القضية وسنتها، نوع القضية ودرجة المحكمة، أطراف النزاع، ومنطوق الحكم.
              </p>
            </div>

            {/* Workflow 4: Handwritten Notes & Defense Drafts */}
            <div 
              onClick={() => setOcrMode("handwritten")}
              className={`p-3.5 rounded-2xl border transition cursor-pointer text-right space-y-1.5 relative ${
                ocrMode === "handwritten" 
                  ? "bg-purple-500/10 border-purple-500 shadow-sm ring-1 ring-purple-500/50" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-400/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300">
                  النمط 4 • مسودات خط اليد
                </span>
                <Edit3 className={`w-4 h-4 ${ocrMode === "handwritten" ? "text-purple-500" : "text-slate-400"}`} />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                4. النصوص المكتوبة بخط اليد
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                نسخ نصوص خط اليد وتصحيح الأخطاء الإملائية سياقياً مع تدوين الكلمة الأصلية في الملاحظات و[غير مقروء].
              </p>
            </div>
          </div>

          {/* Main Grid or Empty Dropzone */}
          {scanItems.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-3xl p-12 text-center bg-white dark:bg-slate-900 cursor-pointer transition space-y-4"
            >
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
                  اسحب وأفلت صور المستندات القضائية أو اضغط للاستيراد
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  يدعم رفع عدة صور دفعة واحدة أو التقاط صور مباشرة بالكاميرا للعرائض، الأحكام، التوكيلات، والإيصالات
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCameraModal(true);
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>فتح الكاميرا والمسح المباشر</span>
                </button>
                <button className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black transition">
                  اختيار الملفات من الجهاز
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Grid: Thumbnails (3 Cols), Image View & Enhancers (4 Cols), Text & AI Synthesis (5 Cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Thumbnails Sidebar */}
                <div className="lg:col-span-3 space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">قائمة المستندات:</span>
                    <button
                      onClick={() => setScanItems([])}
                      className="text-[10px] text-red-500 hover:underline font-bold"
                    >
                      مسح الكل
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {scanItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveItemId(item.id)}
                        className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center gap-2.5 ${
                          activeItemId === item.id
                            ? "bg-amber-500/10 border-amber-500 shadow-sm"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          style={{ filter: getFilterStyle(item.filter) }}
                          className="w-12 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-800 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(item.size / 1024).toFixed(0)} KB
                          </span>
                          {item.extractedText && (
                            <span className="text-[9px] font-black text-emerald-500 block mt-0.5">
                              ✔️ تم الاستخراج
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Image Preview & Image Enhancement Bar */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      معاينة ومعالجة الصورة:
                    </span>
                    {activeItem && (
                      <span className="text-[10px] text-amber-500 font-bold truncate max-w-[150px]">
                        {activeItem.name}
                      </span>
                    )}
                  </div>

                  {activeItem ? (
                    <div className="space-y-3">
                      {/* Image Enhancer Toolbar */}
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRotateActiveItem(-90)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition"
                            title="تدوير 90 درجة لليسار"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRotateActiveItem(90)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition"
                            title="تدوير 90 درجة لليمين"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowZoomModal(true)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition"
                            title="تكبير الصورة"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Filter presets */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApplyFilter("normal")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              activeItem.filter === "normal" || !activeItem.filter
                                ? "bg-amber-500 text-slate-950"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            أصل
                          </button>
                          <button
                            onClick={() => handleApplyFilter("bw")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              activeItem.filter === "bw"
                                ? "bg-amber-500 text-slate-950"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            }`}
                            title="تباين عالي للأوراق القديمة والميكروفيلم"
                          >
                            تباين B&W
                          </button>
                          <button
                            onClick={() => handleApplyFilter("grayscale")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              activeItem.filter === "grayscale"
                                ? "bg-amber-500 text-slate-950"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            رمادي
                          </button>
                        </div>
                      </div>

                      {/* Image Box */}
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center min-h-[380px]">
                        <img
                          src={activeItem.previewUrl}
                          alt={activeItem.name}
                          style={{ filter: getFilterStyle(activeItem.filter) }}
                          className="max-h-[460px] w-auto object-contain transition-all duration-300"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400">حدد مستنداً من القائمة</div>
                  )}
                </div>

                {/* Extracted Text & Synthesis Panel */}
                <div className="lg:col-span-5 space-y-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  {/* Top Bar inside panel */}
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <span className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>النصوص المستخرجة والصياغة القضائية:</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Search in Text Toggle */}
                      <button
                        onClick={() => setShowSearchReplace(!showSearchReplace)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                          showSearchReplace
                            ? "bg-amber-500 text-slate-950"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                        title="البحث والاستبدال داخل النص المستخرج"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>

                      {/* TTS Audio Player */}
                      {isPlayingAudio ? (
                        <button
                          onClick={handleStopTTS}
                          className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer animate-pulse"
                          title="إيقاف القراءة الصوتية"
                        >
                          <VolumeX className="w-3 h-3" />
                          <span>إيقاف</span>
                        </button>
                      ) : (
                        <button
                          onClick={handlePlayTTS}
                          disabled={!extractedOverallText && !aiDraftedText}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="استماع للنص بصوت عربي فصيح"
                        >
                          <Volume2 className="w-3 h-3 text-amber-500" />
                          <span>استماع</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleCopyText(aiDraftedText || extractedOverallText)}
                        disabled={!extractedOverallText && !aiDraftedText}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="نسخ النصوص المستخرجة"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? "تم النسخ!" : "نسخ"}</span>
                      </button>

                      {/* Print Preview Button */}
                      <button
                        onClick={() => setShowPrintModal(true)}
                        disabled={!extractedOverallText && !aiDraftedText}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="معاينة الطباعة القضائية الرسمية"
                      >
                        <Printer className="w-3 h-3" />
                        <span>طباعة</span>
                      </button>

                      {onOpenInEditor && (
                        <button
                          onClick={() =>
                            onOpenInEditor(
                              aiDraftedText || extractedOverallText,
                              `مستند مستخرج - ${detectedEntities.caseNumber ? "قضية " + detectedEntities.caseNumber : "فحص ضوئي"}`,
                              detectedEntities.clientName,
                              detectedEntities.caseNumber
                            )
                          }
                          disabled={!extractedOverallText && !aiDraftedText}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer shadow-xs"
                          title="فتح النص في محرر المستندات المتطور للصياغة والطباعة"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>بالمحرر</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search & Replace Floating Bar */}
                  {showSearchReplace && (
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-300 dark:border-slate-700 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="ابحث عن كلمة أو اسم أو رقم..."
                          className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none"
                        />
                        {matchCount > 0 && (
                          <span className="text-[10px] font-bold text-amber-500 font-mono">
                            {matchCount} مطابق
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={replaceQuery}
                          onChange={(e) => setReplaceQuery(e.target.value)}
                          placeholder="استبدال بـ..."
                          className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none"
                        />
                        <button
                          onClick={() => handleExecuteReplace(false)}
                          disabled={!searchQuery}
                          className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-50"
                        >
                          استبدال
                        </button>
                        <button
                          onClick={() => handleExecuteReplace(true)}
                          disabled={!searchQuery}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[11px] font-black cursor-pointer disabled:opacity-50"
                        >
                          الكل
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI Synthesis Actions Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleGenerateAiDraft("brief")}
                      disabled={!extractedOverallText || isAiDrafting}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>توليد مذكرة دفاع</span>
                    </button>

                    <button
                      onClick={() => handleGenerateAiDraft("summary")}
                      disabled={!extractedOverallText || isAiDrafting}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>تلخيص الوقائع</span>
                    </button>

                    <button
                      onClick={() => handleDeepEntityExtraction(extractedOverallText)}
                      disabled={!extractedOverallText || isParsingEntities}
                      className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="استخراج الأطراف وأرقام القضايا والمحاكم تلقائياً"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isParsingEntities ? "جارٍ التحليل..." : "تحليل الأطراف"}</span>
                    </button>

                    {/* Save to Google Keep */}
                    <button
                      onClick={handleSaveToKeepNotes}
                      disabled={!extractedOverallText && !aiDraftedText}
                      className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500 text-amber-600 hover:text-slate-950 dark:text-amber-400 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="حفظ النص المستخرج والمذكرات في Google Keep"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Keep</span>
                    </button>

                    {/* Export to Google Drive */}
                    <button
                      onClick={handleExportToGoogleDrive}
                      disabled={!extractedOverallText && !aiDraftedText}
                      className="px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500 text-blue-600 hover:text-white dark:text-blue-400 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="تصدير وحفظ المستند مباشرة في Google Drive"
                    >
                      <CloudDownload className="w-3.5 h-3.5" />
                      <span>Drive</span>
                    </button>

                    {/* Download as TXT */}
                    <button
                      onClick={() => {
                        const text = aiDraftedText || extractedOverallText;
                        if (!text) return;
                        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `OCR-Extracted-${new Date().toISOString().slice(0, 10)}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      disabled={!extractedOverallText && !aiDraftedText}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="تحميل النص كملف نصي على جهازك"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل TXT</span>
                    </button>
                  </div>

                  {isAiDrafting && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center text-amber-500 text-xs font-black animate-pulse">
                      جارٍ صياغة المذكرة والتحليل القانوني بواسطة الذكاء الاصطناعي...
                    </div>
                  )}

                  {/* Extracted Text Content Box */}
                  <textarea
                    rows={12}
                    value={aiDraftedText || extractedOverallText}
                    onChange={(e) => {
                      if (aiDraftedText) setAiDraftedText(e.target.value);
                      else setExtractedOverallText(e.target.value);
                    }}
                    placeholder="اضغط 'بدء الفحص واستخراج النصوص' لاستخراج النصوص من كافة الصور المرفوعة تلقائياً..."
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs leading-relaxed outline-none focus:border-amber-500 font-sans resize-y transition shadow-inner"
                  />
                </div>
              </div>

              {/* 5. DEDICATED AUTO-CREATION & DEDUPLICATION LINKING HUB */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 rounded-3xl border border-amber-500/30 shadow-xl text-white space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                      <Link className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                        <span>منظومة الربط التلقائي ومنع تكرار البيانات (Smart Auto-Link Hub)</span>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full font-extrabold">
                          3-WAY SYNC
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        استخراج أسماء الموكلين الجدد تلقائياً، إنشاء ملفات القضايا، وربط الأقسام الثلاثة مع فحص التكرار
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAutoProvisionAndLinkAll}
                    disabled={!detectedEntities.clientName && !detectedEntities.caseNumber}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-40"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>إضافة الموكل والقضية وربطهما بالمحرر فوراً</span>
                  </button>
                </div>

                {/* Editable Extracted Entities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Field 1: Client Name */}
                  <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>اسم الموكل المستخرج:</span>
                      </label>
                      {existingClientMatch ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          مسجل مسبقاً
                        </span>
                      ) : detectedEntities.clientName ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          جديد
                        </span>
                      ) : null}
                    </div>
                    <input
                      type="text"
                      value={detectedEntities.clientName}
                      onChange={(e) => setDetectedEntities((prev) => ({ ...prev, clientName: e.target.value }))}
                      placeholder="مثال: أحمد مصطفى إبراهيم"
                      className="w-full p-2 bg-slate-900 text-white rounded-xl border border-slate-700 font-bold outline-none focus:border-amber-500 text-xs"
                    />

                    <button
                      onClick={handleAutoCreateClient}
                      disabled={!detectedEntities.clientName}
                      className={`w-full py-1.5 rounded-lg text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                        existingClientMatch
                          ? "bg-slate-800 text-amber-400 hover:bg-slate-700"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{existingClientMatch ? "تأكيد ربط الموكل المسجل" : "إضافة الموكل في السجل"}</span>
                    </button>
                  </div>

                  {/* Field 2: Opponent Name */}
                  <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <span>اسم الخصم / المعلن إليه:</span>
                      </label>
                      {existingOpponentMatch ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          مسجل مسبقاً
                        </span>
                      ) : detectedEntities.opponentName ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          خصم جديد
                        </span>
                      ) : null}
                    </div>
                    <input
                      type="text"
                      value={detectedEntities.opponentName}
                      onChange={(e) => setDetectedEntities((prev) => ({ ...prev, opponentName: e.target.value }))}
                      placeholder="مثال: شركة المقاولات الحديثة"
                      className="w-full p-2 bg-slate-900 text-white rounded-xl border border-slate-700 font-bold outline-none focus:border-amber-500 text-xs"
                    />
                    <div className="text-[10px] text-slate-400 pt-1 pb-1">
                      الرقم القومي / الهاتف: <span className="font-mono text-amber-400">{detectedEntities.nationalId || detectedEntities.phone || "غير محدد"}</span>
                    </div>

                    <button
                      onClick={handleAutoCreateOpponent}
                      disabled={!detectedEntities.opponentName}
                      className={`w-full py-1.5 rounded-lg text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                        existingOpponentMatch
                          ? "bg-slate-800 text-purple-400 hover:bg-slate-700"
                          : "bg-purple-600 hover:bg-purple-500 text-white"
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{existingOpponentMatch ? "تأكيد ربط الخصم المسجل" : "إضافة الخصم في السجل"}</span>
                    </button>
                  </div>

                  {/* Field 3: Case Number & Year */}
                  <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-amber-400" />
                        <span>رقم وسنة القضية:</span>
                      </label>
                      {existingCaseMatch ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          مقيدة مسبقاً
                        </span>
                      ) : detectedEntities.caseNumber ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          قضية جديدة
                        </span>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={detectedEntities.caseNumber}
                        onChange={(e) => setDetectedEntities((prev) => ({ ...prev, caseNumber: e.target.value }))}
                        placeholder="رقم الدعوى"
                        className="p-2 bg-slate-900 text-white rounded-xl border border-slate-700 font-bold text-center outline-none focus:border-amber-500 text-xs font-mono"
                      />
                      <input
                        type="text"
                        value={detectedEntities.caseYear}
                        onChange={(e) => setDetectedEntities((prev) => ({ ...prev, caseYear: e.target.value }))}
                        placeholder="السنة"
                        className="p-2 bg-slate-900 text-white rounded-xl border border-slate-700 font-bold text-center outline-none focus:border-amber-500 text-xs font-mono"
                      />
                    </div>

                    <button
                      onClick={handleAutoCreateCase}
                      disabled={!detectedEntities.caseNumber}
                      className={`w-full py-1.5 rounded-lg text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                        existingCaseMatch
                          ? "bg-slate-800 text-amber-400 hover:bg-slate-700"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>{existingCaseMatch ? "تأكيد ربط ملف القضية" : "إنشاء وقيد ملف القضية"}</span>
                    </button>
                  </div>

                  {/* Field 4: Court & Subject */}
                  <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <span>المحكمة وموضوع الدعوى:</span>
                    </label>
                    <input
                      type="text"
                      value={detectedEntities.competentCourt}
                      onChange={(e) => setDetectedEntities((prev) => ({ ...prev, competentCourt: e.target.value }))}
                      placeholder="المحكمة المختصة"
                      className="w-full p-2 bg-slate-900 text-white rounded-xl border border-slate-700 font-bold outline-none focus:border-amber-500 text-xs"
                    />
                    <input
                      type="text"
                      value={detectedEntities.subject}
                      onChange={(e) => setDetectedEntities((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="موضوع الدعوى"
                      className="w-full p-2 bg-slate-900 text-white rounded-xl border border-slate-700 font-bold outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>

                {/* Quick Navigation footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      نظام التدقيق ومنع التكرار يعمل تلقائياً لمنع إضافة نفس الموكل أو القضية بأكثر من سجل.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onNavigate && (
                      <>
                        <button
                          onClick={() => onNavigate("clients")}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition font-bold"
                        >
                          سجل الموكلين ➔
                        </button>
                        <button
                          onClick={() => onNavigate("cases")}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition font-bold"
                        >
                          ديوان القضايا ➔
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LEGAL FLAWS & DEFENSE INTELLIGENCE */}
      {activeTab === "flaws" && (
        <OcrLegalFlawsAnalysis
          extractedText={aiDraftedText || extractedOverallText}
          onOpenInEditor={(txt, title) => onOpenInEditor?.(txt, title, detectedEntities.clientName, detectedEntities.caseNumber)}
        />
      )}

      {/* TAB 3: CONTRACT CLAUSES & RISK AUDIT */}
      {activeTab === "clauses" && (
        <OcrContractClausesAnalysis
          extractedText={aiDraftedText || extractedOverallText}
          onOpenInEditor={(txt, title) => onOpenInEditor?.(txt, title, detectedEntities.clientName, detectedEntities.caseNumber)}
        />
      )}

      {/* TAB 4: CERTIFIED JUDICIAL TRANSLATION */}
      {activeTab === "translate" && (
        <OcrTranslationHub
          extractedText={aiDraftedText || extractedOverallText}
          onOpenInEditor={(txt, title) => onOpenInEditor?.(txt, title, detectedEntities.clientName, detectedEntities.caseNumber)}
        />
      )}

      {/* TAB 5: DOCUMENT COMPARATOR & DIFF */}
      {activeTab === "compare" && (
        <OcrDocumentComparator
          currentExtractedText={aiDraftedText || extractedOverallText}
          onOpenInEditor={(txt, title) => onOpenInEditor?.(txt, title, detectedEntities.clientName, detectedEntities.caseNumber)}
        />
      )}

      {/* CAMERA SCANNER MODAL */}
      <OcrCameraScannerModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleAddCameraSnapshot}
      />

      {/* PRINT PREVIEW MODAL */}
      <OcrPrintPreviewModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        text={aiDraftedText || extractedOverallText}
        currentUser={currentUser}
        caseNumber={detectedEntities.caseNumber}
        caseYear={detectedEntities.caseYear}
        courtName={detectedEntities.competentCourt}
        clientName={detectedEntities.clientName}
        opponentName={detectedEntities.opponentName}
        documentTitle={`محرر قضائي مستخرج - ${detectedEntities.subject || "فحص ضوئي"}`}
      />

      {/* IMAGE ZOOM MODAL */}
      {showZoomModal && activeItem && (
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowZoomModal(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-auto rounded-2xl bg-black p-2 flex flex-col items-center">
            <button
              onClick={() => setShowZoomModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-800 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeItem.previewUrl}
              alt={activeItem.name}
              style={{ filter: getFilterStyle(activeItem.filter) }}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <p className="text-xs text-slate-400 mt-2">{activeItem.name}</p>
          </div>
        </div>
      )}

      {/* GOOGLE DRIVE EXPLORER MODAL */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                  <CloudDownload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    مستكشف ملفات Google Drive القانوني
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    اختر أي مستند أو صورة قضائية لاستيرادها وفحصها مباشرة
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDriveModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Search and Refresh */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
              <input
                type="text"
                value={driveSearchQuery}
                onChange={(e) => setDriveSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleOpenGoogleDriveModal()}
                placeholder="ابحث في ملفات Drive (اسم العقد، رقم القضية، اسم الموكل)..."
                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500"
              />
              <button
                onClick={handleOpenGoogleDriveModal}
                disabled={isLoadingDrive}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? "animate-spin" : ""}`} />
                <span>تحديث</span>
              </button>
            </div>

            {/* Files List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {isLoadingDrive ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span>جاري الاتصال بـ Google Drive وجلب المستندات...</span>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  لم يتم العثور على ملفات أو صور متوافقة في Google Drive
                </div>
              ) : (
                driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-500/10 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer"
                    onClick={() => handleImportDriveFile(file)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          {file.size && <span>{file.size}</span>}
                          {file.modifiedTime && <span>{new Date(file.modifiedTime).toLocaleDateString("ar-EG")}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImportDriveFile(file);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex-shrink-0"
                    >
                      استيراد للفحص
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
              <span>Google Drive API v3 - مصرح عبر بروتوكول OAuth 2.0</span>
              <button
                onClick={() => setShowDriveModal(false)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
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
