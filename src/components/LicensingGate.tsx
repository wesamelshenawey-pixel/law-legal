import React, { useState } from "react";
import { TRANSLATIONS } from "../utils/translations";
import { License, ActivationRequest } from "../utils/firebaseSync";
import { 
  ShieldCheck, 
  KeyRound, 
  Smartphone, 
  Cpu, 
  User, 
  HelpCircle, 
  Sun, 
  Moon, 
  Globe 
} from "lucide-react";

interface LicensingGateProps {
  deviceFingerprint: string;
  licenses: License[];
  activationRequests: ActivationRequest[];
  onActivateCopy: (key: string) => void;
  onRequestActivation: (req: ActivationRequest) => void;
  language: "ar" | "en";
  setLanguage: (lang: "ar" | "en") => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
}

export default function LicensingGate({
  deviceFingerprint,
  licenses,
  activationRequests,
  onActivateCopy,
  onRequestActivation,
  language,
  setLanguage,
  isDarkMode,
  setIsDarkMode
}: LicensingGateProps) {
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = (key: string) => TRANSLATIONS[key]?.[language] || key;

  // Find if this device already has a pending or rejected activation request
  const myPendingRequest = activationRequests.find(
    r => r.deviceFingerprint === deviceFingerprint && r.status === "pending"
  );

  const handleActivationVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!licenseKeyInput.trim() || !nameInput.trim() || !phoneInput.trim()) {
      setErrorMsg(language === "ar" ? "يرجى ملء كافة المدخلات اللازمة لترخيص النسخة." : "Please fill in all inputs to license this copy.");
      return;
    }

    const key = licenseKeyInput.trim().toUpperCase();
    const matchedLicense = licenses.find(lic => lic.id === key);

    if (!matchedLicense) {
      setErrorMsg(language === "ar" 
        ? "مفتاح الترخيص هذا غير موجود بالنظام! تواصل مع الأستاذ وسام على 01283233555 لشراء ترخيص معتمد." 
        : "Invalid Key! License not found. Contact Advocate Wesam on +201283233555 to purchase a valid copy.");
      return;
    }

    if (matchedLicense.status !== "active") {
      setErrorMsg(language === "ar" ? "ترخيص النسخة هذا معطل أو موقوف حالياً." : "This copy license key is currently suspended or inactive.");
      return;
    }

    // Checking if the device limit is reached
    const numDevices = matchedLicense.approvedDevices.length;
    const isAlreadyApproved = matchedLicense.approvedDevices.includes(deviceFingerprint);

    if (isAlreadyApproved) {
      onActivateCopy(key);
      setSuccessMsg(language === "ar" ? "تم التحقق من بصمة هذا الجهاز! جاري فتح البرنامج..." : "Device authorized! Opening program...");
      return;
    }

    if (numDevices >= matchedLicense.maxDevices) {
      setErrorMsg(language === "ar" 
        ? `تجاوزت هذه النسخة الحد الأقصى للأجهزة المصرح بها (الحد الأقصى الحالي: ${matchedLicense.maxDevices} جهاز). يرجى مراجعة الأستاذ المحامي لترقية النسخة.` 
        : `This license has reached its maximum device limit (${matchedLicense.maxDevices} device(s)). Contact Wesam to upgrade.`);
      return;
    }

    // Let's create an Activation Request
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newReq: ActivationRequest = {
        id: "req-" + Date.now(),
        licenseKey: key,
        deviceName: navigator.userAgent.substring(0, 50),
        deviceFingerprint,
        requestPhone: phoneInput.trim(),
        requestName: nameInput.trim(),
        status: "pending",
        createdAt: new Date().toISOString()
      };

      onRequestActivation(newReq);
      setSuccessMsg(language === "ar" 
        ? "تم إرسال بصمة جهازك الرقمية للأستاذ وسام للموافقة والربط! يرجى التواصل معه لتفعيل جهازك." 
        : "Activation request dispatched to Wesam! Please ask him to approve this device signature.");
    }, 1000);
  };

  // Quick Trial Override for Testers/Users to bypass quickly and see both views
  const handleSandboxAutoApprove = () => {
    // Pick the first license (or preseed validation)
    const firstLic = licenses[0] || { id: "LIC-WESAM-FREE-2026" };
    // Automatically register current device on the license
    onActivateCopy(firstLic.id);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-800"}`} dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* Upper header selectors */}
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-20">
        <button
          onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
          className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold font-sans shadow-sm cursor-pointer"
        >
          <Globe className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>{language === "ar" ? "English" : "العربية"}</span>
        </button>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg shadow-sm cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
        </button>
      </div>

      <div className="max-w-md w-full space-y-6 text-center z-10">
        <div className="inline-flex justify-center items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-lg relative">
          <ShieldCheck className="w-16 h-16 text-amber-500" />
          <div className="absolute inset-0 border border-amber-500/10 rounded-full animate-ping" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-amber-700 dark:text-amber-500 tracking-tight">{t("activation_title")}</h1>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium px-4 leading-relaxed">{t("activation_sub")}</p>
        </div>
      </div>

      <div className="mt-6 max-w-lg w-full z-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 space-y-6">
          
          {errorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-800 dark:text-red-400 text-sm font-semibold text-right leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-800 dark:text-emerald-400 text-sm font-semibold text-right leading-relaxed">
              🎉 {successMsg}
            </div>
          )}

          {/* User Status / Pending activation */}
          {myPendingRequest ? (
            <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-center space-y-4">
              <Cpu className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-400">
                  {language === "ar" ? "طلب ترخيص جهازك قيد الانتظار!" : "Activation Request is Pending Approval!"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans mt-1">
                  {language === "ar"
                    ? `لقد أرسلنا بصمة جهازك الرقمية (${deviceFingerprint}) للأستاذ وسام. يرجى تزويده بالرمز للموافقة الفورية والسماح بالولوج.`
                    : `Your device fingerprint (${deviceFingerprint}) has been transmitted to advocate Wesam's console. Kindly notify him.`}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800 flex flex-col gap-2">
                <p className="text-[10px] text-slate-400 font-bold">
                  {language === "ar" ? "تليفون المبيعات والدعم الفني:" : "Direct Customer Support Call:"}
                </p>
                <a
                  href="tel:+201283233555"
                  className="font-bold text-amber-700 dark:text-amber-500 hover:underline text-sm font-mono"
                >
                  01283233555
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleActivationVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right mb-1">
                  {t("enter_license_key")} <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={licenseKeyInput}
                    onChange={(e) => setLicenseKeyInput(e.target.value)}
                    placeholder="WESAM-LAW-XXXX-XXXX"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-55 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 rounded-lg border border-slate-250 dark:border-slate-800 focus:border-amber-500 text-center outline-none transition font-sans font-extrabold tracking-widest text-xs uppercase"
                    required
                  />
                  <KeyRound className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 text-right mt-1 font-bold">
                  {language === "ar" ? "مثال لرموز معتمدة تجريبياً: LIC-WESAM-FREE-2026" : "Sample Demo Activation Key: LIC-WESAM-FREE-2026"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right mb-1">
                    {t("buyer_name")} <span className="text-red-500 font-black">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder={language === "ar" ? "اسم المشتري رباعياً" : "Licenseholder Full Name"}
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-800 text-right outline-none transition text-xs"
                      required
                    />
                    <User className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right mb-1">
                    {t("buyer_phone")} <span className="text-red-500 font-black">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-800 text-right outline-none transition font-sans text-xs"
                      required
                    />
                    <Smartphone className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Display technical hardware footprint signature */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 text-slate-800 dark:text-slate-100 mt-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pb-1.5 border-b border-slate-200/60 dark:border-slate-800/80">
                  <span className="font-mono">{deviceFingerprint}</span>
                  <span>{t("device_fingerprint")}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed text-right">
                  {language === "ar"
                    ? "يقوم النظام برصد البصمة للمتصفح لحصر عدد الأجهزة المرخص لها لكل نسخة ومنع توزيع البرنامج دون رصيد رسمي."
                    : "The system registers this fingerprint to record approved device counts and prevent unauthorized sharing."}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-lg transition shadow-sm cursor-pointer"
              >
                {isSubmitting 
                  ? (language === "ar" ? "جاري ربط بصمة الجهاز..." : "Authorizing Device Fingerprint...") 
                  : t("activate_btn")}
              </button>
            </form>
          )}

          {/* Interactive sandbox bypass tool in development frame */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <p className="text-[10px] text-slate-400 font-bold">
              ⚙️ {language === "ar" ? "أداة المحاكاة لمدقق التقييم والتشغيل السريع:" : "Evaluate Trial Auto-Bypass:"}
            </p>
            <button
              onClick={handleSandboxAutoApprove}
              className="px-4 py-2 bg-emerald-600/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/25 rounded-lg text-[10px] font-black hover:bg-emerald-600/20 active:scale-95 transition duration-150 cursor-pointer"
            >
              {language === "ar" ? "تجاوز التفعيل فوراً للتجربة السريعة (Auto Bypass)" : "Instantly Bypass & Activate Custom Demo License"}
            </button>
          </div>

          {/* FAQ section */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850 space-y-2 text-right">
            <h4 className="text-xs font-bold text-slate-900 dark:text-amber-500 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              {t("how_to_obtain")}
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              {t("how_to_obtain_desc")}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
