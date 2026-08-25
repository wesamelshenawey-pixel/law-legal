import React, { useState, useEffect } from "react";
import { CaseRecord, ClientProfile, SessionRecord, PlatformUser, UserRole } from "../types";
import { 
  getStoredWorkspaceToken, 
  getLocalKeepMemos, 
  saveLocalKeepMemo, 
  deleteLocalKeepMemo, 
  GoogleKeepNote 
} from "../utils/workspaceService";
import { 
  Bookmark, 
  Plus, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Calendar, 
  Scale, 
  CheckSquare, 
  Square, 
  Share2, 
  Printer, 
  Tag, 
  Clock, 
  ShieldCheck, 
  FileText,
  FileCheck2,
  RefreshCw,
  Lock,
  Download
} from "lucide-react";

interface GoogleKeepHubProps {
  currentUser: PlatformUser;
  cases: CaseRecord[];
  clients: ClientProfile[];
  sessions: SessionRecord[];
  language: "ar" | "en";
}

const KEEP_COLORS = [
  { id: "amber", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-400" },
  { id: "emerald", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-400" },
  { id: "blue", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-400" },
  { id: "purple", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-400" },
  { id: "rose", bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-200 dark:border-rose-800", dot: "bg-rose-400" },
  { id: "slate", bg: "bg-slate-50 dark:bg-slate-800/60", border: "border-slate-200 dark:border-slate-700", dot: "bg-slate-400" }
];

const PRESET_LEGAL_TEMPLATES = [
  {
    titleAr: "📋 قائمة تحضير مستندات جلسة المحكمة",
    titleEn: "📋 Court Session Document Checklist",
    tag: "جلسة محكمة",
    content: "1. أصل عريضة الدعوى المعلنة قانوناً.\n2. حافظة مستندات بها أصل التوكيل الموثق.\n3. مذكرة الدفوع القانونية من 3 نسخ.\n4. شهادة رسمية من جدول النيابة أو المحكمة."
  },
  {
    titleAr: "⚖️ عناصر مذكرة الدفاع والترافع الشفوي",
    titleEn: "⚖️ Defense Brief & Oral Arguments",
    tag: "مذكرة دفاع",
    content: "• الدفع الشكلي: بطلان إجراءات التحري والقبض.\n• الدفع الموضوعي: انتفاء القصد الجنائي وركن التسليم.\n• الطلب الختامي: القضاء ببراءة المتهم أصلياً وإلزام الشاكي بالمصروفات."
  },
  {
    titleAr: "📝 بنود اتفاق وتصالح مدني / أسري",
    titleEn: "📝 Settlement & Reconciliation Terms",
    tag: "تسوية ودية",
    content: "1. إقرار الطرفين بإنهاء كافة النزاعات القضائية المقامة بينهما.\n2. تحديد جدول سداد الأقساط الشهرية بشيكات بنكية.\n3. التنازل المتبادل أمام قلم كتاب المحكمة المختصة."
  }
];

export default function GoogleKeepHub({
  currentUser,
  cases,
  clients,
  sessions,
  language = "ar"
}: GoogleKeepHubProps) {
  const [notes, setNotes] = useState<GoogleKeepNote[]>(() => getLocalKeepMemos());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedColor, setSelectedColor] = useState<string>("amber");

  // New Note Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTag, setNewTag] = useState("مذكرة قضائية");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setNotes(getLocalKeepMemos());
  }, []);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;

    const matchedCase = cases.find(c => c.id === selectedCaseId);

    const newNote: GoogleKeepNote = {
      id: `keep-${Date.now()}`,
      title: newTitle.trim() || (language === "ar" ? "مذكرة بدون عنوان" : "Untitled Note"),
      content: newContent.trim(),
      tags: [newTag],
      caseNumber: matchedCase?.caseNumber,
      clientName: matchedCase?.clientName,
      createdAt: new Date().toISOString(),
      color: selectedColor
    };

    saveLocalKeepMemo(newNote);
    setNotes(getLocalKeepMemos());

    // Reset Form
    setNewTitle("");
    setNewContent("");
    setSelectedCaseId("");
    setIsCreating(false);
  };

  const handleDeleteNote = (id: string) => {
    if (confirm(language === "ar" ? "هل تريد حذف هذه المذكرة من Google Keep؟" : "Delete this Google Keep note?")) {
      deleteLocalKeepMemo(id);
      setNotes(getLocalKeepMemos());
    }
  };

  const handleCopyToClipboard = (note: GoogleKeepNote) => {
    const textToCopy = `${note.title}\n${note.content}${note.caseNumber ? `\n[قضية رقم: ${note.caseNumber} - ${note.clientName}]` : ""}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenGoogleKeepWeb = (note?: GoogleKeepNote) => {
    if (note) {
      handleCopyToClipboard(note);
    }
    window.open("https://keep.google.com/", "_blank");
  };

  const handleApplyTemplate = (tmpl: typeof PRESET_LEGAL_TEMPLATES[0]) => {
    setNewTitle(language === "ar" ? tmpl.titleAr : tmpl.titleEn);
    setNewContent(tmpl.content);
    setNewTag(tmpl.tag);
    setIsCreating(true);
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.clientName && n.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (n.caseNumber && n.caseNumber.includes(searchTerm));
    
    const matchesTag = selectedTag === "all" || (n.tags && n.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div id="google-keep-legal-hub" className="space-y-6 text-right font-sans" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Top Banner & Quick Keep Launch */}
      <div className="bg-gradient-to-l from-amber-500/15 via-yellow-500/5 to-transparent p-6 rounded-3xl border border-amber-500/30 shadow-xs relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-xs">
                <Bookmark className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {language === "ar" ? "مذكرات وقوائم Google Keep القضائية" : "Google Keep Legal Notes Hub"}
              </h3>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold font-sans">
                Google Keep Sync ⚡
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              {language === "ar"
                ? "إدارة وتدوين مسودات المرافعات، قوائم تحضير الجلسات، والملاحظات السريعة مع المزامنة السحابية والتكامل مع خدمة Google Keep الرسمية."
                : "Manage and draft oral arguments, session checklists, and instant case notes with cloud backup and Google Keep integration."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenGoogleKeepWeb()}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-4 h-4 text-amber-600" />
              <span>{language === "ar" ? "فتح موقع Google Keep الرسمي ↗" : "Open Google Keep Web ↗"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>{language === "ar" ? "مذكرة Keep جديدة" : "New Keep Note"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Legal Templates Quick Bar */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
          ✨ {language === "ar" ? "قوالب ومسودات قانونية جاهزة لـ Google Keep:" : "Ready Legal Templates for Google Keep:"}
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {PRESET_LEGAL_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 rounded-xl border border-slate-200/80 dark:border-slate-800 text-right transition cursor-pointer flex flex-col justify-between group"
            >
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-400">
                {language === "ar" ? tmpl.titleAr : tmpl.titleEn}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-mono">{tmpl.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* New Note Creation Modal / Panel */}
      {isCreating && (
        <form onSubmit={handleCreateNote} className="p-5 bg-white dark:bg-slate-850 rounded-2xl border-2 border-amber-500/60 space-y-4 shadow-xl animate-fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{language === "ar" ? "إنشاء مذكرة Google Keep جديدة" : "Create New Google Keep Note"}</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === "ar" ? "عنوان المذكرة أو الموضوع" : "Note Title"}
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={language === "ar" ? "مثال: مرافعة جلسة الخميس، شهود إثبات القضية..." : "e.g. Hearing Defense, Witness List..."}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 text-right"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === "ar" ? "ربط بقضية مسجلة (اختياري)" : "Link to Case (Optional)"}
              </label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 text-right"
              >
                <option value="">{language === "ar" ? "-- بدون ربط --" : "-- No link --"}</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    دعوى {c.caseNumber} - {c.clientName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === "ar" ? "محتوى المذكرة / قائمة المهام" : "Note Content / Checklist Items"}
            </label>
            <textarea
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={language === "ar" ? "اكتب بنود المذكرة أو القائمة هنا..." : "Type note points or checklist items..."}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 text-right leading-relaxed"
              required
            />
          </div>

          {/* Color & Tag Palette Selection */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">{language === "ar" ? "لون بطاقة Keep:" : "Keep Color:"}</span>
              <div className="flex gap-1.5">
                {KEEP_COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    className={`w-6 h-6 rounded-full ${c.dot} border-2 transition ${
                      selectedColor === c.id ? "ring-2 ring-amber-500 scale-110" : "opacity-80 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Bookmark className="w-4 h-4" />
                <span>{language === "ar" ? "حفظ المذكرة السحابية" : "Save Keep Note"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === "ar" ? "بحث في مذكرات Keep بالعنوان، المحتوى، أو رقم القضية..." : "Search Keep notes..."}
            className="w-full pr-9 pl-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 text-right"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold">{notes.length} {language === "ar" ? "مذكرة مسجلة" : "notes"}</span>
        </div>
      </div>

      {/* NOTES GRID */}
      {filteredNotes.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-bold text-slate-500">
            {language === "ar" ? "لا توجد مذكرات مطابقة لبحثك في Google Keep حالياً." : "No Google Keep notes found."}
          </p>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
          >
            {language === "ar" ? "➕ إنشاء أول مذكرة الآن" : "➕ Create First Note"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const colorTheme = KEEP_COLORS.find(c => c.id === note.color) || KEEP_COLORS[0];
            const isCopied = copiedId === note.id;

            return (
              <div
                key={note.id}
                id={`keep-card-${note.id}`}
                className={`p-4 rounded-2xl border ${colorTheme.bg} ${colorTheme.border} flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md transition-all duration-200 text-right relative group`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex-1 leading-snug">
                      {note.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 font-mono">
                      {note.tags?.[0] || "مذكرة"}
                    </span>
                  </div>

                  {/* Case / Client Link Badge */}
                  {note.caseNumber && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-900 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/70 px-2 py-0.5 rounded-md font-bold">
                      <Scale className="w-3 h-3" />
                      <span>دعوى رقم {note.caseNumber} - {note.clientName}</span>
                    </div>
                  )}

                  {/* Content body */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {note.content}
                  </p>
                </div>

                {/* Footer action tools */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] font-sans">
                  <span className="text-[9px] text-slate-400 font-mono">
                    {new Date(note.createdAt).toLocaleDateString("ar-EG")}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(note)}
                      className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                      title={language === "ar" ? "نسخ نص المذكرة" : "Copy Content"}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenGoogleKeepWeb(note)}
                      className="px-2 py-1 bg-amber-500/90 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1"
                      title={language === "ar" ? "فتح في Google Keep الرسمي" : "Open in Google Keep"}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Keep ↗</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer opacity-60 group-hover:opacity-100"
                      title={language === "ar" ? "حذف المذكرة" : "Delete"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
