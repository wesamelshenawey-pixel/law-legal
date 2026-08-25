const fs = require('fs');

const topPart = `import React, { useState } from "react";
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
      licenseKey: \`\${code1}-\${code2}-\${code3}-\${code4}\`,
      holderName: licenseHolder,
      holderPhone: licensePhone,
      maxDevices: licenseMaxDevices,
      maxUsers: licenseMaxUsers,
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
          className={\`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 \${
            activeMainTab === "program_sections"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }\`}
        >
          <Building2 className="w-4 h-4" />
          <span>أقسام المكتب ونماذج البيانات</span>
        </button>

        {/* 2. Users & Accounts */}
        <button
          onClick={() => setActiveMainTab("users_accounts")}
          className={\`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 \${
            activeMainTab === "users_accounts"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }\`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة حسابات الطاقم ({registeredUsers.length})</span>
        </button>

        {/* 3. Granular RBAC Permissions */}
        <button
          onClick={() => setActiveMainTab("permissions_matrix")}
          className={\`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 \${
            activeMainTab === "permissions_matrix"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }\`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>مصفوفة الصلاحيات (RBAC)</span>
        </button>

        {/* 4. Connected Devices & Hardware Security */}
        <button
          onClick={() => setActiveMainTab("connected_devices")}
          className={\`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 \${
            activeMainTab === "connected_devices"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }\`}
        >
          <Monitor className="w-4 h-4" />
          <span>الأجهزة النشطة والربط الأمني</span>
        </button>

        {/* 5. Licensing & Copy Protection */}
        <button
          onClick={() => setActiveMainTab("licensing_security")}
          className={\`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 \${
            activeMainTab === "licensing_security"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }\`}
        >
          <KeyRound className="w-4 h-4" />
          <span>التراخيص ومكافحة القرصنة ({licenses.length})</span>
        </button>

        {/* 6. Preferences & Appearance */}
        <button
          onClick={() => setActiveMainTab("general_preferences")}
          className={\`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 \${
            activeMainTab === "general_preferences"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }\`}
        >
          <Palette className="w-4 h-4" />
          <span>المظهر والمزامنة</span>
        </button>

        {/* 7. Data Security & Sync */}
        <button
          onClick={() => setActiveMainTab("data_sync_security")}
          className={\`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 \${
            activeMainTab === "data_sync_security"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }\`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>أمان البيانات والمزامنة</span>
        </button>
      </div>
      
      {/* ========================================================================= */}
`;

let currentFile = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

let newContent = topPart + currentFile.substring(currentFile.indexOf('{/* 1. PROGRAM MODULES & DEPARTMENTS TAB                                      */}'));

fs.writeFileSync('src/components/SettingsView.tsx', newContent);

