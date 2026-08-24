import React, { useState, useEffect } from "react";
import { ClientProfile, CaseRecord, OpponentProfile } from "../types";
import { INITIAL_COURTS } from "../utils/staticData";
import { 
  User, 
  Upload, 
  Camera, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  CreditCard, 
  Globe, 
  Briefcase, 
  Smartphone, 
  CheckCircle2, 
  Sparkles, 
  Share2, 
  QrCode,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  Calendar,
  Lock,
  Mail
} from "lucide-react";
import { generateEntityCode, generateQrDataUrl } from "../utils/qrHelper";

interface AddClientWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClient: (client: ClientProfile, firstCase?: CaseRecord) => void;
  existingClientsCount: number;
  existingCasesCount: number;
  initialLeadData?: { name?: string; phone?: string };
}

const ARABIC_ALPHABET = [
  "أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي", "ك", "ل", "م", "ن", "س", "ع", "ف", "ص", "ق", "ر", "ش", "ت", "ث", "خ", "ذ", "ض", "ظ", "غ"
];

const POA_TYPES = [
  "توكيل عام رسمي قضايا",
  "توكيل خاص",
  "توكيل عام مخصص",
  "توكيل إدارة وبنوك وتأسيس شركات",
  "توكيل رسمي شامل عام وخاص",
  "توكيل بيع للنفس وللغير",
  "أخرى"
];

const POA_OFFICES = [
  "مكتب توثيق الأهرام النموذجي",
  "مكتب توثيق قصر النيل",
  "مكتب توثيق مصر الجديدة",
  "مكتب توثيق مدينة نصر",
  "مكتب توثيق ههيا النموذجي",
  "مكتب توثيق الزقازيق أول",
  "مكتب توثيق شمال القاهرة",
  "مكتب توثيق الجيزة النموذجي",
  "مكتب توثيق الإسكندرية النموذجي",
  "مكتب توثيق طنطا النموذجي",
  "مكتب توثيق المنصورة"
];

const CLIENT_CAPACITIES = [
  "طالب / مدعي",
  "مدعى عليه",
  "شاكي / مجني عليه",
  "مشكو في حقه / متهم",
  "مستأنف",
  "مستأنف ضده",
  "طاعن بالنقض",
  "مطعون ضده",
  "شريك / مفوض بالشركة",
  "حاضنة / وصي شرعي",
  "أخرى"
];

const COUNTRY_CODES = [
  { code: "+20", country: "مصر 🇪🇬", flag: "🇪🇬" },
  { code: "+966", country: "السعودية 🇸🇦", flag: "🇸🇦" },
  { code: "+971", country: "الإمارات 🇦🇪", flag: "🇦🇪" },
  { code: "+965", country: "الكويت 🇰🇼", flag: "🇰🇼" },
  { code: "+974", country: "قطر 🇶🇦", flag: "🇶🇦" },
  { code: "+968", country: "عُمان 🇴🇲", flag: "🇴🇲" },
  { code: "+973", country: "البحرين 🇧🇭", flag: "🇧🇭" },
  { code: "+962", country: "الأردن 🇯🇴", flag: "🇯🇴" },
  { code: "+964", country: "العراق 🇮🇶", flag: "🇮🇶" },
  { code: "+1", country: "أمريكا/كندا 🇺🇸", flag: "🇺🇸" },
  { code: "+44", country: "بريطانيا 🇬🇧", flag: "🇬🇧" },
  { code: "+33", country: "فرنسا 🇫🇷", flag: "🇫🇷" },
  { code: "+49", country: "ألمانيا 🇩🇪", flag: "🇩🇪" }
];

