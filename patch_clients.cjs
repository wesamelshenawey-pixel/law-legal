const fs = require('fs');
let content = fs.readFileSync('src/components/ClientsView.tsx', 'utf8');

content = content.replace(
  /<input\s*id="opp-phone"\s*type="tel"\s*value={opPhone}\s*onChange={\(e\) => setOpPhone\(e.target.value\)}[\s\S]*?\/>/g,
  `<PhoneInputWithCountry
                        id="opp-phone"
                        value={opPhone}
                        onChange={(full) => setOpPhone(full)}
                      />`
);

if (!content.includes('import PhoneInputWithCountry')) {
  content = content.replace('import React, { useState, useMemo } from "react";', 'import React, { useState, useMemo } from "react";\nimport PhoneInputWithCountry from "./PhoneInputWithCountry";');
}

fs.writeFileSync('src/components/ClientsView.tsx', content);
