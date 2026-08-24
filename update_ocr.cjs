const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistantView.tsx', 'utf8');

const updatedState = `
  const [ocrImages, setOcrImages] = useState<{ id: string; url: string; textResult: string; isProcessing: boolean }[]>(() => {
    const saved = localStorage.getItem('law_ocr_drafts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('law_ocr_drafts', JSON.stringify(ocrImages));
  }, [ocrImages]);
`;

content = content.replace(/const \[ocrImages, setOcrImages\] = useState<\{ id: string; url: string; textResult: string; isProcessing: boolean \}\[\]>\(\[\]\);/, updatedState);

// Add editing ability to OCR items
const ocrItemUI = `
                      <div key={img.id} className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl flex gap-4 shadow-sm relative">
                        <button onClick={() => setOcrImages(prev => prev.filter(i => i.id !== img.id))} className="absolute top-2 left-2 p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition" title="حذف المسودة">
                           <X className="w-3.5 h-3.5" />
                        </button>
                        <img src={img.url} alt="OCR Preview" className="w-24 h-24 object-cover rounded-lg border border-emerald-200 shadow-sm" />
                        <div className="flex-1 space-y-2">
                          <p className="text-xs font-bold text-emerald-800 mb-1">
                            {img.isProcessing ? (
                              <span className="animate-pulse text-amber-700">جاري تفريغ وفك ترميز الكلمات...</span>
                            ) : "النص المستخرج (مسودة قابلة للتعديل):"}
                          </p>
                          {!img.isProcessing && (
                            <textarea
                               value={img.textResult}
                               onChange={(e) => setOcrImages(prev => prev.map(i => i.id === img.id ? { ...i, textResult: e.target.value } : i))}
                               className="w-full text-xs text-slate-800 font-sans whitespace-pre-line text-right h-32 bg-white p-3 rounded-lg border border-emerald-200 leading-relaxed outline-none focus:ring-2 focus:ring-emerald-400 resize-y"
                            />
                          )}
`;

content = content.replace(/<div key=\{img\.id\} className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl flex gap-4">[\s\S]*?\{!img\.isProcessing && \([\s\S]*?<p className="text-xs text-slate-800 font-sans whitespace-pre-line text-right max-h-32 overflow-y-auto bg-white p-3 rounded-lg border border-emerald-200 leading-relaxed select-all">/, ocrItemUI + '<div className="hidden">');

// Need to match the closing of the <p> that was hidden
content = content.replace(/<\/p>\s*\)\}\s*<\/div>\s*<\/div>/g, '</div>\n                        </div>\n                      </div>');

fs.writeFileSync('src/components/AiAssistantView.tsx', content);
