export enum UserRole {
  ADMIN = "admin",             // الأستاذ الكبير وسام الشناوي (مدير النظام والمكتب)
  SENIOR_LAWYER = "senior_lawyer", // محامي أول / شريك
  ASSOCIATE_LAWYER = "associate_lawyer", // محامي جدول عام / ابتدائي / استئناف
  SECRETARY = "secretary",     // السكرتارية والشؤون الإدارية
  ACCOUNTANT = "accountant",   // المحاسب المالي وشؤون الخزينة
  TRAINEE = "trainee",         // محامي متدرب / باحث قانوني
  STAFF = "staff",             // طاقم العمل العام
  CLIENT = "client",           // الموكلون المسجلون
  SEEKER = "seeker",           // طالب الخدمة / استشارة قانونية
  OPPONENT = "opponent"        // خصم مسجل
}

export interface UserPermissions {
  // القضايا والدعاوى
  canViewCases: boolean;
  canAddCases: boolean;
  canEditCases: boolean;
  canDeleteCases: boolean;
  canExportCases: boolean;
  
  // الموكلين وجهات الاتصال
  canViewClients: boolean;
  canAddClients: boolean;
  canEditClients: boolean;
  canDeleteClients: boolean;
  canViewOpponents: boolean;
  
  // الخزينة والأتعاب
  canViewFinance: boolean;
  canAddPayments: boolean;
  canEditFees: boolean;
  canViewFinancialReports: boolean;
  
  // الأجندة والجلسات
  canManageSessions: boolean;
  canRecordDecisions: boolean;
  
  // الأدوات والمحرر والـ OCR و Google Workspace
  canAccessDocEditor: boolean;
  canAccessSmartOcr: boolean;
  canSignMemos: boolean;
  canAccessGoogleWorkspace: boolean;
  
  // التحكم في البرنامج والإدارة
  canManageSections: boolean;
  canManageUsers: boolean;
  canManageDevices: boolean;
  canViewAuditLogs: boolean;
  canEditSystemSettings: boolean;
  canEditApp?: boolean;
  canAddSections?: boolean;
  canDeleteSections?: boolean;
}

export interface License {
  id: string;
  licenseKey?: string;
  holderName: string;
  holderPhone: string;
  maxDevices: number;
  maxUsers: number;
  approvedDevices?: string[];
  issuedAt?: string;
  createdAt?: string;
  expiresAt?: string;
  status: "active" | "suspended" | "expired";
  devicesUsed?: number;
  activeDevices?: string[];
}

export interface EmailNotificationRecord {
  id: string;
  to?: string;
  toEmail?: string;
  recipientEmail?: string;
  recipientName?: string;
  subject?: string;
  body?: string;
  title?: string;
  message?: string;
  updateType?: string;
  sessionDate?: string;
  courtName?: string;
  sentBy?: string;
  sentAt: string;
  status: "sent" | "failed" | "pending";
  caseId?: string;
  caseNumber?: string;
  caseYear?: number;
  clientName?: string;
  metadata?: any;
}

export interface ConnectedDeviceRecord {
  deviceId: string;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet" | "laptop";
  os: string;
  browser: string;
  ipAddress?: string;
  location?: string;
  firstLogin: string;
  lastLogin: string;
  isCurrentDevice?: boolean;
  isTrusted?: boolean;
  isBlocked?: boolean;
  hardwareFingerprint?: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: "login" | "logout" | "failed_login" | "device_revoked" | "permission_change" | "user_created" | "user_suspended" | "password_reset" | "section_toggle" | "export_data" | "device_blocked";
  details: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  severity: "info" | "warning" | "danger" | "success";
}

export interface ProgramModuleConfig {
  id: string;
  nameArabic: string;
  nameEnglish: string;
  description: string;
  category: "core" | "legal" | "finance" | "ai_tools" | "communication" | "custom";
  iconName: string;
  emoji: string;
  isEnabled: boolean;
  allowedRoles: UserRole[];
  order: number;
  badge?: string;
  isCore?: boolean;
}

export interface OfficeDepartment {
  id: string;
  name: string;
  code: string;
  description?: string;
  headLawyerName?: string;
  headLawyerPhone?: string;
  assignedLawyers: string[];
  casesCount?: number;
  color: string;
  icon: string;
  status: "active" | "archived";
  createdAt: string;
}

