import React from "react";
import { ShieldCheck, Scale, Award } from "lucide-react";

export interface LawyerSignatureSealProps {
  date?: string;
  hash?: string;
  size?: "sm" | "md" | "lg";
  showSealBorder?: boolean;
  signedBy?: string;
  signedAt?: string;
  verificationHash?: string;
  lawyerName?: string;
  nationalId?: string;
  digitalStamp?: string;
  signatureImage?: string;
}

export default function LawyerSignatureSeal({
  date,
  hash,
  size = "md",
  showSealBorder = true,
  signedBy,
  signedAt,
  verificationHash,
  lawyerName = "الأستاذ المحامي",
  nationalId,
  digitalStamp = "ديوان المحاماة والاستشارات القانونية - محكمة النقض",
  signatureImage
}: LawyerSignatureSealProps) {
  const actualHash = verificationHash || hash;
  const actualDate = signedAt || date;
  const displayDate = actualDate ? new Date(actualDate).toLocaleDateString("ar-EG") : new Date().toLocaleDateString("ar-EG");

  return (
    <div
      className={`inline-flex flex-col items-center justify-center text-center p-3 rounded-2xl bg-amber-50/50 dark:bg-slate-900/60 transition select-none ${
        showSealBorder ? "border-2 border-amber-500/30 dark:border-amber-600/30 shadow-xs" : ""
      }`}
      dir="rtl"
    >
      <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold text-[10px] pb-1 border-b border-amber-200 dark:border-slate-800 w-full justify-center">
        <Scale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="font-extrabold">مكتب الأستاذ المحامي</span>
      </div>

      <div className="py-2 px-1 relative w-full flex items-center justify-center">
        {/* Stylized Vector Calligraphic Signature of "المحامي المحامي" */}
        <svg
          viewBox="0 0 450 140"
          className={`w-full max-w-[240px] ${size === "sm" ? "h-12" : size === "lg" ? "h-24" : "h-16"} text-slate-950 dark:text-amber-100 fill-current filter drop-shadow-xs`}
          aria-label="توقيع الأستاذ المحامي المحامي"
        >
          {/* Main calligraphic stroke representation */}
          <path
            d="M 25,65 Q 120,20 280,18 Q 420,16 435,55 Q 445,85 360,110 Q 230,135 110,135 Q 20,135 15,100 Q 12,75 55,70 Q 140,60 270,62 Q 380,64 425,75"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* "وسام" looping flourish */}
          <path
            d="M 390,75 Q 375,60 360,78 Q 345,95 330,75 Q 320,60 305,75 Q 295,95 285,115"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* "أحمد" vertical riser & stroke */}
          <path
            d="M 270,25 L 265,110 Q 260,125 245,95 Q 235,70 215,80 Q 195,90 180,120"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          {/* "الشناوي" sweep & tail */}
          <path
            d="M 190,65 Q 170,45 140,65 Q 115,85 80,75 Q 50,68 35,90 Q 25,108 50,115 Q 100,125 210,105 Q 320,85 410,50"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* "المحامي" inscription below */}
          <path
            d="M 230,115 Q 210,138 190,125 Q 175,115 195,95 Q 215,80 235,110 Q 245,130 255,138"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>

        {/* Certified stamp icon overlay */}
        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-xs">
          <ShieldCheck className="w-3 h-3" />
        </div>
      </div>

      <div className="w-full pt-1 border-t border-amber-200/80 dark:border-slate-800 space-y-0.5 text-[9px] text-slate-600 dark:text-slate-400">
        <div className="font-bold text-amber-950 dark:text-amber-200">
          المحامي بالنقض والدستورية العليا
        </div>
        <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-0.5">
          <span>التاريخ: {displayDate}</span>
          <span>{hash ? hash.substring(0, 12) + "..." : "E-SIG-WESAM"}</span>
        </div>
      </div>
    </div>
  );
}
