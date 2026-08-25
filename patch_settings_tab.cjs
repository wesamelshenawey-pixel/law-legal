const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

content = content.replace(
  /"program_sections" \| "users_accounts" \| "permissions_matrix" \| "connected_devices" \| "licensing_security" \| "general_preferences"/g,
  `"program_sections" | "users_accounts" | "permissions_matrix" | "connected_devices" | "licensing_security" | "general_preferences" | "data_sync_security"`
);

content = content.replace(
  /const \[offlineSyncMode, setOfflineSyncMode\] = useState\(true\);/g,
  `const [offlineSyncMode, setOfflineSyncMode] = useState(true);
  const [endToEndEncryptionEnabled, setEndToEndEncryptionEnabled] = useState(false);`
);

content = content.replace(
  /\{.*?6\. Preferences & Appearance.*?\}/s,
  `{/* 7. Data Security & Sync */}
        <button
          onClick={() => setActiveMainTab("data_sync_security")}
          className={\`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 \${
            activeMainTab === "data_sync_security"
              ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }\`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>أمان البيانات والمزامنة</span>
        </button>

        {/* 6. Preferences & Appearance */}`
);

content = content.replace(
  /\{activeMainTab === "general_preferences" && \(/g,
  `{activeMainTab === "data_sync_security" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-right" dir="rtl">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5 justify-start">
              <Lock className="w-5 h-5 text-amber-500" />
              <span>أمان البيانات والمزامنة السحابية (E2EE)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              تفعيل التشفير الشامل للنسخ الاحتياطية على Google Drive ومراجعة سجل عمليات المزامنة الدورية لحماية بيانات المكتب وعملائه.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">التشفير الشامل (End-to-End Encryption)</h4>
                </div>
                <p className="text-[10px] text-slate-500">
                  تشفير النسخ الاحتياطية قبل رفعها لسحابة Google Drive بحيث لا يمكن فك تشفيرها إلا من خلال هذا النظام.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={endToEndEncryptionEnabled}
                  onChange={(e) => setEndToEndEncryptionEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                سجل نشاط المزامنة الأخير
              </h4>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-2 font-bold text-slate-700 dark:text-slate-300">
                  <div>التاريخ والوقت</div>
                  <div>العملية</div>
                  <div>الحالة</div>
                </div>
                <div className="grid grid-cols-3 gap-2 p-2.5 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  <div>{new Date().toLocaleDateString('ar-EG')} - 10:45 AM</div>
                  <div>مزامنة النسخة الاحتياطية (Google Drive)</div>
                  <div className="text-emerald-600 font-bold">نجاح</div>
                </div>
                <div className="grid grid-cols-3 gap-2 p-2.5 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  <div>{new Date(Date.now() - 86400000).toLocaleDateString('ar-EG')} - 09:30 PM</div>
                  <div>تحديث بيانات التشفير (E2EE Keys)</div>
                  <div className="text-emerald-600 font-bold">نجاح</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeMainTab === "general_preferences" && (`
);

fs.writeFileSync('src/components/SettingsView.tsx', content);
