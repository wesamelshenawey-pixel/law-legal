import React, { useState, useMemo } from "react";
import { OFFICE_SERVICES, LegalOfficeService } from "../data/officeServicesData";
import { PlatformUser } from "../types";
import { 
  Briefcase, 
  Search, 
  Filter, 
  Phone, 
  MessageSquare, 
  Sparkles, 
  Scale, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  ChevronRight, 
  Building2, 
  Home, 
  Cpu, 
  Printer, 
  Send,
  X,
  ExternalLink,
  Layers,
  ArrowRight
} from "lucide-react";

interface OfficeServicesViewProps {
  currentUser?: PlatformUser;
  onNavigate?: (section: string) => void;
  language?: "ar" | "en";
}

export default function OfficeServicesView({
  currentUser,
  onNavigate,
  language = "ar"
}: OfficeServicesViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<LegalOfficeService | null>(null);
  const [requestModalService, setRequestModalService] = useState<LegalOfficeService | null>(null);
  const [requestClientName, setRequestClientName] = useState(currentUser?.name || "");
  const [requestClientPhone, setRequestClientPhone] = useState(currentUser?.phone || "");
  const [requestNotes, setRequestNotes] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);

  const categories = [
    { id: "all", label: "جميع الخدمات المتاحة", icon: "🏛️", count: OFFICE_SERVICES.length },
    { id: "litigation", label: "التقاضي والمحاكم العليا", icon: "⚖️", count: OFFICE_SERVICES.filter(s => s.category === "litigation").length },
    { id: "corporate", label: "الشركات والاستثمار", icon: "🏢", count: OFFICE_SERVICES.filter(s => s.category === "corporate").length },
    { id: "realestate", label: "التوثيق والشهر العقاري", icon: "🏠", count: OFFICE_SERVICES.filter(s => s.category === "realestate").length },
    { id: "arbitration", label: "التحكيم والوساطة", icon: "🕊️", count: OFFICE_SERVICES.filter(s => s.category === "arbitration").length },
    { id: "digital_ai", label: "الذكاء الاصطناعي والخدمات الرقمية", icon: "🤖", count: OFFICE_SERVICES.filter(s => s.category === "digital_ai").length },
  ];

  const filteredServices = useMemo(() => {
    return OFFICE_SERVICES.filter(s => {
      const matchCat = selectedCategory === "all" || s.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        s.title.toLowerCase().includes(q) || 
        s.titleEn.toLowerCase().includes(q) || 
        s.description.toLowerCase().includes(q) || 
        s.features.some(f => f.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handleSendServiceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestClientName.trim() || !requestClientPhone.trim()) {
      alert("يرجى كتابة الاسم ورقم الهاتف للتواصل وتأكيد الطلب.");
      return;
    }

    setRequestSuccess(true);
    setTimeout(() => {
      setRequestSuccess(false);
      setRequestModalService(null);
      setRequestNotes("");
    }, 2500);
  };

  const handlePrintServices = () => {
    window.print();
  };

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-black flex items-center gap-1.5">
                <span>⚖️</span>
                <span>ديوان الأستاذ وسام أحمد الشناوي المحامي</span>
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                ● جاهز لتقديم كافة الخدمات القانونية
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              قائمة الخدمات القانونية والإدارية الشاملة
            </h1>
            
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              منظومة متكاملة من الخدمات القانونية المتخصصة في كافة أفرع القانون والتقاضي وتأسيس الشركات والتوثيق والتحكيم والخدمات الرقمية بالذكاء الاصطناعي على مدار 24 ساعة.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            <button
              type="button"
              onClick={handlePrintServices}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة دليل الخدمات</span>
            </button>

            <a
              href="https://wa.me/201283233555?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%B7%D9%84%D8%A8%20%D8%AE%D8%AF%D9%85%D8%A9%20%D9%82%D8%A7%D9%86%D9%88%D9%86%D9%8A%D8%A9%20%D9%85%D9%86%20%D9%85%D9%83%D8%AA%D8%A8%20%D8%A7%D9%84%D8%A3%D8%B3%D8%AA%D8%A7%D8%B0%20%D9%88%D8%B3%D8%A7%D9%85%20%D8%A7%D9%84%D8%B4%D9%86%D8%A7%D9%88%D9%8A"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>واتساب الأستاذ وسام مباشرة</span>
            </a>

            <a
              href="tel:01283233555"
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>اتصال هاتفي فوري</span>
            </a>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer border ${
                selectedCategory === cat.id
                  ? "bg-slate-900 text-amber-400 border-amber-500 shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedCategory === cat.id ? "bg-amber-400 text-slate-950 font-black" : "bg-slate-100 dark:bg-slate-700 text-slate-500"
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] md:min-w-[300px]">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الخدمات (نقض، شركات، توثيق، ذكاء اصطناعي)..."
            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white pr-10 pl-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 shadow-sm transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            onClick={() => setSelectedService(service)}
            className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/80 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between p-5 group cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20 text-2xl group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black border border-slate-200 dark:border-slate-700">
                  {service.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors leading-snug">
                  {service.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5" dir="ltr">
                  {service.titleEn}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Features snippet */}
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                {service.features.slice(0, 2).map((feat, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-650 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[10.5px] font-bold text-amber-700 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{service.estimatedDays}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRequestModalService(service);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-lg transition shadow-sm cursor-pointer"
                >
                  طلب الخدمة ✍️
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedService(service);
                  }}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition"
                  title="عرض التفاصيل الكاملة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SERVICE DETAILS MODAL */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 text-right">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedService.icon}</span>
                <div>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-black rounded border border-amber-500/30">
                    {selectedService.categoryNameArabic}
                  </span>
                  <h3 className="text-base font-black text-white mt-1">{selectedService.title}</h3>
                  <p className="text-[10px] text-slate-400 font-mono" dir="ltr">{selectedService.titleEn}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200 text-xs">
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1.5">وصف الخدمة ونطاق العمل:</h4>
                <p className="text-slate-650 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  {selectedService.description}
                </p>
              </div>

              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm mb-2">مميزات وإجراءات تقديم الخدمة:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedService.features.map((feat, i) => (
                    <div key={i} className="p-2.5 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm mb-2">المستندات والأوراق المطلوبة للبدء:</h4>
                <div className="space-y-1.5">
                  {selectedService.requirements.map((req, i) => (
                    <div key={i} className="p-2 bg-amber-50/60 dark:bg-amber-500/5 rounded-lg border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-300 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span className="font-bold">المدة التقديرية لإنجاز الخدمة:</span>
                <span className="font-black text-amber-700 dark:text-amber-400">{selectedService.estimatedDays}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const s = selectedService;
                  setSelectedService(null);
                  setRequestModalService(s);
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>طلب هذه الخدمة وتوكيل المكتب ✍️</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/201283233555?text=${encodeURIComponent(`السلام عليكم أستاذ وسام، أستفسر بخصوص: ${selectedService.title}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>واتساب</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 transition"
                >
                  إغلاق
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REQUEST SERVICE MODAL */}
      {requestModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 text-right">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{requestModalService.icon}</span>
                <div>
                  <h3 className="text-sm font-black text-white">طلب خدمة: {requestModalService.title}</h3>
                  <p className="text-[10px] text-slate-400">سيتم قيد طلبكم ومراجعته بمعرفة الأستاذ وسام الشناوي والتواصل معكم فوراً</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequestModalService(null)}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">تم استلام طلب الخدمة بنجاح!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  تم تسجيل بياناتكم وسيقوم مكتب الأستاذ وسام الشناوي بالتواصل معكم عبر الهاتف والواتساب لمباشرة الإجراءات المطلوبة.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendServiceRequest} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">الاسم الثلاثي أو اسم الشركة / الموكل:</label>
                  <input
                    type="text"
                    required
                    value={requestClientName}
                    onChange={(e) => setRequestClientName(e.target.value)}
                    placeholder="مثال: أحمد محمود إبراهيم"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">رقم الهاتف للتواصل (WhatsApp / اتصال):</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={requestClientPhone}
                    onChange={(e) => setRequestClientPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">تفاصيل أو استفسارات إضافية حول الخدمة (اختياري):</label>
                  <textarea
                    rows={3}
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="اكتب أي ملاحظات أو أرقام قضايا أو مستندات متاحة..."
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-between items-center gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>تأكيد وإرسال طلب الخدمة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestModalService(null)}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
