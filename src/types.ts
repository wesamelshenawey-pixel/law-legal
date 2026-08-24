export enum UserRole {
  ADMIN = "admin",       // الأستاذ الكبير وسام الشناوي
  STAFF = "staff",       // السكرتارية والمحامين بالمكتب
  CLIENT = "client",     // الموكلون المسجلون
  SEEKER = "seeker",     // طالب الخدمة / استشارة قانونية
  OPPONENT = "opponent"  // خصم مسجل
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
  
  // Licensing & Device Management
  maxDevices?: number;         // الحد الأقصى للأجهزة (المتصفحات) المسموحة
  allowedDevices?: string[];   // قائمة بمعرفات الأجهزة المسموحة
  connectedDevices?: {         // الأجهزة التي سجلت دخول حالياً
    deviceId: string;
    deviceName: string;
    lastLogin: string;
  }[];
  mergedWithAccountId?: string; // في حالة دمج هذا الحساب مع حساب آخر
  assignedSerialNumber?: string; // سيريال نمبر مرتبط بهذا الحساب

  createdAt: string;
  permissions?: {
    canEditApp: boolean;
    canAddSections: boolean;
  };
}

export interface ClientProfile {
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

export interface CaseRecord {
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

export interface EmailNotificationRecord {
  id: string;
  toEmail: string;
  clientName: string;
  caseId?: string;
  caseNumber?: string;
  caseYear?: number;
  courtName?: string;
  title: string;
  message: string;
  updateType: "case_status_update" | "session_update" | "decision_recorded" | "general_legal_notice";
  sessionDate?: string;
  decision?: string;
  status: "sent" | "delivered" | "failed";
  sentAt: string;
  sentBy?: string;
}

