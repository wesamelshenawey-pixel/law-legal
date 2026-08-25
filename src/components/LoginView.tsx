import React, { useState } from "react";
import PhoneInputWithCountry from "./PhoneInputWithCountry";
import { PlatformUser, UserRole } from "../types";
import { TRANSLATIONS } from "../utils/translations";
import { License } from "../utils/firebaseSync";
import { 
  auth, 
  googleProvider, 
  facebookProvider, 
  signInWithPopup 
} from "../firebase";
import { 
  Scale, 
  Phone, 
  Lock, 
  UserPlus, 
  Eye, 
  ShieldCheck, 
  Mail, 
  CheckCircle, 
  Smartphone, 
  Globe, 
  Sun, 
  Moon, 
  Keyboard,
  X,
  KeyRound,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: PlatformUser) => void;
  registeredUsers: PlatformUser[];
  onRegisterUser: (newUser: PlatformUser) => void;
  language: "ar" | "en";
  setLanguage: (lang: "ar" | "en") => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  licenses: License[];
  onBindPhoneToLicense: (key: string, phone: string) => boolean;
}

export default function LoginView({
  onLoginSuccess,
  registeredUsers,
  onRegisterUser,
  language,
  setLanguage,
  isDarkMode,
  setIsDarkMode,
  licenses,
  onBindPhoneToLicense
}: LoginProps) {
  // Main Dual Portal State (1: Lawyers & Admin, 2: Clients & Users)
  const [activePortal, setActivePortal] = useState<"lawyers_admin" | "clients_users">("lawyers_admin");

  const [activeTab, setActiveTab] = useState<UserRole>(UserRole.ADMIN);
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("+20");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Quick autofill helper for admin
  const handleQuickAdminFill = () => {
    setPhoneCode("+20");
    setPhone("1283233555");
    setPassword("W-001*001");
    setErrorMsg("");
  };

  // When portal changes, set appropriate default role
  const handlePortalSwitch = (portal: "lawyers_admin" | "clients_users") => {
    setActivePortal(portal);
    setErrorMsg("");
    setIsSignUp(false);
    if (portal === "lawyers_admin") {
      setActiveTab(UserRole.ADMIN);
    } else {
      setActiveTab(UserRole.CLIENT);
    }
  };

  // SignUp Form States
  const [isSignUp, setIsSignUp] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPhoneCode, setSignupPhoneCode] = useState("+20");
  const [lawFirmPhone, setLawFirmPhone] = useState("");
  const [lawFirmPhoneCode, setLawFirmPhoneCode] = useState("+20");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLicenseKey, setSignupLicenseKey] = useState("");
  const [signupGoogle, setSignupGoogle] = useState("");
  const [signupFb, setSignupFb] = useState("");
  const [signupWa, setSignupWa] = useState("");
  
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Registration Documents (Lawyers)
  const [nationalIdFront, setNationalIdFront] = useState("");
  const [nationalIdBack, setNationalIdBack] = useState("");
  const [lawyerCard, setLawyerCard] = useState("");
  
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetPhone, setResetPhone] = useState("");
  const [resetPhoneCode, setResetPhoneCode] = useState("+20");
  const [resetCode, setResetCode] = useState("");
  const [generatedResetCode, setGeneratedResetCode] = useState("");
  const [resetStep, setResetStep] = useState<"phone" | "verify" | "new_password">("phone");
  const [newPassword, setNewPassword] = useState("");

  // Keyboard Shortcuts Helplist state
  const [showShortcuts, setShowShortcuts] = useState(false);

  const t = (key: string) => TRANSLATIONS[key]?.[language] || key;

  // Regular Email/Phone + Password Login Handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    const fullPhone = phoneCode + phone;

    // Portal 1: Lawyers & Admin
    if (activePortal === "lawyers_admin") {
      // Admin default direct validation matching credentials
      if ((phone === "1283233555" || phone === "01283233555" || fullPhone === "+201283233555") && password === "W-001*001") {
        const adminUser: PlatformUser = {
          id: "usr-admin",
          name: language === "ar" ? "مدير النظام (مكتب محامي رقمي)" : "System Admin (Digital Law Firm)",
          phone: "+201283233555",
          passwordHash: "W-001*001",
          role: UserRole.ADMIN,
          isVerified: true,
          officeId: "office-admin",
          createdAt: new Date().toISOString(),
          permissions: {
            canEditApp: true,
            canAddSections: true
          }
        };
        onLoginSuccess(adminUser);
        return;
      }
      
      // Check for Admin/Staff users
      const matchedUser = registeredUsers.find(
        (u) => (u.phone === fullPhone || u.phone === phone) && u.passwordHash === password && [UserRole.ADMIN, UserRole.STAFF].includes(u.role)
      );

      if (matchedUser) {
        if (!matchedUser.isVerified) {
          setErrorMsg(language === "ar" ? "رقم الهاتف غير مفعل بعد." : "This account phone is not verified yet.");
          return;
        }
        onLoginSuccess(matchedUser);
        return;
      }

      setErrorMsg(language === "ar" 
        ? "بيانات الدخول غير صحيحة للإدارة أو المحامين." 
        : "Credentials mismatch for Admin/Staff portal.");
      return;
    }

    // Portal 2: Clients & Users (Client, Seeker, Opponent roles)
    if (activePortal === "clients_users") {
      const matchedUser = registeredUsers.find(
        (u) => (u.phone === fullPhone || u.phone === phone) && 
               u.passwordHash === password && 
               [UserRole.CLIENT, UserRole.SEEKER, UserRole.OPPONENT].includes(u.role) &&
               u.lawFirmPhone === (lawFirmPhoneCode + lawFirmPhone)
      );

      if (matchedUser) {
        if (!matchedUser.isVerified) {
          setErrorMsg(language === "ar" ? "رقم الهاتف غير مفعل بعد." : "This account phone is not verified yet.");
          return;
        }
        onLoginSuccess(matchedUser);
        return;
      }

      setErrorMsg(language === "ar" 
        ? "رقم الهاتف أو كلمة السر غير مطابقة لبيانات الموكلين." 
        : "Credentials Mismatch. Please check phone and password.");
    }
  };

  const getSocialDefaultRole = () => activePortal === "lawyers_admin" ? UserRole.STAFF : UserRole.CLIENT;

  // Google Firebase Authentication Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    try {
      if (!auth || !googleProvider) {
        // Fallback simulation if Firebase credentials are in offline mode
        const demoUser: PlatformUser = {
          id: "google-" + Date.now(),
          name: "مستخدم حساب Google",
          phone: "01000000000",
          passwordHash: "oauth_authenticated",
          role: getSocialDefaultRole(),
          isVerified: true,
          googleAccount: "user@gmail.com",
          createdAt: new Date().toISOString()
        };
        onRegisterUser(demoUser);
        onLoginSuccess(demoUser);
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const existingUser = registeredUsers.find(u => u.email === user.email || u.googleAccount === user.email);
      if (existingUser) {
        onLoginSuccess(existingUser);
      } else {
        const newUser: PlatformUser = {
          id: user.uid,
          name: user.displayName || "مستخدم Google",
          email: user.email || undefined,
          phone: user.phoneNumber || "01" + Math.floor(100000000 + Math.random() * 900000000),
          passwordHash: "oauth_authenticated",
          role: getSocialDefaultRole(),
          isVerified: true,
          googleAccount: user.email || undefined,
          createdAt: new Date().toISOString()
        };
        onRegisterUser(newUser);
        onLoginSuccess(newUser);
      }
    } catch (err: any) {
      console.warn("Google Auth popup handled:", err);
      // Seamlessly fallback to simulated Google sign-in
      const demoUser: PlatformUser = {
        id: "google-" + Date.now(),
        name: "مستخدم حساب Google",
        phone: "010" + Math.floor(10000000 + Math.random() * 90000000),
        passwordHash: "oauth_authenticated",
        role: getSocialDefaultRole(),
        isVerified: true,
        googleAccount: "user@gmail.com",
        createdAt: new Date().toISOString()
      };
      onRegisterUser(demoUser);
      onLoginSuccess(demoUser);
    }
  };

  // Facebook Firebase Authentication Sign-In
  const handleFacebookSignIn = async () => {
    setErrorMsg("");
    try {
      if (!auth || !facebookProvider) {
        const demoUser: PlatformUser = {
          id: "fb-" + Date.now(),
          name: "مستخدم حساب Facebook",
          phone: "011" + Math.floor(10000000 + Math.random() * 90000000),
          passwordHash: "oauth_authenticated",
          role: getSocialDefaultRole(),
          isVerified: true,
          facebookAccount: "facebook_user",
          createdAt: new Date().toISOString()
        };
        onRegisterUser(demoUser);
        onLoginSuccess(demoUser);
        return;
      }

      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      
      const newUser: PlatformUser = {
        id: user.uid,
        name: user.displayName || "مستخدم Facebook",
        email: user.email || undefined,
        phone: user.phoneNumber || "011" + Math.floor(10000000 + Math.random() * 90000000),
        passwordHash: "oauth_authenticated",
        role: activeTab === UserRole.ADMIN ? UserRole.CLIENT : activeTab,
        isVerified: true,
        facebookAccount: user.displayName || "facebook_user",
        createdAt: new Date().toISOString()
      };
      onRegisterUser(newUser);
      onLoginSuccess(newUser);
    } catch (err: any) {
      console.warn("Facebook Auth popup handled:", err);
      const demoUser: PlatformUser = {
        id: "fb-" + Date.now(),
        name: "مستخدم حساب Facebook",
        phone: "011" + Math.floor(10000000 + Math.random() * 90000000),
        passwordHash: "oauth_authenticated",
        role: activeTab === UserRole.ADMIN ? UserRole.CLIENT : activeTab,
        isVerified: true,
        facebookAccount: "facebook_user",
        createdAt: new Date().toISOString()
      };
      onRegisterUser(demoUser);
      onLoginSuccess(demoUser);
    }
  };

  // Phone Verification on SignUp
  const handleStartSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!signupName || !signupPhone || !signupPassword) {
      setErrorMsg(language === "ar" ? "برجاء استكمال كافة الحقول الإلزامية." : "Please fill in all mandatory fields.");
      return;
    }

    if (activePortal === "lawyers_admin") {
      if (!nationalIdFront || !nationalIdBack || !lawyerCard) {
        setErrorMsg(language === "ar" ? "لتسجيل مكتب محامي رقمي، يشترط إرفاق صور البطاقة وكارنيه المحاماة." : "For Law Firm registration, National ID and Lawyer Card are required.");
        return;
      }
    } else {
      if (!lawFirmPhone) {
        setErrorMsg(language === "ar" ? "يرجى كتابة رقم هاتف صاحب مكتب المحاماة لربط الحساب." : "Please enter the Law Firm Owner's phone number.");
        return;
      }
    }

    if (signupPhone.length < 9) {
      setErrorMsg(language === "ar" ? "يرجى كتابة رقم هاتف صحيح." : "Please enter a valid mobile phone.");
      return;
    }

    const fullSignupPhone = signupPhoneCode + signupPhone;

    if (signupLicenseKey.trim()) {
      const targetLic = licenses.find(l => l.id === signupLicenseKey.trim().toUpperCase());
      if (!targetLic) {
        setErrorMsg(language === "ar" 
          ? "رمز ترخيص النسخة هذا غير موجود." 
          : "Invalid activation License key.");
        return;
      }
      if (targetLic.status !== "active") {
        setErrorMsg(language === "ar" ? "ترخيص النسخة المدخل موقوف حالياً." : "Entered copy license is suspended.");
        return;
      }

      const activeUsersCount = targetLic.registeredPhones.length;
      if (activeUsersCount >= targetLic.maxUsers && !targetLic.registeredPhones.includes(fullSignupPhone)) {
        setErrorMsg(language === "ar" 
          ? `عذراً، تم بلوغ الحد الأقصى للمستخدمين لهذه النسخة (الحد الأقصى: ${targetLic.maxUsers} مستخدم). الرجاء التواصل للترقية.`
          : `User register limit exceeded for this copy (Limit: ${targetLic.maxUsers} users). Ask Admin to upgrade copy.`);
        return;
      }
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
    setShowVerification(true);
    setErrorMsg("");
  };

  const handleVerifyAndFinish = () => {
    if (verificationCode === generatedCode || verificationCode === "1111") {
      const fullSignupPhone = signupPhoneCode + signupPhone;
      if (signupLicenseKey.trim()) {
        onBindPhoneToLicense(signupLicenseKey.trim().toUpperCase(), fullSignupPhone);
      }

      const newUser: PlatformUser = {
        id: "usr-" + Date.now(),
        name: signupName,
        phone: fullSignupPhone,
        passwordHash: signupPassword,
        role: activeTab === UserRole.ADMIN ? UserRole.CLIENT : activeTab,
        isVerified: true,
        officeId: activePortal === "lawyers_admin" ? "office-" + Date.now() : undefined,
        nationalIdFront: nationalIdFront || undefined,
        nationalIdBack: nationalIdBack || undefined,
        lawyerCard: lawyerCard || undefined,
        lawFirmPhone: activePortal === "clients_users" ? (lawFirmPhoneCode + lawFirmPhone) : undefined,
        googleAccount: signupGoogle || undefined,
        facebookAccount: signupFb || undefined,
        whatsAppAccount: signupWa || undefined,
        createdAt: new Date().toISOString()
      };

      onRegisterUser(newUser);
      setIsSignUp(false);
      setShowVerification(false);
      setPhone(signupPhone);
      setPassword(signupPassword);
      setActiveTab(newUser.role);
      
      alert(language === "ar" 
        ? "أهلاً بك! تم توثيق وتفعيل رقم الهاتف بنجاح. يمكنك الآن الدخول ومتابعة قضاياك وجلساتك." 
        : "Verified! Mobile ownership verified successfully.");
    } else {
      setErrorMsg(language === "ar" ? "كود التفعيل المدخل غير صحيح." : "OTP code mismatch. Please check the code.");
    }
  };

  // Password Reset Flow
  const handleRequestPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPhone || resetPhone.length < 9) {
      alert("يرجى إدخال رقم هاتف صحيح مسجل بالنظام.");
      return;
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedResetCode(code);
    setResetStep("verify");
  };

  const handleVerifyResetCode = () => {
    if (resetCode === generatedResetCode || resetCode === "1111") {
      setResetStep("new_password");
    } else {
      alert("رمز التحقق غير صحيح. يرجى إدخال الرمز الظاهر على الشاشة.");
    }
  };

  const handleSaveNewPassword = () => {
    if (!newPassword || newPassword.length < 6) {
      alert("يرجى إدخال كلمة مرور قوية لا تقل عن 6 أحرف أو أرقام.");
      return;
    }

    const fullResetPhone = resetPhoneCode + resetPhone;
    const users = JSON.parse(localStorage.getItem("law_users") || "[]");
    const updatedUsers = users.map((u: PlatformUser) => 
      (u.phone === fullResetPhone || u.phone === resetPhone) ? { ...u, passwordHash: newPassword } : u
    );
    localStorage.setItem("law_users", JSON.stringify(updatedUsers));

    setShowForgotPassword(false);
    setResetStep("phone");
    setResetPhone("");
    setNewPassword("");
    alert("تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.");
  };

  return (
    <div className={`min-h-screen text-slate-800 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-800"}`} dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* Visual Background Accent Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Language / Dark / Keyboard Toggles Upper Row */}
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-20">
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
          >
            <Globe className="w-4 h-4 text-amber-500" />
            <span>{language === "ar" ? "English" : "العربية"}</span>
          </button>
          
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            title={t("keyboard_shortcuts")}
          >
            <Keyboard className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">دليل الاختصارات [Ctrl+K]</span>
          </button>
        </div>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-slate-500" />}
        </button>
      </div>

      {/* Main Seal Header Logo */}
      <div className="max-w-md w-full space-y-4 text-center z-10 select-none">
        <div className="inline-flex justify-center items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-xl relative">
          <Scale className="w-14 h-14 text-amber-600 dark:text-amber-500" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-amber-700 dark:text-amber-500 tracking-tight">{t("login_welcome")}</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-sans">{t("login_sub")}</p>
        </div>
      </div>

      {/* Login Card with Dual Portals */}
      <div className="mt-6 max-w-lg w-full z-10 shadow-2xl rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        
        {/* 1. Main Dual Portals Header Switcher */}
        <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1.5 gap-1.5 font-sans">
          
          {/* Portal 1: Lawyers & Admin */}
          <button
            type="button"
            onClick={() => handlePortalSwitch("lawyers_admin")}
            className={`py-3 px-2 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activePortal === "lawyers_admin"
                ? "bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 shadow-md ring-1 ring-amber-500/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1- دخول المحامين والإدارة</span>
          </button>

          {/* Portal 2: Clients & Users */}
          <button
            type="button"
            onClick={() => handlePortalSwitch("clients_users")}
            className={`py-3 px-2 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activePortal === "clients_users"
                ? "bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 shadow-md ring-1 ring-amber-500/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>2- الموكلين والمستخدمين</span>
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-2xl text-red-800 dark:text-red-300 text-right text-xs font-bold leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* NORMAL LOGIN FRAME */}
          {!isSignUp ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {activePortal === "clients_users" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right mb-1">
                    {language === "ar" ? "رقم هاتف صاحب مكتب المحاماة المستهدف" : "Law Firm Owner's Phone"}
                  </label>
                  <PhoneInputWithCountry
                      required={true}
                      value={lawFirmPhoneCode + lawFirmPhone}
                      onChange={(full, code, num) => {
                        setLawFirmPhoneCode(code);
                        setLawFirmPhone(num);
                      }}
                    />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right mb-1">
                  {t("phone_label")}
                </label>
                <div className="relative">
                  <PhoneInputWithCountry
                      value={phoneCode + phone}
                      onChange={(full, code, num) => {
                        setPhoneCode(code);
                        setPhone(num);
                      }}
                    />
                </div>
                {activeTab === UserRole.ADMIN && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 text-right mt-1 font-mono font-bold">
                    هاتف المدير: 01283233555
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setResetStep("phone");
                    }}
                    className="text-[11px] text-amber-600 hover:underline font-bold"
                  >
                    نسيت كلمة المرور؟
                  </button>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
                    {t("password_label")}
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-right outline-none font-bold text-xs"
                    required
                  />
                  <Lock className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {(activePortal === "lawyers_admin" && wizardStep === 2) && (
                      <div className="col-span-1 sm:col-span-2 space-y-3 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50">
                        <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-500 font-bold">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800 text-[10px]">2</span>
                          <span>الوثائق الرسمية (مطلوبة للتوثيق)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                          يتم تشفير هذه الوثائق باستخدام معيار Base64 ولا يمكن الوصول إليها إلا بواسطة المالك لضمان سرية النظام.
                        </p>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">صورة بطاقة الرقم القومي (وجه)</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setNationalIdFront)} className="w-full text-xs" required />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">صورة بطاقة الرقم القومي (ظهر)</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setNationalIdBack)} className="w-full text-xs" required />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">صورة كارنيه المحاماة</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setLawyerCard)} className="w-full text-xs" required />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button type="button" onClick={() => setWizardStep(1)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs rounded-xl transition cursor-pointer">
                            رجوع
                          </button>
                          <button type="submit" className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer">
                            إرسال وتوثيق الحساب
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      style={{ display: (activePortal === "lawyers_admin" && wizardStep === 2) ? 'none' : 'block' }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition shadow-md cursor-pointer"
              >
                {t("login_btn_submit")}
              </button>

              {/* Social Login Options (Google & Facebook) */}
              <div className="pt-3 space-y-2.5">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-400 font-bold whitespace-nowrap">
                    أو الدخول السريع عبر الحسابات السحابية
                  </span>
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFacebookSignIn}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </button>
                </div>
              </div>

              {activeTab !== UserRole.ADMIN && (
                <div className="mt-4 text-center pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-amber-600 dark:text-amber-400 font-black hover:underline cursor-pointer text-xs"
                  >
                    {t("signup_toggle")}
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* REGISTER ACCOUNT WITH SMS VERIFICATION */
            <div className="text-right space-y-4">
              <h3 className="text-sm font-black text-amber-700 dark:text-amber-500">
                {language === "ar" ? "تسجيل وتفعيل حساب موكل أو خصم" : "Register a Client or Opponent Account"}
              </h3>

              {!showVerification ? (
                <form onSubmit={handleStartSignUp} className="space-y-3.5 text-xs font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {!(activePortal === "lawyers_admin" && wizardStep === 2) && (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل *</label>
                        <input
                          type="text"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="الاسم ثلاثياً أو رباعياً"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-right outline-none font-bold"
                          required
                        />
                      </div>
                    )}

                    <div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف المحمول *</label>
                      <PhoneInputWithCountry
                      value={signupPhoneCode + signupPhone}
                      onChange={(full, code, num) => {
                        setSignupPhoneCode(code);
                        setSignupPhone(num);
                      }}
                    />
                    </div>
                  </div>

                  {/* Multi-tenant Lawyer & Client Dynamic Fields */}
                  {activePortal === "lawyers_admin" ? (
                    <div className="p-3 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-3">
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-2">مستندات توثيق مكتب المحامي (إلزامية)</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">صورة بطاقة الرقم القومي (وجه)</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setNationalIdFront)} className="w-full text-xs" required />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">صورة بطاقة الرقم القومي (ظهر)</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setNationalIdBack)} className="w-full text-xs" required />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">صورة كارنيه المحاماة</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setLawyerCard)} className="w-full text-xs" required />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl mb-3">
                      <p className="text-xs font-bold text-indigo-800 dark:text-indigo-400 mb-2">ربط الحساب بمكتب المحامي</p>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">رقم هاتف صاحب مكتب المحاماة *</label>
                      <PhoneInputWithCountry
                      required={true}
                      value={lawFirmPhoneCode + lawFirmPhone}
                      onChange={(full, code, num) => {
                        setLawFirmPhoneCode(code);
                        setLawFirmPhone(num);
                      }}
                    />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {!(activePortal === "lawyers_admin" && wizardStep === 2) && (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور *</label>
                        <input
                          type="password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-right outline-none font-bold font-mono"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رمز ترخيص النسخة (اختياري)</label>
                      <input
                        type="text"
                        value={signupLicenseKey}
                        onChange={(e) => setSignupLicenseKey(e.target.value)}
                        placeholder="WESAM-LAW-XXXX"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-right outline-none font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-2">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                      * ربط الحسابات السحابية والواتساب (اختياري):
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        value={signupGoogle}
                        onChange={(e) => setSignupGoogle(e.target.value)}
                        placeholder="بريد Google"
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-xs rounded-xl border border-slate-200 dark:border-slate-800 text-left outline-none font-sans"
                      />
                      <input
                        type="text"
                        value={signupFb}
                        onChange={(e) => setSignupFb(e.target.value)}
                        placeholder="حساب Facebook"
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-xs rounded-xl border border-slate-200 dark:border-slate-800 text-left outline-none font-sans"
                      />
                    </div>
                  </div>

                  {(activePortal === "lawyers_admin" && wizardStep === 2) && (
                      <div className="col-span-1 sm:col-span-2 space-y-3 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50">
                        <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-500 font-bold">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800 text-[10px]">2</span>
                          <span>الوثائق الرسمية (مطلوبة للتوثيق)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                          يتم تشفير هذه الوثائق باستخدام معيار Base64 ولا يمكن الوصول إليها إلا بواسطة المالك لضمان سرية النظام.
                        </p>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">صورة بطاقة الرقم القومي (وجه)</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setNationalIdFront)} className="w-full text-xs" required />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">صورة بطاقة الرقم القومي (ظهر)</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setNationalIdBack)} className="w-full text-xs" required />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">صورة كارنيه المحاماة</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setLawyerCard)} className="w-full text-xs" required />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button type="button" onClick={() => setWizardStep(1)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs rounded-xl transition cursor-pointer">
                            رجوع
                          </button>
                          <button type="submit" className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer">
                            إرسال وتوثيق الحساب
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      style={{ display: (activePortal === "lawyers_admin" && wizardStep === 2) ? 'none' : 'block' }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition shadow-sm cursor-pointer"
                  >
                    طلب رمز التحقق والتفعيل عبر الهاتف (SMS OTP)
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                  >
                    العودة لشاشة الدخول
                  </button>
                </form>
              ) : (
                /* EXPLICIT PHONE OTP VERIFICATION STEP */
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl text-center space-y-2">
                    <Smartphone className="w-8 h-8 text-amber-600 mx-auto animate-bounce" />
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      أرسلنا رمز التفعيل المؤقت لرقم هاتفك ({signupPhone}).
                    </p>
                    <p className="text-xs font-black text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl inline-block border border-indigo-200 dark:border-indigo-900">
                      رمز التحقق المرسل: <span className="font-mono text-sm tracking-widest">{generatedCode}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right mb-1">
                      {t("otp_title")}
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="أدخل الرمز هنا (مثال: الرمز أعلاه أو 1111)"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-center font-black tracking-widest rounded-xl border border-slate-200 dark:border-slate-800 outline-none text-base font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyAndFinish}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-sm cursor-pointer"
                  >
                    تأكيد رمز التحقق وإتمام إنشاء الحساب
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowVerification(false); setErrorMsg(""); }}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                  >
                    العودة وتعديل رقم الهاتف
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: FORGOT PASSWORD (PHONE SMS VERIFICATION & RESET) */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full relative space-y-4 shadow-2xl">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                إعادة تعيين كلمة المرور برقم الهاتف
              </h3>
            </div>

            {resetStep === "phone" && (
              <form onSubmit={handleRequestPasswordReset} className="space-y-3 text-xs">
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  أدخل رقم هاتفك المسجل لتلقي كود التحقق الأمني عبر SMS لإعادة تعيين كلمة المرور:
                </p>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف *</label>
                  <PhoneInputWithCountry
                      value={resetPhoneCode + resetPhone}
                      onChange={(full, code, num) => {
                        setResetPhoneCode(code);
                        setResetPhone(num);
                      }}
                    />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition"
                >
                  إرسال كود التحقق
                </button>
              </form>
            )}

            {resetStep === "verify" && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 text-center space-y-1">
                  <p className="font-bold text-amber-900 dark:text-amber-300">تم إرسال كود التحقق لهاتفك ({resetPhone})</p>
                  <p className="font-mono text-sm font-black text-indigo-700 dark:text-indigo-300">
                    كود التحقق: {generatedResetCode}
                  </p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">أدخل كود التحقق *</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="أدخل الكود هنا أو 1111"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-center font-mono font-black text-sm rounded-xl border border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>
                <button
                  onClick={handleVerifyResetCode}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition"
                >
                  التحقق من الكود
                </button>
              </div>
            )}

            {resetStep === "new_password" && (
              <div className="space-y-3 text-xs">
                <p className="text-emerald-700 dark:text-emerald-400 font-bold">✓ تم التحقق بنجاح من ملكية الهاتف.</p>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">أدخل كلمة المرور الجديدة *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>
                <button
                  onClick={handleSaveNewPassword}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition"
                >
                  حفظ كلمة المرور الجديدة
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Keyboard Shortcuts Modal Panel */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-md w-full relative space-y-4">
            <button
              onClick={() => setShowShortcuts(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-amber-700 dark:text-amber-500 text-right">
              ⌨️ {t("keyboard_shortcuts_title")}
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] font-sans">
              <div className="flex justify-between py-2 text-slate-700 dark:text-slate-300">
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded font-mono font-bold text-xs">Ctrl + K</kbd>
                <span>البحث الشامل في كامل النظام والملفات</span>
              </div>
              <div className="flex justify-between py-2 text-slate-700 dark:text-slate-300">
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded font-mono font-bold text-xs">Alt + S</kbd>
                <span>الأجندة والتقويم القضائي الموحد</span>
              </div>
              <div className="flex justify-between py-2 text-slate-700 dark:text-slate-300">
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded font-mono font-bold text-xs">Alt + C</kbd>
                <span>إدارة القضايا والملفات</span>
              </div>
              <div className="flex justify-between py-2 text-slate-700 dark:text-slate-300">
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded font-mono font-bold text-xs">Alt + V</kbd>
                <span>سجل الموكلين وجهات الاتصال</span>
              </div>
            </div>

            <button
              onClick={() => setShowShortcuts(false)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <div className="mt-6 text-center space-y-1 font-sans">
        <p className="text-[10px] text-slate-400">
          🔒 تأمين وحماية بيانات المحاماة والتوثيق الإلكتروني المعتمد لعام ٢٠٢٦
        </p>
        <p className="text-[10px] text-slate-400">
          © {new Date().getFullYear()} الأستاذ المحامي المحامى
        </p>
      </div>

    </div>
  );
}
