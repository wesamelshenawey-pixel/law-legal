import React, { useState, useMemo } from "react";
import { 
  LegalTemplate, 
  ClientProfile, 
  CaseRecord, 
  PlatformUser 
} from "../types";
import { INITIAL_LEGAL_TEMPLATES } from "../data/legalTemplatesData";
import { getClientRoleLabel } from "../utils/translations";
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
  Award
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

  // Dynamic Merge / Autofill States
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  
  // Custom Overrides for fields
  const [clientRoleOverride, setClientRoleOverride] = useState("طالب / مدعي");
  const [opponentRoleOverride, setOpponentRoleOverride] = useState("معلن إليه / مدعى عليه");
  const [courtCircuitOverride, setCourtCircuitOverride] = useState("الدائرة الأولى مدني / جنح");
  const [customLawyerName, setCustomLawyerName] = useState("الأستاذ المحامي");
  const [customLawyerTitle, setCustomLawyerTitle] = useState("المحامي بالنقض والدستورية العليا");

  // Editable output text
  const [renderedText, setRenderedText] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedToCase, setIsSavedToCase] = useState(false);

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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>${selectedTemplate?.title || "مستند قانوني"}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: 'Amiri', 'Traditional Arabic', 'Cairo', Arial, sans-serif;
            font-size: 14pt;
            line-height: 1.8;
            color: #111;
            padding: 20px;
            direction: rtl;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
            margin-bottom: 25px;
          }
          .header h1 { margin: 0 0 5px 0; font-size: 18pt; font-weight: bold; }
          .header p { margin: 0; font-size: 11pt; color: #444; }
          .content { white-space: pre-wrap; word-break: break-word; text-align: justify; }
          .footer {
            margin-top: 40px;
            text-align: left;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ديوان المحاماة والاستشارات القانونية</h1>
          <p>الأستاذ المحامي - المحامي بالنقض والدستورية العليا</p>
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
    const sourceHTML = header + `<div style="text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;"><h2>ديوان المحاماة والاستشارات القانونية</h2><p>الأستاذ المحامي - محامٍ بالنقض والدستورية العليا</p></div><pre style="white-space: pre-wrap; font-family: inherit; font-size: 13pt;">` + renderedText + "</pre>" + footer;
    
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

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* 1. Header Toolbar with Extracted Add Template Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
              مكتبة القوالب القانونية والعقود الجاهزة
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

            {/* Editable Text Area */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 flex-1">
              <textarea
                rows={22}
                value={renderedText}
                onChange={(e) => setRenderedText(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs leading-relaxed outline-none focus:border-amber-500 shadow-inner text-right"
                placeholder="محتوى القالب القانوني المعبأ..."
              />
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
