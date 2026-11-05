import React, { useState } from "react";
import { PlatformUser } from "../types";
import { 
  CreditCard, 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  X, 
  Lock, 
  FileText, 
  Copy, 
  Check, 
  Sparkles,
  DollarSign,
  Download,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import QRCode from "react-qr-code";

interface ConsultationPaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: PlatformUser;
  onPaymentConfirmed: (paymentDetails: {
    transactionId: string;
    amount: number;
    planTitle: string;
    paymentMethod: string;
    timestamp: string;
  }) => void;
  language?: "ar" | "en";
}

export const CONSULTATION_PLANS = [
  {
    id: "quick_consultation",
    title: "استشارة قانونية فورية ومباشرة",
    price: 500,
    duration: "30 دقيقة هاتفياً أو عبر الفيديو",
    features: [
      "إجابة فورية ودقيقة على الاستفسار القانوني",
      "تطبيق مواد القانون وأحكام النقض الحديثة",
      "تحديد الموقف القانوني وأولى خطوات التحرك",
      "تأكيد وتوثيق الرأي القانوني في تقرير رقمي"
    ],
    recommended: false,
    badge: "الأكثر طلباً"
  },
  {
    id: "in_depth_consultation",
    title: "استشارة معمقة وفحص مستندات وأوراق",
    price: 1200,
    duration: "جلسة دراسة متكاملة ومراجعة أوراق",
    features: [
      "فحص شامل لكافة العقود وحوافظ المستندات المرفقة",
      "استخراج الثغرات ونقاط الضعف والقوة بالذكاء الاصطناعي",
      "مذكرة رأي قانوني مكتوبة وموقعة من الأستاذ المحامي",
      "خطة دفاع قضائية وإجرائية متكاملة للدعوى"
    ],
    recommended: true,
    badge: "الموصى به للملفات المعقدة"
  },
  {
    id: "contract_drafting",
    title: "صياغة عقد أو مذكرة دفاع مخصصة",
    price: 2500,
    duration: "صياغة قانونية متكاملة خلال 48 ساعة",
    features: [
      "صياغة عقد أو اتفاقية قانونية متكاملة الأركان",
      "تضمين الشروط الجزائية وضمانات التنفيذ الصارمة",
      "جلسة مراجعة وتعديل مفتوحة مع الموكل",
      "توثيق رقمي معتمد بختم النسر الرسمي للمكتب"
    ],
    recommended: false,
    badge: "خدمة الشركات والتعاقدات"
  }
];

