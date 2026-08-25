const fs = require('fs');
let content = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

content = content.replace(
  /const matchedUser = registeredUsers\.find\(\s*\(u\) => \(u\.phone === fullPhone \|\| u\.phone === phone\) && u\.passwordHash === password && \[UserRole\.CLIENT, UserRole\.SEEKER, UserRole\.OPPONENT\]\.includes\(u\.role\)\s*\);/g,
  `const matchedUser = registeredUsers.find(
        (u) => (u.phone === fullPhone || u.phone === phone) && 
               u.passwordHash === password && 
               [UserRole.CLIENT, UserRole.SEEKER, UserRole.OPPONENT].includes(u.role) &&
               u.lawFirmPhone === (lawFirmPhoneCode + lawFirmPhone)
      );`
);

content = content.replace(
  /<div>\s*<label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1\.5">/,
  `{activePortal === "clients_users" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">`
);

fs.writeFileSync('src/components/LoginView.tsx', content);
