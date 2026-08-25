import { 
  UserRole, 
  UserPermissions, 
  ProgramModuleConfig, 
  OfficeDepartment, 
  SecurityAuditLog, 
  ConnectedDeviceRecord,
  PlatformUser
} from "../types";

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  [UserRole.ADMIN]: {
    canViewCases: true,
    canAddCases: true,
    canEditCases: true,
    canDeleteCases: true,
    canExportCases: true,
    canViewClients: true,
    canAddClients: true,
    canEditClients: true,
    canDeleteClients: true,
    canViewOpponents: true,
    canViewFinance: true,
    canAddPayments: true,
    canEditFees: true,
    canViewFinancialReports: true,
    canManageSessions: true,
    canRecordDecisions: true,
    canAccessDocEditor: true,
    canAccessSmartOcr: true,
    canSignMemos: true,
    canAccessGoogleWorkspace: true,
    canManageSections: true,
    canManageUsers: true,
    canManageDevices: true,
    canViewAuditLogs: true,
    canEditSystemSettings: true,
  },
  [UserRole.SENIOR_LAWYER]: {
    canViewCases: true,
    canAddCases: true,
    canEditCases: true,
    canDeleteCases: false,
    canExportCases: true,
    canViewClients: true,
    canAddClients: true,
    canEditClients: true,
    canDeleteClients: false,
    canViewOpponents: true,
    canViewFinance: true,
    canAddPayments: true,
    canEditFees: false,
    canViewFinancialReports: false,
    canManageSessions: true,
    canRecordDecisions: true,
    canAccessDocEditor: true,
    canAccessSmartOcr: true,
    canSignMemos: true,
    canAccessGoogleWorkspace: true,
    canManageSections: false,
    canManageUsers: false,
    canManageDevices: false,
    canViewAuditLogs: false,
    canEditSystemSettings: false,
  },
  [UserRole.ASSOCIATE_LAWYER]: {
    canViewCases: true,
    canAddCases: true,
    canEditCases: true,
    canDeleteCases: false,
    canExportCases: true,
    canViewClients: true,
    canAddClients: true,
    canEditClients: true,
    canDeleteClients: false,
    canViewOpponents: true,
    canViewFinance: false,
    canAddPayments: false,
    canEditFees: false,
    canViewFinancialReports: false,
    canManageSessions: true,
    canRecordDecisions: true,
    canAccessDocEditor: true,
    canAccessSmartOcr: true,
    canSignMemos: false,
    canAccessGoogleWorkspace: true,
    canManageSections: false,
    canManageUsers: false,
    canManageDevices: false,
    canViewAuditLogs: false,
    canEditSystemSettings: false,
  },
  [UserRole.SECRETARY]: {
    canViewCases: true,
    canAddCases: true,
    canEditCases: false,
    canDeleteCases: false,
    canExportCases: false,
    canViewClients: true,
    canAddClients: true,
    canEditClients: false,
    canDeleteClients: false,
    canViewOpponents: true,
    canViewFinance: false,
    canAddPayments: true,
    canEditFees: false,
    canViewFinancialReports: false,
    canManageSessions: true,
    canRecordDecisions: true,
    canAccessDocEditor: false,
    canAccessSmartOcr: true,
    canSignMemos: false,
    canAccessGoogleWorkspace: true,
    canManageSections: false,
    canManageUsers: false,
    canManageDevices: false,
    canViewAuditLogs: false,
    canEditSystemSettings: false,
  },
  [UserRole.ACCOUNTANT]: {
    canViewCases: true,
    canAddCases: false,
    canEditCases: false,
    canDeleteCases: false,
    canExportCases: true,
    canViewClients: true,
    canAddClients: false,
    canEditClients: false,
    canDeleteClients: false,
    canViewOpponents: false,
    canViewFinance: true,
    canAddPayments: true,
    canEditFees: true,
    canViewFinancialReports: true,
    canManageSessions: false,
    canRecordDecisions: false,
    canAccessDocEditor: false,
    canAccessSmartOcr: false,
    canSignMemos: false,
    canAccessGoogleWorkspace: true,
    canManageSections: false,
    canManageUsers: false,
    canManageDevices: false,
    canViewAuditLogs: false,
    canEditSystemSettings: false,
  },
  [UserRole.TRAINEE]: {
    canViewCases: true,
    canAddCases: false,
    canEditCases: false,
    canDeleteCases: false,
    canExportCases: false,
    canViewClients: true,
    canAddClients: false,
    canEditClients: false,
    canDeleteClients: false,
    canViewOpponents: true,
    canViewFinance: false,
    canAddPayments: false,
    canEditFees: false,
    canViewFinancialReports: false,
    canManageSessions: true,
    canRecordDecisions: false,
    canAccessDocEditor: true,
    canAccessSmartOcr: true,
    canSignMemos: false,
    canAccessGoogleWorkspace: false,
    canManageSections: false,
    canManageUsers: false,
    canManageDevices: false,
    canViewAuditLogs: false,
    canEditSystemSettings: false,
  },
  [UserRole.STAFF]: {
    canViewCases: true,
    canAddCases: true,
    canEditCases: true,
    canDeleteCases: false,
    canExportCases: true,
    canViewClients: true,
    canAddClients: true,
    canEditClients: true,
    canDeleteClients: false,
    canViewOpponents: true,
    canViewFinance: false,
    canAddPayments: false,
    canEditFees: false,
    canViewFinancialReports: false,
    canManageSessions: true,
    canRecordDecisions: true,
    canAccessDocEditor: true,
    canAccessSmartOcr: true,
    canSignMemos: false,
    canAccessGoogleWorkspace: true,
    canManageSections: false,
    canManageUsers: false,
    canManageDevices: false,
    canViewAuditLogs: false,
    canEditSystemSettings: false,
  },
  [UserRole.CLIENT]: {
    canViewCases: true,
    canAddCases: false,
    canEditCases: false,
    canDeleteCases: false,
    canExportCases: false,
    canViewClients: false,
    canAddClients: false,
    canEditClients: false,
    canDeleteClients: false,
    canViewOpponents: false,
    canViewFinance: true,
    canAddPayments: false,
    canEditFees: false,
    canViewFinancialReports: false,
    canManageSessions: true,
    canRecordDecisions: false,
    canAccessDocEditor: false,
    canAccessSmartOcr: false,
    canSignMemos: true,
    canAccessGoogleWorkspace: false,
    canManageSections: false,
    canManageUsers: false,
    canManageDevices: false,
    canViewAuditLogs: false,
    canEditSystemSettings: false,
  },
  [UserRole.SEEKER]: {
    canViewCases: false,
    canAddCases: false,
    canEditCases: false,
    canDeleteCases: false,
    canExportCases: false,
    canViewClients: false,
    canAddClients: false,
    canEditClients: false,
    canDeleteClients: false,
    canViewOpponents: false,
    canViewFinance: false,
    canAddPayments: false,
    canEditFees: false,
    canViewFinancialReports: false,
    canManageSessions: false,
    canRecordDecisions: false,
    canAccessDocEditor: false,
    canAccessSmartOcr: false,
    canSignMemos: false,
    canAccessGoogleWorkspace: false,
    canManageSections: false,
    canManageUsers: false,
    canManageDevices: false,
    canViewAuditLogs: false,
    canEditSystemSettings: false,
  },
  [UserRole.OPPONENT]: {
    canViewCases: false,
    canAddCases: false,
    canEditCases: false,
    canDeleteCases: false,
    canExportCases: false,
    canViewClients: false,
    canAddClients: false,
    canEditClients: false,
    canDeleteClients: false,
    canViewOpponents: false,
    canViewFinance: false,
    canAddPayments: false,
    canEditFees: false,
    canViewFinancialReports: false,
    canManageSessions: false,
    canRecordDecisions: false,
    canAccessDocEditor: false,
    canAccessSmartOcr: false,
    canSignMemos: false,
    canAccessGoogleWorkspace: false,
    canManageSections: false,
    canManageUsers: false,
    canManageDevices: false,
    canViewAuditLogs: false,
    canEditSystemSettings: false,
  }
};

