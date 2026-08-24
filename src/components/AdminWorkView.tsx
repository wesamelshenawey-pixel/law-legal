import React, { useState } from "react";
import { Printer } from "lucide-react";

export default function AdminWorkView() {
  const [adminTaskType, setAdminTaskType] = useState("prosecution_petition");
  const [subjectInput, setSubjectInput] = useState("بند تسليم سيارة محجوزة بموجب توكيل");
  const [complainantName, setComplainantName] = useState("أحمد مصطفى حسن عبد الله");
  const [policeStationName, setPoliceStationName] = useState("مركز شرطة ههيا");
  const [complaintText, setComplaintText] = useState("");

  const [aiDraftOutput, setAiDraftOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreateAdministrativeDraft = async () => {
    setIsProcessing(true);
    setAiDraftOutput("");

    try {
      // Fetch or simulate backend compilation for court orders
      const inputPrompt = `النيابة العامة أو القسم: ${policeStationName} 
الشاكي: ${complainantName}
الموضوع الاداري: ${subjectInput}
التفاصيل المدعمة: ${complaintText || "عمل طلب تظلم إداري رسمي تمهيداً للعرض على السيد رئيس نيابة ههيا"}`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `صغ لي صيغة شكوى إدارية رسمية / تظلم رسمي للنيابة العامة بمصر بناء على المعطيات التالية:\n${inputPrompt}` })
      });
      const data = await res.json();
      setAiDraftOutput(data.text || "فشلت صياغة الطلب الإداري.");
    } catch (e) {
      console.error(e);
      setAiDraftOutput(`السيد رئيس نيابة قسم ههيا الموقر،
مقدمه لسيادتكم الأستاذ وسام الشناوي المحامي بصفتي وكيلاً عن السيد: ${complainantName} بموجب التوكيل الرسمي رقم...

الموضوع:
نلتمس من سيادتكم التفضل بالموافقة المبدئية على الطلب الإداري لـ [${subjectInput}] بمركز شرطة ههيا. 
وتفضلوا سيادتكم بقبول فائق الاحترام والتقدير.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans text-slate-800" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-right">
        
        {/* Form settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-xs leading-relaxed text-slate-850">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1.5">إدخال معايير وبنود الطلب الإداري</h3>
          
          <div className="space-y-4 font-sans">
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="admin-task-select">نوع الإجراء الإداري</label>
              <select
                id="admin-task-select"
                value={adminTaskType}
                onChange={(e) => setAdminTaskType(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 rounded text-right font-medium outline-none focus:bg-white focus:border-amber-500 transition font-sans"
              >
                <option value="prosecution_petition">عريضة تظلم وتصريح النيابة العامة</option>
                <option value="police_reports">تحرير محضر إدارى بقسم الشرطة</option>
                <option value="bailiffs_orders">أعمال محضري التنفيذ والإنذارات</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1" htmlFor="police-station">مركز الشرطة / القسم المعني</label>
                <input
                  id="police-station"
                  type="text"
                  value={policeStationName}
                  onChange={(e) => setPoliceStationName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 px-3 py-1.5 rounded border border-slate-200 text-right outline-none focus:bg-white focus:border-amber-500 transition font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1" htmlFor="complainant-name">اسم صاحب الشكوى / المشتكي</label>
                <input
                  id="complainant-name"
                  type="text"
                  value={complainantName}
                  onChange={(e) => setComplainantName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 px-3 py-1.5 rounded border border-slate-200 text-right outline-none focus:bg-white focus:border-amber-500 transition font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="admin-subject">موضوع الطلب الإداري</label>
              <input
                id="admin-subject"
                type="text"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 px-3 py-1.5 rounded border border-slate-200 text-right outline-none focus:bg-white focus:border-amber-500 transition font-sans"
              />
            </div>

            <div>
              <label className="block text-slate-705 text-xs mb-1 font-bold" htmlFor="complaint-desc">سرد تفصيلي للشكوى</label>
              <textarea
                id="complaint-desc"
                rows={3}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="تفاصيل موضوع المحضر..."
                className="w-full p-2.5 bg-slate-50 text-slate-900 rounded border border-slate-200 text-right outline-none focus:bg-white focus:border-amber-500 transition font-sans"
              />
            </div>

            <button
              id="draft-admin-job-btn"
              type="button"
              onClick={handleCreateAdministrativeDraft}
              disabled={isProcessing}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-extrabold rounded-lg transition shadow-sm cursor-pointer"
            >
              {isProcessing ? "جاري تحرير العريضة وسحب الصيغ..." : "صياغة وتوليد الطلب الإداري للمحامي بالـ AI"}
            </button>
          </div>
        </div>

        {/* Output Panel draft */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-xs leading-relaxed text-slate-800">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-2">
            <button
              id="print-admin-draft"
              disabled={!aiDraftOutput}
              onClick={() => window.print()}
              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-750 border border-slate-200 rounded flex items-center gap-1 cursor-pointer transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              طباعة العريضة
            </button>
            <h3 className="text-sm font-bold text-slate-900">الصيغة القانونية المحررة للنيابة العامة / المحضرين</h3>
          </div>

          {aiDraftOutput ? (
            <textarea
              id="admin-draft-result"
              rows={15}
              value={aiDraftOutput}
              onChange={(e) => setAiDraftOutput(e.target.value)}
              className="w-full p-4 bg-slate-50 text-slate-900 font-sans text-xs rounded-xl border border-slate-250 leading-relaxed text-right outline-none whitespace-pre-wrap focus:bg-white focus:border-amber-500 transition select-all shadow-inner"
            />
          ) : (
            <div className="p-16 text-center text-slate-400 bg-slate-50 border border-slate-150 rounded-xl">
              املأ البيانات واضغط التوليد بالـ AI لاستيراد عريضة شكوى إدارية جاهزة للطباعة والتوجه الفوري لقسم الشرطة أو النيابة الموقرة.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
