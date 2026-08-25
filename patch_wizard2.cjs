const fs = require('fs');
let content = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

content = content.replace(
  /<button\s*type="submit"\s*className="w-full py-3 bg-amber-500 hover:bg-amber-600/g,
  `{(activePortal === "lawyers_admin" && wizardStep === 2) && (
                      <div className="col-span-1 sm:col-span-2 space-y-3 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50">
                        <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-500 font-bold">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800 text-[10px]">2</span>
                          <span>الوثائق الرسمية (مطلوبة للتوثيق)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                          يتم تشفير هذه الوثائق باستخدام معيار Base64 ولا يمكن الوصول إليها إلا بواسطة المالك لضمان سرية النظام.
                        </p>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">صورة بطاقة الرقم القومي (وجه)</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setNationalIdFront)} className="w-full text-xs" required />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">صورة بطاقة الرقم القومي (ظهر)</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setNationalIdBack)} className="w-full text-xs" required />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">صورة كارنيه المحاماة</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setLawyerCard)} className="w-full text-xs" required />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button type="button" onClick={() => setWizardStep(1)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs rounded-xl transition cursor-pointer">
                            رجوع
                          </button>
                          <button type="submit" className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer">
                            إرسال وتوثيق الحساب
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      style={{ display: (activePortal === "lawyers_admin" && wizardStep === 2) ? 'none' : 'block' }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600`
);

fs.writeFileSync('src/components/LoginView.tsx', content);
