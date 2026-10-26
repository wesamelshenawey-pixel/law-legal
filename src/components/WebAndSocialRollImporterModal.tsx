import React, { useState } from "react";
import { CaseRecord, SessionRecord, PlatformUser } from "../types";
import { 
  X, 
  ArrowRight, 
  Globe, 
  FileImage, 
  Facebook, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  Calendar, 
  Building2, 
  Plus, 
  Eye, 
  Layers,
  Database
} from "lucide-react";
import { fetchGoogleDriveFiles, downloadGoogleDriveFileAsBase64, getStoredWorkspaceToken, requestWorkspaceAuth } from "../utils/workspaceService";

export interface ExtractedRollSession {
  rollNumber: number | string;
  caseNumber: string;
  caseYear: number;
  court: string;
  circuit: string;
  clientName: string;
  opponentName: string;
  subject: string;
  decision: string;
  nextSessionDate: string;
  requiredWork: string;
}

interface WebAndSocialRollImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: PlatformUser;
  onImportExtracted: (sessions: SessionRecord[], cases: CaseRecord[]) => void;
  language?: "ar" | "en";
}

export default function WebAndSocialRollImporterModal({
  isOpen,
  onClose,
  currentUser,
  onImportExtracted,
  language = "ar"
}: WebAndSocialRollImporterModalProps) {
  const [activeTab, setActiveTab] = useState<"website" | "google_photos" | "facebook">("website");
  
  // URL Input
  const [webUrl, setWebUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Direct Images (from local file upload, Facebook paste, or Google Photos)
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Google Workspace / Photos files
  const [googleDrivePhotos, setGoogleDrivePhotos] = useState<any[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);

  // Extracted Result Data
  const [extractedData, setExtractedData] = useState<{
    courtName: string;
    circuit: string;
    sessionDate: string;
    sessions: ExtractedRollSession[];
    notes?: string;
  } | null>(null);

  if (!isOpen) return null;

  // Handle Web Scrape
  const handleScrapeWebsite = async () => {
    if (!webUrl.trim() && selectedImages.length === 0) {
      setErrorMsg("يرجى إدخال رابط الموقع أو رفع صور كشف الرول أولاً.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/web/scrape-and-analyze-roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webUrl.trim(),
          directBase64Images: selectedImages,
          platform: activeTab
        })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || "تعذر تحليل الموقع");
      }

      const data = resJson.data || {};
      const sessions = Array.isArray(data.sessions) ? data.sessions : [];
      setExtractedData({
        courtName: data.courtName || "المحكمة المختصة",
        circuit: data.circuit || "الدائرة القضائية",
        sessionDate: data.sessionDate || new Date().toISOString().split("T")[0],
        sessions: sessions,
        notes: data.notes
      });

      setSuccessMsg(`تم استخراج ${sessions.length} قضية وجلسة من كشف الرول بنجاح!`);
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء فحص وتحليل الرول.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Direct Image Upload (Drag & Drop or File Input)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readers: Promise<string>[] = [];
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i];
      readers.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
      );
    }

    Promise.all(readers).then((base64List) => {
      setSelectedImages((prev) => [...prev, ...base64List]);
    });
  };

  // Handle Google Drive / Photos Integration
  const handleFetchGooglePhotos = async () => {
    setIsLoadingDrive(true);
    setErrorMsg(null);
    try {
      const tokenState = getStoredWorkspaceToken();
      if (!tokenState.accessToken) {
        requestWorkspaceAuth(async (newTokenState) => {
          if (newTokenState.accessToken) {
            const files = await fetchGoogleDriveFiles(newTokenState.accessToken);
            const photoFiles = files.filter((f: any) => 
              f.mimeType?.startsWith("image/") || f.name?.endsWith(".jpg") || f.name?.endsWith(".png") || f.mimeType === "application/pdf"
            );
            setGoogleDrivePhotos(photoFiles);
          }
        });
        setIsLoadingDrive(false);
        return;
      }
      const files = await fetchGoogleDriveFiles(tokenState.accessToken);
      const photoFiles = files.filter((f: any) => 
        f.mimeType?.startsWith("image/") || f.name?.endsWith(".jpg") || f.name?.endsWith(".png") || f.mimeType === "application/pdf"
      );
      setGoogleDrivePhotos(photoFiles);
    } catch (err: any) {
      setErrorMsg("تعذر جلب الصور من حساب Google Drive / Photos: " + err.message);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleSelectGoogleDriveFile = async (file: any) => {
    setIsLoading(true);
    try {
      const tokenState = getStoredWorkspaceToken();
      const token = tokenState.accessToken || "";
      const result = await downloadGoogleDriveFileAsBase64(token, file.id, file.mimeType);
      setSelectedImages((prev) => [...prev, result.base64]);
      setSuccessMsg(`تم استيراد الصورة (${file.name}) من Google Photos / Drive بنجاح.`);
    } catch (err: any) {
      setErrorMsg("فشل تنزيل الصورة من Google: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert Extracted Sessions to System Records and Import
  const handleConfirmImport = () => {
    if (!extractedData || extractedData.sessions.length === 0) return;

    const newSessions: SessionRecord[] = [];
    const newCases: CaseRecord[] = [];
    const baseTime = Date.now();

    extractedData.sessions.forEach((s, idx) => {
      const caseId = `cs_web_${baseTime}_${idx}`;
      const sessionId = `ss_web_${baseTime}_${idx}`;

      const newCase: CaseRecord = {
        id: caseId,
        serialNumber: idx + 1,
        caseNumber: s.caseNumber || `${100 + idx}`,
        caseYear: Number(s.caseYear) || 2026,
        competentCourt: s.court || extractedData.courtName || "محكمة ههيا الجزئية",
        courtType: "جنح",
        subject: s.subject || "قضية رول جلسة مستوردة",
        clientName: s.clientName || "موكل كشف الرول",
        clientRole: "متهم",
        opponentName: s.opponentName || "النيابة العامة / خصم",
        nextSessionDate: s.nextSessionDate || "",
        details: `مستوردة آلياً عبر كشف الرول. القرار: ${s.decision || "حضور الجلسة"}. المطلوب: ${s.requiredWork || "المتابعة والمرافعة"}`,
        attachments: [],
        scans: [],
        createdAt: new Date().toISOString()
      };

      const newSession: SessionRecord = {
        id: sessionId,
        caseId: caseId,
        date: extractedData.sessionDate || new Date().toISOString().split("T")[0],
        timeType: "morning",
        caseInfo: {
          caseNumber: s.caseNumber || `${100 + idx}`,
          caseYear: Number(s.caseYear) || 2026,
          competentCourt: s.court || extractedData.courtName || "محكمة ههيا الجزئية",
          subject: s.subject || "قضية رول جلسة",
          clientName: s.clientName || "موكل كشف الرول",
          opponentName: s.opponentName || "النيابة العامة",
          circuit: s.circuit || extractedData.circuit || "الدائرة الأولى"
        },
        decision: s.decision || "نظرت بالجلسة",
        requiredWork: s.requiredWork || "متابعة القرار ومذكرات الدفاع",
        status: "pending",
        history: []
      };

      newCases.push(newCase);
      newSessions.push(newSession);
    });

    onImportExtracted(newSessions, newCases);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200">
        
        {/* HEADER WITH PURE ICON BUTTONS (CLOSE & BACK) */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-amber-500 via-amber-600 to-amber-500 text-slate-950 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            {extractedData && (
              <button
                type="button"
                onClick={() => setExtractedData(null)}
                aria-label="رجوع"
                title="رجوع"
                className="p-2 hover:bg-slate-950/20 active:bg-slate-950/30 text-slate-950 rounded-xl transition cursor-pointer"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <div className="p-2.5 bg-slate-950 text-amber-400 rounded-2xl shadow-inner font-black">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">
                استيراد وتحليل كشوف رول الجلسات الذكي
              </h2>
              <p className="text-xs text-slate-900 font-medium">
                استخراج بيانات القضايا والجلسات من المواقع الإلكترونية، صور Google، وكشوف فيسبوك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            title="إغلاق"
            className="p-2 hover:bg-slate-950/20 active:bg-slate-950/30 text-slate-950 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS SELECTOR */}
        {!extractedData && (
          <div className="p-3 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("website")}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "website" 
                  ? "bg-amber-500 text-slate-950 shadow-sm" 
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>موقع إلكتروني / بوابة المحاكم</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("google_photos");
                if (googleDrivePhotos.length === 0) handleFetchGooglePhotos();
              }}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "google_photos" 
                  ? "bg-amber-500 text-slate-950 shadow-sm" 
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <FileImage className="w-4 h-4" />
              <span>صور Google Photos / Drive</span>
            </button>

            <button
              onClick={() => setActiveTab("facebook")}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "facebook" 
                  ? "bg-amber-500 text-slate-950 shadow-sm" 
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              <span>صور كشوف فيسبوك والجروبات</span>
            </button>
          </div>
        )}

        {/* BODY CONTENT */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!extractedData ? (
            <div className="space-y-5">
              {/* TAB 1: WEBSITE URL */}
              {activeTab === "website" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      رابط الموقع الإلكتروني أو بوابة المحكمة لنشر كشوف الجلسات:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={webUrl}
                        onChange={(e) => setWebUrl(e.target.value)}
                        placeholder="https://... (رابط صفحة رول المحكمة أو الجلسة)"
                        dir="ltr"
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-left outline-none focus:border-amber-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      يقوم النظام بالدخول إلى الرابط وفحص كافة صور كشوف الرول وتحليل خط اليد والجداول واستخراج بيانات القضايا وأرقامها.
                    </p>
                  </div>

                  {/* Optional File/Photo upload fallback */}
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3">
                    <Upload className="w-8 h-8 mx-auto text-amber-500" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        أو ارفع صور كشف الرول مباشرة من جهازك
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        يدعم صور JPG و PNG وملفات PDF لكشوف الرول المكتوبة بخط اليد أو المطبوعة
                      </p>
                    </div>
                    <label className="inline-block px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl cursor-pointer shadow-sm">
                      اختيار صور كشف الرول
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: GOOGLE PHOTOS / DRIVE */}
              {activeTab === "google_photos" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        الصور والمستندات المحفوظة بحساب Google Drive و Google Photos:
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        حدد أي صورة لرول المحكمة تم تصويرها بالهاتف ومزامنتها على حساب جوجل الخاص بك
                      </p>
                    </div>
                    <button
                      onClick={handleFetchGooglePhotos}
                      disabled={isLoadingDrive}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      {isLoadingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileImage className="w-3.5 h-3.5" />}
                      <span>تحديث صور Google</span>
                    </button>
                  </div>

                  {googleDrivePhotos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                      {googleDrivePhotos.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => handleSelectGoogleDriveFile(file)}
                          className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 cursor-pointer transition text-right group"
                        >
                          <FileImage className="w-6 h-6 text-blue-500 group-hover:text-amber-500 transition" />
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-1">
                            {file.name}
                          </h5>
                          <span className="text-[10px] text-slate-500 block">
                            انقر لاستيراد وتحليل الرول
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        لا توجد صور معروضة حالياً. اضغط على زر "تحديث صور Google" لجلب الصور من الحساب.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FACEBOOK ROLL PHOTOS */}
              {activeTab === "facebook" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-2">
                    <label className="block text-xs font-bold text-blue-900 dark:text-blue-300">
                      رابط منشور كشف الرول على فيسبوك أو جروب نقابة المحامين:
                    </label>
                    <input
                      type="url"
                      value={webUrl}
                      onChange={(e) => setWebUrl(e.target.value)}
                      placeholder="https://facebook.com/... (منشور كشف الرول)"
                      dir="ltr"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-left outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3">
                    <Facebook className="w-8 h-8 mx-auto text-blue-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        أو ارفع لقطة الشاشة لكشف رول فيسبوك
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        يمكنك التقاط صورة شاشة (Screenshot) لمنشور رول الجلسة على فيسبوك ورفعها هنا للتحليل
                      </p>
                    </div>
                    <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm">
                      اختيار لقطة الشاشة
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* PREVIEW OF SELECTED IMAGES */}
              {selectedImages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      الصور المحددة للتحليل ({selectedImages.length}):
                    </span>
                    <button
                      onClick={() => setSelectedImages([])}
                      className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                    >
                      إلغاء تحديد الكل
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedImages.map((img, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden flex-shrink-0 group">
                        <img src={img} alt={`Roll ${i}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setSelectedImages((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label="إغلاق"
                          title="إغلاق"
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TRIGGER BUTTON */}
              <button
                type="button"
                onClick={handleScrapeWebsite}
                disabled={isLoading || (!webUrl.trim() && selectedImages.length === 0)}
                className="w-full py-3.5 bg-gradient-to-l from-amber-500 via-amber-600 to-amber-500 hover:brightness-105 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري فحص الموقع وتحليل خط اليد واستخراج كشف الرول...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>تحليل الموقع والصور واستخراج جدول القضايا والجلسات</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* STEP 2: REVIEW EXTRACTED ROLL DOCKET */
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span>{extractedData.courtName} - {extractedData.circuit}</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    تاريخ الانعقاد: <span className="font-mono font-bold text-amber-300">{extractedData.sessionDate}</span> | عدد القضايا المستخرجة: <strong className="font-mono text-emerald-400">{extractedData.sessions.length}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إدراج كافة القضايا والجلسات فوراً في المنظومة</span>
                </button>
              </div>

              {/* EXTRACTED SESSIONS TABLE */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                      <tr>
                        <th className="p-3">رقم الرول</th>
                        <th className="p-3">رقم وسنة القضية</th>
                        <th className="p-3">الموكل / المتهم</th>
                        <th className="p-3">الخصم / المجني عليه</th>
                        <th className="p-3">الموضوع</th>
                        <th className="p-3">القرار الصادر</th>
                        <th className="p-3">التأجيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {extractedData.sessions.map((sess, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                            #{sess.rollNumber || idx + 1}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {sess.caseNumber} / {sess.caseYear}
                          </td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                            {sess.clientName}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {sess.opponentName}
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {sess.subject}
                          </td>
                          <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {sess.decision}
                          </td>
                          <td className="p-3 font-mono text-xs text-amber-700 dark:text-amber-300">
                            {sess.nextSessionDate || "حجز للحكم"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
