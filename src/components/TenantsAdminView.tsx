import React, { useState, useMemo } from "react";
import { 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  Users, 
  HardDrive, 
  DollarSign, 
  ExternalLink, 
  Download, 
  Filter, 
  Lock, 
  Briefcase, 
  MapPin, 
  Sparkles,
  RefreshCw,
  Clock
} from "lucide-react";

import { 
  UserRole, 
  PlatformUser 
} from "../types";

export interface TenantOffice {
  id: string;
  name: string;
  managingLawyer: string;
  barRegistrationNumber: string;
  barBranch: string;
  licenseDegree: "نقض" | "استئناف عالي" | "ابتدائي" | "جدول عام";
  gmail: string;
  phone: string;
  city: string;
  courtJurisdiction: string;
  plan: "monthly" | "yearly" | "enterprise";
  priceEgp: number;
  status: "active" | "suspended" | "pending_renewal";
  createdAt: string;
  subscriptionEnd: string;
  activeCasesCount: number;
  staffMembersCount: number;
  storageUsedGb: number;
  storageLimitGb: number;
  isVerified: boolean;
  notes?: string;
  nationalIdFront?: string;
  nationalIdBack?: string;
  lawyerCard?: string;
}

const INITIAL_TENANTS: TenantOffice[] = [
  {
    id: "t_1",
    name: "مجموعة الشناوي للاستشارات القانونية والتحكيم الدولي",
    managingLawyer: "الأستاذ وسام جمال الشناوي",
    barRegistrationNumber: "421890 / جيزة",
    barBranch: "نقابة المحامين الفرعية بالجيزة",
    licenseDegree: "نقض",
    gmail: "wesam.elshenawey@gmail.com",
    phone: "+201283233555",
    city: "الجيزة - الدقي",
    courtJurisdiction: "محكمة استئناف القاهرة ومحكمة النقض",
    plan: "enterprise",
    priceEgp: 18000,
    status: "active",
    createdAt: "2025-01-01",
    subscriptionEnd: "2027-01-01",
    activeCasesCount: 142,
    staffMembersCount: 12,
    storageUsedGb: 28.5,
    storageLimitGb: 100,
    isVerified: true,
    notes: "المكتب الرئيسي المعتمد لمنظومة إدارة المحاماة السحابية."
  },
  {
    id: "t_2",
    name: "صرح العدالة للمحاماة والشركات التجارية",
    managingLawyer: "أ.د. عبد الرحمن منصور الحفناوي",
    barRegistrationNumber: "389104 / القاهرة",
    barBranch: "نقابة المحامين بشرق القاهرة",
    licenseDegree: "نقض",
    gmail: "hefnawy.law.group@gmail.com",
    phone: "+201004589211",
    city: "القاهرة - مصر الجديدة",
    courtJurisdiction: "محاكم استئناف القاهرة وشمال القاهرة الابتدائية",
    plan: "yearly",
    priceEgp: 12000,
    status: "active",
    createdAt: "2025-06-15",
    subscriptionEnd: "2026-06-15",
    activeCasesCount: 96,
    staffMembersCount: 8,
    storageUsedGb: 14.2,
    storageLimitGb: 50,
    isVerified: true,
    notes: "متخصص في قضايا الضرائب وتأسيس الشركات المساهمة."
  },
  {
    id: "t_3",
    name: "مكتب الإسكندرية الدولي للنزاعات البحرية والمدنية",
    managingLawyer: "أ. طارق فاروق الإسكندراني",
    barRegistrationNumber: "512039 / الإسكندرية",
    barBranch: "نقابة محامين الإسكندرية",
    licenseDegree: "استئناف عالي",
    gmail: "alex.maritime.law@gmail.com",
    phone: "+201123498765",
    city: "الإسكندرية - المنشية",
    courtJurisdiction: "المحكمة الاقتصادية بالإسكندرية ومحكمة غرب الإسكندرية",
    plan: "yearly",
    priceEgp: 12000,
    status: "active",
    createdAt: "2025-09-01",
    subscriptionEnd: "2026-09-01",
    activeCasesCount: 64,
    staffMembersCount: 5,
    storageUsedGb: 8.9,
    storageLimitGb: 50,
    isVerified: true,
    notes: "ربط كامل مع موانئ الإسكندرية والنزاعات الجمركية."
  },
  {
    id: "t_4",
    name: "مكتب الدلتا للقضايا الجنائية والمدنية",
    managingLawyer: "أ. سامح عبد الفتاح البسيوني",
    barRegistrationNumber: "602118 / الدقهلية",
    barBranch: "نقابة محامين جنوب الدقهلية",
    licenseDegree: "استئناف عالي",
    gmail: "mansoura.delta.law@gmail.com",
    phone: "+201099887766",
    city: "المنصورة - المشاية",
    courtJurisdiction: "محكمة جنايات المنصورة ومأمورية استئناف المنصورة",
    plan: "monthly",
    priceEgp: 1200,
    status: "pending_renewal",
    createdAt: "2026-01-10",
    subscriptionEnd: "2026-08-30",
    activeCasesCount: 38,
    staffMembersCount: 3,
    storageUsedGb: 4.1,
    storageLimitGb: 20,
    isVerified: true,
    notes: "تنبيه تجديد الاشتراك الشهري عبر WhatsApp."
  },
  {
    id: "t_5",
    name: "المركز الصعيدي لحسم المنازعات العقارية والتعويضات",
    managingLawyer: "أ. حازم ممدوح الهواري",
    barRegistrationNumber: "478120 / أسيوط",
    barBranch: "نقابة محامين أسيوط",
    licenseDegree: "نقض",
    gmail: "assiut.legal.center@gmail.com",
    phone: "+201144556677",
    city: "أسيوط - شارع الجمهورية",
    courtJurisdiction: "محكمة استئناف أسيوط ومحاكم سوهاج وقنا",
    plan: "yearly",
    priceEgp: 12000,
    status: "active",
    createdAt: "2025-11-20",
    subscriptionEnd: "2026-11-20",
    activeCasesCount: 82,
    staffMembersCount: 6,
    storageUsedGb: 11.7,
    storageLimitGb: 50,
    isVerified: true,
    notes: "سجل قضايا النزاعات القبلية والأراضي الزراعية."
  },
  {
    id: "t_6",
    name: "دار الحقوق والاستشارات الأسرية والعمالية",
    managingLawyer: "أ. نهى كمال الدمرداش",
    barRegistrationNumber: "598432 / الجيزة",
    barBranch: "نقابة المحامين بالجيزة",
    licenseDegree: "ابتدائي",
    gmail: "dar.alhuquq.law@gmail.com",
    phone: "+201277665544",
    city: "الجيزة - الشيخ زايد",
    courtJurisdiction: "محكمة الأسرة بأكتوبر والشيخ زايد",
    plan: "monthly",
    priceEgp: 1200,
    status: "suspended",
    createdAt: "2026-02-01",
    subscriptionEnd: "2026-07-01",
    activeCasesCount: 19,
    staffMembersCount: 2,
    storageUsedGb: 2.3,
    storageLimitGb: 20,
    isVerified: false,
    notes: "اشتراك مجمد بانتظار سداد رسوم التجديد وتحديث كارنيه النقابة."
  }
];

