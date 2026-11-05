import React, { useState, useEffect } from "react";
import {
  Cpu,
  Database,
  Layout,
  Sparkles,
  Plus,
  Play,
  Pause,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Scale,
  Users,
  DollarSign,
  UserCheck,
  Archive,
  Bot,
  Shield,
  Briefcase,
  Layers,
  ArrowUpRight,
  Download,
  RefreshCw,
  BarChart2,
  ChevronRight,
  X,
  Globe,
  Zap,
  Brain,
  Sliders,
  Check,
  FileSpreadsheet,
  Calendar,
  CreditCard,
  MessageSquare,
  FileText,
  AlertCircle,
  GripVertical,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  Building,
  UserPlus,
  Compass,
  Phone,
  Lock,
  History,
  FolderOpen,
  Send,
  Wand2,
  Share2,
  FolderPlus
} from "lucide-react";
import { SystemStructureSection, SystemSubInterface, InterfaceDisplayType, PlatformUser, AdminCustomSection } from "../types";
import { INITIAL_SYSTEM_STRUCTURES } from "../data/initialSystemStructures";

interface SystemStructuresExpansionViewProps {
  currentUser?: PlatformUser;
  language: string;
  onNavigateToSection?: (sectionId: string) => void;
  onAddSectionToApp?: (section: { 
    id: string; 
    nameArabic: string; 
    nameEnglish: string; 
    iconName?: string; 
    fields?: any[]; 
    records?: any[]; 
  }) => void;
}

