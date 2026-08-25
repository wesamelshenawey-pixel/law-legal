import React, { useState } from "react";
import { 
  PlatformUser, 
  ConnectedDeviceRecord, 
  SecurityAuditLog 
} from "../types";
import { ROLE_LABELS } from "../utils/rbacAndSecurity";
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  LogOut, 
  Lock, 
  Unlock, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Wifi, 
  AlertTriangle,
  Fingerprint,
  RotateCcw,
  SlidersHorizontal,
  Globe
} from "lucide-react";

interface ConnectedDevicesHubProps {
  registeredUsers: PlatformUser[];
  onUpdateUser: (userId: string, updated: Partial<PlatformUser>) => void;
  onRevokeDeviceSession: (userId: string, deviceId: string) => void;
  onRevokeAllOtherSessions: (userId: string, exceptDeviceId?: string) => void;
  onToggleDeviceLock: (userId: string, lockToSingle: boolean, trustedDeviceId?: string) => void;
  onBlockDevice: (userId: string, deviceId: string) => void;
  currentDeviceFingerprint?: string;
  currentUser: PlatformUser;
  language: "ar" | "en";
}

export default function ConnectedDevicesHub({
  registeredUsers,
  onUpdateUser,
  onRevokeDeviceSession,
  onRevokeAllOtherSessions,
  onToggleDeviceLock,
  onBlockDevice,
  currentDeviceFingerprint,
  currentUser,
  language
}: ConnectedDevicesHubProps) {
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMaxDevicesUserId, setEditingMaxDevicesUserId] = useState<string | null>(null);
  const [newMaxDevicesVal, setNewMaxDevicesVal] = useState<number>(3);

  // Flatten all devices across users with their owner info
  const allDeviceSessions: {
    user: PlatformUser;
    device: ConnectedDeviceRecord;
  }[] = [];

  registeredUsers.forEach(u => {
    if (u.connectedDevices && u.connectedDevices.length > 0) {
      u.connectedDevices.forEach(d => {
        allDeviceSessions.push({ user: u, device: d });
      });
    }
  });

  const filteredSessions = allDeviceSessions.filter(item => {
    const matchesUser = selectedUserFilter === "all" || item.user.id === selectedUserFilter;
    const matchesSearch = 
      item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.phone.includes(searchQuery) ||
      item.device.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.device.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.device.ipAddress && item.device.ipAddress.includes(searchQuery));
    return matchesUser && matchesSearch;
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile": return <Smartphone className="w-5 h-5 text-sky-500" />;
      case "tablet": return <Tablet className="w-5 h-5 text-purple-500" />;
      case "laptop": return <Laptop className="w-5 h-5 text-amber-500" />;
      default: return <Monitor className="w-5 h-5 text-emerald-500" />;
    }
  };

  const handleSaveMaxDevices = (userId: string) => {
    onUpdateUser(userId, { maxDevices: newMaxDevicesVal });
    setEditingMaxDevicesUserId(null);
    alert("تم تحديث الحد الأقصى للأجهزة المسموح بها للمستخدم بنجاح!");
  };

  return (
    <div className="space-y-6 text-right font-sans" dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-amber-500" />
            <span>مركز إدارة الأجهزة النشطة والربط الأمني (Connected Devices & Hardware Security)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مراقبة الأجهزة والمتصفحات المتصلة، تسجيل الخروج القسري، وقفل الحسابات على أجهزة معتمدة فقط.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{allDeviceSessions.length} جهاز وجلسة متصلة حالياً</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المستخدم، رقم الهاتف، اسم الجهاز أو الـ IP..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pr-9 pl-3 py-2 text-xs rounded-xl outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-xl font-bold outline-none"
          >
            <option value="all">جميع المستخدمين ({registeredUsers.length})</option>
            {registeredUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.connectedDevices?.length || 0} أجهزة)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* User Devices Summary & Hardware Lock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {registeredUsers
          .filter(u => selectedUserFilter === "all" || u.id === selectedUserFilter)
          .map(u => {
            const devCount = u.connectedDevices?.length || 0;
            const maxAllowed = u.maxDevices || 3;
            const isSingleDeviceLocked = !!u.lockToSingleDevice;
            const roleMeta = ROLE_LABELS[u.role] || ROLE_LABELS[u.role];

            return (
              <div 
                key={u.id} 
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {u.status === "suspended" && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-bold rounded">
                          مجمد
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">{u.phone}</span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300">
                    {roleMeta?.badge || u.role}
                  </span>
                </div>

                {/* Device Quota Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>الأجهزة المستخدمة:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {devCount} / {maxAllowed} جهاز
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        devCount >= maxAllowed ? "bg-red-500" : devCount > 0 ? "bg-amber-500" : "bg-slate-400"
                      }`}
                      style={{ width: `${Math.min(100, (devCount / maxAllowed) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actions & Lock Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {/* Single Device Lock Toggle */}
                  <button
                    onClick={() => {
                      const newLock = !isSingleDeviceLocked;
                      const trustedId = newLock && u.connectedDevices && u.connectedDevices.length > 0 
                        ? u.connectedDevices[0].deviceId 
                        : undefined;
                      onToggleDeviceLock(u.id, newLock, trustedId);
                      alert(newLock 
                        ? `تم قفل حساب (${u.name}) على الجهاز المعتمد فقط. لن يتمكن من الدخول من أي هاتف أو جهاز آخر!` 
                        : `تم إلغاء قفل الجهاز لحساب (${u.name}).`);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 transition cursor-pointer ${
                      isSingleDeviceLocked
                        ? "bg-amber-500 text-slate-950 hover:bg-amber-600 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                    title={isSingleDeviceLocked ? "الحساب مقفل على جهاز واحد فقط" : "السماح بالدخول من عدة أجهزة"}
                  >
                    {isSingleDeviceLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{isSingleDeviceLocked ? "مقفل على جهاز واحد" : "تثبيت على جهاز"}</span>
                  </button>

                  {/* Kill All Sessions Button */}
                  {devCount > 0 && (
                    <button
                      onClick={() => {
                        if (confirm(`تسجيل خروج قسري لجميع أجهزة المستخدم (${u.name})؟`)) {
                          onRevokeAllOtherSessions(u.id);
                        }
                      }}
                      className="px-2.5 py-1 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 text-[10px] font-black rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>طرد جميع الأجهزة</span>
                    </button>
                  )}

                  {/* Modify Max Devices */}
                  <button
                    onClick={() => {
                      setEditingMaxDevicesUserId(u.id);
                      setNewMaxDevicesVal(u.maxDevices || 3);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
                    title="تعديل الحد الأقصى للأجهزة"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Edit Max Devices Inline Popover */}
                {editingMaxDevicesUserId === u.id && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-300">الحد الأقصى للأجهزة:</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={newMaxDevicesVal}
                        onChange={(e) => setNewMaxDevicesVal(parseInt(e.target.value) || 1)}
                        className="w-14 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded text-center font-bold"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleSaveMaxDevices(u.id)}
                        className="flex-1 py-1 bg-amber-500 text-slate-950 font-black rounded text-[10px]"
                      >
                        حفظ
                      </button>
                      <button
                        onClick={() => setEditingMaxDevicesUserId(null)}
                        className="flex-1 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px]"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Detailed Live Devices Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5">
          <Wifi className="w-4 h-4 text-amber-500" />
          <span>سجل الجلسات والأجهزة التفصيلي ({filteredSessions.length})</span>
        </h4>

        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 font-medium">
            🔍 لا توجد أجهزة متصلة مطابقة لشروط البحث.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="p-3 font-black">المستخدم والحساب</th>
                  <th className="p-3 font-black">الجهاز والمتصفح</th>
                  <th className="p-3 font-black">بصمة الجهاز والـ IP</th>
                  <th className="p-3 font-black">آخر نشاط</th>
                  <th className="p-3 font-black text-center">الحالة والأمان</th>
                  <th className="p-3 font-black text-center">إجراء فوري</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredSessions.map(({ user, device }) => {
                  const isCurrent = device.deviceId === currentDeviceFingerprint;

                  return (
                    <tr key={`${user.id}-${device.deviceId}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition">
                      
                      {/* User */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{user.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{user.phone}</div>
                      </td>

                      {/* Device */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device.deviceType)}
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <span>{device.deviceName}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded">
                                  الجهاز الحالي 🟢
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {device.os} • {device.browser}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* IP & Fingerprint */}
                      <td className="p-3 font-mono text-[11px]">
                        <div className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{device.ipAddress || "197.34.120.88"}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 flex items-center gap-1">
                          <Fingerprint className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[120px]">{device.deviceId}</span>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="p-3 text-[11px] text-slate-500 dark:text-slate-400">
                        {device.lastLogin ? new Date(device.lastLogin).toLocaleString("ar-EG") : "نشط الآن"}
                      </td>

                      {/* Security Status */}
                      <td className="p-3 text-center">
                        {device.isBlocked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 rounded-full inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>محظور</span>
                          </span>
                        ) : device.isTrusted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>معتمد وموثوق</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full inline-flex items-center gap-1">
                            <Wifi className="w-3 h-3 text-emerald-500" />
                            <span>نشط عادي</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              if (confirm(`تسجيل خروج قسري للجهاز (${device.deviceName}) التابع لحساب (${user.name})؟`)) {
                                onRevokeDeviceSession(user.id, device.deviceId);
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                            title="تسجيل خروج قسري لهذا الجهاز"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`حظر هذا الجهاز (${device.deviceName}) ومنعه من تسجيل الدخول نهائياً؟`)) {
                                onBlockDevice(user.id, device.deviceId);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="حظر الجهاز"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
