const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');

const target = `      {activeMainTab === "general_preferences" && (`;

const replacement = `      {activeMainTab === "advanced_security" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-right" dir="rtl">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-end flex-wrap gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-amber-500 flex items-center gap-1.5 justify-start">
                <Shield className="w-5 h-5 text-amber-500" />
                <span>إعدادات الأمان المتقدمة والمصادقة الثنائية</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                تفعيل المصادقة الثنائية (2FA) لحماية حسابك، ومراجعة سجل الوصول والأجهزة المتصلة بالحساب.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 2FA Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-500" />
                المصادقة الثنائية (2FA)
              </h4>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h5 className="text-sm font-black text-slate-800 dark:text-slate-200">تفعيل المصادقة الثنائية</h5>
                    <p className="text-[10px] text-slate-500">إضافة طبقة حماية إضافية تطلب كود عند تسجيل الدخول.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs transition cursor-pointer">
                    <Smartphone className="w-4 h-4" />
                    تطبيق مصادقة (Auth App)
                  </button>
                  <button className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold text-xs hover:border-emerald-500 hover:text-emerald-600 transition cursor-pointer">
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني (Email)
                  </button>
                </div>
              </div>
            </div>

            {/* Access Logs Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-sky-500" />
                سجل الوصول والأجهزة المتصلة
              </h4>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                  <span className="text-[10px] font-bold text-slate-500">آخر عمليات تسجيل الدخول</span>
                  <button className="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-1 cursor-pointer">
                    <LogOut className="w-3 h-3" />
                    تسجيل الخروج من جميع الأجهزة
                  </button>
                </div>
                <div className="p-2 flex flex-col gap-2 max-h-[250px] overflow-y-auto">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Chrome (Windows)</p>
                        <p className="text-[10px] text-slate-500">القاهرة، مصر • 192.168.1.1</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">الجهاز الحالي (الآن)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-lg">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Safari (iPhone)</p>
                        <p className="text-[10px] text-slate-500">الجيزة، مصر • 192.168.1.45</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-slate-500">منذ ساعتين</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMainTab === "general_preferences" && (`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/SettingsView.tsx', content);
