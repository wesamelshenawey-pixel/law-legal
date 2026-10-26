const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');

const target = `      </div>
      
      {/* ========================================================================= */}
{/* 1. PROGRAM MODULES & DEPARTMENTS TAB                                      */}`;

const replacement = `        {/* 8. Advanced Security */}
        <button
          onClick={() => setActiveMainTab("advanced_security")}
          className={\`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 \${
            activeMainTab === "advanced_security"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }\`}
        >
          <Shield className="w-4 h-4" />
          <span>الأمان المتقدم (2FA)</span>
        </button>
      </div>
      
      {/* ========================================================================= */}
{/* 1. PROGRAM MODULES & DEPARTMENTS TAB                                      */}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/SettingsView.tsx', content);
