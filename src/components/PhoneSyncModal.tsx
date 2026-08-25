import React, { useState, useEffect } from "react";
import { PlatformUser, ClientProfile, UserRole } from "../types";
import {
  Smartphone,
  Users,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  Building2,
  PhoneCall,
  MessageSquare,
  Globe,
  UploadCloud,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Cloud
} from "lucide-react";
import { COUNTRY_CODES, CountryCode } from "./PhoneInputWithCountry";
import { dbSaveSyncedContacts, dbLoadSyncedContacts, SyncedContactDoc } from "../utils/firebaseSync";

export interface ContactItem {
  id: string;
  name: string;
  phone: string;
  countryCode: string;
  countryName: string;
  flag: string;
  source: "platform_user" | "device_sync" | "excel_import" | "client";
  status: "is_client" | "is_user" | "unregistered";
  originalUser?: PlatformUser;
}

interface PhoneSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  registeredUsers: PlatformUser[];
  clients: ClientProfile[];
  onRegisterNewClient: (contact: { name: string; phone: string; countryCode: string }) => void;
  onRegisterNewCompany?: (contact: { name: string; phone: string }) => void;
  language?: "ar" | "en";
}

export default function PhoneSyncModal({
  isOpen,
  onClose,
  registeredUsers,
  clients,
  onRegisterNewClient,
  onRegisterNewCompany,
  language = "ar"
}: PhoneSyncModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCountryFilter, setSelectedCountryFilter] = useState("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [bulkTextInput, setBulkTextInput] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Sync contacts from registered users + clients + device local cache
  const [syncedContacts, setSyncedContacts] = useState<ContactItem[]>(() => {
    const saved = localStorage.getItem("law_synced_contacts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    const initial: ContactItem[] = [];

    // Map registered users
    registeredUsers.forEach((u) => {
      const matchCC = COUNTRY_CODES.find((c) => u.phone.startsWith(c.code)) || COUNTRY_CODES[0];
      const isClient = clients.some((cl) => cl.name === u.name || (cl.whatsapp && cl.whatsapp.includes(u.phone)));
      initial.push({
        id: `usr-${u.id}`,
        name: u.name,
        phone: u.phone,
        countryCode: matchCC.code,
        countryName: matchCC.name,
        flag: matchCC.flag,
        source: "platform_user",
        status: isClient ? "is_client" : "is_user",
        originalUser: u
      });
    });

    // Map clients not yet listed
    clients.forEach((cl) => {
      const ph = cl.whatsapp || "";
      if (ph && !initial.some((c) => c.phone === ph)) {
        const matchCC = COUNTRY_CODES.find((c) => ph.startsWith(c.code)) || COUNTRY_CODES[0];
        initial.push({
          id: `cl-${cl.id}`,
          name: cl.name,
          phone: ph,
          countryCode: matchCC.code,
          countryName: matchCC.name,
          flag: matchCC.flag,
          source: "client",
          status: "is_client"
        });
      }
    });

    return initial;
  });

  // Load cloud contacts on open
  useEffect(() => {
    if (isOpen) {
      dbLoadSyncedContacts().then((cloudContacts) => {
        if (cloudContacts && cloudContacts.length > 0) {
          setSyncedContacts(prev => {
            const map = new Map<string, ContactItem>();
            prev.forEach(c => map.set(c.phone, c));
            cloudContacts.forEach(cc => {
              if (!map.has(cc.phone)) {
                map.set(cc.phone, {
                  id: cc.id,
                  name: cc.name,
                  phone: cc.phone,
                  countryCode: cc.countryCode,
                  countryName: cc.countryName,
                  flag: cc.flag,
                  source: (cc.source as any) || "device_sync",
                  status: (cc.status as any) || "unregistered"
                });
              }
            });
            return Array.from(map.values());
          });
        }
      });
    }
  }, [isOpen]);

  const handleDeviceSync = async () => {
    setIsSyncing(true);
    // Pull fresh users and contacts
    const updatedList = [...syncedContacts];
    registeredUsers.forEach((u) => {
      if (!updatedList.some((c) => c.phone === u.phone)) {
        const matchCC = COUNTRY_CODES.find((c) => u.phone.startsWith(c.code)) || COUNTRY_CODES[0];
        updatedList.push({
          id: `usr-${u.id}`,
          name: u.name,
          phone: u.phone,
          countryCode: matchCC.code,
          countryName: matchCC.name,
          flag: matchCC.flag,
          source: "platform_user",
          status: "is_user",
          originalUser: u
        });
      }
    });

    setSyncedContacts(updatedList);
    localStorage.setItem("law_synced_contacts", JSON.stringify(updatedList));

    // Persist to Cloud Firestore
    const cloudDocs: SyncedContactDoc[] = updatedList.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      countryCode: c.countryCode,
      countryName: c.countryName,
      flag: c.flag,
      source: c.source,
      status: c.status,
      updatedAt: new Date().toISOString()
    }));
    await dbSaveSyncedContacts(cloudDocs);

    setIsSyncing(false);
    alert("🎉 تمت المزامنة السحابية المباشرة وحفظ جهات الاتصال في قاعدة البيانات السحابية (Firestore) بنجاح!");
  };

  const handleBulkImport = () => {
    if (!bulkTextInput.trim()) return;

    const lines = bulkTextInput.split("\n");
    const newItems: ContactItem[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const parts = trimmed.split(/[\t,;|]/);
      let name = parts[0]?.trim() || `جهة اتصال ${idx + 1}`;
      let phone = parts[1]?.trim() || "";

      if (!phone && parts.length === 1) {
        // extract digits
        const match = trimmed.match(/(\+?\d[\d\s-]{7,15})/);
        if (match) {
          phone = match[0].replace(/\s+/g, "");
          name = trimmed.replace(match[0], "").trim() || name;
        }
      }

      if (phone) {
        const matchCC = COUNTRY_CODES.find((c) => phone.startsWith(c.code)) || COUNTRY_CODES[0];
        newItems.push({
          id: `bulk-${Date.now()}-${idx}`,
          name: name,
          phone: phone,
          countryCode: matchCC.code,
          countryName: matchCC.name,
          flag: matchCC.flag,
          source: "excel_import",
          status: "unregistered"
        });
      }
    });

    if (newItems.length > 0) {
      const merged = [...newItems, ...syncedContacts];
      setSyncedContacts(merged);
      localStorage.setItem("law_synced_contacts", JSON.stringify(merged));
      setBulkTextInput("");
      setShowBulkImport(false);
      alert(`🎉 تم استيراد عدد (${newItems.length}) جهة اتصال برقم الهاتف بنجاح!`);
    } else {
      alert("يرجى إدخال أرقام هواتف صالحة مع الأسماء.");
    }
  };

  const filteredContacts = syncedContacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.countryName.includes(search);
    const matchesCountry = selectedCountryFilter === "all" || c.countryCode === selectedCountryFilter;
    return matchesSearch && matchesCountry;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto animate-fade-in font-sans"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-amber-500/30 flex justify-between items-center text-right">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500 rounded-xl flex items-center justify-center text-amber-500">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                مزامنة وسحب الأرقام الهاتفية للمستخدمين
                <span className="bg-amber-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                  Country Codes & Sync
                </span>
              </h3>
              <p className="text-[11px] text-amber-400 font-bold">
                تنسيق دولي + تسجيل فوري كموكل أو عميل جديد بضغطة زر
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-black bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition"
          >
            ×
          </button>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleDeviceSync}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition transform active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "جاري المزامنة..." : "مزامنة وسحب الأرقام الآن"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBulkImport(!showBulkImport)}
                className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>لصق واستيراد جهات اتصال إكسل</span>
              </button>
            </div>

            <span className="text-xs font-bold text-slate-500">
              إجمالي جهات الاتصال: <strong className="text-amber-600 dark:text-amber-400">{syncedContacts.length}</strong>
            </span>
          </div>

          {/* Bulk Import Drawer */}
          {showBulkImport && (
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                الصق قائمة الأسماء وأرقام الهواتف (كل سطر: الاسم [فاصلة أو مسافة] رقم الهاتف):
              </label>
              <textarea
                rows={3}
                value={bulkTextInput}
                onChange={(e) => setBulkTextInput(e.target.value)}
                placeholder="أحمد محمد	+201283233555&#10;خالد عبد الله	+966501234567"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-amber-500 font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkImport(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg shadow-sm"
                >
                  استيراد وحفظ في الدليل
                </button>
              </div>
            </div>
          )}

          {/* Search & Country Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم، رقم الهاتف، أو كود الدولة..."
                className="w-full pl-3 pr-9 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <select
                value={selectedCountryFilter}
                onChange={(e) => setSelectedCountryFilter(e.target.value)}
                className="w-full py-2 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 transition font-sans"
              >
                <option value="all">🌐 جميع الدول ({syncedContacts.length})</option>
                {COUNTRY_CODES.slice(0, 15).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contacts List Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-bold">
                لا توجد أرقام هواتف مسجلة تطابق بحثك. اضغط "مزامنة وسحب الأرقام الآن" لإعادة السحب.
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const cleanPhone = contact.phone.replace(/[^\d+]/g, "");
                const isRegisteredClient = clients.some(
                  (cl) => cl.name === contact.name || (cl.whatsapp && cl.whatsapp.includes(contact.phone))
                );

                return (
                  <div
                    key={contact.id}
                    className="py-3 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition"
                  >
                    {/* Left details */}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl select-none" title={contact.countryName}>
                        {contact.flag}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                            {contact.name}
                          </p>
                          {isRegisteredClient ? (
                            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] px-2 py-0.2 rounded-full font-bold">
                              ✓ موكل مسجل
                            </span>
                          ) : (
                            <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] px-2 py-0.2 rounded-full font-bold">
                              مستخدم جديد
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400 mt-0.5" dir="ltr">
                          {contact.phone}
                        </p>
                      </div>
                    </div>

                    {/* Actions: 1-Click Register as Client or Company */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <a
                        href={`https://wa.me/${cleanPhone.replace("+", "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-lg text-xs font-bold transition"
                        title="محادثة واتساب"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          onRegisterNewClient({
                            name: contact.name,
                            phone: contact.phone,
                            countryCode: contact.countryCode
                          });
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded-lg flex items-center gap-1 cursor-pointer shadow-sm transition"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>تسجيل كموكل جديد</span>
                      </button>

                      {onRegisterNewCompany && (
                        <button
                          type="button"
                          onClick={() => {
                            onRegisterNewCompany({
                              name: contact.name,
                              phone: contact.phone
                            });
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer transition"
                        >
                          <Building2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>تسجيل كشركة/عميل</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <p className="text-slate-500 text-[11px]">
            دليل الهواتف الدولي للمكتب الذكي • الأستاذ المحامي المحامي
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
