import React, { useState, useRef } from "react";
import { PlatformUser, CaseRecord, SessionRecord } from "../types";
import {
  Facebook,
  Upload,
  Search,
  Highlighter,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  CheckCircle2,
  Calendar,
  Building2,
  FileImage,
  Share2,
  Filter,
  Download,
  Scale,
  RefreshCw
} from "lucide-react";

interface FacebookSessionImporterProps {
  currentUser: PlatformUser;
  cases: CaseRecord[];
  onAddSession?: (newSession: SessionRecord) => void;
  language: "ar" | "en";
}

interface FacebookCourtPost {
  id: string;
  sourceGroup: string;
  author: string;
  timeAgo: string;
  caption: string;
  courtName: string;
  sessionDate: string;
  imageUrl: string;
  rollLines: string[];
}

export default function FacebookSessionImporter({
  currentUser,
  cases,
  onAddSession,
  language = "ar"
}: FacebookSessionImporterProps) {
  // Preset Facebook Court Feed posts
  const [feedPosts] = useState<FacebookCourtPost[]>([
    {
      id: "fb_post_1",
      sourceGroup: "جروب نقابة محامين الشرقية - محكمة ههيا الجزئية",
      author: "أمين سر محكمة جنح ههيا",
      timeAgo: "منذ 45 دقيقة",
      caption: "رول جلسة اليوم جنح ههيا الجزئية - الدائرة الأولى برئاسة السيد المستشار رئيس المحكمة.",
      courtName: "محكمة ههيا الجزئية - جنح",
      sessionDate: new Date().toISOString().split("T")[0],
      imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
      rollLines: [
        "1. رول رقم 1 - جنحة 1024 لسنة 2026 - تهمة تبديد - قرار: حجز للحكم لآخر الجلسة",
        "2. رول رقم 4 - جنحة 3420 لسنة 2026 - الأستاذ وسام الشناوي عن المتهم - قرار: التأجيل لتقديم المذكرات وسداد الأمانة",
        "3. رول رقم 8 - جنحة 5120 لسنة 2026 - إيصال أمانة - قرار: ندب خبير أبحاث التزييف والتزوير",
        "4. رول رقم 12 - جنحة 6033 لسنة 2026 - الأستاذ وسام الشناوي بالنقض - قرار: البراءة ورفض الدعوى المدنية",
        "5. رول رقم 15 - جنحة 7810 لسنة 2026 - سرقة تيار - قرار: التصالح وانقضاء الدعوى الجنائية",
        "6. رول رقم 19 - جنحة 9012 لسنة 2026 - شيك بدون رصيد - قرار: تأجيل لإعلان الخصم"
      ]
    },
    {
      id: "fb_post_2",
      sourceGroup: "صفحة كشوف رول محكمة الزقازيق الابتدائية والاستئناف",
      author: "قلم كتاب مأمورية الاستئناف",
      timeAgo: "منذ ساعتين",
      caption: "كشف رول جلسات الدائرة 4 مدني مستأنف الزقازيق المنعقدة بمجمع المحاكم.",
      courtName: "محكمة الزقازيق الابتدائية - استئناف مدني",
      sessionDate: new Date().toISOString().split("T")[0],
      imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80",
      rollLines: [
        "1. رول رقم 3 - استئناف 215 لسنة 2026 مدني - قرار: إحالة لمكتب الخبراء لفرز وتجنيب التركة",
        "2. رول رقم 7 - استئناف 440 لسنة 2026 - مكتب الأستاذ وسام الشناوي - قرار: إلغاء الحكم المستأنف والقضاء بصحة ونفاذ العقد",
        "3. رول رقم 11 - استئناف 890 لسنة 2026 - تعويضات - قرار: شطب الدعوى لغياب الطرفين",
        "4. رول رقم 14 - استئناف 1120 لسنة 2026 - إخلاء لعدم سداد الأجرة - قرار: التأجيل للمستندات"
      ]
    }
  ]);

  const [selectedPost, setSelectedPost] = useState<FacebookCourtPost>(feedPosts[0]);
  const [searchHighlightTerm, setSearchHighlightTerm] = useState<string>("وسام الشناوي");
  const [hideNonMatching, setHideNonMatching] = useState<boolean>(true);
  const [uploadedCustomImage, setUploadedCustomImage] = useState<string | null>(null);
  const [customImageLines, setCustomImageLines] = useState<string[]>([]);
  const [customCourtName, setCustomCourtName] = useState("محكمة ههيا الجزئية");
  const [customSessionDate, setCustomSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter lines based on keyword
  const activeLines = uploadedCustomImage ? customImageLines : selectedPost.rollLines;
  const filteredLines = activeLines.filter(line => {
    if (!searchHighlightTerm.trim()) return true;
    if (!hideNonMatching) return true;
    return line.toLowerCase().includes(searchHighlightTerm.toLowerCase());
  });

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedCustomImage(dataUrl);
      setCustomImageLines([
        "1. كشف جلسة مستورد من فيسبوك - رول رقم 1 - قضية 1102 لسنة 2026",
        "2. رول رقم 5 - جنحة 2210 لسنة 2026 - الأستاذ وسام الشناوي عن المتهم - تأجيل للتقرير",
        "3. رول رقم 9 - قضية 3340 لسنة 2026 - مدني كلي الزقازيق",
        "4. رول رقم 14 - جنحة 4450 لسنة 2026 - الأستاذ وسام الشناوي - براءة حضورياً",
        "5. رول رقم 18 - جنحة 5560 لسنة 2026 - تأجيل للصلح"
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSessionToApp = () => {
    setSaveStatus(null);
    const newSession: SessionRecord = {
      id: `session_fb_${Date.now()}`,
      caseId: cases[0]?.id || "general_roll",
      caseInfo: {
        caseNumber: "0",
        caseYear: 2026,
        competentCourt: "مستورد",
        subject: "استيراد فيسبوك",
        clientName: "فيسبوك",
        opponentName: "-"
      },
      date: uploadedCustomImage ? customSessionDate : selectedPost.sessionDate,
      timeType: "morning",
      status: "done",
      decision: `تم استيراد قرار الرول من جروب فيسبوك (${selectedPost.sourceGroup}): مطابقة البنود للكلمة المفتاحية "${searchHighlightTerm}".`,
      requiredWork: "متابعة استخراج الشهادة الرسمية من الجدول وقيد منطوق الحكم."
    };

    if (onAddSession) {
      onAddSession(newSession);
    }
    setSaveStatus("تم حفظ بيانات وصورة الجلسة بالمنظومة القضائية وربطها بالأجندة بنجاح!");
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-blue-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 inline-flex">
              <Facebook className="w-6 h-6" />
            </span>
            <span className="text-xs font-black text-blue-300 bg-black/40 px-3 py-1 rounded-full uppercase tracking-wider">
              Facebook Court Roll Importer & Smart Highlighter
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black">مستورد كشوف ورول الجلسات من جروبات فيسبوك والتمييز الذكي</h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            سحب كشوف الرول اليومية من صفحات وجروبات المحاكم، إبراز وتمييز قضايا المكتب والكلمات المفتاحية فورياً، وإخفاء باقي الكشوف لتسهيل المتابعة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleCustomImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
          >
            <Upload className="w-4 h-4" />
            <span>رفع لقطة رول من فيسبوك</span>
          </button>
        </div>
      </div>

      {/* Smart Filter & Highlight Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px] relative">
            <Highlighter className="w-4 h-4 absolute right-3.5 top-3 text-amber-500" />
            <input
              type="text"
              value={searchHighlightTerm}
              onChange={(e) => setSearchHighlightTerm(e.target.value)}
              placeholder="اكتب كلمة أو اسم الموكل أو المحامي أو رقم الرول للتمييز الفوري (مثال: وسام الشناوي)..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-right outline-none focus:ring-2 focus:ring-amber-500 font-bold"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHideNonMatching(!hideNonMatching)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                hideNonMatching
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              {hideNonMatching ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{hideNonMatching ? "إخفاء باقي القضايا غير المطابقة (مفعل)" : "عرض كامل الصفحة مع التمييز"}</span>
            </button>

            <button
              onClick={handleSaveSessionToApp}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
            >
              <Save className="w-4 h-4" />
              <span>حفظ بالأجندة القضائية</span>
            </button>
          </div>
        </div>

        {saveStatus && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Facebook Feed + Highlighted Roll Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Available Facebook Court Groups Feed */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Facebook className="w-4 h-4 text-blue-600" />
            <span>كشوف الرول الصادرة على جروبات فيسبوك</span>
          </h3>

          <div className="space-y-3">
            {feedPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => {
                  setSelectedPost(post);
                  setUploadedCustomImage(null);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-right space-y-2 ${
                  !uploadedCustomImage && selectedPost.id === post.id
                    ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500 shadow-sm ring-1 ring-blue-500"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-blue-700 dark:text-blue-400">{post.sourceGroup}</span>
                  <span className="text-[10px] text-slate-400">{post.timeAgo}</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">{post.caption}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>{post.courtName}</span>
                  </span>
                  <span className="font-mono">{post.sessionDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Image & Highlighted Roll Viewer */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>
                  {uploadedCustomImage ? "كشف الرول المرفوع المخصص" : selectedPost.caption}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {uploadedCustomImage ? "فحص مباشر للقطة الشاشة" : `المصدر: ${selectedPost.sourceGroup}`}
              </p>
            </div>
            <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
              {filteredLines.length} بند مطابق للتمييز
            </span>
          </div>

          {/* High speed Highlight list */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              بنود الرول القضائي بعد التمييز والفلترة الذكية:
            </p>

            {filteredLines.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-2xl">
                لا توجد بنود تطابق كلمة البحث "{searchHighlightTerm}". قم بإلغاء خيار الإخفاء لعرض كامل الكشف.
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {filteredLines.map((line, idx) => {
                  const isMatch = searchHighlightTerm.trim() && line.toLowerCase().includes(searchHighlightTerm.toLowerCase());
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                        isMatch
                          ? "bg-amber-100/90 dark:bg-amber-950/60 border-amber-400 text-amber-950 dark:text-amber-100 shadow-xs ring-1 ring-amber-400"
                          : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{line}</span>
                        {isMatch && (
                          <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md font-black">
                            مطابق ومميز ⭐
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Image preview with smooth hover zoom */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">صورة الرول الأصلية من فيسبوك:</p>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-750 bg-slate-950 max-h-[260px] flex items-center justify-center">
              <img
                src={uploadedCustomImage || selectedPost.imageUrl}
                alt="Facebook Court Roll"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
