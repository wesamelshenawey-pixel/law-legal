const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const \[activeSection, setActiveSection\] = useState\("dashboard"\);/,
  `const [activeSection, setActiveSection] = useState(() => {
    const savedRole = localStorage.getItem("law_role");
    return savedRole === "client" ? "social" : "dashboard";
  });`
);

fs.writeFileSync('src/App.tsx', content);
