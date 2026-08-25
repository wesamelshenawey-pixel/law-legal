const fs = require('fs');
let content = fs.readFileSync('src/components/ClientsView.tsx', 'utf8');

content = content.replace(
  /<p><span className="text-slate-400 ml-1">الهاتف\/الواتس:<\/span> <span className="text-amber-800 font-sans">{c\.whatsapp \|\| "غير متوفر"}<\/span><\/p>/g,
  `<p><span className="text-slate-400 ml-1">الهاتف/الواتس:</span> <span className="text-amber-800 font-sans dir-ltr inline-block">{c.whatsapp || c.phone || "غير متوفر"}</span></p>
                    <p><span className="text-slate-400 ml-1">فيسبوك:</span> <span className="text-blue-700 font-sans truncate">{c.facebook || "غير متوفر"}</span></p>`
);

content = content.replace(
  /<button\s*id={`manage-client-docs-\${c\.id}`}\s*onClick={\(\) => setSelectedClientForDocs\(c\)}/g,
  `<button
                        onClick={() => onOpenDocumentManager && onOpenDocumentManager("clients", \`ملفات وتكامل الموكل: \${c.name}\`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 text-[10px] rounded transition shadow-sm cursor-pointer ml-2 flex items-center gap-1"
                        title="تكامل ومشاركة مباشرة عبر مدير المستندات"
                      >
                        🔗 تكامل ومشاركة
                      </button>
                      <button
                        id={\`manage-client-docs-\${c.id}\`}
                        onClick={() => setSelectedClientForDocs(c)}`
);

fs.writeFileSync('src/components/ClientsView.tsx', content);
