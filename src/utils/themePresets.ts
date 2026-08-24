export interface DesignPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  taglineEn: string;
  descriptionAr: string;
  descriptionEn: string;
  badgeAr: string;
  badgeEn: string;
  isDark: boolean;
  accentColor: string;
  borderRadius: "sharp" | "classic" | "modern" | "pill";
  fontFamily: "cairo" | "amiri" | "tajawal" | "almarai" | "kufi";
  cardElevation: "subtle" | "glass" | "flat" | "gold_bordered";
  backgroundWatermark: "none" | "eagle" | "scales" | "geometric" | "watermark_seal";
  displayDensity: "compact" | "comfortable" | "spacious";
  headerGradient: string;
  previewColors: string[];
  recommendedForAr: string;
  recommendedForEn: string;
  cssRootVars?: Record<string, string>;
}

export interface UserDesignPreferences {
  currentPresetId: string;
  accentColor: string;
  isDarkMode: boolean;
  borderRadius: "sharp" | "classic" | "modern" | "pill";
  fontFamily: "cairo" | "amiri" | "tajawal" | "almarai" | "kufi";
  cardElevation: "subtle" | "glass" | "flat" | "gold_bordered";
  backgroundWatermark: "none" | "eagle" | "scales" | "geometric" | "watermark_seal";
  displayDensity: "compact" | "comfortable" | "spacious";
  soundEffectsEnabled: boolean;
  highContrastMode: boolean;
}

export const DEFAULT_DESIGN_PREFERENCES: UserDesignPreferences = {
  currentPresetId: "classic_gold",
  accentColor: "amber",
  isDarkMode: false,
  borderRadius: "modern",
  fontFamily: "cairo",
  cardElevation: "subtle",
  backgroundWatermark: "scales",
  displayDensity: "comfortable",
  soundEffectsEnabled: false,
  highContrastMode: false,
};

