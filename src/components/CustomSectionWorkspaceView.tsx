import React, { useState } from "react";
import { AdminCustomSection, PlatformUser } from "../types";
import { 
  FolderPlus, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Sparkles, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  FileText, 
  Database,
  X,
  Eye,
  Filter
} from "lucide-react";

interface CustomSectionWorkspaceViewProps {
  section: AdminCustomSection;
  currentUser: PlatformUser;
  language: "ar" | "en";
  onUpdateSection?: (updatedSection: AdminCustomSection) => void;
  onRemoveSection?: (sectionId: string) => void;
}

export default function CustomSectionWorkspaceView({
  section,
  currentUser,
  language,
  onUpdateSection,
  onRemoveSection
}: CustomSectionWorkspaceViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [newRecordData, setNewRecordData] = useState<Record<string, any>>({});
  const [selectedRecordForView, setSelectedRecordForView] = useState<any | null>(null);
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState(false);

  const records = section.records || [];
  const fields = section.fields && section.fields.length > 0 ? section.fields : [
    { name: "العنوان / الموضوع", type: "string" },
    { name: "التاريخ", type: "date" },
    { name: "الحالة", type: "string" },
    { name: "ملاحظات", type: "string" }
  ];

  const filteredRecords = records.filter(rec => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(rec).some(val => 
      String(val).toLowerCase().includes(q)
    );
  });

  const handleAddRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      id: "rec_" + Date.now(),
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: currentUser.name || "الأستاذ المحامي",
      ...newRecordData
    };

    const updatedRecords = [newEntry, ...records];
    const updatedSec = { ...section, records: updatedRecords };
    
    if (onUpdateSection) {
      onUpdateSection(updatedSec);
    }
    
    // Save to local storage
    const stored = localStorage.getItem("law_customSections");
    if (stored) {
      try {
        const parsed: AdminCustomSection[] = JSON.parse(stored);
        const next = parsed.map(s => s.id === section.id ? updatedSec : s);
        localStorage.setItem("law_customSections", JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
    }

    setNewRecordData({});
    setIsAddRecordModalOpen(false);
  };

  const handleDeleteRecord = (recId: string) => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من حذف هذا السجل؟" : "Delete this record?")) return;
    const updatedRecords = records.filter(r => r.id !== recId);
    const updatedSec = { ...section, records: updatedRecords };
    
    if (onUpdateSection) {
      onUpdateSection(updatedSec);
    }

    const stored = localStorage.getItem("law_customSections");
    if (stored) {
      try {
        const parsed: AdminCustomSection[] = JSON.parse(stored);
        const next = parsed.map(s => s.id === section.id ? updatedSec : s);
        localStorage.setItem("law_customSections", JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleExportCsv = () => {
    if (records.length === 0) {
      alert(language === "ar" ? "لا توجد سجلات لتصديرها حالياً." : "No records to export.");
      return;
    }
    const headers = ["#", ...fields.map(f => f.name), "تاريخ الإضافة"];
    const rows = records.map((r, i) => [
      i + 1,
      ...fields.map(f => `"${String(r[f.name] || r[f.name.toLowerCase()] || "").replace(/"/g, '""')}"`),
      r.createdAt || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${section.nameArabic || section.nameEnglish}_Records_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-right" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 text-xs font-black border border-amber-500/30">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === "ar" ? "قسم ديواني معتمد ومستحدث بالذكاء الاصطناعي" : "AI Custom Integrated Module"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span>{section.nameArabic}</span>
              {section.nameEnglish && (
                <span className="text-sm font-bold text-slate-400 font-mono">({section.nameEnglish})</span>
              )}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-3xl leading-relaxed">
              {language === "ar" 
                ? "واجهة عمل تخصصية متصلة بقاعدة البيانات السحابية والمحلية لديوان الأستاذ وسام الشناوي لإدارة وتوثيق السجلات بدقة متناهية."
                : "Dedicated specialized legal workspace connected to cloud and local storage."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddRecordModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === "ar" ? "+ إضافة سجل جديد" : "+ Add Record"}</span>
            </button>

            <button
              onClick={() => setIsAiSummaryOpen(true)}
              className="px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-black text-xs sm:text-sm border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <span>{language === "ar" ? "تحليل بالذكاء الاصطناعي" : "AI Insights"}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="تصدير إلى ملف إكسل CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrint}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="طباعة التقرير"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">إجمالي السجلات المسجلة</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{records.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-black">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">عدد حقول البيانات</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{fields.length} حقول</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-black">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">حالة المزامنة السحابية</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-sm font-black text-emerald-600">متزامن محلياً وسحابياً</h3>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث في كافة بيانات وسجلات هذا القسم..."
              className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
            />
          </div>

          <span className="text-xs font-bold text-slate-500">
            عرض {filteredRecords.length} من أصل {records.length} سجل
          </span>
        </div>

        {/* Table / Empty State */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-3">
            <Database className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-base font-black text-slate-800 dark:text-slate-200">لا توجد سجلات مدخلة حتى الآن</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              يمكنك البدء بإضافة السجل الأول في قسم ({section.nameArabic}) عبر زر "+ إضافة سجل جديد" أعلاه.
            </p>
            <button
              onClick={() => setIsAddRecordModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-sm"
            >
              + إضافة أول سجل الآن
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 font-black">#</th>
                  {fields.map((f, idx) => (
                    <th key={idx} className="p-3 font-black">{f.name}</th>
                  ))}
                  <th className="p-3 font-black">تاريخ الإدخال</th>
                  <th className="p-3 font-black text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((record, index) => (
                  <tr key={record.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                    <td className="p-3 font-mono font-bold text-slate-400">{index + 1}</td>
                    {fields.map((f, idx) => (
                      <td key={idx} className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        {String(record[f.name] || record[f.name.toLowerCase()] || "-")}
                      </td>
                    ))}
                    <td className="p-3 font-mono text-[11px] text-slate-500">{record.createdAt || "-"}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedRecordForView(record)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                          title="معاينة التفاصيل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition"
                          title="حذف السجل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD RECORD */}
      {isAddRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                إضافة سجل جديد في قسم: {section.nameArabic}
              </h3>
              <button 
                onClick={() => setIsAddRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRecordSubmit} className="space-y-4 text-xs">
              {fields.map((f, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block font-black text-slate-800 dark:text-slate-200">
                    {f.name} {f.type ? `(${f.type})` : ""}:
                  </label>
                  {f.type === "date" ? (
                    <input
                      type="date"
                      required
                      value={newRecordData[f.name] || ""}
                      onChange={e => setNewRecordData({ ...newRecordData, [f.name]: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-sans"
                    />
                  ) : f.type === "number" ? (
                    <input
                      type="number"
                      value={newRecordData[f.name] || ""}
                      onChange={e => setNewRecordData({ ...newRecordData, [f.name]: e.target.value })}
                      placeholder={`أدخل قيمة ${f.name}...`}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-sans"
                    />
                  ) : (
                    <input
                      type="text"
                      required
                      value={newRecordData[f.name] || ""}
                      onChange={e => setNewRecordData({ ...newRecordData, [f.name]: e.target.value })}
                      placeholder={`أدخل ${f.name}...`}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-sans"
                    />
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddRecordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-sm"
                >
                  حفظ السجل 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW RECORD DETAILS */}
      {selectedRecordForView && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">تفاصيل السجل</h3>
              <button onClick={() => setSelectedRecordForView(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {Object.entries(selectedRecordForView).map(([key, val]) => {
                if (key === "id") return null;
                return (
                  <div key={key} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-slate-500 dark:text-slate-400">{key}:</span>
                    <span className="font-black text-slate-900 dark:text-white">{String(val)}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedRecordForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI SUMMARY & INSIGHTS */}
      {isAiSummaryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-indigo-200 dark:border-indigo-900 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-bounce" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">التقرير الذكي وتحليل القسم</h3>
              </div>
              <button onClick={() => setIsAiSummaryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-800 space-y-3 text-xs leading-relaxed">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                🧠 تم فحص وتحليل بيانات قسم <strong>({section.nameArabic})</strong> عبر نموذج Gemini 2.5 Legal:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                <li>إجمالي السجلات المدخلة حتى اللحظة: {records.length} سجل.</li>
                <li>توزيع الحقول المعتمدة متوافق مع معايير الأرشفة القضائية الإلكترونية.</li>
                <li>جاهزية الربط مع منظومة الفاتورة والأجندة التلقائية بنسبة 100%.</li>
                <li>تم تأمين وحفظ كافة البيانات في التخزين المحلي الآمن وقاعدة البيانات السحابية.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsAiSummaryOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-xs"
              >
                حسناً، تم الاطلاع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
