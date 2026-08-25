import React, { useState } from "react";
import { CaseRecord, CaseMilestone, PlatformUser, UserRole } from "../types";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  Scale, 
  Gavel, 
  FileText, 
  ArrowUpRight, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  Check, 
  X,
  Sparkles,
  Building2,
  FileCheck2,
  Send,
  Flag
} from "lucide-react";

interface CaseTimelineProps {
  caseRecord: CaseRecord;
  onUpdateCase?: (id: string, updatedFields: Partial<CaseRecord>) => void;
  currentUser: PlatformUser;
  language: "ar" | "en";
  onSendNotification?: (milestone: CaseMilestone) => void;
}

const DEFAULT_MILESTONES: { type: CaseMilestone["type"]; titleAr: string; titleEn: string; defaultStatus: CaseMilestone["status"] }[] = [
  { type: "registered", titleAr: "قيد الدعوى وتسجيلها رسميّاً", titleEn: "Case Registered", defaultStatus: "completed" },
  { type: "first_session", titleAr: "الجلسة الأولى والمرافعة الافتتاحية", titleEn: "First Session", defaultStatus: "in_progress" },
  { type: "judgment", titleAr: "صدور الحكم القضائي", titleEn: "Judgment Issued", defaultStatus: "upcoming" },
  { type: "appeal", titleAr: "الطعن والاستئناف / النقض", titleEn: "Appeal Filed", defaultStatus: "pending" }
];

