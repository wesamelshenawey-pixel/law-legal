import React, { useState } from "react";
import { Building, Mail, Phone, Calendar, ShieldCheck, Plus, Search, Trash2, Edit } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  gmail: string;
  phone: string;
  plan: "monthly" | "yearly";
  status: "active" | "suspended";
  createdAt: string;
  subscriptionEnd: string;
  nationalIdFront?: string;
  nationalIdBack?: string;
  lawyerCard?: string;
}

export default function TenantsAdminView({ language }: { language: "ar" | "en" }) {
  const [tenants, setTenants] = useState<Tenant[]>([
    {
      id: "t_1",
      name: "مكتب وسام الشناوي للمحاماة",
      gmail: "wesam.elshenawey@gmail.com",
      phone: "+201283233555",
      plan: "yearly",
      status: "active",
      createdAt: "2026-01-01",
      subscriptionEnd: "2027-01-01",
    }
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTenant, setNewTenant] = useState<Partial<Tenant>>({ plan: "monthly", status: "active" });

  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.gmail || !newTenant.phone) return;
    setTenants([...tenants, {
      ...newTenant,
      id: "t_" + Date.now(),
      createdAt: new Date().toISOString().split("T")[0],
      subscriptionEnd: newTenant.plan === "yearly" ? "2027-08-25" : "2026-09-25",
    } as Tenant]);
    setShowAddModal(false);
    setNewTenant({ plan: "monthly", status: "active" });
  };

  const toggleStatus = (id: string) => {
    setTenants(tenants.map(t => t.id === id ? { ...t, status: t.status === "active" ? "suspended" : "active" } : t));
  };
  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المكتب؟ هذا الإجراء سيؤدي لفصل قواعد البيانات الخاصة به.")) {
      setTenants(tenants.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-500" />
            <span>إدارة المكاتب الرقمية المستقلة (Multi-tenancy)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            لوحة تحكم مالك المنصة لإضافة مكاتب محاماة مستقلة، ربط كل مكتب بـ Gmail ورقم هاتف خاص به لضمان فصل البيانات.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مكتب جديد</span>
        </button>
      </div>

      {/* Tenants List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map(tenant => (
          <div key={tenant.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white truncate" title={tenant.name}>{tenant.name}</h4>
              {tenant.nationalIdFront && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold ml-2">مرفقات مؤمنة</span>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${tenant.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {tenant.status === "active" ? "نشط" : "مجمد"}
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{tenant.gmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{tenant.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>الاشتراك: {tenant.plan === "yearly" ? "سنوي" : "شهري"} (ينتهي {tenant.subscriptionEnd})</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button onClick={() => toggleStatus(tenant.id)} className={`px-3 py-1.5 text-[10px] font-bold rounded transition ${tenant.status === "active" ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50"}`}>
                {tenant.status === "active" ? "إيقاف الاشتراك" : "تفعيل الاشتراك"}
              </button>
              <button onClick={() => handleDelete(tenant.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition" title="حذف المكتب">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">تسجيل مكتب محاماة رقمي جديد</h3>
            <form onSubmit={handleAddTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المكتب / المحامي</label>
                <input required type="text" value={newTenant.name || ""} onChange={e => setNewTenant({...newTenant, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني (Gmail)</label>
                <input required type="email" value={newTenant.gmail || ""} onChange={e => setNewTenant({...newTenant, gmail: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none dir-ltr text-left font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم هاتف المالك (بوابة الدخول)</label>
                <input required type="tel" value={newTenant.phone || ""} onChange={e => setNewTenant({...newTenant, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none dir-ltr text-left font-mono" placeholder="+201..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">خطة الاشتراك</label>
                <select value={newTenant.plan || "monthly"} onChange={e => setNewTenant({...newTenant, plan: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none">
                  <option value="monthly">اشتراك شهري</option>
                  <option value="yearly">اشتراك سنوي</option>
                </select>
              </div>
              <div className="pt-4 flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition text-xs">
                  تسجيل وإنشاء مساحة العمل
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black rounded-xl transition text-xs">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
