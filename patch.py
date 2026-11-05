import sys
import re

with open('src/components/SessionsView.tsx', 'r') as f:
    content = f.read()

pattern = r'<div className="space-y-3">\s*</div>'
replacement = """<div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">القرار / سبب التأجيل</label>
                <textarea
                  value={adjournmentReason}
                  onChange={(e) => setAdjournmentReason(e.target.value)}
                  placeholder="مثال: تأجيل للاطلاع والرد..."
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تاريخ الجلسة القادمة (إن وُجد)</label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Vertical Timeline of Session History */}
              {selectedSession.history && selectedSession.history.length > 0 && (
                <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">التسلسل الزمني للجلسات السابقة</h4>
                  <div className="space-y-4 pl-2 border-r-2 border-slate-200 dark:border-slate-700 pr-4">
                    {selectedSession.history.map((hist, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute w-2.5 h-2.5 bg-amber-500 rounded-full -right-[23px] top-1 ring-4 ring-white dark:ring-slate-900"></div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-500">الجلسة السابقة</span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">{hist.date}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">{hist.decision}</p>
                          {hist.requiredWork && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              <span className="text-amber-600 dark:text-amber-500">المطلوب: </span>{hist.requiredWork}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>"""

new_content, count = re.subn(pattern, replacement, content)

if count > 0:
    with open('src/components/SessionsView.tsx', 'w') as f:
        f.write(new_content)
    print("Success")
else:
    print("Target not found")
