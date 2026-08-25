const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

content = content.replace(
  /<input\s*type="tel"\s*value={licensePhone}\s*onChange={\(e\) => setLicensePhone\(e.target.value\)}[\s\S]*?\/>/g,
  `<PhoneInputWithCountry
                  value={licensePhone}
                  onChange={(full) => setLicensePhone(full)}
                />`
);

if (!content.includes('import PhoneInputWithCountry')) {
  content = content.replace('import React, { useState } from "react";', 'import React, { useState } from "react";\nimport PhoneInputWithCountry from "./PhoneInputWithCountry";');
}

fs.writeFileSync('src/components/SettingsView.tsx', content);
