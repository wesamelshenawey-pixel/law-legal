const fs = require('fs');
const content = fs.readFileSync('src/components/AiAssistantView.tsx', 'utf8');

const modalStr = `
      {/* Google Photos Modal */}
      {showPhotosModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800">صور Google Photos</h2>
                  <p className="text-[11px] text-slate-500 font-medium">اختر صورة لاستخراج النصوص منها عبر الذكاء الاصطناعي</p>
                </div>
              </div>
              <button
                onClick={() => setShowPhotosModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {isLoadingPhotos ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold animate-pulse">جاري سحب الصور من حسابك...</p>
                </div>
              ) : googlePhotos.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm font-semibold">
                  لم يتم العثور على صور في الحساب
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {googlePhotos.map((photo: any) => (
                    <button
                      key={photo.id}
                      onClick={() => handleSelectGooglePhoto(photo)}
                      className="aspect-square relative rounded-xl overflow-hidden group border border-slate-200 hover:border-blue-500 hover:shadow-md transition focus:outline-none"
                    >
                      <img src={\`\${photo.baseUrl}=w400\`} alt={photo.filename} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/20 transition flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-white text-blue-700 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                          اختيار الصورة
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

const newContent = content.replace(/    <\/div>\s* \);\s*}/g, modalStr);
fs.writeFileSync('src/components/AiAssistantView.tsx', newContent);