export default function ConsultationPaymentGatewayModal({
  isOpen,
  onClose,
  currentUser,
  onPaymentConfirmed,
  language = "ar"
}: ConsultationPaymentGatewayModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("in_depth_consultation");
  const [paymentMethod, setPaymentMethod] = useState<"instapay" | "wallets" | "fawry" | "card">("instapay");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [senderPhoneOrHandle, setSenderPhoneOrHandle] = useState("");
  const [step, setStep] = useState<"select_plan" | "pay" | "confirmed">("select_plan");
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmedTransaction, setConfirmedTransaction] = useState<any>(null);

  const selectedPlan = CONSULTATION_PLANS.find(p => p.id === selectedPlanId) || CONSULTATION_PLANS[0];

  // Official Office Payment Receivers
  const INSTAPAY_HANDLE = "wesam.elshenawey@instapay";
  const VODAFONE_CASH_NUMBER = "01283233555";
  const FAWRY_MERCHANT_CODE = "98241";

  // Handle Confirm Payment
  const handleConfirmPayment = () => {
    if (!referenceNumber.trim()) {
      alert("يرجى إدخال الرقم المرجعي للتحويل أو رقم العملية لتأكيد السداد.");
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const txDetails = {
        transactionId: `TX-LEGAL-${Date.now().toString().slice(-6)}`,
        amount: selectedPlan.price,
        planTitle: selectedPlan.title,
        paymentMethod: 
          paymentMethod === "instapay" ? "إنستاباي (InstaPay)" :
          paymentMethod === "wallets" ? "محفظة إلكترونية (Vodafone/Orange Cash)" :
          paymentMethod === "fawry" ? "فوري (Fawry Pay)" : "بطاقة بنكية",
        timestamp: new Date().toISOString()
      };

      setConfirmedTransaction(txDetails);
      setStep("confirmed");
      onPaymentConfirmed(txDetails);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white flex justify-between items-center border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  بوابة السداد الآمن للاستشارات القانونية
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/30 text-emerald-300 font-mono">
                  InstaPay & E-Wallets
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                مكتب الأستاذ وسام الشناوي للمحاماة والاستشارات القانونية • تأكيد فوري ومعتمد
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Progress Steps Indicators */}
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[
              { num: 1, label: "باقة الاستشارة", active: step === "select_plan" },
              { num: 2, label: "طريقة الدفع وبيانات التحويل", active: step === "pay" },
              { num: 3, label: "التأكيد وبدء الاستشارة", active: step === "confirmed" }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition ${
                  s.active ? "bg-emerald-500 text-slate-950 shadow-md" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>
                  {s.num}
                </div>
                <span className={`text-xs font-bold ${s.active ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-slate-400"}`}>
                  {s.label}
                </span>
                {idx < 2 && <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>}
              </div>
            ))}
          </div>

          {/* STEP 1: Select Consultation Plan */}
          {step === "select_plan" && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  اختر نوع وباقة الاستشارة القانونية المطلوبة:
                </h4>
                <p className="text-xs text-slate-500">
                  كافة الاستشارات يقدمها ويشرف عليها مباشرة الأستاذ وسام الشناوي المحامي بالنقض
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CONSULTATION_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between relative text-right ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500 shadow-lg scale-102"
                          : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                      }`}
                    >
                      {plan.recommended && (
                        <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm">
                          {plan.badge}
                        </span>
                      )}

                      <div className="space-y-2">
                        <h5 className="text-sm font-black text-slate-900 dark:text-white">
                          {plan.title}
                        </h5>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {plan.price}
                          </span>
                          <span className="text-xs font-bold text-slate-500">جنيه مصري</span>
                        </div>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{plan.duration}</span>
                        </p>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5">
                          {plan.features.map((f, i) => (
                            <div key={i} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          type="button"
                          className={`w-full py-2 rounded-xl text-xs font-black transition ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-md"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-500 hover:text-slate-950"
                          }`}
                        >
                          {isSelected ? "تم الاختيار ✓" : "اختيار هذه الباقة"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setStep("pay")}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>متابعة لخيارات الدفع (المبلغ: {selectedPlan.price} ج.م)</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Pay & Enter Transfer Reference */}
          {step === "pay" && (
            <div className="space-y-5">
              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "instapay", label: "إنستاباي InstaPay", icon: "⚡" },
                  { id: "wallets", label: "محافظ إلكترونية كاش", icon: "📱" },
                  { id: "fawry", label: "فوري Fawry Pay", icon: "🏪" },
                  { id: "card", label: "بطاقة فيزا / ميزة", icon: "💳" }
                ].map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`p-3 rounded-2xl border-2 text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === method.id
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-md"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-xl">{method.icon}</span>
                    <span>{method.label}</span>
                  </button>
                ))}
              </div>

              {/* InstaPay Details Box */}
              {paymentMethod === "instapay" && (
                <div className="p-4 bg-gradient-to-br from-purple-500/10 via-slate-50 to-slate-100 dark:from-purple-950/20 dark:via-slate-850 dark:to-slate-900 border-2 border-purple-500/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>التحويل الفوري عبر تطبيق إنستاباي (InstaPay Egypt):</span>
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                      بدون أي مصاريف إضافية
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    {/* QR Code for direct scan in InstaPay */}
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-800/60 flex flex-col items-center justify-center text-center space-y-2">
                      <div className="p-2 bg-white rounded-xl shadow-xs">
                        <QRCode
                          value={`instapay://pay?pa=${INSTAPAY_HANDLE}&pn=WesamElShenawey&am=${selectedPlan.price}&cu=EGP`}
                          size={130}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">امسح الكود عبر تطبيق InstaPay للتحويل الفوري</span>
                    </div>

                    {/* Copyable InstaPay Handle & Mobile */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                          عنوان الدفع اللحظي (IPA Handle):
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={INSTAPAY_HANDLE}
                            className="flex-1 p-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs font-mono font-black text-purple-700 dark:text-purple-300"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(INSTAPAY_HANDLE);
                              setCopiedHandle(true);
                              setTimeout(() => setCopiedHandle(false), 2000);
                            }}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {copiedHandle ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedHandle ? "تم" : "نسخ"}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                          أو برقم الهاتف المرتبط بـ InstaPay:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={VODAFONE_CASH_NUMBER}
                            className="flex-1 p-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs font-mono font-black text-purple-700 dark:text-purple-300"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(VODAFONE_CASH_NUMBER);
                              setCopiedNumber(true);
                              setTimeout(() => setCopiedNumber(false), 2000);
                            }}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {copiedNumber ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedNumber ? "تم" : "نسخ"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-900 dark:text-amber-300 font-bold">
                        المبلغ المطلوب تحويله: <span className="font-mono font-black text-sm text-emerald-600">{selectedPlan.price} جنيه مصري</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* E-Wallets Details Box */}
              {paymentMethod === "wallets" && (
                <div className="p-4 bg-gradient-to-br from-red-500/10 via-slate-50 to-slate-100 dark:from-red-950/20 dark:via-slate-850 dark:to-slate-900 border-2 border-red-500/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-red-950 dark:text-red-300 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-red-600" />
                      <span>التحويل عبر محافظ الكاش (فودافون كاش / أورنج / إي آند / وي باي):</span>
                    </span>
                    <span className="text-[10px] bg-red-500/20 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-full font-bold">
                      رقم محفظة معتمد
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">
                        رقم محفظة كاش الخاصة بالمكتب:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={VODAFONE_CASH_NUMBER}
                          className="flex-1 p-2.5 bg-white dark:bg-slate-900 border-2 border-red-400 rounded-xl text-center font-mono font-black text-lg text-red-600 dark:text-red-400"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(VODAFONE_CASH_NUMBER);
                            setCopiedNumber(true);
                            setTimeout(() => setCopiedNumber(false), 2000);
                          }}
                          className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedNumber ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>نسخ</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                      <span className="font-black text-slate-900 dark:text-white block">طريقة التحويل من هاتفك:</span>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                        1. اطلب <code className="font-mono font-bold text-red-600">*9*7*{VODAFONE_CASH_NUMBER}*{selectedPlan.price}#</code>
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                        2. أدخل الرقم السري للمحفظة لتأكيد التحويل.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fawry or Card Box */}
              {(paymentMethod === "fawry" || paymentMethod === "card") && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {paymentMethod === "fawry" ? "الدفع من أي منفذ فوري أو محفظة Fawry:" : "الدفع بالبطاقة البنكية:"}
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-600">{selectedPlan.price} EGP</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-xs font-bold text-slate-500 block mb-1">كود خدمة فوري الخاص بالاستشارات القانونية:</span>
                    <span className="text-xl font-mono font-black text-amber-600 tracking-wider">788 - 01283233555</span>
                  </div>
                </div>
              )}

              {/* Reference Number & Sender Verification Input */}
              <div className="p-4 bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-2xl space-y-3">
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  تأكيد التحويل وبدء الاستشارة القانونية:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      الرقم المرجعي للعملية (Reference No / رقم الإيصال) *:
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="مثال: 84920482910"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      رقم الهاتف أو المعرف الذي تم التحويل منه:
                    </label>
                    <input
                      type="text"
                      value={senderPhoneOrHandle}
                      onChange={(e) => setSenderPhoneOrHandle(e.target.value)}
                      placeholder="مثال: 010... أو اسم حساب إنستاباي"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("select_plan")}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                  >
                    رجوع للباقات
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={isVerifying || !referenceNumber.trim()}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري التحقق من السداد...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تأكيد السداد وبدء الاستشارة الآن</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Confirmed & Instant Receipt */}
          {step === "confirmed" && confirmedTransaction && (
            <div className="py-6 text-center space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  تم تأكيد سداد الاستشارة القانونية بنجاح!
                </h4>
                <p className="text-xs text-slate-500">
                  تم تسجيل إيصال السداد المالي سحابياً وفتح جلسة الاستشارة القانونية المعتمدة فوراً
                </p>
              </div>

              {/* Official Receipt Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-emerald-500/40 max-w-md mx-auto text-right space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-black text-slate-900 dark:text-white">إيصال سداد استشارة قضائية</span>
                  <span className="font-mono text-emerald-600 font-black">{confirmedTransaction.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الباقة:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{confirmedTransaction.planTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المبلغ المسدد:</span>
                  <span className="font-mono font-black text-emerald-600">{confirmedTransaction.amount} جنيه مصري</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">طريقة الدفع:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{confirmedTransaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">التاريخ والوقت:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">{new Date(confirmedTransaction.timestamp).toLocaleString("ar-EG")}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>بدء الاستشارة القانونية مع المحامي / الذكاء الاصطناعي</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
