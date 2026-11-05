import React, { useState, useMemo } from "react";
import { ClientProfile, OpponentProfile, PlatformUser, CaseRecord, UserRole } from "../types";
import GoldenEagleEmblem from "./GoldenEagleEmblem";
import {
  Phone,
  UserPlus,
  Search,
  Printer,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Building,
  UserCheck,
  Trash2,
  Edit3,
  Filter,
  CheckCircle2,
  Users,
  Briefcase,
  ShieldAlert,
  ArrowRightLeft,
  Mail,
  MapPin,
  Calendar,
  X,
  Plus
} from "lucide-react";

export interface ContactEntry {
  id: string;
  name: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  category: "client" | "potential_client" | "opponent" | "bailiff" | "expert" | "court_clerk" | "lawyer_colleague" | "other";
  notes?: string;
  relatedCase?: string;
  nationalId?: string;
  isConvertedToClient?: boolean;
  createdAt: string;
}

interface ContactsViewProps {
  currentUser: PlatformUser;
  clients: ClientProfile[];
  opponents?: OpponentProfile[];
  cases?: CaseRecord[];
  onAddClient: (client: ClientProfile) => void;
  onNavigate?: (section: string, extra?: any) => void;
  language?: "ar" | "en";
}

const INITIAL_DIRECTORY_CONTACTS: ContactEntry[] = [
  {
    id: "cont-1",
    name: "الأستاذ / عبد الحميد الشاذلي",
    phone: "01001234567",
    category: "lawyer_colleague",
    address: "الزقازيق - مجمع المحاكم",
    notes: "زميل محامي بالاستئناف - دائرة التعويضات",
    createdAt: "2026-01-10"
  },
  {
    id: "cont-2",
    name: "رئيس قلم المحضرين - محكمة ههيا الجزئية",
    phone: "01223456789",
    category: "bailiff",
    address: "محكمة ههيا الجزئية",
    notes: "المتابعة المباشرة لتسليم إعلانات صحف الدعاوى",
    createdAt: "2026-02-15"
  },
  {
    id: "cont-3",
    name: "مكتب خبراء وزارة العدل بالشرقية",
    phone: "0552300000",
    category: "expert",
    address: "الزقازيق - شارع المحافظة",
    notes: "الخبير الحسابي والمهندسين الزراعيين",
    createdAt: "2026-03-01"
  },
  {
    id: "cont-4",
    name: "الحاج صبحي رضوان الدسوقي",
    phone: "01145678901",
    category: "potential_client",
    address: "ههيا - محافظة الشرقية",
    notes: "استشارة بشأن نزاع ميراث وقسمة تركة زراعية",
    createdAt: "2026-05-12"
  },
  {
    id: "cont-5",
    name: "سكرتير الدائرة الأولى جنايات الزقازيق",
    phone: "01098765432",
    category: "court_clerk",
    address: "محكمة جنايات الزقازيق",
    notes: "استلام وتفريغ منطوق الأحكام واستخراج الشهادات",
    createdAt: "2026-04-20"
  }
];