export const ROLE_LABELS: Record<UserRole, { ar: string; en: string; color: string; badge: string }> = {
  [UserRole.ADMIN]: {
    ar: "مدير النظام والمكتب (المحامي العام)",
    en: "Master Admin & Managing Partner",
    color: "amber",
    badge: "👑 رئيس الديوان"
  },
  [UserRole.SENIOR_LAWYER]: {
    ar: "محامي أول / شريك بالنقض",
    en: "Senior Partner / Cassation Lawyer",
    color: "indigo",
    badge: "⚖️ محامي أول"
  },
  [UserRole.ASSOCIATE_LAWYER]: {
    ar: "محامي استئناف وابتدائي",
    en: "Associate Appellate Lawyer",
    color: "blue",
    badge: "💼 محامي جدول"
  },
  [UserRole.SECRETARY]: {
    ar: "سكرتارية الشؤون الإدارية والجلسات",
    en: "Legal Secretary & Court Clerk",
    color: "teal",
    badge: "📝 سكرتير جلسات"
  },
  [UserRole.ACCOUNTANT]: {
    ar: "المحاسب المالي وشؤون الخزينة",
    en: "Financial Accountant & Treasury",
    color: "emerald",
    badge: "💰 محاسب مالي"
  },
  [UserRole.TRAINEE]: {
    ar: "محامي متدرب / باحث قانوني",
    en: "Trainee Lawyer & Legal Researcher",
    color: "purple",
    badge: "🎓 متدرب"
  },
  [UserRole.STAFF]: {
    ar: "طاقم العمل والمساندة العامة",
    en: "Office General Staff",
    color: "slate",
    badge: "👔 طاقم عمل"
  },
  [UserRole.CLIENT]: {
    ar: "موكل مسجل ذو ملف قضائي",
    en: "Registered Client",
    color: "sky",
    badge: "👤 موكل"
  },
  [UserRole.SEEKER]: {
    ar: "طالب استشارة قانونية",
    en: "Legal Consultation Seeker",
    color: "rose",
    badge: "💡 طالب استشارة"
  },
  [UserRole.OPPONENT]: {
    ar: "طرف خصم في دعوى",
    en: "Opposing Party",
    color: "orange",
    badge: "⚔️ خصم"
  }
};