export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "classic_gold",
    nameAr: "الديوان الكلاسيكي المذهب (الأصلي)",
    nameEn: "Classic Gold & Amber Chambers",
    taglineAr: "الهوية الرسمية المعتمدة لمكتب الأستاذ وسام الشناوي المحامي",
    taglineEn: "The official signature law office identity with warm amber and gold highlights",
    descriptionAr: "تصميم كلاسيكي متوازن يجمع بين فخامة اللون الذهبي والأرضية الفاتحة النقية، مصمم خصيصاً لإبراز هيبة العمل القضائي وسهولة القراءة.",
    descriptionEn: "A balanced signature theme combining refined gold highlights with clear, readable typography for daily legal operations.",
    badgeAr: "التصميم المعتمد ★",
    badgeEn: "Official Signature ★",
    isDark: false,
    accentColor: "amber",
    borderRadius: "modern",
    fontFamily: "cairo",
    cardElevation: "gold_bordered",
    backgroundWatermark: "scales",
    displayDensity: "comfortable",
    headerGradient: "from-amber-600 via-amber-500 to-amber-700",
    previewColors: ["#f59e0b", "#1e293b", "#ffffff", "#fef3c7"],
    recommendedForAr: "الاستخدام اليومي العام لجميع المحامين والسكرتارية",
    recommendedForEn: "Daily law practice and court registry work"
  },
  {
    id: "royal_navy",
    nameAr: "الهيئة الملكية الكحلية (Royal Navy)",
    nameEn: "Royal Navy & Platinum",
    taglineAr: "فخامة مجالس الإدارات والمرافعات الكبرى",
    taglineEn: "Corporate legal prestige with navy authority and crisp platinum lines",
    descriptionAr: "تصميم مؤسسي رفيع يعتمد على التدرج الكحلي العميق ولمسات البلاتين والأزرق الملكي، مثالي للشركات وإدارة القضايا التجارية الكبرى.",
    descriptionEn: "Deep royal navy tones engineered for corporate legal advisors, international contracts, and business litigation.",
    badgeAr: "موصى به للشركات 🏢",
    badgeEn: "Corporate Edition 🏢",
    isDark: false,
    accentColor: "blue",
    borderRadius: "classic",
    fontFamily: "tajawal",
    cardElevation: "subtle",
    backgroundWatermark: "eagle",
    displayDensity: "comfortable",
    headerGradient: "from-blue-700 via-indigo-600 to-slate-900",
    previewColors: ["#2563eb", "#0f172a", "#f8fafc", "#dbeafe"],
    recommendedForAr: "مكاتب الشركات، القضايا التجارية، وعقود الاستثمار",
    recommendedForEn: "Corporate legal, commercial litigation, business chambers"
  },
  {
    id: "judicial_emerald",
    nameAr: "الزمرد القضائي وميزان العدالة",
    nameEn: "Judicial Emerald & Marble",
    taglineAr: "رمزية العدالة والوقار القضائي بألوان الطبيعة والزمرد",
    taglineEn: "Symbol of justice and tranquility with soothing emerald tones",
    descriptionAr: "طراز هادئ ومريح للعين يعتمد على درجات الزمرد والأخضر الملكي، يمنح شعوراً بالثقة والطمأنينة للموكلين ومراجعين الاستشارات.",
    descriptionEn: "A soothing emerald and forest green theme providing visual comfort and high trust during legal consultations.",
    badgeAr: "مريح للعين 🌿",
    badgeEn: "Eye-Comfort 🌿",
    isDark: false,
    accentColor: "emerald",
    borderRadius: "modern",
    fontFamily: "almarai",
    cardElevation: "subtle",
    backgroundWatermark: "scales",
    displayDensity: "comfortable",
    headerGradient: "from-emerald-700 via-teal-600 to-slate-900",
    previewColors: ["#059669", "#064e3b", "#ffffff", "#d1fae5"],
    recommendedForAr: "جلسات الاستشارات الأسرية، الجلسات الطويلة، والأبحاث",
    recommendedForEn: "Family law, extended legal research, calm consultation"
  },
  {
    id: "obsidian_dark",
    nameAr: "الأوبسيديان الفاخر (Dark Luxury Obsidian)",
    nameEn: "Obsidian Dark Luxury",
    taglineAr: "الوضع الليلي الفاخر بدرجات الأسود الكربوني والذهب المتوهج",
    taglineEn: "Deep carbon black dark mode with glowing gold accents and low eye strain",
    descriptionAr: "تصميم ليلي متكامل بدرجات الأسود الملكي والكربون الداكن مع نصوص عالية التباين وخطوط ذهبية براقة تحمي العين أثناء العمل الليلي.",
    descriptionEn: "Crafted specifically for late-night court drafting, high contrast, and maximum battery efficiency on OLED screens.",
    badgeAr: "الوضع الليلي الأنيق 🌙",
    badgeEn: "Luxury Dark Mode 🌙",
    isDark: true,
    accentColor: "amber",
    borderRadius: "pill",
    fontFamily: "cairo",
    cardElevation: "gold_bordered",
    backgroundWatermark: "eagle",
    displayDensity: "comfortable",
    headerGradient: "from-slate-900 via-amber-950 to-black",
    previewColors: ["#fbbf24", "#090d16", "#1e293b", "#0f172a"],
    recommendedForAr: "العمل الليلي، صياغة المذكرات حتى ساعات متأخرة، وشاشات OLED",
    recommendedForEn: "Night drafting, OLED displays, late-hour case preparation"
  },
  {
    id: "ruby_executive",
    nameAr: "الروبي العنابي الإداري (Executive Ruby)",
    nameEn: "Executive Ruby & Crimson",
    taglineAr: "طابع الحزم والقرارات الحاسمة والتحكيم الدولي",
    taglineEn: "Decisive executive crimson and warm mahogany for arbitration boards",
    descriptionAr: "تصميم عنابي مميز يجمع بين درجات الياقوت الأحمر والنبيذي الفاخر، يعكس الجدية والصرامة المطلوبة في قضايا الجنايات والتحكيم.",
    descriptionEn: "Rich crimson and deep mahogany palette reflecting firmness and executive authority in arbitration and criminal defense.",
    badgeAr: "الجنايات والتحكيم ⚖️",
    badgeEn: "Executive Crimson ⚖️",
    isDark: false,
    accentColor: "rose",
    borderRadius: "classic",
    fontFamily: "amiri",
    cardElevation: "subtle",
    backgroundWatermark: "watermark_seal",
    displayDensity: "comfortable",
    headerGradient: "from-rose-800 via-rose-700 to-slate-950",
    previewColors: ["#e11d48", "#881337", "#fff1f2", "#ffffff"],
    recommendedForAr: "محاكم الجنايات، هيئات التحكيم، والمفاوضات الصعبة",
    recommendedForEn: "Criminal law, arbitration councils, intense negotiations"
  },
  {
    id: "sapphire_modern",
    nameAr: "الياقوت الأزرق التقني (Modern Sapphire Tech)",
    nameEn: "Modern Sapphire & Glass",
    taglineAr: "النمط العصري المتقدم مع أزرار ناعمة وتأثيرات زجاجية",
    taglineEn: "Tech-forward legal interface with modern sapphire gradients and sleek glass",
    descriptionAr: "تصميم عصري متطور مستوحى من كبرى المنظومات القضائية الرقمية العالمية مع لمسات زجاجية خفيفة وألوان ساطعة تعزز الإنتاجية السريعة.",
    descriptionEn: "A high-productivity modern interface inspired by modern digital justice systems with sapphire accents and frosted glass surfaces.",
    badgeAr: "النمط العصري ⚡",
    badgeEn: "Modern Tech ⚡",
    isDark: false,
    accentColor: "cyan",
    borderRadius: "pill",
    fontFamily: "tajawal",
    cardElevation: "glass",
    backgroundWatermark: "geometric",
    displayDensity: "compact",
    headerGradient: "from-cyan-600 via-blue-600 to-indigo-700",
    previewColors: ["#06b6d4", "#0369a1", "#f0fdfa", "#ffffff"],
    recommendedForAr: "المسح الضوئي الذكي (OCR)، إدخال البيانات السريع، والذكاء الاصطناعي",
    recommendedForEn: "Smart OCR, rapid case entry, AI legal research"
  },
  {
    id: "parchment_heritage",
    nameAr: "التراث والوثائق التاريخية (Heritage Parchment)",
    nameEn: "Heritage Parchment & Walnut",
    taglineAr: "أصالة التوثيق وعراقة المهنة مع خلفية رق الورق العتيق وخشب الجوز",
    taglineEn: "Timeless legal heritage with warm parchment tones and classical arabic calligraphy",
    descriptionAr: "يستحضر عبق المخطوطات والوثائق القانونية القديمة بألوان خشب الجوز وورق البردي مع خط عربي أصيل يمنح المكتب عراقة لا مثيل لها.",
    descriptionEn: "Evoking the majesty of historical legal codices with sepia parchment tones, walnut wood accents, and classical Amiri typography.",
    badgeAr: "الأصالة والتراث 📜",
    badgeEn: "Heritage Classic 📜",
    isDark: false,
    accentColor: "orange",
    borderRadius: "sharp",
    fontFamily: "amiri",
    cardElevation: "gold_bordered",
    backgroundWatermark: "watermark_seal",
    displayDensity: "spacious",
    headerGradient: "from-amber-800 via-orange-900 to-stone-900",
    previewColors: ["#c2410c", "#78350f", "#fef3c7", "#fffbeb"],
    recommendedForAr: "صياغة العقود التوثيقية، مذكرات النقض، والمكتبة القانونية",
    recommendedForEn: "Contract drafting, cassation petitions, historical law archives"
  },
  {
    id: "cloud_slate",
    nameAr: "السحابي فائق التباين (Minimalist Cloud Slate)",
    nameEn: "High-Contrast Minimalist Slate",
    taglineAr: "بساطة هندسية فائقة التركيز بأعلى مستويات التباين والنقاء",
    taglineEn: "Pure minimalist productivity with sharp contrast and zero distractions",
    descriptionAr: "واجهة فائقة التجريد والتركيز باللون الأبيض النقي والرمادي الفاحم دون أي تشتيت، تتيح للمحامي التركيز التام على القضايا والمستندات.",
    descriptionEn: "Stripped of all visual noise to provide a razor-sharp, zero-distraction high contrast workspace for deep analytical review.",
    badgeAr: "أقصى درجات التركيز 🎯",
    badgeEn: "Zero-Distraction 🎯",
    isDark: false,
    accentColor: "teal",
    borderRadius: "sharp",
    fontFamily: "almarai",
    cardElevation: "flat",
    backgroundWatermark: "none",
    displayDensity: "compact",
    headerGradient: "from-slate-800 via-slate-700 to-slate-900",
    previewColors: ["#0f766e", "#1e293b", "#f8fafc", "#ffffff"],
    recommendedForAr: "المراجعات السريعة، التدقيق المالي، وجلسات العمل المكثفة",
    recommendedForEn: "Intense document auditing, financial reconciliations, high-speed filtering"
  },
  {
    id: "imperial_purple",
    nameAr: "الأرجوان الإمبراطوري (Imperial Amethyst)",
    nameEn: "Imperial Purple & Royal Gold",
    taglineAr: "أناقة أرجوانية فريدة لكبار المستشارين ورجال القانون",
    taglineEn: "Exclusive imperial purple crafted for senior advocates and supreme counselors",
    descriptionAr: "تصميم نادر يمزج بين درجات البنفسجي الملكي والذهب الساطع، يعبر عن التميز والفرادة ويضفي طابعاً راقياً واستثنائياً لبرنامج المكتب.",
    descriptionEn: "A distinctive imperial purple palette combined with bright gold highlights, representing supreme advocacy and bespoke legal excellence.",
    badgeAr: "طراز النخبة 👑",
    badgeEn: "Elite Counsel 👑",
    isDark: false,
    accentColor: "purple",
    borderRadius: "modern",
    fontFamily: "kufi",
    cardElevation: "subtle",
    backgroundWatermark: "scales",
    displayDensity: "comfortable",
    headerGradient: "from-purple-800 via-purple-900 to-slate-950",
    previewColors: ["#9333ea", "#581c87", "#faf5ff", "#ffffff"],
    recommendedForAr: "مكاتب كبار المستشارين، السفارات، والقضايا الدولية",
    recommendedForEn: "Senior counselors, international tribunals, distinguished jurists"
  }
];
