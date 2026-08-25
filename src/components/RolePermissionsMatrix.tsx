import React, { useState } from "react";
import { 
  UserRole, 
  UserPermissions, 
  PlatformUser 
} from "../types";
import { 
  DEFAULT_ROLE_PERMISSIONS, 
  ROLE_LABELS 
} from "../utils/rbacAndSecurity";
import { 
  ShieldCheck, 
  Check, 
  X, 
  UserCheck, 
  Sliders, 
  RotateCcw, 
  Save, 
  Users, 
  KeyRound, 
  Lock, 
  Sparkles,
  Search,
  Filter
} from "lucide-react";

interface RolePermissionsMatrixProps {
  rolePermissions: Record<UserRole, UserPermissions>;
  onUpdateRolePermissions: (role: UserRole, permissions: UserPermissions) => void;
  onResetToDefaults: () => void;
  registeredUsers: PlatformUser[];
  onUpdateUserCustomPermissions: (userId: string, customPerms: Partial<UserPermissions>) => void;
  currentUser: PlatformUser;
  language: "ar" | "en";
}

interface PermissionGroup {
  id: string;
  name: string;
  emoji: string;
  permissions: {
    key: keyof UserPermissions;
    label: string;
    description: string;
  }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "cases",
    name: "القضايا والدعاوى ومذكرات الدفاع",
    emoji: "💼",
    permissions: [
      { key: "canViewCases", label: "الاطلاع على ملفات القضايا", description: "تصفح القضايا والدعاوى والمذكرات" },
      { key: "canAddCases", label: "قيد وإضافة قضايا جديدة", description: "تسجيل ملف دعوى جديد بالمنظومة" },
      { key: "canEditCases", label: "تعديل وتحديث بيانات القضايا", description: "تعديل القرارات والمحاكم والبيانات" },
      { key: "canDeleteCases", label: "حذف وأرشفة القضايا", description: "إمكانية إزالة ملف القضية من النظام" },
      { key: "canExportCases", label: "تصدير وطباعة تقارير القضايا", description: "استخراج ملفات PDF/Excel" }
    ]
  },
  {
    id: "clients",
    name: "سجل الموكلين وجهات الاتصال والخصوم",
    emoji: "👥",
    permissions: [
      { key: "canViewClients", label: "تصفح سجل الموكلين والتوكيلات", description: "رؤية أسماء الموكلين والتوكيلات" },
      { key: "canAddClients", label: "تسجيل موكلين جدد", description: "إضافة ملف موكل جديد وربطه برقم قومي" },
      { key: "canEditClients", label: "تعديل بيانات الموكلين", description: "تحديث الهواتف والعناوين وحسابات التواصل" },
      { key: "canDeleteClients", label: "حذف ملفات الموكلين", description: "حذف موكل نهائياً من السجل" },
      { key: "canViewOpponents", label: "الاطلاع على سجل الخصوم ومحاميهم", description: "رؤية أطراف الخصومة والمحامين المعارضين" }
    ]
  },
  {
    id: "finance",
    name: "الخزينة والأتعاب والتقارير المالية",
    emoji: "💵",
    permissions: [
      { key: "canViewFinance", label: "الاطلاع على الخزينة والأتعاب", description: "رؤية المبالغ المسددة والمتبقية" },
      { key: "canAddPayments", label: "إصدار سندات وتحصيلات أتعاب", description: "تسجيل دفعة مسددة من موكل" },
      { key: "canEditFees", label: "تعديل وتحديد الأتعاب المتفق عليها", description: "تغيير عقد الأتعاب الإجمالي" },
      { key: "canViewFinancialReports", label: "الاطلاع على تقارير الأرباح والمصروفات", description: "التقارير التحليلية المالية السنوية والشهرية" }
    ]
  },
  {
    id: "sessions",
    name: "أجندة الجلسات اليومية والقرارات",
    emoji: "📅",
    permissions: [
      { key: "canManageSessions", label: "إدارة ومتابعة رول الجلسات", description: "ترحيل الجلسات وطباعة الرول اليومي" },
      { key: "canRecordDecisions", label: "تدوين وتحديث قرارات المحكمة", description: "إدخال منطوق الأحكام والقرارات" }
    ]
  },
  {
    id: "tools",
    name: "الأدوات والمحرر والماسح الضوئي والـ Cloud",
    emoji: "✍️",
    permissions: [
      { key: "canAccessDocEditor", label: "استخدام محرر الصياغة القضائية", description: "صياغة المذكرات والعقود الرسمية" },
      { key: "canAccessSmartOcr", label: "استوديو الفحص واستخراج النصوص OCR", description: "المسح الضوئي الذكي للمستندات" },
      { key: "canSignMemos", label: "طلب واعتماد التوقيع الرقمي للمذكرات", description: "إرسال واعتماد التواقيع الإلكترونية" },
      { key: "canAccessGoogleWorkspace", label: "استخدام سحابة Google Workspace و Keep", description: "مزامنة Sheets و Drive و Keep" }
    ]
  },
  {
    id: "admin",
    name: "التحكم في البرنامج وإدارة النظام والأجهزة",
    emoji: "🛡️",
    permissions: [
      { key: "canManageSections", label: "التحكم في أقسام وتطبيقات البرنامج", description: "تفعيل وتعطيل الأقسام وتعديلها" },
      { key: "canManageUsers", label: "إدارة الحسابات والمستخدمين وتجميدها", description: "إنشاء حسابات وتعديل كلمات المرور" },
      { key: "canManageDevices", label: "التحكم في الأجهزة المتصلة وتسجيل الخروج", description: "إدارة بصمات الأجهزة وقفل الحسابات" },
      { key: "canViewAuditLogs", label: "الاطلاع على سجلات التدقيق الأمني", description: "مراقبة سجل حركات تسجيل الدخول والأمان" },
      { key: "canEditSystemSettings", label: "تعديل إعدادات وترخيص النظام", description: "الوصول للإعدادات العامة وتوليد التراخيص" }
    ]
  }
];

