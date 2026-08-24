import React, { useState } from "react";
import { FeeTransfer, ClientProfile, UserRole, PlatformUser } from "../types";
import { Printer, Plus } from "lucide-react";

interface FeesViewProps {
  fees: FeeTransfer[];
  clients: ClientProfile[];
  onAddFeeTransfer: (fee: FeeTransfer) => void;
  currentUser: PlatformUser;
}

export default function FeesView({ fees, clients, onAddFeeTransfer, currentUser }: FeesViewProps) {
  const [selectedClientName, setSelectedClientName] = useState("");
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<ClientProfile | null>(null);

  // New payment form
  const [showAddForm, setShowAddForm] = useState(false);
  const [payClient, setPayClient] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payCurrency, setPayCurrency] = useState<"EGP" | "USD">("EGP");
  const [payType, setPayType] = useState<"cash" | "bank" | "wallet">("cash");
  const [payNotes, setPayNotes] = useState("");

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payClient || !payAmount) {
      alert("الرجاء اختيار العميل وتحديد المبلغ المسدد.");
      return;
    }

    const t: FeeTransfer = {
      id: "fee-" + Date.now(),
      clientName: payClient,
      amount: parseFloat(payAmount),
      currency: payCurrency,
      type: payType,
      date: new Date().toISOString().slice(0, 10),
      notes: payNotes
    };

    onAddFeeTransfer(t);
    setShowAddForm(false);
    setPayAmount("");
    setPayNotes("");
    alert("تم قيد وتقييد الفاتورة المالية سحابياً في جدول إيرادات مكتب وسام الشناوي المحامي!");
  };

  // Calculations for billing dashboard
  const egpGains = fees.filter(f => f.currency === "EGP").reduce((sum, current) => sum + current.amount, 0);
  const usdGains = fees.filter(f => f.currency === "USD").reduce((sum, current) => sum + current.amount, 0);

  const matchedClientWithReport = clients.find(cl => cl.name === selectedClientName);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Top Operations Bar */}
      {currentUser.role !== UserRole.CLIENT && (
        <div className="flex justify-between items-center flex-wrap gap-3">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300">
            سجل المقبوضات والأتعاب المالية ({fees.length} دفعة)
          </span>
          <button
            id="open-add-payment-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-slate-900" />
            تقييد دفعة مالية جديدة
          </button>
        </div>
      )}

      {/* REVENUE STATISTICS BLOCK */}
      {currentUser.role !== UserRole.CLIENT && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-right space-y-2 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold font-sans">إجمالي الإيرادات بالجنيه المصري (EGP)</p>
            <h3 className="text-2xl font-black text-emerald-805 font-mono">{egpGains.toLocaleString()} EGP</h3>
            <p className="text-[10px] text-slate-400">تم جردها من فواتير الموكلين المحليين</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-right space-y-2 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold font-sans">إجمالي الإيرادات بالدولار الأمريكي (USD)</p>
            <h3 className="text-2xl font-black text-amber-805 font-mono">${usdGains.toLocaleString()} USD</h3>
            <p className="text-[10px] text-slate-400">تم جردها من العملاء والموكلين الأجانب بالخارج</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-right space-y-2 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold font-sans">حالة المستحقات الباقية قضائياً</p>
            <h3 className="text-2xl font-black text-indigo-805 font-sans">
              {clients.reduce((s, c) => s + (c.remainingFees || 0), 0).toLocaleString()} EGP
            </h3>
            <p className="text-[10px] text-slate-400">مجموع الأتعاب المتبقية في ذمة الموكلين</p>
          </div>
        </div>
      )}

      {/* DYNAMIC RECEIPT PAYMENT FORM */}
      {showAddForm && (
        <form onSubmit={handleAddPaymentSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1.5">تقييد دفعة مالية وفاتورة قضائية جديدة</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs text-right font-sans">
            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="payment-client-select">اختر الموكل</label>
              <select
                id="payment-client-select"
                value={payClient}
                onChange={(e) => setPayClient(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition"
                required
              >
                <option value="">-- اختر العميل --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="payment-amount">المبلغ المدفوع</label>
              <input
                id="payment-amount"
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="أدخل قيمة كيمة الدفع"
                className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded text-right font-mono outline-none focus:bg-white focus:border-amber-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="payment-currency">العملة</label>
              <select
                id="payment-currency"
                value={payCurrency}
                onChange={(e) => setPayCurrency(e.target.value as "EGP" | "USD")}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 rounded text-right font-bold outline-none focus:bg-white focus:border-amber-500 transition"
              >
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1" htmlFor="payment-type">طريقة الدفع</label>
              <select
                id="payment-type"
                value={payType}
                onChange={(e) => setPayType(e.target.value as "cash" | "bank" | "wallet")}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 rounded outline-none focus:bg-white focus:border-amber-500 transition"
              >
                <option value="cash">نقداً بالمكتب</option>
                <option value="bank">تحويل بنكي / InstaPay</option>
                <option value="wallet">محفظة إلكترونية (فودافون كاش)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-705 text-xs mb-1 font-bold" htmlFor="payment-notes">ملحوظة أو بند الأتعاب المسدد عنه</label>
            <input
              id="payment-notes"
              type="text"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="مثال: القسط الأول عن طعن الجنايات الموكل به"
              className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 text-xs rounded text-right outline-none focus:bg-white focus:border-amber-500 transition font-sans"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              id="cancel-payment-form"
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              id="submit-payment-form"
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded cursor-pointer transition shadow-sm"
            >
              تسجيل وتحديث الحساب السحابي
            </button>
          </div>
        </form>
      )}

      {/* INDIVIDUAL CLIENT REPORT CARDS AND STATEMENT GENERATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        
        {/* Selection sidebar for Client ledger details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-slate-800">
          <h3 className="text-sm font-bold text-slate-900 pb-1.5 border-b border-slate-100">كشف حساب تفصيلي لموكل قضائي</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            اختر اسم موكل من القائمة لعرض تفصيلي لاتفاق الأتعاب والمتبقي والمقبوضات المؤرخة وتجهيز الفاتورة المناسبة للطباعة.
          </p>

          <div className="space-y-3">
            <select
              id="ledger-client-select"
              value={selectedClientName}
              onChange={(e) => {
                setSelectedClientName(e.target.value);
                const clObj = clients.find(cl => cl.name === e.target.value);
                setSelectedClientForInvoice(clObj || null);
              }}
              className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-3 py-2 text-xs rounded text-right font-medium outline-none focus:bg-white focus:border-amber-500 transition font-sans"
            >
              <option value="">-- اختر الموكل --</option>
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            {matchedClientWithReport && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs text-slate-850">
                <p className="font-extrabold text-slate-900 pb-1.5 border-b border-slate-200">{matchedClientWithReport.name}</p>
                <p><span className="text-slate-400">رقم التوكيل:</span> <span className="text-slate-900 font-bold font-sans">{matchedClientWithReport.poaNumber} {matchedClientWithReport.poaLetter}</span></p>
                <p><span className="text-slate-400">محل التوثيق:</span> <span className="text-slate-900 font-medium">{matchedClientWithReport.poaOffice}</span></p>
                <p><span className="text-slate-400">القضية:</span> <span className="text-blue-750 font-bold">رقم {matchedClientWithReport.caseNumber}</span></p>
                <p><span className="text-slate-400 font-bold">باقي الأتعاب المعينة:</span> <span className="text-amber-800 font-black font-sans">{matchedClientWithReport.remainingFees?.toLocaleString()} EGP</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Invoice presentation paper printable */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-right relative text-slate-800">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-2">
            <button
              id="print-invoice"
              onClick={() => window.print()}
              disabled={!selectedClientForInvoice}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-50 text-slate-750 text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              طباعة فاتورة الموكل
            </button>
            <h3 className="text-sm font-bold text-slate-900">مستند مخالصة وفاتورة تصفية أتعاب</h3>
          </div>

          {selectedClientForInvoice ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-6 leading-relaxed font-sans text-slate-900 shadow-sm" id="invoice-bill-paper">
              {/* Invoice header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div className="text-left font-mono text-[10px] text-slate-400">
                  <p>تاريخ الفاتورة: {new Date().toLocaleDateString("ar-EG")}</p>
                  <p>رقم المستند المالي: INV-{selectedClientForInvoice.id.slice(-4).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-bold text-slate-905 text-slate-900">مكتب الأستاذ وسام الشناوي المحامي</h4>
                  <p className="text-[10px] text-slate-500 font-sans">هاتف: 01283233555 - ههيا / الزقازيق / الشرقية</p>
                </div>
              </div>

              {/* Invoice client fields */}
              <div>
                <p className="text-slate-500 font-bold mb-2 text-right">فاتورة صادرة لصالح السيد الموكل:</p>
                <div className="grid grid-cols-2 gap-4 bg-white border border-slate-150 p-3.5 rounded-xl text-slate-800 shadow-sm">
                  <p><span className="text-slate-400">اسم الموكل:</span> <span className="text-slate-900 font-extrabold">{selectedClientForInvoice.name}</span></p>
                  <p><span className="text-slate-400">الرقم القومي:</span> <span className="text-slate-900 font-bold font-mono">{selectedClientForInvoice.nationalId}</span></p>
                  <p><span className="text-slate-400">رقم التوكيل القضائي:</span> <span className="text-slate-900 font-bold font-sans">{selectedClientForInvoice.poaNumber} {selectedClientForInvoice.poaLetter} ({selectedClientForInvoice.poaYear})</span></p>
                  <p><span className="text-slate-405 text-slate-400">القضية المتنازع عنه:</span> <span className="text-indigo-800 font-bold">رقم {selectedClientForInvoice.caseNumber} لسنة ٢٠٢٦ م</span></p>
                </div>
              </div>

              {/* Receipts lists */}
              <div className="space-y-2">
                <p className="text-slate-500 font-bold">بند الحساب والمتحصلات المسجلة:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-right font-sans">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400">
                        <th className="pb-1 text-right">البند والدفعات السابقة</th>
                        <th className="pb-1 text-center font-sans">التاريخ</th>
                        <th className="pb-1 text-left">المسدد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.filter(f => f.clientName === selectedClientForInvoice.name).map((fee, idx) => (
                        <tr key={fee.id} className="border-b border-slate-200/60 text-slate-850">
                          <td className="py-2 text-slate-700">{fee.notes || "دفعة معجلة من الأتعاب القضائية"}</td>
                          <td className="py-2 text-center text-slate-500 font-mono">{fee.date}</td>
                          <td className="py-2 text-left text-emerald-700 font-extrabold font-mono">{fee.amount.toLocaleString()} {fee.currency}</td>
                        </tr>
                      ))}
                      {fees.filter(f => f.clientName === selectedClientForInvoice.name).length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-400">لم تسجل أي مقبوضات نقدية مؤرخة لهذا العميل بعد.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice summary footer */}
              <div className="border-t border-slate-200 pt-4 flex justify-between items-center font-bold">
                <div className="text-left font-sans">
                  <p className="text-[10px] text-slate-400 font-normal">المبلغ المتبقي سداده عريضة</p>
                  <p className="text-amber-705 text-amber-800 text-lg font-black font-sans">{selectedClientForInvoice.remainingFees?.toLocaleString()} EGP</p>
                </div>
                <div className="text-right text-slate-400 font-normal text-[10px]">
                  <p>تعتبر هذه معالجة كربونية مالية إلكترونية من السحابة.</p>
                  <p className="text-amber-800 font-bold mt-1 text-xs font-sans">مضاء ومصدق / مكتب الأستاذ وسام الشناوي</p>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 border border-slate-150 rounded-xl">
              الرجاء تحديد موكل قضائي من القائمة الجانبية لإصدار وطباعة فاتورة التصفية والأتعاب.
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
