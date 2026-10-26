import React, { useState, useEffect } from "react";
import { Announcement } from "../types";
import { Megaphone, ChevronRight, ChevronLeft, ExternalLink, Pause, Play, EyeOff, Eye, ChevronUp, ChevronDown, BellRing } from "lucide-react";

interface AnnouncementTickerProps {
  announcements: Announcement[];
  onNavigateToAnnouncements: () => void;
  language: "ar" | "en";
}

export default function AnnouncementTicker({
  announcements,
  onNavigateToAnnouncements,
  language
}: AnnouncementTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    return localStorage.getItem("law_ticker_minimized") === "true";
  });

  const activeAnnouncements = announcements.filter(a => a.showInTicker !== false);

  useEffect(() => {
    if (activeAnnouncements.length <= 1 || isPaused || isMinimized) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [activeAnnouncements.length, isPaused, isMinimized]);

  if (activeAnnouncements.length === 0) return null;

  const current = activeAnnouncements[currentIndex] || activeAnnouncements[0];

  const toggleMinimized = () => {
    const nextVal = !isMinimized;
    setIsMinimized(nextVal);
    localStorage.setItem("law_ticker_minimized", String(nextVal));
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "high":
        return "bg-rose-600 text-white animate-pulse";
      case "medium":
        return "bg-amber-500 text-slate-950 font-black";
      default:
        return "bg-emerald-600 text-white font-bold";
    }
  };

  // If minimized, render a compact floating pill that never blocks any options
  if (isMinimized) {
    return (
      <div 
        className="inline-flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 text-white px-3 py-1 shadow-md backdrop-blur-md text-[11px] font-sans select-none transition-all rounded-full border border-amber-500/50 cursor-pointer group"
        onClick={toggleMinimized}
        title={language === "ar" ? "اضغط لتوسيع شريط الإعلانات" : "Click to expand announcement ticker"}
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <span className="flex items-center gap-1.5 text-amber-400 font-black">
          <Megaphone className="w-3.5 h-3.5 animate-bounce" />
          <span>{language === "ar" ? "شريط الإعلانات" : "Bulletin"}</span>
        </span>
        <span className="hidden sm:inline text-slate-300 truncate max-w-[200px]">
          {current.title}
        </span>
        <span className="p-0.5 rounded-full bg-white/10 group-hover:bg-amber-500 group-hover:text-slate-950 transition text-amber-400">
          <ChevronDown className="w-3 h-3" />
        </span>
      </div>
    );
  }

  return (
    <div 
      className="w-full bg-slate-900/95 hover:bg-slate-900 text-white px-2.5 sm:px-4 py-1.5 shadow-lg backdrop-blur-md flex items-center justify-between gap-2 text-xs font-sans select-none transition-all rounded-2xl sm:rounded-full border border-amber-500/40"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Label Badge */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black text-amber-400 border border-amber-500/30">
          <Megaphone className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">{language === "ar" ? "إعلان ديواني" : "Bulletin"}</span>
        </span>
        
        {current.isPinned && (
          <span className="hidden md:inline-flex items-center gap-0.5 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
            📌 {language === "ar" ? "مثبّت" : "Pinned"}
          </span>
        )}
      </div>

      {/* Main Announcement Text */}
      <div className="flex-1 overflow-hidden px-1 sm:px-2 flex items-center gap-1.5 min-w-0">
        <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0 font-black ${getPriorityBadge(current.priority)}`}>
          {current.priority === "high" ? "عاجل" : current.priority === "medium" ? "تنبيه" : "بيان"}
        </span>
        <button
          type="button"
          onClick={onNavigateToAnnouncements}
          className="truncate text-[11px] sm:text-xs text-white hover:text-amber-300 transition-colors text-right cursor-pointer flex-1"
          title={current.content}
        >
          <span className="font-black text-amber-300 ml-1">
            {current.title}:
          </span>
          <span className="font-medium text-slate-200">
            {current.content}
          </span>
        </button>
      </div>

      {/* Controls & Nav */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {activeAnnouncements.length > 1 && (
          <div className="flex items-center gap-0.5 bg-white/10 rounded-full px-1 py-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length);
              }}
              className="p-0.5 hover:bg-white/20 rounded-full text-white cursor-pointer"
              title="السابق"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
            <span className="text-[9px] sm:text-[10px] font-mono text-amber-300 px-1 font-bold">
              {currentIndex + 1}/{activeAnnouncements.length}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
              }}
              className="p-0.5 hover:bg-white/20 rounded-full text-white cursor-pointer"
              title="التالي"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onNavigateToAnnouncements}
          className="hidden sm:flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black text-[10px] transition-all cursor-pointer shadow-xs"
        >
          <ExternalLink className="w-2.5 h-2.5" />
          <span>{language === "ar" ? "الكل" : "All"}</span>
        </button>

        {/* Minimize / Collapse Button to prevent blocking screen options */}
        <button
          type="button"
          onClick={toggleMinimized}
          className="p-1 text-slate-400 hover:text-white hover:bg-white/15 rounded-full transition cursor-pointer"
          title={language === "ar" ? "تصغير الشريط الإعلاني لكشف الخيارات" : "Minimize Ticker"}
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
