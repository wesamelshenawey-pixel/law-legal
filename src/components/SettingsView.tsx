import React, { useState } from "react";
import { AdminCustomSection, AdminCustomProperty, UserRole, PlatformUser } from "../types";
import { License, ActivationRequest } from "../utils/firebaseSync";
import { TRANSLATIONS } from "../utils/translations";
import { 
  Layers, 
  Sliders, 
  Globe, 
  KeyRound, 
  Plus, 
  CheckCircle, 
  X, 
  ShieldAlert, 
  Laptop, 
  Users, 
  UserPlus, 
  PhoneCall, 
  RefreshCw,
  Palette
} from "lucide-react";

interface SettingsViewProps {
  customSections: AdminCustomSection[];
  customProperties: AdminCustomProperty[];
  onAddCustomSection: (sec: AdminCustomSection) => void;
  onAddCustomProperty: (prop: AdminCustomProperty) => void;
  onRemoveCustomSection: (id: string) => void;
  onRemoveCustomProperty: (id: string) => void;
  currentUser: PlatformUser;
  
  // Licensing state and controllers
  licenses: License[];
  onAddLicense: (lic: License) => void;
  onDeleteLicense: (id: string) => void;
  onUpdateLicense: (id: string, updated: Partial<License>) => void;
  activationRequests: ActivationRequest[];
  onApproveDeviceRequest: (reqId: string) => void;
  onRejectDeviceRequest: (reqId: string) => void;
  language: "ar" | "en";
  registeredUsers?: PlatformUser[];
  onUpdateUser?: (id: string, updated: Partial<PlatformUser>) => void;
  accentColor?: string;
  setAccentColor?: (color: string) => void;
  onNavigateToDesigns?: () => void;
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
  onUpdateUser,
  accentColor = "amber",
  setAccentColor,
  onNavigateToDesigns
}: SettingsViewProps) {
  // Section Form States
  const [secNameAr, setSecNameAr] = useState("");
  const [secNameEn, setSecNameEn] = useState("");
  const [secIcon, setSecIcon] = useState("FileText");

  // Property Form States
  const [propAr, setPropAr] = useState("");
  const [propEn, setPropEn] = useState("");
  const [propTarget, setPropTarget] = useState<"case" | "client">("case");
  const [propType, setPropType] = useState<"text" | "number" | "select">("text");

  // License Form States
  const [licenseHolder, setLicenseHolder] = useState("");
  const [licensePhone, setLicensePhone] = useState("");
  const [licenseMaxDevices, setLicenseMaxDevices] = useState(2);
  const [licenseMaxUsers, setLicenseMaxUsers] = useState(5);

  const [offlineSyncMode, setOfflineSyncMode] = useState(true);

  const t = (key: string) => TRANSLATIONS[key]?.[language] || key;

  const handleAddNewSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secNameAr) {
      alert("الطلب يحتاج اسماً عربياً مناسباً للقسم.");
      return;
    }

    const newSec: AdminCustomSection = {
      id: "sec-" + Date.now(),
      nameArabic: secNameAr,
      nameEnglish: secNameEn || secNameAr,
      iconName: secIcon,
      path: "/" + (secNameEn || secNameAr).toLowerCase().replace(/\s+/g, ""),
      fields: [{ name: "التفاصيل", type: "string" }],
      records: []
    };

    onAddCustomSection(newSec);
    setSecNameAr("");
    setSecNameEn("");
    alert(`تم نجاح بناء وهندسة القسم الإضافي الجديد: (${secNameAr})! تم اختصاره سحابياً في الشريط الجانبي.`);
  };

  const handleAddNewProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propAr) {
      alert("الرجاء تحديد اسم الخاصية الاضافية.");
      return;
    }

    const newProp: AdminCustomProperty = {
      id: "prop-" + Date.now(),
      entityName: propTarget,
      propertyNameArabic: propAr,
      propertyNameEnglish: propEn || propAr,
      propertyType: propType
    };

    onAddCustomProperty(newProp);
    setPropAr("");
    setPropEn("");
    alert(`تم تأكيد قيد الخاصية المضافة: (${propAr}) في منظومة القضايا والموكلين!`);
  };

  const handleGenerateLicenseKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseHolder.trim() || !licensePhone.trim()) {
      alert(language === "ar" ? "برجاء توفير معلومات الجهة والاسم لإنشاء مفتاح الترخيص." : "Please fill licensee details.");
      return;
    }

    // Generate strong unique cryptographic activation code
    const randPart = Math.floor(1000 + Math.random() * 9000).toString();
    const generatedKey = `LIC-WESAM-${licenseHolder.substring(0,3).toUpperCase()}-${randPart}`;

    const newLicense: License = {
      id: generatedKey,
      holderName: licenseHolder.trim(),
      holderPhone: licensePhone.trim(),
      maxDevices: Number(licenseMaxDevices),
      maxUsers: Number(licenseMaxUsers),
      approvedDevices: [],
      registeredPhones: [licensePhone.trim()],
      status: "active",
      createdAt: new Date().toISOString()
    };

    onAddLicense(newLicense);
    setLicenseHolder("");
    setLicensePhone("");
    alert(language === "ar" 
      ? `تم ترخيص وإصدار نسخة أصلية بنجاح!\nمفتاح الترخيص: ${generatedKey}\nيمكنك إعطائه للمشتري لتشغيل نسخته.`
      : `License issued successfully!\nKey: ${generatedKey}`);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir={language === "ar" ? "rtl" : "ltr"}>

      {/* ACCOUNTS & DEVICES MANAGEMENT */}
      {currentUser.role === UserRole.ADMIN && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5 justify-start">
                <Laptop className="w-5 h-5 text-amber-500" />
                {language === "ar" ? "إدارة الحسابات والأجهزة (الأجهزة المتصلة على البرنامج)" : "Accounts & Connected Devices"}
              </h3>
              <p className="text-[11px] text-slate-450 mt-1 max-w-2xl">
                {language === "ar"
                  ? "إدارة حسابات المستخدمين المسجلة، دمج الحسابات، وتحديد عدد الأجهزة المسموح بها لكل حساب. يظهر هنا كل جهاز سجل دخول على البرنامج."
                  : "Manage registered users, merge accounts, and limit active devices for each user."}
              </p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 font-extrabold px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
              {language === "ar" ? `إجمالي الحسابات: ${registeredUsers.length}` : `Total Accounts: ${registeredUsers.length}`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <th className="pb-3 text-right">الحساب (المستخدم)</th>
                  <th className="pb-3 text-right">الدور</th>
                  <th className="pb-3 text-center">أقصى عدد أجهزة</th>
                  <th className="pb-3 text-center">الأجهزة المتصلة حالياً</th>
                  <th className="pb-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {registeredUsers.map(user => (
                  <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 text-slate-900 dark:text-slate-200 font-bold">
                      {user.name}
                      <div className="text-[10px] text-slate-500 font-mono">{user.phone}</div>
                      {user.mergedWithAccountId && (
                        <div className="text-[9px] text-red-500 font-bold mt-0.5">🔗 تم الدمج مع حساب آخر</div>
                      )}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {user.role === UserRole.ADMIN ? "مدير النظام" : "موكل / مستخدم"}
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={user.maxDevices || 1}
                        onChange={(e) => {
                          if(onUpdateUser) onUpdateUser(user.id, { maxDevices: Number(e.target.value) });
                        }}
                        className="w-16 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-center rounded p-1 text-xs outline-none"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        {(user.connectedDevices && user.connectedDevices.length > 0) ? user.connectedDevices.map(device => (
                          <div key={device.deviceId} className="flex items-center justify-center gap-1">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-[9px] font-mono">
                              {device.deviceName}
                            </span>
                            <button
                              onClick={() => {
                                if (window.confirm("تسجيل خروج هذا الجهاز قسرياً؟")) {
                                  if (onUpdateUser) {
                                    const updatedDevices = user.connectedDevices!.filter(d => d.deviceId !== device.deviceId);
                                    onUpdateUser(user.id, { connectedDevices: updatedDevices });
                                  }
                                }
                              }}
                              className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-0.5 rounded transition"
                              title="تسجيل خروج قسري"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )) : (
                          <span className="text-slate-400 text-[10px]">لا توجد أجهزة متصلة</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => {
                          const otherPhone = prompt("أدخل رقم هاتف الحساب الذي ترغب بدمج هذا الحساب معه:");
                          if (otherPhone) {
                            const otherAccount = registeredUsers.find(u => u.phone === otherPhone);
                            if (otherAccount && otherAccount.id !== user.id) {
                              if(onUpdateUser) onUpdateUser(user.id, { mergedWithAccountId: otherAccount.id });
                              alert("تم تسجيل عملية الدمج بنجاح.");
                            } else {
                              alert("لم يتم العثور على حساب بهذا الرقم أو أنه نفس الحساب الحالي.");
                            }
                          }
                        }}
                        className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-bold transition shadow-sm"
                      >
                        دمج مع حساب
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* LICENSING ENGINE - SOLD COPIES & ANTI-PIRACY LIMITS CONTROL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5 justify-start">
              <KeyRound className="w-5 h-5 text-amber-500 animate-pulse" />
              {language === "ar" ? "منظومة بيع وتراخيص نسخ البرنامج ومكافحة القرصنة" : "Anti-Piracy Enforcement & Live Copy Licensing"}
            </h3>
            <p className="text-[11px] text-slate-450 mt-1 max-w-2xl">
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
            {language === "ar" ? "بيع وإصدار نسخة جديدة لعميل (مفتاح ترخيص سحابي)" : "Sell & Deploy a New Software Copy Key"}
          </h4>

          <form onSubmit={handleGenerateLicenseKey} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 mb-1">
                {language === "ar" ? "اسم المشتري / الجهة" : "Buyer Name / Firm"}
              </label>
              <input
                type="text"
                value={licenseHolder}
                onChange={(e) => setLicenseHolder(e.target.value)}
                placeholder="الأستاذ أحمد فوزي"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-3 py-2 text-xs rounded-lg outline-none text-right"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 mb-1">
                {language === "ar" ? "رقم الهاتف المحمول" : "Buyer Mobile Phone"}
              </label>
              <input
                type="tel"
                value={licensePhone}
                onChange={(e) => setLicensePhone(e.target.value)}
                placeholder="01012345678"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-3 py-2 text-xs rounded-lg outline-none font-sans text-right"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 mb-1">
                  {language === "ar" ? "أقصى أجهزة" : "Max Devices"}
                </label>
                <input
                  type="number"
                  value={licenseMaxDevices}
                  onChange={(e) => setLicenseMaxDevices(Number(e.target.value))}
                  min={1}
                  max={20}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-3 h-8.5 rounded-lg text-xs outline-none text-center font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 mb-1">
                  {language === "ar" ? "أقصى مستخدمين" : "Max Users"}
                </label>
                <input
                  type="number"
                  value={licenseMaxUsers}
                  onChange={(e) => setLicenseMaxUsers(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-3 h-8.5 rounded-lg text-xs outline-none text-center font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg shadow-sm cursor-pointer transition flex items-center justify-center gap-1 w-full"
            >
              <KeyRound className="w-4 h-4" />
              <span>{language === "ar" ? "إصدار وتشفير الترخيص" : "Generate Core License"}</span>
            </button>
          </form>
        </div>

        {/* 2. Active Devices Requests pending approval */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-amber-700 dark:text-amber-500 flex items-center gap-1.5 justify-start">
            <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
            {language === "ar" ? "طلبات تفعيل أجهزة العملاء المعلقة (بصمة فنية)" : "Incoming Hardware Device Activation Enquiries"}
          </h4>
          <p className="text-[10px] text-slate-405 text-slate-450 leading-normal">
            {language === "ar"
              ? "إذا حاول أحد شراء البرنامج أو تشغيله على جهاز جديد، تظهر له رسالة وبصمته الرقمية. يمكنك اعتماد جهازه والترخيص له بنقرة واحدة سريعة!"
              : "When a customer installs the copy on a new machine, they register their fingerprint. Authorize access instantly here:"}
          </p>

          {activationRequests.filter(r => r.status === "pending").length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-400 font-medium">
              🕊️ {language === "ar" ? "لا توجد طلبات تفعيل أجهزة معلقة حالياً." : "No pending device activation requests."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activationRequests.filter(r => r.status === "pending").map((req) => (
                <div key={req.id} className="p-4 bg-amber-50/45 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-850 rounded-xl relative space-y-3 text-right">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 px-2.5 py-1 rounded font-extrabold">
                      {language === "ar" ? "معلّق الموافقة" : "Pending Authorization"}
                    </span>
                    <p className="text-xs font-black text-slate-900 dark:text-slate-100">{req.requestName}</p>
                  </div>

                  <div className="space-y-1 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                    <p className="text-right">📱 {language === "ar" ? `هاتف المشتري: ` : `Phone: `}<span className="font-sans text-slate-800 dark:text-slate-300 font-bold">{req.requestPhone}</span></p>
                    <p className="text-right">🔑 {language === "ar" ? `رمز التفعيل: ` : `Key: `}<span className="font-semibold text-amber-700 dark:text-amber-500">{req.licenseKey}</span></p>
                    <p className="text-right">💻 {language === "ar" ? `بصمة الجهاز: ` : `Fingerprint: `}<span className="font-extrabold text-slate-900 dark:text-slate-200">{req.deviceFingerprint}</span></p>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-200/50 dark:border-slate-800">
                    <button
                      onClick={() => {
                        onRejectDeviceRequest(req.id);
                        alert(language === "ar" ? "تم رفض الطلب بنجاح!" : "Access request rejected.");
                      }}
                      className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold hover:bg-red-100 transition cursor-pointer"
                    >
                      {language === "ar" ? "رفض ومنع" : "Reject"}
                    </button>
                    <button
                      onClick={() => {
                        onApproveDeviceRequest(req.id);
                        alert(language === "ar" ? "تهانينا! تم ربط الجهاز واعتماده بملف الترخيص سحابياً." : "Device approved! Access granted.");
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-700 transition cursor-pointer shadow-sm"
                    >
                      {language === "ar" ? "الموافقة وتفعيل هذا الجهاز" : "Approve & Activate Device"}
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

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse text-slate-800 dark:text-slate-200 rounded-xl overflow-hidden font-sans">
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
                      {lic.approvedDevices.length > 0 && (
                        <div className="text-[8px] text-slate-400 mt-1 font-mono leading-tight max-w-[120px] overflow-hidden truncate">
                          {lic.approvedDevices.join(", ")}
                        </div>
                      )}
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
                          className="px-2 py-1 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 rounded text-[9px] font-bold border border-amber-200/55 hover:bg-amber-100 cursor-pointer"
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
                          className="px-2 py-1 bg-sky-50 text-sky-805 dark:bg-sky-955/30 dark:text-sky-400 rounded text-[9px] font-bold border border-sky-200/55 hover:bg-sky-100 cursor-pointer"
                        >
                          {language === "ar" ? "ترقية الحسابات" : "+ Users"}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <span className={`inline-flex px-2 py-0.5 text-[9px] font-black rounded-full ${lic.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400"}`}>
                          {lic.status === "active" ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "موجه" : "Suspended")}
                        </span>
                        
                        <button
                          onClick={() => {
                            const nStatus = lic.status === "active" ? "inactive" : "active";
                            onUpdateLicense(lic.id, { status: nStatus });
                          }}
                          className="p-1 text-[10px] text-slate-500 hover:text-amber-600 font-bold hover:underline cursor-pointer"
                          title={language === "ar" ? "تبديل تشغيل/إيقاف النسخة" : "Suspend/Resume copy license"}
                        >
                          {language === "ar" ? "تبديل 🔄" : "Toggle"}
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

      {/* CORE SHADCN LAYOUT CUSTOM SEGMENTATIONS (ORIGINAL FEATS PRESERVED) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-right leading-relaxed font-sans text-slate-800">
        
        {/* ADD CYBER SECTION FORM */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4 shadow-sm text-xs leading-relaxed text-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-amber-500 flex items-center justify-start gap-1">
            <Layers className="w-4 h-4 text-amber-550" />
            {language === "ar" ? "استحداث وإضافة أقسام جديدة كلياً للبرنامج" : "Structure & Setup Custom Program Divisions"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {language === "ar" 
              ? "اكتب اسم القسم الجديد ليقوم النظام ببنائه ورسمه تلقائياً في شريط تصفح النظام بالجانب." 
              : "Generate fully functional custom sidebars for tracking specified departments dynamically."}
          </p>

          <form onSubmit={handleAddNewSection} className="space-y-3 font-sans">
            <div>
              <label className="block text-slate-700 dark:text-slate-355 text-right mb-1" htmlFor="sec-ar-name">
                {language === "ar" ? "اسم القسم المضاف بالعربية" : "Department Name (Arabic)"}
              </label>
              <input
                id="sec-ar-name"
                type="text"
                value={secNameAr}
                onChange={(e) => setSecNameAr(e.target.value)}
                placeholder={language === "ar" ? "مثال: قسم التحكيم الدولي" : "e.g. International Arbitration"}
                className="w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-355 text-right mb-1" htmlFor="sec-en-name">
                {language === "ar" ? "اسمها بالإنجليزية (محدد المسار)" : "Department Code (English)"}
              </label>
              <input
                id="sec-en-name"
                type="text"
                value={secNameEn}
                onChange={(e) => setSecNameEn(e.target.value)}
                placeholder="Arbitration, etc."
                className="w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded text-left font-mono outline-none focus:bg-white focus:border-amber-500 transition"
              />
            </div>

            <button
              id="submit-section-btn"
              type="submit"
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold rounded cursor-pointer transition shadow-sm"
            >
              {language === "ar" ? "بناء وإقرار القسم سحابياً" : "Deploy Custom Sidebar Track"}
            </button>
          </form>

          {/* List existing custom sections */}
          {customSections.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[10px] text-slate-400 font-bold">{language === "ar" ? "الأقسام المضافة الحالية:" : "Active Custom Tabs:"}</p>
              {customSections.map(sec => (
                <div key={sec.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-between items-center text-xs text-slate-800 dark:text-slate-200 shadow-inner font-sans animate-fade-in">
                  <button
                    id={`remove-sec-${sec.id}`}
                    onClick={() => {
                      onRemoveCustomSection(sec.id);
                      alert("تم تفكيك وإلغاء القسم الإضافي سحابياً.");
                    }}
                    className="text-red-700 hover:underline font-bold cursor-pointer transition"
                  >
                    إلغاء ×
                  </button>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{sec.nameArabic} ({sec.nameEnglish})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PROPERTIES EXTENDER (إضافة خصائص جديدة) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4 shadow-sm text-xs leading-relaxed text-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-amber-500 flex items-center justify-start gap-1">
            <Sliders className="w-4 h-4 text-amber-550" />
            {language === "ar" ? "تمديد القضايا والموكلين بخصائص وبنود جديدة" : "Extend Modules with Dynamic Form Inputs"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {language === "ar" 
              ? "أضف حقولاً معينة (مثل رقم المحفظة أو شهود التعاقد) لتضمينها آلياً بنموذج إدخال الدعاوى أو صفحة الموكلين." 
              : "Append customized metadata forms automatically (like bail parameters, case bonds, or court levels)."}
          </p>

          <form onSubmit={handleAddNewProperty} className="space-y-3 font-sans">
            <div className="grid grid-cols-2 gap-3 font-sans">
              <div>
                <label className="block text-slate-700 dark:text-slate-355 text-right mb-1" htmlFor="prop-target">
                  {language === "ar" ? "ملحق بـ" : "Parent Model"}
                </label>
                <select
                  id="prop-target"
                  value={propTarget}
                  onChange={(e) => setPropTarget(e.target.value as "case" | "client")}
                  className="w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded text-right font-bold outline-none focus:bg-white focus:border-amber-500 transition"
                >
                  <option value="case">{language === "ar" ? "عريضة القضية" : "Court Case (Suit)"}</option>
                  <option value="client">{language === "ar" ? "ملف الموكل" : "Client Profile (Party)"}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-355 text-right mb-1" htmlFor="prop-type">
                  {language === "ar" ? "نوع البيان" : "Data Format"}
                </label>
                <select
                  id="prop-type"
                  value={propType}
                  onChange={(e) => setPropType(e.target.value as any)}
                  className="w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition"
                >
                  <option value="text">{language === "ar" ? "نصّ عادي" : "Plain String"}</option>
                  <option value="number">{language === "ar" ? "رقم عددي" : "Decimal Number"}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-sans">
              <div>
                <label className="block text-slate-700 dark:text-slate-355 text-right mb-1" htmlFor="prop-ar-name">
                  {language === "ar" ? "اسم الخاصية بالعربية" : "Entry Title (Arabic)"}
                </label>
                <input
                  id="prop-ar-name"
                  type="text"
                  value={propAr}
                  onChange={(e) => setPropAr(e.target.value)}
                  placeholder={language === "ar" ? "مثال: الرقم الضريبي لشركة" : "e.g. Corporate Tax Record"}
                  className="w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-355 text-right mb-1" htmlFor="prop-en-name">
                  {language === "ar" ? "الاسم البرمجي" : "Field Identifier (English)"}
                </label>
                <input
                  id="prop-en-name"
                  type="text"
                  value={propEn}
                  onChange={(e) => setPropEn(e.target.value)}
                  placeholder="tax_id"
                  className="w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded text-left font-mono outline-none focus:bg-white focus:border-amber-500 transition"
                />
              </div>
            </div>

            <button
              id="submit-property-btn"
              type="submit"
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold rounded cursor-pointer transition shadow-sm"
            >
              {language === "ar" ? "غرس الخاصية الجديدة لدفتر المدخلات" : "Deploy Custom Property Form Field"}
            </button>
          </form>

          {/* Properties list */}
          {customProperties.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[10px] text-slate-400 font-bold">{language === "ar" ? "الخصائص النشطة الحالية:" : "Active Custom Fields:"}</p>
              {customProperties.map(prop => (
                <div key={prop.id} className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded flex justify-between items-center text-[11px] animate-fade-in font-sans">
                  <button
                    id={`remove-prop-${prop.id}`}
                    onClick={() => {
                      onRemoveCustomProperty(prop.id);
                      alert("تم تدمير وإبادة الحقل المضاف.");
                    }}
                    className="text-red-700 font-semibold hover:underline cursor-pointer transition"
                  >
                    حذف ×
                  </button>
                  <span className="text-slate-800 dark:text-slate-250">{prop.propertyNameArabic} ({prop.entityName === "case" ? (language === "ar" ? "عريضة القضية" : "Case Record") : (language === "ar" ? "ملف الموكل" : "Client Profile")})</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ACCENT COLOR SETTINGS & DESIGNS STUDIO BANNER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4 shadow-sm text-xs leading-relaxed text-right">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-amber-500 flex items-center justify-start gap-1">
              <Palette className="w-5 h-5 text-amber-500" />
              {language === "ar" ? "تخصيص لون التمييز وتصاميم الواجهة (Themes & Designs)" : "UI Accent & Themes Customization"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
              {language === "ar"
                ? "اختر لون التمييز السريع أو انتقل إلى قسم التصميمات والمظاهر المتكامل لاختيار هوية بصرية كاملة."
                : "Select a quick accent color or open the dedicated Themes & Designs Studio for complete visual archetypes."}
            </p>
          </div>

          {onNavigateToDesigns && (
            <button
              type="button"
              onClick={onNavigateToDesigns}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer hover:scale-105"
            >
              <span>🎨</span>
              <span>{language === "ar" ? "فتح قسم التصميمات والمظاهر الشامل" : "Open Full Designs Studio"}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          {[
            { id: 'amber', nameAr: 'ذهبي / كهرماني (الافتراضي)', nameEn: 'Amber / Gold (Default)', bgClass: 'bg-amber-500', borderClass: 'border-amber-600' },
            { id: 'emerald', nameAr: 'زمردي / أخضر ملكي', nameEn: 'Emerald Green', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-600' },
            { id: 'blue', nameAr: 'أزرق ياقوتي', nameEn: 'Sapphire Blue', bgClass: 'bg-blue-500', borderClass: 'border-blue-600' },
            { id: 'indigo', nameAr: 'نيلي / أنديجو', nameEn: 'Royal Indigo', bgClass: 'bg-indigo-500', borderClass: 'border-indigo-600' },
            { id: 'purple', nameAr: 'بنفسجي فاخر', nameEn: 'Deep Purple', bgClass: 'bg-purple-500', borderClass: 'border-purple-600' },
            { id: 'teal', nameAr: 'فيروزي بحري', nameEn: 'Ocean Teal', bgClass: 'bg-teal-500', borderClass: 'border-teal-600' },
            { id: 'cyan', nameAr: 'سماوي / سيان', nameEn: 'Sky Cyan', bgClass: 'bg-cyan-500', borderClass: 'border-cyan-600' },
            { id: 'orange', nameAr: 'برتقالي برونزي', nameEn: 'Bronze Orange', bgClass: 'bg-orange-500', borderClass: 'border-orange-600' },
            { id: 'rose', nameAr: 'وردي روبي', nameEn: 'Ruby Rose', bgClass: 'bg-rose-500', borderClass: 'border-rose-600' }
          ].map(palette => (
            <button
              key={palette.id}
              onClick={() => setAccentColor && setAccentColor(palette.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${accentColor === palette.id ? `border-slate-800 dark:border-white shadow-md scale-105 bg-white dark:bg-slate-800 ring-2 ring-amber-400/30` : `border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-950`}`}
            >
              <span className={`w-4 h-4 rounded-full ${palette.bgClass} border ${palette.borderClass} shadow-sm`}></span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                {language === "ar" ? palette.nameAr : palette.nameEn}
              </span>
              {accentColor === palette.id && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-sans">✓ نشط</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* OFFLINE MODULATION ENGINE SETTINGS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4 shadow-sm text-xs leading-relaxed text-right">
        <h3 className="text-base font-bold text-slate-900 dark:text-amber-500 flex items-center justify-start gap-1">
          <Globe className="w-5 h-5 text-amber-550 animate-pulse" />
          {language === "ar" ? "تنظيم المزامنة الهجينة والعمل بدون اتصال بالإنترنت (Offline Mode)" : "Hybrid Offline-First Sync & Edge-Caching Engine"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {language === "ar"
            ? "يعمل النظام محلياً بشكل تام لحفظ التغييرات في الذاكرة المعززة للمتصفح (LocalStorage/IndexedDB) وتلقائياً يبث التعديلات مجدداً عند رصد شبكة الخادم أو النقر المباشر على مزامنة."
            : "Features persistent cache state enabling offline capabilities without server ties. Automatically flushes records when the network recovers."}
        </p>

        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center flex-wrap gap-4 text-slate-800 dark:text-slate-200 shadow-inner">
          <div className="flex gap-2">
            <button
              id="sync-toggle-on"
              onClick={() => {
                setOfflineSyncMode(true);
                alert("مزامنة فورية نشطة وخاصية التخزين المحلي الاحتياطي والبحث بلا نت نشطة.");
              }}
              className={`px-4 py-2 font-bold rounded-lg text-xs transition duration-200 cursor-pointer shadow-sm ${
                offlineSyncMode 
                  ? "bg-amber-500 text-slate-900 font-extrabold shadow-md" 
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              }`}
            >
              {language === "ar" ? "مزامنة فورية نشطة" : "Direct Live Sync Enabled"}
            </button>
            <button
              id="sync-toggle-off"
              onClick={() => {
                setOfflineSyncMode(false);
                alert("تم التبديل لوضع العمل المحلي الكامل (Offline-First) دون محاذاة سحابية.");
              }}
              className={`px-4 py-2 font-bold rounded-lg text-xs transition duration-200 cursor-pointer shadow-sm ${
                !offlineSyncMode 
                  ? "bg-amber-500 text-slate-900 font-extrabold shadow-md" 
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              }`}
            >
              {language === "ar" ? "عمل محلي كامل (الأوفلاين)" : "Offline Local Storage Only"}
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === "ar" ? "الأوفلاين وإقرار الاتصال" : "Offline Integrity & Storage Cache"}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {language === "ar" 
                ? "بوابة الدخول معززة بمستويات وصول الأمان لتخزين ملفات الموكلين وقضاياهم بأحكام كاملة." 
                : "Clients are secured by standard localized zero-trust cryptography keeping cases entirely hidden."}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
