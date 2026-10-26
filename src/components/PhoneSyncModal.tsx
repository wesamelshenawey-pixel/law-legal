import React, { useState, useEffect, useMemo, useRef } from "react";
import { PlatformUser, ClientProfile, UserRole } from "../types";
import * as XLSX from "xlsx";
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
  Cloud,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  Trash2,
  Filter,
  Layers,
  Database
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
  source: "platform_user" | "device_sync" | "excel_import" | "client" | "bulk_paste";
  status: "is_client" | "is_user" | "unregistered";
  originalUser?: PlatformUser;
  email?: string;
  notes?: string;
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

const ITEMS_PER_PAGE = 50;

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
  const [selectedSourceFilter, setSelectedSourceFilter] = useState("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [bulkTextInput, setBulkTextInput] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync contacts from registered users + clients + device local cache
  const [syncedContacts, setSyncedContacts] = useState<ContactItem[]>(() => {
    const saved = localStorage.getItem("law_synced_contacts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
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
      const ph = cl.whatsapp || cl.phone || "";
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
            const merged = Array.from(map.values());
            try {
              localStorage.setItem("law_synced_contacts", JSON.stringify(merged.slice(0, 10000)));
            } catch (e) {
              console.warn("Storage quota limit reached for local storage:", e);
            }
            return merged;
          });
        }
      });
    }
  }, [isOpen]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCountryFilter, selectedSourceFilter]);

  const saveContactsSafely = (items: ContactItem[]) => {
    // Limit to max 10,000
    const bounded = items.slice(0, 10000);
    setSyncedContacts(bounded);
    try {
      localStorage.setItem("law_synced_contacts", JSON.stringify(bounded));
    } catch (e) {
      console.warn("LocalStorage full, keeping in memory and cloud:", e);
    }
    return bounded;
  };

  const handleDeviceSync = async () => {
    setIsSyncing(true);
    setStatusMessage("جارٍ مزامنة جهات الاتصال وحسابات المستخدمين مع السحابة...");
    
    // Pull fresh users and clients
    const map = new Map<string, ContactItem>();
    syncedContacts.forEach(c => map.set(c.phone, c));

    registeredUsers.forEach((u) => {
      if (!map.has(u.phone)) {
        const matchCC = COUNTRY_CODES.find((c) => u.phone.startsWith(c.code)) || COUNTRY_CODES[0];
        map.set(u.phone, {
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

    clients.forEach((cl) => {
      const ph = cl.whatsapp || cl.phone || "";
      if (ph && !map.has(ph)) {
        const matchCC = COUNTRY_CODES.find((c) => ph.startsWith(c.code)) || COUNTRY_CODES[0];
        map.set(ph, {
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

    const updatedList = Array.from(map.values()).slice(0, 10000);
    saveContactsSafely(updatedList);

    // Persist to Cloud Firestore in chunks
    try {
      const cloudDocs: SyncedContactDoc[] = updatedList.slice(0, 2000).map(c => ({
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
    } catch (e) {
      console.error("Firestore sync error:", e);
    }

    setIsSyncing(false);
    setStatusMessage(`🎉 تمت المزامنة السحابية بنجاح! إجمالي جهات الاتصال المعتمدة: ${updatedList.length}`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // High capacity bulk paste parsing (supports up to 10,000 contacts)
  const handleBulkImport = () => {
    if (!bulkTextInput.trim()) return;

    setIsProcessingFile(true);
    setProgressPercent(10);

    setTimeout(() => {
      const lines = bulkTextInput.split("\n");
      const newItems: ContactItem[] = [];
      const existingPhones = new Set(syncedContacts.map(c => c.phone.replace(/[^\d+]/g, "")));

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const parts = trimmed.split(/[\t,;|]/);
        let name = parts[0]?.trim() || `جهة اتصال ${idx + 1}`;
        let phone = parts[1]?.trim() || "";

        if (!phone && parts.length === 1) {
          // extract digits
          const match = trimmed.match(/(\+?\d[\d\s-]{7,16})/);
          if (match) {
            phone = match[0].replace(/\s+/g, "");
            name = trimmed.replace(match[0], "").trim() || name;
          }
        }

        if (phone) {
          const cleanPh = phone.replace(/[^\d+]/g, "");
          if (!existingPhones.has(cleanPh)) {
            existingPhones.add(cleanPh);
            const matchCC = COUNTRY_CODES.find((c) => cleanPh.startsWith(c.code)) || COUNTRY_CODES[0];
            newItems.push({
              id: `bulk-${Date.now()}-${idx}`,
              name: name.replace(/^["'\s]+|["'\s]+$/g, "") || `جهة اتصال ${idx + 1}`,
              phone: phone,
              countryCode: matchCC.code,
              countryName: matchCC.name,
              flag: matchCC.flag,
              source: "bulk_paste",
              status: "unregistered"
            });
          }
        }
      });

      setProgressPercent(80);

      if (newItems.length > 0) {
        const merged = [...newItems, ...syncedContacts].slice(0, 10000);
        saveContactsSafely(merged);
        setBulkTextInput("");
        setShowBulkImport(false);
        setProgressPercent(100);
        setStatusMessage(`🎉 تم استيراد وتصفية (${newItems.length}) جهة اتصال بنجاح! الإجمالي الآن: ${merged.length}`);
      } else {
        setStatusMessage("لم يتم العثور على أرقام هواتف جديدة غير مكررة.");
      }

      setTimeout(() => {
        setIsProcessingFile(false);
        setProgressPercent(null);
      }, 500);
    }, 50);
  };

  // Direct Excel / CSV File Upload Parser (Up to 10,000 records)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setProgressPercent(15);
    setStatusMessage("جارٍ قراءة وفحص ملف الإكسل...");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        setProgressPercent(40);
        setStatusMessage(`تمت قراءة ${json.length} صفاً من الإكسل، جارٍ استخراج أرقام الهواتف...`);

        setTimeout(() => {
          const newItems: ContactItem[] = [];
          const existingPhones = new Set(syncedContacts.map(c => c.phone.replace(/[^\d+]/g, "")));

          // Find header or best columns
          for (let i = 0; i < json.length && newItems.length + syncedContacts.length < 10000; i++) {
            const row = json[i];
            if (!Array.isArray(row) || row.length === 0) continue;

            let rowName = "";
            let rowPhone = "";
            let rowNotes = "";

            // Scan columns for phone and name
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
              const cellVal = String(row[colIdx] || "").trim();
              if (!cellVal) continue;

              // Check if cell resembles a phone number
              if (!rowPhone && /^(\+?\d[\d\s\-\(\)\.]{7,20})$/.test(cellVal)) {
                rowPhone = cellVal.replace(/[\s\-\(\)\.]/g, "");
              } else if (!rowName && cellVal.length >= 2 && !/^\d+$/.test(cellVal)) {
                rowName = cellVal;
              } else if (cellVal) {
                rowNotes += (rowNotes ? " - " : "") + cellVal;
              }
            }

            if (rowPhone) {
              const cleanPh = rowPhone.replace(/[^\d+]/g, "");
              if (!existingPhones.has(cleanPh)) {
                existingPhones.add(cleanPh);
                const matchCC = COUNTRY_CODES.find((c) => cleanPh.startsWith(c.code)) || COUNTRY_CODES[0];
                newItems.push({
                  id: `excel-${Date.now()}-${i}`,
                  name: rowName || `جهة اتصال إكسل #${i + 1}`,
                  phone: rowPhone,
                  countryCode: matchCC.code,
                  countryName: matchCC.name,
                  flag: matchCC.flag,
                  source: "excel_import",
                  status: "unregistered",
                  notes: rowNotes.substring(0, 100) || undefined
                });
              }
            }
          }

          setProgressPercent(90);

          if (newItems.length > 0) {
            const merged = [...newItems, ...syncedContacts].slice(0, 10000);
            saveContactsSafely(merged);
            setShowExcelUpload(false);
            setStatusMessage(`🎉 تم استيراد عدد (${newItems.length}) جهة اتصال من ملف الإكسل بنجاح! الإجمالي الآن: ${merged.length}`);
          } else {
            setStatusMessage("لم يتم العثور على أرقام هواتف صالحة أو أنها مكررة مسبقاً.");
          }

          setIsProcessingFile(false);
          setProgressPercent(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }, 100);

      } catch (err) {
        console.error("Excel import error:", err);
        setIsProcessingFile(false);
        setProgressPercent(null);
        setStatusMessage("حدث خطأ أثناء قراءة ملف الإكسل. يرجى التأكد من صيغة الملف (.xlsx / .csv).");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Generator: Add synthetic sample batch up to 10,000 contacts for testing & volume handling
  const handleGenerateSampleDataset = (count: number) => {
    setIsProcessingFile(true);
    setProgressPercent(20);
    setStatusMessage(`جارٍ توليد وتجهيز حزمة من ${count} جهة اتصال للتجربة والتحقق...`);

    setTimeout(() => {
      const sampleFirstNames = ["أحمد", "محمد", "محمود", "إبراهيم", "طارق", "سامح", "خالد", "ياسر", "هشام", "كريم", "منى", "فاطمة", "سارة", "رانيا", "نورهان", "وسام", "عمر", "مصطفى", "عمرو", "مريم"];
      const sampleLastNames = ["الشناوي", "عبد العزيز", "حسين", "المنشاوي", "الأنصاري", "الشريف", "العدوي", "فهمي", "صلاح", "الباز", "سليمان", "زهران", "عثمان", "غنيم", "مختار"];
      const newItems: ContactItem[] = [];
      const existingPhones = new Set(syncedContacts.map(c => c.phone));

      const limit = Math.min(count, 10000 - syncedContacts.length);

      for (let i = 0; i < limit; i++) {
        const fn = sampleFirstNames[Math.floor(Math.random() * sampleFirstNames.length)];
        const ln = sampleLastNames[Math.floor(Math.random() * sampleLastNames.length)];
        const suffix = Math.floor(1000 + Math.random() * 9000);
        const prefix = ["010", "011", "012", "015", "050", "055", "056"][Math.floor(Math.random() * 7)];
        const phone = `+20${prefix.replace("0", "")}${Math.floor(1000000 + Math.random() * 9000000)}`;

        if (!existingPhones.has(phone)) {
          existingPhones.add(phone);
          const matchCC = COUNTRY_CODES.find(c => phone.startsWith(c.code)) || COUNTRY_CODES[0];
          newItems.push({
            id: `gen-${Date.now()}-${i}`,
            name: `${fn} ${ln} (#${suffix})`,
            phone: phone,
            countryCode: matchCC.code,
            countryName: matchCC.name,
            flag: matchCC.flag,
            source: "bulk_paste",
            status: "unregistered"
          });
        }
      }

      setProgressPercent(85);
      const merged = [...newItems, ...syncedContacts].slice(0, 10000);
      saveContactsSafely(merged);
      setIsProcessingFile(false);
      setProgressPercent(null);
      setStatusMessage(`🎉 تم بنجاح إنشاء وإضافة (${newItems.length}) جهة اتصال! إجمالي الدليل الآن: ${merged.length} / 10,000`);
    }, 150);
  };

  // Export current list to Excel (.xlsx)
  const handleExportContactsToExcel = () => {
    const exportData = syncedContacts.map((c, idx) => ({
      "م": idx + 1,
      "الاسم بالكامل": c.name,
      "رقم الهاتف": c.phone,
      "كود الدولة": c.countryCode,
      "الدولة": c.countryName,
      "المصدر": c.source === "client" ? "سجل الموكلين" : c.source === "platform_user" ? "مستخدم بالمنظومة" : c.source === "excel_import" ? "استيراد إكسل" : "لصق ومزامنة",
      "الحالة": c.status === "is_client" ? "موكل معتمد" : c.status === "is_user" ? "عضو مسجل" : "غير مسجل كموكل"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "جهات_الاتصال");
    XLSX.writeFile(workbook, `دليل_جهات_الاتصال_${syncedContacts.length}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filtered contacts memoization
  const filteredContacts = useMemo(() => {
    return syncedContacts.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(search) ||
        c.countryName.includes(search) ||
        (c.notes && c.notes.toLowerCase().includes(q));
      
      const matchesCountry = selectedCountryFilter === "all" || c.countryCode === selectedCountryFilter;
      const matchesSource = selectedSourceFilter === "all" || c.source === selectedSourceFilter;

      return matchesSearch && matchesCountry && matchesSource;
    });
  }, [syncedContacts, search, selectedCountryFilter, selectedSourceFilter]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / ITEMS_PER_PAGE));
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContacts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredContacts, currentPage]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto animate-fade-in font-sans"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-amber-500/30 flex justify-between items-center text-right">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-500/20 border border-amber-500 rounded-2xl flex items-center justify-center text-amber-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                منظومة مزامنة واستيراد جهات الاتصال الضخمة
                <span className="bg-amber-500 text-slate-950 text-[10px] px-2.5 py-0.5 rounded-full font-black">
                  حتى 10,000 جهة اتصال 🚀
                </span>
              </h3>
              <p className="text-[11px] text-amber-400/90 font-medium mt-0.5">
                استيراد من جداول Excel • نسخ ولصق مباشر • مزامنة الحسابات والسحابة • تسجيل فوري كموكلين
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

        {/* Action Controls & Top Banner */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-3">
          
          {/* Progress Bar & Feedback Toast */}
          {progressPercent !== null && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl space-y-1.5 animate-in fade-in">
              <div className="flex justify-between text-xs font-bold text-amber-900 dark:text-amber-300">
                <span>{statusMessage || "جارٍ معالجة البيانات..."}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-amber-200 dark:bg-amber-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {statusMessage && progressPercent === null && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isSyncing || isProcessingFile}
                onClick={handleDeviceSync}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition transform active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "جارٍ المزامنة السحابية..." : "مزامنة سحابية وسحب الحسابات"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExcelUpload(!showExcelUpload);
                  setShowBulkImport(false);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>استيراد ملف Excel (.xlsx/.csv)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowBulkImport(!showBulkImport);
                  setShowExcelUpload(false);
                }}
                className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                <Layers className="w-4 h-4 text-amber-500" />
                <span>لصق جماعي (Paste 10k)</span>
              </button>

              <button
                type="button"
                onClick={handleExportContactsToExcel}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition border border-slate-200 dark:border-slate-700"
                title="تصدير كافة جهات الاتصال إلى ملف إكسل منسق"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير Excel</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerateSampleDataset(1000)}
                disabled={isProcessingFile || syncedContacts.length >= 10000}
                className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold text-[11px] rounded-xl flex items-center gap-1 cursor-pointer hover:bg-amber-100 transition disabled:opacity-50"
                title="توليد 1,000 جهة اتصال تجريبية لاختبار الطاقة الاستيعابية الفائقة"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>+1,000 تجريبي</span>
              </button>
            </div>

            {/* Capacity Meter */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <Database className="w-4 h-4 text-amber-500" />
              <span className="text-slate-500 text-[11px]">السعة:</span>
              <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm">
                {syncedContacts.length.toLocaleString("ar-EG")} / 10,000
              </strong>
            </div>
          </div>

          {/* Excel File Upload Area */}
          {showExcelUpload && (
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>رفع وتفريغ ملف Excel لجهات الاتصال (يدعم حتى 10,000 صف):</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">صيغ مدعومة: .xlsx, .xls, .csv</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800"
              />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                يقوم النظام الذكي تلقائياً بقراءة وتحديد أعمدة الأسماء وأرقام الهواتف وتنقيتها من التكرارات وإسناد مفاتيح الدول المناسبة.
              </p>
            </div>
          )}

          {/* Bulk Paste Drawer */}
          {showBulkImport && (
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  الصق قائمة الأسماء وأرقام الهواتف (كل سطر: الاسم [فاصلة أو مسافة أو Tab] رقم الهاتف):
                </label>
                <span className="text-[10px] text-slate-400">يدعم حتى 10,000 سطر دفعة واحدة</span>
              </div>
              <textarea
                rows={4}
                value={bulkTextInput}
                onChange={(e) => setBulkTextInput(e.target.value)}
                placeholder="أحمد محمد الشناوي	+201283233555&#10;خالد عبد الله المنشاوي	+966501234567&#10;مروان سامح فهمي, 01099887766"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-amber-500 font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkImport(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isProcessingFile || !bulkTextInput.trim()}
                  onClick={handleBulkImport}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  تحليل واستيراد الدفعة
                </button>
              </div>
            </div>
          )}

          {/* Search, Country Filter & Source Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم، رقم الهاتف، كود الدولة، أو الملاحظات..."
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
                {COUNTRY_CODES.slice(0, 20).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedSourceFilter}
                onChange={(e) => setSelectedSourceFilter(e.target.value)}
                className="w-full py-2 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 transition font-sans"
              >
                <option value="all">📂 كافة المصادر</option>
                <option value="client">سجل الموكلين</option>
                <option value="platform_user">مستخدمو المنظومة</option>
                <option value="excel_import">استيراد Excel</option>
                <option value="bulk_paste">لصق جماعي</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contacts List Table with High-Performance Pagination */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold space-y-2">
                <Smartphone className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <p>لا توجد جهات اتصال تطابق بحثك حالياً.</p>
                <p className="text-[11px] text-slate-500">
                  يمكنك استيراد ملف Excel أو لصق أرقام أو الضغط على "مزامنة سحابية" لإعادة الجلب.
                </p>
              </div>
            ) : (
              paginatedContacts.map((contact, rowIdx) => {
                const cleanPhone = contact.phone.replace(/[^\d+]/g, "");
                const isRegisteredClient = clients.some(
                  (cl) => cl.name === contact.name || (cl.whatsapp && cl.whatsapp.includes(contact.phone))
                );

                const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + rowIdx + 1;

                return (
                  <div
                    key={contact.id}
                    className="py-3 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition"
                  >
                    {/* Left details */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-400 w-7 text-center">
                        #{globalIndex}
                      </span>
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
                              محتمل / جديد
                            </span>
                          )}
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] px-2 py-0.2 rounded-md">
                            {contact.source === "excel_import" ? "Excel" : contact.source === "client" ? "موكل" : contact.source === "platform_user" ? "حساب" : "لصق"}
                          </span>
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
                        title="محادثة واتساب مباشرة"
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

        {/* Footer & Pagination Navigation */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">
              عرض السجلات {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredContacts.length)} إلى {Math.min(currentPage * ITEMS_PER_PAGE, filteredContacts.length)} من إجمالي <strong>{filteredContacts.length}</strong>
            </span>
          </div>

          {/* Pagination buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                صفحة {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="الصفحة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
