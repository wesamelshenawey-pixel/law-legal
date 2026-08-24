import React, { useState } from "react";
import { CaseRecord, ClientProfile, UserRole } from "../types";
import { TRANSLATIONS } from "../utils/translations";

interface ImportFilesViewProps {
  onAddClient: (newCl: ClientProfile, firstCase?: CaseRecord) => void;
  onAddCase: (newCs: CaseRecord) => void;
  clients: ClientProfile[];
  language: "ar" | "en";
  onOpenDocumentManager?: (section: string, label: string) => void;
  onNavigateToOcr?: () => void;
}

export default function ImportFilesView({ 
  onAddClient, 
  onAddCase, 
  clients, 
  language,
  onOpenDocumentManager,
  onNavigateToOcr 
}: ImportFilesViewProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "new_client" | "new_case">("upload");
  const [dragActive, setDragActive] = useState(false);

  // Simple local state for forms
  const [clientName, setClientName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  
  const [caseSubject, setCaseSubject] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [caseYear, setCaseYear] = useState(new Date().getFullYear().toString());
  const [selectedClientId, setSelectedClientId] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArr = Array.from(e.dataTransfer.files);
      setUploadedFiles(prev => [...prev, ...filesArr]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const filesArr = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...filesArr]);
    }
  };

  const submitNewClient = () => {
    if (!clientName || !nationalId) {
      alert("الرجاء إدخال اسم الموكل والرقم القومي");
      return;
    }
    const newCl: ClientProfile = {
      id: `CL-${Date.now()}`,
      serialNumber: clients.length + 1,
      name: clientName,
      nationalId: nationalId,
      poaNumber: "",
      poaLetter: "",
      poaYear: parseInt(caseYear),
      poaOffice: "",
      caseNumber: "",
      caseYear: parseInt(caseYear),
      competentCourt: "",
      subject: "",
      phone: clientPhone,
      remainingFees: 0,
      createdAt: new Date().toISOString(),
    };
    onAddClient(newCl);
    alert("تم إنشاء ملف الموكل بنجاح ويمكن الآن ربط الملفات المرفوعة به.");
    setClientName("");
    setNationalId("");
    setClientPhone("");
  };

  const submitNewCase = () => {
    if (!caseSubject || !caseNumber || !selectedClientId) {
      alert("الرجاء إدخال رقم القضية والموضوع واختيار الموكل");
      return;
    }
    const client = clients.find(c => c.id === selectedClientId);
    const newCs: CaseRecord = {
      id: `CS-${Date.now()}`,
      serialNumber: Date.now(),
      caseNumber: caseNumber,
      caseYear: parseInt(caseYear),
      competentCourt: "محكمة عامة",
      courtType: "عام",
      subject: caseSubject,
      clientName: client?.name || "",
      clientRole: "مدعي",
      opponentName: "غير محدد",
      nextSessionDate: new Date().toISOString().split('T')[0],
      details: "تم الإنشاء عبر قسم الاستيراد بناءً على الملفات المرفوعة.",
      attachments: uploadedFiles.map(f => ({
        name: f.name,
        url: "",
        addedAt: new Date().toISOString(),
        type: "pdf"
      })),
      scans: [],
      createdAt: new Date().toISOString(),
    };
    onAddCase(newCs);
    alert("تم إنشاء ملف القضية وربط الملفات المرفوعة بنجاح.");
    setCaseSubject("");
    setCaseNumber("");
  };

  return (
    <div className="space-y-6 font-sans text-right" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header Tabs and Actions */}
      <div className="flex justify-between items-center flex-wrap gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${activeTab === "upload" ? "bg-amber-500 text-slate-900 shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"}`}
          >
            📥 رفع واستيراد الملفات
          </button>
          <button
            onClick={() => setActiveTab("new_client")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${activeTab === "new_client" ? "bg-amber-500 text-slate-900 shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"}`}
          >
            👥 إنشاء موكل جديد
          </button>
          <button
            onClick={() => setActiveTab("new_case")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${activeTab === "new_case" ? "bg-amber-500 text-slate-900 shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"}`}
          >
            💼 إنشاء قضية جديدة
          </button>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {onOpenDocumentManager && (
            <button
              id="import-open-doc-mgr-btn"
              type="button"
              onClick={() => onOpenDocumentManager("import_files", "قسم استيراد وإدارة الملفات")}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              title="خزانة المستندات واستخراج الـ ZIP المتقدمة"
            >
              <span>📦</span>
              <span>خزانة المستندات واستخراج الـ ZIP</span>
            </button>
          )}

          {onNavigateToOcr && (
            <button
              id="import-open-ocr-studio-btn"
              type="button"
              onClick={onNavigateToOcr}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-amber-500 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              title="استوديو الفحص واستخراج النصوص بالذكاء الاصطناعي"
            >
              <span>🔍</span>
              <span>استوديو Smart OCR</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === "upload" && (
        <div className="bg-white dark:bg-[#0b1f2e] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">منطقة رفع المستندات (PDF, Word, Images)</h2>
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragActive ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" : "border-slate-300 dark:border-slate-700 hover:border-slate-400"}`}
          >
            <p className="text-3xl mb-3">📁</p>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-4">
              اسحب وأفلت الملفات هنا، أو انقر لاختيارها من جهازك
            </p>
            <label className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 rounded-xl text-xs font-black cursor-pointer shadow-md hover:bg-slate-800 transition-colors">
              اختر ملفات...
              <input type="file" multiple className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">الملفات الجاهزة للاستيراد ({uploadedFiles.length}):</h3>
              <ul className="space-y-2">
                {uploadedFiles.map((f, i) => (
                  <li key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                    <span className="text-slate-800 dark:text-slate-200 truncate pr-2 max-w-[80%]">{f.name}</span>
                    <span className="text-slate-500">{(f.size / 1024).toFixed(1)} KB</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === "new_client" && (
        <div className="bg-white dark:bg-[#0b1f2e] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">تأسيس ملف موكل جديد من المستندات المرفوعة</h2>
          <p className="text-xs text-slate-500">سيتم ربط الملفات التي قمت برفعها بملف هذا الموكل تلقائياً.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">الاسم رباعياً:</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">الرقم القومي (14 رقم):</label>
              <input value={nationalId} onChange={e => setNationalId(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رقم الهاتف الأساسي:</label>
              <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs" />
            </div>
          </div>
          <button onClick={submitNewClient} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-black px-6 py-2.5 rounded-xl text-xs shadow-md transition-colors mt-4">
            حفظ وإنشاء ملف الموكل
          </button>
        </div>
      )}

      {activeTab === "new_case" && (
        <div className="bg-white dark:bg-[#0b1f2e] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">تأسيس ملف قضية جديد وإرفاق المستندات</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">اختر الموكل:</label>
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs">
                <option value="">-- اختر --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">موضوع القضية:</label>
              <input value={caseSubject} onChange={e => setCaseSubject(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رقم القضية:</label>
              <input value={caseNumber} onChange={e => setCaseNumber(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">سنة القضية:</label>
              <input value={caseYear} onChange={e => setCaseYear(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs" />
            </div>
          </div>
          <button onClick={submitNewCase} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-black px-6 py-2.5 rounded-xl text-xs shadow-md transition-colors mt-4">
            حفظ وإنشاء ملف القضية
          </button>
        </div>
      )}
    </div>
  );
}
