const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

content = content.replace(
  /{ id: "settings", label: t\("settings"\), emoji: "⚙️", roles: \[UserRole.ADMIN\] },/,
  `{ id: "settings", label: t("settings"), emoji: "⚙️", roles: [UserRole.ADMIN] },
            { id: "tenants_admin", label: language === "ar" ? "إدارة المكاتب والمشتركين" : "Tenants Admin", emoji: "🏢", roles: [UserRole.ADMIN] },`
);

fs.writeFileSync('src/components/Sidebar.tsx', content);
