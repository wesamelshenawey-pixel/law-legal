const fs = require('fs');
let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

sidebar = sidebar.replace(
  /                  \} \}\n                    <\/button>\n                \} \}\n\n                    <\/div>\n              \)\}\n              \{\/\* 2\. Hierarchical Sections/,
  '                  )}</button></div>)}{/* 2. Hierarchical Sections'
);

// Actually, I can just replace the whole Dashboard button block if it's broken.
// Let's just find `</button>\n                )}\n\n                    </div>\n              )}`
// Let's print out lines 260 to 280 to see what it looks like exactly.
