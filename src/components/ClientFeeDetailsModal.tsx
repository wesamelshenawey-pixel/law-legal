import React, { useState } from "react";
import { ClientProfile, CaseRecord, FeeTransfer, PlatformUser, UserRole } from "../types";
import { 
  X, 
  Printer, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Plus, 
  TrendingUp, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Scale, 
  QrCode, 
  User, 
  Phone, 
  Briefcase, 
  Building2, 
  Copy, 
  Check, 
  Share2,
  FileCheck2,
  Award
} from "lucide-react";
import QRCode from "react-qr-code";
import GoldenEagleEmblem from "./GoldenEagleEmblem";

interface ClientFeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientProfile | null;
  caseRecord?: CaseRecord | null;
  fees: FeeTransfer[];
  onAddPayment?: (transfer: FeeTransfer) => void;
  language: "ar" | "en";
  currentUser: PlatformUser;
  allCases?: CaseRecord[];
}

export default function ClientFeeDetailsModal({
  isOpen,
  onClose,
  client,
  caseRecord,
  fees,
  onAddPayment,
  language = "ar",
  currentUser,
  allCases = []
}: ClientFeeDetailsModalProps) {
  if (!isOpen || !client) return null;

  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"summary" | "ledger" | "invoice">("summary");
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  // New payment entry state
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payCurrency, setPayCurrency] = useState<"EGP" | "USD">("EGP");
  const [payType, setPayType] = useState<"cash" | "bank" | "wallet">("cash");
  const [payNotes, setPayNotes] = useState("");
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Find all fee transfers for this client
  const clientFees = fees.filter(f => 
    (f.clientName && f.clientName.trim() === client.name.trim()) ||
    (f.notes && f.notes.includes(client.name))
  );

  // Financial calculations
  const totalReceived = clientFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const remainingBalance = Number(client.remainingFees) || 0;
  const agreedTotalFees = totalReceived + remainingBalance;
  const completionPercentage = agreedTotalFees > 0 
    ? Math.min(100, Math.round((totalReceived / agreedTotalFees) * 100))
    : (remainingBalance === 0 ? 100 : 0);

  // Find associated cases for this client
  const associatedCases = allCases.filter(cs => 
    (cs.clientName && cs.clientName.trim() === client.name.trim()) ||
    cs.caseNumber === client.caseNumber
  );

  const invoiceNumber = `INV-${client.id.slice(-4).toUpperCase()}-${new Date().getFullYear()}`;
  const todayDateFormatted = new Date().toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount);
    if (!amountNum || amountNum <= 0) {
      alert(isAr ? "الرجاء إدخال مبلغ دفع صالح" : "Please enter a valid payment amount");
      return;
    }

    setIsSubmittingPay(true);
    const newTransfer: FeeTransfer = {
      id: `fee-${Date.now()}`,
      clientName: client.name,
      amount: amountNum,
      currency: payCurrency,
      type: payType,
      date: new Date().toISOString().slice(0, 10),
      notes: payNotes.trim() || (isAr ? `دفعة أتعاب قضائية مسددة لمكتب المحاماة` : `Legal fee installment paid to law firm`)
    };

    if (onAddPayment) {
      onAddPayment(newTransfer);
    }

    // Deduct remaining balance locally for client
    client.remainingFees = Math.max(0, (client.remainingFees || 0) - amountNum);
    try {
      const savedClientsStr = localStorage.getItem("law_clients");
      if (savedClientsStr) {
        const parsed: ClientProfile[] = JSON.parse(savedClientsStr);
        const idx = parsed.findIndex(c => c.id === client.id);
        if (idx !== -1) {
          parsed[idx].remainingFees = client.remainingFees;
          localStorage.setItem("law_clients", JSON.stringify(parsed));
        }
      }
    } catch (err) {
      console.error("Local storage sync error:", err);
    }

    setIsSubmittingPay(false);
    setShowAddPayment(false);
    setPayAmount("");
    setPayNotes("");
    alert(isAr ? "تم تسجيل الدفعة بنجاح وتحديث الرصيد المتبقي!" : "Payment recorded and balance updated successfully!");
  };

  const handlePrintInvoice = () => {
    setActiveTab("invoice");
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleCopyInvoiceSummary = () => {
    const text = `
📜 ${isAr ? "مكتب الأستاذ وسام الشناوي المحامي بالنقض والدستورية العليا" : "Law Office of Adv. Wesam Al-Shenawey"}
${isAr ? "فاتورة وكشف حساب أتعاب قانونية" : "Legal Fee Statement & Invoice"}
------------------------------------
${isAr ? "الموكل:" : "Client:"} ${client.name}
${isAr ? "الرقم القومي:" : "National ID:"} ${client.nationalId}
${isAr ? "القضية:" : "Case:"} ${caseRecord?.caseNumber || client.caseNumber || "قيد التداول"} (${caseRecord?.competentCourt || client.competentCourt || "المحكمة المختصة"})
${isAr ? "رقم الفاتورة:" : "Invoice #:"} ${invoiceNumber}
${isAr ? "التاريخ:" : "Date:"} ${todayDateFormatted}
------------------------------------
💰 ${isAr ? "إجمالي الأتعاب المتفق عليها:" : "Agreed Total Fees:"} ${agreedTotalFees.toLocaleString()} EGP
✅ ${isAr ? "المبالغ المسددة فعلياً:" : "Received / Paid Fees:"} ${totalReceived.toLocaleString()} EGP
⏳ ${isAr ? "الرصيد المتبقي الواجب سداده:" : "Remaining Outstanding Balance:"} ${remainingBalance.toLocaleString()} EGP
------------------------------------
${isAr ? "المكتب: 01283233555 - الزقازيق / ههيا / الشرقية" : "Contact: +201283233555 - Egypt"}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white font-sans" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full">
        
        {/* MODAL HEADER - Hidden during print */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  {isAr ? "تفاصيل الأتعاب والمستحقات والفاتورة" : "Fee Details, Balances & Invoice"}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {client.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr ? "كشف حساب تفصيلي بالمبالغ المتفق عليها والمقبوضات والمتبقي مع إمكانية طباعة فاتورة رسمية" : "Detailed breakdown of agreed fees, received amounts, and outstanding balances with instant invoice printing"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintInvoice}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              title={isAr ? "طباعة الفاتورة الرسمية" : "Print Official Invoice"}
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? "طباعة الفاتورة" : "Print Invoice"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS - Hidden during print */}
        <div className="px-6 pt-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex gap-2 print:hidden">
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "summary"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{isAr ? "نظرة عامة على الأتعاب" : "Fees Overview"}</span>
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "ledger"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{isAr ? `سجل الدفعات والمقبوضات (${clientFees.length})` : `Payment Ledger (${clientFees.length})`}</span>
          </button>
          <button
            onClick={() => setActiveTab("invoice")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "invoice"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? "معاينة الفاتورة الرسمية" : "Official Invoice Preview"}</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:overflow-visible">
          
          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-6 print:hidden">
              
              {/* CLIENT & CASE INFO HEADER CARD */}
              <div className="bg-gradient-to-r from-slate-50 via-amber-50/40 to-slate-50 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{isAr ? "بيانات الموكل" : "Client Info"}</span>
                  <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-500" />
                    <span>{client.name}</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.phone || client.whatsapp || "غير متوفر"}</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 font-mono">
                    <span className="text-slate-400">{isAr ? "الرقم القومي: " : "National ID: "}</span>
                    {client.nationalId}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{isAr ? "القضية والنزاع" : "Case & Dispute"}</span>
                  <p className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span>{caseRecord?.subject || client.subject || (isAr ? "دعوى متداولة" : "Active Case")}</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 font-mono">
                    <span className="text-slate-400">{isAr ? "رقم القضية: " : "Case #: "}</span>
                    <strong className="text-blue-600 dark:text-blue-400">{caseRecord?.caseNumber || client.caseNumber || "غير محدد"}</strong>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    <Building2 className="w-3.5 h-3.5 inline text-slate-400 ml-1" />
                    <span>{caseRecord?.competentCourt || client.competentCourt || "المحكمة المختصة"}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{isAr ? "التوكيل القضائي" : "Power of Attorney"}</span>
                  <p className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>{isAr ? "توكيل رسمي رقم " : "POA # "} {client.poaNumber} {client.poaLetter} ({client.poaYear})</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 truncate">
                    {client.poaOffice || (isAr ? "مكتب توثيق الشرقية" : "Notary Office")}
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={() => setShowAddPayment(true)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? "تسجيل دفعة سداد جديدة" : "Record New Payment"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 CORE FINANCIAL METRICS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* 1. AGREED TOTAL FEES */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                  <span className="text-slate-400 dark:text-slate-400 text-xs font-bold block mb-1">
                    {isAr ? "إجمالي الأتعاب المتفق عليها" : "Agreed Contract Fees"}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                      {agreedTotalFees.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-400">EGP</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isAr ? "شامل مرحلة التقاضي والمذكرات" : "Full litigation & representation"}</span>
                  </p>
                </div>

                {/* 2. RECEIVED / PAID FEES */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm relative overflow-hidden bg-gradient-to-b from-emerald-50/20 to-transparent">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                  <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold block mb-1">
                    {isAr ? "المبالغ المسددة فعلياً (المقبوضات)" : "Received / Paid Fees"}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {totalReceived.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">EGP</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isAr ? `تم تحصيل ${completionPercentage}% من الأتعاب` : `${completionPercentage}% collected`}</span>
                  </p>
                </div>

                {/* 3. REMAINING BALANCE */}
                <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden ${
                  remainingBalance > 0
                    ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                    : "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                }`}>
                  <span className={`text-xs font-bold block mb-1 ${
                    remainingBalance > 0 ? "text-amber-800 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"
                  }`}>
                    {isAr ? "الرصيد المتبقي المستحق" : "Outstanding Remaining Balance"}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl sm:text-3xl font-black font-mono ${
                      remainingBalance > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {remainingBalance.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-400">EGP</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {remainingBalance > 0 
                        ? (isAr ? "مستحق السداد مع صدور الحكم أو الجلسات" : "Due on hearings / verdict")
                        : (isAr ? "تم سداد كامل الأتعاب وخالصة الذمة" : "Fully settled and clear")}
                    </span>
                  </p>
                </div>

              </div>

              {/* PROGRESS BAR */}
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "مستوى تحصيل الأتعاب القضائية:" : "Fee Collection Progress:"}
                  </span>
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* QUICK INLINE ACTION BUTTONS */}
              <div className="flex flex-wrap gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowAddPayment(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? "قيد دفعة نقدية جديدة لهذا الموكل" : "Record New Payment"}</span>
                </button>
                <button
                  onClick={() => setActiveTab("ledger")}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isAr ? "عرض جدول الدفعات التفصيلي" : "View Payments Ledger"}</span>
                </button>
                <button
                  onClick={handlePrintInvoice}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition shadow-md"
                >
                  <Printer className="w-4 h-4 text-slate-950" />
                  <span>{isAr ? "إصدار وطباعة فاتورة الأتعاب الرسمية" : "Print Official Invoice"}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: LEDGER */}
          {activeTab === "ledger" && (
            <div className="space-y-6 print:hidden">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? "سجل كافة الدفعات والمقبوضات المقيدة" : "Recorded Payments & Receipts"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {isAr ? "بيان مؤرخ وموثق لجميع التحويلات والمقبوضات النقدية والبنكية للموكل" : "Chronological ledger of cash, bank, and digital fee transfers"}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddPayment(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? "إضافة دفعة" : "Add Payment"}</span>
                </button>
              </div>

              {clientFees.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-xs text-right font-sans">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4 text-right font-bold">#</th>
                        <th className="py-3 px-4 text-right font-bold">{isAr ? "تاريخ السداد" : "Date"}</th>
                        <th className="py-3 px-4 text-right font-bold">{isAr ? "المبلغ المسدد" : "Amount Paid"}</th>
                        <th className="py-3 px-4 text-right font-bold">{isAr ? "طريقة الدفع" : "Method"}</th>
                        <th className="py-3 px-4 text-right font-bold">{isAr ? "البيان والملاحظات" : "Notes / Reference"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {clientFees.map((fee, idx) => (
                        <tr key={fee.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 font-bold">{fee.date}</td>
                          <td className="py-3 px-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {fee.amount.toLocaleString()} {fee.currency}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {fee.type === "cash" ? (isAr ? "نقداً بالخزينة" : "Cash") :
                               fee.type === "bank" ? (isAr ? "تحويل بنكي / إنستاباي" : "Bank / InstaPay") :
                               (isAr ? "محفظة إلكترونية" : "E-Wallet")}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {fee.notes || (isAr ? "دفعة أتعاب قضائية" : "Legal fee installment")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-800">
                      <tr>
                        <td colSpan={2} className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {isAr ? "المجموع الكلي للمسدد:" : "Total Paid Amount:"}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 text-sm font-black">
                          {totalReceived.toLocaleString()} EGP
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-left text-slate-400 font-normal">
                          {isAr ? `المتبقي: ${remainingBalance.toLocaleString()} EGP` : `Remaining: ${remainingBalance.toLocaleString()} EGP`}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-sm text-slate-600 dark:text-slate-400">
                    {isAr ? "لم تسجل أي مقبوضات نقدية مؤرخة لهذا الموكل بعد." : "No payment transfers recorded for this client yet."}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAr ? "يمكنك تسجيل أول دفعة بالضغط على زر إضافة دفعة بالأعلى." : "You can record the first installment using the button above."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OFFICIAL INVOICE VIEW (PRINTABLE) */}
          {(activeTab === "invoice" || typeof window !== "undefined") && (
            <div className={activeTab === "invoice" ? "block" : "hidden print:block"}>
              
              {/* PRINT TOP BAR - Hidden during print */}
              <div className="flex justify-between items-center mb-4 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {isAr ? "معاينة الطباعة للفاتورة الرسمية A4:" : "A4 Official Invoice Print Preview:"}
                  </span>
                  <span className="text-[11px] font-mono bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                    {invoiceNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyInvoiceSummary}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedInvoice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedInvoice ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ البيانات" : "Copy")}</span>
                  </button>
                  <button
                    onClick={handlePrintInvoice}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isAr ? "طباعة فورية للورق A4" : "Print A4 Now"}</span>
                  </button>
                </div>
              </div>

              {/* ACTUAL INVOICE PAPER (DESIGNED FOR OFFICIAL A4 AND BILINGUAL HEADERS) */}
              <div 
                id="printable-client-invoice-sheet" 
                className="bg-white text-slate-900 border-2 border-slate-300 rounded-2xl p-8 sm:p-10 shadow-lg relative overflow-hidden font-sans print:border-none print:shadow-none print:p-0 print:rounded-none"
              >
                {/* INVOICE OFFICIAL HEADER */}
                <div className="border-b-2 border-slate-900 pb-5 mb-6">
                  <div className="flex justify-between items-start gap-4">
                    {/* Right side: Lawyer details */}
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <GoldenEagleEmblem className="w-9 h-9" />
                        <div>
                          <h1 className="text-lg font-black text-slate-950 leading-tight">
                            مكتب الأستاذ وسام الشناوي
                          </h1>
                          <p className="text-xs font-bold text-amber-700">
                            المحامي بالنقض والدستورية العليا ومجلس الدولة
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-600 pt-1">
                        عضو اتحاد المحامين العرب • مستشار التحكيم والنزاعات الجنائية والمدنية والشركات
                      </p>
                      <p className="text-[10px] text-slate-500">
                        المركز الرئيسي: الشرقية / الزقازيق / ههيا • هاتف: 01283233555 - 01091234567
                      </p>
                    </div>

                    {/* Left side: Invoice metadata & QR code */}
                    <div className="text-left space-y-1 font-mono text-[10px]">
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center gap-3">
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs text-slate-900">فاتورة أتعاب قانونية</p>
                          <p className="text-amber-800 font-extrabold">{invoiceNumber}</p>
                          <p className="text-slate-500">تاريخ الإصدار: {todayDateFormatted}</p>
                          <p className="text-slate-500">حالة السداد: {remainingBalance === 0 ? "خالصة السداد 100%" : "تحصيل جاري"}</p>
                        </div>
                        <div className="p-1 bg-white border border-slate-200 rounded">
                          <QRCode value={`INVOICE:${invoiceNumber}|CLIENT:${client.name}|TOTAL:${agreedTotalFees}|PAID:${totalReceived}|BALANCE:${remainingBalance}`} size={54} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CLIENT & CASE INFORMATION GRID */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                  <h4 className="text-xs font-black text-slate-800 border-b border-slate-200 pb-2 mb-3 flex items-center justify-between">
                    <span>بيانات الموكل والخصومة القضائية (Client & Legal Proceedings)</span>
                    <span className="text-[10px] text-slate-500 font-normal">سجل رقم: #{client.serialNumber}</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs leading-relaxed">
                    <div>
                      <span className="text-slate-400 block text-[10px]">اسم الموكل:</span>
                      <strong className="text-slate-900 font-bold">{client.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">الرقم القومي:</span>
                      <strong className="text-slate-900 font-mono">{client.nationalId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">رقم وسنة التوكيل:</span>
                      <strong className="text-emerald-700">{client.poaNumber} {client.poaLetter} ({client.poaYear})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">مكتب التوثيق:</span>
                      <span className="text-slate-800">{client.poaOffice || "توثيق الزقازيق"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">رقم القضية:</span>
                      <strong className="text-blue-700 font-mono font-bold">رقم {caseRecord?.caseNumber || client.caseNumber || "قيد التسجيل"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">المحكمة المختصة:</span>
                      <span className="text-slate-800">{caseRecord?.competentCourt || client.competentCourt || "المحكمة المختصة"}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[10px]">موضوع النزاع:</span>
                      <span className="text-slate-800 font-bold">{caseRecord?.subject || client.subject || "أتعاب دفاع وتمثيل قضائي"}</span>
                    </div>
                  </div>
                </div>

                {/* STATEMENT OF PAYMENTS TABLE */}
                <div className="mb-6 space-y-2">
                  <h4 className="text-xs font-black text-slate-800">
                    كشف بحركات السداد والدفعات المقبوضة (Statement of Received Installments)
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 font-bold text-right">#</th>
                          <th className="py-2.5 px-3 font-bold text-right">تاريخ الدفعة</th>
                          <th className="py-2.5 px-3 font-bold text-right">البيان وقسيمة القبض</th>
                          <th className="py-2.5 px-3 font-bold text-center">طريقة الدفع</th>
                          <th className="py-2.5 px-3 font-bold text-left">المبلغ المسدد (EGP)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {clientFees.length > 0 ? (
                          clientFees.map((f, i) => (
                            <tr key={f.id || i} className="text-slate-800">
                              <td className="py-2 px-3 font-mono text-slate-400 text-[10px]">{i + 1}</td>
                              <td className="py-2 px-3 font-mono text-slate-600">{f.date}</td>
                              <td className="py-2 px-3 text-slate-900 font-medium">{f.notes || "دفعة معجلة من الأتعاب"}</td>
                              <td className="py-2 px-3 text-center">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                                  {f.type === "cash" ? "نقداً" : f.type === "bank" ? "بنك / إنستاباي" : "محفظة"}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-left font-mono font-extrabold text-emerald-700">
                                {f.amount.toLocaleString()} EGP
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-slate-400">
                              لم تسجل مقبوضات مسددة حتى تاريخه، والأتعاب مستحقة السداد بالكامل.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TOTALS & FINANCIAL SUMMARY BOX */}
                <div className="bg-gradient-to-r from-slate-50 to-amber-50/50 border border-slate-300 rounded-xl p-5 mb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="border-b sm:border-b-0 sm:border-l border-slate-200 pb-3 sm:pb-0">
                      <span className="text-[11px] text-slate-500 font-bold block mb-1">إجمالي الأتعاب المتفق عليها</span>
                      <strong className="text-xl font-black text-slate-900 font-mono">
                        {agreedTotalFees.toLocaleString()} EGP
                      </strong>
                    </div>

                    <div className="border-b sm:border-b-0 sm:border-l border-slate-200 pb-3 sm:pb-0">
                      <span className="text-[11px] text-emerald-700 font-bold block mb-1">إجمالي المبالغ المسددة فعلياً</span>
                      <strong className="text-xl font-black text-emerald-700 font-mono">
                        {totalReceived.toLocaleString()} EGP
                      </strong>
                    </div>

                    <div>
                      <span className="text-[11px] text-amber-800 font-bold block mb-1">صافي الرصيد المتبقي الواجب سداده</span>
                      <strong className="text-xl font-black text-amber-800 font-mono">
                        {remainingBalance.toLocaleString()} EGP
                      </strong>
                    </div>
                  </div>
                </div>

                {/* LEGAL CLAUSES & OFFICIAL SIGNATURE / STAMP SECTION */}
                <div className="border-t-2 border-slate-200 pt-5 grid grid-cols-2 gap-8 items-end text-xs">
                  <div className="space-y-1.5 text-slate-500 text-[10px] leading-relaxed">
                    <p className="font-bold text-slate-700">ملاحظات والتزامات قانونية:</p>
                    <p>• تعتبر هذه الفاتورة إشعاراً رسمياً بكافة المبالغ المسددة والمتبقية طبقاً لعقد الاتفاق والأتعاب المحرر مع الموكل.</p>
                    <p>• تسدد الأتعاب المتبقية وفقاً لجدول الجلسات أو بعد صدور الحكم المنهي للخصومة.</p>
                    <p>• يقر الموكل بصحة الأرقام الواردة بهذا الإشعار المحاسبي المعتمد من السحابة.</p>
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-xs font-bold text-slate-700">اعتماد وخاتم مكتب المحاماة</p>
                    <div className="h-16 flex items-center justify-center">
                      {/* Stylized official attorney seal */}
                      <div className="w-24 h-24 border-2 border-dashed border-amber-600 rounded-full flex flex-col items-center justify-center p-1 text-[9px] text-amber-900 rotate-[-8deg] bg-amber-50/50 shadow-inner">
                        <span className="font-bold">مكتب وسام الشناوي</span>
                        <span className="text-[8px] text-emerald-800 font-mono">★ معتمد رسمياً ★</span>
                        <span className="text-[7px]">محامٍ بالنقض والدستورية</span>
                      </div>
                    </div>
                    <p className="font-extrabold text-slate-900 text-xs">
                      الأستاذ وسام الشناوي المحامي
                    </p>
                  </div>
                </div>

                {/* BOTTOM WATERMARK */}
                <div className="mt-8 pt-3 border-t border-slate-100 text-center text-[9px] text-slate-400 font-mono flex justify-between items-center">
                  <span>منظومة الإدارة السحابية لمكتب المحاماة الرقمي • كود الوثيقة: {invoiceNumber}</span>
                  <span>صفحة 1 من 1 • معالجة رقمية مشفرة</span>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* INLINE RECORD PAYMENT MODAL / DRAWER */}
        {showAddPayment && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? "تسجيل دفعة جديدة للموكل" : "Record New Payment"}</span>
                </h4>
                <button
                  onClick={() => setShowAddPayment(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">{isAr ? "الموكل:" : "Client:"}</label>
                  <input
                    type="text"
                    disabled
                    value={client.name}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                      {isAr ? "المبلغ المسدد (EGP) *" : "Amount Paid *"}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="مثال: 5000"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                      {isAr ? "طريقة الدفع" : "Payment Method"}
                    </label>
                    <select
                      value={payType}
                      onChange={(e: any) => setPayType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="cash">{isAr ? "نقداً بالخزينة" : "Cash"}</option>
                      <option value="bank">{isAr ? "إنستاباي / تحويل بنكي" : "InstaPay / Bank"}</option>
                      <option value="wallet">{isAr ? "محفظة فودافون كاش / أورانج" : "Vodafone Cash"}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                    {isAr ? "البيان والملاحظات" : "Receipt Notes"}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? "مثال: دفعة معجلة أتعاب جلسة استئناف..." : "e.g., Session installment..."}
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr ? `سيتم خصم هذا المبلغ فوراً من الرصيد المتبقي الحالي (${remainingBalance.toLocaleString()} ج.م)` : `Amount will be deducted from remaining balance (${remainingBalance.toLocaleString()} EGP)`}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddPayment(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold cursor-pointer transition"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPay}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? "تأكيد وقيد الدفعة" : "Confirm Payment"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