export default function TenantsAdminView({ language, currentUser }: { language: "ar" | "en"; currentUser?: PlatformUser }) {
  const [tenants, setTenants] = useState<TenantOffice[]>(() => {
    try {
      const saved = localStorage.getItem("law_tenants_registry_v2");
      return saved ? JSON.parse(saved) : INITIAL_TENANTS;
    } catch {
      return INITIAL_TENANTS;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTenantForDetails, setSelectedTenantForDetails] = useState<TenantOffice | null>(null);

  const [newTenant, setNewTenant] = useState<Partial<TenantOffice>>({
    plan: "yearly",
    status: "active",
    licenseDegree: "استئناف عالي",
    priceEgp: 12000,
    storageLimitGb: 50,
    isVerified: true
  });

  const saveTenants = (updated: TenantOffice[]) => {
    setTenants(updated);
    localStorage.setItem("law_tenants_registry_v2", JSON.stringify(updated));
  };

  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.gmail || !newTenant.phone || !newTenant.managingLawyer) return;

    const created: TenantOffice = {
      id: "t_" + Date.now(),
      name: newTenant.name,
      managingLawyer: newTenant.managingLawyer,
      barRegistrationNumber: newTenant.barRegistrationNumber || `${Math.floor(100000 + Math.random() * 900000)} / نقابة المحامين`,
      barBranch: newTenant.barBranch || "نقابة المحامين العامة",
      licenseDegree: newTenant.licenseDegree || "استئناف عالي",
      gmail: newTenant.gmail,
      phone: newTenant.phone,
      city: newTenant.city || "القاهرة",
      courtJurisdiction: newTenant.courtJurisdiction || "محكمة استئناف القاهرة الابتدائية",
      plan: newTenant.plan || "yearly",
      priceEgp: newTenant.plan === "enterprise" ? 18000 : newTenant.plan === "yearly" ? 12000 : 1200,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
      subscriptionEnd: newTenant.plan === "monthly" ? "2026-09-25" : "2027-08-25",
      activeCasesCount: Number(newTenant.activeCasesCount) || 10,
      staffMembersCount: Number(newTenant.staffMembersCount) || 3,
      storageUsedGb: 1.2,
      storageLimitGb: newTenant.plan === "enterprise" ? 100 : newTenant.plan === "yearly" ? 50 : 20,
      isVerified: true,
      notes: newTenant.notes || "مكتب محاماة جديد مسجل ومفعل بقواعد البيانات السحابية."
    };

    const updated = [created, ...tenants];
    saveTenants(updated);
    setShowAddModal(false);
    setNewTenant({
      plan: "yearly",
      status: "active",
      licenseDegree: "استئناف عالي",
      priceEgp: 12000,
      storageLimitGb: 50,
      isVerified: true
    });
  };

  const toggleStatus = (id: string) => {
    const updated = tenants.map(t => {
      if (t.id === id) {
        const nextStatus: TenantOffice["status"] = t.status === "active" ? "suspended" : "active";
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveTenants(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المكتب المشترك؟ سيتم إلغاء ترخيصه وحذف ارتباط قواعد بياناته.")) {
      const updated = tenants.filter(t => t.id !== id);
      saveTenants(updated);
    }
  };

  const handleRenewSubscription = (id: string) => {
    const updated = tenants.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: "active" as const,
          subscriptionEnd: "2027-08-25"
        };
      }
      return t;
    });
    saveTenants(updated);
    alert("تم تجديد اشتراك المكتب بنجاح لمدة عام كامل!");
  };

  // Filtered tenants calculation
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.managingLawyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.gmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.phone.includes(searchQuery) ||
        t.barRegistrationNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCity = filterCity === "all" || t.city.includes(filterCity);
      const matchPlan = filterPlan === "all" || t.plan === filterPlan;
      const matchStatus = filterStatus === "all" || t.status === filterStatus;

      return matchSearch && matchCity && matchPlan && matchStatus;
    });
  }, [tenants, searchQuery, filterCity, filterPlan, filterStatus]);

  // Financial and Capacity Metrics
  const totalRevenueEgp = tenants.reduce((acc, t) => acc + (t.status === "active" ? t.priceEgp : 0), 0);
  const totalActiveCases = tenants.reduce((acc, t) => acc + t.activeCasesCount, 0);
  const totalStaffSeats = tenants.reduce((acc, t) => acc + t.staffMembersCount, 0);
  const totalStorageGb = tenants.reduce((acc, t) => acc + t.storageUsedGb, 0);

  return (
    <div className="space-y-6 text-right font-sans" dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* Top Banner & Multi-Tenancy Hub Header */}
      <div className="p-6 bg-gradient-to-l from-slate-950 via-slate-900 to-amber-950 text-white rounded-3xl border border-amber-500/30 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <Building className="w-6 h-6 text-amber-400" />
              <h2 className="text-lg font-black tracking-wide">
                إدارة المكاتب والمشتركين المستقلين (Multi-Tenancy Platform)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                منظومة SaaS للمحاماة
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              إدارة اشتراكات مكاتب المحاماة الرقمية المستقلة على مستوى جمهورية مصر العربية، مع عزل أمني كامل لقواعد البيانات والوثائق السحابية، وربط كل مكتب بـ Gmail ورقم هاتف خاص به.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-2 transition shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل مكتب محاماة جديد</span>
            </button>
          </div>
        </div>

        {/* Live Performance & Revenue Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
            <span className="block text-[11px] text-slate-400 mb-0.5">المكاتب المسجلة</span>
            <span className="text-base font-black text-white font-mono">{tenants.length} مكتب</span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
            <span className="block text-[11px] text-emerald-400 mb-0.5">الإيراد السنوي المحصل</span>
            <span className="text-base font-black text-emerald-400 font-mono">{totalRevenueEgp.toLocaleString()} ج.م</span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
            <span className="block text-[11px] text-blue-400 mb-0.5">إجمالي القضايا النشطة</span>
            <span className="text-base font-black text-blue-400 font-mono">{totalActiveCases} قضية</span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
            <span className="block text-[11px] text-purple-400 mb-0.5">طاقم العمل والمحامين</span>
            <span className="text-base font-black text-purple-400 font-mono">{totalStaffSeats} محامٍ وباحث</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="بحث باسم المكتب، المحامي، Gmail، الهاتف، أو رقم القيد بالنقابة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-3 py-2 text-xs outline-none focus:border-amber-500 text-right"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none text-right font-medium"
          >
            <option value="all">كل المحافظات</option>
            <option value="القاهرة">القاهرة</option>
            <option value="الجيزة">الجيزة</option>
            <option value="الإسكندرية">الإسكندرية</option>
            <option value="المنصورة">المنصورة / الدقهلية</option>
            <option value="أسيوط">أسيوط / الصعيد</option>
          </select>

          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none text-right font-medium"
          >
            <option value="all">كل باقات الاشتراك</option>
            <option value="monthly">شهري (1,200 ج.م)</option>
            <option value="yearly">سنوي (12,000 ج.م)</option>
            <option value="enterprise">المكاتب الكبرى VIP (18,000 ج.م)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none text-right font-medium"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط ومعتمد</option>
            <option value="pending_renewal">بانتظار التجديد</option>
            <option value="suspended">مجمد وموقوف</option>
          </select>
        </div>
      </div>

      {/* Offices Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTenants.map((tenant) => {
          const isExpiringSoon = tenant.status === "pending_renewal";
          const isActive = tenant.status === "active";

          return (
            <div
              key={tenant.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
            >
              {/* Top Accent Strip based on Status */}
              <div
                className={`h-2 w-full ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : isExpiringSoon
                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                    : "bg-gradient-to-r from-red-500 to-rose-500"
                }`}
              />

              <div className="p-5 space-y-4">
                {/* Header: Office Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                        {tenant.name}
                      </h4>
                      {tenant.isVerified && (
                        <span title="مكتب معتمد وموثق">
                          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                      {tenant.managingLawyer} ({tenant.licenseDegree})
                    </p>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-black ${
                      isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : isExpiringSoon
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse"
                        : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                    }`}
                  >
                    {isActive ? "نشط ومفعل" : isExpiringSoon ? "مطلوب التجديد" : "مجمد"}
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>قيد النقابة:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{tenant.barRegistrationNumber}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>المقر القضائي:</span>
                    </span>
                    <span className="font-medium">{tenant.city}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Gmail:</span>
                    </span>
                    <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 truncate max-w-[180px]">
                      {tenant.gmail}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>الهاتف المعتمد:</span>
                    </span>
                    <span className="font-mono font-bold">{tenant.phone}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>انتهاء الاشتراك:</span>
                    </span>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{tenant.subscriptionEnd}</span>
                  </div>
                </div>

                {/* Quotas & Capacity Micro-Bar */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>القضايا: {tenant.activeCasesCount}</span>
                    </span>
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>الفريق: {tenant.staffMembersCount}</span>
                    </span>
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-400" />
                      <span>السعة: {tenant.storageUsedGb}/{tenant.storageLimitGb}GB</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (tenant.storageUsedGb / tenant.storageLimitGb) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTenantForDetails(tenant)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  التفاصيل والملف
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleStatus(tenant.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                      isActive
                        ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60"
                    }`}
                  >
                    {isActive ? "تجميد" : "تفعيل"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(tenant.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                    title="حذف المكتب نهائياً"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Law Office Creation */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-500" />
                <span>تسجيل مكتب محاماة رقمي جديد (Tenant Provisioning)</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTenant} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المكتب أو المجموعة القانونية:
                </label>
                <input
                  required
                  type="text"
                  placeholder="مكتب النور للاستشارات القانونية..."
                  value={newTenant.name || ""}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المحامي المسؤول / المدير:
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="الأستاذ / ..."
                    value={newTenant.managingLawyer || ""}
                    onChange={(e) => setNewTenant({ ...newTenant, managingLawyer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    درجة القيد بالنقابة:
                  </label>
                  <select
                    value={newTenant.licenseDegree || "استئناف عالي"}
                    onChange={(e) => setNewTenant({ ...newTenant, licenseDegree: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-right font-medium"
                  >
                    <option value="نقض">محامٍ بالنقض والدستورية العليا</option>
                    <option value="استئناف عالي">استئناف عالي ومجلس دولة</option>
                    <option value="ابتدائي">محاكم ابتدائية</option>
                    <option value="جدول عام">جدول عام</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    البريد الإلكتروني (Gmail للمكتب):
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="office@gmail.com"
                    value={newTenant.gmail || ""}
                    onChange={(e) => setNewTenant({ ...newTenant, gmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none dir-ltr text-left font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف / بوابة تسجيل الدخول:
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="+201..."
                    value={newTenant.phone || ""}
                    onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none dir-ltr text-left font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المحافظة / المدينة:
                  </label>
                  <input
                    type="text"
                    placeholder="القاهرة - المعادي"
                    value={newTenant.city || ""}
                    onChange={(e) => setNewTenant({ ...newTenant, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    خطة الاشتراك:
                  </label>
                  <select
                    value={newTenant.plan || "yearly"}
                    onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-right font-medium"
                  >
                    <option value="monthly">اشتراك شهري (1,200 ج.م)</option>
                    <option value="yearly">اشتراك سنوي (12,000 ج.م)</option>
                    <option value="enterprise">باقة المكاتب الكبرى VIP (18,000 ج.م)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات وتراخيص خاصة:
                </label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول صلاحيات المكتب والتكامل السحابي..."
                  value={newTenant.notes || ""}
                  onChange={(e) => setNewTenant({ ...newTenant, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-right"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl transition text-xs shadow-md cursor-pointer"
                >
                  تسجيل المكتب وإنشاء مساحة العمل السحابية
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Office Details & Subscription Renewal */}
      {selectedTenantForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-amber-500" />
                  <span>{selectedTenantForDetails.name}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  المدير المسؤول: {selectedTenantForDetails.managingLawyer} ({selectedTenantForDetails.licenseDegree})
                </p>
              </div>
              <button
                onClick={() => setSelectedTenantForDetails(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">الفرع والنقابة</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTenantForDetails.barBranch}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">المقر والاختصاص</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTenantForDetails.courtJurisdiction}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">باقة الاشتراك الحالية</span>
                <span className="font-black text-amber-600 font-mono">
                  {selectedTenantForDetails.plan === "enterprise" ? "باقة كبرى (18,000 ج.م)" : selectedTenantForDetails.plan === "yearly" ? "سنوي (12,000 ج.م)" : "شهري (1,200 ج.م)"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">تاريخ انتهاء الترخيص</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedTenantForDetails.subscriptionEnd}</span>
              </div>
            </div>

            {selectedTenantForDetails.notes && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                <strong>ملاحظات المنظومة:</strong> {selectedTenantForDetails.notes}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleRenewSubscription(selectedTenantForDetails.id);
                  setSelectedTenantForDetails(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>تجديد الاشتراك لعام كامل</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTenantForDetails(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
