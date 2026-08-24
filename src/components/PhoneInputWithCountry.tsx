import React, { useState } from "react";
import { ChevronDown, Globe, Search } from "lucide-react";

export interface CountryCode {
  code: string;
  name: string;
  nameEn: string;
  flag: string;
  iso: string;
  formatPlaceholder: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "+20", name: "مصر", nameEn: "Egypt", flag: "🇪🇬", iso: "EG", formatPlaceholder: "010XXXXXXXX" },
  { code: "+966", name: "السعودية", nameEn: "Saudi Arabia", flag: "🇸🇦", iso: "SA", formatPlaceholder: "05XXXXXXXX" },
  { code: "+971", name: "الإمارات", nameEn: "UAE", flag: "🇦🇪", iso: "AE", formatPlaceholder: "050XXXXXXX" },
  { code: "+965", name: "الكويت", nameEn: "Kuwait", flag: "🇰🇼", iso: "KW", formatPlaceholder: "XXXXXXXX" },
  { code: "+974", name: "قطر", nameEn: "Qatar", flag: "🇶🇦", iso: "QA", formatPlaceholder: "XXXXXXXX" },
  { code: "+973", name: "البحرين", nameEn: "Bahrain", flag: "🇧🇭", iso: "BH", formatPlaceholder: "XXXXXXXX" },
  { code: "+968", name: "عُمان", nameEn: "Oman", flag: "🇴🇲", iso: "OM", formatPlaceholder: "XXXXXXXX" },
  { code: "+962", name: "الأردن", nameEn: "Jordan", flag: "🇯🇴", iso: "JO", formatPlaceholder: "07XXXXXXXX" },
  { code: "+961", name: "لبنان", nameEn: "Lebanon", flag: "🇱🇧", iso: "LB", formatPlaceholder: "XX XXXXXX" },
  { code: "+964", name: "العراق", nameEn: "Iraq", flag: "🇮🇶", iso: "IQ", formatPlaceholder: "07XXXXXXXXX" },
  { code: "+212", name: "المغرب", nameEn: "Morocco", flag: "🇲🇦", iso: "MA", formatPlaceholder: "06XXXXXXXX" },
  { code: "+213", name: "الجزائر", nameEn: "Algeria", flag: "🇩🇿", iso: "DZ", formatPlaceholder: "0XXXXXXXXX" },
  { code: "+216", name: "تونس", nameEn: "Tunisia", flag: "🇹🇳", iso: "TN", formatPlaceholder: "XXXXXXXX" },
  { code: "+218", name: "ليبيا", nameEn: "Libya", flag: "🇱🇾", iso: "LY", formatPlaceholder: "09XXXXXXXX" },
  { code: "+249", name: "السودان", nameEn: "Sudan", flag: "🇸🇩", iso: "SD", formatPlaceholder: "09XXXXXXXX" },
  { code: "+963", name: "سوريا", nameEn: "Syria", flag: "🇸🇾", iso: "SY", formatPlaceholder: "09XXXXXXXX" },
  { code: "+970", name: "فلسطين", nameEn: "Palestine", flag: "🇵🇸", iso: "PS", formatPlaceholder: "05XXXXXXXX" },
  { code: "+967", name: "اليمن", nameEn: "Yemen", flag: "🇾🇪", iso: "YE", formatPlaceholder: "7XXXXXXXX" },
  { code: "+1", name: "الولايات المتحدة / كندا", nameEn: "USA / Canada", flag: "🇺🇸", iso: "US", formatPlaceholder: "XXX-XXX-XXXX" },
  { code: "+44", name: "المملكة المتحدة", nameEn: "UK", flag: "🇬🇧", iso: "GB", formatPlaceholder: "07XXXXXXXXX" },
  { code: "+33", name: "فرنسا", nameEn: "France", flag: "🇫🇷", iso: "FR", formatPlaceholder: "06XXXXXXXX" },
  { code: "+49", name: "ألمانيا", nameEn: "Germany", flag: "🇩🇪", iso: "DE", formatPlaceholder: "01XXXXXXXXXX" },
  { code: "+39", name: "إيطاليا", nameEn: "Italy", flag: "🇮🇹", iso: "IT", formatPlaceholder: "3XXXXXXXXX" },
  { code: "+34", name: "إسبانيا", nameEn: "Spain", flag: "🇪🇸", iso: "ES", formatPlaceholder: "6XXXXXXXX" },
  { code: "+90", name: "تركيا", nameEn: "Turkey", flag: "🇹🇷", iso: "TR", formatPlaceholder: "5XXXXXXXXX" },
  { code: "+7", name: "روسيا", nameEn: "Russia", flag: "🇷🇺", iso: "RU", formatPlaceholder: "9XXXXXXXXX" },
  { code: "+86", name: "الصين", nameEn: "China", flag: "🇨🇳", iso: "CN", formatPlaceholder: "1XXXXXXXXXX" },
  { code: "+91", name: "الهند", nameEn: "India", flag: "🇮🇳", iso: "IN", formatPlaceholder: "9XXXXXXXXX" },
  { code: "+81", name: "اليابان", nameEn: "Japan", flag: "🇯🇵", iso: "JP", formatPlaceholder: "090XXXXXXXX" },
  { code: "+61", name: "أستراليا", nameEn: "Australia", flag: "🇦🇺", iso: "AU", formatPlaceholder: "04XXXXXXXX" },
  { code: "+55", name: "البرازيل", nameEn: "Brazil", flag: "🇧🇷", iso: "BR", formatPlaceholder: "XX 9XXXXXXXX" },
];

