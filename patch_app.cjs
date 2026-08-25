const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /case "settings":\s*return \(\s*<SettingsView\s*language={language}\s*\/>\s*\);/,
  `case "settings":
        return (
          <SettingsView
            language={language}
          />
        );
      case "tenants_admin":
        if (currentUser?.phone !== "01283233555") return <div />;
        return (
          <TenantsAdminView language={language} />
        );`
);

fs.writeFileSync('src/App.tsx', content);
