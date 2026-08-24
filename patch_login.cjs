const fs = require('fs');
const content = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

const staff_tab = `
            <button
              onClick={() => { setActiveTab(UserRole.STAFF); setErrorMsg(""); }}
              className={\`flex-1 py-4 font-black transition-all cursor-pointer \${
                activeTab === UserRole.STAFF
                  ? "border-b-2 border-amber-600 text-amber-800 dark:text-amber-500 bg-white dark:bg-slate-900"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-100/50"
              }\`}
            >
              {t("login_tab_lawyer")}
            </button>`;

const new_content = content.replace('{t("login_tab_admin")}\n            </button>', '{t("login_tab_admin")}\n            </button>' + staff_tab);
fs.writeFileSync('src/components/LoginView.tsx', new_content);