interface PhoneInputWithCountryProps {
  id?: string;
  value: string;
  onChange: (fullPhoneNumber: string, countryCode: string, nationalNumber: string) => void;
  defaultCountryCode?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function PhoneInputWithCountry({
  id = "phone-input-country",
  value,
  onChange,
  defaultCountryCode = "+20",
  placeholder,
  required = false,
  className = "",
  disabled = false,
}: PhoneInputWithCountryProps) {
  // Extract initial country code if present in value
  const matchedCountry = COUNTRY_CODES.find(c => value?.startsWith(c.code)) || 
    COUNTRY_CODES.find(c => c.code === defaultCountryCode) || 
    COUNTRY_CODES[0];

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(matchedCountry);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Extract national number
  const nationalNumber = value?.startsWith(selectedCountry.code) 
    ? value.substring(selectedCountry.code.length).trim() 
    : value || "";

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch("");
    const updatedFull = nationalNumber ? `${country.code} ${nationalNumber}`.trim() : "";
    onChange(updatedFull, country.code, nationalNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleanNum = raw.replace(/[^\d\s-]/g, "");
    const full = cleanNum ? `${selectedCountry.code} ${cleanNum}`.trim() : "";
    onChange(full, selectedCountry.code, cleanNum);
  };

  const filteredCountries = COUNTRY_CODES.filter(c => 
    c.name.includes(search) || 
    c.nameEn.toLowerCase().includes(search.toLowerCase()) || 
    c.code.includes(search) ||
    c.iso.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative flex items-center w-full ${className}`} dir="ltr">
      {/* Country Code Dropdown Trigger */}
      <div className="relative flex-shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 h-10 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-850 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-l-xl transition font-mono text-xs cursor-pointer select-none"
          title={`${selectedCountry.name} (${selectedCountry.code})`}
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="font-bold text-[11px]">{selectedCountry.code}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 max-h-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150" dir="rtl">
            {/* Search header */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن دولة أو كود دولي..."
                className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-56 divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredCountries.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">لا توجد نتائج تطابق بحثك</div>
              ) : (
                filteredCountries.map((c) => (
                  <button
                    key={c.code + c.iso}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 transition text-right cursor-pointer ${
                      selectedCountry.iso === c.iso ? "bg-amber-100/60 dark:bg-amber-900/30 font-bold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.flag}</span>
                      <span className="text-slate-800 dark:text-slate-200">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({c.iso})</span>
                    </div>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400" dir="ltr">
                      {c.code}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* National Phone Number Input */}
      <input
        id={id}
        type="tel"
        dir="ltr"
        disabled={disabled}
        required={required}
        value={nationalNumber}
        onChange={handleNumberChange}
        placeholder={placeholder || selectedCountry.formatPlaceholder}
        className="flex-1 h-10 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-l-0 border-slate-300 dark:border-slate-700 rounded-r-xl font-mono text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition placeholder:text-slate-400"
      />
    </div>
  );
}
