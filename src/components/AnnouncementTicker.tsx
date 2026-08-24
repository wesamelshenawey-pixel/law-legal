import React, { useState, useEffect } from "react";
import { Announcement, PlatformUser, UserRole } from "../types";
import { Megaphone, ChevronRight, ChevronLeft, Bell, ExternalLink, Sparkles, AlertTriangle } from "lucide-react";

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

  const activeAnnouncements = announcements.filter(a => a.showInTicker !== false);

  useEffect(() => {
    if (activeAnnouncements.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [activeAnnouncements.length, isPaused]);

  if (activeAnnouncements.length === 0) return null;

  const current = activeAnnouncements[currentIndex] || activeAnnouncements[0];

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "high":
        return "bg-red-600 text-white animate-pulse";
      case "medium":
        return "bg-amber-500 text-slate-950";
      default:
        return "bg-emerald-600 text-white";
    }
  };

  return (
    <div 
      className="w-full bg-gradient-to-r from-red-600 via-amber-600 to-red-700 text-white px-3 py-1.5 shadow-[0_4px_15px_rgba(220,38,38,0.3)] flex items-center justify-between gap-2 text-xs font-sans select-none transition-all rounded-xl md:rounded-full border border-amber-500/30"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Label Badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-black text-amber-300 border border-amber-400/40">
          <Megaphone className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
          {language !== "ar" && <span>Office Bulletins</span>}
        </span>
        
        {current.isPinned && (
          <span className="hidden sm:inline-flex items-center gap-0.5 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
            📌 {language === "ar" ? "مثبّت" : "Pinned"}
          </span>
        )}
      </div>

      {/* Main Announcement Text / Ticker */}
      <div className="flex-1 overflow-hidden px-2 flex items-center gap-2 min-w-0">
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${getPriorityBadge(current.priority)}`}>
          {current.priority === "high" ? "عاجل" : current.priority === "medium" ? "تنبيه" : "بيان"}
        </span>
        <button
          type="button"
          onClick={onNavigateToAnnouncements}
          className="truncate font-black text-white hover:text-amber-200 transition-colors text-right cursor-pointer flex-1"
          title={current.content}
        >
          <span className="font-extrabold underline decoration-amber-300 underline-offset-2 ml-1">
            {current.title}:
          </span>
          <span className="font-medium text-amber-100 opacity-95">
            {current.content}
          </span>
        </button>
      </div>

      {/* Controls & Open Section Link */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {activeAnnouncements.length > 1 && (
          <div className="hidden md:flex items-center gap-1 bg-black/20 rounded-md px-1 py-0.5">
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length)}
              className="p-0.5 hover:bg-white/20 rounded text-white cursor-pointer"
              title="السابق"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono text-amber-200 px-1">
              {currentIndex + 1}/{activeAnnouncements.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length)}
              className="p-0.5 hover:bg-white/20 rounded text-white cursor-pointer"
              title="التالي"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onNavigateToAnnouncements}
          className="flex items-center gap-1 bg-white hover:bg-amber-100 text-slate-900 px-2 py-1 rounded-lg font-black text-[10px] transition-all cursor-pointer shadow-sm"
        >
          <ExternalLink className="w-3 h-3 text-red-600" />
          <span className="hidden sm:inline">{language === "ar" ? "مركز الإعلانات" : "Bulletin Hub"}</span>
        </button>
      </div>
    </div>
  );
}
