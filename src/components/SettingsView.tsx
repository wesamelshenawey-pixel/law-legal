import React, { useState } from "react";
import PhoneInputWithCountry from "./PhoneInputWithCountry";
import { 
  AdminCustomSection, 
  AdminCustomProperty, 
  UserRole, 
  PlatformUser, 
  ProgramModuleConfig, 
  OfficeDepartment, 
  SecurityAuditLog, 
  UserPermissions 
} from "../types";
import { License, ActivationRequest } from "../utils/firebaseSync";
import { TRANSLATIONS } from "../utils/translations";
import ProgramModulesControl from "./ProgramModulesControl";
import RolePermissionsMatrix from "./RolePermissionsMatrix";
import ConnectedDevicesHub from "./ConnectedDevicesHub";
import UserManagementHub from "./UserManagementHub";
import { 
  Layers, 
  Sliders, 
  KeyRound, 
  Plus, 
  CheckCircle, 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Laptop, 
  Users, 
  UserPlus, 
  RefreshCw,
  Palette,
  Monitor,
  Building2,
  Lock,
  History,
  FileCheck,
  Settings as SettingsIcon,
  Shield
} from "lucide-react";

interface SettingsViewProps {
  customSections: AdminCustomSection[];
  customProperties: AdminCustomProperty[];
  onAddCustomSection: (sec: AdminCustomSection) => void;
  onAddCustomProperty: (prop: AdminCustomProperty) => void;
  onRemoveCustomSection: (id: string) => void;
  onRemoveCustomProperty: (id: string) => void;
  currentUser: PlatformUser;
  licenses: License[];
  onAddLicense: (lic: License) => void;
  onDeleteLicense: (id: string) => void;
  onUpdateLicense: (id: string, updated: Partial<License>) => void;
  activationRequests: ActivationRequest[];
  onApproveDeviceRequest: (reqId: string) => void;
  onRejectDeviceRequest: (reqId: string) => void;
  language: "ar" | "en";
  registeredUsers?: PlatformUser[];
  onAddUser?: (user: PlatformUser) => void;
  onUpdateUser?: (id: string, updated: Partial<PlatformUser>) => void;
  onDeleteUser?: (id: string) => void;
  accentColor?: string;
  setAccentColor?: (color: string) => void;
  onNavigateToDesigns?: () => void;
  programModules?: ProgramModuleConfig[];
  onUpdateProgramModule?: (id: string, updated: Partial<ProgramModuleConfig>) => void;
  onToggleProgramModule?: (id: string) => void;
  departments?: OfficeDepartment[];
  onAddDepartment?: (dept: OfficeDepartment) => void;
  onUpdateDepartment?: (id: string, updated: Partial<OfficeDepartment>) => void;
  onDeleteDepartment?: (id: string) => void;
  rolePermissions?: Record<UserRole, UserPermissions>;
  onUpdateRolePermissions?: (role: UserRole, permissions: UserPermissions) => void;
  onResetRolePermissions?: () => void;
  onUpdateUserCustomPermissions?: (userId: string, customPerms: Partial<UserPermissions>) => void;
  onRevokeDeviceSession?: (userId: string, deviceId: string) => void;
  onRevokeAllOtherSessions?: (userId: string, exceptDeviceId?: string) => void;
  onToggleDeviceLock?: (userId: string, lockToSingle: boolean, trustedDeviceId?: string) => void;
  onBlockDevice?: (userId: string, deviceId: string) => void;
  auditLogs?: SecurityAuditLog[];
  onAddAuditLog?: (log: SecurityAuditLog) => void;
  currentDeviceFingerprint?: string;
}

