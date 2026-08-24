import React, { useState, useEffect } from "react";
import { UserRole, PlatformUser, AdminCustomSection } from "../types";
import { TRANSLATIONS } from "../utils/translations";
import GoldenEagleEmblem from "./GoldenEagleEmblem";

export type SidebarDisplayMode = "full" | "emoji" | "hidden";

interface SidebarProps {
  currentUser: PlatformUser;
  activeSection: string;
  setActiveSection: (sec: string) => void;
  onLogout: () => void;
  customSections: AdminCustomSection[];
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  language: "ar" | "en";
  sidebarMode: SidebarDisplayMode;
  setSidebarMode: (mode: SidebarDisplayMode) => void;
}

export default function Sidebar({
  currentUser,
  activeSection,
  setActiveSection,
  onLogout,
  customSections,
  isMobileOpen,
  setIsMobileOpen,
  language,
  sidebarMode,
  setSidebarMode
}: SidebarProps) {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const t = (key: string) => TRANSLATIONS[key]?.[language] || key;

  // Track if user manually interacted to pause auto-timer
  const [userInteracted, setUserInteracted] = useState(false);

  // Auto Timer Lifecycle: 5s Full -> 20s Emoji -> Hidden
  useEffect(() => {
    if (userInteracted) return;

    // Timer 1: after 5 seconds, switch to "emoji"
    const timer1 = setTimeout(() => {
      setSidebarMode("emoji");
    }, 5000);

    // Timer 2: after 5s + 20s = 25s, switch to "hidden"
    const timer2 = setTimeout(() => {
      setSidebarMode("hidden");
    }, 25000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [userInteracted, setSidebarMode]);

  // Click on the Original Emblem directly cycles the mode cleanly without any text or dropdown
  const handleEmblemClick = () => {
    setUserInteracted(true);
    setSidebarMode(
      sidebarMode === "full"
        ? "emoji"
        : sidebarMode === "emoji"
        ? "hidden"
        : "full"
    );
  };

  // Accordion state to toggle Main Categories in full mode
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    main_cases_legal: true,
    main_finance_reg: true,
    main_social_ai: true,
    main_advanced_tools: true
  });

  const toggleCategory = (id: string) => {
    setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Clean hierarchy with rich emojis instead of icons
  const categories = [
    {
      id: "main_cases_legal",
      titleArabic: "ديوان القضايا والخدمات القانونية",
      titleEnglish: "Chambers & Court Registry",
      emoji: "🏛️",
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT],
      subsections: [
        {
          id: "sub_cases_clients",
          titleArabic: "إدارة الأوراق والموكلين",
          titleEnglish: "Files & Clients",
          emoji: "📁",
          roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT],
          items: [
            { id: "cases", label: t("cases"), emoji: "💼", roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT] },
            { id: "clients", label: t("clients"), emoji: "👥", roles: [UserRole.ADMIN, UserRole.STAFF] },
            { id: "import_files", label: language === "ar" ? "استيراد وإدارة الملفات" : "Import Files", emoji: "📥", roles: [UserRole.ADMIN, UserRole.STAFF] },
            { id: "companies", label: t("companies"), emoji: "🏢", roles: [UserRole.ADMIN, UserRole.STAFF] },
          ]
        },
        {
          id: "sub_agenda_admin",
          titleArabic: "الرصد وأجندة الجلسات اليومية",
          titleEnglish: "Court Schedule & Agenda",
          emoji: "📆",
          roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT],
          items: [
            { id: "sessions", label: t("sessions"), emoji: "📅", roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT] },
            { id: "adminwork", label: t("adminwork"), emoji: "📝", roles: [UserRole.ADMIN, UserRole.STAFF] },
          ]
        }
      ]
    },
    {
      id: "main_finance_reg",
      titleArabic: "شؤون الخزينة والتوثيقات والمعرفة",
      titleEnglish: "Treasury & Document Registry",
      emoji: "⚖️",
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT],
      subsections: [
        {
          id: "sub_treasury",
          titleArabic: "الرعايات المالية والمتحصلات",
          titleEnglish: "Financial & Bills",
          emoji: "💰",
          roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT],
          items: [
            { id: "fees", label: t("fees"), emoji: "💵", roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT] },
            { id: "documentation", label: t("documentation"), emoji: "📑", roles: [UserRole.ADMIN, UserRole.STAFF] },
          ]
        },
        {
          id: "sub_codes_lib",
          titleArabic: "المكتبة والأكواد القضائية",
          titleEnglish: "Legal Library & Codes",
          emoji: "📚",
          roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT],
          items: [
            { id: "lawcodes", label: t("lawcodes"), emoji: "📖", roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT] },
          ]
        }
      ]
    },
    {
      id: "main_social_ai",
      titleArabic: "الاستشارات والإعلانات والتواصل",
      titleEnglish: "AI, Announcements & Social",
      emoji: "📢",
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT, UserRole.SEEKER, UserRole.OPPONENT],
      subsections: [
        {
          id: "sub_interactivity",
          titleArabic: "قاعات الحوار والإفتاء القانوني",
          titleEnglish: "Interactives Hub",
          emoji: "🌐",
          roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT, UserRole.SEEKER, UserRole.OPPONENT],
          items: [
            { id: "announcements", label: "شريط الإعلانات والتعميمات", emoji: "📢", roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT, UserRole.SEEKER, UserRole.OPPONENT] },
            { id: "social", label: t("social"), emoji: "🗨️", roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT, UserRole.SEEKER, UserRole.OPPONENT] },
            { id: "ai", label: t("ai"), emoji: "🤖", roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT, UserRole.SEEKER] },
          ]
        }
      ]
    },
    {
      id: "main_advanced_tools",
      titleArabic: "المحرر الذكي والماسح الضوئي",
      titleEnglish: "Editor & Smart OCR",
      emoji: "✨",
      roles: [UserRole.ADMIN, UserRole.STAFF],
      subsections: [
        {
          id: "sub_advanced_studios",
          titleArabic: "استوديوهات الصياغة والمسح",
          titleEnglish: "Drafting & OCR Studios",
          emoji: "⚡",
          roles: [UserRole.ADMIN, UserRole.STAFF],
          items: [
            { id: "doc_editor", label: "محرر المستندات المتطور", emoji: "✍️", roles: [UserRole.ADMIN, UserRole.STAFF] },
            { id: "smart_ocr", label: "الفحص واستخراج النصوص (OCR)", emoji: "🔍", roles: [UserRole.ADMIN, UserRole.STAFF] },
          ]
        }
      ]
    },
    {
      id: "main_system_admin",
      titleArabic: "إدارة التطبيق والمظهر",
      titleEnglish: "App & Theme Settings",
      emoji: "⚙️",
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT, UserRole.SEEKER, UserRole.OPPONENT],
      subsections: [
        {
          id: "sub_system_settings",
          titleArabic: "التصميمات والإعدادات العامة",
          titleEnglish: "Designs & App Settings",
          emoji: "🎨",
          roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT, UserRole.SEEKER, UserRole.OPPONENT],
          items: [
            { id: "designs", label: language === "ar" ? "قسم التصميمات والمظاهر" : "Themes & Designs", emoji: "🎨", roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT, UserRole.SEEKER, UserRole.OPPONENT] },
            { id: "settings", label: t("settings"), emoji: "⚙️", roles: [UserRole.ADMIN] },
          ]
        }
      ]
    }
  ];

  const hasAccessToDashboard = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.STAFF;
  const isRtl = language === "ar";

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. ORIGINAL FLOATING GOLDEN EAGLE CIRCLE LOGO (Diameter 14mm)             */}
      {/* ========================================================================= */}
      
      <div dir={isRtl ? "rtl" : "ltr"}>
        <button
          id="floating-eagle-logo-btn"
          type="button"
          onClick={handleEmblemClick}
          className={`group relative fixed z-50 top-4 w-10 h-10 min-w-10 min-h-10 rounded-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400 hover:border-amber-300 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center p-0.5 overflow-hidden hover:scale-105 active:scale-95 ${isRtl ? "right-4" : "left-4"}`}
          title={language === "ar" ? "شعار ديوان الأستاذ وسام الشناوي - اضغط للتبديل بين أوضاع القائمة" : "Toggle Menu"}
        >
          <div className="w-full h-full transform scale-[0.6] flex items-center justify-center">
            <GoldenEagleEmblem size="exact14mm" glow={false} className="w-full h-full object-contain" />
          </div>
          
          <span 
            className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-slate-950 transition-colors ${
              sidebarMode === "full" 
                ? "bg-emerald-500" 
                : sidebarMode === "emoji" 
                ? "bg-amber-500" 
                : "bg-red-500"
            }`}
          />
        </button>
      </div>

      {/* 2. SIDEBAR CONTAINER */}
      <aside
        className={`fixed top-20 bottom-4 z-40 transition-all duration-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-3xl flex flex-col ${
          sidebarMode === "full" 
            ? "w-[320px]" 
            : sidebarMode === "emoji" 
            ? "w-[80px]" 
            : "w-0 overflow-hidden opacity-0 border-none"
        } ${
          isRtl 
            ? sidebarMode === "hidden" ? "-right-[340px]" : "right-4"
            : sidebarMode === "hidden" ? "-left-[340px]" : "left-4"
        }`}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Top spacer for padding */}
        <div className="h-4 flex-shrink-0" />
        
        {sidebarMode !== "hidden" && (
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-20">
            {/* Nav Items Section */}
            <nav className="p-2.5 space-y-3 font-sans [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              
              {/* 1. Dashboard button */}
              {hasAccessToDashboard && (
                <div>
                  <button
                    id="sidebar-item-dashboard"
                    onClick={() => {
                      setActiveSection("dashboard");
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center rounded-xl font-black transition-all cursor-pointer shadow-md ${
                      sidebarMode === "emoji" ? "justify-center p-2.5" : "justify-between px-3.5 py-2.5"
                    } ${
                      activeSection === "dashboard"
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-r-4 border-amber-600 ring-2 ring-amber-400/40"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    title={t("dashboard")}
                  >
                    <span className="text-xl">🏠</span>
                    {sidebarMode === "full" && (
                      <span className="text-sm font-black text-right flex-1 mr-2.5">
                        {t("dashboard")}
                      </span>
                    )}
                  </button>

                  </div>
              )}
              {/* 2. Hierarchical Sections with RED main categories and DARK BLUE subsections */}
              {categories
                .filter(cat => cat.roles.includes(currentUser.role))
                .map(cat => {
                  const isOpen = openCategories[cat.id] !== false;
                  return (
                    <div key={cat.id} className="space-y-1.5 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      
                      {/* RED MAIN CATEGORY BAR */}
                      {sidebarMode === "full" ? (
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className="w-full flex items-center justify-between px-3 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-xs uppercase cursor-pointer transition-colors text-right rounded-xl shadow-sm border border-red-500"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-base">{cat.emoji}</span>
                            <span className="text-xs font-black tracking-wide">{language === "ar" ? cat.titleArabic : cat.titleEnglish}</span>
                          </span>
                          <span className="text-[11px] text-white/90 font-bold">{isOpen ? "▲" : "▼"}</span>
                        </button>
                      ) : (
                        <div className="flex justify-center py-1 text-center bg-[#dc2626]/20 rounded-lg" title={cat.titleArabic}>
                          <span className="text-lg">{cat.emoji}</span>
                        </div>
                      )}

                      {/* SUBSECTIONS & ITEMS */}
                      {(isOpen || sidebarMode === "emoji") && (
                        <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                          {cat.subsections
                            .filter(sub => sub.roles.includes(currentUser.role))
                            .map(sub => {
                              const allowedItems = sub.items.filter(item => item.roles.includes(currentUser.role));
                              if (allowedItems.length === 0) return null;

                              return (
                                <div key={sub.id} className="space-y-1">
                                  {/* DARK BLUE SUBSECTION HEADER */}
                                  {sidebarMode === "full" && (
                                    <div className="px-2.5 py-1 flex items-center justify-between bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-black text-[11px] border-r-4 border-slate-300 dark:border-slate-600 rounded-md my-1">
                                      <span className="flex items-center gap-1.5">
                                        <span>{sub.emoji}</span>
                                        <span>{language === "ar" ? sub.titleArabic : sub.titleEnglish}</span>
                                      </span>
                                    </div>
                                  )}

                                  {/* Items list */}
                                  <div className={sidebarMode === "full" ? "mr-2 border-r border-[#a8d5ec] dark:border-slate-800 pr-2 space-y-1" : "space-y-1.5"}>
                                    {allowedItems.map(item => {
                                      const isActive = activeSection === item.id;
                                      return (
                                        <button
                                          id={`sidebar-item-${item.id}`}
                                          key={item.id}
                                          onClick={() => {
                                            setActiveSection(item.id);
                                            setIsMobileOpen(false);
                                          }}
                                          className={`w-full flex items-center rounded-xl transition-all duration-200 cursor-pointer ${
                                            sidebarMode === "emoji"
                                              ? "justify-center p-2"
                                              : "justify-start gap-2.5 px-3 py-1.5 text-right"
                                          } ${
                                            isActive
                                              ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md border-r-4 border-amber-600 font-black"
                                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                                          }`}
                                          title={item.label}
                                        >
                                          <span className="text-lg flex-shrink-0">{item.emoji}</span>
                                          {sidebarMode === "full" && (
                                            <span className="text-xs font-black leading-tight flex-1">
                                              {item.label}
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Custom Admin Sections dynamically rendered */}
              {isAdmin && customSections.length > 0 && (
                <div className="space-y-1.5 pb-2 border-b border-[#a8d5ec] dark:border-slate-800/80">
                  {sidebarMode === "full" && (
                    <p className="text-[11px] text-[#0a1e38] dark:text-slate-400 uppercase tracking-wider font-black pr-2 text-right">
                      📂 أقسام مستحدثة
                    </p>
                  )}
                  <div className={sidebarMode === "full" ? "mr-2 border-r border-[#a8d5ec] dark:border-slate-800 pr-2 space-y-1" : "space-y-1"}>
                    {customSections.map((sec) => {
                      const isActive = activeSection === sec.id;
                      return (
                        <button
                          id={`sidebar-item-${sec.id}`}
                          key={sec.id}
                          onClick={() => {
                            setActiveSection(sec.id);
                            setIsMobileOpen(false);
                          }}
                          className={`w-full flex items-center rounded-xl font-black transition-all cursor-pointer ${
                            sidebarMode === "emoji" ? "justify-center p-2.5" : "justify-start gap-2.5 px-3 py-2 text-right"
                          } ${
                            isActive
                              ? "bg-[#0e274a] text-white shadow-md border-r-4 border-amber-400"
                              : "text-[#0d2a42] dark:text-slate-300 hover:bg-[#d0eaf7] dark:hover:bg-slate-800/60"
                          }`}
                          title={sec.nameArabic}
                        >
                          <span className="text-lg">📁</span>
                          {sidebarMode === "full" && (
                            <span className="text-xs font-black">{sec.nameArabic}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </nav>
          </div>
        )}

        {/* Bottom space - Footer text removed as requested */}
      </aside>
    </>
  );
}
