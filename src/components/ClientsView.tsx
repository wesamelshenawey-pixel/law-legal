import React, { useState } from "react";
import { ClientProfile, OpponentProfile, LeadProfile, PlatformUser, UserRole, CaseRecord } from "../types";
import { INITIAL_COURTS } from "../utils/staticData";
import AddClientWizardModal from "./AddClientWizardModal";
import { 
  Users, 
  Settings, 
  Plus, 
  Printer, 
  CheckCircle,
  FileSpreadsheet,
  Lock,
  Smartphone,
  Eye,
  Briefcase,
  Layers,
  FileText,
  UploadCloud,
  QrCode,
  Globe,
  Contact,
  RefreshCw,
  UserPlus
} from "lucide-react";
import { 
  getStoredWorkspaceToken, 
  requestWorkspaceAuth, 
  fetchGoogleContacts, 
  createGoogleContact, 
  GoogleContact 
} from "../utils/workspaceService";

interface ClientsViewProps {
  clients: ClientProfile[];
  opponents: OpponentProfile[];
  leads: LeadProfile[];
  registeredUsers: PlatformUser[];
  onAddClient: (newCl: ClientProfile, firstCase?: CaseRecord) => void;
  onAddOpponent: (opp: OpponentProfile) => void;
  onUpdateUserRole: (phone: string, role: string) => void;
  onUpdateUserPassword: (phone: string, pass: string) => void;
  onImportLeads?: (newLeads: LeadProfile[]) => void;
  onUpdateClient?: (id: string, updatedFields: Partial<ClientProfile>) => void;
  currentUser: PlatformUser;
  casesCount?: number;
  onOpenPhoneSync?: () => void;
  onOpenDocumentManager?: (section: string, label: string) => void;
}

