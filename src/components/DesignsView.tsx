import React, { useState } from "react";
import { 
  DESIGN_PRESETS, 
  DesignPreset, 
  UserDesignPreferences 
} from "../utils/themePresets";
import { 
  Palette, 
  Check, 
  Sparkles, 
  Sliders, 
  Eye, 
  RotateCcw, 
  Sun, 
  Moon, 
  Maximize2, 
  Layers, 
  Type, 
  ShieldCheck, 
  Download, 
  Upload,
  Briefcase,
  FileText,
  Calendar,
  DollarSign,
  Scale
} from "lucide-react";
import GoldenEagleEmblem from "./GoldenEagleEmblem";

interface DesignsViewProps {
  currentPreferences: UserDesignPreferences;
  onApplyPreferences: (updated: UserDesignPreferences) => void;
  language: "ar" | "en";
}

export default function DesignsView({
  currentPreferences,
  onApplyPreferences,
  language = "ar"
}: DesignsViewProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "customize" | "preview">("presets");
  const [previewPreset, setPreviewPreset] = useState<DesignPreset | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Local draft state for the fine-tuning tab
  const [draftPreferences, setDraftPreferences] = useState<UserDesignPreferences>({ ...currentPreferences });

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 4000);
  };

  const handleSelectPreset = (preset: DesignPreset) => {
    const updated: UserDesignPreferences = {
      ...currentPreferences,
      currentPresetId: preset.id,
      accentColor: preset.accentColor,
      isDarkMode: preset.isDark,
      borderRadius: preset.borderRadius,
      fontFamily: preset.fontFamily,
      cardElevation: preset.cardElevation,
      backgroundWatermark: preset.backgroundWatermark,
      displayDensity: preset.displayDensity
    };

    setDraftPreferences(updated);
    onApplyPreferences(updated);
    showNotification(
      language === "ar"
        ? `تم اعتماد وتطبيق (${preset.nameAr}) بنجاح على كامل البرنامج!`
        : `Applied (${preset.nameEn}) successfully!`
    );
  };

  const handleApplyDraft = () => {
    onApplyPreferences(draftPreferences);
    showNotification(
      language === "ar"
        ? "تم حفظ وتطبيق التخصيصات المخصصة على كافة الشاشات!"
        : "Custom styling applied across all views!"
    );
  };

  const handleResetDefaults = () => {
    const defaultPreset = DESIGN_PRESETS[0];
    const resetPrefs: UserDesignPreferences = {
      currentPresetId: "classic_gold",
      accentColor: "amber",
      isDarkMode: false,
      borderRadius: "modern",
      fontFamily: "cairo",
      cardElevation: "subtle",
      backgroundWatermark: "scales",
      displayDensity: "comfortable",
      soundEffectsEnabled: false,
      highContrastMode: false
    };

    setDraftPreferences(resetPrefs);
    onApplyPreferences(resetPrefs);
    showNotification(
      language === "ar"
        ? `تمت استعادة التصميم الأصلي المعتمد لمكتب المحامي المحامي.`
        : "Restored official default theme."
    );
  };

  const currentPresetObj = DESIGN_PRESETS.find(p => p.id === currentPreferences.currentPresetId) || DESIGN_PRESETS[0];

  const getBorderRadiusClass = (rad: UserDesignPreferences["borderRadius"]) => {
    switch (rad) {
      case "sharp": return "rounded-none";
      case "classic": return "rounded-lg";
      case "modern": return "rounded-2xl";
      case "pill": return "rounded-3xl";
      default: return "rounded-2xl";
    }
  };

  return (
    <div 
      className="space-y-6 text-right font-sans min-h-screen pb-12 transition-all duration-300"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-slate-900/95 text-amber-400 border-2 border-amber-500 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in text-xs font-black">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER: DESIGNS & THEMES STUDIO TOOLBAR                                */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
            <Palette className="w-5 h-5" />
          </div>
          <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{language === "ar" ? "قسم التصميمات والمظاهر للمكتب" : "Law Chambers Design Suite"}</span>
            <span className="text-xs font-normal text-slate-400">({DESIGN_PRESETS.length} {language === "ar" ? "تصاميم" : "presets"})</span>
          </h1>
        </div>

        {/* Tab Controls & Reset Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("presets")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "presets"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>{language === "ar" ? "معرض التصاميم الجاهزة" : "Pre-built Themes"}</span>
          </button>

          <button
            onClick={() => setActiveTab("customize")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "customize"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{language === "ar" ? "تخصيص يدوي حر" : "Custom Tuning"}</span>
          </button>

          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "preview"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{language === "ar" ? "المعاينة الحية" : "Live Preview"}</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-amber-500 flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === "ar" ? "استعادة الافتراضي" : "Reset"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB 1: PRE-BUILT DESIGNS GALLERY                                       */}
      {/* ========================================================================= */}
      {activeTab === "presets" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-amber-400">
                {language === "ar" ? "اختر التصميم المفضل لتطبيقه فوراً:" : "Select a Design Theme to Apply Instantly:"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "ar"
                  ? "انقر على زر 'تطبيق هذا التصميم' لتحديث شكل وألوان وخطوط كافة النوافذ والقوائم والجداول."
                  : "Click 'Apply Design' to transform all cards, headers, tables, and colors instantly."}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{language === "ar" ? "التغيير يُحفظ سحابياً ومحلياً تلقائياً" : "Auto-saved to preferences"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DESIGN_PRESETS.map((preset) => {
              const isCurrent = currentPreferences.currentPresetId === preset.id;
              
              return (
                <div
                  key={preset.id}
                  className={`group relative overflow-hidden bg-white dark:bg-slate-900 border-2 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl ${
                    getBorderRadiusClass(preset.borderRadius)
                  } ${
                    isCurrent
                      ? "border-amber-500 ring-4 ring-amber-400/20 bg-amber-50/10 dark:bg-slate-900"
                      : "border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500"
                  }`}
                >
                  {/* Top Color Banner / Preview Strip */}
                  <div className={`h-24 bg-gradient-to-r ${preset.headerGradient} p-4 relative overflow-hidden flex flex-col justify-between`}>
                    {/* Badge */}
                    <div className="flex justify-between items-center z-10">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-black/40 text-white backdrop-blur border border-white/20">
                        {language === "ar" ? preset.badgeAr : preset.badgeEn}
                      </span>
                      {preset.isDark ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-200 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur">
                          <Moon className="w-3 h-3" />
                          <span>{language === "ar" ? "ليلي" : "Dark"}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-100 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur">
                          <Sun className="w-3 h-3" />
                          <span>{language === "ar" ? "نهاري" : "Light"}</span>
                        </span>
                      )}
                    </div>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center gap-1.5 z-10">
                      {preset.previewColors.map((col, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 rounded-full border-2 border-white/80 shadow-md transform group-hover:scale-110 transition"
                          style={{ backgroundColor: col }}
                          title={col}
                        />
                      ))}
                    </div>

                    {/* Watermark in Header */}
                    <div className="absolute -right-4 -bottom-6 opacity-20 transform scale-125 pointer-events-none">
                      <Scale className="w-24 h-24 text-white" />
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{language === "ar" ? preset.nameAr : preset.nameEn}</span>
                        </h3>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                            <Check className="w-3 h-3" />
                            <span>{language === "ar" ? "مفعل حالياً" : "Active"}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 leading-snug">
                        {language === "ar" ? preset.taglineAr : preset.taglineEn}
                      </p>

                      <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {language === "ar" ? preset.descriptionAr : preset.descriptionEn}
                      </p>
                    </div>

                    {/* Specifications Chips */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold">
                          🔤 {preset.fontFamily.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold">
                          📐 {preset.borderRadius}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold">
                          🛡️ {preset.cardElevation}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 font-medium">
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          {language === "ar" ? "مناسب لـ: " : "Best for: "}
                        </span>
                        <span>{language === "ar" ? preset.recommendedForAr : preset.recommendedForEn}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewPreset(preset);
                        setActiveTab("preview");
                      }}
                      className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{language === "ar" ? "معاينة" : "Preview"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`px-4 py-2 text-xs font-black rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                        isCurrent
                          ? "bg-emerald-600 text-white shadow"
                          : "bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 shadow-md hover:shadow-lg hover:scale-105"
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === "ar" ? "التصميم المطبق" : "Currently Applied"}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{language === "ar" ? "تطبيق هذا التصميم فوراً" : "Apply This Design"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB 2: CUSTOM FINE-TUNING STUDIO                                       */}
      {/* ========================================================================= */}
      {activeTab === "customize" && (
        <div className="space-y-6 animate-fade-in bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-amber-400 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>{language === "ar" ? "استوديو التخصيص الدقيق للواجهة" : "Visual Elements Customizer"}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "ar"
                  ? "قم بضبط كل عنصر تصميم بشكل منفرد: درجات الألوان، شكل الزوايا، الخطوط، الخلفيات وكثافة العرض."
                  : "Fine-tune individual styling dimensions to craft a personalized law office environment."}
              </p>
            </div>

            <button
              onClick={handleApplyDraft}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:scale-105 transition flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{language === "ar" ? "حفظ وتطبيق التعديلات الآن" : "Save & Apply Customizations"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Primary Accent Color */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                🎨 {language === "ar" ? "لون التمييز الأساسي (Primary Accent Color):" : "Accent Color Palette:"}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "amber", nameAr: "ذهبي كهرماني", hex: "#f59e0b" },
                  { id: "emerald", nameAr: "زمردي ملكي", hex: "#10b981" },
                  { id: "blue", nameAr: "أزرق ياقوتي", hex: "#3b82f6" },
                  { id: "indigo", nameAr: "نيلي إمبراطوري", hex: "#6366f1" },
                  { id: "purple", nameAr: "بنفسجي فاخر", hex: "#a855f7" },
                  { id: "rose", nameAr: "روبي عنابي", hex: "#f43f5e" },
                  { id: "teal", nameAr: "فيروزي بحري", hex: "#14b8a6" },
                  { id: "cyan", nameAr: "سماوي تقني", hex: "#06b6d4" },
                  { id: "orange", nameAr: "برونزي عتيق", hex: "#f97316" }
                ].map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setDraftPreferences(prev => ({ ...prev, accentColor: color.id }))}
                    className={`flex items-center gap-2 p-2 rounded-xl border-2 transition cursor-pointer ${
                      draftPreferences.accentColor === color.id
                        ? "border-amber-500 bg-white dark:bg-slate-800 shadow-md"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: color.hex }} />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{color.nameAr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Border Radius Style */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                📐 {language === "ar" ? "درجة تدوير الزوايا والبطاقات (Corner Radius):" : "Border Radius:"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "sharp", labelAr: "حاد مستقيم (0px)", desc: "كلاسيكي جاد" },
                  { id: "classic", labelAr: "كلاسيكي متزن (8px)", desc: "رسمي ومتقن" },
                  { id: "modern", labelAr: "عصري ناعم (16px)", desc: "مريح وحديث" },
                  { id: "pill", labelAr: "كبسولي كامل (24px)", desc: "فائق الانسيابية" }
                ].map((rad) => (
                  <button
                    key={rad.id}
                    type="button"
                    onClick={() => setDraftPreferences(prev => ({ ...prev, borderRadius: rad.id as any }))}
                    className={`p-3 border-2 text-right transition cursor-pointer ${
                      draftPreferences.borderRadius === rad.id
                        ? "border-amber-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-amber-400/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    } ${getBorderRadiusClass(rad.id as any)}`}
                  >
                    <span className="block text-xs font-black text-slate-800 dark:text-slate-200">{rad.labelAr}</span>
                    <span className="text-[10px] text-slate-400">{rad.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Arabic Typography Selection */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                🔤 {language === "ar" ? "طراز الخط العربي للواجهة (Arabic Typography):" : "Font Family:"}
              </label>
              <div className="space-y-2">
                {[
                  { id: "cairo", name: "خط كايرو (Cairo Modern)", desc: "الخط الرسمي الافتراضي - وضوح فائق وسهل القراءة" },
                  { id: "amiri", name: "الخط الأميري (Amiri Classical)", desc: "طراز المحاكم والمخطوطات القانونية الأصيلة" },
                  { id: "tajawal", name: "خط تجوال (Tajawal Sleek)", desc: "خط هندسي معاصر ممتاز للأرقام والبيانات" },
                  { id: "almarai", name: "خط المراعي (Almarai Compact)", desc: "خط أنيق ومركز للقضايا الكثيفة" }
                ].map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setDraftPreferences(prev => ({ ...prev, fontFamily: font.id as any }))}
                    className={`w-full p-3 rounded-xl border-2 text-right transition cursor-pointer flex justify-between items-center ${
                      draftPreferences.fontFamily === font.id
                        ? "border-amber-500 bg-white dark:bg-slate-800 shadow-md"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <span className="block text-xs font-black text-slate-800 dark:text-slate-200">{font.name}</span>
                      <span className="text-[10px] text-slate-400">{font.desc}</span>
                    </div>
                    {draftPreferences.fontFamily === font.id && (
                      <Check className="w-4 h-4 text-amber-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Display Density & Card Elevation */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-2">
                  📊 {language === "ar" ? "كثافة عرض المحتوى (Display Density):" : "Density:"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "compact", label: "مدمجة (Compact)", desc: "بيانات أكثر بالشاشة" },
                    { id: "comfortable", label: "متوازنة (Standard)", desc: "المسافات القياسية" },
                    { id: "spacious", label: "واسعة (Spacious)", desc: "مريحة وفخمة" }
                  ].map((den) => (
                    <button
                      key={den.id}
                      type="button"
                      onClick={() => setDraftPreferences(prev => ({ ...prev, displayDensity: den.id as any }))}
                      className={`p-2.5 rounded-xl border-2 text-right transition cursor-pointer ${
                        draftPreferences.displayDensity === den.id
                          ? "border-amber-500 bg-white dark:bg-slate-800 shadow-md"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <span className="block text-xs font-black text-slate-800 dark:text-slate-200">{den.label}</span>
                      <span className="text-[9.5px] text-slate-400">{den.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-2">
                  🏛️ {language === "ar" ? "الخلفية والنقوش المائية (Watermark Texture):" : "Watermark:"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "scales", label: "ميزان العدالة ⚖️" },
                    { id: "eagle", label: "نسر الجمهورية المذهب 🦅" },
                    { id: "watermark_seal", label: "ختم التوثيق الرسمي 📜" },
                    { id: "none", label: "خلفية نقية سادة ⚪" }
                  ].map((wm) => (
                    <button
                      key={wm.id}
                      type="button"
                      onClick={() => setDraftPreferences(prev => ({ ...prev, backgroundWatermark: wm.id as any }))}
                      className={`p-2 rounded-xl border-2 text-right text-xs font-bold transition cursor-pointer ${
                        draftPreferences.backgroundWatermark === wm.id
                          ? "border-amber-500 bg-white dark:bg-slate-800 shadow-md text-amber-600 dark:text-amber-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      {wm.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              onClick={handleResetDefaults}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              {language === "ar" ? "إلغاء واستعادة الافتراضي" : "Reset to Default"}
            </button>
            <button
              onClick={handleApplyDraft}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:scale-105 transition flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{language === "ar" ? "اعتماد وحفظ كافة التخصيصات" : "Save All Changes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 3: LIVE INTERACTIVE PREVIEW SANDBOX                                */}
      {/* ========================================================================= */}
      {activeTab === "preview" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-amber-400 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-amber-500" />
                  <span>{language === "ar" ? "ميدان المعاينة الحية المباشرة للعناصر" : "Live Interactive Preview Sandbox"}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === "ar"
                    ? "هكذا تظهر بطاقات القضايا، الجلسات، الأزرار، والإحصائيات بناءً على التصميم المختار حالياً."
                    : "Live interactive simulation showing how court cards, metrics, and actions look in the active theme."}
                </p>
              </div>

              {previewPreset && (
                <button
                  onClick={() => handleSelectPreset(previewPreset)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === "ar" ? `اعتماد (${previewPreset.nameAr})` : `Apply (${previewPreset.nameEn})`}</span>
                </button>
              )}
            </div>

            {/* Simulated Live Components Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Widget 1: Metric KPI Card */}
              <div className={`p-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-2 ${getBorderRadiusClass(currentPreferences.borderRadius)}`}>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="font-bold">💼 إجمالي القضايا النشطة</span>
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">142</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  ١٤٢ <span className="text-xs text-emerald-600 font-bold">+١٢ هذا الشهر</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-3/4 rounded-full" />
                </div>
              </div>

              {/* Widget 2: Session Schedule Card */}
              <div className={`p-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-2 ${getBorderRadiusClass(currentPreferences.borderRadius)}`}>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="font-bold">📅 جلسات الغد بالمحاكم</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded font-black text-[10px]">عاجل</span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                  محكمة استئناف القاهرة - الدائرة ٧ تجاري
                </div>
                <p className="text-[11px] text-slate-500">جلسة سماع الشهود وتقديم المذكرات الختامية</p>
              </div>

              {/* Widget 3: Treasury Quick Card */}
              <div className={`p-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-2 ${getBorderRadiusClass(currentPreferences.borderRadius)}`}>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="font-bold">💰 المتحصلات والأتعاب</span>
                  <span className="text-emerald-600 font-bold text-[10px]">محدث</span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                  ٤٥,٠٠٠ <span className="text-xs font-bold text-slate-400">ج.م هذا الأسبوع</span>
                </div>
                <button className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg transition shadow-sm">
                  إيداع توريد جديد 📥
                </button>
              </div>
            </div>

            {/* Simulated Case Profile Preview Card */}
            <div className={`p-6 bg-slate-50 dark:bg-slate-950 border-2 border-amber-500/40 space-y-4 shadow-md ${getBorderRadiusClass(currentPreferences.borderRadius)}`}>
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 rounded-full font-black text-xs shadow-sm">
                      دعوى رقم 458 لسنة 2026
                    </span>
                    <span className="text-xs text-slate-500 font-bold">محكمة جنوب الجيزة الابتدائية</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    دعوى صحة ونفاذ عقد بيع عقار ونقل ملكية - الموكل: الحاج محمود عبد الرحيم
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition">
                    تحميل العريضة 📄
                  </button>
                  <button className="px-4 py-1.5 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-amber-500 rounded-lg text-xs font-black transition shadow">
                    تعديل البيانات ✏️
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <p className="font-bold text-slate-900 dark:text-slate-100">⚖️ الموقف التنفيذي للدعوى:</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  تم إيداع أصل التوكيل وصحيفة الدعوى بقلم المحضرين، وحددت جلسة 18 أكتوبر 2026 لتقديم أصل العقد المسجل وتقرير الخبير المنتدب من وزارة العدل.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
