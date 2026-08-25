const fs = require('fs');
let content = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

content = content.replace(
  /<div className="flex gap-2" dir="ltr">\s*<select[\s\S]*?<\/select>\s*<input\s*type="tel"\s*value={phone}\s*onChange={\(e\) => setPhone\(e.target.value\)}[\s\S]*?\/>\s*<\/div>/g,
  `<PhoneInputWithCountry
                      value={phoneCode + phone}
                      onChange={(full, code, num) => {
                        setPhoneCode(code);
                        setPhone(num);
                      }}
                    />`
);

content = content.replace(
  /<div className="flex gap-2" dir="ltr">\s*<select[\s\S]*?<\/select>\s*<input\s*type="tel"\s*value={signupPhone}\s*onChange={\(e\) => setSignupPhone\(e.target.value\)}[\s\S]*?\/>\s*<\/div>/g,
  `<PhoneInputWithCountry
                      value={signupPhoneCode + signupPhone}
                      onChange={(full, code, num) => {
                        setSignupPhoneCode(code);
                        setSignupPhone(num);
                      }}
                    />`
);

content = content.replace(
  /<div className="flex gap-2" dir="ltr">\s*<select[\s\S]*?<\/select>\s*<input\s*type="tel"\s*value={lawFirmPhone}\s*onChange={\(e\) => setLawFirmPhone\(e.target.value\)}[\s\S]*?\/>\s*<\/div>/g,
  `<PhoneInputWithCountry
                      value={lawFirmPhoneCode + lawFirmPhone}
                      onChange={(full, code, num) => {
                        setLawFirmPhoneCode(code);
                        setLawFirmPhone(num);
                      }}
                    />`
);

content = content.replace(
  /<div className="flex gap-2" dir="ltr">\s*<select[\s\S]*?<\/select>\s*<input\s*type="tel"\s*value={resetPhone}\s*onChange={\(e\) => setResetPhone\(e.target.value\)}[\s\S]*?\/>\s*<\/div>/g,
  `<PhoneInputWithCountry
                      value={resetPhoneCode + resetPhone}
                      onChange={(full, code, num) => {
                        setResetPhoneCode(code);
                        setResetPhone(num);
                      }}
                    />`
);

if (!content.includes('import PhoneInputWithCountry')) {
  content = content.replace('import React, { useState } from "react";', 'import React, { useState } from "react";\nimport PhoneInputWithCountry from "./PhoneInputWithCountry";');
}

fs.writeFileSync('src/components/LoginView.tsx', content);