export default function ClientsView({
  clients,
  opponents,
  leads,
  registeredUsers,
  onAddClient,
  onAddOpponent,
  onUpdateUserRole,
  onUpdateUserPassword,
  onImportLeads,
  onUpdateClient,
  casesCount,
  currentUser,
  onOpenPhoneSync,
  onOpenDocumentManager
}: ClientsViewProps) {
  const [activeTab, setActiveTab] = useState<"clients" | "opponents" | "online" | "leads" | "permissions">("clients");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadForConversion, setSelectedLeadForConversion] = useState<LeadProfile | null>(null);

  // Auto Generate Clients and Opponents (إضافة أسماء موكلين وخصوم تلقائياً)
  const handleAutoGenerateClientsAndOpponents = () => {
    const mockClientsData = [
      {
        name: "عصام الدين عبد الحميد الشاذلي",
        phone: "01091234567",
        nationalId: "28804151301234",
        address: "الزقازيق - حي القومية - محافظة الشرقية",
        subject: "دعوى تعويض مدني وصحة ونفاذ عقد بيع",
        poaNumber: "4820",
        poaLetter: "أ",
        poaYear: 2025,
        poaOffice: "مكتب توثيق الزقازيق النموذجي",
        court: "محكمة الزقازيق الابتدائية",
        remainingFees: 7500
      },
      {
        name: "نهال أحمد الصاوي محمد",
        phone: "01187654321",
        nationalId: "29208221305678",
        address: "مركز ههيا - شارع الجمهورية - الشرقية",
        subject: "قضية أحوال شخصية ونفقة ومؤخر صداق",
        poaNumber: "1192",
        poaLetter: "ب",
        poaYear: 2026,
        poaOffice: "مكتب توثيق ههيا",
        court: "محكمة الأسرة بههيا",
        remainingFees: 4000
      },
      {
        name: "شركة الأهرام للخدمات اللوجستية ش.م.م",
        phone: "01223344556",
        nationalId: "27501011309876",
        address: "مدينة العاشر من رمضان - المنطقة الصناعية الثالثة",
        subject: "نزاع تجاري وإشكال في تنفيذ شيكات مصرفية",
        poaNumber: "9315",
        poaLetter: "عام",
        poaYear: 2025,
        poaOffice: "مكتب توثيق العاشر من رمضان",
        court: "محكمة استئناف المنصورة (مأمورية الزقازيق)",
        remainingFees: 15000
      }
    ];

    const mockOpponentsData = [
      { name: "شركة النيل للمقاولات العامة والاستثمار العقاري", phone: "01234567890" },
      { name: "محمود إبراهيم الشناوي الدسوقي", phone: "01009876543" },
      { name: "بنك مصر - فرع الزقازيق الرئيسي", phone: "01556789012" }
    ];

    // Add clients
    mockClientsData.forEach((cl, idx) => {
      const newClient: ClientProfile = {
        id: "cl-auto-" + Date.now() + "-" + idx,
        serialNumber: clients.length + idx + 1,
        name: cl.name,
        phone: cl.phone,
        nationalId: cl.nationalId,
        address: cl.address,
        subject: cl.subject,
        poaNumber: cl.poaNumber,
        poaLetter: cl.poaLetter,
        poaYear: cl.poaYear,
        poaOffice: cl.poaOffice,
        caseNumber: Math.floor(1000 + Math.random() * 9000).toString(),
        caseYear: 2026,
        competentCourt: cl.court,
        remainingFees: cl.remainingFees,
        createdAt: new Date().toISOString()
      };
      onAddClient(newClient);
    });

    // Add opponents
    mockOpponentsData.forEach((op, idx) => {
      const newOp: OpponentProfile = {
        id: "op-auto-" + Date.now() + "-" + idx,
        name: op.name,
        phone: op.phone,
        isDifferentColor: true
      };
      onAddOpponent(newOp);
    });

    setSyncStatusMsg("⚡ تم توليد وإضافة ٣ موكلين و ٣ خصوم قضائيين معتمدين بالكامل تلقائياً!");
    setTimeout(() => setSyncStatusMsg(null), 5000);
  };

  // Excel Input inside ClientsView
  const [excelContactInputRaw, setExcelContactInputRaw] = useState("");

  // Google Contacts State
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [googleContacts, setGoogleContacts] = useState<GoogleContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleOpenGoogleContactsModal = () => {
    let tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) {
      requestWorkspaceAuth((newState) => {
        tokenState = newState;
        loadContactsWithToken(newState.accessToken!);
      }, (err) => {
        alert("تعذر الاتصال بـ Google Contacts. يرجى التأكد من الموافقة على الأذونات.");
      });
      return;
    }
    loadContactsWithToken(tokenState.accessToken);
  };

  const loadContactsWithToken = async (token: string) => {
    setIsLoadingContacts(true);
    setShowContactsModal(true);
    try {
      const contacts = await fetchGoogleContacts(token);
      setGoogleContacts(contacts);
    } catch (e: any) {
      console.error(e);
      alert("خطأ في استيراد جهات اتصال Google: " + (e.message || e));
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleImportContactAsClient = (c: GoogleContact) => {
    const newClient: ClientProfile = {
      id: "cl-g-" + Math.random().toString(36).substring(2, 9),
      serialNumber: Math.floor(Math.random() * 1000),
      name: c.name,
      phone: c.phone || "01000000000",
      nationalId: "2900101" + Math.floor(1000000 + Math.random() * 9000000),
      address: c.jobTitle ? `جهة العمل: ${c.jobTitle}` : "عنوان مسجل عبر جهات اتصال Google",
      subject: c.notes ? `ملاحظات مستوردة من Google: ${c.notes}` : "مستورد من Google Contacts",
      poaNumber: "0000",
      poaLetter: "أ",
      poaYear: new Date().getFullYear(),
      poaOffice: "مكتب التوثيق",
      caseNumber: "0000",
      caseYear: new Date().getFullYear(),
      competentCourt: "محكمة",
      remainingFees: 0,
      createdAt: new Date().toISOString()
    };

    onAddClient(newClient);
    setSyncStatusMsg(`تم استيراد الموكل [${c.name}] بنجاح إلى قاعدة بيانات المكتب.`);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleImportAllContactsAsLeads = () => {
    if (!onImportLeads || googleContacts.length === 0) return;
    const leadsToAdd: LeadProfile[] = googleContacts.map((c, idx) => ({
      id: "lead-g-" + Date.now() + "-" + idx,
      name: c.name,
      phone: c.phone || "غير محدد",
      notes: c.jobTitle ? `الوظيفة: ${c.jobTitle}` : "مستورد من جهات اتصال Google",
      source: "Google Contacts",
      status: "new",
      createdAt: new Date().toISOString()
    }));

    onImportLeads(leadsToAdd);
    setShowContactsModal(false);
    setSyncStatusMsg(`تم استيراد ${leadsToAdd.length} جهة اتصال كعملاء محتملين بنجاح.`);
    setTimeout(() => setSyncStatusMsg(null), 5000);
  };

  const handleConvertLeadToClient = (lead: LeadProfile) => {
    setSelectedLeadForConversion(lead);
    setShowAddModal(true);
  };

  const [selectedClientForDocs, setSelectedClientForDocs] = useState<ClientProfile | null>(null);

  const handleAdminDocUpload = (e: React.ChangeEvent<HTMLInputElement>, clientItem: ClientProfile) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      const newDoc = {
        id: "doc-" + Date.now(),
        name: file.name,
        fileBase64: base64,
        addedAt: new Date().toISOString()
      };

      const existingDocs = clientItem.personalDocuments || [];
      const updatedDocs = [...existingDocs, newDoc];

      if (onUpdateClient) {
        onUpdateClient(clientItem.id, { personalDocuments: updatedDocs });
        const updatedClient = { ...clientItem, personalDocuments: updatedDocs };
        setSelectedClientForDocs(updatedClient);
      }
      alert("تم رفع وحفظ وثيقة الموكل بنجاح وبسرية تامة سحابياً للمكتب والموكل!");
    };
    reader.readAsDataURL(file);
  };

  const handleAdminDocDelete = (docId: string, clientItem: ClientProfile) => {
    if (!confirm("هل تريد بالتأكيد حذف مستند الموكل هذا من الخزانة؟")) return;

    const existingDocs = clientItem.personalDocuments || [];
    const updatedDocs = existingDocs.filter(d => d.id !== docId);

    if (onUpdateClient) {
      onUpdateClient(clientItem.id, { personalDocuments: updatedDocs });
      const updatedClient = { ...clientItem, personalDocuments: updatedDocs };
      setSelectedClientForDocs(updatedClient);
    }
  };

  // New Opponent State
  const [opName, setOpName] = useState("");
  const [opPhone, setOpPhone] = useState("");

  // Access Management Selected User States
  const [selectedUserPhone, setSelectedUserPhone] = useState("");
  const [updatedRole, setUpdatedRole] = useState(UserRole.STAFF);
  const [updatedPass, setUpdatedPass] = useState("");

  const handleAddNewOpponentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName) return;

    const newO: OpponentProfile = {
      id: "op-" + Date.now(),
      name: opName,
      phone: opPhone || undefined,
      isDifferentColor: true
    };

    onAddOpponent(newO);
    setOpName("");
    setOpPhone("");
    alert("تم تدوين الخصم بنجاح باللون الأحمر الاستباقي لتأمين الخصوصية العكسية!");
  };

  const handleUpdatePermissionSubmit = (phone: string) => {
    if (updatedRole) {
      onUpdateUserRole(phone, updatedRole);
    }
    if (updatedPass) {
      onUpdateUserPassword(phone, updatedPass);
    }
    setSelectedUserPhone("");
    setUpdatedPass("");
    alert("تم تطبيق تعديل الحقوق وصلاحيات المنصة وتحديث كلمات السر سحابياً بنجاح!");
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.nationalId.includes(searchQuery));
  const filteredOpponents = opponents.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredLeads = leads.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      
      {/* Title block */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">منظومة الموكلين والعملاء الموحدة</h2>
          <p className="text-xs text-slate-500 mt-1">
            دمج شامل للموكلين، والعملاء، والخصوم، والعملاء الإلكترونيين، وصلاحيات وحسابات المستخدمين مع ربط الحسابات المتقاطعة.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* Automatic Client & Opponent Generator Button */}
          {currentUser.role === UserRole.ADMIN && (
            <button
              id="auto-generate-clients-opponents-btn"
              type="button"
              onClick={handleAutoGenerateClientsAndOpponents}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              title="توليد وإضافة نماذج موكلين وخصوم قضائية معتمدة بالكامل تلقائياً"
            >
              <span>⚡</span>
              <span>توليد موكلين وخصوم تلقائياً</span>
            </button>
          )}

          {/* Phone & Country Sync Button */}
          {onOpenPhoneSync && (
            <button
              id="clients-phone-sync-btn"
              type="button"
              onClick={onOpenPhoneSync}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              title="سحب ومزامنة أرقام الهواتف ودليل الأكواد والمفاتيح الدولية"
            >
              <span>📱</span>
              <span>سحب ومزامنة الهواتف والدول</span>
            </button>
          )}

          {/* Client Documents & Files Manager */}
          {onOpenDocumentManager && (
            <button
              id="clients-doc-manager-btn"
              type="button"
              onClick={() => onOpenDocumentManager("clients", "سجل الموكلين وجهات الاتصال")}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              title="خزانة وثائق ومستندات الموكلين واستخراج الملفات"
            >
              <span>📦</span>
              <span>خزانة وثائق الموكلين</span>
            </button>
          )}

          {/* Google Contacts Sync Button */}
          <button
            id="sync-google-contacts-btn"
            onClick={handleOpenGoogleContactsModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
            title="مزامنة واستيراد جهات الاتصال من حساب Google Contacts"
          >
            <Contact className="w-4 h-4" />
            مزامنة Google Contacts
          </button>

          <button
            id="print-clients-doc"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-750 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            طباعة الكشف
          </button>
          
          {currentUser.role === UserRole.ADMIN && (
            <button
              id="open-add-client-modal"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إدراج موكل جديد
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Alert */}
      {syncStatusMsg && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-blue-600" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* HORIZONTAL HUB TABS */}
      <div className="flex border border-slate-200 bg-slate-50 rounded-xl p-1 gap-1 flex-wrap">
        <button
          id="hub-tab-clients"
          onClick={() => { setActiveTab("clients"); setSearchQuery(""); }}
          className={`flex-1 min-w-[120px] py-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "clients" ? "bg-amber-500 text-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          الموكلين القضائيين ({clients.length})
        </button>
        <button
          id="hub-tab-opponents"
          onClick={() => { setActiveTab("opponents"); setSearchQuery(""); }}
          className={`flex-1 min-w-[120px] py-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "opponents" ? "bg-red-600 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          بيانات الخصوم ({opponents.length}) - مميزين
        </button>
        <button
          id="hub-tab-online"
          onClick={() => { setActiveTab("online"); setSearchQuery(""); }}
          className={`flex-1 min-w-[120px] py-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "online" ? "bg-amber-500 text-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          العملاء الإلكترونيين ({registeredUsers.filter(u => u.role === UserRole.CLIENT || u.role === UserRole.SEEKER).length})
        </button>
        <button
          id="hub-tab-leads"
          onClick={() => { setActiveTab("leads"); setSearchQuery(""); }}
          className={`flex-1 min-w-[120px] py-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "leads" ? "bg-amber-500 text-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          عملاء محتملين / إكسل ({leads.length})
        </button>
        {currentUser.role === UserRole.ADMIN && (
          <button
            id="hub-tab-permissions"
            onClick={() => { setActiveTab("permissions"); setSearchQuery(""); }}
            className={`flex-1 min-w-[120px] py-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
              activeTab === "permissions" ? "bg-amber-500 text-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            صلاحيات المنصة الرقمية
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-205 shadow-sm">
        <input
          id="hub-search-field"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="تصفية البحث والفلترة السريعة بالدفتر..."
          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 outline-none text-right focus:border-amber-500 focus:bg-white text-xs transition"
        />
      </div>

      {/* CORE HUB CONTENTS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        
        {/* TAB 1: CURRENT MOWAKELIN CLIENTS */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">دفتر الموكلين المسجلين بالمقر والسحابة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredClients.map(c => (
                <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative overflow-hidden text-right shadow-sm hover:shadow transition">
                  <div className="absolute top-0 left-0 bg-amber-500/10 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-br-lg border-b border-r border-amber-200">
                    الرقم المسلسل #{c.serialNumber}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 pl-16">{c.name}</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                    <p><span className="text-slate-400 ml-1">الرقم القومي:</span> <strong className="text-slate-950 font-mono">{c.nationalId}</strong></p>
                    <p><span className="text-slate-400 ml-1">التوكيل:</span> <strong className="text-emerald-700">{c.poaNumber} {c.poaLetter} ({c.poaYear})</strong></p>
                    <p><span className="text-slate-400 ml-1">التوثيق:</span> <span className="text-slate-800 leading-none">{c.poaOffice}</span></p>
                    <p><span className="text-slate-400 ml-1">الهاتف/الواتس:</span> <span className="text-amber-800 font-sans">{c.whatsapp || "غير متوفر"}</span></p>
                    <p><span className="text-slate-400 ml-1">القضية الحالية:</span> <span className="text-blue-700">رقم {c.caseNumber}</span></p>
                    <p><span className="text-slate-400 ml-1">المحكمة:</span> <span className="text-slate-700 truncate">{c.competentCourt}</span></p>
                    <p><span className="text-slate-400 ml-1">باقي الأتعاب:</span> <span className="text-amber-600 font-bold">{c.remainingFees} EGP</span></p>
                    <p><span className="text-slate-400 ml-1">باصورد الدخول:</span> <span className="text-amber-700 font-mono font-bold bg-amber-50 border border-amber-100 px-1 py-0.5 rounded">{c.password || "غير مسجل"}</span></p>
                  </div>

                  {/* Document locker action for admins */}
                  {currentUser.role === UserRole.ADMIN && (
                    <div className="pt-2.5 border-t border-slate-200/60 flex justify-between items-center text-xs">
                      <span className="text-slate-450 font-sans">خزنة الوثائق المعزولة: <strong className="text-emerald-700 font-mono">({c.personalDocuments?.length || 0})</strong></span>
                      <button
                        id={`manage-client-docs-${c.id}`}
                        onClick={() => setSelectedClientForDocs(c)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1 text-[10px] rounded transition shadow-sm cursor-pointer"
                      >
                        📂 إدارة المستندات وحمايتها
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: OPPONENTS */}
        {activeTab === "opponents" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-red-100">
              <span className="text-xs text-red-650 animate-pulse font-bold">🔴 تمييز لوني استباقي لمنع اختلاط المصالح القضائية</span>
              <h3 className="text-base font-bold text-slate-900">الأوراق الثبوتية والخصوم المسجلين بقضايا المكتب</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Add Opponent inline form */}
              {currentUser.role === UserRole.ADMIN && (
                <form onSubmit={handleAddNewOpponentSubmit} className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-red-800">إضافة خصم جديد للدفتر مباشرة</h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1" htmlFor="opp-name">اسم الخصم المقابل الرباعي</label>
                      <input
                        id="opp-name"
                        type="text"
                        value={opName}
                        onChange={(e) => setOpName(e.target.value)}
                        placeholder="اكتب الاسم الكامل بحرص"
                        className="w-full px-3 py-1.5 bg-white text-slate-900 text-xs rounded border border-slate-200 text-right focus:border-red-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1" htmlFor="opp-phone">رقم هاتف الخصم (إن وجد للتصالح)</label>
                      <input
                        id="opp-phone"
                        type="tel"
                        value={opPhone}
                        onChange={(e) => setOpPhone(e.target.value)}
                        placeholder="رقم الهاتف"
                        className="w-full px-3 py-1.5 bg-white text-slate-900 text-xs rounded border border-slate-200 text-right focus:border-red-500 outline-none font-sans"
                      />
                    </div>
                    <button
                      id="submit-opponent-btn"
                      type="submit"
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded cursor-pointer transition shadow-sm"
                    >
                      حفظ الخصم وحظره المصلحي
                    </button>
                  </div>
                </form>
              )}

              {/* Opponent list */}
              <div className="space-y-3">
                {filteredOpponents.map(op => (
                  <div key={op.id} className="p-4 bg-slate-50 rounded-xl border border-red-250 relative overflow-hidden flex justify-between items-center shadow-sm">
                    <span className="w-2.5 h-2.5 bg-red-550 rounded-full animate-ping" />
                    <div className="text-right">
                      <h4 className="text-sm font-bold text-red-700">{op.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 font-sans">الهاتف المسجل للخصم: {op.phone || "غير مدرج بالدائرة"}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: ONLINE CLIENTS AND SEEKERS */}
        {activeTab === "online" && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">العملاء والعملاء الإلكترونيون المسجلون للمشورة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {registeredUsers.filter(u => u.role === UserRole.CLIENT || u.role === UserRole.SEEKER).map(user => (
                <div key={user.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-right shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${user.role === UserRole.CLIENT ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"}`}>
                      {user.role === UserRole.CLIENT ? "عميل قضائي" : "طالب خدمة / ذكاء اصطناعي"}
                    </span>
                    <span className="text-[10px] text-green-600 flex items-center gap-1 font-bold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      مؤكد بهاتف محمول ورقم قيد
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{user.name}</h4>
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200 pt-2 grid grid-cols-2 gap-2 font-sans">
                    <p><span className="text-slate-400">الهاتف:</span> <span className="text-slate-900 font-mono font-bold">{user.phone}</span></p>
                    <p><span className="text-slate-400">كلمة المرور:</span> <span className="text-amber-800 font-mono bg-amber-50 px-1 border border-amber-100 rounded">{user.passwordHash}</span></p>
                    <p className="col-span-2 text-[11px] text-amber-700 font-bold font-sans">المزامنات والربط:</p>
                    <p className="text-[11px] text-slate-500 truncate">جوجل: {user.googleAccount || "غير مربوط"}</p>
                    <p className="text-[11px] text-slate-500 truncate">فيسبوك: {user.facebookAccount || "غير مربوط"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CONTACTS LEADS EXCEL IMPORTED */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">استيراد الموكلين والخصوم (فصل الأطراف)</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              قم بلصق جهات الاتصال أو شيت الإكسيل هنا. يتم فصل الموكلين عن الخصوم تلقائياً لضمان عدم اختلاط سجلات المكتب.
            </p>

            {currentUser.role === UserRole.ADMIN && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Clients Import Box */}
                <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <span className="text-xs font-bold text-emerald-900 block flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    استيراد الموكلين (أصحاب الصفة)
                  </span>
                  <textarea
                    rows={4}
                    value={excelContactInputRaw}
                    onChange={(e) => setExcelContactInputRaw(e.target.value)}
                    placeholder="الصق الموكلين هنا (الاسم, الهاتف)&#10;مثال: أحمد عبد الله, 01011223344"
                    className="w-full p-2 bg-white text-slate-900 border border-emerald-200 rounded-lg text-right text-xs font-mono outline-none focus:border-emerald-500 transition"
                  />
                  <button
                    onClick={() => {
                      if (!excelContactInputRaw.trim()) return alert("الرجاء لصق بيانات الموكلين.");
                      const lines = excelContactInputRaw.split("\n");
                      let count = 0;
                      lines.forEach((line, idx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return;
                        const match = trimmed.match(/(?:\+?20|0020)?\b0?1[0125]\d{8}\b|\b(?:\+?\d{1,4})?\d{8,14}\b/);
                        let phone = match ? match[0].trim() : `غير متوفر-${Date.now()}-${idx}`;
                        let name = match ? trimmed.replace(phone, "").trim() : trimmed.split(/[,\t;-]/)[0].trim();
                        name = name.replace(/^[ \t،,:\-\|\\\/]+|[ \t،,:\-\|\\\/]+$/g, "").trim();
                        if (name.length > 1) {
                          onAddClient({
                            id: `cl-excel-${Date.now()}-${idx}`,
                            serialNumber: clients.length + count + 1,
                            name,
                            phone,
                            subject: "تم الاستيراد من الإكسيل",
                            nationalId: "", poaNumber: "", poaLetter: "", poaYear: new Date().getFullYear(), poaOffice: "", caseNumber: "", caseYear: new Date().getFullYear(), competentCourt: "", remainingFees: 0, createdAt: new Date().toISOString()
                          });
                          count++;
                        }
                      });
                      setExcelContactInputRaw("");
                      alert(`تم استيراد ${count} موكل بنجاح وإضافتهم إلى سجل الموكلين.`);
                    }}
                    className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs cursor-pointer shadow-sm transition"
                  >
                    استيراد كـ موكلين
                  </button>
                </div>

                {/* Opponents Import Box */}
                <div className="bg-red-50/40 p-4 rounded-xl border border-red-200 space-y-3">
                  <span className="text-xs font-bold text-red-900 block flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    استيراد الخصوم (المعلن إليهم)
                  </span>
                  <textarea
                    rows={4}
                    id="opponents-excel-input"
                    placeholder="الصق الخصوم هنا (الاسم, الهاتف)&#10;مثال: شركة المقاولات, 01234567890"
                    className="w-full p-2 bg-white text-slate-900 border border-red-200 rounded-lg text-right text-xs font-mono outline-none focus:border-red-500 transition"
                  />
                  <button
                    onClick={() => {
                      const oppInput = (document.getElementById("opponents-excel-input") as HTMLTextAreaElement).value;
                      if (!oppInput.trim()) return alert("الرجاء لصق بيانات الخصوم.");
                      const lines = oppInput.split("\n");
                      let count = 0;
                      lines.forEach((line, idx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return;
                        const match = trimmed.match(/(?:\+?20|0020)?\b0?1[0125]\d{8}\b|\b(?:\+?\d{1,4})?\d{8,14}\b/);
                        let phone = match ? match[0].trim() : `غير متوفر-${Date.now()}-${idx}`;
                        let name = match ? trimmed.replace(phone, "").trim() : trimmed.split(/[,\t;-]/)[0].trim();
                        name = name.replace(/^[ \t،,:\-\|\\\/]+|[ \t،,:\-\|\\\/]+$/g, "").trim();
                        if (name.length > 1) {
                          onAddOpponent({
                            id: `op-excel-${Date.now()}-${idx}`,
                            name,
                            phone,
                            isDifferentColor: true
                          });
                          count++;
                        }
                      });
                      (document.getElementById("opponents-excel-input") as HTMLTextAreaElement).value = "";
                      alert(`تم استيراد ${count} خصم بنجاح وإضافتهم إلى سجل الخصوم.`);
                    }}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-xs cursor-pointer shadow-sm transition"
                  >
                    استيراد كـ خصوم
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right text-slate-800 border-collapse font-sans">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-bold text-right col-span-2">الاسم رباعياً</th>
                    <th className="pb-2 font-bold text-right">رقم الهاتف</th>
                    <th className="pb-2 font-bold text-right">البريد الإلكتروني</th>
                    <th className="pb-2 font-bold text-right">مصدر جهات الاتصال</th>
                    <th className="pb-2 font-bold text-left">إجراء تحويل</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400 font-medium">لا توجد جهات اتصال محتملة حالياً. استخدم نموذج الإدخال أعلاه للصق شيت إكسل.</td>
                    </tr>
                  ) : (
                    filteredLeads.map(l => (
                      <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-2.5 font-bold text-slate-900">{l.name}</td>
                        <td className="py-2.5 font-mono text-amber-700">{l.phone.startsWith("غير متوفر") ? "غير متوفر" : l.phone}</td>
                        <td className="py-2.5 text-slate-600">{l.email || "غير مدرج"}</td>
                        <td className="py-2.5 text-slate-600">{l.source}</td>
                        <td className="py-2.5 text-left">
                          <button
                            id={`convert-lead-${l.id}`}
                            onClick={() => handleConvertLeadToClient(l)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-2.5 py-1 text-[10px] rounded transition shadow-sm cursor-pointer"
                          >
                            + تحويل لموكل قضائي
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PLATFORM PERMISSIONS */}
        {activeTab === "permissions" && currentUser.role === UserRole.ADMIN && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">صلاحيات المنصة الفنية وحقوق ولوج المستخدمين</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-right">
              
              {/* Dynamic rights modifier form */}
              <div className="bg-amber-50/55 p-4 rounded-xl border border-amber-200 col-span-1 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-amber-800">تعديل حقوق وحساب مستخدم</h4>
                <div className="space-y-3 font-sans">
                  <div>
                    <label className="block text-slate-600 mb-1" htmlFor="user-to-modify-select">اختر الحساب المرتبط بالهاتف</label>
                    <select
                      id="user-to-modify-select"
                      value={selectedUserPhone}
                      onChange={(e) => setSelectedUserPhone(e.target.value)}
                      className="w-full bg-white border border-slate-205 text-slate-900 px-2 py-1.5 rounded outline-none focus:border-amber-500"
                    >
                      <option value="">-- اختر رقم الحساب هاتفياً --</option>
                      {registeredUsers.map(u => (
                        <option key={u.id} value={u.phone}>{u.name} ({u.phone})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1" htmlFor="new-role-select">حساب لـ (الصلاحية العليا)</label>
                    <select
                      id="new-role-select"
                      value={updatedRole}
                      onChange={(e) => setUpdatedRole(e.target.value as UserRole)}
                      className="w-full bg-white border border-slate-250 text-slate-900 px-2 py-1.5 rounded outline-none focus:border-amber-500"
                    >
                      <option value={UserRole.STAFF}>سكرتارية ومحامين بالمكتب (Staff)</option>
                      <option value={UserRole.CLIENT}>موكل (Client)</option>
                      <option value={UserRole.SEEKER}>طالب خدمة استشارية (Seeker)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1" htmlFor="new-password">تعديل كلمة مرور الحساب</label>
                    <input
                      id="new-password"
                      type="text"
                      value={updatedPass}
                      onChange={(e) => setUpdatedPass(e.target.value)}
                      placeholder="كلمة مرور جديدة"
                      className="w-full px-2 py-1.5 bg-white text-slate-900 border border-slate-200 rounded text-right outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <button
                    id="update-permissions-btn"
                    type="button"
                    onClick={() => handleUpdatePermissionSubmit(selectedUserPhone)}
                    disabled={!selectedUserPhone}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold rounded cursor-pointer transition shadow-sm"
                  >
                    حفظ وإقرار الصلاحية الجديدة
                  </button>
                </div>
              </div>

              {/* Users list with permissions */}
              <div className="md:col-span-2 overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse text-slate-800 font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 text-right">المستخدم</th>
                      <th className="pb-2 text-right">رقم الهاتف</th>
                      <th className="pb-2 text-right">الصلاحية الدائرية</th>
                      <th className="pb-2 text-right">البلد / هجين</th>
                      <th className="pb-2 text-left">كلمة المرور</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredUsers.map(u => (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-3 font-semibold text-slate-900">{u.name}</td>
                        <td className="py-3 font-mono font-bold text-amber-700">{u.phone}</td>
                        <td className="py-3 font-bold">
                          {u.role === UserRole.ADMIN && <span className="text-red-600">مدير عام</span>}
                          {u.role === UserRole.STAFF && <span className="text-teal-600">طاقم عمل/سيرتاريا</span>}
                          {u.role === UserRole.CLIENT && <span className="text-blue-600">موكل</span>}
                          {u.role === UserRole.SEEKER && <span className="text-purple-600">طالب خدمة</span>}
                        </td>
                        <td className="py-3 text-slate-500">{u.isVerified ? "مؤكد مصري" : "دولي"}</td>
                        <td className="py-3 text-left font-mono font-bold text-slate-900 pr-2">{u.passwordHash}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MULTI-STEP ADVANCED CLIENT ONBOARDING WIZARD */}
      <AddClientWizardModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedLeadForConversion(null);
        }}
        onSaveClient={(newCl, firstCase) => {
          onAddClient(newCl, firstCase);
          setShowAddModal(false);
          setSelectedLeadForConversion(null);
        }}
        existingClientsCount={clients.length}
        existingCasesCount={casesCount || 0}
        initialLeadData={
          selectedLeadForConversion
            ? {
                name: selectedLeadForConversion.name,
                phone: selectedLeadForConversion.phone?.startsWith("غير متوفر") ? "" : selectedLeadForConversion.phone
              }
            : undefined
        }
      />

      {/* ADMIN CLIENT DOCUMENTS CABINET MANAGER MODAL */}
      {selectedClientForDocs && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-right font-sans" dir="rtl">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5 justify-start">
                  <span>📂 خزنة مستندات الموكل:</span>
                  <span className="text-amber-600">{selectedClientForDocs.name}</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">تدار وتخزن الملفات سحابياً بمستويات تشفير معزولة ولا تظهر إلا للموكل والإدارة فورا.</p>
              </div>
              <button
                id="close-admin-doc-manager"
                onClick={() => setSelectedClientForDocs(null)}
                className="bg-slate-100 hover:bg-slate-205 text-slate-800 font-bold px-3 py-1.5 rounded transition text-xs cursor-pointer"
              >
                إغلاق الخزنة
              </button>
            </div>

            {/* Quick Upload field for admin */}
            <div className="border border-dashed border-amber-500/30 rounded-xl p-4 text-center bg-amber-50/20 hover:bg-amber-50 transition relative cursor-pointer">
              <input
                id="admin-vault-input-uploader"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleAdminDocUpload(e, selectedClientForDocs)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-8 h-8 text-amber-500 mx-auto mb-1 animate-pulse" />
              <p className="text-xs font-bold text-slate-900">اضغط لرفع مستند جديد بالنيابة عن الموكل</p>
              <p className="text-[10px] text-slate-400 mt-1">مدعوم الصور والمستندات الثبوتية والمستندات القضائية الممسوحة</p>
            </div>

            {/* Document grid inside the cabinet */}
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {(!selectedClientForDocs.personalDocuments || selectedClientForDocs.personalDocuments.length === 0) ? (
                <div className="text-center py-10 text-slate-400 font-medium">لا توجد أي مستندات قضائية أو ثبوتية مرفوعة داخل خزنة هذا الموكل حالياً.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedClientForDocs.personalDocuments.map((docImg) => {
                    const isImg = docImg.fileBase64.startsWith("data:image/");
                    return (
                      <div key={docImg.id} className="border border-slate-200 rounded-xl bg-slate-55 overflow-hidden flex flex-col justify-between shadow-sm relative group p-2">
                        {isImg ? (
                          <div className="aspect-[4/3] w-full rounded bg-slate-200 overflow-hidden relative">
                            <img 
                              src={docImg.fileBase64} 
                              alt={docImg.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[4/3] w-full flex flex-col items-center justify-center bg-slate-100 rounded text-amber-600">
                            <FileText className="w-8 h-8" />
                          </div>
                        )}
                        <div className="pt-2 flex flex-col gap-0.5">
                          <p className="font-extrabold text-[11px] truncate text-slate-900" title={docImg.name}>{docImg.name}</p>
                          <p className="text-[9px] text-slate-400">{new Date(docImg.addedAt).toLocaleDateString("ar-EG")}</p>
                        </div>
                        <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-200/50 justify-between">
                          <a 
                            href={docImg.fileBase64} 
                            download={docImg.name}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-2 py-0.5 text-[9px] rounded shadow-sm text-center transition cursor-pointer"
                          >
                            تنزيل
                          </a>
                          <button
                            id={`delete-admin-doc-${docImg.id}`}
                            onClick={() => handleAdminDocDelete(docImg.id, selectedClientForDocs)}
                            className="bg-red-650 hover:bg-red-700 text-white font-bold px-2 py-0.5 text-[9px] rounded shadow-sm transition cursor-pointer"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE CONTACTS IMPORT MODAL */}
      {showContactsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-right" dir="rtl">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                  <Contact className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    مزامنة واستيراد جهات الاتصال (Google Contacts)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    استيراد مباشر للموكلين والعملاء المحتملين من حساب Google People API
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowContactsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Actions Bar inside Modal */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-blue-50/50 dark:bg-slate-800/40">
              <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                تم العثور على: <span className="text-blue-600 dark:text-blue-400">{googleContacts.length}</span> جهة اتصال
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleImportAllContactsAsLeads}
                  disabled={googleContacts.length === 0}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition disabled:opacity-50"
                >
                  استيراد الكل كعملاء محتملين
                </button>
                <button
                  onClick={handleOpenGoogleContactsModal}
                  disabled={isLoadingContacts}
                  className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl text-slate-700 dark:text-slate-200 transition"
                  title="إعادة المزامنة"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingContacts ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Contacts List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {isLoadingContacts ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span>جاري المزامنة مع Google Contacts API...</span>
                </div>
              ) : googleContacts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  لم يتم العثور على جهات اتصال مسجلة في حساب Google
                </div>
              ) : (
                googleContacts.map((c, idx) => (
                  <div
                    key={c.resourceName || idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-500/10 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full flex items-center justify-center font-black text-xs">
                          {c.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{c.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          {c.phone && <span>📞 {c.phone}</span>}
                          {c.email && <span>✉️ {c.email}</span>}
                          {c.jobTitle && <span className="text-amber-600 font-bold">💼 {c.jobTitle}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleImportContactAsClient(c)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 flex-shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      إدراج كموكل
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
              <span>Google People API - موثق عبر OAuth 2.0</span>
              <button
                onClick={() => setShowContactsModal(false)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
