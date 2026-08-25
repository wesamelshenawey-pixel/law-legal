const fs = require('fs');
let content = fs.readFileSync('src/components/AddClientWizardModal.tsx', 'utf8');
content = content.replace(
  /<div className="flex gap-2">\s*<select[\s\S]*?<\/select>\s*<input\s*type="tel"\s*value={phone}\s*onChange={\(e\) => setPhone\(e.target.value\)}[\s\S]*?\/>\s*<\/div>/g,
  `<PhoneInputWithCountry
                      value={countryCode + phone}
                      onChange={(full, code, num) => {
                        setCountryCode(code);
                        setPhone(num);
                      }}
                    />`
);
content = content.replace(
  /<div className="flex gap-2">\s*<select[\s\S]*?<\/select>\s*<input\s*type="tel"\s*disabled={samePhoneForWhatsapp}\s*value={samePhoneForWhatsapp \? phone : whatsappPhone}[\s\S]*?\/>\s*<\/div>/g,
  `<PhoneInputWithCountry
                      disabled={samePhoneForWhatsapp}
                      value={samePhoneForWhatsapp ? (countryCode + phone) : (whatsappCountryCode + whatsappPhone)}
                      onChange={(full, code, num) => {
                        setWhatsappCountryCode(code);
                        setWhatsappPhone(num);
                      }}
                    />`
);
fs.writeFileSync('src/components/AddClientWizardModal.tsx', content);