export default function SettingsView({
  customSections,
  customProperties,
  onAddCustomSection,
  onAddCustomProperty,
  onRemoveCustomSection,
  onRemoveCustomProperty,
  currentUser,
  licenses,
  onAddLicense,
  onDeleteLicense,
  onUpdateLicense,
  activationRequests,
  onApproveDeviceRequest,
  onRejectDeviceRequest,
  language,
  registeredUsers = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  accentColor,
  setAccentColor,
  onNavigateToDesigns,
  programModules = [],
  onUpdateProgramModule = () => {},
  onToggleProgramModule = () => {},
  departments = [],
  onAddDepartment = () => {},
  onUpdateDepartment = () => {},
  onDeleteDepartment = () => {},
  rolePermissions = {} as Record<UserRole, UserPermissions>,
  onUpdateRolePermissions = () => {},
  onResetRolePermissions = () => {},
  onUpdateUserCustomPermissions = () => {},
  onRevokeDeviceSession = () => {},
  onRevokeAllOtherSessions = () => {},
  onToggleDeviceLock = () => {},
  onBlockDevice = () => {},
  auditLogs = [],
  onAddAuditLog = () => {},
  currentDeviceFingerprint
}: SettingsViewProps) {
  const t = (key: keyof typeof TRANSLATIONS.en) => TRANSLATIONS[language][key];

  const [activeMainTab, setActiveMainTab] = useState<
    "program_sections" | "users_accounts" | "permissions_matrix" | "connected_devices" | "licensing_security" | "general_preferences" | "data_sync_security"
  >("program_sections");

  const [licenseHolder, setLicenseHolder] = useState("");
  const [licensePhone, setLicensePhone] = useState("");
  const [licenseMaxDevices, setLicenseMaxDevices] = useState(2);
  const [licenseMaxUsers, setLicenseMaxUsers] = useState(5);

  const [offlineSyncMode, setOfflineSyncMode] = useState(true);
  const [endToEndEncryptionEnabled, setEndToEndEncryptionEnabled] = useState(false);

  const handleCreateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseHolder || !licensePhone) return;

    const code1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code4 = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const newLicense: License = {
      id: "lic-" + Date.now(),
      licenseKey: `${code1}-${code2}-${code3}-${code4}`,
      holderName: licenseHolder,
      holderPhone: licensePhone,
      maxDevices: licenseMaxDevices,
      maxUsers: licenseMaxUsers,
      approvedDevices: [],
      status: "active",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      devicesUsed: 0,
      activeDevices: []
    };
    onAddLicense(newLicense);
    setLicenseHolder("");
    setLicensePhone("");
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-black text-slate-900 dark:text-amber-500 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-amber-500" />
          <span>{language === "ar" ? "لوحة التحكم وإدارة المنظومة المركزية" : "System Administration & Licensing Dashboard"}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          {language === "ar" 
            ? "التحكم الكامل في حسابات المحامين، الأقسام، الموكلين، صلاحيات الوصول، تراخيص البرنامج، وحماية البيانات السحابية."
            : "Centralized control over lawyer accounts, departments, client profiles, access permissions, licensing, and security."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto hide-scrollbar">
        {/* 1. Program Modules & Departments */}
        <button
          onClick={() => setActiveMainTab("program_sections")}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            activeMainTab === "program_sections"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>أقسام المكتب ونماذج البيانات</span>
        </button>

        {/* 2. Users & Accounts */}
        <button
          onClick={() => setActiveMainTab("users_accounts")}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            activeMainTab === "users_accounts"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة حسابات الطاقم ({registeredUsers.length})</span>
        </button>

        {/* 3. Granular RBAC Permissions */}
        <button
          onClick={() => setActiveMainTab("permissions_matrix")}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            activeMainTab === "permissions_matrix"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>مصفوفة الصلاحيات (RBAC)</span>
        </button>

        {/* 4. Connected Devices & Hardware Security */}
        <button
          onClick={() => setActiveMainTab("connected_devices")}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            activeMainTab === "connected_devices"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>الأجهزة النشطة والربط الأمني</span>
        </button>

        {/* 5. Licensing & Copy Protection */}
        <button
          onClick={() => setActiveMainTab("licensing_security")}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            activeMainTab === "licensing_security"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>التراخيص ومكافحة القرصنة ({licenses.length})</span>
        </button>

        {/* 6. Preferences & Appearance */}
        <button
          onClick={() => setActiveMainTab("general_preferences")}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            activeMainTab === "general_preferences"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>المظهر والمزامنة</span>
        </button>

        {/* 7. Data Security & Sync */}
        <button
          onClick={() => setActiveMainTab("data_sync_security")}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            activeMainTab === "data_sync_security"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>أمان البيانات والمزامنة</span>
        </button>
      </div>
      
      {/* ========================================================================= */}
{/* 1. PROGRAM MODULES & DEPARTMENTS TAB                                      */}
      {/* ========================================================================= */}
      {activeMainTab === "program_sections" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <ProgramModulesControl
            modules={programModules}
            onUpdateModule={onUpdateProgramModule}
            onToggleModule={onToggleProgramModule}
            departments={departments}
            onAddDepartment={onAddDepartment}
            onUpdateDepartment={onUpdateDepartment}
            onDeleteDepartment={onDeleteDepartment}
            customSections={customSections}
            onAddCustomSection={onAddCustomSection}
            onRemoveCustomSection={onRemoveCustomSection}
            customProperties={customProperties}
            onAddCustomProperty={onAddCustomProperty}
            onRemoveCustomProperty={onRemoveCustomProperty}
            currentUser={currentUser}
            language={language}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. USERS & IDENTITY MANAGEMENT TAB                                        */}
      {/* ========================================================================= */}
      {activeMainTab === "users_accounts" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <UserManagementHub
            registeredUsers={registeredUsers}
            onAddUser={onAddUser || (() => {})}
            onUpdateUser={onUpdateUser || (() => {})}
            onDeleteUser={onDeleteUser || (() => {})}
            departments={departments}
            auditLogs={auditLogs}
            onAddAuditLog={onAddAuditLog}
            currentUser={currentUser}
            language={language}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. GRANULAR RBAC PERMISSIONS MATRIX TAB                                   */}
      {/* ========================================================================= */}
      {activeMainTab === "permissions_matrix" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <RolePermissionsMatrix
            rolePermissions={rolePermissions}
            onUpdateRolePermissions={onUpdateRolePermissions}
            onResetToDefaults={onResetRolePermissions}
            registeredUsers={registeredUsers}
            onUpdateUserCustomPermissions={onUpdateUserCustomPermissions}
            currentUser={currentUser}
            language={language}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CONNECTED DEVICES & HARDWARE SECURITY TAB                              */}
      {/* ========================================================================= */}
      {activeMainTab === "connected_devices" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <ConnectedDevicesHub
            registeredUsers={registeredUsers}
            onUpdateUser={onUpdateUser || (() => {})}
            onRevokeDeviceSession={onRevokeDeviceSession}
            onRevokeAllOtherSessions={onRevokeAllOtherSessions}
            onToggleDeviceLock={onToggleDeviceLock}
            onBlockDevice={onBlockDevice}
            currentDeviceFingerprint={currentDeviceFingerprint}
            currentUser={currentUser}
            language={language}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. LICENSING & ANTI-PIRACY LIMITS TAB                                     */}
      {/* ========================================================================= */}
      {activeMainTab === "licensing_security" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          <div className="flex justify-between items-center flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5 justify-start">
                <KeyRound className="w-5 h-5 text-amber-500 animate-pulse" />
                <span>{language === "ar" ? "منظومة بيع وتراخيص نسخ البرنامج ومكافحة القرصنة" : "Anti-Piracy Enforcement & Live Copy Licensing"}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-2xl">
                {language === "ar"
                  ? "قم بإصدار رخصة جديدة مباعة لكل عميل وتحديد الحد الأقصى للأجهزة (المتصفحات) والمستخدمين لمنع توزيع النسخ دون تصريحك المباشر."
                  : "Generate and sell official original copies restricting access to custom browser signatures and user counts."}
              </p>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 font-extrabold px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900">
              {language === "ar" ? `الرخص النشطة: ${licenses.length}` : `Active Licenses: ${licenses.length}`}
            </span>
          </div>

          {/* 1. Generate & Issue New License Form */}
          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-slate-900 dark:text-amber-500 flex items-center gap-1">
              <Plus className="w-4 h-4" />
              <span>{language === "ar" ? "بيع وإصدار نسخة جديدة لعميل (مفتاح ترخيص سحابي)" : "Sell & Deploy a New Software Copy Key"}</span>
            </h4>

            <form onSubmit={handleCreateLicense} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {language === "ar" ? "اسم المشتري / الجهة" : "Buyer Name / Firm"}
                </label>
                <input
                  type="text"
                  value={licenseHolder}
                  onChange={(e) => setLicenseHolder(e.target.value)}
                  placeholder="الأستاذ أحمد فوزي"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl outline-none text-right"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {language === "ar" ? "رقم الهاتف المحمول" : "Buyer Mobile Phone"}
                </label>
                <PhoneInputWithCountry
                  value={licensePhone}
                  onChange={(full) => setLicensePhone(full)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {language === "ar" ? "أقصى أجهزة" : "Max Devices"}
                  </label>
                  <input
                    type="number"
                    value={licenseMaxDevices}
                    onChange={(e) => setLicenseMaxDevices(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs outline-none text-center font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {language === "ar" ? "أقصى مستخدمين" : "Max Users"}
                  </label>
                  <input
                    type="number"
                    value={licenseMaxUsers}
                    onChange={(e) => setLicenseMaxUsers(Number(e.target.value))}
                    min={1}
                    max={50}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs outline-none text-center font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                <span>{language === "ar" ? "إنشاء كود الرخصة الآن" : "Generate Key"}</span>
              </button>
            </form>
          </div>

          {/* 2. Device Activation Requests Awaiting Approval */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>{language === "ar" ? "طلبات تفعيل أجهزة العملاء بانتظار موافقتك" : "Pending Hardware Approval Requests"}</span>
              {activationRequests.length > 0 && (
                <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                  {activationRequests.length}
                </span>
              )}
            </h4>

            {activationRequests.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs font-medium">
                ✅ {language === "ar" ? "لا توجد أجهزة جديدة تنتظر الاعتماد حالياً." : "No pending device activation requests."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activationRequests.map((req) => (
                  <div key={req.id} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-amber-300 dark:border-amber-900/50 space-y-2 shadow-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">{req.requestName}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 rounded-md">
                        {req.deviceName}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                      <p>📱 {language === "ar" ? `هاتف المشتري: ` : `Phone: `}<span className="font-sans text-slate-800 dark:text-slate-300 font-bold">{req.requestPhone}</span></p>
                      <p>🔑 {language === "ar" ? `رمز التفعيل: ` : `Key: `}<span className="font-semibold text-amber-700 dark:text-amber-500">{req.licenseKey}</span></p>
                      <p>💻 {language === "ar" ? `بصمة الجهاز: ` : `Fingerprint: `}<span className="font-extrabold text-slate-900 dark:text-slate-200">{req.deviceFingerprint}</span></p>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => {
                          onRejectDeviceRequest(req.id);
                          alert(language === "ar" ? "تم رفض الطلب بنجاح!" : "Access request rejected.");
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-[10px] font-bold hover:bg-red-100 transition cursor-pointer"
                      >
                        {language === "ar" ? "رفض ومنع" : "Reject"}
                      </button>
                      <button
                        onClick={() => {
                          onApproveDeviceRequest(req.id);
                          alert(language === "ar" ? "تهانينا! تم ربط الجهاز واعتماده بملف الترخيص سحابياً." : "Device approved! Access granted.");
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                      >
                        {language === "ar" ? "الموافقة وتفعيل هذا الجهاز" : "Approve & Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. List of Issued Licenses */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-black text-slate-900 dark:text-amber-500">
              {language === "ar" ? "الرخص ونسخ البرنامج المصدرة بالنظام" : "Issued Product Licenses & Hardware Allocations"}
            </h4>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-right border-collapse text-slate-800 dark:text-slate-200 font-sans">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[10px]">
                    <th className="p-3 text-right">{language === "ar" ? "مفتاح الترخيص" : "License Key"}</th>
                    <th className="p-3 text-right">{language === "ar" ? "المشتري والهاتف" : "Licensee & Phone"}</th>
                    <th className="p-3 text-center">{language === "ar" ? "سعة الأجهزة" : "Devices Limit"}</th>
                    <th className="p-3 text-center">{language === "ar" ? "الأجهزة النشطة" : "Active Fingerprints"}</th>
                    <th className="p-3 text-center">{language === "ar" ? "سعة المستخدمين" : "Users Limit"}</th>
                    <th className="p-3 text-center">{language === "ar" ? "تعديل القيود" : "Edit Limits"}</th>
                    <th className="p-3 text-center">{language === "ar" ? "الحالة" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {licenses.map((lic) => (
                    <tr key={lic.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                      <td className="p-3 font-mono font-bold text-[10px] text-amber-700 dark:text-amber-500 uppercase">{lic.id}</td>
                      <td className="p-3">
                        <p className="font-extrabold text-slate-900 dark:text-slate-100">{lic.holderName}</p>
                        <p className="text-[10px] text-slate-400 font-sans">{lic.holderPhone}</p>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{lic.maxDevices}</td>
                      <td className="p-3 text-center font-sans">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {lic.approvedDevices.length}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{lic.maxUsers}</td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1.5 justify-center items-center">
                          <button
                            onClick={() => {
                              const dev = prompt(language === "ar" ? "أدخل الحد الأقصى الجديد للأجهزة:" : "Enter new max devices count:", String(lic.maxDevices));
                              if (dev && !isNaN(Number(dev))) {
                                onUpdateLicense(lic.id, { maxDevices: Number(dev) });
                              }
                            }}
                            className="px-2 py-1 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 rounded-lg text-[9px] font-bold border border-amber-200/55 hover:bg-amber-100 cursor-pointer"
                          >
                            {language === "ar" ? "ترقية الأجهزة" : "+ Devices"}
                          </button>
                          <button
                            onClick={() => {
                              const usr = prompt(language === "ar" ? "أدخل الحد الأقصى الجديد للمستخدمين:" : "Enter new max users limit:", String(lic.maxUsers));
                              if (usr && !isNaN(Number(usr))) {
                                onUpdateLicense(lic.id, { maxUsers: Number(usr) });
                              }
                            }}
                            className="px-2 py-1 bg-sky-50 text-sky-800 dark:bg-sky-950/30 dark:text-sky-400 rounded-lg text-[9px] font-bold border border-sky-200/55 hover:bg-sky-100 cursor-pointer"
                          >
                            {language === "ar" ? "ترقية الحسابات" : "+ Users"}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <span className={`inline-flex px-2 py-0.5 text-[9px] font-black rounded-full ${
                            lic.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400"
                          }`}>
                            {lic.status === "active" ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "موقف" : "Suspended")}
                          </span>
                          
                          <button
                            onClick={() => {
                              const nStatus = lic.status === "active" ? "inactive" : "active";
                              onUpdateLicense(lic.id, { status: nStatus });
                            }}
                            className="p-1 text-[10px] text-slate-500 hover:text-amber-600 font-bold hover:underline cursor-pointer"
                            title="تبديل الحالة"
                          >
                            🔄
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(language === "ar" ? "هل أنت متأكد من حذف هذا الترخيص بالكامل؟" : "Confirm deleting this license key?")) {
                                onDeleteLicense(lic.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 text-[10px] font-sans hover:underline px-1"
                          >
                            {language === "ar" ? "حذف" : "Del"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 7. DATA SECURITY & SYNC TAB */}
      {/* ========================================================================= */}
      {activeMainTab === "data_sync_security" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-right" dir="rtl">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5 justify-start">
              <Lock className="w-5 h-5 text-amber-500" />
              <span>أمان البيانات والمزامنة السحابية (E2EE)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              تفعيل التشفير الشامل للنسخ الاحتياطية على Google Drive ومراجعة سجل عمليات المزامنة الدورية لحماية بيانات المكتب وعملائه.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">التشفير الشامل (End-to-End Encryption)</h4>
                </div>
                <p className="text-[10px] text-slate-500">
                  تشفير النسخ الاحتياطية قبل رفعها لسحابة Google Drive بحيث لا يمكن فك تشفيرها إلا من خلال هذا النظام.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={endToEndEncryptionEnabled}
                  onChange={(e) => setEndToEndEncryptionEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                سجل نشاط المزامنة الأخير
              </h4>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-2 font-bold text-slate-700 dark:text-slate-300">
                  <div>التاريخ والوقت</div>
                  <div>العملية</div>
                  <div>الحالة</div>
                </div>
                <div className="grid grid-cols-3 gap-2 p-2.5 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  <div>{new Date().toLocaleDateString('ar-EG')} - 10:45 AM</div>
                  <div>مزامنة النسخة الاحتياطية (Google Drive)</div>
                  <div className="text-emerald-600 font-bold">نجاح</div>
                </div>
                <div className="grid grid-cols-3 gap-2 p-2.5 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  <div>{new Date(Date.now() - 86400000).toLocaleDateString('ar-EG')} - 09:30 PM</div>
                  <div>تحديث بيانات التشفير (E2EE Keys)</div>
                  <div className="text-emerald-600 font-bold">نجاح</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. GENERAL PREFERENCES & APPEARANCE TAB                                   */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {activeMainTab === "data_sync_security" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-right" dir="rtl">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5 justify-start">
              <Lock className="w-5 h-5 text-amber-500" />
              <span>أمان البيانات والمزامنة السحابية (E2EE)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              تفعيل التشفير الشامل للنسخ الاحتياطية على Google Drive ومراجعة سجل عمليات المزامنة الدورية لحماية بيانات المكتب وعملائه.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">التشفير الشامل (End-to-End Encryption)</h4>
                </div>
                <p className="text-[10px] text-slate-500">
                  تشفير النسخ الاحتياطية قبل رفعها لسحابة Google Drive بحيث لا يمكن فك تشفيرها إلا من خلال هذا النظام.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={endToEndEncryptionEnabled}
                  onChange={(e) => setEndToEndEncryptionEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                سجل نشاط المزامنة الأخير
              </h4>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-2 font-bold text-slate-700 dark:text-slate-300">
                  <div>التاريخ والوقت</div>
                  <div>العملية</div>
                  <div>الحالة</div>
                </div>
                <div className="grid grid-cols-3 gap-2 p-2.5 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  <div>{new Date().toLocaleDateString('ar-EG')} - 10:45 AM</div>
                  <div>مزامنة النسخة الاحتياطية (Google Drive)</div>
                  <div className="text-emerald-600 font-bold">نجاح</div>
                </div>
                <div className="grid grid-cols-3 gap-2 p-2.5 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  <div>{new Date(Date.now() - 86400000).toLocaleDateString('ar-EG')} - 09:30 PM</div>
                  <div>تحديث بيانات التشفير (E2EE Keys)</div>
                  <div className="text-emerald-600 font-bold">نجاح</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeMainTab === "general_preferences" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5">
              <Palette className="w-5 h-5 text-amber-500" />
              <span>المظهر والتخصيص البصري وسلوك المزامنة</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              التحكم في الألوان المميزة، وضع المزامنة، وتفضيلات واجهة المستخدم.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Theme & Accent Color */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-500" />
                <span>اللون المميز للمنظومة (Accent Color)</span>
              </h4>
              
              <div className="flex flex-wrap gap-2.5">
                {[
                  { id: "amber", name: "الذهبي الملكي (افتراضي)", color: "#d97706" },
                  { id: "emerald", name: "الزمردي القضائي", color: "#059669" },
                  { id: "indigo", name: "النيلي الوقور", color: "#4f46e5" },
                  { id: "blue", name: "الأزرق الكلاسيكي", color: "#2563eb" },
                  { id: "rose", name: "العنابي الراقي", color: "#e11d48" },
                ].map((col) => (
                  <button
                    key={col.id}
                    onClick={() => {
                      if (setAccentColor) setAccentColor(col.id);
                      localStorage.setItem("law_accent_color", col.id);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      accentColor === col.id
                        ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>

              {onNavigateToDesigns && (
                <div className="pt-2">
                  <button
                    onClick={onNavigateToDesigns}
                    className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    فتح استوديو التصميمات والمظاهر الكامل (Themes Studio) 🎨
                  </button>
                </div>
              )}
            </div>

            {/* Offline & Cloud Sync Mode */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-amber-500" />
                <span>المزامنة السحابية والحفظ المحلي (Data Storage)</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">المزامنة التلقائية مع LocalStorage</div>
                    <div className="text-[10px] text-slate-400">حفظ فوري مشفر لكافة المدخلات على المتصفح</div>
                  </div>
                  <span className="text-xs font-black text-emerald-500">مفعل دائماً 🟢</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">ربط السحابة بـ Firebase / Firestore</div>
                    <div className="text-[10px] text-slate-400">مزامنة القضايا والجلسات بين أجهزة المكتب بالكامل</div>
                  </div>
                  <span className="text-xs font-bold text-amber-500">جاهز للربط ⚡</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
