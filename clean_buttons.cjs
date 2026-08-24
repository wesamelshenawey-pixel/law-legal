const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/\{currentUser && \([\s\S]*?☁️⬇️[\s\S]*?<\/button>\s*<\/div>\s*\)\}\s*/g, '');
fs.writeFileSync('src/App.tsx', content);
