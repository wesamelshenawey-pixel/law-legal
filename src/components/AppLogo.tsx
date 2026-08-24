import React from "react";
import GoldenEagleEmblem from "./GoldenEagleEmblem";

interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textColor?: string;
}

export default function AppLogo({
  className = "",
  size = "md",
  showText = true,
  textColor = "text-white"
}: AppLogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Golden Eagle Judicial Crest */}
      <GoldenEagleEmblem size={size} />

      {showText && (
        <div className="flex flex-col text-right leading-tight">
          <span className="text-[11px] font-extrabold text-amber-400 font-sans tracking-wide">
            الأستاذ
          </span>
          <span className={`font-black text-sm ${textColor} tracking-tight font-sans`}>
            وسام حمدي الشناوي
          </span>
          <span className="text-[10px] font-bold text-amber-500/90 font-sans">
            المحامي بالنقض والدستورية العليا
          </span>
        </div>
      )}
    </div>
  );
}