export default function RolePermissionsMatrix({
  rolePermissions,
  onUpdateRolePermissions,
  onResetToDefaults,
  registeredUsers,
  onUpdateUserCustomPermissions,
  currentUser,
  language
}: RolePermissionsMatrixProps) {
  const [matrixViewMode, setMatrixViewMode] = useState<"roles" | "user_overrides">("roles");
  const [selectedUserForOverride, setSelectedUserForOverride] = useState<string>(
    registeredUsers.length > 0 ? registeredUsers[0].id : ""
  );
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const activeTargetUser = registeredUsers.find(u => u.id === selectedUserForOverride);

  // Toggle single permission for a role
  const handleToggleRolePermission = (role: UserRole, permKey: keyof UserPermissions) => {
    const currentRolePerms = rolePermissions[role] || DEFAULT_ROLE_PERMISSIONS[role];
    const updated = {
      ...currentRolePerms,
      [permKey]: !currentRolePerms[permKey]
    };
    onUpdateRolePermissions(role, updated);
  };

  // Toggle custom permission for an individual user
  const handleToggleUserCustomPermission = (permKey: keyof UserPermissions) => {
    if (!activeTargetUser) return;
    const currentCustom = activeTargetUser.customPermissions || {};
    const roleDefault = (rolePermissions[activeTargetUser.role] || DEFAULT_ROLE_PERMISSIONS[activeTargetUser.role])[permKey];
    
    // If explicitly set, toggle; otherwise toggle from role default
    const currentVal = currentCustom[permKey] !== undefined ? currentCustom[permKey] : roleDefault;
    const updatedCustom = {
      ...currentCustom,
      [permKey]: !currentVal
    };

    onUpdateUserCustomPermissions(activeTargetUser.id, updatedCustom);
  };

  // Reset an individual user's custom overrides back to their role defaults
  const handleClearUserOverrides = () => {
    if (!activeTargetUser) return;
    if (confirm(`إلغاء جميع الاستثناءات الخاصة بالمستخدم (${activeTargetUser.name}) وإعادته لصلاحيات دوره الأساسي؟`)) {
      onUpdateUserCustomPermissions(activeTargetUser.id, {});
      alert("تمت إعادة صلاحيات المستخدم لتتوافق تماماً مع دوره المحدد!");
    }
  };

  const filteredUsers = registeredUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.phone.includes(userSearchTerm)
  );

  return (
    <div className="space-y-6 text-right font-sans" dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>مصفوفة الصلاحيات المتقدمة والتحكم الدقيق (RBAC Matrix)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تخصيص صلاحيات كل دور وظيفي أو منح استثناءات مخصصة لمستخدمين محددين بالمكتب.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setMatrixViewMode("roles")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                matrixViewMode === "roles"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>مصفوفة الأدوار الوظيفية</span>
            </button>

            <button
              onClick={() => setMatrixViewMode("user_overrides")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                matrixViewMode === "user_overrides"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>صلاحيات مستخدم مخصص ({registeredUsers.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (confirm("هل أنت متأكد من استعادة مصفوفة الصلاحيات الافتراضية الموصى بها لديوان المحاماة؟")) {
                onResetToDefaults();
              }
            }}
            className="p-2 text-slate-500 hover:text-amber-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition cursor-pointer"
            title="استعادة الصلاحيات الافتراضية"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ROLES MATRIX TABLE VIEW                                                */}
      {/* ========================================================================= */}
      {matrixViewMode === "roles" && (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5 font-black text-slate-900 dark:text-slate-100 min-w-[240px]">
                    القسم / الصلاحية القضائية
                  </th>
                  <th className="p-3 text-center font-bold text-amber-800 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
                    👑 مدير النظام
                  </th>
                  <th className="p-3 text-center font-bold text-indigo-800 dark:text-indigo-400">
                    ⚖️ محامي أول
                  </th>
                  <th className="p-3 text-center font-bold text-blue-800 dark:text-blue-400">
                    💼 محامي استئناف
                  </th>
                  <th className="p-3 text-center font-bold text-teal-800 dark:text-teal-400">
                    📝 سكرتارية
                  </th>
                  <th className="p-3 text-center font-bold text-emerald-800 dark:text-emerald-400">
                    💰 محاسب
                  </th>
                  <th className="p-3 text-center font-bold text-purple-800 dark:text-purple-400">
                    🎓 متدرب
                  </th>
                  <th className="p-3 text-center font-bold text-sky-800 dark:text-sky-400">
                    👤 موكل
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {PERMISSION_GROUPS.map((group) => (
                  <React.Fragment key={group.id}>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/40">
                      <td colSpan={8} className="p-2.5 px-4 font-black text-slate-800 dark:text-amber-400 flex items-center gap-2">
                        <span className="text-base">{group.emoji}</span>
                        <span>{group.name}</span>
                      </td>
                    </tr>

                    {group.permissions.map((perm) => {
                      const rolesList = [
                        UserRole.ADMIN,
                        UserRole.SENIOR_LAWYER,
                        UserRole.ASSOCIATE_LAWYER,
                        UserRole.SECRETARY,
                        UserRole.ACCOUNTANT,
                        UserRole.TRAINEE,
                        UserRole.CLIENT
                      ];

                      return (
                        <tr key={perm.key} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition">
                          <td className="p-3 pr-6">
                            <div className="font-bold text-slate-900 dark:text-slate-200">{perm.label}</div>
                            <div className="text-[10px] text-slate-400">{perm.description}</div>
                          </td>

                          {rolesList.map((role) => {
                            const perms = rolePermissions[role] || DEFAULT_ROLE_PERMISSIONS[role];
                            const isGranted = role === UserRole.ADMIN ? true : perms ? perms[perm.key] : false;

                            return (
                              <td key={role} className="p-3 text-center">
                                <button
                                  type="button"
                                  disabled={role === UserRole.ADMIN}
                                  onClick={() => handleToggleRolePermission(role, perm.key)}
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center mx-auto transition cursor-pointer ${
                                    isGranted
                                      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-xs"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-200"
                                  } ${role === UserRole.ADMIN ? "opacity-80 cursor-not-allowed" : ""}`}
                                  title={role === UserRole.ADMIN ? "مدير النظام يملك كافة الصلاحيات دائماً" : isGranted ? "ممنوحة (انقر للتعطيل)" : "معطلة (انقر للمنح)"}
                                >
                                  {isGranted ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SPECIFIC USER OVERRIDES VIEW                                           */}
      {/* ========================================================================= */}
      {matrixViewMode === "user_overrides" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Top: Select User */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-500" />
              <span>اختر المستخدم لتخصيص صلاحياته</span>
            </h4>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="بحث بالاسم أو الهاتف..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pr-8 pl-3 py-1.5 text-xs rounded-xl outline-none"
              />
            </div>

            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredUsers.map((u) => {
                const isSelected = u.id === selectedUserForOverride;
                const hasOverrides = u.customPermissions && Object.keys(u.customPermissions).length > 0;
                const roleMeta = ROLE_LABELS[u.role] || ROLE_LABELS[UserRole.STAFF];

                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserForOverride(u.id)}
                    className={`w-full text-right p-2.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-400"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{u.name}</div>
                      <div className={`text-[10px] ${isSelected ? "text-slate-800" : "text-slate-400"} font-mono`}>
                        {u.phone}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        isSelected ? "bg-black/20 text-slate-950" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}>
                        {roleMeta.badge}
                      </span>
                      {hasOverrides && (
                        <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400">
                          ⚙️ مخصص
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right / Bottom: User Permission Toggles */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            {activeTargetUser ? (
              <>
                <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>صلاحيات: {activeTargetUser.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 rounded-lg">
                        {ROLE_LABELS[activeTargetUser.role]?.ar || activeTargetUser.role}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      يمكنك تفعيل أو حجب أي صلاحية فردية لهذا المستخدم تحديداً بغض النظر عن دوره العام.
                    </p>
                  </div>

                  {activeTargetUser.customPermissions && Object.keys(activeTargetUser.customPermissions).length > 0 && (
                    <button
                      onClick={handleClearUserOverrides}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>إلغاء الاستثناءات والعودة للدور</span>
                    </button>
                  )}
                </div>

                {/* Groups Grid */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.id} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                      <h5 className="text-xs font-black text-slate-800 dark:text-amber-400 flex items-center gap-1.5">
                        <span>{group.emoji}</span>
                        <span>{group.name}</span>
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {group.permissions.map((perm) => {
                          const roleDefault = (rolePermissions[activeTargetUser.role] || DEFAULT_ROLE_PERMISSIONS[activeTargetUser.role])[perm.key];
                          const hasCustom = activeTargetUser.customPermissions && activeTargetUser.customPermissions[perm.key] !== undefined;
                          const effectiveVal = hasCustom ? !!activeTargetUser.customPermissions![perm.key] : !!roleDefault;

                          return (
                            <div
                              key={perm.key}
                              onClick={() => handleToggleUserCustomPermission(perm.key)}
                              className={`p-2.5 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                                effectiveVal
                                  ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                                  <span>{perm.label}</span>
                                  {hasCustom && (
                                    <span className="text-[9px] px-1 bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 rounded font-bold">
                                      مخصص
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">{perm.description}</div>
                              </div>

                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                effectiveVal ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                              }`}>
                                {effectiveVal ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 font-medium text-xs">
                يرجى اختيار مستخدم من القائمة الجانبية لتخصيص صلاحياته.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