export interface PlatformUser {
  id: string;
  name: string;          // الاسم رباعياً
  phone: string;         // رقم الهاتف (مفتاح تسجيل الدخول مع كلمة السر)
  passwordHash: string;  // كلمة المرور المعينة
  role: UserRole;
  isVerified: boolean;   // تأكيد ملكية رقم الهاتف
  email?: string;        // البريد الإلكتروني للمستخدم
  googleAccount?: string;
  facebookAccount?: string;
  whatsAppAccount?: string;
  status?: "active" | "suspended" | "pending"; // حالة الحساب
  officeId?: string;     // معرف مكتب المحاماة (SaaS Tenant ID)

  // Registration & Validation
  nationalIdFront?: string; // صورة بطاقة الرقم القومي (وجه)
  nationalIdBack?: string;  // صورة بطاقة الرقم القومي (ظهر)
  lawyerCard?: string;      // صورة كارنيه المحاماة
  lawFirmPhone?: string;    // رقم هاتف صاحب المكتب (خاص بالموكلين للربط بالمكتب)
  
  // Licensing & Device Management
  maxDevices?: number;         // الحد الأقصى للأجهزة (المتصفحات) المسموحة
  allowedDevices?: string[];   // قائمة بمعرفات الأجهزة المسموحة
  connectedDevices?: ConnectedDeviceRecord[]; // الأجهزة التي سجلت دخول حالياً
  lockToSingleDevice?: boolean; // قفل الحساب على جهاز واحد موثوق فقط
  trustedDeviceId?: string;     // معرف الجهاز الموثوق الوحيد
  mergedWithAccountId?: string; // في حالة دمج هذا الحساب مع حساب آخر
  assignedSerialNumber?: string; // سيريال نمبر مرتبط بهذا الحساب
  departmentId?: string;        // القسم التابع له في المكتب
  
  createdAt: string;
  lastActiveTime?: string;
  loginCount?: number;
  permissions?: Partial<UserPermissions>;
  customPermissions?: Partial<UserPermissions>;
}

export interface ClientProfile {
  officeId?: string;
  id: string;            // رقم مسلسل أو معرف فريد
  code?: string;         // كود الموكل الفريد (مثال: CL-2026-0042)
  serialNumber: number;  // رقم مسلسل لمعرفة عدد الموكلين
  name: string;          // الاسم رباعياً
  firstName?: string;    // الاسم الأول
  fatherName?: string;   // اسم الأب
  grandfatherName?: string; // اسم الجد (اختياري)
  familyName?: string;   // اللقب / العائلة (اختياري)
  capacity?: string;     // الصفة / الدور (طالب، مدعي، مدعى عليه، إلخ)
  nationalId: string;    // الرقم القومي 14 رقم
  nationalIdScan?: string; // صورة وجه البطاقة (Base64)
  nationalIdScanBack?: string; // صورة ظهر البطاقة (Base64)
  birthDate?: string;    // تاريخ الميلاد المستخرج
  age?: number;          // السن
  governorate?: string;  // محافظة الصدور
  poaNumber: string;     // رقم التوكيل
  poaLetter: string;     // الحرف الأبجدي للتوكيل
  poaYear: number;       // سنة التوكيل (2024-2044)
  poaOffice: string;     // محل التوثيق
  poaType?: string;      // نوع التوكيل (عام قضايا، خاص، عام مخصص، إلخ)
  poaScan?: string;      // صورة وجه التوكيل (Base64)
  poaScanBack?: string;  // صورة ظهر التوكيل (Base64)
  caseNumber: string;    // رقم القضية المرتبطة بها
  caseYear: number;      // سنة القضية
  competentCourt: string; // المحكمة المختصة
  subject: string;       // موضوع القضية
  phone?: string;        // رقم الهاتف
  countryCode?: string;  // كود الدولة (+20)
  whatsappCountryCode?: string; // كود واتساب
  whatsapp?: string;     // رقم واتساب
  useSamePhoneForWhatsapp?: boolean;
  address?: string;      // عنوان الموكل
  password?: string;     // الباصورد المخصص للموكل للدخول على حسابه
  email?: string;
  facebook?: string;
  linkedin?: string;
  gmail?: string;
  connectedAccounts?: {
    facebook?: boolean;
    linkedin?: boolean;
    gmail?: boolean;
    fetchedData?: any;
  };
  remainingFees: number; // باقي الأتعاب
  avatar?: string;       // الصورة الشخصية للموكل
  personalDocuments?: { id: string; name: string; fileBase64: string; addedAt: string }[];
  status?: "active" | "archived";
  createdAt: string;
}

