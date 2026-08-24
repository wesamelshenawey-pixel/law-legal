const fs = require('fs');
let content = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

const tabClass = `\`flex-1 py-4 font-black transition-all cursor-pointer \${
                activeTab === UserRole.STAFF
                  ? "border-b-2 border-amber-600 text-amber-800 dark:text-amber-500 bg-white dark:bg-slate-900"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-100/50"
              }\``;

content = content.replace('className={}', 'className={' + tabClass + '}');
fs.writeFileSync('src/components/LoginView.tsx', content);
