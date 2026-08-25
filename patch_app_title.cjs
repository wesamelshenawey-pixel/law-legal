const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /{activeSection === "settings" && \(language === "ar" \? "إعدادات النظام والترخيص" : "Settings & Licenses"\)}/g,
  `{activeSection === "settings" && (language === "ar" ? "إعدادات النظام والترخيص" : "Settings & Licenses")}
                {activeSection === "tenants_admin" && (language === "ar" ? "إدارة المكاتب والمشتركين" : "Tenants Admin")}`
);

fs.writeFileSync('src/App.tsx', content);
