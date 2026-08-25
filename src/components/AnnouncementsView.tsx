import React, { useState } from "react";
import { Announcement, PlatformUser, UserRole } from "../types";
import { 
  Megaphone, 
  Plus, 
  Pin, 
  Calendar, 
  Tag, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Trash2, 
  Share2, 
  Printer, 
  Search,
  SlidersHorizontal,
  Flame
} from "lucide-react";
import QRCode from "qrcode";
import { generateEntityCode } from "../utils/qrHelper";

interface AnnouncementsViewProps {
  announcements: Announcement[];
  onAddAnnouncement: (ann: Announcement) => void;
  onDeleteAnnouncement?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onToggleTicker?: (id: string) => void;
  currentUser: PlatformUser;
  language: "ar" | "en";
}

export default function AnnouncementsView({
  announcements,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onTogglePin,
  onToggleTicker,
  currentUser,
  language
}: AnnouncementsViewProps) {
  const isAdminOrStaff = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.STAFF;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Announcement form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"urgent" | "general" | "court" | "administrative">("court");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("high");
  const [isPinned, setIsPinned] = useState(false);
  const [showInTicker, setShowInTicker] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("يرجى كتابة عنوان ونص الإعلان بشكل كامل.");
      return;
    }

    const newAnn: Announcement = {
      id: "ANN-" + Date.now(),
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      date: new Date().toISOString().split("T")[0],
      isPinned,
      showInTicker,
      author: currentUser.name || "إدارة ديوان المحاماة"
    };

    onAddAnnouncement(newAnn);
    setShowAddModal(false);
    setTitle("");
    setContent("");
    setIsPinned(false);
    setShowInTicker(true);
    alert("تم نشر الإعلان بنجاح وتفعيله على الشريط الإعلاني العلوي لكافة المستخدمين!");
  };

  const filtered = announcements.filter(a => {
    const matchQuery = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === "all" || a.category === filterCategory;
    return matchQuery && matchCat;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "urgent":
        return "bg-red-600 text-white border-red-500";
      case "court":
        return "bg-amber-600 text-white border-amber-500";
      case "administrative":
        return "bg-blue-600 text-white border-blue-500";
      default:
        return "bg-emerald-600 text-white border-emerald-500";
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "urgent": return "إعلان عاجل ومهم";
      case "court": return "تعميم جلسات وقرارات محاكم";
      case "administrative": return "تعليمات إدارية وتنظيمية";
      default: return "بيان عام للموكلين";
    }
  };

  return (
    <div className="space-y-6 font-sans text-right" dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* Top Header Toolbar with Extracted Buttons */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
            <Megaphone className="w-5 h-5" />
          </span>
          <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white">ديوان الإعلانات والتعميمات القضائية</h2>
        </div>

        <div className="flex items-center gap-2">
          {isAdminOrStaff && (
            <button
              id="add-announcement-btn"
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>إدراج إعلان / تعميم جديد</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-500" />
            <span>طباعة اللائحة</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في نص أو عنوان الإعلانات القضائية والتعميمات..."
            className="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterCategory === "all" ? "bg-red-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            الكل ({announcements.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory("urgent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterCategory === "urgent" ? "bg-red-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            🔥 عاجل
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory("court")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterCategory === "court" ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            ⚖️ قرارات محاكم
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory("administrative")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterCategory === "administrative" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            📑 شؤون إدارية
          </button>
        </div>
      </div>

      {/* Announcements Grid with Dynamic Tonal Card Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ann, idx) => {
          // Palette tone variations
          const cardTones = [
            "bg-[#fcf8ec] dark:bg-[#201d14] border-[#ebd498] text-amber-950 dark:text-amber-100",
            "bg-[#f0f9ff] dark:bg-[#0c1f30] border-[#93cbe8] text-sky-950 dark:text-sky-100",
            "bg-[#fef2f2] dark:bg-[#281414] border-[#f8a8a8] text-rose-950 dark:text-rose-100",
            "bg-[#f0fdf4] dark:bg-[#122818] border-[#a3e4b7] text-emerald-950 dark:text-emerald-100",
            "bg-[#faf5ff] dark:bg-[#23152e] border-[#d8b4fe] text-purple-950 dark:text-purple-100",
          ];
          const tone = cardTones[idx % cardTones.length];

          return (
            <div
              key={ann.id}
              className={`p-5 rounded-2xl border shadow-md flex flex-col justify-between transition-all hover:shadow-xl relative ${tone}`}
            >
              {/* Header Badges */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow-sm ${getCategoryColor(ann.category)}`}>
                  {getCategoryLabel(ann.category)}
                </span>

                <div className="flex items-center gap-1.5">
                  {ann.isPinned && (
                    <span className="p-1 bg-amber-400 text-slate-950 rounded-md text-[10px] font-black" title="مثبت في الصدارة">
                      📌
                    </span>
                  )}
                  {ann.showInTicker && (
                    <span className="p-1 bg-red-600 text-white rounded-md text-[10px] font-black" title="معروض على الشريط الإعلاني">
                      📢
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-2 mb-4">
                <h3 className="text-base font-black leading-snug">
                  {ann.title}
                </h3>
                <p className="text-xs leading-relaxed opacity-90 whitespace-pre-line font-medium">
                  {ann.content}
                </p>
              </div>

              {/* Meta & Footer Controls */}
              <div className="pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[11px] font-bold opacity-80">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-600" />
                    <span>{ann.date}</span>
                  </span>
                  <span>•</span>
                  <span>{ann.author}</span>
                </div>

                {isAdminOrStaff && onDeleteAnnouncement && (
                  <button
                    type="button"
                    onClick={() => onDeleteAnnouncement(ann.id)}
                    className="p-1 hover:bg-red-500 hover:text-white rounded text-red-600 transition cursor-pointer"
                    title="حذف الإعلان"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <Megaphone className="w-12 h-12 mx-auto text-slate-400 mb-2 opacity-50" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">لا توجد إعلانات مطابقة لخيارات البحث الحالية</p>
        </div>
      )}

      {/* Add Announcement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-right animate-in zoom-in-95 duration-150 font-sans">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-xl">
                  <Megaphone className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">نشر إعلان / تعميم قضائي جديد</h3>
                  <p className="text-[11px] text-slate-500">سيظهر في الشريط الإعلاني العلوي لكافة المستخدمين</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  عنوان الإعلان *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تعليق الجلسات بمحكمة استئناف القاهرة نظراً للعطلة الرسمية..."
                  className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  نص وتفاصيل الإعلان *
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب التوجيهات أو أرقام الدوائر أو التعليمات القانونية الموجهة للموكلين والمحامين بالتفصيل..."
                  className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    تصنيف الإعلان
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    <option value="court">⚖️ قرارات محاكم وجلسات</option>
                    <option value="urgent">🔥 عاجل وهام جداً</option>
                    <option value="administrative">📑 شؤون إدارية وتنظيمية</option>
                    <option value="general">📢 بيان عام للموكلين</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    درجة الأهمية
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    <option value="high">🔴 عاجل وقصوى</option>
                    <option value="medium">🟡 متوسطة / تنبيه</option>
                    <option value="low">🟢 إشعار عادي</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInTicker}
                    onChange={(e) => setShowInTicker(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span>عرض فوراً في الشريط الإعلاني العلوي</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span>تثبيت في مقدمة القائمة 📌</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
                >
                  اعتماد ونشر الإعلان الآن
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
