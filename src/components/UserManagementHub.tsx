import React, { useState } from "react";
import { 
  PlatformUser, 
  UserRole, 
  OfficeDepartment, 
  SecurityAuditLog 
} from "../types";
import { ROLE_LABELS } from "../utils/rbacAndSecurity";
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Lock, 
  Unlock, 
  KeyRound, 
  Search, 
  Filter, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  History,
  Smartphone,
  Layers,
  ArrowRightLeft,
  Mail,
  Phone
} from "lucide-react";

interface UserManagementHubProps {
  registeredUsers: PlatformUser[];
  onAddUser: (user: PlatformUser) => void;
  onUpdateUser: (userId: string, updated: Partial<PlatformUser>) => void;
  onDeleteUser: (userId: string) => void;
  departments: OfficeDepartment[];
  auditLogs: SecurityAuditLog[];
  onAddAuditLog: (log: SecurityAuditLog) => void;
  currentUser: PlatformUser;
  language: "ar" | "en";
}

export default function UserManagementHub({
  registeredUsers,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  departments,
  auditLogs,
  onAddAuditLog,
  currentUser,
  language
}: UserManagementHubProps) {
  const [activeTab, setActiveTab] = useState<"users_list" | "audit_trail">("users_list");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // User Modal State (Add / Edit)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>(UserRole.STAFF);
  const [formDepartmentId, setFormDepartmentId] = useState<string>("");
  const [formMaxDevices, setFormMaxDevices] = useState<number>(3);

  // Password Reset Modal State
  const [resetModalUserId, setResetModalUserId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState("");

  // Merge Accounts Modal State
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [sourceUserId, setSourceUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");

  const filteredUsers = registeredUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || (u.status || "active") === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormPassword("");
    setFormRole(UserRole.STAFF);
    setFormDepartmentId("");
    setFormMaxDevices(3);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: PlatformUser) => {
    setEditingUserId(u.id);
    setFormName(u.name);
    setFormPhone(u.phone);
    setFormEmail(u.email || "");
    setFormPassword("");
    setFormRole(u.role);
    setFormDepartmentId(u.departmentId || "");
    setFormMaxDevices(u.maxDevices || 3);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert("يرجى إدخال الاسم ورقم الهاتف.");
      return;
    }

    if (editingUserId) {
      const updateData: Partial<PlatformUser> = {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        role: formRole,
        departmentId: formDepartmentId || undefined,
        maxDevices: formMaxDevices
      };
      if (formPassword.trim()) {
        updateData.passwordHash = formPassword.trim();
      }

      onUpdateUser(editingUserId, updateData);

      onAddAuditLog({
        id: "log-" + Date.now(),
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "permission_change",
        details: `تم تحديث بيانات وحساب المستخدم (${formName}) بواسطة الإدارة`,
        severity: "info"
      });

      alert("تم تحديث بيانات المستخدم بنجاح!");
    } else {
      if (!formPassword.trim()) {
        alert("يرجى تعيين كلمة مرور للمستخدم الجديد.");
        return;
      }

      const newUser: PlatformUser = {
        id: "usr-" + Date.now(),
        name: formName.trim(),
        phone: formPhone.trim(),
        passwordHash: formPassword.trim(),
        role: formRole,
        isVerified: true,
        email: formEmail.trim() || undefined,
        departmentId: formDepartmentId || undefined,
        maxDevices: formMaxDevices,
        status: "active",
        createdAt: new Date().toISOString()
      };

      onAddUser(newUser);

      onAddAuditLog({
        id: "log-" + Date.now(),
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "user_created",
        details: `تم إنشاء حساب مستخدم جديد (${newUser.name}) برقم ${newUser.phone}`,
        severity: "success"
      });

      alert(`تم إضافة وتفعيل حساب المستخدم الجديد (${newUser.name}) بنجاح!`);
    }

    setIsUserModalOpen(false);
  };

  const handleToggleSuspendUser = (u: PlatformUser) => {
    const isCurrentlySuspended = u.status === "suspended";
    const newStatus = isCurrentlySuspended ? "active" : "suspended";

    if (confirm(isCurrentlySuspended 
      ? `إلغاء تجميد حساب (${u.name}) والسماح له بالدخول مجدداً؟` 
      : `تجميد حساب (${u.name}) ومنعه من تسجيل الدخول مؤقتاً؟`)) {
      
      onUpdateUser(u.id, { status: newStatus });

      onAddAuditLog({
        id: "log-" + Date.now(),
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: isCurrentlySuspended ? "user_created" : "user_suspended",
        details: `${isCurrentlySuspended ? "تم إلغاء تجميد" : "تم تجميد"} حساب المستخدم (${u.name})`,
        severity: isCurrentlySuspended ? "success" : "danger"
      });

      alert(`تم ${isCurrentlySuspended ? "إلغاء تجميد" : "تجميد"} الحساب بنجاح!`);
    }
  };

  const handleExecutePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUserId || !newPasswordVal.trim()) return;

    onUpdateUser(resetModalUserId, { passwordHash: newPasswordVal.trim() });

    const target = registeredUsers.find(u => u.id === resetModalUserId);

    onAddAuditLog({
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "password_reset",
      details: `تم إعادة تعيين كلمة المرور لحساب (${target?.name || resetModalUserId})`,
      severity: "warning"
    });

    alert("تم إعادة تعيين كلمة المرور بنجاح للمستخدم!");
    setResetModalUserId(null);
    setNewPasswordVal("");
  };

  const handleExecuteMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUserId || !targetUserId || sourceUserId === targetUserId) {
      alert("يرجى اختيار حسابين مختلفين للدمج.");
      return;
    }

    const source = registeredUsers.find(u => u.id === sourceUserId);
    const target = registeredUsers.find(u => u.id === targetUserId);

    if (confirm(`هل أنت متأكد من دمج حساب (${source?.name}) داخل حساب (${target?.name})؟`)) {
      onUpdateUser(sourceUserId, {
        status: "suspended",
        mergedWithAccountId: targetUserId
      });

      onAddAuditLog({
        id: "log-" + Date.now(),
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "permission_change",
        details: `تم دمج حساب (${source?.name} - ${source?.phone}) داخل حساب (${target?.name} - ${target?.phone})`,
        severity: "warning"
      });

      alert("تمت عملية دمج الحسابين بنجاح!");
      setIsMergeModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>إدارة مستخدمي المنظومة والحسابات (User Identity & Access Management)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            إضافة وتعديل حسابات المحامين والسكرتارية والموكلين، تجميد الحسابات، وإعادة تعيين كلمات المرور.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("users_list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "users_list"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>قائمة المستخدمين ({registeredUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("audit_trail")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "audit_trail"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>سجل التدقيق الأمني ({auditLogs.length})</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddUser}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. USERS LIST VIEW                                                        */}
      {/* ========================================================================= */}
      {activeTab === "users_list" && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم، رقم الهاتف، أو البريد الإلكتروني..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pr-9 pl-3 py-2 text-xs rounded-xl outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl font-bold outline-none"
              >
                <option value="all">جميع الأدوار ({registeredUsers.length})</option>
                <option value={UserRole.ADMIN}>👑 مدير النظام</option>
                <option value={UserRole.SENIOR_LAWYER}>⚖️ محامي أول / شريك</option>
                <option value={UserRole.ASSOCIATE_LAWYER}>💼 محامي استئناف</option>
                <option value={UserRole.SECRETARY}>📝 سكرتارية</option>
                <option value={UserRole.ACCOUNTANT}>💰 محاسب مالي</option>
                <option value={UserRole.TRAINEE}>🎓 متدرب</option>
                <option value={UserRole.STAFF}>👔 طاقم عمل</option>
                <option value={UserRole.CLIENT}>👤 موكل</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl font-bold outline-none"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط ومفعل</option>
                <option value="suspended">مجمد وموقوف</option>
              </select>

              <button
                onClick={() => setIsMergeModalOpen(true)}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title="دمج حسابين مكررين"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>دمج حسابات</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="p-3.5 font-black">اسم المستخدم</th>
                  <th className="p-3.5 font-black">الدور الوظيفي</th>
                  <th className="p-3.5 font-black">القسم التخصصي</th>
                  <th className="p-3.5 font-black">الهاتف والبريد</th>
                  <th className="p-3.5 font-black text-center">الأجهزة المسموحة</th>
                  <th className="p-3.5 font-black text-center">الحالة</th>
                  <th className="p-3.5 font-black text-center">إجراءات الإدارة</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredUsers.map((u) => {
                  const roleMeta = ROLE_LABELS[u.role] || ROLE_LABELS[UserRole.STAFF];
                  const dept = departments.find(d => d.id === u.departmentId);
                  const isSuspended = u.status === "suspended";
                  const isMasterAdmin = u.phone === "01283233555" || u.role === UserRole.ADMIN;

                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition ${
                      isSuspended ? "opacity-60 bg-red-50/20 dark:bg-red-950/10" : ""
                    }`}>
                      
                      {/* Name */}
                      <td className="p-3.5">
                        <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isMasterAdmin && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 font-bold rounded">
                              رئيس المنظومة
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          تسجيل: {new Date(u.createdAt).toLocaleDateString("ar-EG")}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md inline-block">
                          {roleMeta?.badge || u.role}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="p-3.5">
                        {dept ? (
                          <span 
                            className="text-[10px] font-bold px-2 py-0.5 rounded font-mono inline-block"
                            style={{ backgroundColor: `${dept.color}20`, color: dept.color }}
                          >
                            {dept.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">عام (بدون قسم)</span>
                        )}
                      </td>

                      {/* Phone & Email */}
                      <td className="p-3.5 font-mono text-[11px]">
                        <div className="text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{u.phone}</span>
                        </div>
                        {u.email && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Devices count */}
                      <td className="p-3.5 text-center font-mono text-[11px]">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {u.connectedDevices?.length || 0} / {u.maxDevices || 3}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {isSuspended ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 rounded-full inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>مجمد وموقوف</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>نشط ومفعل</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="تعديل بيانات الحساب"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResetModalUserId(u.id);
                              setNewPasswordVal("");
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="إعادة تعيين كلمة المرور فورياً"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Freeze / Unfreeze */}
                          {!isMasterAdmin && (
                            <button
                              onClick={() => handleToggleSuspendUser(u)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                isSuspended
                                  ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              }`}
                              title={isSuspended ? "إلغاء التجميد" : "تجميد الحساب"}
                            >
                              {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Delete */}
                          {!isMasterAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد تماماً من حذف حساب (${u.name}) نهائياً؟`)) {
                                  onDeleteUser(u.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                              title="حذف الحساب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. AUDIT TRAIL VIEW                                                       */}
      {/* ========================================================================= */}
      {activeTab === "audit_trail" && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-500" />
                <span>سجل التدقيق والنشاط الأمني للديوان (Security Audit Trail)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تسجيل زمني مشفر لجميع عمليات تسجيل الدخول، تعديل الصلاحيات، طرد الأجهزة، وتجميد الحسابات.
              </p>
            </div>

            <span className="text-xs font-mono font-black px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
              إجمالي السجلات: {auditLogs.length}
            </span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => {
              const dateStr = new Date(log.timestamp).toLocaleString("ar-EG");

              return (
                <div 
                  key={log.id} 
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex justify-between items-center gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      log.severity === "danger"
                        ? "bg-red-500"
                        : log.severity === "warning"
                        ? "bg-amber-500"
                        : log.severity === "success"
                        ? "bg-emerald-500"
                        : "bg-blue-500"
                    }`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{log.details}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                          بواسطة: {log.userName}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {dateStr} {log.ipAddress && `• IP: ${log.ipAddress}`} {log.deviceName && `• الجهاز: ${log.deviceName}`}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                    {log.action}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT USER                                                    */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 space-y-4 text-right animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-amber-500" />
                <span>{editingUserId ? "تعديل بيانات حساب المستخدم" : "تسجيل وإضافة مستخدم جديد للنظام"}</span>
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 font-black cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">الاسم رباعياً *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="الأستاذ / ..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">رقم الهاتف (مفتاح الدخول) *</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="01234567890"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">البريد الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@law.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">الدور الوظيفي *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none font-bold"
                  >
                    <option value={UserRole.ADMIN}>👑 مدير النظام والمكتب</option>
                    <option value={UserRole.SENIOR_LAWYER}>⚖️ محامي أول / شريك</option>
                    <option value={UserRole.ASSOCIATE_LAWYER}>💼 محامي استئناف</option>
                    <option value={UserRole.SECRETARY}>📝 سكرتارية الشؤون الإدارية</option>
                    <option value={UserRole.ACCOUNTANT}>💰 المحاسب المالي</option>
                    <option value={UserRole.TRAINEE}>🎓 محامي متدرب</option>
                    <option value={UserRole.STAFF}>👔 طاقم عمل عام</option>
                    <option value={UserRole.CLIENT}>👤 موكل</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">القسم التابع له</label>
                  <select
                    value={formDepartmentId}
                    onChange={(e) => setFormDepartmentId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none font-bold"
                  >
                    <option value="">عام (بدون قسم محدد)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {editingUserId ? "تغيير كلمة المرور (اتركه فارغاً للإبقاء)" : "تعيين كلمة المرور *"}
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none font-mono"
                    required={!editingUserId}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">الحد الأقصى للأجهزة</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formMaxDevices}
                    onChange={(e) => setFormMaxDevices(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-xs transition cursor-pointer"
                >
                  {editingUserId ? "حفظ التعديلات" : "إنشاء وتفعيل الحساب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET PASSWORD                                                     */}
      {/* ========================================================================= */}
      {resetModalUserId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-sm shadow-2xl p-6 space-y-4 text-right animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>إعادة تعيين كلمة المرور فورياً</span>
              </h3>
              <button
                onClick={() => setResetModalUserId(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 font-black cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleExecutePasswordReset} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  كلمة المرور الجديدة:
                </label>
                <input
                  type="text"
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none font-mono"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUserId(null)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl"
                >
                  تأكيد التعيين
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MERGE ACCOUNTS                                                     */}
      {/* ========================================================================= */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 space-y-4 text-right animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                <span>دمج حسابين مكررين لنفس الشخص</span>
              </h3>
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 font-black cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              سيتم نقل ارتباطات الحساب المكرر للحساب الأساسي المستهدف، ثم تجميد الحساب المكرر.
            </p>

            <form onSubmit={handleExecuteMerge} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">الحساب المكرر (المراد دمجه وإلغاؤه)</label>
                <select
                  value={sourceUserId}
                  onChange={(e) => setSourceUserId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none font-bold"
                  required
                >
                  <option value="">اختر الحساب المراد دمجه...</option>
                  {registeredUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">الحساب الأساسي الدائم (المستهدف)</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl outline-none font-bold"
                  required
                >
                  <option value="">اختر الحساب المستهدف...</option>
                  {registeredUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.phone})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMergeModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl"
                >
                  تأكيد الدمج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
