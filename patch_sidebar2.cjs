const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

content = content.replace(
  /const allowedItems = sub\.items\.filter\(item => item\.roles\.includes\(currentUser\.role\)\);/g,
  `const allowedItems = sub.items.filter(item => {
                                if (item._isMasterOnly && currentUser.phone !== "01283233555") return false;
                                return item.roles.includes(currentUser.role);
                              });`
);

fs.writeFileSync('src/components/Sidebar.tsx', content);
