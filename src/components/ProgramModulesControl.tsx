import React, { useState } from "react";
import { 
  ProgramModuleConfig, 
  OfficeDepartment, 
  AdminCustomSection, 
  AdminCustomProperty, 
  UserRole,
  PlatformUser
} from "../types";
import { ROLE_LABELS } from "../utils/rbacAndSecurity";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Building2, 
  Sliders, 
  Eye, 
  EyeOff, 
  FolderPlus, 
  ShieldCheck,
  Tag,
  Briefcase,
  Users,
  Settings,
  Sparkles,
  RefreshCw,
  Edit2
} from "lucide-react";

interface ProgramModulesControlProps {
  modules: ProgramModuleConfig[];
  onUpdateModule: (id: string, updated: Partial<ProgramModuleConfig>) => void;
  onToggleModule: (id: string) => void;
  departments: OfficeDepartment[];
  onAddDepartment: (dept: OfficeDepartment) => void;
  onUpdateDepartment: (id: string, updated: Partial<OfficeDepartment>) => void;
  onDeleteDepartment: (id: string) => void;
  customSections: AdminCustomSection[];
  onAddCustomSection: (sec: AdminCustomSection) => void;
  onRemoveCustomSection: (id: string) => void;
  customProperties: AdminCustomProperty[];
  onAddCustomProperty: (prop: AdminCustomProperty) => void;
  onRemoveCustomProperty: (id: string) => void;
  currentUser: PlatformUser;
  language: "ar" | "en";
}