export default function AddClientWizardModal({
  isOpen,
  onClose,
  onSaveClient,
  existingClientsCount,
  existingCasesCount,
  initialLeadData
}: AddClientWizardModalProps) {
  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Auto-generated Unique Codes
  const [clientCode] = useState(() => generateEntityCode("CL", existingClientsCount + 1));
  const [caseCode] = useState(() => generateEntityCode("CS", existingCasesCount + 1));
  const [clientQrUrl, setClientQrUrl] = useState("");

  useEffect(() => {
    generateQrDataUrl(clientCode).then(url => setClientQrUrl(url));
  }, [clientCode]);

  // ==========================================
  // STEP 1: Basic Info, Role, 4 Names, Phone, WhatsApp & POA
  // ==========================================
  const [capacity, setCapacity] = useState(CLIENT_CAPACITIES[0]);
  const [avatar, setAvatar] = useState<string>("");

  // 4 Separate Name inputs
  const [firstName, setFirstName] = useState(initialLeadData?.name?.split(" ")[0] || "");
  const [fatherName, setFatherName] = useState(initialLeadData?.name?.split(" ")[1] || "");
  const [grandfatherName, setGrandfatherName] = useState(initialLeadData?.name?.split(" ")[2] || "");
  const [familyName, setFamilyName] = useState(initialLeadData?.name?.split(" ").slice(3).join(" ") || "");

  // Phone and WhatsApp
  const [countryCode, setCountryCode] = useState("+20");
  const [phone, setPhone] = useState(initialLeadData?.phone || "");
  const [samePhoneForWhatsapp, setSamePhoneForWhatsapp] = useState(true);
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("+20");
  const [whatsappPhone, setWhatsappPhone] = useState("");

  // Power of Attorney (التوكيل)
  const [poaNumber, setPoaNumber] = useState("");
  const [poaLetter, setPoaLetter] = useState("أ");
  const [poaYear, setPoaYear] = useState("2026");
  const [poaType, setPoaType] = useState(POA_TYPES[0]);
  const [poaOffice, setPoaOffice] = useState(POA_OFFICES[0]);
  const [poaScanFront, setPoaScanFront] = useState<string>("");
  const [poaScanBack, setPoaScanBack] = useState<string>("");

  // ==========================================
  // STEP 2: National ID, Address, Age & ID Cards
  // ==========================================
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [governorate, setGovernorate] = useState("");
  const [nationalIdScanFront, setNationalIdScanFront] = useState<string>("");
  const [nationalIdScanBack, setNationalIdScanBack] = useState<string>("");
  const [isBothSidesInOneImage, setIsBothSidesInOneImage] = useState(false);

  // Extract metadata automatically from Egyptian 14-digit National ID
  useEffect(() => {
    if (nationalId.length === 14 && /^\d+$/.test(nationalId)) {
      const centuryDigit = nationalId.charAt(0);
      const yearPart = nationalId.substring(1, 3);
      const monthPart = nationalId.substring(3, 5);
      const dayPart = nationalId.substring(5, 7);
      const govCode = nationalId.substring(7, 9);

      const century = centuryDigit === "2" ? "19" : centuryDigit === "3" ? "20" : "19";
      const fullYear = parseInt(`${century}${yearPart}`, 10);
      const formattedDate = `${fullYear}-${monthPart}-${dayPart}`;
      setBirthDate(formattedDate);

      const currentYear = 2026;
      const calculatedAge = currentYear - fullYear;
      setAge(calculatedAge > 0 ? calculatedAge : 30);

      const govMap: Record<string, string> = {
        "01": "القاهرة", "02": "الإسكندرية", "03": "بورسعيد", "04": "السويس",
        "11": "دمياط", "12": "الدقهلية", "13": "الشرقية", "14": "القليوبية",
        "15": "كفر الشيخ", "16": "الغربية", "17": "المنوفية", "18": "البحيرة",
        "19": "الإسماعيلية", "21": "الجيزة", "22": "بني سويف", "23": "الفيوم",
        "24": "المنيا", "25": "أسيوط", "26": "سوهاج", "27": "قنا",
        "28": "أسوان", "29": "الأقصر", "31": "البحر الأحمر", "32": "الوادي الجديد",
        "33": "مطروح", "34": "شمال سيناء", "35": "جنوب سيناء", "88": "خارج الجمهورية"
      };
      setGovernorate(govMap[govCode] || "جمهورية مصر العربية");
    }
  }, [nationalId]);

  // ==========================================
  // STEP 3: Social Media & Auto Connect (Facebook, LinkedIn, Gmail)
  // ==========================================
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [gmail, setGmail] = useState("");
  const [connectedFacebook, setConnectedFacebook] = useState(false);
  const [connectedLinkedin, setConnectedLinkedin] = useState(false);
  const [connectedGmail, setConnectedGmail] = useState(false);
  const [isConnectingAccount, setIsConnectingAccount] = useState<string | null>(null);

  const handleSimulateSocialConnect = (network: "facebook" | "linkedin" | "gmail") => {
    setIsConnectingAccount(network);
    setTimeout(() => {
      setIsConnectingAccount(null);
      const fullName = [firstName, fatherName, grandfatherName, familyName].filter(Boolean).join(" ") || "الموكل المعتمد";
      const cleanName = fullName.toLowerCase().replace(/\s+/g, ".");

      if (network === "facebook") {
        setFacebook(`https://facebook.com/${cleanName}`);
        setConnectedFacebook(true);
      } else if (network === "linkedin") {
        setLinkedin(`https://linkedin.com/in/${cleanName}`);
        setConnectedLinkedin(true);
      } else if (network === "gmail") {
        setGmail(`${cleanName}@gmail.com`);
        setConnectedGmail(true);
      }
      alert(`تم بنجاح الاتصال الآمن بحساب ${network.toUpperCase()} وجلب بيانات الموكل وتوثيقها!`);
    }, 800);
  };

  const handleConnectAllThree = () => {
    handleSimulateSocialConnect("facebook");
    setTimeout(() => handleSimulateSocialConnect("linkedin"), 400);
    setTimeout(() => handleSimulateSocialConnect("gmail"), 800);
  };

  // ==========================================
  // STEP 4: First Case Optional Information
  // ==========================================
  const [includeCase, setIncludeCase] = useState(false);
  const [caseNumber, setCaseNumber] = useState("");
  const [caseYear, setCaseYear] = useState(2026);
  const [competentCourt, setCompetentCourt] = useState(INITIAL_COURTS[0] || "محكمة استئناف القاهرة");
  const [courtType, setCourtType] = useState("مدني كلي");
  const [caseSubject, setCaseSubject] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [caseFees, setCaseFees] = useState("15000");

  // File Upload Helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (b64: string) => void, isDualIdCard = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      if (b64) {
        setter(b64);
        if (isDualIdCard) {
          // If user checked "both sides in one image", set back side too
          setNationalIdScanBack(b64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Build Full Client Object
  const getFullClientObject = (): ClientProfile => {
    const fullName = [firstName.trim(), fatherName.trim(), grandfatherName.trim(), familyName.trim()]
      .filter(Boolean)
      .join(" ");

    const effectiveWhatsapp = samePhoneForWhatsapp ? `${countryCode}${phone}` : `${whatsappCountryCode}${whatsappPhone}`;
    const autoPassword = "cl-" + Math.floor(100 + Math.random() * 900).toString();

    return {
      id: "cl-" + Date.now(),
      code: clientCode,
      serialNumber: existingClientsCount + 1,
      name: fullName || "موكل جديد",
      firstName: firstName.trim(),
      fatherName: fatherName.trim(),
      grandfatherName: grandfatherName.trim(),
      familyName: familyName.trim(),
      capacity,
      avatar: avatar || undefined,
      nationalId: nationalId || "قيد الاستيفاء",
      nationalIdScan: nationalIdScanFront || undefined,
      nationalIdScanBack: nationalIdScanBack || undefined,
      birthDate: birthDate || undefined,
      age: typeof age === "number" ? age : undefined,
      governorate: governorate || undefined,
      poaNumber: poaNumber || "قيد الاستخراج",
      poaLetter,
      poaYear: parseInt(poaYear, 10) || 2026,
      poaOffice,
      poaType,
      poaScan: poaScanFront || undefined,
      poaScanBack: poaScanBack || undefined,
      caseNumber: caseNumber || "قيد التعيين",
      caseYear: caseYear || 2026,
      competentCourt,
      subject: caseSubject || "دعوى قضائية عامة",
      phone: phone ? `${countryCode}${phone}` : undefined,
      countryCode,
      whatsappCountryCode: samePhoneForWhatsapp ? countryCode : whatsappCountryCode,
      whatsapp: effectiveWhatsapp,
      useSamePhoneForWhatsapp: samePhoneForWhatsapp,
      address: address || undefined,
      password: autoPassword,
      email: gmail || undefined,
      facebook: facebook || undefined,
      linkedin: linkedin || undefined,
      gmail: gmail || undefined,
      connectedAccounts: {
        facebook: connectedFacebook,
        linkedin: connectedLinkedin,
        gmail: connectedGmail
      },
      remainingFees: parseFloat(caseFees) || 10000,
      createdAt: new Date().toISOString()
    };
  };

  // Final Finish Handler
  const handleFinalFinish = () => {
    if (!firstName.trim() || !fatherName.trim()) {
      alert("يرجى إدخال الاسم الأول واسم الأب على الأقل لإتمام تسجيل الموكل.");
      setCurrentStep(1);
      return;
    }

    const client = getFullClientObject();
    let firstCaseRecord: CaseRecord | undefined;

    if (includeCase && caseNumber) {
      firstCaseRecord = {
        id: "cs-" + Date.now(),
        code: caseCode,
        serialNumber: existingCasesCount + 1,
        caseNumber,
        caseYear,
        competentCourt,
        courtType,
        subject: caseSubject || "دعوى قضائية",
        clientName: client.name,
        clientRole: capacity,
        opponentName: opponentName || "الخصم المطلوب إعلانه",
        nextSessionDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        details: `قضية مقيدة تلقائياً مع تسجيل الموكل: ${client.name}\nكود الموكل: ${client.code}\nرقم التوكيل: ${client.poaNumber} ${client.poaLetter} لسنة ${client.poaYear}`,
        attachments: [],
        scans: [],
        createdAt: new Date().toISOString()
      };
    }

    onSaveClient(client, firstCaseRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans text-right" dir="rtl">
      <div className="bg-[#f7faf3] dark:bg-[#121c13] text-[#1c2a1c] dark:text-[#ecf3eb] border-2 border-[#b5cda5] dark:border-[#2f462f] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* ========================================================================= */}
        {/* HEADER BAR & STEP PROGRESS INDICATOR                                     */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-[#203622] via-[#2c472f] to-[#203622] text-white p-5 border-b border-[#3d5e41] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  {clientCode}
                </span>
                <span className="text-[11px] font-bold text-amber-200">
                  منظومة القيد الرقمي للموكلين
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black">إدراج وتوثيق موكل جديد بالديوان</h2>
            </div>
          </div>

          {/* Step Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[
              { num: 1, label: "البيانات والتوكيل" },
              { num: 2, label: "الرقم القومي" },
              { num: 3, label: "التواصل والربط" },
              { num: 4, label: "القضايا والإنهاء" }
            ].map(s => {
              const isCurr = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num as any)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isCurr 
                      ? "bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300" 
                      : isPast 
                      ? "bg-emerald-600/80 text-white" 
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  <span>{isPast ? "✓" : s.num}</span>
                  <span className="hidden md:inline">{s.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-lg font-bold mr-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY (STEP CONTENT)                                                 */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 [scrollbar-width:none]">
          
          {/* ========================================================================= */}
          {/* STEP 1: Role, Top-Left Photo Box, 4-Part Name, Phones, and POA           */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* TOP ROW: Capacity Selector + Top-Left Photo Upload Box */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-[#c1d6b3] dark:border-slate-800 shadow-sm">
                
                {/* Right / Center: Capacity & Intro */}
                <div className="md:col-span-8 space-y-3">
                  <div>
                    <label className="block text-xs font-black text-[#223321] dark:text-[#d3e3d1] mb-1.5">
                      1. اختيار الصفة أو الدور القانوني للموكل *
                    </label>
                    <select
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-2 border-amber-500/60 font-black text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {CLIENT_CAPACITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 font-bold flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span>
                      كود الموكل الموحد: <strong className="font-mono text-xs">{clientCode}</strong> (سيتم تضمين QR Code في كافة مذكرات ومستندات الطباعة).
                    </span>
                  </div>
                </div>

                {/* Top-Left: Dedicated Square Profile Photo Box */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border-2 border-dashed border-[#a8c59b] dark:border-slate-700 text-center">
                  <div className="relative w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-inner flex items-center justify-center mb-2 border border-amber-400">
                    {avatar ? (
                      <img src={avatar} alt="Client Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-slate-400" />
                    )}
                    
                    <label className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
                      <Camera className="w-5 h-5 mb-1" />
                      <span>{avatar ? "تغيير الصورة" : "رفع صورة"}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, setAvatar)} 
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-1">
                    <label className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg cursor-pointer transition shadow-sm">
                      رفع الصورة
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, setAvatar)} 
                      />
                    </label>
                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar("")}
                        className="px-2 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-[10px] font-bold"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">مربع الصورة الشخصية (أعلى اليسار)</span>
                </div>
              </div>

              {/* 4 SEPARATE NAME INPUTS */}
              <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-[#c1d6b3] dark:border-slate-800 shadow-sm space-y-3">
                <label className="block text-xs font-black text-[#223321] dark:text-[#d3e3d1]">
                  2. الاسم رباعياً (4 خانات منفصلة - الخانة 1 و 2 إجبارية، و 3 و 4 اختيارية) *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      الاسم الأول *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="مثال: وسام"
                      className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      اسم الأب *
                    </label>
                    <input
                      type="text"
                      required
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="مثال: حمدي"
                      className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      اسم الجد (اختياري)
                    </label>
                    <input
                      type="text"
                      value={grandfatherName}
                      onChange={(e) => setGrandfatherName(e.target.value)}
                      placeholder="مثال: عبد الرحمن"
                      className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      اللقب / العائلة (اختياري)
                    </label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="مثال: الشناوي"
                      className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-slate-800 dark:text-slate-200">
                  الاسم الرباعي الكامل المعتمد:{" "}
                  <span className="text-amber-600 dark:text-amber-400">
                    {[firstName, fatherName, grandfatherName, familyName].filter(Boolean).join(" ") || "—"}
                  </span>
                </div>
              </div>

              {/* PHONES & WHATSAPP ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-[#c1d6b3] dark:border-slate-800 shadow-sm">
                
                {/* Main Phone with Country Codes */}
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    3. رقم الهاتف المحمول (كود دولي + رقم) *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-28 p-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="flex-1 p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* WhatsApp Phone with disable/copy toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                      4. حساب واتساب (WhatsApp)
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={samePhoneForWhatsapp}
                        onChange={(e) => setSamePhoneForWhatsapp(e.target.checked)}
                        className="w-3.5 h-3.5 text-emerald-600 rounded"
                      />
                      <span>نفس رقم الهاتف الأول</span>
                    </label>
                  </div>

                  <div className={`flex gap-2 transition-opacity ${samePhoneForWhatsapp ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
                    <select
                      value={whatsappCountryCode}
                      onChange={(e) => setWhatsappCountryCode(e.target.value)}
                      disabled={samePhoneForWhatsapp}
                      className="w-28 p-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      disabled={samePhoneForWhatsapp}
                      value={samePhoneForWhatsapp ? phone : whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder={samePhoneForWhatsapp ? "مطابق لرقم الهاتف الأول" : "رقم واتساب مخصص"}
                      className="flex-1 p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* POWER OF ATTORNEY (بيانات التوكيل والمكتب) */}
              <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-[#c1d6b3] dark:border-slate-800 shadow-sm space-y-3">
                <label className="block text-xs font-black text-[#223321] dark:text-[#d3e3d1]">
                  5. بيانات التوكيل الرسمي وتوثيقه (رقم التوكيل + الحرف الأبجدي + تقويم السنوات) *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* POA Number */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      رقم التوكيل *
                    </label>
                    <input
                      type="text"
                      value={poaNumber}
                      onChange={(e) => setPoaNumber(e.target.value)}
                      placeholder="مثال: 1450"
                      className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Clean Alphabet Letters Dropdown without extra confusing text */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      الحرف الأبجدي *
                    </label>
                    <select
                      value={poaLetter}
                      onChange={(e) => setPoaLetter(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-center"
                    >
                      {ARABIC_ALPHABET.map((letter) => (
                        <option key={letter} value={letter}>
                          {letter}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Years Calendar Only */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      سنة التوكيل *
                    </label>
                    <select
                      value={poaYear}
                      onChange={(e) => setPoaYear(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-center"
                    >
                      {Array.from({ length: 15 }, (_, i) => 2020 + i).map((yr) => (
                        <option key={yr} value={yr.toString()}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      نوع التوكيل
                    </label>
                    <select
                      value={poaType}
                      onChange={(e) => setPoaType(e.target.value)}
                      className="w-full p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                    >
                      {POA_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      مكان مكتب التوثيق
                    </label>
                    <select
                      value={poaOffice}
                      onChange={(e) => setPoaOffice(e.target.value)}
                      className="w-full p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                    >
                      {POA_OFFICES.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* POA Scans (Front + Optional Back) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">صورة التوكيل (الوجه)</span>
                      <span className="text-[10px] text-slate-500">{poaScanFront ? "تم الرفع بنجاح ✓" : "لم يتم إرفاق ملف"}</span>
                    </div>
                    <label className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg cursor-pointer transition">
                      {poaScanFront ? "تغيير" : "رفع الوجه"}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, setPoaScanFront)} />
                    </label>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">صورة التوكيل (الظهر - اختياري)</span>
                      <span className="text-[10px] text-slate-500">{poaScanBack ? "تم الرفع بنجاح ✓" : "إمكانية إضافة الظهر"}</span>
                    </div>
                    <label className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-black text-xs rounded-lg cursor-pointer transition">
                      {poaScanBack ? "تغيير" : "رفع الظهر"}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, setPoaScanBack)} />
                    </label>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: National ID, Address, Age & 2 ID Card Scans (Front + Back)        */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-[#c1d6b3] dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#223321] dark:text-[#d3e3d1] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span>الرقم القومي وبيانات الهوية والعنوان</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* National ID */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                      الرقم القومي (14 رقماً) *
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="مثال: 29508151301234"
                      className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold tracking-widest focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Detailed Address */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                      العنوان بالتفصيل *
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="محافظة - مركز / قسم - شارع - رقم العقار..."
                      className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Auto Extracted Age & Birthdate */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">السن المحسوب:</span>
                    <span className="font-black text-amber-700 dark:text-amber-300 text-sm">
                      {age ? `${age} سنة` : "يُستخرج من الرقم القومي"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">تاريخ الميلاد:</span>
                    <span className="font-black text-amber-700 dark:text-amber-300 text-sm">
                      {birthDate || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">محافظة الصدور:</span>
                    <span className="font-black text-amber-700 dark:text-amber-300 text-sm">
                      {governorate || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ID CARD SCANS (TWO SIDE-BY-SIDE BOXES OR SINGLE MERGED UPLOAD) */}
              <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-[#c1d6b3] dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-black text-[#223321] dark:text-[#d3e3d1]">
                      خانتان جانبيتان لرفع بطاقة الرقم القومي (وجه + ظهر)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      يمكن رفع وجه وظهر منفصلين، أو اختيار رفع الجهتين في صورة واحدة
                    </p>
                  </div>

                  <label className="flex items-center gap-2 p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-xs font-black text-amber-900 dark:text-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBothSidesInOneImage}
                      onChange={(e) => setIsBothSidesInOneImage(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>إدخال الجهتين على صورة واحدة (إدراج الظهر تلقائياً)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Front Side */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-full h-32 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-300">
                      {nationalIdScanFront ? (
                        <img src={nationalIdScanFront} alt="ID Front" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-slate-400 text-xs flex flex-col items-center">
                          <CreditCard className="w-8 h-8 mb-1" />
                          <span>وجه البطاقة</span>
                        </div>
                      )}
                    </div>
                    <label className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition shadow-sm">
                      {nationalIdScanFront ? "تغيير وجه البطاقة" : "رفع وجه البطاقة"}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, setNationalIdScanFront, isBothSidesInOneImage)} 
                      />
                    </label>
                  </div>

                  {/* Back Side */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-full h-32 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-300">
                      {nationalIdScanBack ? (
                        <img src={nationalIdScanBack} alt="ID Back" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-slate-400 text-xs flex flex-col items-center">
                          <CreditCard className="w-8 h-8 mb-1" />
                          <span>ظهر البطاقة (اختياري)</span>
                        </div>
                      )}
                    </div>
                    <label className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-black text-xs rounded-xl cursor-pointer transition">
                      {nationalIdScanBack ? "تغيير ظهر البطاقة" : "رفع ظهر البطاقة"}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, setNationalIdScanBack)} 
                      />
                    </label>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Social Media Accounts & Auto-Connect (FB, LinkedIn, Gmail)        */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-[#c1d6b3] dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-black text-[#223321] dark:text-[#d3e3d1] flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <span>ربط حسابات التواصل الاجتماعي (Facebook & LinkedIn & Gmail)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      يمكن ربط حساب واحد أو ربط الحسابات الثلاثة مع الاتصال التلقائي وجلب البيانات الشخصية
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectAllThree}
                    className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>ربط الحسابات الثلاثة تلقائياً بنقرة واحدة</span>
                  </button>
                </div>

                {/* 1. Facebook */}
                <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <span>🔵 Facebook Account</span>
                      {connectedFacebook && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSimulateSocialConnect("facebook")}
                      disabled={isConnectingAccount === "facebook"}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg cursor-pointer transition shadow-sm"
                    >
                      {isConnectingAccount === "facebook" ? "جاري الاتصال..." : connectedFacebook ? "إعادة الربط ✓" : "اتصال تلقائي"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="رابط حساب فيسبوك أو اسم المستخدم..."
                    className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* 2. LinkedIn */}
                <div className="p-4 bg-sky-50/60 dark:bg-sky-950/20 rounded-2xl border border-sky-200 dark:border-sky-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                      <span>🔷 LinkedIn Profile</span>
                      {connectedLinkedin && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSimulateSocialConnect("linkedin")}
                      disabled={isConnectingAccount === "linkedin"}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] rounded-lg cursor-pointer transition shadow-sm"
                    >
                      {isConnectingAccount === "linkedin" ? "جاري الاتصال..." : connectedLinkedin ? "إعادة الربط ✓" : "اتصال تلقائي"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="رابط ملف لينكد إن أو المعرف المهني..."
                    className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-800 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {/* 3. Gmail */}
                <div className="p-4 bg-red-50/60 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-red-900 dark:text-red-200 flex items-center gap-1.5">
                      <span>🔴 Google / Gmail Account</span>
                      {connectedGmail && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSimulateSocialConnect("gmail")}
                      disabled={isConnectingAccount === "gmail"}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg cursor-pointer transition shadow-sm"
                    >
                      {isConnectingAccount === "gmail" ? "جاري الاتصال..." : connectedGmail ? "إعادة الربط ✓" : "اتصال تلقائي"}
                    </button>
                  </div>
                  <input
                    type="email"
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: First Case Optional Entry & Final Finish                          */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Toggle to add a case now */}
              <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-[#c1d6b3] dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-6 h-6 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      قيد قضية أو دعوى قضائية فورية تابعة للموكل
                    </h3>
                    <p className="text-xs text-slate-500">
                      يمكنك ربط أول قضية مباشرة الآن، أو الضغط على "إنهاء" لحفظ الموكل فقط
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCase}
                    onChange={(e) => setIncludeCase(e.target.checked)}
                    className="w-4 h-4 text-slate-950 rounded"
                  />
                  <span>تفعيل إدخال بيانات القضية الآن</span>
                </label>
              </div>

              {includeCase && (
                <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-[#c1d6b3] dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-xs font-black text-amber-900 dark:text-amber-200">
                    <span>كود القضية المقترح:</span>
                    <span className="font-mono text-sm">{caseCode}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                        رقم القضية *
                      </label>
                      <input
                        type="text"
                        value={caseNumber}
                        onChange={(e) => setCaseNumber(e.target.value)}
                        placeholder="مثال: 5421"
                        className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                        سنة القضية *
                      </label>
                      <input
                        type="number"
                        value={caseYear}
                        onChange={(e) => setCaseYear(parseInt(e.target.value, 10) || 2026)}
                        className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                        المحكمة المختصة
                      </label>
                      <select
                        value={competentCourt}
                        onChange={(e) => setCompetentCourt(e.target.value)}
                        className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                      >
                        {INITIAL_COURTS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                        اسم الخصم
                      </label>
                      <input
                        type="text"
                        value={opponentName}
                        onChange={(e) => setOpponentName(e.target.value)}
                        placeholder="اسم الخصم في الدعوى..."
                        className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                        موضوع الدعوى / الاتهام
                      </label>
                      <input
                        type="text"
                        value={caseSubject}
                        onChange={(e) => setCaseSubject(e.target.value)}
                        placeholder="مثال: دعوى صحة ونفاذ عقد بيع / طرد للغصب..."
                        className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Card Before Final Submission */}
              <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-lg flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="text-base font-black">جاهز للاعتماد وتوليد بطاقة الموكل الرقمية</h4>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    الاسم: {[firstName, fatherName, grandfatherName, familyName].filter(Boolean).join(" ")} | الكود: {clientCode}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {clientQrUrl && (
                    <img src={clientQrUrl} alt="Client QR" className="w-12 h-12 rounded-lg bg-white p-0.5" />
                  )}
                  <button
                    type="button"
                    onClick={handleFinalFinish}
                    className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition"
                  >
                    إنهاء وحفظ الموكل الآن ✓
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER BUTTONS (PREV, NEXT, FINISH)                                */}
        {/* ========================================================================= */}
        <div className="bg-slate-100 dark:bg-slate-900/90 p-4 border-t border-[#c1d6b3] dark:border-slate-800 flex items-center justify-between gap-3">
          
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && (!firstName.trim() || !fatherName.trim())) {
                    alert("يرجى إدخال الاسم الأول واسم الأب للانتقال للخطوة التالية.");
                    return;
                  }
                  setCurrentStep((prev) => (prev + 1) as any);
                }}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalFinish}
                className="px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition"
              >
                <Check className="w-4 h-4" />
                <span>إنهاء وتسجيل الموكل</span>
              </button>
            )}

            {currentStep < 4 && (
              <button
                type="button"
                onClick={handleFinalFinish}
                className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl cursor-pointer transition border border-emerald-500/30"
              >
                إنهاء وحفظ فوري
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
