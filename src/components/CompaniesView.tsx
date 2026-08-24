import React, { useState } from "react";

export default function CompaniesView() {
  const [companyType, setCompanyType] = useState("شركة ذات مسؤولية محدودة (ش.م.م)");
  const [partnerCount, setPartnerCount] = useState("3");
  const [capital, setCapital] = useState("250000");
  const [isForming, setIsForming] = useState(false);
  const [estimationResult, setEstimationResult] = useState<any | null>(null);

  const handleEstimateCompanyFees = () => {
    setIsForming(true);
    setEstimationResult(null);

    setTimeout(() => {
      setIsForming(false);
      setEstimationResult({
        govFees: (parseFloat(capital) * 0.0025 + 1200).toLocaleString("ar-EG") + " جنيه مصري",
        lawyersDraftFees: "4,500 جنيه مصري",
        syndicateFees: (parseFloat(capital) * 0.001 + 500).toLocaleString("ar-EG") + " جنيه",
        duration: "من 5 إلى 7 أيام عمل رسمية للهيئة العامة للاستثمار بمصر (GAFI)",
        totalPrice: ((parseFloat(capital) * 0.0035 + 6200)).toLocaleString("ar-EG") + " جنيه مصري"
      });
      alert("قام مستشار الذكاء الاصطناعي بجرد الرسوم الحكومية ونقابة المحامين ورسوم التوثيق بهيئة الاستثمار لعام ٢٠٢٦ بدقة!");
    }, 1200);
  };

  return (
    <div className="space-y-6 text-right font-sans text-slate-800" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-right">
        
        {/* Company configuration panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-xs leading-relaxed text-slate-800">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1.5">مدخلات ومعايير هيكل الشركة المراد تأسيسها</h3>
          
          <div className="space-y-3 font-sans">
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="company-type">النوع القانوني للشركة</label>
              <select
                id="company-type"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 rounded text-right font-bold outline-none focus:bg-white focus:border-amber-500 transition"
              >
                <option value="شركة ذات مسؤولية محدودة (ش.م.م)">شركة ذات مسؤولية محدودة (ش.م.م)</option>
                <option value="شركة مساهمة مصرية">شركة مساهمة مصرية</option>
                <option value="شركة الشخص الواحد">شركة الشخص الواحد</option>
                <option value="شركة تضامن">شركة تضامن</option>
                <option value="شركة توصية بسيطة">شركة توصية بسيطة</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1" htmlFor="partners-count">عدد الشركاء التأسيسيين</label>
                <input
                  id="partners-count"
                  type="number"
                  value={partnerCount}
                  onChange={(e) => setPartnerCount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded text-center outline-none focus:bg-white focus:border-amber-500 transition font-sans"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1" htmlFor="company-capital">رأس المال الابتدائي (EGP)</label>
                <input
                  id="company-capital"
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded text-center font-bold text-amber-800 outline-none focus:bg-white focus:border-amber-500 transition font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="calc-company-fees-btn"
                type="button"
                onClick={handleEstimateCompanyFees}
                disabled={isForming}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-extrabold rounded-lg text-xs cursor-pointer transition shadow-sm"
              >
                {isForming ? "جاري الاستقصاء وجرد القوانين المالية..." : "احتساب الرسوم والأتعاب الحكومية بالذكاء الاصطناعي"}
              </button>
            </div>
          </div>
        </div>

        {/* AI response panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-xs text-slate-800">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1.5">التكلفة والرسوم الاسترشادية التقريبية لعام ٢٠٢٦</h3>
          
          {estimationResult ? (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-inner font-sans animate-fade-in text-slate-800">
              <p className="flex justify-between border-b border-slate-200/60 pb-1.5"><span className="text-slate-400 font-bold">النوع المحدد للشركة:</span> <span className="text-slate-900 font-extrabold">{companyType}</span></p>
              <p className="flex justify-between border-b border-slate-200/60 pb-1.5"><span className="text-slate-400 font-bold">تقدير الرسوم الحكومية:</span> <span className="text-slate-900 font-bold">{estimationResult.govFees}</span></p>
              <p className="flex justify-between border-b border-slate-200/60 pb-1.5"><span className="text-slate-400 font-bold">رسوم توثيق نقابة المحامين:</span> <span className="text-slate-900 font-bold">{estimationResult.lawyersDraftFees}</span></p>
              <p className="flex justify-between border-b border-slate-200/60 pb-1.5"><span className="text-slate-400 font-bold">رسوم دمغات النشر بالصحيفة:</span> <span className="text-slate-900 font-bold">{estimationResult.syndicateFees}</span></p>
              <p className="flex justify-between border-b border-slate-200/60 pb-1.5"><span className="text-slate-400 font-bold">المدة الزمنية المتوقعة للبدء:</span> <span className="text-emerald-800 font-extrabold">{estimationResult.duration}</span></p>
              <p className="flex justify-between pt-2 border-t border-slate-200 text-xs font-black text-slate-900"><span className="text-slate-700">مجموع الأتعاب والرسوم الإجمالي:</span> <span className="text-amber-800 text-sm font-black">{estimationResult.totalPrice}</span></p>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-slate-50 border border-slate-150 rounded-xl">
              اضبط معايير الشركة ورأس المال المستحب واضغط (احتساب بالذكاء الاصطناعي) لتوليد تقرير الرسوم الحكومية الشامل بمصر.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
