const fs = require('fs');
const content = fs.readFileSync('src/utils/translations.ts', 'utf8');

const newContent = content.replace(
  '  login_tab_admin: {',
  '  login_tab_lawyer: {\n    en: "Lawyer/Staff",\n    ar: "محامي/طاقم"\n  },\n  login_tab_admin: {'
);

fs.writeFileSync('src/utils/translations.ts', newContent);