export default function CaseTimeline({
  caseRecord,
  onUpdateCase,
  currentUser,
  language = "ar",
  onSendNotification
}: CaseTimelineProps) {
  // Ensure we have milestones, generating defaults if none exist
  const milestones: CaseMilestone[] = React.useMemo(() => {
    if (caseRecord.timeline && caseRecord.timeline.length > 0) {
      return caseRecord.timeline;
    }
    // Generate default structured milestones from case record
    const regDate = caseRecord.createdAt ? caseRecord.createdAt.split("T")[0] : new Date().toISOString().split("T")[0];
    const sessionDate = caseRecord.nextSessionDate || new Date().toISOString().split("T")[0];
    
    return [
      {
        id: `m-${caseRecord.id}-1`,
        type: "registered",
        title: "قيد الدعوى وتسجيلها رسميّاً",
        titleEn: "Case Registered",
        date: regDate,
        status: "completed",
        decisionOrNotes: `تم قيد الدعوى رقم ${caseRecord.caseNumber} لسنة ${caseRecord.caseYear} بجدول ${caseRecord.competentCourt}`,
        circuitOrCourt: caseRecord.competentCourt,
        completedAt: regDate
      },
      {
        id: `m-${caseRecord.id}-2`,
        type: "first_session",
        title: "الجلسة الأولى والمرافعة الافتتاحية",
        titleEn: "First Session",
        date: sessionDate,
        status: "in_progress",
        decisionOrNotes: "جلسة مرافعة وتقديم المستندات وسماع الدفوع أمام هيئة المحكمة.",
        circuitOrCourt: caseRecord.competentCourt
      },
      {
        id: `m-${caseRecord.id}-3`,
        type: "judgment",
        title: "صدور الحكم القضائي",
        titleEn: "Judgment Issued",
        date: "",
        status: "upcoming",
        decisionOrNotes: "جلسة النطق بالحكم النهائي في موضوع الدعوى."
      },
      {
        id: `m-${caseRecord.id}-4`,
        type: "appeal",
        title: "الطعن والاستئناف / النقض",
        titleEn: "Appeal Filed",
        date: "",
        status: "pending",
        decisionOrNotes: "الطعن بالاستئناف أو النقض ومتابعة إجراءات الإعلان والصحيفة."
      }
    ];
  }, [caseRecord]);

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  
  // Custom milestone form state
  const [customTitle, setCustomTitle] = useState("");
  const [customDate, setCustomDate] = useState(new Date().toISOString().split("T")[0]);
  const [customType, setCustomType] = useState<CaseMilestone["type"]>("custom");
  const [customStatus, setCustomStatus] = useState<CaseMilestone["status"]>("upcoming");
  const [customNotes, setCustomNotes] = useState("");
  const [customCircuit, setCustomCircuit] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<CaseMilestone["status"]>("pending");
  const [editNotes, setEditNotes] = useState("");
  const [editCircuit, setEditCircuit] = useState("");

  // Calculate completed progress
  const completedCount = milestones.filter(m => m.status === "completed").length;
  const progressPercent = Math.round((completedCount / Math.max(milestones.length, 1)) * 100);

  const canEdit = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SENIOR_LAWYER || currentUser.role === UserRole.ASSOCIATE_LAWYER || currentUser.role === UserRole.SECRETARY;

  const handleUpdateMilestoneStatus = (milestoneId: string, newStatus: CaseMilestone["status"]) => {
    if (!onUpdateCase) return;
    const updated = milestones.map(m => {
      if (m.id === milestoneId) {
        return {
          ...m,
          status: newStatus,
          completedAt: newStatus === "completed" ? (m.completedAt || new Date().toISOString()) : undefined
        };
      }
      return m;
    });
    onUpdateCase(caseRecord.id, { timeline: updated });
  };

  const handleSaveEdit = (milestoneId: string) => {
    if (!onUpdateCase) return;
    const updated = milestones.map(m => {
      if (m.id === milestoneId) {
        return {
          ...m,
          title: editTitle || m.title,
          date: editDate,
          status: editStatus,
          decisionOrNotes: editNotes,
          circuitOrCourt: editCircuit,
          completedAt: editStatus === "completed" ? (m.completedAt || new Date().toISOString()) : undefined
        };
      }
      return m;
    });
    onUpdateCase(caseRecord.id, { timeline: updated });
    setEditingMilestoneId(null);
  };

  const startEdit = (m: CaseMilestone) => {
    setEditingMilestoneId(m.id);
    setEditTitle(m.title);
    setEditDate(m.date || "");
    setEditStatus(m.status);
    setEditNotes(m.decisionOrNotes || "");
    setEditCircuit(m.circuitOrCourt || "");
  };

  const handleAddCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !onUpdateCase) return;

    const newMilestone: CaseMilestone = {
      id: `m-${caseRecord.id}-${Date.now()}`,
      type: customType,
      title: customTitle.trim(),
      date: customDate,
      status: customStatus,
      decisionOrNotes: customNotes.trim(),
      circuitOrCourt: customCircuit.trim(),
      completedAt: customStatus === "completed" ? new Date().toISOString() : undefined
    };

    const updated = [...milestones, newMilestone];
    onUpdateCase(caseRecord.id, { timeline: updated });
    
    // Reset form
    setCustomTitle("");
    setCustomNotes("");
    setCustomCircuit("");
    setIsAddingCustom(false);
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    if (!onUpdateCase) return;
    if (confirm(language === "ar" ? "هل أنت متأكد من حذف هذه المحطة من الجدول الزمني؟" : "Are you sure you want to remove this milestone?")) {
      const updated = milestones.filter(m => m.id !== milestoneId);
      onUpdateCase(caseRecord.id, { timeline: updated });
    }
  };

  const handlePrintTimeline = () => {
    window.print();
  };

  const getMilestoneIcon = (type: CaseMilestone["type"], status: CaseMilestone["status"]) => {
    if (status === "completed") {
      return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
    if (status === "in_progress") {
      return <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />;
    }
    if (type === "judgment") {
      return <Gavel className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
    if (type === "appeal") {
      return <Flag className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
    if (type === "registered") {
      return <FileCheck2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
    return <Clock className="w-5 h-5 text-slate-400" />;
  };

  const getStatusBadge = (status: CaseMilestone["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <Check className="w-3 h-3" />
            {language === "ar" ? "مكتملة رسميّاً" : "Completed"}
          </span>
        );
      case "in_progress":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" />
            {language === "ar" ? "المرحلة الحالية النشطة" : "In Progress"}
          </span>
        );
      case "upcoming":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-600" />
            {language === "ar" ? "مرحلة قادمة" : "Upcoming"}
          </span>
        );
      case "pending":
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {language === "ar" ? "قيد الانتظار" : "Pending"}
          </span>
        );
    }
  };

  return (
    <div id={`case-timeline-${caseRecord.id}`} className="space-y-4 text-right font-sans" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header & Progress Bar */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-50 to-amber-500/5 dark:from-slate-800 dark:to-slate-900 p-4 rounded-2xl border border-amber-500/20 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="p-1.5 bg-amber-500 text-slate-950 rounded-lg">
                <Scale className="w-4 h-4" />
              </span>
              <span>{language === "ar" ? "الجدول الزمني التفاعلي ومحطات التقاضي" : "Interactive Case Milestones Timeline"}</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {language === "ar"
                ? `متابعة مسار القضية رقم ${caseRecord.caseNumber} لسنة ${caseRecord.caseYear} عبر المحطات الإجرائية الأربعة الرئيسية.`
                : `Tracking case #${caseRecord.caseNumber} across the 4 key procedural milestones.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintTimeline}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={language === "ar" ? "طباعة مسار القضية" : "Print Timeline"}
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === "ar" ? "طباعة" : "Print"}</span>
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsAddingCustom(!isAddingCustom)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === "ar" ? "إضافة محطة مخصصة" : "Add Milestone"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-3">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-slate-600 dark:text-slate-300">
              {language === "ar" ? "نسبة إنجاز مراحل التقاضي:" : "Case Stage Completion:"}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-mono font-black">
              {completedCount} / {milestones.length} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add Custom Milestone Form */}
      {isAddingCustom && (
        <form onSubmit={handleAddCustomMilestone} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-700 space-y-3 shadow-md">
          <div className="flex justify-between items-center">
            <h5 className="text-xs font-black text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{language === "ar" ? "إضافة مرحلة أو محطة قضائية مخصصة" : "Add Custom Procedural Milestone"}</span>
            </h5>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === "ar" ? "عنوان المرحلة القضائية *" : "Milestone Title *"}
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={language === "ar" ? "مثال: ورود تقرير الخبير الحسابي، سماع شهود الإثبات..." : "e.g., Expert Witness Report, Witness Testimony..."}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-amber-500 text-right"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === "ar" ? "تاريخ الاستحقاق أو الجلسة" : "Target Date"}
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-amber-500 font-mono text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === "ar" ? "الحالة التنفيذية" : "Status"}
              </label>
              <select
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value as CaseMilestone["status"])}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-amber-500 text-right"
              >
                <option value="completed">{language === "ar" ? "مكتملة ومستوفاة" : "Completed"}</option>
                <option value="in_progress">{language === "ar" ? "جارية ومحددة بجلسة قريبة" : "In Progress"}</option>
                <option value="upcoming">{language === "ar" ? "قادمة ومترقبة" : "Upcoming"}</option>
                <option value="pending">{language === "ar" ? "قيد الانتظار والترتيب" : "Pending"}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === "ar" ? "الدائرة القضائية / القاعة" : "Court Circuit / Room"}
              </label>
              <input
                type="text"
                value={customCircuit}
                onChange={(e) => setCustomCircuit(e.target.value)}
                placeholder={language === "ar" ? "مثال: الدائرة الثالثة - قاعة 4" : "e.g. 3rd Circuit - Courtroom 4"}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-amber-500 text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === "ar" ? "تفاصيل وملاحظات المرحلة أو منطوق القرار" : "Decision, notes or brief"}
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder={language === "ar" ? "أدخل تفاصيل القرار، الطلبات المطلوب تقديمها، أو ملخص الحكم..." : "Enter decision notes, required briefs, or ruling summary..."}
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-amber-500 text-right"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs transition cursor-pointer shadow-sm"
            >
              {language === "ar" ? "حفظ وتثبيت المرحلة" : "Save Milestone"}
            </button>
          </div>
        </form>
      )}

      {/* VERTICAL INTERACTIVE TIMELINE LIST */}
      <div className="relative pl-2 pr-2 py-2">
        {/* Continuous vertical connecting line */}
        <div 
          className="absolute right-6 top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800"
          style={{ right: language === "ar" ? "24px" : "auto", left: language === "ar" ? "auto" : "24px" }}
        />

        <div className="space-y-4 relative">
          {milestones.map((m, index) => {
            const isEditing = editingMilestoneId === m.id;
            const isCompleted = m.status === "completed";
            const isInProgress = m.status === "in_progress";

            return (
              <div
                key={m.id}
                id={`timeline-milestone-${m.id}`}
                className={`relative flex items-start gap-4 transition-all duration-200 group ${
                  language === "ar" ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {/* Milestone Node Badge on the vertical line */}
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-transform duration-300 shadow-md ${
                    isCompleted 
                      ? "bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950"
                      : isInProgress
                      ? "bg-amber-500 text-slate-950 ring-4 ring-amber-100 dark:ring-amber-950 animate-pulse scale-105"
                      : "bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400"
                  }`}
                >
                  {getMilestoneIcon(m.type, m.status)}
                </div>

                {/* Milestone Content Card */}
                <div 
                  className={`flex-1 p-4 rounded-2xl border transition-all duration-200 text-right shadow-xs ${
                    isInProgress
                      ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 ring-1 ring-amber-400/30"
                      : isCompleted
                      ? "bg-white dark:bg-slate-850 border-emerald-200 dark:border-emerald-900/50"
                      : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-80 group-hover:opacity-100"
                  }`}
                >
                  {isEditing ? (
                    /* Inline Editing Mode */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">{language === "ar" ? "المسمى" : "Title"}</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 rounded text-xs text-right"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">{language === "ar" ? "التاريخ" : "Date"}</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 rounded text-xs font-mono text-center"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">{language === "ar" ? "الحالة" : "Status"}</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as CaseMilestone["status"])}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 rounded text-xs text-right"
                          >
                            <option value="completed">{language === "ar" ? "مكتملة" : "Completed"}</option>
                            <option value="in_progress">{language === "ar" ? "جارية ونشطة" : "In Progress"}</option>
                            <option value="upcoming">{language === "ar" ? "قادمة" : "Upcoming"}</option>
                            <option value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">{language === "ar" ? "المحكمة / الدائرة" : "Court / Circuit"}</label>
                          <input
                            type="text"
                            value={editCircuit}
                            onChange={(e) => setEditCircuit(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 rounded text-xs text-right"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">{language === "ar" ? "القرار / الملاحظات" : "Notes / Decision"}</label>
                        <textarea
                          rows={2}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 rounded text-xs text-right"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingMilestoneId(null)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-bold"
                        >
                          {language === "ar" ? "إلغاء" : "Cancel"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(m.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                        >
                          {language === "ar" ? "حفظ التعديلات" : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                            {language === "ar" ? m.title : (m.titleEn || m.title)}
                          </span>
                          {getStatusBadge(m.status)}
                        </div>

                        {/* Interactive Status Quick Toggles */}
                        {canEdit && (
                          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Mark complete button */}
                            {m.status !== "completed" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateMilestoneStatus(m.id, "completed")}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200 transition cursor-pointer flex items-center gap-0.5"
                                title={language === "ar" ? "تعليم كمكتمل" : "Mark Complete"}
                              >
                                <Check className="w-3 h-3" />
                                <span>{language === "ar" ? "إتمام" : "Done"}</span>
                              </button>
                            )}

                            {/* Mark in progress button */}
                            {m.status !== "in_progress" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateMilestoneStatus(m.id, "in_progress")}
                                className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[10px] font-bold border border-amber-200 transition cursor-pointer flex items-center gap-0.5"
                                title={language === "ar" ? "تعيين كمرحلة حالية" : "Set Active"}
                              >
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>{language === "ar" ? "نشط" : "Active"}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => startEdit(m)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition cursor-pointer"
                              title={language === "ar" ? "تعديل بيانات المحطة" : "Edit"}
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>

                            {m.type === "custom" && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMilestone(m.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded transition cursor-pointer"
                                title={language === "ar" ? "حذف" : "Delete"}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Date & Court info */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                        {m.date && (
                          <span className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            {m.date}
                          </span>
                        )}

                        {m.circuitOrCourt && (
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {m.circuitOrCourt}
                          </span>
                        )}

                        {m.completedAt && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            ✓ {language === "ar" ? `تم الاعتماد: ${new Date(m.completedAt).toLocaleDateString("ar-EG")}` : `Verified: ${new Date(m.completedAt).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>

                      {/* Decision or description block */}
                      {m.decisionOrNotes && (
                        <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          <p className="whitespace-pre-wrap">{m.decisionOrNotes}</p>
                        </div>
                      )}

                      {/* Notify Client trigger if provided */}
                      {onSendNotification && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => onSendNotification(m)}
                            className="text-[10px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>{language === "ar" ? "إرسال إشعار بريدي للموكل بتحديث هذه المرحلة" : "Notify Client"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
