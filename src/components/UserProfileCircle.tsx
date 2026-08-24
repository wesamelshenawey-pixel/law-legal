import React, { useState, useRef, useEffect } from "react";
import { PlatformUser, UserRole } from "../types";
import { 
  User, 
  LogOut, 
  Settings, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Moon, 
  Sun, 
  Globe, 
  Key, 
  CheckCircle2, 
  Camera, 
  X,
  Scale
} from "lucide-react";

interface UserProfileCircleProps {
  currentUser: PlatformUser;
  onLogout: () => void;
  onNavigateToSettings?: () => void;
  language: "ar" | "en";
  setLanguage?: (lang: "ar" | "en") => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (dark: boolean) => void;
}

export default function UserProfileCircle({
  currentUser,
  onLogout,
  onNavigateToSettings,
  language,
  setLanguage,
  isDarkMode,
  setIsDarkMode
}: UserProfileCircleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string>(() => {
    return localStorage.getItem(`user_avatar_${currentUser.id}`) || "";
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setCustomAvatar(base64);
      localStorage.setItem(`user_avatar_${currentUser.id}`, base64);
      // simulate saving to server
      alert("تم حفظ الصورة الشخصية بنجاح!");
    };
    reader.readAsDataURL(file);
  };

  const handleGooglePhotosSync = () => {
    // Alert the user that they can use the OCR section
    alert("تم دمج مزامنة صور Google Photos داخل أداة (فك نصوص خطوط اليد OCR). يرجى الانتقال إلى قسم الذكاء الاصطناعي للاستفادة منها.");
  };

  const getRoleLabel = () => {
    switch (currentUser.role) {
      case UserRole.ADMIN:
        return language === "ar" ? "المستشار العام / مدير النظام" : "Chief Attorney / Admin";
      case UserRole.STAFF:
        return language === "ar" ? "محامٍ ومستشار بالديوان" : "Chamber Associate / Staff";
      case UserRole.CLIENT:
        return language === "ar" ? "موكل معتمد بالديوان" : "Verified Client";
      case UserRole.SEEKER:
        return language === "ar" ? "طالب استشارة قانونية" : "Legal Seeker";
      case UserRole.OPPONENT:
        return language === "ar" ? "طرف خصومة مسجل" : "Opposing Party";
      default:
        return currentUser.role;
    }
  };

  const getUserInitials = () => {
    if (!currentUser.name) return "م";
    const parts = currentUser.name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const isRtl = language === "ar";

  return (
    <div 
      ref={menuRef}
      className={`fixed top-4 z-50 ${isRtl ? "left-4" : "right-4"}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* 1. Floating Circular Avatar Button */}
      <button
        id="user-profile-circle-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center ring-2 ring-amber-400/40"
        title={currentUser.name}
      >
        <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden relative">
          {customAvatar ? (
            <img 
              src={customAvatar} 
              alt={currentUser.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center text-amber-400 font-black text-sm md:text-base select-none">
              {getUserInitials()}
            </div>
          )}
        </div>

        {/* Online Status Live Dot */}
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full shadow-sm"></span>
      </button>

      {/* Hidden File Input for Avatar Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleAvatarChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* 2. Floating User Profile Card / Popover */}
      {isOpen && (
        <div 
          className={`absolute top-full mt-3 w-80 md:w-88 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.35)] p-5 z-50 text-right space-y-4 animate-in fade-in zoom-in-95 duration-200 ${
            isRtl ? "left-0" : "right-0"
          }`}
        >
          {/* Header with Close */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {language === "ar" ? "الملف الشخصي والحساب" : "User Profile & Account"}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Overview (Avatar + Name + Role) */}
          <div className="flex items-center gap-3.5">
            <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md overflow-hidden">
                <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center overflow-hidden">
                  {customAvatar ? (
                    <img src={customAvatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-amber-400 font-black text-lg">{getUserInitials()}</span>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                {currentUser.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 truncate">
                  {getRoleLabel()}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-0.5" dir="ltr">
                ID: {currentUser.id}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
             <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
             >
                <Camera className="w-3 h-3" />
                تغيير الصورة
             </button>
             <button
                onClick={handleGooglePhotosSync}
                className="flex-1 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 border border-blue-200 dark:border-blue-800"
             >
                <span>Google Photos</span>
             </button>
          </div>

          {/* Details list */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>رقم الهاتف:</span>
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-200 font-mono" dir="ltr">
                {currentUser.phone || "01283233555"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>البريد الإلكتروني:</span>
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-200 text-[10px] font-mono truncate max-w-[140px]" dir="ltr">
                {currentUser.email || "wesam.elshenawey.law@gmail.com"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-400 text-[11px]">حالة الترخيص والأمان:</span>
              <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                ✔️ موثق ونشط 2026
              </span>
            </div>
          </div>

          {/* Quick Toggles (Theme / Language / Settings) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {setIsDarkMode && (
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}</span>
              </button>
            )}

            {setLanguage && (
              <button
                type="button"
                onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === "ar" ? "English" : "العربية"}</span>
              </button>
            )}
          </div>

          {onNavigateToSettings && (
            <button
              type="button"
              onClick={() => {
                onNavigateToSettings();
                setIsOpen(false);
              }}
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-500 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>{language === "ar" ? "إعدادات النظام والترخيص" : "System Settings & Licenses"}</span>
            </button>
          )}

          {/* Logout Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              id="user-circle-logout-btn"
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-500/30 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>{language === "ar" ? "تسجيل الخروج من الحساب" : "Log Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
