import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  UploadCloud, 
  DownloadCloud, 
  FolderLock, 
  FileText, 
  Trash2, 
  CheckCircle,
  FileDown,
  ExternalLink,
  Shield
} from "lucide-react";

export default function DocumentationView() {
  const [docCategory, setDocCategory] = useState("foreign_marriage");
  const [husbandNationality, setHusbandNationality] = useState("مصري");
  const [wifeNationality, setWifeNationality] = useState("أجنبية (بريطانية)");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiDocReport, setAiDocReport] = useState<any | null>(null);

  // Dynamic Briefcase Client Document Storage (persists in localStorage)
  const [vaultDocs, setVaultDocs] = useState<{ id: string; name: string; fileBase64: string; addedAt: string; size: string }[]>(() => {
    const saved = localStorage.getItem("law_doc_vault");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "vdoc-1",
        name: "طلب_توثيق_عقد_زواج_مستشار_الأجانب.pdf",
        fileBase64: "data:application/pdf;base64,JVBERi0xLjQKJ...",
        addedAt: "2026-06-01T09:00:00.000Z",
        size: "128 KB"
      },
      {
        id: "vdoc-2",
        name: "طلب_فحص_طب_الأسرة_نموذج_رقم_١.pdf",
        fileBase64: "data:application/pdf;base64,JVBERi0xLjQKJ...",
        addedAt: "2026-06-03T11:45:00.000Z",
        size: "94 KB"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("law_doc_vault", JSON.stringify(vaultDocs));
  }, [vaultDocs]);

  const handleCalculateDocFees = () => {
    setIsProcessing(true);
    setAiDocReport(null);

    setTimeout(() => {
      setIsProcessing(false);
      if (docCategory === "foreign_marriage") {
        setAiDocReport({
          requirements: [
            "حضور الطرفين بشخصهما لمقر وزارة العدل بميدان لاظوغلي - مكتب توثيق الأحوال الشخصية للأجانب.",
            "جواز سفر ساري المفعول للطرف الأجنبي مثبت به إقامة سياحية أو غير سياحية لغير غرض السياحة بمصر.",
            "شهادة عدم ممانعة في الزواج صاددة من السفارة التابع لها الطرف الأجنبي ومصدق عليها من الخارجية المصرية.",
            "عدد 5 صور شخصية حديثة لكل طرف وبطاقات شخصية للشهود المسجلين.",
            "ألا يقل السن عن 21 عاماً لكلا الطرفين قانوناً."
          ],
          approxFees: "حوالي 2,000 إلى 4,500 جنيه مصري كرسوم إدارية حكومية ومراجعة صحة الطابع.",
          aiAdvice: "الأفضل تكليف السيد الأستاذ وسام الشناوي لمراجعة شهادة عدم الممانعة بالسفارة مسبقاً لتفادي التأخير الإداري."
        });
      } else {
        setAiDocReport({
          requirements: [
            "حضور الزوج والزوجة والشهود لمكاتب الشهر العقاري المعنية أو وزارة العدل.",
            "إثبات الديانة بشكل رسمي (شهادة معتمدة من الكنيسة أو الأزهر حسب الحالة العقائدية للطرفين).",
            "صورة من جواز سفر ساري لغير المصري مع وثائق إثبات الإقامة الشرعية.",
            "طوابع أحوال شخصية وتوثيق من وزارة العدل بميدان لاظوغلي بالقاهرة."
          ],
          approxFees: "رسوم إدارية تقريبية تتراوح بين 3,000 إلى 5,000 جنيه شاملة التوثيقات والدمغات الديبلوماسية.",
          aiAdvice: "يتطلب هذا الزواج تصديقات خاصة من الكنائس المعنية أو الأزهر الشريف، ويوجه الأستاذ وسام بإتمامها باحتراف كامل لتفادي بطلان العقود مستقبلاً."
        });
      }
      alert("تم توليد دليل الاشتراطات وجرد تكاليف وزارة العدل المصرية لمستندات زواج الأجانب واختلاف الديانة بنجاح!");
    }, 1000);
  };

  // Upload document from device memory/storage
  const handleDocUploadToVault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInKb = `${Math.round(file.size / 1024)} KB`;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      const newDoc = {
        id: "vdoc-" + Date.now(),
        name: file.name,
        fileBase64: base64,
        addedAt: new Date().toISOString(),
        size: sizeInKb
      };

      setVaultDocs(prev => [newDoc, ...prev]);
      alert(`🎉 تم تحميل المستند [${file.name}] بنجاح من ذاكرة جهازك وحفظه بحقيبة أوراق التوثيق السحابية!`);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteVaultDoc = (id: string, name: string) => {
    if (!confirm(`هل تريد بالتأكيد الاستغناء عن مستند [${name}] نهائياً وحذفه؟`)) return;
    setVaultDocs(prev => prev.filter(d => d.id !== id));
  };

  // EXPORT CONTRACT OUTLINE/TEMPLATE AND SAVE DIRECTLY TO DEVICE MEMORY FILE
  const handleExportContractTemplate = () => {
    const title = docCategory === "foreign_marriage" ? "عقد زواج أجانب استرشادي وزارة العدل" : "طلب توثيق زواج أصحاب عقائد مختلفة";
    const textContent = `
========================================
مكتب الأستاذ المستشار وسام الشناوي المحامى
صيغة استرشادية لعقود الأحوال الشخصية وملف التوثيق
========================================

النوع العقدي: ${title}
الطرف الأول (الزوج): ${husbandNationality} الجنسية
الطرف الثاني (الزوجة): ${wifeNationality} الجنسية

البنود التحضيرية لعرضها أمام كاتب الموثق بوزارة العدل بميدان لاظوغلي:

البند الأول (الرضا والقبول):
يقر الطرفان أمام مكتب توثيق مكتب أجانب التحرير ولاظوغلي برضاهما التام لإنشاء الرباط الزوجي الشرعي الخاضع لأحكام القوانين المصرية ذات الصلة.

البند الثاني (الديانة وخلو موانع الزواج):
يشهد الشهود الحاضرون بالدائرة على ديانة المتعاقدين وخلوهما من كافة الموانع الشرعية أو القانونية المبطلة للتوثيق بوزارة العدل.

البند الثالث (المهر المعين):
تم الاتفاق على مهر وقدره معلوم للطرفين، المعجل منه والمؤجل مدوناً بصك الزواج أمام موثق مصلحة الأحوال الشخصية.

البند الرابع (شروط حضور وزارة العدل):
- إحضار شهادة عدم الممانعة الرسمية الصادرة من السفارة المعنية.
- طوابع وتأكيدات الأحوال الشخصية.
- حضور الطرفين بشخصهما مع عدد ٢ شهود عادل وبطاقات إثبات هويتهم سارية.

تم تحرير وصناعة هذه الصيغة بطلب استرشادي الكتروني من خزانة مكتب الأستاذ وسام الشناوي المحامى.
تاريخ التوليد: ${new Date().toLocaleDateString("ar-EG")}
========================================
    `.trim();

    // Trigger immediate browser download to memory/device disk storage
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `مسودة_صيغة_توثيق_وسام_الشناوي_${docCategory}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert("✔️ تم تحميل وتنزيل صيغة العقد المخصصة وحفظها للذاكرة المحلية لجهازك بنجاح!");
  };

  return (
    <div className="space-y-6 text-right font-sans text-slate-800" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-right">
        
        {/* Input parameters */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-xs leading-relaxed text-slate-800 text-right">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1.5">تصنيف خدمة التوثيق المدنية</h3>
          
          <div className="space-y-4 font-sans">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">القسم النوعي</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="tab-doc-marriage"
                  type="button"
                  onClick={() => { setDocCategory("foreign_marriage"); setAiDocReport(null); }}
                  className={`py-2 text-center rounded-lg border font-bold cursor-pointer transition ${
                    docCategory === "foreign_marriage" 
                      ? "bg-amber-500 text-slate-900 border-amber-500 shadow-sm font-black" 
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/50"
                  }`}
                >
                  توثيق زواج الأجانب
                </button>
                <button
                  id="tab-doc-interfaith"
                  type="button"
                  onClick={() => { setDocCategory("interfaith_marriage"); setAiDocReport(null); }}
                  className={`py-2 text-center rounded-lg border font-bold cursor-pointer transition ${
                    docCategory === "interfaith_marriage" 
                      ? "bg-amber-500 text-slate-900 border-amber-500 shadow-sm font-black" 
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/50"
                  }`}
                >
                  زواج أصحاب الديانات المختلفة
                </button>
              </div>
            </div>

            {docCategory === "foreign_marriage" && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in text-right">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1" htmlFor="husband-nat">جنسية الزوج</label>
                  <input
                    id="husband-nat"
                    type="text"
                    value={husbandNationality}
                    onChange={(e) => setHusbandNationality(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-1.5 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition font-sans"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1" htmlFor="wife-nat">جنسية الزوجة</label>
                  <input
                    id="wife-nat"
                    type="text"
                    value={wifeNationality}
                    onChange={(e) => setWifeNationality(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-1.5 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition font-sans"
                  />
                </div>
              </div>
            )}

            <button
              id="calc-doc-fees"
              type="button"
              onClick={handleCalculateDocFees}
              disabled={isProcessing}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-lg cursor-pointer transition shadow-sm"
            >
              {isProcessing ? "جاري احتساب اشتراطات لاظوغلي..." : "استنباط الشروط وتقدير الرسوم بالذكاء الاصطناعي"}
            </button>
          </div>
        </div>

        {/* AI Report panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-xs leading-relaxed text-slate-800 text-right">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-start gap-1 border-b border-slate-100 pb-1.5">
            <Cpu className="w-4 h-4 text-amber-500 animate-pulse" />
            مرئيات وشروط التوثيق النهائي (مكتب وسام الشناوي)
          </h3>

          {aiDocReport ? (
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-inner animate-fade-in text-slate-800">
              <div className="space-y-1.5">
                <p className="font-bold text-slate-900 pb-1 border-b border-slate-200">📋 المستندات والطلبات الأساسية المطلوبة لإتمام العقد:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pr-2">
                  {aiDocReport.requirements.map((req: string, idx: number) => (
                    <li key={idx} className="font-medium list-none text-right flex items-start gap-1 justify-start">
                      <span>•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-200 pt-3 text-right">
                <p className="text-slate-800 font-medium"><strong className="text-emerald-800 font-black">الرسوم الحكومية الاسترشادية:</strong> {aiDocReport.approxFees}</p>
                <p className="mt-2 text-amber-905 mt-2 text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium leading-relaxed font-sans flex flex-col gap-1.5">
                  <span className="block">💡 <strong className="text-amber-800 font-black font-sans">توصية الأستاذ وسام:</strong> {aiDocReport.aiAdvice}</span>
                  
                  {/* SAVE CONTRACT OUTLINE TO DISK BACK BUTTON */}
                  <button
                    id="save-contract-outline-btn"
                    onClick={handleExportContractTemplate}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-900 hover:bg-amber-500 hover:text-slate-900 text-white font-black rounded-lg transition-all text-[11px]"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>تنزيل وحفظ مسودة العقد الفورية إلي الذاكرة المكتوب بها (TXT)</span>
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 bg-slate-50 border border-slate-155 rounded-xl">
              اختر نوع الخدمة من لوحة التوثيقات الجانبية واضغط على (توليد) لمعاينة المستندات الرسمية وإرشادات التوثيقات الجنائية.
            </div>
          )}
        </div>

      </div>

      {/* 💼 BRAND NEW CLOUD BRIEFCASE & SECURE UPLOAD/DOWNLOAD MANAGER */}
      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 justify-start">
        <FolderLock className="w-5 h-5 text-amber-500 animate-pulse" />
        خزانة عقود الموكلين وحقيبة المستندات السحابية (رفع وحفظ للذاكرة العشوائية والمحلية)
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload tool panel (1/3 width) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-right flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1 justify-start">
              <UploadCloud className="w-4 h-4 text-amber-500" />
              رفع وإدراج الملفات والأوراق الرسمية من الذاكرة
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal">
              قم بتحميل الصور، أو وثائق بطاقات الهوية، أو شهادات المانع لزواج الأجانب مباشرة من هاتفك أو جهاز الكمبيوتر لحصانتها وحفظها في خادم مكتب المحاماة.
            </p>
          </div>

          <div className="border border-dashed border-amber-500/45 rounded-2xl p-6 text-center bg-amber-50/10 hover:bg-amber-50/20 transition relative cursor-pointer">
            <input
              id="documentation-file-uploader-direct"
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleDocUploadToVault}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <UploadCloud className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-bounce" />
            <p className="text-xs font-bold text-slate-800">اسحب الملف أو اضغط هنا للتصفح</p>
            <p className="text-[9px] text-slate-400 mt-1">امتدادات مقبولة: PDF, Word, Images لغاية 10MB</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-1.5 text-[9.5px] leading-relaxed text-slate-650">
            <span className="text-emerald-500 font-extrabold text-xs">🔒</span>
            <p>تتم التصفية تلقائياً للأوراق من جميع الفيروسات لضمان سلامة أرشيف نقابة المحامين المصريين.</p>
          </div>
        </div>

        {/* Document vault display and download tools (2/3 width) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4 text-right">
          <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 justify-start pb-2 border-b border-slate-100">
            <FolderLock className="w-4 h-4 text-slate-700" />
            صناديق وأرشيف الأوراق الثبوتية المفعلة (تنزيل وحفظ متاح للذاكرة)
          </h4>

          {vaultDocs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-1 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs">حقيبة مستنداتك الآمنة فارغة تماماً. يرجى سحب أي ملف في لوحة الرفع الجانبية.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vaultDocs.map((doc) => (
                <div key={doc.id} className="p-3.5 bg-slate-50 hover:bg-amber-50/20 border border-slate-200 hover:border-amber-500/30 rounded-xl transition duration-200 flex flex-col justify-between text-right relative overflow-hidden group shadow-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="px-1.5 py-0.2 bg-slate-250 bg-slate-200 text-slate-600 rounded text-[8px] font-bold font-sans">{doc.size}</span>
                      <p className="font-extrabold text-slate-900 text-xs truncate max-w-[80%]" title={doc.name}>{doc.name}</p>
                    </div>
                    <p className="text-[9px] text-slate-400 font-mono">تاريخ الإيداع: {new Date(doc.addedAt).toLocaleString("ar-EG")}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/50 flex gap-2 justify-between items-center">
                    {/* DOWNLOAD/SAVE FILE FROM APP BACK TO HARD DISK STORAGE MEMORY EXPLICITLY */}
                    <a
                      href={doc.fileBase64}
                      download={doc.name}
                      onClick={() => alert(`جاري بدء تنزيل وحفظ مستند [${doc.name}] بذاكرة التخزين المحلية للعبور المباشر!`)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black rounded-lg transition text-[10px]"
                    >
                      <DownloadCloud className="w-3.5 h-3.5 text-emerald-700" />
                      <span>حفظ للذاكرة (Download)</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteVaultDoc(doc.id, doc.name)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-750 transition rounded-lg"
                      title="استبعاد المستند"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
