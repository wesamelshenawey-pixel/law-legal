const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const cloud_ui = `
      {currentUser && (
        <div className={\`absolute top-6 \${language === "ar" ? "left-24" : "right-24"} z-50 flex gap-3\`}>
           <button onClick={handleManualCloudSync} disabled={isCloudSyncing} className="p-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full shadow-md transition border border-blue-200" title={language === "ar" ? "النسخ الاحتياطي السحابي (Google Drive)" : "Backup to Google Drive"}>
             {isCloudSyncing ? <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /> : <span className="text-sm font-bold">☁️⬆️</span>}
           </button>
           <button onClick={handleRestoreFromCloud} disabled={isCloudSyncing} className="p-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-full shadow-md transition border border-emerald-200" title={language === "ar" ? "استعادة النسخة الاحتياطية (Google Drive)" : "Restore from Google Drive"}>
             <span className="text-sm font-bold">☁️⬇️</span>
           </button>
        </div>
      )}
`;

content = content.replace('      <UserProfileCircle', cloud_ui + '\n      <UserProfileCircle');
fs.writeFileSync('src/App.tsx', content);
