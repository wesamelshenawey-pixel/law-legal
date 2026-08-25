const fs = require('fs');
let content = fs.readFileSync('src/components/AddClientWizardModal.tsx', 'utf8');

content = content.replace(/facebook: facebook \|\| undefined,\n/g, '');

fs.writeFileSync('src/components/AddClientWizardModal.tsx', content);