export interface OpponentProfile {
  id: string;
  code?: string;         // كود الخصم الفريد (مثال: OP-2026-0018)
  name: string;
  phone?: string;
  nationalId?: string;
  lawyerName?: string;
  lawyerPhone?: string;
  isDifferentColor: boolean; // لتمييزهم بألوان مختلفة
}

export interface LeadProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  source: string; // Google Contacts, Excel, etc.
}

export interface CaseMilestone {
  id: string;
  type: "registered" | "first_session" | "judgment" | "appeal" | "custom";
  title: string;
  titleEn?: string;
  date: string;
  status: "completed" | "in_progress" | "upcoming" | "pending";
  decisionOrNotes?: string;
  circuitOrCourt?: string;
  appealNumber?: string;
  completedAt?: string;
}

export interface CaseRecord {
  officeId?: string;
  id: string;
  code?: string;        // كود القضية الفريد (مثال: CS-2026-0095)
  serialNumber: number; // رقم مسلسل لمعرفة عدد القضايا
  caseNumber: string;   // رقم القضية
  caseYear: number;     // سنة القضية (2024-2044)
  competentCourt: string; // المحكمة المختصة (dropdown / add new)
  courtType: string;    // نوع المحكمة (أسرة، جنح، إلخ)
  subject: string;      // اتهام / موضوع
  clientName: string;   // اسم الموكل ( dropdown من قسم الموكلين )
  clientRole: string;   // صفة الموكل (مدعي، متهم، إلخ)
  opponentName: string; // اسم الخصم
  nextSessionDate: string; // تاريخ الجلسة القادمة (YYYY-MM-DD)
  details: string;      // تفاصيل القضية
  attachments: { name: string; url: string; addedAt: string; type: "pdf" | "word" | "image" }[];
  scans: string[];      // مسحات ضوئية مضافة
  estimatedFees?: {
    minEgp: string;
    maxEgp: string;
    minUsd: string;
    maxUsd: string;
    recommendation: string;
  };
  timeline?: CaseMilestone[]; // محطات ومراحل التقاضي التفاعلية
  stage?: "registered" | "first_session" | "judgment" | "appeal" | "closed";
  status?: "active" | "archived";
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "urgent" | "general" | "court" | "administrative";
  priority: "high" | "medium" | "low";
  date: string;
  isPinned: boolean;
  showInTicker: boolean;
  author: string;
}

export interface SessionRecord {
  id: string;
  caseId: string;
  date: string;         // YYYY-MM-DD
  timeType: "morning" | "evening"; // صباحي 9 ص أو مسائي 12 م تلقائياً
  caseInfo: {
    caseNumber: string;
    caseYear: number;
    competentCourt: string;
    subject: string;
    clientName: string;
    opponentName: string;
    circuit?: string; // الدائرة
  };
  history?: {
    date: string;
    decision: string;
    requiredWork: string;
  }[];
  decision?: string;    // قرار الجلسة السابقة
  requiredWork?: string; // العمل المطلوب للجلسة القادمة
  status: "pending" | "done" | "adjourned";
}

export interface FeeTransfer {
  id: string;
  clientName: string;
  caseId?: string;
  caseNumber?: string;
  amount: number;
  currency: "EGP" | "USD"; // مصري أو أجنبي بالدولار
  type: "cash" | "bank" | "wallet"; // نقدي، محفظة إلكترونية، إلخ
  date: string;
  notes?: string;
}

export interface FeeBillingSummary {
  clientName: string;
  totalAgreed: number;
  totalPaid: number;
  totalRemaining: number;
  currency: "EGP" | "USD";
  phone: string;
  invoiceHistory: {
    invoiceNo: string;
    date: string;
    amount: number;
    type: string;
  }[];
}