export default function ProgramModulesControl({
  modules,
  onUpdateModule,
  onToggleModule,
  departments,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  customSections,
  onAddCustomSection,
  onRemoveCustomSection,
  customProperties,
  onAddCustomProperty,
  onRemoveCustomProperty,
  currentUser,
  language
}: ProgramModulesControlProps) {
  const [activeSubTab, setActiveSubTab] = useState<"modules" | "departments" | "custom_sections" | "custom_fields">("modules");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Department Modal / Form State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptDescription, setDeptDescription] = useState("");
  const [deptHeadLawyer, setDeptHeadLawyer] = useState("");
  const [deptHeadPhone, setDeptHeadPhone] = useState("");
  const [deptColor, setDeptColor] = useState("#d97706");
  const [deptIcon, setDeptIcon] = useState("Briefcase");

  // Custom Section Form
  const [secNameAr, setSecNameAr] = useState("");
  const [secNameEn, setSecNameEn] = useState("");
  const [secIcon, setSecIcon] = useState("FileText");

  // Custom Field Form
  const [propTarget, setPropTarget] = useState<"case" | "client">("case");
  const [propNameAr, setPropNameAr] = useState("");
  const [propNameEn, setPropNameEn] = useState("");
  const [propType, setPropType] = useState<"text" | "number" | "select">("text");
  const [propOptions, setPropOptions] = useState("");

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.nameArabic.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) {
      alert("يرجى إدخال اسم القسم أو الإدارة التخصصية.");
      return;
    }

    if (editingDeptId) {
      onUpdateDepartment(editingDeptId, {
        name: deptName.trim(),
        code: deptCode.trim() || `DEPT-${Math.floor(10 + Math.random() * 90)}`,
        description: deptDescription.trim(),
        headLawyerName: deptHeadLawyer.trim(),
        headLawyerPhone: deptHeadPhone.trim(),
        color: deptColor,
        icon: deptIcon
      });
      alert("تم تحديث بيانات القسم بنجاح!");
    } else {
      const newDept: OfficeDepartment = {
        id: "dept-" + Date.now(),
        name: deptName.trim(),
        code: deptCode.trim() || `DEPT-${Math.floor(10 + Math.random() * 90)}`,
        description: deptDescription.trim(),
        headLawyerName: deptHeadLawyer.trim(),
        headLawyerPhone: deptHeadPhone.trim(),
        assignedLawyers: deptHeadLawyer ? [deptHeadLawyer.trim()] : [],
        casesCount: 0,
        color: deptColor,
        icon: deptIcon,
        status: "active",
        createdAt: new Date().toISOString()
      };
      onAddDepartment(newDept);
      alert(`تم إنشاء وإضافة القسم التخصصي الجديد (${deptName}) بنجاح!`);
    }

    // Reset
    setIsDeptModalOpen(false);
    setEditingDeptId(null);
    setDeptName("");
    setDeptCode("");
    setDeptDescription("");
    setDeptHeadLawyer("");
    setDeptHeadPhone("");
  };

  const handleOpenEditDept = (dept: OfficeDepartment) => {
    setEditingDeptId(dept.id);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDeptDescription(dept.description || "");
    setDeptHeadLawyer(dept.headLawyerName || "");
    setDeptHeadPhone(deptHeadPhone || "");
    setDeptColor(dept.color);
    setDeptIcon(dept.icon);
    setIsDeptModalOpen(true);
  };

  const handleAddNewSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secNameAr.trim()) {
      alert("يرجى كتابة اسم عربي للقسم المخصص.");
      return;
    }

    const newSec: AdminCustomSection = {
      id: "sec-" + Date.now(),
      nameArabic: secNameAr.trim(),
      nameEnglish: secNameEn.trim() || secNameAr.trim(),
      iconName: secIcon,
      path: "/" + (secNameEn || secNameAr).toLowerCase().replace(/\s+/g, ""),
      fields: [{ name: "التفاصيل", type: "string" }],
      records: []
    };

    onAddCustomSection(newSec);
    setSecNameAr("");
    setSecNameEn("");
    alert(`تم بناء القسم الإضافي المخصص (${newSec.nameArabic}) بنجاح وإضافته للقائمة!`);
  };

  const handleAddNewProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propNameAr.trim()) {
      alert("يرجى كتابة اسم الحقل المخصص.");
      return;
    }

    const optionsList = propType === "select" && propOptions.trim()
      ? propOptions.split(",").map(o => o.trim()).filter(Boolean)
      : undefined;

    const newProp: AdminCustomProperty = {
      id: "prop-" + Date.now(),
      entityName: propTarget,
      propertyNameArabic: propNameAr.trim(),
      propertyNameEnglish: propNameEn.trim() || propNameAr.trim(),
      propertyType: propType,
      options: optionsList
    };

    onAddCustomProperty(newProp);
    setPropNameAr("");
    setPropNameEn("");
    setPropOptions("");
    alert(`تم إضافة الحقل المخصص (${propNameAr}) بنجاح إلى ملفات ${propTarget === "case" ? "القضايا" : "الموكلين"}!`);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* Sub-Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            <span>التحكم الشامل في البرنامج والأقسام والإدارات</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تفعيل وتعطيل أقسام النظام، تهيئة إدارات المكتب، وإنشاء الحقول والأقسام التخصصية المخصصة.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab("modules")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "modules"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>أقسام وتطبيقات النظام ({modules.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("departments")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "departments"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>إدارات المكتب التخصصية ({departments.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("custom_sections")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "custom_sections"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>أقسام مخصصة ({customSections.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("custom_fields")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "custom_fields"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>الحقول المخصصة ({customProperties.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SYSTEM MODULES MANAGER                                                 */}
      {/* ========================================================================= */}
      {activeSubTab === "modules" && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن قسم أو تطبيق بالنظام..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pr-9 pl-3 py-2 text-xs rounded-xl outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl font-bold outline-none"
              >
                <option value="all">جميع التصنيفات</option>
                <option value="core">الأساسية والقضايا</option>
                <option value="legal">القضائية والتوثيق</option>
                <option value="finance">المالية والخزينة</option>
                <option value="ai_tools">الذكاء الاصطناعي و OCR</option>
                <option value="communication">التواصل والإعلانات</option>
              </select>

              <span className="text-xs font-black px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-900">
                {filteredModules.filter(m => m.isEnabled).length} نشط من أصل {filteredModules.length}
              </span>
            </div>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.map((mod) => (
              <div 
                key={mod.id}
                className={`p-4 rounded-2xl border transition-all ${
                  mod.isEnabled
                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
                    : "bg-slate-100/70 dark:bg-slate-950/60 border-dashed border-slate-300 dark:border-slate-800 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-xs">
                      {mod.emoji}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{mod.nameArabic}</span>
                        {mod.isCore && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 font-bold rounded">
                            رئيسي
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-sans block">{mod.nameEnglish}</span>
                    </div>
                  </div>

                  {/* Enable / Disable Toggle */}
                  <button
                    onClick={() => onToggleModule(mod.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition cursor-pointer ${
                      mod.isEnabled
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300"
                    }`}
                    title={mod.isEnabled ? "تعطيل القسم" : "تفعيل القسم"}
                  >
                    {mod.isEnabled ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>مفعل</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        <span>معطل</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3 min-h-[32px]">
                  {mod.description}
                </p>

                {/* Allowed Roles Preview */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1 overflow-hidden">
                    <Users className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[10px] text-slate-400 font-bold truncate">
                      صلاحيات الأدوار ({mod.allowedRoles.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {mod.allowedRoles.includes(UserRole.ADMIN) && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" title="مدير النظام" />
                    )}
                    {mod.allowedRoles.includes(UserRole.SENIOR_LAWYER) && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" title="محامي أول" />
                    )}
                    {mod.allowedRoles.includes(UserRole.SECRETARY) && (
                      <span className="w-2 h-2 rounded-full bg-teal-500" title="سكرتارية" />
                    )}
                    {mod.allowedRoles.includes(UserRole.ACCOUNTANT) && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="محاسب" />
                    )}
                    {mod.allowedRoles.includes(UserRole.CLIENT) && (
                      <span className="w-2 h-2 rounded-full bg-sky-500" title="موكل" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OFFICE DEPARTMENTS & WORKFLOWS                                         */}
      {/* ========================================================================= */}
      {activeSubTab === "departments" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>الهيكل التنظيمي وإدارات مكتب المحاماة</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تقسيم العمل القضائي بالمكتب إلى إدارات تخصصية وتعيين رئيس لكل قسم وتوزيع القضايا.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingDeptId(null);
                setDeptName("");
                setDeptCode("");
                setDeptDescription("");
                setDeptHeadLawyer("");
                setDeptHeadPhone("");
                setIsDeptModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسم تخصصي جديد</span>
            </button>
          </div>

          {/* Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div 
                key={dept.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 right-0 left-0 h-1.5"
                  style={{ backgroundColor: dept.color }}
                />

                <div className="flex justify-between items-start pt-1">
                  <div className="space-y-1">
                    <span 
                      className="text-[10px] font-black px-2 py-0.5 rounded font-mono"
                      style={{ backgroundColor: `${dept.color}20`, color: dept.color }}
                    >
                      {dept.code}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{dept.name}</h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditDept(dept)}
                      className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition cursor-pointer"
                      title="تعديل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف قسم (${dept.name})؟`)) {
                          onDeleteDepartment(dept.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed min-h-[36px]">
                  {dept.description || "لا يوجد وصف مدخل لهذا القسم."}
                </p>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span className="font-bold">المحامي المسؤول:</span>
                    <span className="font-black text-slate-900 dark:text-amber-400">{dept.headLawyerName || "لم يحدد"}</span>
                  </div>
                  {dept.headLawyerPhone && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span className="font-bold">رقم التواصل:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-300">{dept.headLawyerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span className="font-bold">عدد القضايا الموزعة:</span>
                    <span className="font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono">{dept.casesCount || 0} قضية</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DYNAMIC CUSTOM SECTIONS CREATOR                                       */}
      {/* ========================================================================= */}
      {activeSubTab === "custom_sections" && (
        <div className="space-y-6">
          
          {/* Create Section Form */}
          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-amber-500" />
              <span>استحداث قسم إلكتروني مخصص جديد بالنظام</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              يمكنك إنشاء أقسام وقوائم جديدة تماماً وتخصيص مسارها وظهورها في القائمة الجانبية لقسم القضايا والمكتب.
            </p>

            <form onSubmit={handleAddNewSection} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  اسم القسم بالعربية *
                </label>
                <input
                  type="text"
                  value={secNameAr}
                  onChange={(e) => setSecNameAr(e.target.value)}
                  placeholder="مثال: قسم القضايا الدولية"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  الاسم بالإنجليزية (اختياري)
                </label>
                <input
                  type="text"
                  value={secNameEn}
                  onChange={(e) => setSecNameEn(e.target.value)}
                  placeholder="International Cases"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  رمز الأيقونة
                </label>
                <select
                  value={secIcon}
                  onChange={(e) => setSecIcon(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl outline-none font-bold"
                >
                  <option value="FileText">📄 مستندات (FileText)</option>
                  <option value="Scale">⚖️ ميزان العدالة (Scale)</option>
                  <option value="Building">🏢 شركات ومؤسسات (Building)</option>
                  <option value="Gavel">🔨 مطرقة القضاء (Gavel)</option>
                  <option value="Briefcase">💼 حقيبة القضايا (Briefcase)</option>
                </select>
              </div>

              <button
                type="submit"
                className="py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء وتثبيت القسم</span>
              </button>
            </form>
          </div>

          {/* List of Custom Sections */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-amber-500">
              الأقسام المخصصة المضافة حالياً ({customSections.length})
            </h4>

            {customSections.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 font-medium">
                📁 لم تقم باستحداث أي أقسام مخصصة إضافية بعد.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customSections.map((sec) => (
                  <div key={sec.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-slate-100">{sec.nameArabic}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">{sec.path}</span>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`حذف القسم المخصص (${sec.nameArabic})؟`)) {
                          onRemoveCustomSection(sec.id);
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                      title="حذف القسم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DYNAMIC CUSTOM FIELDS / PROPERTIES BUILDER                             */}
      {/* ========================================================================= */}
      {activeSubTab === "custom_fields" && (
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-amber-500" />
              <span>إضافة حقول مخصصة (Custom Fields Builder)</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              أضف حقولاً مخصصة تظهر تلقائياً في استمارات قيد القضايا أو الموكلين (مثل: رقم الملف الضريبي، تاريخ القيد بالنقض، الدائرة الفرعية).
            </p>

            <form onSubmit={handleAddNewProperty} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  تطبيق الحقل على
                </label>
                <select
                  value={propTarget}
                  onChange={(e) => setPropTarget(e.target.value as "case" | "client")}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl outline-none font-bold"
                >
                  <option value="case">ملفات القضايا (Case Files)</option>
                  <option value="client">سجل الموكلين (Clients Registry)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  اسم الحقل بالعربية *
                </label>
                <input
                  type="text"
                  value={propNameAr}
                  onChange={(e) => setPropNameAr(e.target.value)}
                  placeholder="مثال: رقم الحفظ بالأرشيف"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  نوع البيانات
                </label>
                <select
                  value={propType}
                  onChange={(e) => setPropType(e.target.value as "text" | "number" | "select")}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl outline-none font-bold"
                >
                  <option value="text">نص عادي (Text)</option>
                  <option value="number">رقم (Number)</option>
                  <option value="select">قائمة اختيارات (Dropdown)</option>
                </select>
              </div>

              {propType === "select" ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    الخيارات (مفصولة بفواصل)
                  </label>
                  <input
                    type="text"
                    value={propOptions}
                    onChange={(e) => setPropOptions(e.target.value)}
                    placeholder="خيار 1, خيار 2, خيار 3"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl outline-none"
                  />
                </div>
              ) : (
                <button
                  type="submit"
                  className="py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة الحقل المخصص</span>
                </button>
              )}

              {propType === "select" && (
                <button
                  type="submit"
                  className="col-span-full md:col-span-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة الحقل المخصص</span>
                </button>
              )}
            </form>
          </div>

          {/* List of Custom Properties */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-amber-500">
              الحقول المخصصة المضافة حالياً ({customProperties.length})
            </h4>

            {customProperties.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 font-medium">
                🏷️ لا توجد حقول مخصصة مسجلة حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customProperties.map((prop) => (
                  <div key={prop.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                          {prop.entityName === "case" ? "💼 القضايا" : "👥 الموكلين"}
                        </span>
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                          {prop.propertyType === "text" ? "نص" : prop.propertyType === "number" ? "رقم" : "قائمة"}
                        </span>
                      </div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-slate-100">{prop.propertyNameArabic}</h5>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`حذف الحقل المخصص (${prop.propertyNameArabic})؟`)) {
                          onRemoveCustomProperty(prop.id);
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                      title="حذف الحقل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT DEPARTMENT                                              */}
      {/* ========================================================================= */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 space-y-4 text-right animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>{editingDeptId ? "تعديل بيانات القسم التخصصي" : "إضافة قسم وإدارة تخصصية جديدة بالمكتب"}</span>
              </h3>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 font-black cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">اسم القسم / الإدارة *</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="مثال: قسم الطعون الإدارية والضرائب"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">كود القسم</label>
                  <input
                    type="text"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    placeholder="TAX-01"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">لون التمييز البصري</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={deptColor}
                      onChange={(e) => setDeptColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5"
                    />
                    <span className="font-mono text-[11px] text-slate-500">{deptColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">وصف واختصاصات القسم</label>
                <textarea
                  value={deptDescription}
                  onChange={(e) => setDeptDescription(e.target.value)}
                  placeholder="تحديد طبيعة الدعاوى والمهام المسندة لهذا القسم..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">رئيس القسم (المحامي المسؤول)</label>
                  <input
                    type="text"
                    value={deptHeadLawyer}
                    onChange={(e) => setDeptHeadLawyer(e.target.value)}
                    placeholder="الأستاذ المحامي"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">هاتف المحامي المباشر</label>
                  <input
                    type="tel"
                    value={deptHeadPhone}
                    onChange={(e) => setDeptHeadPhone(e.target.value)}
                    placeholder="01283233555"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-xs transition cursor-pointer"
                >
                  {editingDeptId ? "حفظ التعديلات" : "إضافة القسم"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