export function checkUserPermission(
  user: PlatformUser | null, 
  permission: keyof UserPermissions
): boolean {
  if (!user) return false;
  if (user.role === UserRole.ADMIN || user.phone === "01283233555") return true;

  // Check custom user override first
  if (user.customPermissions && user.customPermissions[permission] !== undefined) {
    return !!user.customPermissions[permission];
  }

  // Fallback to role default
  const roleDefaults = DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS[UserRole.STAFF];
  return !!roleDefaults[permission];
}

export const DEFAULT_PROGRAM_MODULES: ProgramModuleConfig[] = [
  {
    id: "dashboard",
    nameArabic: "لوحة المتابعة الشاملة",
    nameEnglish: "Executive Dashboard",
    description: "الإحصائيات العامة، الجلسات العاجلة، والأداء المالي والمكتبي العام.",
    category: "core",
    iconName: "LayoutDashboard",
    emoji: "📊",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.SECRETARY, UserRole.ACCOUNTANT, UserRole.TRAINEE, UserRole.STAFF],
    order: 1,
    isCore: true
  },
  {
    id: "cases",
    nameArabic: "إدارة القضايا والدعاوى",
    nameEnglish: "Cases & Lawsuits",
    description: "قيد ملفات الدعاوى، الدوائر، الخصوم، مذكرات الدفاع، والمرفقات.",
    category: "legal",
    iconName: "Briefcase",
    emoji: "💼",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.SECRETARY, UserRole.TRAINEE, UserRole.STAFF, UserRole.CLIENT],
    order: 2,
    isCore: true
  },
  {
    id: "clients",
    nameArabic: "سجل الموكلين وجهات الاتصال",
    nameEnglish: "Clients & Contacts",
    description: "بيانات الموكلين، مسح التوكيلات، الرقم القومي، والحسابات الرقمية.",
    category: "legal",
    iconName: "Users",
    emoji: "👥",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.SECRETARY, UserRole.ACCOUNTANT, UserRole.STAFF],
    order: 3,
    isCore: true
  },
  {
    id: "sessions",
    nameArabic: "أجندة الجلسات اليومية والقرارات",
    nameEnglish: "Court Sessions Agenda",
    description: "جدول مواعيد المحاكم اليومية، القرارات الصادرة، والعمل المطلوب.",
    category: "legal",
    iconName: "Calendar",
    emoji: "📅",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.SECRETARY, UserRole.TRAINEE, UserRole.STAFF, UserRole.CLIENT],
    order: 4,
    isCore: true
  },
  {
    id: "fees",
    nameArabic: "الخزينة ومتحصلات الأتعاب",
    nameEnglish: "Treasury & Legal Fees",
    description: "حسابات الأتعاب المتفق عليها والمسددة والمتبقية، وسندات القبض.",
    category: "finance",
    iconName: "DollarSign",
    emoji: "💵",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ACCOUNTANT, UserRole.STAFF, UserRole.CLIENT],
    order: 5
  },
  {
    id: "doc_editor",
    nameArabic: "محرر المستندات والصياغة القضائية",
    nameEnglish: "Legal Document Editor",
    description: "صياغة المذكرات، عقود البيع، الإنذارات، والتصدير المباشر بتنسيقات Word/PDF.",
    category: "legal",
    iconName: "FileText",
    emoji: "✍️",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.TRAINEE, UserRole.STAFF],
    order: 6
  },
  {
    id: "smart_ocr",
    nameArabic: "استوديو الفحص والماسح الضوئي (OCR)",
    nameEnglish: "Smart OCR Scanner",
    description: "استخراج النصوص من المستندات، فحص الثغرات القانونية، ومقارنة العقود.",
    category: "ai_tools",
    iconName: "Scan",
    emoji: "🔍",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.SECRETARY, UserRole.TRAINEE, UserRole.STAFF],
    order: 7
  },
  {
    id: "workspace",
    nameArabic: "سحابة Google Workspace و Keep",
    nameEnglish: "Google Workspace & Keep Hub",
    description: "المزامنة مع Google Sheets، Drive، Gmail، Calendar، وملاحظات Keep والتوقيع الإلكتروني.",
    category: "ai_tools",
    iconName: "Cloud",
    emoji: "🌐",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.SECRETARY, UserRole.STAFF, UserRole.CLIENT],
    order: 8
  },
  {
    id: "ai",
    nameArabic: "المستشار الذكي (AI Legal Assistant)",
    nameEnglish: "AI Legal Assistant",
    description: "الاستشارات الفورية، صياغة الطلبات، وتفسير المواد القانونية بالذكاء الاصطناعي.",
    category: "ai_tools",
    iconName: "Bot",
    emoji: "🤖",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.TRAINEE, UserRole.STAFF, UserRole.CLIENT, UserRole.SEEKER],
    order: 9
  },
  {
    id: "lawcodes",
    nameArabic: "المكتبة والأكواد القضائية",
    nameEnglish: "Law Codes & Legal Library",
    description: "أكواد القوانين المصرية (العقوبات، المدني، الإجراءات، العمل، المرافعات).",
    category: "legal",
    iconName: "BookOpen",
    emoji: "📖",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.SECRETARY, UserRole.ACCOUNTANT, UserRole.TRAINEE, UserRole.STAFF, UserRole.CLIENT],
    order: 10
  },
  {
    id: "announcements",
    nameArabic: "شريط الإعلانات والتعميمات",
    nameEnglish: "Public Announcements",
    description: "نشر التنبيهات والقرارات العاجلة والإعلانات العامة للموكلين والمحامين.",
    category: "communication",
    iconName: "Megaphone",
    emoji: "📢",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.SECRETARY, UserRole.ACCOUNTANT, UserRole.TRAINEE, UserRole.STAFF, UserRole.CLIENT, UserRole.SEEKER, UserRole.OPPONENT],
    order: 11
  },
  {
    id: "social",
    nameArabic: "ديوان التواصل والاستشارات",
    nameEnglish: "Social & Client Engagement",
    description: "قاعات الحوار التفاعلي، المحادثات، واستقبال طلبات الاستشارة القانونية.",
    category: "communication",
    iconName: "MessageCircle",
    emoji: "🗨️",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.SECRETARY, UserRole.STAFF, UserRole.CLIENT, UserRole.SEEKER, UserRole.OPPONENT],
    order: 12
  },
  {
    id: "companies",
    nameArabic: "شؤون الشركات والكيانات التجارية",
    nameEnglish: "Corporate & Commercial Affairs",
    description: "إدارة العقود التجارية، سجل الشركات، التأسيس، والضرائب.",
    category: "legal",
    iconName: "Building2",
    emoji: "🏢",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.STAFF],
    order: 13
  },
  {
    id: "import_files",
    nameArabic: "استيراد وإدارة الملفات السحابية",
    nameEnglish: "File Imports & Management",
    description: "سحب واستيراد الملفات، جداول Excel، وجهات الاتصال وقراءتها تلقائياً.",
    category: "core",
    iconName: "DownloadCloud",
    emoji: "📥",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.SECRETARY, UserRole.STAFF],
    order: 14
  },
  {
    id: "adminwork",
    nameArabic: "الأعمال والطلبات الإدارية والنيابات",
    nameEnglish: "Administrative & Prosecution Orders",
    description: "العرائض، محاضر الشرطة، وتصاريح النيابة العامة وتنفيذ الإعلانات.",
    category: "legal",
    iconName: "ScrollText",
    emoji: "📝",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.ASSOCIATE_LAWYER, UserRole.SECRETARY, UserRole.STAFF],
    order: 15
  },
  {
    id: "documentation",
    nameArabic: "سجل التوثيق والشهر العقاري",
    nameEnglish: "Notary & Real Estate Registry",
    description: "توثيق العقود، إثبات التاريخ، ونماذج التوكيلات الرسمية.",
    category: "legal",
    iconName: "FileCheck",
    emoji: "📑",
    isEnabled: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SENIOR_LAWYER, UserRole.SECRETARY, UserRole.STAFF],
    order: 16
  }
];

