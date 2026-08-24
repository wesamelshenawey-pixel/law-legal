const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistantView.tsx', 'utf8');

content = content.replace(
  /<div className="hidden">\s*\{img\.textResult\}\s*<\/p>\s*\)\}\s*\{!img\.isProcessing && \(\s*<div className="flex gap-2 pt-2 border-t border-emerald-100">\s*<button onClick=\{\(\) => alert\("سيتم ترحيل البيانات المستخرجة لإنشاء ملف موكل جديد\."\)\} className="px-3 py-1\.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-\[10px\] font-bold">إضافة كموكل<\/button>\s*<button onClick=\{\(\) => alert\("سيتم ترحيل البيانات المستخرجة لإنشاء ملف خصم جديد\."\)\} className="px-3 py-1\.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-\[10px\] font-bold">إضافة كخصم<\/button>\s*<button onClick=\{\(\) => alert\("سيتم ربط المستند لإنشاء دعوى\/قضية جديدة\."\)\} className="px-3 py-1\.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-\[10px\] font-bold">إضافة كقضية<\/button>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>/,
  `                          {!img.isProcessing && (
                            <div className="flex gap-2 pt-2 border-t border-emerald-100">
                               <button onClick={() => alert("سيتم ترحيل البيانات المستخرجة لإنشاء ملف موكل جديد.")} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold">إضافة كموكل</button>
                               <button onClick={() => alert("سيتم ترحيل البيانات المستخرجة لإنشاء ملف خصم جديد.")} className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold">إضافة كخصم</button>
                               <button onClick={() => alert("سيتم ربط المستند لإنشاء دعوى/قضية جديدة.")} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold">إضافة كقضية</button>
                            </div>
                          )}
                        </div>
                      </div>`
);

fs.writeFileSync('src/components/AiAssistantView.tsx', content);
