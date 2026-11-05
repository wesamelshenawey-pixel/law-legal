import React, { useState, useMemo } from "react";
import { cropTo3x4Portrait } from "../utils/imageUtils";
import { 
  LegalTemplate, 
  ClientProfile, 
  CaseRecord, 
  PlatformUser 
} from "../types";
import { INITIAL_LEGAL_TEMPLATES } from "../data/legalTemplatesData";
import { getClientRoleLabel } from "../utils/translations";
import UrfiMarriageContractStudio from "./UrfiMarriageContractStudio";
import { 
  BookOpen, 
  FileText, 
  Scale, 
  Sparkles, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Send, 
  Search, 
  Filter, 
  User, 
  FolderPlus, 
  Edit3, 
  Plus, 
  Trash2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  Heart,
  Eye,
  PenTool,
  Columns,
  Camera,
  ArrowLeftRight,
  Image as ImageIcon
} from "lucide-react";

interface LegalTemplatesViewProps {
  clients: ClientProfile[];
  cases: CaseRecord[];
  currentUser: PlatformUser;
  onSaveToCaseAttachments?: (caseId: string, docName: string, content: string) => void;
  onOpenInEditor?: (text: string, title: string, clientName?: string, caseNumber?: string) => void;
  language?: "ar" | "en";
}