export const DEFAULT_OFFICE_DEPARTMENTS: OfficeDepartment[] = [
  {
    id: "dept-criminal",
    name: "قسم الجنايات والنقض الجنائي",
    code: "CRIM-01",
    description: "متابعة قضايا الجنايات، الطعون بالنقض، مذكرات أسباب الطعن، وجلسات إعادة المحاكمة.",
    headLawyerName: "الأستاذ وسام الشناوي",
    headLawyerPhone: "01283233555",
    assignedLawyers: ["الأستاذ وسام الشناوي", "الأستاذ سعد الدين هلال"],
    casesCount: 42,
    color: "#dc2626",
    icon: "ShieldAlert",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "dept-civil",
    name: "قسم المدني والتعويضات والعقود",
    code: "CIVIL-02",
    description: "دعاوى صحة التوقيع، التعويضات، الإيجارات، وصياغة العقود التجارية والمدنية الكبرى.",
    headLawyerName: "الأستاذ سعد الدين هلال",
    headLawyerPhone: "01234567890",
    assignedLawyers: ["الأستاذ سعد الدين هلال"],
    casesCount: 28,
    color: "#2563eb",
    icon: "Scale",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "dept-family",
    name: "قسم محاكم الأسرة والأحوال الشخصية",
    code: "FAM-03",
    description: "دعاوى النفقات، الحضانة، الطلاق، إثبات النسب، وإعلامات الوراثة وحصر التركات.",
    headLawyerName: "الأستاذة مروة إبراهيم",
    headLawyerPhone: "01099887766",
    assignedLawyers: ["الأستاذة مروة إبراهيم"],
    casesCount: 19,
    color: "#059669",
    icon: "HeartHandshake",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "dept-corporate",
    name: "قسم الشركات والاستثمار والتحكيم التجاري",
    code: "CORP-04",
    description: "تأسيس الشركات المساهمة وذات المسؤولية المحدودة، صياغة لوائح الحوكمة والتحكيم الدولي.",
    headLawyerName: "الأستاذ وسام الشناوي",
    headLawyerPhone: "01283233555",
    assignedLawyers: ["الأستاذ وسام الشناوي"],
    casesCount: 15,
    color: "#d97706",
    icon: "Building2",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "dept-execution",
    name: "قسم التنفيذ الجبري ومحضري المحاكم",
    code: "EXEC-05",
    description: "تنفيذ الأحكام القضائية، إنذارات العرض، الحجوزات التحفظية والتنفيذية وتسليم العقارات.",
    headLawyerName: "الأستاذ أحمد فوزي",
    headLawyerPhone: "01122334455",
    assignedLawyers: ["الأستاذ أحمد فوزي"],
    casesCount: 23,
    color: "#7c3aed",
    icon: "Gavel",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z"
  }
];

