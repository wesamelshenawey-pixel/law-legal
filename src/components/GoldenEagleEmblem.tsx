import React from "react";

interface GoldenEagleEmblemProps {
  size?: "exact14mm" | "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  glow?: boolean;
}

export default function GoldenEagleEmblem({
  size = "md",
  className = "",
  glow = true
}: GoldenEagleEmblemProps) {
  const sizeClasses = {
    exact14mm: "w-[14mm] h-[14mm]",
    sm: "w-10 h-8",
    md: "w-16 h-12",
    lg: "w-24 h-18",
    xl: "w-32 h-24",
    hero: "w-48 h-36"
  };

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${sizeClasses[size]} ${className}`}>
      {glow && (
        <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full pointer-events-none transform scale-110" />
      )}
      
      <svg
        viewBox="0 0 600 450"
        className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(217,119,6,0.35)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Majestic Gold Gradients */}
          <linearGradient id="goldFeatherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="25%" stopColor="#FCD34D" />
            <stop offset="60%" stopColor="#D97706" />
            <stop offset="90%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="20%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="80%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          <linearGradient id="scalePanGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          <linearGradient id="handcuffsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>

          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#D97706" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <filter id="goldenDrop" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#B45309" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer Circular Laurel / Wreath Emblem */}
        <circle cx="300" cy="200" r="140" stroke="url(#goldMetallic)" strokeWidth="4" fill="#0A0F1D" fillOpacity="0.8" />
        <circle cx="300" cy="200" r="132" stroke="#FCD34D" strokeWidth="1.5" strokeDasharray="6 3" />
        
        {/* Sunburst background rays inside circle */}
        <circle cx="300" cy="200" r="128" fill="url(#sunGlow)" />

        {/* Decorative Laurel Leaves / Ornaments around the ring */}
        <g stroke="url(#goldMetallic)" strokeWidth="2" fill="none">
          <path d="M 200 120 C 180 160 180 240 200 280" />
          <path d="M 400 120 C 420 160 420 240 400 280" />
          {/* Laurel Leaf Sprays */}
          <path d="M 185 140 Q 170 145 180 155 Q 190 145 185 140 Z" fill="url(#goldFeatherGrad)" />
          <path d="M 180 170 Q 165 175 175 185 Q 185 175 180 170 Z" fill="url(#goldFeatherGrad)" />
          <path d="M 180 200 Q 165 205 175 215 Q 185 205 180 200 Z" fill="url(#goldFeatherGrad)" />
          <path d="M 185 230 Q 170 235 180 245 Q 190 235 185 230 Z" fill="url(#goldFeatherGrad)" />

          <path d="M 415 140 Q 430 145 420 155 Q 410 145 415 140 Z" fill="url(#goldFeatherGrad)" />
          <path d="M 420 170 Q 435 175 425 185 Q 415 175 420 170 Z" fill="url(#goldFeatherGrad)" />
          <path d="M 420 200 Q 435 205 425 215 Q 415 205 420 200 Z" fill="url(#goldFeatherGrad)" />
          <path d="M 415 230 Q 430 235 420 245 Q 410 235 415 230 Z" fill="url(#goldFeatherGrad)" />
        </g>

        {/* ========================================================================= */}
        {/* 1. LEFT SCALE OF JUSTICE */}
        {/* ========================================================================= */}
        <g filter="url(#goldenDrop)">
          {/* Top Ring Anchor */}
          <circle cx="85" cy="110" r="8" stroke="url(#goldMetallic)" strokeWidth="3" fill="#1E293B" />
          {/* Suspension Rod */}
          <line x1="85" y1="118" x2="85" y2="170" stroke="url(#goldMetallic)" strokeWidth="3" />
          {/* Scale Crossbar Beam */}
          <line x1="45" y1="170" x2="125" y2="170" stroke="url(#goldMetallic)" strokeWidth="4" strokeLinecap="round" />
          
          {/* Left Pan Triple Chains */}
          <line x1="50" y1="170" x2="35" y2="295" stroke="#FDE68A" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="85" y1="170" x2="85" y2="295" stroke="#FDE68A" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="120" y1="170" x2="135" y2="295" stroke="#FDE68A" strokeWidth="2" strokeDasharray="3 2" />
          
          {/* Scale Pan (Deep Golden Bowl) */}
          <path
            d="M 25 295 Q 85 365 145 295 Z"
            fill="url(#scalePanGold)"
            stroke="url(#goldMetallic)"
            strokeWidth="3.5"
          />
          {/* Pan Rim Highlights */}
          <ellipse cx="85" cy="295" rx="60" ry="12" fill="#FDE68A" fillOpacity="0.4" stroke="url(#goldMetallic)" strokeWidth="2" />
        </g>

        {/* ========================================================================= */}
        {/* 2. RIGHT SCALE OF JUSTICE */}
        {/* ========================================================================= */}
        <g filter="url(#goldenDrop)">
          {/* Top Ring Anchor */}
          <circle cx="515" cy="110" r="8" stroke="url(#goldMetallic)" strokeWidth="3" fill="#1E293B" />
          {/* Suspension Rod */}
          <line x1="515" y1="118" x2="515" y2="170" stroke="url(#goldMetallic)" strokeWidth="3" />
          {/* Scale Crossbar Beam */}
          <line x1="475" y1="170" x2="555" y2="170" stroke="url(#goldMetallic)" strokeWidth="4" strokeLinecap="round" />
          
          {/* Right Pan Triple Chains */}
          <line x1="480" y1="170" x2="465" y2="295" stroke="#FDE68A" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="515" y1="170" x2="515" y2="295" stroke="#FDE68A" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="550" y1="170" x2="565" y2="295" stroke="#FDE68A" strokeWidth="2" strokeDasharray="3 2" />
          
          {/* Scale Pan (Deep Golden Bowl) */}
          <path
            d="M 455 295 Q 515 365 575 295 Z"
            fill="url(#scalePanGold)"
            stroke="url(#goldMetallic)"
            strokeWidth="3.5"
          />
          {/* Pan Rim Highlights */}
          <ellipse cx="515" cy="295" rx="60" ry="12" fill="#FDE68A" fillOpacity="0.4" stroke="url(#goldMetallic)" strokeWidth="2" />
        </g>

        {/* ========================================================================= */}
        {/* 3. MAJESTIC GOLDEN EAGLE */}
        {/* ========================================================================= */}
        <g filter="url(#goldenDrop)">
          {/* --- LEFT WING (Detailed Layered Feathers) --- */}
          {/* Upper Wing Arc */}
          <path
            d="M 300 160 C 220 120 120 70 65 50 C 70 85 95 130 140 165 C 105 170 75 190 60 210 C 100 205 140 195 185 185 C 150 200 120 225 105 245 C 145 235 185 215 225 195 Z"
            fill="url(#goldFeatherGrad)"
            stroke="url(#goldMetallic)"
            strokeWidth="2"
          />
          {/* Left Wing Primary Feather Rows */}
          <path d="M 120 70 Q 200 130 260 165" stroke="#FEF3C7" strokeWidth="2" fill="none" />
          <path d="M 90 100 Q 180 150 240 175" stroke="#FEF3C7" strokeWidth="1.5" fill="none" />
          <path d="M 80 140 Q 160 170 220 185" stroke="#FEF3C7" strokeWidth="1.5" fill="none" />
          <path d="M 95 180 Q 160 190 200 195" stroke="#FEF3C7" strokeWidth="1.5" fill="none" />

          {/* --- RIGHT WING (Detailed Layered Feathers) --- */}
          {/* Upper Wing Arc */}
          <path
            d="M 300 160 C 380 120 480 70 535 50 C 530 85 505 130 460 165 C 495 170 525 190 540 210 C 500 205 460 195 415 185 C 450 200 480 225 495 245 C 455 235 415 215 375 195 Z"
            fill="url(#goldFeatherGrad)"
            stroke="url(#goldMetallic)"
            strokeWidth="2"
          />
          {/* Right Wing Primary Feather Rows */}
          <path d="M 480 70 Q 400 130 340 165" stroke="#FEF3C7" strokeWidth="2" fill="none" />
          <path d="M 510 100 Q 420 150 360 175" stroke="#FEF3C7" strokeWidth="1.5" fill="none" />
          <path d="M 520 140 Q 440 170 380 185" stroke="#FEF3C7" strokeWidth="1.5" fill="none" />
          <path d="M 505 180 Q 440 190 400 195" stroke="#FEF3C7" strokeWidth="1.5" fill="none" />

          {/* Eagle Tail Feathers */}
          <path
            d="M 275 230 L 260 270 L 285 265 L 300 278 L 315 265 L 340 270 L 325 230 Z"
            fill="url(#goldFeatherGrad)"
            stroke="url(#goldMetallic)"
            strokeWidth="2"
          />

          {/* Eagle Body & Torso */}
          <path
            d="M 270 170 Q 255 210 275 240 Q 300 250 325 240 Q 345 210 330 170 Z"
            fill="url(#goldMetallic)"
            stroke="#78350F"
            strokeWidth="2"
          />
          {/* Chest Feathers Texturing */}
          <path d="M 285 190 Q 300 205 315 190" stroke="#FEF3C7" strokeWidth="2" fill="none" />
          <path d="M 280 205 Q 300 220 320 205" stroke="#FEF3C7" strokeWidth="2" fill="none" />
          <path d="M 285 220 Q 300 235 315 220" stroke="#FEF3C7" strokeWidth="2" fill="none" />

          {/* Eagle Head & Crown */}
          <path
            d="M 285 140 C 285 110 300 95 300 95 C 300 95 315 110 315 140 C 315 160 285 160 285 140 Z"
            fill="#FFFBEB"
            stroke="url(#goldMetallic)"
            strokeWidth="2"
          />
          {/* Golden Curved Sharp Beak */}
          <path
            d="M 293 125 Q 300 145 300 152 Q 307 145 307 125 Z"
            fill="#F59E0B"
            stroke="#92400E"
            strokeWidth="1.5"
          />
          {/* Fierce Eagle Eyes */}
          <circle cx="292" cy="120" r="2.5" fill="#78350F" />
          <circle cx="308" cy="120" r="2.5" fill="#78350F" />
          <circle cx="292.5" cy="119.5" r="0.8" fill="#FFFFFF" />
          <circle cx="308.5" cy="119.5" r="0.8" fill="#FFFFFF" />

          {/* Eagle Claws gripping the Chain */}
          {/* Left Claw */}
          <path d="M 275 240 L 268 258 M 275 240 L 275 260 M 275 240 L 282 258" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
          {/* Right Claw */}
          <path d="M 325 240 L 318 258 M 325 240 L 325 260 M 325 240 L 332 258" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* ========================================================================= */}
        {/* 4. CRIMINAL JUSTICE HANDCUFFS (القيود الجنائية) */}
        {/* ========================================================================= */}
        <g filter="url(#goldenDrop)">
          {/* Center Interlocking Connecting Chain Links */}
          <ellipse cx="300" cy="265" rx="8" ry="4" stroke="url(#goldMetallic)" strokeWidth="3" fill="none" />
          <ellipse cx="288" cy="270" rx="8" ry="4" stroke="url(#goldMetallic)" strokeWidth="3" fill="none" transform="rotate(-20 288 270)" />
          <ellipse cx="312" cy="270" rx="8" ry="4" stroke="url(#goldMetallic)" strokeWidth="3" fill="none" transform="rotate(20 312 270)" />

          {/* Left Handcuff (Openable Shackle & Lock Mechanism) */}
          <g transform="rotate(15 250 300)">
            <circle cx="250" cy="300" r="32" stroke="url(#handcuffsGrad)" strokeWidth="8" fill="#0A0F1D" fillOpacity="0.4" />
            <circle cx="250" cy="300" r="32" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="4 2" fill="none" />
            {/* Lock Block Box */}
            <rect x="238" y="260" width="24" height="14" rx="3" fill="url(#goldMetallic)" stroke="#78350F" strokeWidth="1.5" />
            {/* Keyhole */}
            <circle cx="250" cy="266" r="1.5" fill="#000" />
            <line x1="250" y1="267" x2="250" y2="271" stroke="#000" strokeWidth="1.2" />
          </g>

          {/* Right Handcuff (Openable Shackle & Lock Mechanism) */}
          <g transform="rotate(-15 350 300)">
            <circle cx="350" cy="300" r="32" stroke="url(#handcuffsGrad)" strokeWidth="8" fill="#0A0F1D" fillOpacity="0.4" />
            <circle cx="350" cy="300" r="32" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="4 2" fill="none" />
            {/* Lock Block Box */}
            <rect x="338" y="260" width="24" height="14" rx="3" fill="url(#goldMetallic)" stroke="#78350F" strokeWidth="1.5" />
            {/* Keyhole */}
            <circle cx="350" cy="266" r="1.5" fill="#000" />
            <line x1="350" y1="267" x2="350" y2="271" stroke="#000" strokeWidth="1.2" />
          </g>
        </g>

        {/* ========================================================================= */}
        {/* 5. FAMILY & CIVIL STATUS EMBLEM (رمز قضايا الأسرة والأحوال الشخصية) */}
        {/* ========================================================================= */}
        <g transform="translate(0, 10)">
          {/* Bottom Medallion Base Arc */}
          <path
            d="M 230 360 C 230 410 370 410 370 360"
            stroke="url(#goldMetallic)"
            strokeWidth="3"
            fill="none"
          />
          {/* Bottom Center Diamond Accent */}
          <polygon points="300,418 306,410 300,402 294,410" fill="url(#goldMetallic)" />

          {/* --- MAN ICON (Father - Left) --- */}
          {/* Head */}
          <circle cx="270" cy="340" r="9" stroke="url(#goldMetallic)" strokeWidth="2.5" fill="#FFFBEB" />
          {/* Body/Suit */}
          <path
            d="M 258 354 L 282 354 L 284 395 L 277 395 L 273 372 L 267 372 L 263 395 L 256 395 Z"
            fill="url(#goldFeatherGrad)"
            stroke="url(#goldMetallic)"
            strokeWidth="2"
          />

          {/* --- CHILD ICON (In the center, smaller) --- */}
          {/* Head */}
          <circle cx="300" cy="355" r="7" stroke="url(#goldMetallic)" strokeWidth="2" fill="#FFFBEB" />
          {/* Body */}
          <path
            d="M 292 366 L 308 366 L 309 395 L 304 395 L 302 380 L 298 380 L 296 395 L 291 395 Z"
            fill="url(#goldMetallic)"
            stroke="#92400E"
            strokeWidth="1.5"
          />

          {/* --- WOMAN ICON (Mother - Right) --- */}
          {/* Head */}
          <circle cx="330" cy="340" r="9" stroke="url(#goldMetallic)" strokeWidth="2.5" fill="#FFFBEB" />
          {/* Dress Body */}
          <path
            d="M 319 354 L 341 354 L 347 395 L 313 395 Z"
            fill="url(#goldFeatherGrad)"
            stroke="url(#goldMetallic)"
            strokeWidth="2"
          />
          {/* Filigree Ornament inside Dress */}
          <path d="M 330 358 L 330 388 M 324 372 Q 330 380 336 372" stroke="#78350F" strokeWidth="1.2" fill="none" />
        </g>
      </svg>
    </div>
  );
}
