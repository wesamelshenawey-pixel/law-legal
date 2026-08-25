const fs = require('fs');
let content = fs.readFileSync('src/components/AddClientWizardModal.tsx', 'utf8');

content = content.replace(/facebook: facebookUrl,/g, 'facebook: facebook || facebookUrl || undefined,');

fs.writeFileSync('src/components/AddClientWizardModal.tsx', content);