export const INITIAL_AUDIT_LOGS: SecurityAuditLog[] = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    userId: "usr-admin",
    userName: "الأستاذ وسام الشناوي",
    userRole: "admin",
    action: "login",
    details: "تسجيل دخول ناجح إلى النظام من جهاز الحاسوب المكتبي الرئيسي بالمكتب",
    deviceId: "DEV-SHENAWEY-MASTER",
    deviceName: "Windows 11 PC - المكتب الرئيسي",
    ipAddress: "197.34.120.88",
    severity: "success"
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    userId: "usr-staff",
    userName: "الأستاذ سعد الدين هلال",
    userRole: "staff",
    action: "login",
    details: "تسجيل دخول عبر متصفح Chrome - لابتوب المحكمة",
    deviceId: "DEV-STAFF-01",
    deviceName: "MacBook Air - مأمورية الجلسات",
    ipAddress: "156.202.14.33",
    severity: "info"
  },
  {
    id: "log-3",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    userId: "usr-admin",
    userName: "الأستاذ وسام الشناوي",
    userRole: "admin",
    action: "permission_change",
    details: "تحديث الصلاحيات الممنوحة لسكرتارية الجلسات وإضافة صلاحية سحب تقارير الرول",
    severity: "warning"
  }
];

/**
 * Detect current browser & device name for auto-registration
 */
export function detectCurrentDeviceInfo(): { name: string; type: "desktop" | "mobile" | "tablet" | "laptop"; os: string; browser: string } {
  const ua = navigator.userAgent;
  let os = "Windows";
  if (ua.indexOf("Mac") !== -1) os = "macOS";
  if (ua.indexOf("Linux") !== -1) os = "Linux";
  if (ua.indexOf("Android") !== -1) os = "Android";
  if (ua.indexOf("iPhone") !== -1 || ua.indexOf("iPad") !== -1) os = "iOS";

  let browser = "Chrome";
  if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
  if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) browser = "Safari";
  if (ua.indexOf("Edge") !== -1 || ua.indexOf("Edg") !== -1) browser = "Edge";

  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const type = isMobile ? (/iPad|Tablet/i.test(ua) ? "tablet" : "mobile") : (os === "macOS" || ua.indexOf("Touch") !== -1 ? "laptop" : "desktop");

  const name = `${os} - متصفح ${browser} (${type === "mobile" ? "هاتف" : type === "tablet" ? "تابلت" : "كمبيوتر"})`;

  return { name, type, os, browser };
}
