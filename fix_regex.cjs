const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistantView.tsx', 'utf8');

content = content.replace(/(?:\/\(\?\:حضر السيد\|حضر السيد\\\/\|حضر\|أقر أنا\|أقر السيد\|توكيل رسمي عام من\)\\s\*\[\\\/:\]\?\\s\*\(\[\^،)[\s\S]*?(?:\-\:0\-9\]\+\)\/i\);)/, "const nameMatch = resultText.match(/(?:حضر السيد|حضر السيد\\\\/|حضر|أقر أنا|أقر السيد|توكيل رسمي عام من)\\\\s*[\\\\/:]?\\\\s*([^،\\\\n\\\\-:0-9]+)/i);");

fs.writeFileSync('src/components/AiAssistantView.tsx', content);