export const SystemStructuresExpansionView: React.FC<SystemStructuresExpansionViewProps> = ({
  currentUser,
  language,
  onNavigateToSection,
  onAddSectionToApp
}) => {
  // Persistence state for system structures
  const [sections, setSections] = useState<SystemStructureSection[]>(() => {
    try {
      const saved = localStorage.getItem("law_system_structures_data");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load saved structures", e);
    }
    return INITIAL_SYSTEM_STRUCTURES;
  });

  // Save to local storage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem("law_system_structures_data", JSON.stringify(sections));
    } catch (e) {
      console.error("Failed to save structures", e);
    }
  }, [sections]);

  // AI Auto-Generation Engine Switch & Status
  const [isAutoGenerating, setIsAutoGenerating] = useState<boolean>(true);
  const [generationTicker, setGenerationTicker] = useState<number>(0);
  const [recentGeneratedNotice, setRecentGeneratedNotice] = useState<string | null>(null);
  const [lastAddedSectionId, setLastAddedSectionId] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<"all" | "standard" | "ai">("all");

  // Competitor & Multi-AI Research Hub
  const [selectedAiModel, setSelectedAiModel] = useState<string>("gemini-2.5-pro");
  const [researchQuery, setResearchQuery] = useState<string>("");
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    title: string;
    sectionId: string;
    sectionTitle: string;
    code: string;
    fieldsCount: number;
    displayType: InterfaceDisplayType;
    description: string;
    sourceCompetitor: string;
    fields?: any[];
  }>>([]);

  // Dedicated AI Structure & Branch Generator Modal State
  const [isAiGeneratorModalOpen, setIsAiGeneratorModalOpen] = useState<boolean>(false);
  const [aiGenTargetType, setAiGenTargetType] = useState<"section" | "branch">("section");
  const [aiGenLegalDomain, setAiGenLegalDomain] = useState<string>("arbitration");
  const [aiGenCustomDomain, setAiGenCustomDomain] = useState<string>("");
  const [aiGenBranchCount, setAiGenBranchCount] = useState<number>(4);
  const [aiGenSelectedSectionId, setAiGenSelectedSectionId] = useState<string>("");
  const [aiGenCustomPrompt, setAiGenCustomPrompt] = useState<string>("");
  const [isGeneratingAiStructure, setIsGeneratingAiStructure] = useState<boolean>(false);
  const [generatedAiResult, setGeneratedAiResult] = useState<any | null>(null);

  // Drag and Drop state
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState<number | null>(null);

  // Interactive Modals State
  const [previewSubInterface, setPreviewSubInterface] = useState<SystemSubInterface | null>(null);
  const [previewSectionTitle, setPreviewSectionTitle] = useState<string>("");
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState<boolean>(false);
  const [isAddSubInterfaceModalOpen, setIsAddSubInterfaceModalOpen] = useState<boolean>(false);
  const [targetSectionForSub, setTargetSectionForSub] = useState<string>("");

  // New Section Form Fields
  const [newSectionTitle, setNewSectionTitle] = useState<string>("");
  const [newSectionDesc, setNewSectionDesc] = useState<string>("");
  const [newSectionBadge, setNewSectionBadge] = useState<string>("");
  const [newSectionIcon, setNewSectionIcon] = useState<string>("scale");

  // New Sub-Interface Form Fields
  const [newSubTitle, setNewSubTitle] = useState<string>("");
  const [newSubCode, setNewSubCode] = useState<string>("");
  const [newSubFieldsCount, setNewSubFieldsCount] = useState<number>(6);
  const [newSubDisplayType, setNewSubDisplayType] = useState<InterfaceDisplayType>("جدول بيانات");
  const [newSubIsAi, setNewSubIsAi] = useState<boolean>(false);
  const [newSubDesc, setNewSubDesc] = useState<string>("");

  // Dynamic Metrics Calculation
  const totalMainSections = sections.length;
  const totalSubInterfaces = sections.reduce((acc, sec) => acc + sec.subInterfaces.length, 0);
  const totalAiGenerated = sections.reduce(
    (acc, sec) => acc + sec.subInterfaces.filter(s => s.isAiGenerated).length,
    0
  );

  // =========================================================================
  // 1. AUTOMATIC ORGANIZATION FOR SECTIONS & BRANCHES (تنظيم تلقائي للأقسام والأفرع)
  // =========================================================================
  const handleAutoOrganizeAll = () => {
    // 1. Define ideal canonical priority categories
    const priorityKeywords = [
      { key: "قانون", order: 1, prefix: "LEGAL" },
      { key: "قضايا", order: 1, prefix: "LEGAL" },
      { key: "جلسات", order: 2, prefix: "SESS" },
      { key: "أجندة", order: 2, prefix: "SESS" },
      { key: "موكل", order: 3, prefix: "CLIENT" },
      { key: "خصوم", order: 3, prefix: "CLIENT" },
      { key: "أتعاب", order: 4, prefix: "FIN" },
      { key: "خزينة", order: 4, prefix: "FIN" },
      { key: "مالي", order: 4, prefix: "FIN" },
      { key: "أرشيف", order: 5, prefix: "ARCH" },
      { key: "مستند", order: 5, prefix: "ARCH" },
      { key: "وثائق", order: 5, prefix: "ARCH" },
      { key: "أكواد", order: 6, prefix: "LAW" },
      { key: "مكتبة", order: 6, prefix: "LAW" },
      { key: "قوالب", order: 6, prefix: "LAW" },
      { key: "ذكاء", order: 7, prefix: "AI" },
      { key: "توليد", order: 7, prefix: "AI" }
    ];

    const getScore = (sec: SystemStructureSection) => {
      const text = (sec.title + " " + sec.description + " " + sec.badge).toLowerCase();
      for (const p of priorityKeywords) {
        if (text.includes(p.key)) return p.order;
      }
      return 10; // Custom / Extensions
    };

    // Clone and sort sections logically
    const organizedSections = [...sections].sort((a, b) => getScore(a) - getScore(b));

    // Normalize each section's sub-interfaces and codes sequentially
    const standardized = organizedSections.map((sec, secIdx) => {
      const secNum = String(secIdx + 1).padStart(2, "0");
      let secPrefix = "SEC_" + secNum;

      if (sec.title.includes("قضايا") || sec.title.includes("قانون")) secPrefix = "LEGAL";
      else if (sec.title.includes("جلسات") || sec.title.includes("أجندة")) secPrefix = "SESS";
      else if (sec.title.includes("موكل") || sec.title.includes("عملاء")) secPrefix = "CLIENT";
      else if (sec.title.includes("مالي") || sec.title.includes("أتعاب") || sec.title.includes("خزينة")) secPrefix = "FIN";
      else if (sec.title.includes("أرشيف") || sec.title.includes("وثائق")) secPrefix = "ARCH";
      else if (sec.title.includes("مكتبة") || sec.title.includes("أكواد")) secPrefix = "LAW";
      else if (sec.title.includes("ذكاء")) secPrefix = "AI";

      const normalizedSubs = sec.subInterfaces.map((sub, subIdx) => {
        const subNum = String(subIdx + 1).padStart(2, "0");
        const formattedCode = `${secPrefix}_${subNum}`;
        return {
          ...sub,
          code: formattedCode,
          status: sub.status || "نشط"
        };
      });

      return {
        ...sec,
        code: `struct-${secPrefix.toLowerCase()}-${secNum}`,
        subInterfaces: normalizedSubs
      };
    });

    setSections(standardized);
    setRecentGeneratedNotice("✨ تم بنجاح التنظيم والترتيب التلقائي الذكي لكافة الأقسام والواجهات والأفرع وتوحيد الأكواد القضائية!");
    
    setTimeout(() => {
      setRecentGeneratedNotice(null);
    }, 6000);
  };

  // =========================================================================
  // 2. ADD SECTION / BRANCH DIRECTLY TO MAIN APP (إضافة القسم للبرنامج)
  // =========================================================================
  const handleAddSectionDirectlyToApp = (
    title: string, 
    id?: string, 
    englishName?: string, 
    icon?: string, 
    customFields?: any[],
    sampleRecords?: any[]
  ) => {
    const sectionId = id || "sec_" + Date.now();
    const secNameArabic = title;
    const secNameEnglish = englishName || (title.replace(/[^\w\s]/gi, "").trim() || "Module_" + sectionId.slice(-4));
    
    const formattedFields = customFields && customFields.length > 0 ? customFields : [
      { name: "العنوان / الموضوع", type: "string" },
      { name: "التاريخ", type: "date" },
      { name: "الحالة", type: "string" },
      { name: "ملاحظات", type: "string" }
    ];

    if (onAddSectionToApp) {
      onAddSectionToApp({
        id: sectionId,
        nameArabic: secNameArabic,
        nameEnglish: secNameEnglish,
        iconName: icon || "Layers",
        fields: formattedFields,
        records: sampleRecords || []
      });
    }

    setLastAddedSectionId(sectionId);
    setRecentGeneratedNotice(`🚀 تم بنجاح إضافة القسم "${secNameArabic}" إلى قائمة أقسام البرنامج والشريط الجانبي!`);
    
    setTimeout(() => {
      setRecentGeneratedNotice(null);
    }, 8000);
  };

  // =========================================================================
  // 3. AI STRUCTURE & BRANCH GENERATOR HANDLER (توليد الهياكل بالذكاء الاصطناعي)
  // =========================================================================
  const handleExecuteAiGeneration = () => {
    setIsGeneratingAiStructure(true);

    setTimeout(() => {
      let domainTitleArabic = "إدارة التحكيم وفض المنازعات الدولية";
      let domainPrefix = "ARB";
      let icon = "scale";

      if (aiGenLegalDomain === "arbitration") {
        domainTitleArabic = "إدارة التحكيم وفض المنازعات الدولية";
        domainPrefix = "ARB";
        icon = "scale";
      } else if (aiGenLegalDomain === "tax_einvoice") {
        domainTitleArabic = "منظومة الضرائب والفاتورة الإلكترونية";
        domainPrefix = "TAX";
        icon = "dollar";
      } else if (aiGenLegalDomain === "cyber_crime") {
        domainTitleArabic = "مكافحة الجرائم الإلكترونية والابتزاز الرقمي";
        domainPrefix = "CYBER";
        icon = "shield";
      } else if (aiGenLegalDomain === "labor_cases") {
        domainTitleArabic = "شؤون العمل والعمال والتأمينات الاجتماعية";
        domainPrefix = "LABOR";
        icon = "user-check";
      } else if (aiGenLegalDomain === "corporate_contracts") {
        domainTitleArabic = "عقود الشركات والاستثمار والاستحواذ";
        domainPrefix = "CORP";
        icon = "briefcase";
      } else if (aiGenLegalDomain === "cassation_appeals") {
        domainTitleArabic = "الطعون بالنقض والمحكمة الدستورية العليا";
        domainPrefix = "CASS";
        icon = "scale";
      } else if (aiGenLegalDomain === "real_estate") {
        domainTitleArabic = "التطوير والاستثمار العقاري والمنازعات الهندسية";
        domainPrefix = "REAL";
        icon = "building";
      } else if (aiGenLegalDomain === "customs_maritime") {
        domainTitleArabic = "الشؤون البحرية والجمارك والملاحة الدولية";
        domainPrefix = "MAR";
        icon = "compass";
      } else if (aiGenLegalDomain === "custom") {
        domainTitleArabic = aiGenCustomDomain.trim() || "منظومة التخصص القضائي المستحدث";
        domainPrefix = "CUST";
        icon = "bot";
      }

      if (aiGenTargetType === "section") {
        // Generate whole main section with sub-branches
        const branchTemplates: Array<{ title: string; desc: string; type: InterfaceDisplayType; fieldsCount: number }> = [
          { title: `سجل صحف دعاوى وملفات ${domainTitleArabic}`, desc: "قاعدة بيانات تفصيلية لقيد الملفات والأطراف ومذكرات الدفاع.", type: "جدول بيانات", fieldsCount: 8 },
          { title: `جلسات ومواعيد مرافعة ${domainTitleArabic}`, desc: "رصد الأجندة الزمنية وتنبيهات مواعيد الطعن والسقوط القضائي.", type: "أجندة زمنية", fieldsCount: 6 },
          { title: `لوحة تقييم المخاطر والمؤشرات التحليلية لـ ${domainTitleArabic}`, desc: "إحصائيات ونسب كسب القضايا والمبالغ المحصلة.", type: "لوحة تحليلية", fieldsCount: 5 },
          { title: `أرشيف المستندات والاتفاقيات لـ ${domainTitleArabic}`, desc: "حفظ الوثائق الرقمية ومسودات العقود والتوكيلات المخصصة.", type: "بطاقات تفاعلية", fieldsCount: 7 },
          { title: `حاسبة الرسوم والمطالبات المالية لـ ${domainTitleArabic}`, desc: "حساب التعويضات، الدمغات النسبية، وأتعاب الخبراء.", type: "نموذج إدخال", fieldsCount: 6 },
          { title: `المذكرات الاستباقية والدفوع لـ ${domainTitleArabic}`, desc: "صياغة المذكرات القانونية والدفوع الشكلية والموضوعية بالذكاء الاصطناعي.", type: "بطاقات تفاعلية", fieldsCount: 6 }
        ];

        const selectedBranches = branchTemplates.slice(0, aiGenBranchCount);
        const newSecId = "sec_ai_" + Date.now();

        const newSection: SystemStructureSection = {
          id: newSecId,
          code: `STRUCT_${domainPrefix}_${Date.now().toString().slice(-4)}`,
          title: domainTitleArabic,
          description: aiGenCustomPrompt.trim() 
            ? `قسم قضائي تم توليده بالذكاء الاصطناعي (${selectedAiModel}) وفقاً للتعليمات: ${aiGenCustomPrompt}`
            : `قسم متخصص تم توليده وهيكلته تلقائياً بالذكاء الاصطناعي (${selectedAiModel}) وفقاً لأحدث معايير المكاتب القانونية الدولية.`,
          badge: "توليد ذكي متقدم",
          statusBadge: "نشط ومعتمد",
          iconName: icon,
          subInterfaces: selectedBranches.map((b, idx) => ({
            id: `sub_ai_${newSecId}_${idx + 1}`,
            code: `${domainPrefix}_0${idx + 1}`,
            title: b.title,
            description: b.desc,
            fieldsCount: b.fieldsCount,
            displayType: b.type,
            status: "نشط",
            isAiGenerated: true,
            sectionId: newSecId
          }))
        };

        setSections(prev => [newSection, ...prev]);
        setGeneratedAiResult({
          type: "section",
          section: newSection,
          branchesCount: selectedBranches.length
        });
        setRecentGeneratedNotice(`✨ تم بنجاح توليد الهيكل الجديد "${domainTitleArabic}" مع ${selectedBranches.length} أفرع تخصصية!`);

      } else {
        // Generate branch for existing section
        const targetSec = sections.find(s => s.id === aiGenSelectedSectionId) || sections[0];
        const newBranchCode = `${targetSec.title.slice(0, 3).toUpperCase()}_AI_${Math.floor(Math.random() * 899 + 100)}`;
        const branchTitle = aiGenCustomDomain.trim() || `الواجهة الذكية المتقدمة لـ ${targetSec.title}`;

        const newSub: SystemSubInterface = {
          id: "sub_ai_" + Date.now(),
          code: newBranchCode,
          title: branchTitle,
          fieldsCount: 7,
          displayType: "جدول بيانات",
          status: "نشط",
          isAiGenerated: true,
          sectionId: targetSec.id,
          description: `فرع تخصصي تم استنباطه وتوليده تلقائياً بواسطة ${selectedAiModel} لتعزيز قدرات قسم (${targetSec.title}).`
        };

        setSections(prev => prev.map(s => s.id === targetSec.id ? { ...s, subInterfaces: [newSub, ...s.subInterfaces] } : s));
        setGeneratedAiResult({
          type: "branch",
          branch: newSub,
          sectionTitle: targetSec.title
        });
        setRecentGeneratedNotice(`✨ تم توليد الفرع الجديد "${branchTitle}" بنجاح وإضافته إلى قسم (${targetSec.title})!`);
      }

      setIsGeneratingAiStructure(false);
    }, 1200);
  };

  // Competitor research generator simulator
  const handlePerformLegalResearch = (overrideQuery?: string) => {
    const q = overrideQuery || researchQuery;
    if (!q.trim()) return;

    setIsResearching(true);

    setTimeout(() => {
      const generatedSugs = [
        {
          title: `منظومة الفوترة الإلكترونية وتتبع الساعات (${q.slice(0, 15)})`,
          sectionId: sections[0]?.id || "struct-legal",
          sectionTitle: sections[0]?.title || "الإدارة القانونية والقضايا",
          code: "AI_BILLING_LEGAL",
          fieldsCount: 8,
          displayType: "جدول بيانات" as InterfaceDisplayType,
          description: `نظام متكامل مستوحى من أفضل الممارسات القضائية لحساب ساعات العمل القانونية وربطها بالفاتورة الضريبية.`,
          sourceCompetitor: `محرك Gemini 2.5 + معايير كبرى المكاتب القضائية`,
          fields: [
            { name: "اسم المحامي المباشر", type: "string" },
            { name: "رقم القضية / الموكل", type: "string" },
            { name: "تاريخ وساعات العمل", type: "number" },
            { name: "التكلفة المحتسبة", type: "number" },
            { name: "حالة الاعتماد والفوترة", type: "string" }
          ]
        },
        {
          title: `سجل فض المنازعات والتحكيم التجاري (${q.slice(0, 15)})`,
          sectionId: sections[0]?.id || "struct-legal",
          sectionTitle: sections[0]?.title || "الإدارة القانونية والقضايا",
          code: "AI_ARBITRATION_HUB",
          fieldsCount: 10,
          displayType: "بطاقات تفاعلية" as InterfaceDisplayType,
          description: `واجهة لإدارة اتفاقيات التحكيم، تعيين المحكمين، وتدوين محاضر الجلسات العرفية والرسمية.`,
          sourceCompetitor: `نموذج DeepSeek Legal + اتفاقيات التحكيم الدولية`,
          fields: [
            { name: "موضوع النزاع التحكيمي", type: "string" },
            { name: "هيئة التحكيم", type: "string" },
            { name: "تاريخ انعقاد الجلسة", type: "date" },
            { name: "حكم التحكيم / القرار", type: "string" }
          ]
        }
      ];

      setAiSuggestions(generatedSugs);
      setIsResearching(false);
      setRecentGeneratedNotice(`تم العثور على اقتراحات ذكية جديدة ومتاحة للإضافة الفورية!`);
      
      setTimeout(() => {
        setRecentGeneratedNotice(null);
      }, 5000);
    }, 1000);
  };

  const handleAdoptAiSuggestion = (sug: typeof aiSuggestions[0]) => {
    const newSub: SystemSubInterface = {
      id: "sub-ai-" + Date.now(),
      code: sug.code,
      title: sug.title,
      fieldsCount: sug.fieldsCount,
      displayType: sug.displayType,
      status: "نشط",
      isAiGenerated: true,
      sectionId: sug.sectionId,
      description: sug.description
    };

    setSections(prev =>
      prev.map(sec =>
        sec.id === sug.sectionId
          ? { ...sec, subInterfaces: [newSub, ...sec.subInterfaces] }
          : sec
      )
    );

    setAiSuggestions(prev => prev.filter(s => s.code !== sug.code));
    setRecentGeneratedNotice(`تمت إضافة واجهة "${sug.title}" بنجاح إلى الهياكل!`);
    
    setTimeout(() => {
      setRecentGeneratedNotice(null);
    }, 4000);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSectionIndex(index);
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === index) return;
    setDragOverSectionIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === dropIndex) {
      setDraggedSectionIndex(null);
      setDragOverSectionIndex(null);
      return;
    }

    const updated = [...sections];
    const [movedItem] = updated.splice(draggedSectionIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    setSections(updated);
    setDraggedSectionIndex(null);
    setDragOverSectionIndex(null);
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSections(updated);
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSections(updated);
  };

  const handleResetToDefault = () => {
    if (confirm("هل تريد بالتأكيد استعادة الترتيب والهياكل الافتراضية الأصلية؟")) {
      setSections(INITIAL_SYSTEM_STRUCTURES);
      localStorage.removeItem("law_system_structures_data");
      setRecentGeneratedNotice("تمت استعادة الهياكل الافتراضية بنجاح!");
      setTimeout(() => setRecentGeneratedNotice(null), 4000);
    }
  };

  // Manual Section Creation
  const handleCreateSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;

    const newSec: SystemStructureSection = {
      id: "struct-custom-" + Date.now(),
      code: "struct-cust-" + Date.now().toString().slice(-4),
      title: newSectionTitle.trim(),
      description: newSectionDesc.trim() || "قسم رئيسي مستحدث لإدارة البيانات القانونية.",
      badge: newSectionBadge.trim() || "قسم إداري",
      statusBadge: "نشط ومعتمد",
      iconName: newSectionIcon,
      subInterfaces: []
    };

    setSections(prev => [newSec, ...prev]);
    setIsAddSectionModalOpen(false);
    setNewSectionTitle("");
    setNewSectionDesc("");
    setNewSectionBadge("");
    setRecentGeneratedNotice(`تم إنشاء الهيكل الرئيسي "${newSec.title}" بنجاح!`);
    setTimeout(() => setRecentGeneratedNotice(null), 4000);
  };

  // Manual Sub-Interface Creation
  const handleCreateSubInterfaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTitle.trim() || !targetSectionForSub) return;

    const newSub: SystemSubInterface = {
      id: "sub-custom-" + Date.now(),
      code: newSubCode.trim().toUpperCase() || "INTERFACE_" + Math.floor(Math.random() * 900 + 100),
      title: newSubTitle.trim(),
      fieldsCount: newSubFieldsCount,
      displayType: newSubDisplayType,
      status: "نشط",
      isAiGenerated: newSubIsAi,
      sectionId: targetSectionForSub,
      description: newSubDesc.trim() || "واجهة مخصصة لقاعدة بيانات القسم."
    };

    setSections(prev =>
      prev.map(sec =>
        sec.id === targetSectionForSub
          ? { ...sec, subInterfaces: [...sec.subInterfaces, newSub] }
          : sec
      )
    );

    setIsAddSubInterfaceModalOpen(false);
    setNewSubTitle("");
    setNewSubCode("");
    setNewSubDesc("");
    setNewSubIsAi(false);
    setRecentGeneratedNotice(`تمت إضافة الواجهة "${newSub.title}" بنجاح!`);
    setTimeout(() => setRecentGeneratedNotice(null), 4000);
  };

  // Filter sections and sub-interfaces
  const filteredSections = sections
    .filter(sec => {
      if (selectedSectionFilter !== "all" && sec.id !== selectedSectionFilter) return false;
      return true;
    })
    .map(sec => {
      let matchingSubs = sec.subInterfaces;

      if (selectedTypeFilter === "standard") {
        matchingSubs = matchingSubs.filter(s => !s.isAiGenerated);
      } else if (selectedTypeFilter === "ai") {
        matchingSubs = matchingSubs.filter(s => s.isAiGenerated);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const secMatches =
          sec.title.toLowerCase().includes(q) ||
          sec.description.toLowerCase().includes(q) ||
          sec.badge.toLowerCase().includes(q);

        if (!secMatches) {
          matchingSubs = matchingSubs.filter(
            s =>
              s.title.toLowerCase().includes(q) ||
              s.code.toLowerCase().includes(q) ||
              s.description?.toLowerCase().includes(q)
          );
        }
      }

      return {
        ...sec,
        subInterfaces: matchingSubs
      };
    })
    .filter(sec => {
      if (!searchQuery.trim() && selectedTypeFilter === "all") return true;
      return (
        sec.subInterfaces.length > 0 ||
        sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  const renderSectionIcon = (iconName: string) => {
    switch (iconName) {
      case "scale":
        return <Scale className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
      case "users":
        return <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />;
      case "dollar":
        return <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      case "user-check":
        return <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
      case "archive":
        return <Archive className="w-6 h-6 text-rose-600 dark:text-rose-400" />;
      case "bot":
        return <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" />;
      case "briefcase":
        return <Briefcase className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />;
      case "shield":
        return <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case "building":
        return <Building className="w-6 h-6 text-teal-600 dark:text-teal-400" />;
      case "compass":
        return <Compass className="w-6 h-6 text-sky-600 dark:text-sky-400" />;
      default:
        return <Layers className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16 text-right" dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* ========================================================================= */}
      {/* 1. TOP HERO NOTIFICATION & SUCCESS FEEDBACK BANNER                        */}
      {/* ========================================================================= */}
      {recentGeneratedNotice && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white shadow-xl border border-emerald-500/40 flex items-center justify-between gap-4 animate-bounce-short">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Sparkles className="w-5 h-5 animate-spin text-emerald-400" />
            </span>
            <p className="text-xs sm:text-sm font-black text-emerald-200">
              {recentGeneratedNotice}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {lastAddedSectionId && onNavigateToSection && (
              <button
                onClick={() => onNavigateToSection(lastAddedSectionId)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>الانتقال للقسم الآن 🚀</span>
              </button>
            )}
            <button
              onClick={() => setRecentGeneratedNotice(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. COMMAND HEADER & STATS COUNTERS                                        */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Automatic Organization Button */}
            <button
              onClick={handleAutoOrganizeAll}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="تنظيم وترتيب تلقائي للأقسام والأفرع وتوحيد الأكواد"
            >
              <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>⚡ تنظيم تلقائي للأقسام والأفرع</span>
            </button>

            {/* AI Generator Button */}
            <button
              onClick={() => setIsAiGeneratorModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>✨ توليد بالذكاء الاصطناعي</span>
            </button>

            {/* Manual Add Section Button */}
            <button
              onClick={() => setIsAddSectionModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm border border-slate-300/80 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ قسم يدوي</span>
            </button>
          </div>

          {/* Mini Counter Row */}
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {totalMainSections} أقسام رئيسية
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
              {totalSubInterfaces} واجهة فرعية
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              {totalAiGenerated} واجهة ذكية
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MULTI-AI SEARCH & JURISPRUDENCE RESEARCH TOOLBAR                       */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Model Switcher */}
          <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700">
            <span className="text-xs font-bold text-slate-400 px-2">النموذج:</span>
            {[
              { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
              { id: "gpt-4o", label: "GPT-4o Legal" },
              { id: "claude-3.7", label: "Claude 3.7" }
            ].map(model => (
              <button
                key={model.id}
                onClick={() => setSelectedAiModel(model.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  selectedAiModel === model.id
                    ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {model.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Prompt Box */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={researchQuery}
              onChange={e => setResearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handlePerformLegalResearch()}
              placeholder="ابحث عن أي واجهة أو تخصص بالذكاء الاصطناعي (مثل: قضايا الضرائب، قضايا التحكيم، الفوترة)..."
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
          <button
            onClick={() => handlePerformLegalResearch()}
            disabled={isResearching}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            {isResearching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>جاري البحث...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>بحث وتوليد</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold">مقترحات جاهزة:</span>
          {[
            "أقسام برنامج Clio السحابي العالمي",
            "نظام الضرائب والفاتورة الإلكترونية المصرية",
            "إدارة مكاتب فض المنازعات والتحكيم الدولي",
            "حاسبة الساعات القابلة للفوترة وأتعاب الخبراء"
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setResearchQuery(chip);
                handlePerformLegalResearch(chip);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* AI Suggested Cards Result Container with Direct Add Buttons */}
        {aiSuggestions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-4">
            <h4 className="text-sm font-black text-amber-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>نتائج البحث واقتراحات الذكاء الاصطناعي المتاحة للإضافة الفورية:</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiSuggestions.map((sug, i) => (
                <div key={i} className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800">
                        {sug.code}
                      </span>
                      <span className="text-xs text-indigo-300 font-bold">
                        المصدر: {sug.sourceCompetitor}
                      </span>
                    </div>
                    <h5 className="text-base font-black text-white">{sug.title}</h5>
                    <p className="text-xs text-slate-300 leading-relaxed">{sug.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 font-medium">
                      <span>القسم: {sug.sectionTitle}</span>
                      <span>•</span>
                      <span>{sug.fieldsCount} حقول</span>
                      <span>•</span>
                      <span>{sug.displayType}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => handleAdoptAiSuggestion(sug)}
                      className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إدراج في شجرة الهياكل</span>
                    </button>

                    {/* DIRECT ADD TO PROGRAM SECTIONS & SIDEBAR */}
                    <button
                      onClick={() => handleAddSectionDirectlyToApp(sug.title, undefined, sug.code, "Layers", sug.fields)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-slate-950" />
                      <span>+ إضافة لقائمة البرنامج والشريط الجانبي 🚀</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. SEARCH & FILTER BAR FOR STRUCTURES                                     */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث فوري في الهياكل، الواجهات، أو الأكواد..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>القسم:</span>
            <select
              value={selectedSectionFilter}
              onChange={e => setSelectedSectionFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="all">كافة الأقسام الرئيسية ({sections.length})</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>النوع:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setSelectedTypeFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedTypeFilter === "all" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setSelectedTypeFilter("standard")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedTypeFilter === "standard" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                أساسي
              </button>
              <button
                onClick={() => setSelectedTypeFilter("ai")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedTypeFilter === "ai" ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                توليد ذكي
              </button>
            </div>
          </div>

          <button
            onClick={handleResetToDefault}
            title="استعادة الهياكل الافتراضية"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">استعادة الافتراضي</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DRAGGABLE SECTIONS & CARDS LAYOUT CONTAINER WITH DIRECT ADD BUTTONS    */}
      {/* ========================================================================= */}
      <div className="space-y-10">
        {filteredSections.map((section, sectionIndex) => {
          const isDragging = draggedSectionIndex === sectionIndex;
          const isOver = dragOverSectionIndex === sectionIndex;

          return (
            <div
              key={section.id}
              id={section.code}
              draggable
              onDragStart={e => handleDragStart(e, sectionIndex)}
              onDragOver={e => handleDragOver(e, sectionIndex)}
              onDrop={e => handleDrop(e, sectionIndex)}
              className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border transition-all duration-200 relative ${
                isDragging
                  ? "opacity-50 border-amber-400 scale-[0.99] shadow-lg"
                  : isOver
                  ? "border-2 border-indigo-500 shadow-md bg-indigo-50/20"
                  : "border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-slate-300"
              }`}
            >
              {/* Section Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800 mb-6">
                
                {/* Right Side: Drag Handle & Icon & Title & Badges */}
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Drag Handle */}
                  <div 
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing shrink-0 flex flex-col items-center justify-center"
                    title="اسحب هذا القسم لتغيير ترتيبه وأولويته"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Section Icon Card */}
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                    {renderSectionIcon(section.iconName)}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {section.title}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                        {section.badge}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{section.statusBadge}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-100 dark:border-slate-700">
                        ترتيب #{sectionIndex + 1}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Left Side: Direct Add to Program Button & Sub-interface Add */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Reorder Arrows */}
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                    <button
                      type="button"
                      disabled={sectionIndex === 0}
                      onClick={() => moveSectionUp(sectionIndex)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer transition"
                      title="تحريك لأعلى"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={sectionIndex === sections.length - 1}
                      onClick={() => moveSectionDown(sectionIndex)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer transition"
                      title="تحريك لأسفل"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add Sub-Interface */}
                  <button
                    onClick={() => {
                      setTargetSectionForSub(section.id);
                      setIsAddSubInterfaceModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                    <span>+ فرع جديد</span>
                  </button>

                  {/* DIRECT BUTTON: ADD SECTION TO APP NAVIGATION */}
                  <button
                    onClick={() => handleAddSectionDirectlyToApp(section.title, section.id, section.code, section.iconName)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
                    title="إضافة هذا القسم الرئيسي مباشرة إلى شريط وأقسام البرنامج"
                  >
                    <FolderPlus className="w-4 h-4 text-slate-950" />
                    <span>+ إضافة القسم لشريط البرنامج 🚀</span>
                  </button>
                </div>
              </div>

              {/* Sub-Interfaces Grid - CARDS LAYOUT */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {section.subInterfaces.map(sub => {
                  const isAi = sub.isAiGenerated;
                  return (
                    <div
                      key={sub.id}
                      className={`rounded-2xl p-5 transition-all duration-200 relative group flex flex-col justify-between text-right shadow-xs hover:shadow-md ${
                        isAi
                          ? "border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20 hover:border-emerald-500"
                          : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:border-indigo-400"
                      }`}
                    >
                      {/* Card Top Row */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          {isAi ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-black border border-emerald-300 dark:border-emerald-700">
                              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>توليد ذكي</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                              <Layout className="w-3 h-3 text-slate-500" />
                              <span>واجهة أساسية</span>
                            </span>
                          )}

                          <span className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                            {sub.code}
                          </span>
                        </div>

                        {/* Card Title & Icon */}
                        <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                          <span>{sub.title}</span>
                          <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-[-2px] transition-all" />
                        </h3>

                        {/* Card Description */}
                        {sub.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                            {sub.description}
                          </p>
                        )}

                        {/* Details row */}
                        <div className="flex items-center justify-start gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">
                          <span className="flex items-center gap-1">
                            <Layout className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sub.displayType}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Database className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sub.fieldsCount} حقول</span>
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewSubInterface(sub);
                            setPreviewSectionTitle(section.title);
                          }}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>معاينة وتخصيص</span>
                        </button>

                        {/* Direct Add Branch as Standalone App Section */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddSectionDirectlyToApp(sub.title, sub.id, sub.code, "Layers");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-amber-400 hover:text-slate-950 text-slate-700 dark:text-slate-200 font-black text-[11px] flex items-center gap-1 transition cursor-pointer"
                          title="إضافة هذا الفرع كقسم مستقل بالبرنامج"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ كقسم مستقل</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Section Footer */}
              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-mono">
                <span>LAST_SYNC: {new Date().toISOString().split("T")[0]}</span>
                <span>SYSTEM_ID: {section.code}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL: DEDICATED AI STRUCTURE & BRANCH GENERATOR (توليد بالذكاء الاصطناعي) */}
      {/* ========================================================================= */}
      {isAiGeneratorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 text-xs font-black">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>مولد الهياكل والأقسام الذكي بالذكاء الاصطناعي</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  توليد قسم أو فرع قضائي متكامل
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsAiGeneratorModalOpen(false);
                  setGeneratedAiResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If result already generated */}
            {generatedAiResult ? (
              <div className="space-y-5">
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-right space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>تم التوليد بنجاح وفقاً لأعلى معايير الحوكمة القانونية!</span>
                  </div>
                  {generatedAiResult.type === "section" ? (
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
                        {generatedAiResult.section.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                        {generatedAiResult.section.description}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 font-bold border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300">
                          {generatedAiResult.branchesCount} أفرع وواجهات تخصصية مدمجة
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          كود الهيكل: {generatedAiResult.section.code}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
                        {generatedAiResult.branch.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {generatedAiResult.branch.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setGeneratedAiResult(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    توليد نموذج آخر
                  </button>

                  {/* DIRECT BUTTON IN RESULT */}
                  <button
                    type="button"
                    onClick={() => {
                      if (generatedAiResult.type === "section") {
                        handleAddSectionDirectlyToApp(
                          generatedAiResult.section.title, 
                          generatedAiResult.section.id, 
                          generatedAiResult.section.code, 
                          generatedAiResult.section.iconName
                        );
                      } else {
                        handleAddSectionDirectlyToApp(
                          generatedAiResult.branch.title, 
                          generatedAiResult.branch.id, 
                          generatedAiResult.branch.code, 
                          "Layers"
                        );
                      }
                      setIsAiGeneratorModalOpen(false);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>+ إضافة هذا القسم للبرنامج والشريط الجانبي فوراً 🚀</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Mode Selector */}
                <div>
                  <label className="block font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    1. نوع التوليد المطلوب:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAiGenTargetType("section")}
                      className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                        aiGenTargetType === "section"
                          ? "border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-300 font-black"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="block text-sm font-black mb-0.5">📂 قسم هيكلي كامل مع أفرعه</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">ينشئ قسماً رئيسياً مستقلاً بعدة واجهات تخصصية</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAiGenTargetType("branch")}
                      className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                        aiGenTargetType === "branch"
                          ? "border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-300 font-black"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="block text-sm font-black mb-0.5">📄 واجهة فرعية / فرع تخصصي</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">ينشئ فرعاً أو واجهة جديدة لقسم موجود حالياً</span>
                    </button>
                  </div>
                </div>

                {/* Domain Selector */}
                <div>
                  <label className="block font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    2. التخصص القانوني / مجال المنظومة:
                  </label>
                  <select
                    value={aiGenLegalDomain}
                    onChange={e => setAiGenLegalDomain(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold outline-none cursor-pointer focus:border-amber-500"
                  >
                    <option value="arbitration">⚖️ إدارة التحكيم وفض المنازعات الدولية</option>
                    <option value="tax_einvoice">💰 منظومة الضرائب والفاتورة الإلكترونية والإقرارات</option>
                    <option value="cyber_crime">🛡️ مكافحة الجرائم الإلكترونية والابتزاز الرقمي</option>
                    <option value="labor_cases">👔 شؤون العمل والعمال والتأمينات الاجتماعية</option>
                    <option value="corporate_contracts">💼 عقود الشركات والاستثمار والاستحواذ</option>
                    <option value="cassation_appeals">📜 الطعون بالنقض والمحكمة الدستورية العليا</option>
                    <option value="real_estate">🏢 التطوير والاستثمار العقاري والمنازعات الهندسية</option>
                    <option value="customs_maritime">⚓ الشؤون البحرية والجمارك والملاحة الدولية</option>
                    <option value="custom">✨ تخصص حر مخصص (كتابة يدوية)</option>
                  </select>
                </div>

                {aiGenLegalDomain === "custom" && (
                  <div>
                    <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                      اكتب اسم التخصص أو القسم المطلوب:
                    </label>
                    <input
                      type="text"
                      value={aiGenCustomDomain}
                      onChange={e => setAiGenCustomDomain(e.target.value)}
                      placeholder="مثال: إدارة قضايا الملكية الفكرية وبراءات الاختراع..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-sans"
                    />
                  </div>
                )}

                {aiGenTargetType === "branch" && (
                  <div>
                    <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                      القسم المراد إلحاق الفرع به:
                    </label>
                    <select
                      value={aiGenSelectedSectionId}
                      onChange={e => setAiGenSelectedSectionId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold outline-none cursor-pointer"
                    >
                      {sections.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {aiGenTargetType === "section" && (
                  <div>
                    <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                      عدد الأفرع والواجهات التخصصية المراد توليدها:
                    </label>
                    <div className="flex items-center gap-3">
                      {[3, 4, 5, 6].map(count => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setAiGenBranchCount(count)}
                          className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition ${
                            aiGenBranchCount === count
                              ? "bg-amber-500 text-slate-950 shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {count} أفرع
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional instructions */}
                <div>
                  <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                    تعليمات أو متطلبات مخصصة للذكاء الاصطناعي (اختياري):
                  </label>
                  <textarea
                    rows={2}
                    value={aiGenCustomPrompt}
                    onChange={e => setAiGenCustomPrompt(e.target.value)}
                    placeholder="مثال: تضمين حقول لقيد أرقام التوكيلات، رسوم الخبراء، والربط مع أجندة الجلسات..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAiGeneratorModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteAiGeneration}
                    disabled={isGeneratingAiStructure}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGeneratingAiStructure ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>جاري التوليد والتحليل الذكي...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>بدء التوليد الفوري بالذكاء الاصطناعي</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: INTERACTIVE SUB-INTERFACE PREVIEW WITH DIRECT ADD               */}
      {/* ========================================================================= */}
      {previewSubInterface && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-black text-slate-400 uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                    {previewSubInterface.code}
                  </span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-black">
                    القسم: {previewSectionTitle}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  معاينة: {previewSubInterface.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewSubInterface(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">وصف الواجهة وقاعدة البيانات:</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {previewSubInterface.description || "واجهة مخصصة مرتبطة بمحرك إدارة المكتب."}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block mb-1">نوع العرض</span>
                  <span className="font-black text-slate-800 dark:text-white">{previewSubInterface.displayType}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block mb-1">عدد الحقول</span>
                  <span className="font-black text-slate-800 dark:text-white">{previewSubInterface.fieldsCount} حقول</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block mb-1">المصدر</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {previewSubInterface.isAiGenerated ? "الذكاء الاصطناعي" : "هيكل أساسي"}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block mb-1">الحالة</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">{previewSubInterface.status}</span>
                </div>
              </div>

              {/* Sample Mock Table / View Representation */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-indigo-500" />
                    <span>مخطط الحقول والبيانات المعتمدة:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">TABLE_SCHEMA_V1</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="p-3 font-black">#</th>
                        <th className="p-3 font-black">الحقل</th>
                        <th className="p-3 font-black">النوع البرمجي</th>
                        <th className="p-3 font-black">حالة الإلزام</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="p-3 font-mono">01</td>
                        <td className="p-3 font-black text-slate-800 dark:text-slate-200">المعرف الأساسي (ID)</td>
                        <td className="p-3 font-mono text-slate-500">UUID / String</td>
                        <td className="p-3 text-emerald-600 font-black">مطلوب (Primary)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono">02</td>
                        <td className="p-3 font-black text-slate-800 dark:text-slate-200">العنوان / الموضوع التعريفي</td>
                        <td className="p-3 font-mono text-slate-500">VARCHAR(255)</td>
                        <td className="p-3 text-emerald-600 font-black">مطلوب</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono">03</td>
                        <td className="p-3 font-black text-slate-800 dark:text-slate-200">تاريخ الإدخال والتحديث</td>
                        <td className="p-3 font-mono text-slate-500">TIMESTAMP (ISO8601)</td>
                        <td className="p-3 text-slate-500">تلقائي</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setPreviewSubInterface(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black cursor-pointer"
              >
                إغلاق
              </button>

              {/* DIRECT ADD BUTTON FROM PREVIEW */}
              <button
                onClick={() => {
                  handleAddSectionDirectlyToApp(previewSubInterface.title, previewSubInterface.id, previewSubInterface.code, "Layers");
                  setPreviewSubInterface(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ إضافة هذا الفرع كقسم مستقل للبرنامج فوراً 🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: ADD NEW MAIN SECTION (MANUAL)                                   */}
      {/* ========================================================================= */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">إضافة هيكل (قسم رئيسي) جديد</h3>
              <button onClick={() => setIsAddSectionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSectionSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">اسم القسم / الهيكل:</label>
                <input
                  type="text"
                  required
                  value={newSectionTitle}
                  onChange={e => setNewSectionTitle(e.target.value)}
                  placeholder="مثال: إدارة العقود والاتفاقيات الدولية"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">وصف القسم والغرض منه:</label>
                <textarea
                  rows={3}
                  value={newSectionDesc}
                  onChange={e => setNewSectionDesc(e.target.value)}
                  placeholder="شرح موجز لمهام وقواعد بيانات هذا القسم..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">الشارة (Badge):</label>
                  <input
                    type="text"
                    value={newSectionBadge}
                    onChange={e => setNewSectionBadge(e.target.value)}
                    placeholder="مثال: عقود وتوثيق"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">الأيقونة المعبرة:</label>
                  <select
                    value={newSectionIcon}
                    onChange={e => setNewSectionIcon(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="scale">⚖️ ميزان العدالة (قانوني)</option>
                    <option value="users">👥 علاقات وموكلين</option>
                    <option value="dollar">💰 ماليات وخزينة</option>
                    <option value="user-check">👔 موارد بشرية ومهام</option>
                    <option value="archive">📦 أرشيف ووثائق</option>
                    <option value="bot">🤖 ذكاء اصطناعي</option>
                    <option value="briefcase">💼 شركات واستثمار</option>
                    <option value="building">🏢 عقارات وبناء</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddSectionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 dark:text-slate-950 text-white font-black transition-colors shadow-sm cursor-pointer"
                >
                  حفظ وإنشاء الهيكل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: ADD NEW SUB-INTERFACE (MANUAL)                                   */}
      {/* ========================================================================= */}
      {isAddSubInterfaceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">إضافة واجهة فرعية جديدة</h3>
              <button onClick={() => setIsAddSubInterfaceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubInterfaceSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">اسم الواجهة الفرعية:</label>
                <input
                  type="text"
                  required
                  value={newSubTitle}
                  onChange={e => setNewSubTitle(e.target.value)}
                  placeholder="مثال: متابعة التنازلات وإقرارات الصلح"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">الرمز البرمجي (Code):</label>
                  <input
                    type="text"
                    value={newSubCode}
                    onChange={e => setNewSubCode(e.target.value)}
                    placeholder="مثال: SETTLEMENTS_LOG"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">نوع العرض:</label>
                  <select
                    value={newSubDisplayType}
                    onChange={e => setNewSubDisplayType(e.target.value as InterfaceDisplayType)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="جدول بيانات">جدول بيانات</option>
                    <option value="بطاقات تفاعلية">بطاقات تفاعلية</option>
                    <option value="لوحة تحليلية">لوحة تحليلية</option>
                    <option value="أجندة زمنية">أجندة زمنية</option>
                    <option value="نموذج إدخال">نموذج إدخال</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">وصف الحقول والمخرجات:</label>
                <textarea
                  rows={2}
                  value={newSubDesc}
                  onChange={e => setNewSubDesc(e.target.value)}
                  placeholder="تفاصيل الحقول والبيانات المراد تسجيلها..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <input
                  type="checkbox"
                  id="isAiToggle"
                  checked={newSubIsAi}
                  onChange={e => setNewSubIsAi(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="isAiToggle" className="text-xs font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer">
                  تمييز هذه الواجهة بأنها مولدة تلقائياً بواسطة الذكاء الاصطناعي
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddSubInterfaceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-sm cursor-pointer"
                >
                  إضافة الواجهة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SystemStructuresExpansionView;
