const fs = require('fs');
let content = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

content = content.replace(
  /<form onSubmit={handleLoginSubmit} className="space-y-4">\s*<div>\s*<label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right mb-1">/g,
  `<form onSubmit={handleLoginSubmit} className="space-y-4">
              {activePortal === "clients_users" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right mb-1">
                    {language === "ar" ? "رقم هاتف صاحب مكتب المحاماة المستهدف" : "Law Firm Owner's Phone"}
                  </label>
                  <PhoneInputWithCountry
                      value={lawFirmPhoneCode + lawFirmPhone}
                      onChange={(full, code, num) => {
                        setLawFirmPhoneCode(code);
                        setLawFirmPhone(num);
                      }}
                    />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right mb-1">`
);

fs.writeFileSync('src/components/LoginView.tsx', content);
