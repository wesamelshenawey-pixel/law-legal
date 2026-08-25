const fs = require('fs');
let content = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

const handleFileStr = `
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
`;

content = content.replace('// Registration Documents (Lawyers)', handleFileStr + '\n  // Registration Documents (Lawyers)');

content = content.replace(
  /<input type="file" accept="image\/\*" onChange={\(e\) => setNationalIdFront\(e.target.value\)} className="w-full text-xs" required \/>/g,
  `<input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setNationalIdFront)} className="w-full text-xs" required />`
);
content = content.replace(
  /<input type="file" accept="image\/\*" onChange={\(e\) => setNationalIdBack\(e.target.value\)} className="w-full text-xs" required \/>/g,
  `<input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setNationalIdBack)} className="w-full text-xs" required />`
);
content = content.replace(
  /<input type="file" accept="image\/\*" onChange={\(e\) => setLawyerCard\(e.target.value\)} className="w-full text-xs" required \/>/g,
  `<input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setLawyerCard)} className="w-full text-xs" required />`
);

fs.writeFileSync('src/components/LoginView.tsx', content);
