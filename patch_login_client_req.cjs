const fs = require('fs');
let content = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

content = content.replace(
  /<PhoneInputWithCountry\s*value={lawFirmPhoneCode \+ lawFirmPhone}/g,
  `<PhoneInputWithCountry
                      required={true}
                      value={lawFirmPhoneCode + lawFirmPhone}`
);

fs.writeFileSync('src/components/LoginView.tsx', content);
