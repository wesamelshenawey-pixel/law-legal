const fs = require('fs');

// 1. Update UserProfileCircle.tsx
let profile = fs.readFileSync('src/components/UserProfileCircle.tsx', 'utf8');
profile = profile.replace(/className=\{`fixed top-3 z-50 \$\{isRtl \? "left-3 md:left-5" : "right-3 md:right-5"\}`\}/g, 'className={`fixed top-3 md:top-4 z-50 ${isRtl ? "left-3 md:left-4" : "right-3 md:right-4"}`}');
profile = profile.replace(/className="group relative w-12 h-12 md:w-13 md:h-13 rounded-full/g, 'className="group relative w-10 h-10 rounded-full');
profile = profile.replace(/<div className="w-14 h-14/g, '<div className="w-12 h-12');
fs.writeFileSync('src/components/UserProfileCircle.tsx', profile);

// 2. Update Sidebar.tsx (Eagle button)
let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(/className=\{`fixed z-50 transition-all duration-300 top-\[12mm\] \$\{[\s\S]*?isRtl \? "right-\[12mm\]" : "left-\[12mm\]"[\s\S]*?\}`\}/g, ''); // Remove the wrapper div className
sidebar = sidebar.replace(/<div \s*dir=\{isRtl \? "rtl" : "ltr"\}\s*>/, '<div dir={isRtl ? "rtl" : "ltr"}>'); // cleanup

// Let's accurately replace the Sidebar button
// Find the button with id="floating-eagle-logo-btn"
let sidebarReplaced = sidebar.replace(
  /<button\s+id="floating-eagle-logo-btn"[\s\S]*?className="group relative w-\[14mm\] h-\[14mm\] min-w-\[14mm\] min-h-\[14mm\] rounded-full[\s\S]*?">/,
  `<button
          id="floating-eagle-logo-btn"
          type="button"
          onClick={handleEmblemClick}
          className={\`group relative fixed z-50 top-3 md:top-4 w-10 h-10 min-w-10 min-h-10 rounded-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400 hover:border-amber-300 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center p-0.5 overflow-hidden hover:scale-105 active:scale-95 \${isRtl ? "right-3 md:right-4" : "left-3 md:left-4"}\`}
          title={language === "ar" ? "شعار ديوان الأستاذ وسام الشناوي - اضغط للتبديل بين أوضاع القائمة" : "Toggle Menu"}
        >`
);

// We need to also remove the wrapper `<div className="fixed z-50 ...">` around this button.
sidebarReplaced = sidebarReplaced.replace(
  /<div \s*className=\{`fixed z-50 transition-all duration-300 top-\[12mm\] \$\{[\s\S]*?isRtl \? "right-\[12mm\]" : "left-\[12mm\]"[\s\S]*?\}`\}\s*dir=\{isRtl \? "rtl" : "ltr"\}\s*>\s*<button/,
  '<button'
);
// And remove the closing `</div>` right after the button.
sidebarReplaced = sidebarReplaced.replace(/<\/button>\s*<\/div>/, '</button>');
fs.writeFileSync('src/components/Sidebar.tsx', sidebarReplaced);

// 3. Update AnnouncementTicker.tsx
let ticker = fs.readFileSync('src/components/AnnouncementTicker.tsx', 'utf8');
ticker = ticker.replace(/className="w-full bg-gradient-to-r from-red-600 via-amber-600 to-red-700 text-white px-3 py-1.5 shadow-md flex items-center justify-between gap-2 text-xs font-sans select-none z-30 transition-all"/, 'className="w-full bg-gradient-to-r from-red-600 via-amber-600 to-red-700 text-white px-3 py-1.5 shadow-[0_4px_15px_rgba(220,38,38,0.3)] flex items-center justify-between gap-2 text-xs font-sans select-none transition-all rounded-xl md:rounded-full border border-amber-500/30"');
fs.writeFileSync('src/components/AnnouncementTicker.tsx', ticker);

// 4. Update App.tsx layout
let app = fs.readFileSync('src/App.tsx', 'utf8');
// Move AnnouncementTicker outside of main, or just change main classes
app = app.replace(/<AnnouncementTicker[\s\S]*?\/>/, '');

const tickerInject = `
      {/* Global Public Announcement & Advertising Ticker (Centered Header) */}
      <div 
        className={\`fixed top-3 md:top-4 z-40 transition-all duration-300 flex justify-center \${
          language === "ar"
            ? sidebarMode === "full" ? "right-[330px] left-16 md:left-20" : sidebarMode === "emoji" ? "right-[90px] left-16 md:left-20" : "right-16 md:right-20 left-16 md:left-20"
            : sidebarMode === "full" ? "left-[330px] right-16 md:right-20" : sidebarMode === "emoji" ? "left-[90px] right-16 md:right-20" : "left-16 md:left-20 right-16 md:right-20"
        }\`}
      >
        <div className="w-full max-w-4xl">
          <AnnouncementTicker
            announcements={announcements}
            onNavigateToAnnouncements={() => setActiveSection("announcements")}
            language={language}
          />
        </div>
      </div>
`;

app = app.replace('{/* Sidebar Navigation */}', tickerInject + '\n      {/* Sidebar Navigation */}');

// Add top padding to main
app = app.replace(/className=\{`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-screen transition-all duration-300 \$\{/g, 'className={`flex-1 p-4 sm:p-6 lg:p-8 pt-20 md:pt-24 overflow-y-auto max-h-screen transition-all duration-300 ${');

fs.writeFileSync('src/App.tsx', app);