export default function ContactsView({
  currentUser,
  clients,
  opponents = [],
  cases = [],
  onAddClient,
  onNavigate,
  language = "ar"
}: ContactsViewProps) {
  // Local directory contacts state (saved in localStorage)
  const [customContacts, setCustomContacts] = useState<ContactEntry[]>(() => {
    try {
      const saved = localStorage.getItem("law_contacts_directory_v2");
      return saved ? JSON.parse(saved) : INITIAL_DIRECTORY_CONTACTS;
    } catch {
      return INITIAL_DIRECTORY_CONTACTS;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [convertedNotice, setConvertedNotice] = useState<string | null>(null);

  // New Contact Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSecondaryPhone, setNewSecondaryPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCategory, setNewCategory] = useState<ContactEntry["category"]>("potential_client");
  const [newNotes, setNewNotes] = useState("");
  const [newRelatedCase, setNewRelatedCase] = useState("");
  const [newNationalId, setNewNationalId] = useState("");

  const saveContacts = (updated: ContactEntry[]) => {
    setCustomContacts(updated);
    try {
      localStorage.setItem("law_contacts_directory_v2", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save contacts to localStorage", e);
    }
  };

  // Combine phone numbers from clients, opponents, and custom contacts into a unified directory
  const allDirectoryContacts = useMemo(() => {
    const list: ContactEntry[] = [...customContacts];

    // Automatically incorporate all clients as contacts
    clients.forEach((c) => {
      if (c.phone && !list.some((item) => item.phone === c.phone || item.id === `client-cont-${c.id}`)) {
        list.push({
          id: `client-cont-${c.id}`,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          category: "client",
          notes: `موكل رسمي مقيد - ${c.casesCount || 0} قضايا - الرقم القومي: ${c.nationalId || "غير مسجل"}`,
          nationalId: c.nationalId,
          isConvertedToClient: true,
          createdAt: c.createdAt || "2026-01-01"
        });
      }
    });

    // Automatically incorporate all opponents with phone numbers
    opponents.forEach((o) => {
      if (o.phone && !list.some((item) => item.phone === o.phone || item.id === `opp-cont-${o.id}`)) {
        list.push({
          id: `opp-cont-${o.id}`,
          name: o.name,
          phone: o.phone,
          address: o.address,
          category: "opponent",
          notes: `خصم معلن إليه بالدعاوى`,
          createdAt: "2026-01-01"
        });
      }
    });

    return list;
  }, [customContacts, clients, opponents]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return allDirectoryContacts.filter((c) => {
      const matchQuery =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery.trim()) ||
        (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = categoryFilter === "all" || c.category === categoryFilter;

      return matchQuery && matchCategory;
    });
  }, [allDirectoryContacts, searchQuery, categoryFilter]);

  // Copy phone number
  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Convert any Contact to a Client in Clients Section
  const handleConvertToClient = (contact: ContactEntry) => {
    // Check if already a client
    const existingClient = clients.find(
      (c) =>
        c.phone === contact.phone ||
        c.name.trim().toLowerCase() === contact.name.trim().toLowerCase() ||
        (contact.nationalId && c.nationalId === contact.nationalId)
    );

    if (existingClient) {
      setConvertedNotice(`⚠️ جهة الاتصال [${contact.name}] مسجلة بالفعل في قسم الموكلين!`);
      setTimeout(() => setConvertedNotice(null), 4000);
      if (onNavigate) {
        onNavigate("clients", { clientId: existingClient.id });
      }
      return;
    }

    const newClient: ClientProfile = {
      id: "cli-" + Date.now(),
      name: contact.name,
      phone: contact.phone,
      email: contact.email || "",
      address: contact.address || "العنوان قيد الاستيفاء",
      nationalId: contact.nationalId || "",
      type: "individual",
      status: "active",
      powerOfAttorneyNumber: "توكيل قيد الاستخراج",
      createdAt: new Date().toISOString(),
      notes: contact.notes ? `منقول من دليل جهات الاتصال: ${contact.notes}` : "تم تحويله من دليل جهات الاتصال إلى موكل رسمي بالديوان",
      casesCount: 0
    };

    onAddClient(newClient);

    // Mark as converted in customContacts
    const updatedCustom = customContacts.map((c) =>
      c.id === contact.id ? { ...c, category: "client" as const, isConvertedToClient: true } : c
    );
    saveContacts(updatedCustom);

    setConvertedNotice(`✅ تم نقل جهة الاتصال [${contact.name}] بنجاح إلى قسم الموكلين وفتح ملف توكيل جديد له!`);
    setTimeout(() => setConvertedNotice(null), 5000);

    // Prompt user to jump to clients section
    if (onNavigate) {
      setTimeout(() => {
        onNavigate("clients", { clientId: newClient.id });
      }, 1200);
    }
  };

  // Add new contact
  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert("يرجى إدخال اسم جهة الاتصال ورقم الهاتف");
      return;
    }

    const newEntry: ContactEntry = {
      id: "cont-" + Date.now(),
      name: newName.trim(),
      phone: newPhone.trim(),
      secondaryPhone: newSecondaryPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
      address: newAddress.trim() || undefined,
      category: newCategory,
      notes: newNotes.trim() || undefined,
      relatedCase: newRelatedCase.trim() || undefined,
      nationalId: newNationalId.trim() || undefined,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    const updated = [newEntry, ...customContacts];
    saveContacts(updated);

    // Reset Form
    setNewName("");
    setNewPhone("");
    setNewSecondaryPhone("");
    setNewEmail("");
    setNewAddress("");
    setNewCategory("potential_client");
    setNewNotes("");
    setNewRelatedCase("");
    setNewNationalId("");
    setShowAddModal(false);
  };

  // Delete contact
  const handleDeleteContact = (id: string) => {
    if (confirm("هل أنت متأكد من حذف جهة الاتصال هذه من الدليل؟")) {
      const updated = customContacts.filter((c) => c.id !== id);
      saveContacts(updated);
    }
  };

  // Print Directory
  const handlePrintDirectory = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const rowsHtml = filteredContacts
      .map(
        (c, idx) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">${c.name}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #b45309; direction: ltr; text-align: right;">${c.phone}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${getCategoryLabel(c.category)}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${c.address || "-"}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 10px; color: #475569;">${c.notes || "-"}</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>دليل جهات الاتصال وأرقام الهواتف - ديوان الأستاذ وسام الشناوي</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Traditional Arabic', Arial, sans-serif; direction: rtl; text-align: right; color: #0f172a; margin: 0; padding: 15px; }
            .header { border-bottom: 2px solid #b45309; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 18pt; font-weight: 900; color: #78350f; margin: 0; }
            .subtitle { font-size: 12pt; color: #475569; margin: 3px 0 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12pt; }
            th { background-color: #f8fafc; border: 1px solid #94a3b8; padding: 8px; color: #0f172a; font-weight: bold; }
            .footer { margin-top: 25px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 9pt; color: #64748b; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">مكتب الأستاذ / وسام حمدي الشناوي</h1>
              <p class="subtitle">المحامي بالنقض والدستورية العليا - دليل جهات الاتصال والأرقام الرسمية</p>
            </div>
            <div style="text-align: left; font-size: 10pt; color: #64748b;">
              تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG")}<br />
              إجمالي الأرقام: ${filteredContacts.length} جهة اتصال
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">م</th>
                <th>الاسم / الجهة</th>
                <th style="width: 140px;">رقم الهاتف</th>
                <th style="width: 110px;">الصفة / التصنيف</th>
                <th>العنوان / المقر</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            <span>ديوان المحاماة الرقمي - سجل سري ومحمي لجهات الاتصال</span>
            <span>صفحة 1 من 1</span>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const getCategoryLabel = (cat: ContactEntry["category"]) => {
    switch (cat) {
      case "client":
        return "موكل رسمي 👥";
      case "potential_client":
        return "موكل محتمل 👤";
      case "opponent":
        return "خصم معلن إليه ⚖️";
      case "bailiff":
        return "قلم المحضرين 📜";
      case "expert":
        return "خبير وزارة العدل 🔬";
      case "court_clerk":
        return "سكرتارية المحكمة 🏛️";
      case "lawyer_colleague":
        return "زميل محامي 💼";
      default:
        return "جهة عامة 🌐";
    }
  };

  const getCategoryBadgeClass = (cat: ContactEntry["category"]) => {
    switch (cat) {
      case "client":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      case "potential_client":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "opponent":
        return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
      case "bailiff":
        return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30";
      case "expert":
        return "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30";
      case "court_clerk":
        return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
      case "lawyer_colleague":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300";
    }
  };

  return (
    <div className="space-y-6 font-sans text-right animate-in fade-in duration-300" dir="rtl">
      
      {/* 1. TOP HEADER & DIRECTORY STATS */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap justify-between items-center gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/15 rounded-2xl text-amber-600 dark:text-amber-400">
            <Phone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                دليل جهات الاتصال وأرقام الهواتف الشامل
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {allDirectoryContacts.length} رقم مسجل
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تجميع كافة أرقام الموكلين، الخصوم، المحاكم، والمحضرين مع إمكانية تحويل أي جهة اتصال لموكل رسمي بنقرة واحدة
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Directory */}
          <button
            onClick={handlePrintDirectory}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            title="طباعة الدليل بالكامل A4"
          >
            <Printer className="w-4 h-4 text-amber-500" />
            <span>طباعة الدليل ({filteredContacts.length})</span>
          </button>

          {/* Add Contact */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة رقم / جهة اتصال جديدة (+)</span>
          </button>
        </div>
      </div>

      {/* Conversion Banner Alert */}
      {convertedNotice && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{convertedNotice}</span>
          </div>
          <button onClick={() => setConvertedNotice(null)} className="text-emerald-700 hover:text-white">✕</button>
        </div>
      )}

      {/* 2. SEARCH BAR & CATEGORY PILLS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، رقم الهاتف، العنوان، أو الملاحظات..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-black text-slate-400 ml-1">التصنيف:</span>
          {[
            { id: "all", label: `الكل (${allDirectoryContacts.length})` },
            { id: "client", label: `الموكلون (${allDirectoryContacts.filter((c) => c.category === "client").length})` },
            { id: "potential_client", label: `موكل محتمل (${allDirectoryContacts.filter((c) => c.category === "potential_client").length})` },
            { id: "opponent", label: `الخصوم (${allDirectoryContacts.filter((c) => c.category === "opponent").length})` },
            { id: "bailiff", label: "قلم المحضرين" },
            { id: "expert", label: "الخبراء" },
            { id: "court_clerk", label: "سكرتارية المحاكم" },
            { id: "lawyer_colleague", label: "الزملاء المحامون" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer text-xs ${
                categoryFilter === tab.id
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CONTACTS CARDS GRID */}
      {filteredContacts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Phone className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">لا توجد جهات اتصال تطابق بحثك</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            تأكد من كتابة الاسم أو الرقم بشكل صحيح أو قم بإضافة جهة اتصال جديدة بالضغط على زر الإضافة أعلاه.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => {
            const isClient = contact.category === "client";
            const whatsappUrl = `https://wa.me/2${contact.phone.replace(/^0/, "")}`;

            return (
              <div
                key={contact.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 group"
              >
                {/* Header: Name and Category */}
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                        {contact.name}
                      </h3>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-lg text-[10.5px] font-bold border ${getCategoryBadgeClass(
                          contact.category
                        )}`}
                      >
                        {getCategoryLabel(contact.category)}
                      </span>
                    </div>

                    {/* Action Menu (Delete if custom) */}
                    {!contact.id.startsWith("client-cont-") && !contact.id.startsWith("opp-cont-") && (
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition"
                        title="حذف من الدليل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Phone & Contact Details */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    {/* Primary Phone */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 dir-ltr text-xs">
                          {contact.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyPhone(contact.id, contact.phone)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 transition"
                          title="نسخ الرقم"
                        >
                          {copiedId === contact.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`tel:${contact.phone}`}
                          className="p-1 bg-amber-500 text-slate-950 rounded hover:bg-amber-600 transition"
                          title="اتصال هاتفي مباشر"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition"
                          title="محادثة واتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Secondary phone if any */}
                    {contact.secondaryPhone && (
                      <div className="flex items-center gap-2 text-slate-500 text-[11px] pr-1 font-mono">
                        <span>هاتف بديل:</span>
                        <span>{contact.secondaryPhone}</span>
                      </div>
                    )}

                    {/* Address */}
                    {contact.address && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{contact.address}</span>
                      </div>
                    )}

                    {/* Notes */}
                    {contact.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-950/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-2">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer: Convert to Client Button */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  {isClient ? (
                    <button
                      onClick={() => onNavigate && onNavigate("clients")}
                      className="w-full py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>ملف موكل مسجل بالديوان (عرض الملف 👥)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConvertToClient(contact)}
                      className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      title="نقل وتصعيد جهة الاتصال إلى موكل رسمي بالديوان"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>نقل إلى قسم الموكلين 👥</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. ADD NEW CONTACT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 text-right animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/15 rounded-xl text-amber-600 dark:text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">إضافة جهة اتصال / رقم جديد</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">حفظ الرقم بالدليل مع إمكانية تحويله لموكل لاحقاً</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  الاسم الكامل أو الصفة الرسمية *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: الحاج صبحي رضوان أو سكرتير الدائرة"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    رقم الهاتف الرئيسي *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    هاتف بديل (اختياري)
                  </label>
                  <input
                    type="tel"
                    value={newSecondaryPhone}
                    onChange={(e) => setNewSecondaryPhone(e.target.value)}
                    placeholder="012XXXXXXXX"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    التصنيف والصفة
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="potential_client">موكل محتمل (استشارة)</option>
                    <option value="client">موكل رسمي</option>
                    <option value="opponent">خصم معلن إليه</option>
                    <option value="bailiff">قلم المحضرين</option>
                    <option value="expert">خبير وزارة العدل</option>
                    <option value="court_clerk">سكرتارية المحكمة</option>
                    <option value="lawyer_colleague">زميل محامي</option>
                    <option value="other">جهة عامة أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    الرقم القومي (إن وجد)
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={newNationalId}
                    onChange={(e) => setNewNationalId(e.target.value)}
                    placeholder="14 رقم"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  العنوان أو جهة التواجد
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="مثال: ههيا - شارع الجمهورية أو مجمع محاكم الزقازيق"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ملاحظات أو النزاع المتعلق به
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="موضوع الاستشارة أو أي تفاصيل هامة..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md transition"
                >
                  حفظ جهة الاتصال بالدليل 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