export interface AdminCustomSection {
  id: string;
  nameArabic: string;
  nameEnglish: string;
  iconName: string;
  path: string;
  fields: { name: string; type: "string" | "number" | "boolean" | "date" }[];
  records: any[];
}

export interface AdminCustomProperty {
  id: string;
  entityName: "case" | "client";
  propertyNameArabic: string;
  propertyNameEnglish: string;
  propertyType: "text" | "number" | "select";
  options?: string[];
}

export interface LawCodeBook {
  id: string;
  title: string;
  category: string;
  contentMarkdown: string;
  fileName?: string;
}

export interface LegalTemplate {
  id: string;
  title: string;
  category: "defense_memo" | "claim_statement" | "contract" | "appeal" | "notice" | "poa_agreement";
  categoryArabic: string;
  description: string;
  badge?: string;
  tags: string[];
  contentTemplate: string;
  defaultCourtType?: string;
  customFields?: { key: string; label: string; defaultValue?: string; placeholder?: string }[];
}

export interface DocumentVersion {
  id: string;
  dataUrl: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SystemAttachment {
  id: string;
  name: string;
  type: "pdf" | "word" | "image" | "excel" | "scan" | "archive" | "other";
  size: string;
  dataUrl?: string;
  versions?: DocumentVersion[];
  category: "power_of_attorney" | "claim_statement" | "judgment" | "expert_report" | "national_id" | "evidence" | "defense_memo" | "receipt" | "contract" | "other";
  categoryArabic: string;
  caseId?: string;
  caseNumber?: string;
  caseYear?: number;
  clientId?: string;
  clientName?: string;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
  tags?: string[];
}

export interface SentWhatsAppAlertRecord {
  id: string;
  clientId?: string;
  clientName: string;
  phone: string;
  messageType: "session_reminder" | "documents_request" | "judgment_alert" | "signature_request" | "fee_reminder" | "custom";
  messageText: string;
  sentAt: string;
  caseNumber?: string;
  status: "sent" | "opened";
}


export interface BiometricSignatureTelemetry {
  pointCount: number;
  strokeCount: number;
  durationMs: number;
  averagePressure: number;
  peakPressure: number;
  pressureVariance: number;
  averageSpeed: number; // px/ms
  peakSpeed: number;
  boundingWidth: number;
  boundingHeight: number;
  devicePointerType: "pen" | "touch" | "mouse" | "stylus" | string;
  hardwarePressureSupported: boolean;
  behavioralFingerprint: string;
  calculatedAt: string;
  evidentiaryScore: number;
}

export interface NoteSignatureData {
  signedBy: string;
  nationalId?: string;
  signedAt: string;
  signatureImage?: string; // Data URL of signature (High-Res Transparent PNG)
  signatureVectorSvg?: string; // Scalable Vector Graphics Path (SVG)
  signatureType?: "drawn" | "digital_badge";
  verificationHash?: string;
  digitalStamp?: string;
  lawyerSignatureName?: string;
  ipOrDeviceId?: string;
  notes?: string;
  biometricTelemetry?: BiometricSignatureTelemetry;
  behavioralFingerprint?: string;
}

export interface ClientNote {
  id: string;
  clientName: string;
  text: string;
  date: string;
  priority?: "High" | "Normal" | "Low";
  category?: "Legal Document" | "Consultation" | "Fee Inquiry" | "Scheduling" | string;
  linkedAttachments?: { id: string; name: string; url: string }[];
  status?: "Pending" | "Read by Attorney" | "Acknowledged";
  scheduledReminder?: boolean;
  referencedCaseId?: string;
  attorneyReply?: string;
  // Digital signature features
  requiresSignature?: boolean;
  signatureStatus?: "none" | "pending" | "signed" | "rejected";
  signatureRequestedBy?: "lawyer" | "client";
  signatureRequestedAt?: string;
  confirmationToken?: string;
  confirmationLink?: string;
  clientPhone?: string;
  legalAffirmation?: string;
  signatureData?: NoteSignatureData;
  signatureHistory?: {
    timestamp: string;
    action: string;
    performedBy: string;
    status: "none" | "pending" | "signed" | "rejected";
    notes?: string;
  }[];
}

