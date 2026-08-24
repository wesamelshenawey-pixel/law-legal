const fs = require('fs');
let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Replace the broken part
sidebar = sidebar.replace(
  /<div dir=\{isRtl \? "rtl" : "ltr"\}>\s*<button[\s\S]*?{hasAccessToDashboard && \(/,
  `
      <div dir={isRtl ? "rtl" : "ltr"}>
        <button
          id="floating-eagle-logo-btn"
          type="button"
          onClick={handleEmblemClick}
          className={\`group relative fixed z-50 top-3 md:top-4 w-10 h-10 min-w-10 min-h-10 rounded-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400 hover:border-amber-300 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center p-0.5 overflow-hidden hover:scale-105 active:scale-95 \${isRtl ? "right-3 md:right-4" : "left-3 md:left-4"}\`}
          title={language === "ar" ? "شعار ديوان الأستاذ وسام الشناوي - اضغط للتبديل بين أوضاع القائمة" : "Toggle Menu"}
        >
          <GoldenEagleEmblem size="exact14mm" glow={false} className="w-full h-full object-contain" />
          
          <span 
            className={\`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-slate-950 transition-colors \${
              sidebarMode === "full" 
                ? "bg-emerald-500" 
                : sidebarMode === "emoji" 
                ? "bg-amber-500" 
                : "bg-red-500"
            }\`}
          />
        </button>
      </div>

      {/* 2. SIDEBAR CONTAINER */}
      <aside
        className={\`fixed top-0 bottom-0 z-40 transition-all duration-300 bg-gradient-to-b from-slate-900 to-[#0a192f] border-x border-[#8ec8e6]/20 shadow-2xl flex flex-col \${
          sidebarMode === "full" 
            ? "w-[320px]" 
            : sidebarMode === "emoji" 
            ? "w-[80px]" 
            : "w-0 overflow-hidden"
        } \${
          isRtl 
            ? sidebarMode === "hidden" ? "-right-[320px]" : "right-0"
            : sidebarMode === "hidden" ? "-left-[320px]" : "left-0"
        }\`}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Top spacer for the floating eagle button */}
        <div className="h-16 flex-shrink-0" />
        
        {sidebarMode !== "hidden" && (
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-20">
            {/* Nav Items Section */}
            <nav className="p-2.5 space-y-3 font-sans [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              
              {/* 1. Dashboard button */}
              {hasAccessToDashboard && (`
);

// Fix the missing closing div of dashboard
sidebar = sidebar.replace(
  /\{\/\* 2\. Hierarchical Sections/,
  `    </div>
              )}
              {/* 2. Hierarchical Sections`
);

fs.writeFileSync('src/components/Sidebar.tsx', sidebar);