export default function LegalTemplatesView({
  clients,
  cases,
  currentUser,
  onSaveToCaseAttachments,
  onOpenInEditor,
  language = "ar"
}: LegalTemplatesViewProps) {
  // Templates state
  const [templates, setTemplates] = useState<LegalTemplate[]>(() => {
    const saved = localStorage.getItem("law_custom_templates");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...INITIAL_LEGAL_TEMPLATES, ...parsed];
      } catch (e) {
        return INITIAL_LEGAL_TEMPLATES;
      }
    }
    return INITIAL_LEGAL_TEMPLATES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplate | null>(templates[0] || null);
  const [isUrfiStudioActive, setIsUrfiStudioActive] = useState(false);
  const [showSidePreview, setShowSidePreview] = useState(true);

  // Dynamic Merge / Autofill States
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  
  // Custom Overrides for fields
  const [clientRoleOverride, setClientRoleOverride] = useState("طالب / مدعي");
  const [opponentRoleOverride, setOpponentRoleOverride] = useState("معلن إليه / مدعى عليه");
  const [courtCircuitOverride, setCourtCircuitOverride] = useState("الدائرة الأولى مدني / جنح");
  const [customLawyerName, setCustomLawyerName] = useState("الأستاذ المحامي");
  const [customLawyerTitle, setCustomLawyerTitle] = useState("المحامي بالنقض والدستورية العليا");

  // Husband & Wife Personal Photos (Top Right: Husband | Top Left: Wife)
  const [husbandPhoto, setHusbandPhoto] = useState<string>("");
  const [wifePhoto, setWifePhoto] = useState<string>("");

  // Editable output text
  const [renderedText, setRenderedText] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedToCase, setIsSavedToCase] = useState(false);

  // Photo Handlers
  const handleHusbandPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await cropTo3x4Portrait(file);
        setHusbandPhoto(base64);
      } catch (err) {
        console.error("Failed to crop husband photo", err);
      }
    }
  };

  const handleWifePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await cropTo3x4Portrait(file);
        setWifePhoto(base64);
      } catch (err) {
        console.error("Failed to crop wife photo", err);
      }
    }
  };

  const handleMultiplePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files[0]) {
        try {
          const base64 = await cropTo3x4Portrait(files[0]);
          setHusbandPhoto(base64);
        } catch (err) {
          console.error("Failed to crop husband photo", err);
        }
      }
      if (files[1]) {
        try {
          const base64 = await cropTo3x4Portrait(files[1]);
          setWifePhoto(base64);
        } catch (err) {
          console.error("Failed to crop wife photo", err);
        }
      }
    }
  };

  const handleSwapPhotos = () => {
    const temp = husbandPhoto;
    setHusbandPhoto(wifePhoto);
    setWifePhoto(temp);
  };

  const handleClearPhotos = () => {
    setHusbandPhoto("");
    setWifePhoto("");
  };

  // New Template Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<LegalTemplate["category"]>("defense_memo");
  const [newDescription, setNewDescription] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");

  // Categories list
  const categories = [
    { id: "all", label: "جميع القوالب القانونية", icon: "📚", count: templates.length },
    { id: "defense_memo", label: "مذكرات دفاع وطعون", icon: "⚖️", count: templates.filter(t => t.category === "defense_memo" || t.category === "appeal").length },
    { id: "claim_statement", label: "صحف دعاوى وإنذارات", icon: "📜", count: templates.filter(t => t.category === "claim_statement" || t.category === "notice").length },
    { id: "contract", label: "عقود واتفاقيات رسمية", icon: "📑", count: templates.filter(t => t.category === "contract" || t.category === "poa_agreement").length },
  ];

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(tmpl => {
      const matchCat = selectedCategory === "all" || 
        (selectedCategory === "defense_memo" && (tmpl.category === "defense_memo" || tmpl.category === "appeal")) ||
        (selectedCategory === "claim_statement" && (tmpl.category === "claim_statement" || tmpl.category === "notice")) ||
        (selectedCategory === "contract" && (tmpl.category === "contract" || tmpl.category === "poa_agreement")) ||
        tmpl.category === selectedCategory;

      const matchSearch = !searchQuery.trim() || 
        tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tmpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tmpl.tags.some(tg => tg.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  // Selected Client and Case Objects
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  const selectedCase = useMemo(() => {
    return cases.find(cs => cs.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  // Function to apply autofill / merge fields
  const applyAutofill = (template: LegalTemplate) => {
    let text = template.contentTemplate;
    const today = new Date().toLocaleDateString("ar-EG");

    // Client Info
    const cName = selectedClient?.name || (selectedCase?.clientName || "................................................");
    const cNationalId = selectedClient?.nationalId || "..............................";
    const cPhone = selectedClient?.phone || selectedClient?.whatsapp || "..............................";
    const cAddress = selectedClient?.address || "........................................................";
    const poaNum = selectedClient?.poaNumber || "...........";
    const poaLetter = selectedClient?.poaLetter || "أ";
    const poaYear = selectedClient?.poaYear ? String(selectedClient.poaYear) : "2026";
    const poaOff = selectedClient?.poaOffice || "مكتب توثيق قصر النيل";

    // Case & Opponent Info
    const oppName = selectedCase?.opponentName || "................................................";
    const oppAddress = "........................................................";
    const caseNum = selectedCase?.caseNumber || "..........";
    const caseYr = selectedCase?.caseYear ? String(selectedCase.caseYear) : "2026";
    const court = selectedCase?.competentCourt || template.defaultCourtType || "محكمة جنوب القاهرة الابتدائية";
    const subj = selectedCase?.subject || "دعوى ومطالبة قضائية";
    const sessDate = selectedCase?.nextSessionDate 
      ? new Date(selectedCase.nextSessionDate).toLocaleDateString("ar-EG")      : ".... / .... / ........";    text = text
    text = text
      .replace(/{{CLIENT_NAME}}/g, cName)
      .replace(/{{اسم_الموكل}}/g, cName)
      .replace(/{{CLIENT_ROLE}}/g, clientRoleOverride)
      .replace(/{{صفة_الموكل}}/g, clientRoleOverride)
      .replace(/{{CLIENT_NATIONAL_ID}}/g, cNationalId)
      .replace(/{{الرقم_القومي}}/g, cNationalId)
      .replace(/{{CLIENT_PHONE}}/g, cPhone)
      .replace(/{{رقم_الهاتف}}/g, cPhone)
      .replace(/{{CLIENT_ADDRESS}}/g, cAddress)
      .replace(/{{عنوان_الموكل}}/g, cAddress)
      .replace(/{{POA_NUMBER}}/g, poaNum)
      .replace(/{{رقم_التوكيل}}/g, poaNum)
      .replace(/{{POA_LETTER}}/g, poaLetter)
      .replace(/{{حرف_التوكيل}}/g, poaLetter)
      .replace(/{{POA_YEAR}}/g, poaYear)
      .replace(/{{سنة_التوكيل}}/g, poaYear)
      .replace(/{{POA_OFFICE}}/g, poaOff)
      .replace(/{{مكتب_التوثيق}}/g, poaOff)
      .replace(/{{OPPONENT_NAME}}/g, oppName)
      .replace(/{{اسم_الخصم}}/g, oppName)
      .replace(/{{OPPONENT_ROLE}}/g, opponentRoleOverride)
      .replace(/{{صفة_الخصم}}/g, opponentRoleOverride)
      .replace(/{{OPPONENT_ADDRESS}}/g, oppAddress)
      .replace(/{{عنوان_الخصم}}/g, oppAddress)
      .replace(/{{CASE_NUMBER}}/g, caseNum)
      .replace(/{{رقم_القضية}}/g, caseNum)
      .replace(/{{CASE_YEAR}}/g, caseYr)
      .replace(/{{سنة_القضية}}/g, caseYr)
      .replace(/{{COURT_NAME}}/g, court)
      .replace(/{{اسم_المحكمة}}/g, court)
      .replace(/{{CIRCUIT}}/g, courtCircuitOverride)
      .replace(/{{الدائرة}}/g, courtCircuitOverride)
      .replace(/{{SUBJECT}}/g, subj)
      .replace(/{{موضوع_الدعوى}}/g, subj)
      .replace(/{{SESSION_DATE}}/g, sessDate)
      .replace(/{{تاريخ_الجلسة}}/g, sessDate)
      .replace(/{{LAWYER_NAME}}/g, customLawyerName)
      .replace(/{{اسم_المحامي}}/g, customLawyerName)
      .replace(/{{LAWYER_TITLE}}/g, customLawyerTitle)
      .replace(/{{صفة_المحامي}}/g, customLawyerTitle)
      .replace(/{{TODAY_DATE}}/g, today)
      .replace(/{{تاريخ_اليوم}}/g, today)
      .replace(/{{CLIENT_REPRESENTATION}}/g, getClientRoleLabel(clientRoleOverride || selectedCase?.clientRole, selectedCase, language))
      .replace(/{{وكيل_الموكل}}/g, getClientRoleLabel(clientRoleOverride || selectedCase?.clientRole, selectedCase, language))
      .replace(/وكيل الموكل/g, getClientRoleLabel(clientRoleOverride || selectedCase?.clientRole, selectedCase, language))
      .replace(/وكيل_الموكل/g, getClientRoleLabel(clientRoleOverride || selectedCase?.clientRole, selectedCase, language));

    setRenderedText(text);
  };

  // When selected template changes, re-render
  React.useEffect(() => {
    if (selectedTemplate) {
      applyAutofill(selectedTemplate);
      setIsSavedToCase(false);
    }
  }, [selectedTemplate, selectedClient, selectedCase, clientRoleOverride, opponentRoleOverride, courtCircuitOverride, customLawyerName]);

  // When a client is selected, try to auto-select their case if any
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client && client.name) {
      const matchCase = cases.find(cs => cs.clientName === client.name);
      if (matchCase) {
        setSelectedCaseId(matchCase.id);
      }
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(renderedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Print Document
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const hasPhotos = !!(husbandPhoto || wifePhoto);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>${selectedTemplate?.title || "مستند قانوني"}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: 'Amiri', 'Traditional Arabic', 'Cairo', Arial, sans-serif;
            font-size: 13.5pt;
            line-height: 1.8;
            color: #111;
            padding: 15px;
            direction: rtl;
          }
          .header {
            position: relative;
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
            min-height: ${hasPhotos ? "120px" : "auto"};
          }
          .photo-husband {
            float: right;
            width: 85px;
            text-align: center;
            border: 2px solid #1e3a8a;
            padding: 2px;
            border-radius: 6px;
            margin-left: 15px;
            background: #f8fafc;
          }
          .photo-wife {
            float: left;
            width: 85px;
            text-align: center;
            border: 2px solid #9f1239;
            padding: 2px;
            border-radius: 6px;
            margin-right: 15px;
            background: #fdf2f8;
          }
          .photo-img {
            width: 100%;
            height: 100px;
            object-fit: cover;
            border-radius: 4px;
            display: block;
          }
          .photo-label {
            font-size: 7.5pt;
            font-weight: bold;
            padding: 2px 0;
            color: #fff;
            margin-top: 2px;
            border-radius: 2px;
          }
          .label-husband { background: #1e3a8a; }
          .label-wife { background: #9f1239; }
          .header h1 { margin: 0 0 5px 0; font-size: 16pt; font-weight: bold; }
          .header p { margin: 0; font-size: 10.5pt; color: #444; }
          .clear { clear: both; }
          .content { white-space: pre-wrap; word-break: break-word; text-align: justify; }
          .footer {
            margin-top: 35px;
            text-align: left;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${husbandPhoto ? `
            <div class="photo-husband">
              <img src="${husbandPhoto}" class="photo-img" alt="صورة الزوج" />
              <div class="photo-label label-husband">الطرف الأول (الزوج)</div>
            </div>
          ` : ''}
          ${wifePhoto ? `
            <div class="photo-wife">
              <img src="${wifePhoto}" class="photo-img" alt="صورة الزوجة" />
              <div class="photo-label label-wife">الطرف الثاني (الزوجة)</div>
            </div>
          ` : ''}
          <div>
            <h1>${customLawyerName || "ديوان المحاماة والاستشارات القانونية"}</h1>
            <p>${customLawyerTitle || "المحامي بالنقض والدستورية العليا"}</p>
            ${selectedTemplate?.id === "contract-urfi-marriage" ? `<p style="font-weight: bold; margin-top: 4px; font-size: 11pt; color: #78350f;">عـقـد زواج عـرفـي شـرعـي مـوثـق</p>` : ''}
          </div>
          <div class="clear"></div>
        </div>
        <div class="content">${renderedText}</div>
        <div class="footer">
          <p>ختم وتوقيع الديوان: ................................</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export to Word (.doc)
  const handleExportWord = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
      "xmlns:w='urn:schemas-microsoft-com:office:word' "+
      "xmlns='http://www.w3.org/TR/REC-html40'>"+
      "<head><meta charset='utf-8'><title>Document</title></head><body dir='rtl' style=\"font-family: 'Traditional Arabic', Arial; font-size: 14pt; line-height: 1.8;\">";
    const footer = "</body></html>";
    
    let headerHTML = `<div style="text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;"><h2>${customLawyerName || "ديوان المحاماة والاستشارات القانونية"}</h2><p>${customLawyerTitle || "الأستاذ المحامي - محامٍ بالنقض والدستورية العليا"}</p></div>`;

    if (husbandPhoto || wifePhoto) {
      headerHTML = `
        <table style="width: 100%; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
          <tr>
            <td style="width: 100px; text-align: center; vertical-align: top;">
              ${husbandPhoto ? `<img src="${husbandPhoto}" width="90" height="115" style="border: 2px solid #1e3a8a;" /><div style="font-size: 9pt; font-weight: bold; background: #1e3a8a; color: white;">صورة الزوج</div>` : ''}
            </td>
            <td style="text-align: center; vertical-align: middle;">
              <h2>${customLawyerName || "ديوان المحاماة والاستشارات القانونية"}</h2>
              <p>${customLawyerTitle || "الأستاذ المحامي - محامٍ بالنقض والدستورية العليا"}</p>
              ${selectedTemplate?.id === "contract-urfi-marriage" ? `<p style="font-weight: bold; color: #78350f;">عـقـد زواج عـرفـي شـرعـي مـوثـق</p>` : ''}
            </td>
            <td style="width: 100px; text-align: center; vertical-align: top;">
              ${wifePhoto ? `<img src="${wifePhoto}" width="90" height="115" style="border: 2px solid #9f1239;" /><div style="font-size: 9pt; font-weight: bold; background: #9f1239; color: white;">صورة الزوجة</div>` : ''}
            </td>
          </tr>
        </table>
      `;
    }

    const sourceHTML = header + headerHTML + `<pre style="white-space: pre-wrap; font-family: inherit; font-size: 13pt;">` + renderedText + "</pre>" + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${selectedTemplate?.title.replace(/[\/\\?%*:|"<>]/g, "-") || "مستند_قانوني"}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  // Save as Case Attachment
  const handleSaveToCase = () => {
    if (!selectedCaseId) {
      alert("يرجى اختيار القضية أولاً لحفظ القالب في ملف مرفقاتها.");
      return;
    }

    if (onSaveToCaseAttachments && selectedTemplate) {
      onSaveToCaseAttachments(selectedCaseId, selectedTemplate.title, renderedText);
      setIsSavedToCase(true);
      setTimeout(() => setIsSavedToCase(false), 3000);
    } else {
      // Local fallback
      const savedDocs = JSON.parse(localStorage.getItem("law_managed_documents") || "[]");
      const newDoc = {
        id: "doc-" + Date.now(),
        name: selectedTemplate?.title || "مستند قانوني معبأ",
        type: "word",
        section: "cases",
        sectionLabel: "ملفات القضايا",
        fileBase64: renderedText,
        addedAt: new Date().toISOString(),
        caseId: selectedCaseId
      };
      localStorage.setItem("law_managed_documents", JSON.stringify([newDoc, ...savedDocs]));
      setIsSavedToCase(true);
      setTimeout(() => setIsSavedToCase(false), 3000);
    }
  };

  // Send to Client on WhatsApp
  const handleSendToWhatsApp = () => {
    const phone = selectedClient?.phone || selectedClient?.whatsapp;
    if (!phone) {
      alert("الموكل المختار ليس لديه رقم هاتف مسجل. يمكنك نسخ النص وإرساله يدوياً.");
      return;
    }

    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "20" + cleanPhone.substring(1);
    else if (!cleanPhone.startsWith("20") && cleanPhone.length === 10) cleanPhone = "20" + cleanPhone;

    const message = `🏛️ *ديوان المحاماة والاستشارات القانونية*\n⚖️ *الأستاذ المحامي*\n----------------------------------------\nعناية الموكل الفاضل / *${selectedClient?.name}* المحترم،\nمرفق لسيادتكم صيغة مسودة: *${selectedTemplate?.title}*\n\n${renderedText.substring(0, 1500)}${renderedText.length > 1500 ? "\n\n...(باقي نص المذكرة تم إدراجه بالسجل القضائي)..." : ""}\n\nتحياتنا وتقديرنا،،`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Add custom template handler
  const handleSaveNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert("يرجى ملء عنوان القالب والمحتوى القانوني.");
      return;
    }

    const newTmpl: LegalTemplate = {
      id: "custom-tmpl-" + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      categoryArabic: newCategory === "defense_memo" ? "مذكرات دفاع وطعون" : newCategory === "claim_statement" ? "صحف دعاوى وإنذارات" : "عقود واتفاقيات",
      description: newDescription.trim() || "قالب قانوني مخصص مضاف من المحامي",
      badge: "قالب مخصص",
      tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
      contentTemplate: newContent
    };

    const updated = [newTmpl, ...templates];
    setTemplates(updated);

    // Save custom templates in storage
    const customOnly = updated.filter(t => t.id.startsWith("custom-tmpl-"));
    localStorage.setItem("law_custom_templates", JSON.stringify(customOnly));

    setSelectedTemplate(newTmpl);
    setShowAddModal(false);
    setNewTitle("");
    setNewDescription("");
    setNewContent("");
    setNewTags("");
  };

  if (isUrfiStudioActive) {
    return (
      <UrfiMarriageContractStudio
        clients={clients}
        cases={cases}
        currentUser={currentUser}
        onBack={() => setIsUrfiStudioActive(false)}
        onSaveToCaseAttachments={onSaveToCaseAttachments}
        language={language}
      />
    );
  }

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* 1. Header Toolbar with Extracted Add Template Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
              مكتبة القوالب القانونية والعقود الجاهزة
            </h1>
            <p className="text-xs text-slate-500">صياغة وتعبئة العقود والمذكرات مع خاصية التوقيع الإلكتروني والمعاينة الحية</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct Studio Launcher Button */}
          <button
            onClick={() => setIsUrfiStudioActive(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-current" />
            <span>💍 استوديو عقد الزواج العرفي الموثق</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قالب قانوني جديد</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`p-3 rounded-2xl border text-right transition flex items-center justify-between cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{cat.icon}</span>
              <span className="text-xs font-bold">{cat.label}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              selectedCategory === cat.id ? "bg-slate-950/20 text-slate-950 font-black" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* 2. Main Workspace (Split Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Templates List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Search Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن صيغة قالب أو نوع دعوى..."
                className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Templates Cards List */}
          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredTemplates.map((tmpl) => {
              const isSelected = selectedTemplate?.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition text-right ${
                    isSelected
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 shadow-md ring-2 ring-amber-500/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      tmpl.category === "defense_memo" || tmpl.category === "appeal"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                        : tmpl.category === "claim_statement" || tmpl.category === "notice"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                    }`}>
                      {tmpl.badge || tmpl.categoryArabic}
                    </span>
                    {isSelected && <span className="text-xs text-amber-600 font-bold">نشط الآن ✦</span>}
                  </div>

                  <h3 className="text-xs font-black text-slate-900 dark:text-white mt-1.5 leading-snug">
                    {tmpl.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {tmpl.description}
                  </p>

                  <div className="flex items-center gap-1 flex-wrap mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {tmpl.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[9.5px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Dynamic Autofill Controls & Live Template Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* 1. Dynamic Client & Case Merger Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>محرك التعبئة والتوليد الديناميكي (Dynamic Field Injection)</span>
              </div>
              <span className="text-[11px] text-slate-500">اختر الموكل والقضية ليتم ملء الصياغة تلقائياً</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              
              {/* Select Client */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  1. الموكل المسجل:
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                >
                  <option value="">-- بدون تحديد (حقول فارغة) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Case */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2. القضية المرتبطة:
                </label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                >
                  <option value="">-- اختر القضية للربط --</option>
                  {cases.map(cs => (
                    <option key={cs.id} value={cs.id}>
                      قضية {cs.caseNumber}/{cs.caseYear} - {cs.competentCourt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Role */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  3. صفة الموكل في الدعوى:
                </label>
                <select
                  value={clientRoleOverride}
                  onChange={(e) => setClientRoleOverride(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                >
                  <option value="المدعي / الطالب">المدعي / الطالب</option>
                  <option value="المدعى عليه / المطلوب إعلانه">المدعى عليه / المطلوب إعلانه</option>
                  <option value="المتهم">المتهم</option>
                  <option value="المستأنف / الطاعن">المستأنف / الطاعن</option>
                  <option value="المستأنف ضده / المطعون ضده">المستأنف ضده / المطعون ضده</option>
                  <option value="الطرف الأول">الطرف الأول</option>
                  <option value="الطرف الثاني">الطرف الثاني</option>
                </select>
              </div>
            </div>

            {/* Quick Details Chips */}
            {selectedClient && (
              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-2.5 rounded-xl text-[11.5px] flex flex-wrap items-center gap-3 text-amber-950 dark:text-amber-200">
                <span className="font-black">✓ بيانات الموكل المحقونة:</span>
                <span>الرقم القومي: {selectedClient.nationalId || "غير مسجل"}</span>
                <span>• الهاتف: {selectedClient.phone || selectedClient.whatsapp || "---"}</span>
                <span>• التوكيل: {selectedClient.poaNumber ? `رقم ${selectedClient.poaNumber} لسنة ${selectedClient.poaYear || "2026"}` : "---"}</span>
              </div>
            )}

            {/* Special Callout Banner for Urfi Marriage Contract Studio */}
            {selectedTemplate?.id === "contract-urfi-marriage" && (
              <div className="p-3.5 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-purple-500/10 border-2 border-rose-400/40 dark:border-rose-600/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-500 text-white rounded-xl shadow-sm">
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-rose-950 dark:text-rose-200">
                      استوديو الصياغة التفاعلي لعقد الزواج العرفي الشرعي الموثق
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      يتضمن لوحة التوقيع الإلكتروني للزوجين والشهود، إدراج صور الزوجين بالأركان، وتعبئة بيانات الموكلين بضغطة زر.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUrfiStudioActive(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <PenTool className="w-4 h-4" />
                  <span>فتح استوديو عقد الزواج والتوقيع الرقمي ✨</span>
                </button>
              </div>
            )}

            {/* Spouses Personal Photo Uploader Bar (For Urfi Marriage & Contracts) */}
            {(selectedTemplate?.id === "contract-urfi-marriage" || husbandPhoto || wifePhoto) && (
              <div className="p-3 bg-gradient-to-r from-blue-500/10 via-amber-500/10 to-rose-500/10 dark:from-blue-950/30 dark:via-amber-950/30 dark:to-rose-950/30 border border-amber-300 dark:border-amber-800/60 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
                    <Camera className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>📸 إدراج الصور الشخصية (أعلى يمين: الزوج | أعلى شمال: الزوجة)</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Upload Both Photos at Once */}
                    <label className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-[11px] font-black cursor-pointer transition shadow-xs flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>رفع صورتي الزوجين معاً دفعة واحدة</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMultiplePhotosUpload}
                        className="hidden"
                      />
                    </label>

                    {(husbandPhoto || wifePhoto) && (
                      <>
                        <button
                          type="button"
                          onClick={handleSwapPhotos}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                          title="تبديل موقع الصورتين"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500" />
                          <span>تبديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleClearPhotos}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                          title="حذف الصور"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Micro Cards for Individual Selection */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Husband Upload */}
                  <div className="flex items-center gap-2 p-2 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl">
                    <div className="w-10 h-12 rounded-lg border border-blue-400 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                      {husbandPhoto ? (
                        <img src={husbandPhoto} alt="الزوج" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[10.5px] font-black text-blue-950 dark:text-blue-200">
                        صورة الزوج (أعلى يمين)
                      </span>
                      <label className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer inline-flex items-center gap-1 mt-0.5">
                        <Camera className="w-3 h-3" />
                        <span>{husbandPhoto ? "تغيير صورة الزوج" : "اختيار صورة الزوج"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHusbandPhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Wife Upload */}
                  <div className="flex items-center gap-2 p-2 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl">
                    <div className="w-10 h-12 rounded-lg border border-rose-400 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                      {wifePhoto ? (
                        <img src={wifePhoto} alt="الزوجة" className="w-full h-full object-cover" />
                      ) : (
                        <Heart className="w-5 h-5 text-rose-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[10.5px] font-black text-rose-950 dark:text-rose-200">
                        صورة الزوجة (أعلى شمال)
                      </span>
                      <label className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer inline-flex items-center gap-1 mt-0.5">
                        <Camera className="w-3 h-3" />
                        <span>{wifePhoto ? "تغيير صورة الزوجة" : "اختيار صورة الزوجة"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleWifePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Live Document Preview & Rich Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Action Bar */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-xs">
                  {selectedTemplate?.title || "معاينة القالب القانوني"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                
                {/* Toggle Side-by-Side Live Preview */}
                <button
                  type="button"
                  onClick={() => setShowSidePreview(!showSidePreview)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    showSidePreview
                      ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                  }`}
                  title="تبديل وضع المعاينة الحية المنسقة جنباً إلى جنب"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>{showSidePreview ? "معاينة مزدوجة ✓" : "معاينة مزدوجة"}</span>
                </button>

                {/* Print */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="طباعة رسمية مروّسة"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>طباعة 🖨️</span>
                </button>

                {/* Word Export */}
                <button
                  type="button"
                  onClick={handleExportWord}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="تصدير ملف وورد (.doc)"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                  <span>Word</span>
                </button>

                {/* Save to Case Attachment */}
                <button
                  type="button"
                  onClick={handleSaveToCase}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    isSavedToCase 
                      ? "bg-emerald-600 text-white" 
                      : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200"
                  }`}
                  title="حفظ في مرفقات القضية"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>{isSavedToCase ? "✓ تم الحفظ بالقضية" : "حفظ بالقضية"}</span>
                </button>

                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleSendToWhatsApp}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="إرسال المسودة للموكل بالواتساب"
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                  <span>واتساب 💬</span>
                </button>

                {/* Copy */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? "تم النسخ" : "نسخ"}</span>
                </button>

                {/* Open in Full Editor */}
                {onOpenInEditor && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTemplate) {
                        onOpenInEditor(renderedText, selectedTemplate.title, selectedClient?.name, selectedCase?.caseNumber);
                      }
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="فتح في محرر المستندات المتطور"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>المحرر المتطور ✍️</span>
                  </button>
                )}

              </div>
            </div>

            {/* Main Editor & Live Preview Area */}
            <div className={`p-4 bg-slate-50/50 dark:bg-slate-950/40 flex-1 grid ${showSidePreview ? 'grid-cols-1 xl:grid-cols-2 gap-4' : 'grid-cols-1'}`}>
              {/* Text Area (Editing Column) */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between pb-2 text-[11px] font-bold text-slate-500">
                  <span>مساحة التحرير والتعديل المباشر:</span>
                  <span className="font-mono text-[10px] text-amber-600">يمكنك التعديل هنا مباشرة</span>
                </div>
                <textarea
                  rows={22}
                  value={renderedText}
                  onChange={(e) => setRenderedText(e.target.value)}
                  className="w-full h-full min-h-[420px] p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs leading-relaxed outline-none focus:border-amber-500 shadow-inner text-right"
                  placeholder="محتوى القالب القانوني المعبأ..."
                />
              </div>

              {/* Formatted Live Document Preview Column */}
              {showSidePreview && (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between pb-2 text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                      <span>المعاينة المباشرة المنسقة للطباعة (Live Sheet):</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                      مزامنة آنية ⚡
                    </span>
                  </div>
                  <div className="w-full h-full min-h-[420px] max-h-[550px] overflow-y-auto p-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-2 border-dashed border-amber-500/30 rounded-xl font-sans text-xs leading-relaxed shadow-sm scrollbar-thin">
                    {/* Header in Preview with Photos in Top Corners */}
                    <div className="relative border-b-2 border-slate-800 pb-3 mb-4 min-h-[90px]">
                      
                      {/* Top Right: Husband Photo Frame */}
                      {(selectedTemplate?.id === "contract-urfi-marriage" || husbandPhoto || wifePhoto) && (
                        <div className="absolute right-0 top-0 text-center">
                          <label className="w-16 h-20 rounded-lg border-2 border-blue-600/80 p-0.5 bg-slate-50 dark:bg-slate-950 shadow flex flex-col items-center justify-center overflow-hidden cursor-pointer group hover:border-blue-700 transition">
                            {husbandPhoto ? (
                              <img src={husbandPhoto} alt="الزوج" className="w-full h-full object-cover rounded" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400 text-[8px] space-y-0.5">
                                <User className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                                <span className="font-bold">صورة الزوج</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-blue-900/90 text-white text-[7px] py-0.5 font-bold">
                              الطرف الأول
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleHusbandPhotoUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}

                      {/* Top Left: Wife Photo Frame */}
                      {(selectedTemplate?.id === "contract-urfi-marriage" || husbandPhoto || wifePhoto) && (
                        <div className="absolute left-0 top-0 text-center">
                          <label className="w-16 h-20 rounded-lg border-2 border-rose-600/80 p-0.5 bg-slate-50 dark:bg-slate-950 shadow flex flex-col items-center justify-center overflow-hidden cursor-pointer group hover:border-rose-700 transition">
                            {wifePhoto ? (
                              <img src={wifePhoto} alt="الزوجة" className="w-full h-full object-cover rounded" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400 text-[8px] space-y-0.5">
                                <Heart className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                                <span className="font-bold">صورة الزوجة</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-rose-900/90 text-white text-[7px] py-0.5 font-bold">
                              الطرف الثاني
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleWifePhotoUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}

                      {/* Center Title */}
                      <div className={`text-center ${selectedTemplate?.id === "contract-urfi-marriage" || husbandPhoto || wifePhoto ? 'px-20' : ''}`}>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          {customLawyerName || "ديوان المحاماة والاستشارات القانونية"}
                        </h4>
                        <p className="text-[10.5px] text-slate-500 font-bold">
                          {customLawyerTitle || "المحاماة والاستشارات القانونية"}
                        </p>
                        {selectedTemplate?.id === "contract-urfi-marriage" && (
                          <span className="inline-block mt-1 text-[11px] font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                            عـقـد زواج عـرفـي شـرعـي
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body in Preview */}
                    <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      {renderedText}
                    </pre>

                    {/* Seal in Preview */}
                    <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                      <span>ختم وتوقيع المحامي المسؤول</span>
                      <span>حرر بتاريخ {new Date().toLocaleDateString("ar-EG")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Seal Footer info */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>صياغة رسمية معتمدة ومتوافقة مع قانون المرافعات والإجراءات الجنائية والمدنية</span>
              </div>
              <span className="font-mono">{renderedText.length} حرف</span>
            </div>

          </div>

        </div>

      </div>

      {/* 3. Add Custom Template Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-400">إضافة صيغة / قالب قانوني جديد</h3>
                  <p className="text-[11px] text-slate-300">أضف مذكرتك الخاصة مع إمكانية استخدام المتغيرات التلقائية</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewTemplate} className="p-5 overflow-y-auto space-y-4 text-right">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان القالب / اسم المذكرة: *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: مذكرة دفاع في جنحة ضرب / عقد بيع تجاري..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    التصنيف الرئيسي:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                  >
                    <option value="defense_memo">مذكرات دفاع وطعون</option>
                    <option value="claim_statement">صحف دعاوى وإنذارات</option>
                    <option value="contract">عقود واتفاقيات رسمية</option>
                    <option value="appeal">طعون بالاستئناف والنقض</option>
                    <option value="notice">إنذارات وتكليفات بالوفاء</option>
                    <option value="poa_agreement">عقود أتعاب وتوكيل</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وصف مختصر وأسانيد القالب:
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="وصف مختصر لموضوع الدعوى وأبرز الدفوع..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الوسوم والكلمات المفتاحية (مفصولة بفواصل):
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="جنح, شيك, خيانة أمانة, دفاع..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>

              {/* Placeholders Guide */}
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-3 rounded-xl text-[11px] space-y-1 text-amber-900 dark:text-amber-200">
                <span className="font-bold">⚡ المتغيرات الذكية المتاحة للاستخدام داخل القالب:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 font-mono text-[10px] mt-1">
                  <span>{`{{CLIENT_NAME}}`} (اسم الموكل)</span>
                  <span>{`{{CLIENT_ROLE}}`} (صفته)</span>
                  <span>{`{{CLIENT_NATIONAL_ID}}`}</span>
                  <span>{`{{OPPONENT_NAME}}`} (الخصم)</span>
                  <span>{`{{CASE_NUMBER}}`}</span>
                  <span>{`{{CASE_YEAR}}`}</span>
                  <span>{`{{COURT_NAME}}`} (المحكمة)</span>
                  <span>{`{{CIRCUIT}}`} (الدائرة)</span>
                  <span>{`{{SESSION_DATE}}`}</span>
                  <span>{`{{LAWYER_NAME}}`}</span>
                  <span>{`{{TODAY_DATE}}`}</span>
                  <span>{`{{POA_NUMBER}}`}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نص الصيغة / المحتوى القانوني الكامل: *
                </label>
                <textarea
                  required
                  rows={10}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="اكتب نص المذكرة أو الصياغة هنا مع استخدام المتغيرات مثل {{CLIENT_NAME}} و {{COURT_NAME}}..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20"
                >
                  حفظ وإدراج في المكتبة القانونية ✦
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
