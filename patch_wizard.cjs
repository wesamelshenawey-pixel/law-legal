const fs = require('fs');
let content = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

// We need a state for the wizard step
if (!content.includes('const [wizardStep, setWizardStep] = useState(1);')) {
  content = content.replace(
    /const \[isSignUp, setIsSignUp\] = useState\(false\);/,
    'const [isSignUp, setIsSignUp] = useState(false);\n  const [wizardStep, setWizardStep] = useState(1);'
  );
}

// Update the start signup function
content = content.replace(
  /const handleStartSignUp = \(e: React\.FormEvent\) => {[\s\S]*?if \(!signupName \|\| !signupPhone \|\| !signupPassword\) return;[\s\S]*?if \(!lawFirmPhone\) {/,
  `const handleStartSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupPhone || !signupPassword) return;

    if (activePortal === "lawyers_admin") {
      if (wizardStep === 1) {
        setWizardStep(2);
        return;
      }
      if (wizardStep === 2) {
        if (!nationalIdFront || !nationalIdBack || !lawyerCard) {
          setErrorMsg(language === "ar" ? "لتسجيل مكتب محامي رقمي، يشترط إرفاق صور البطاقة وكارنيه المحاماة." : "For Law Firm registration, National ID and Lawyer Card are required.");
          return;
        }
      }
    } else {
      if (!lawFirmPhone) {`
);

// We need to divide the lawyer signup form into 2 steps visually
// Let's replace the <form onSubmit={handleStartSignUp} ...> interior

content = content.replace(
  /{activePortal === "lawyers_admin" && \(\s*<div className="space-y-3">\s*<div>\s*<label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-\[10px\]">صورة بطاقة الرقم القومي \(وجه\)<\/label>[\s\S]*?<\/div>\s*\)\}/g,
  `` // Remove the inline block, we will re-insert it conditionally based on wizardStep
);

content = content.replace(
  /<div>\s*<label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل \*\<\/label>[\s\S]*?required\s*\/>\s*<\/div>/g,
  `{!(activePortal === "lawyers_admin" && wizardStep === 2) && (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل *</label>
                        <input
                          type="text"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="الاسم ثلاثياً أو رباعياً"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-right outline-none font-bold"
                          required
                        />
                      </div>
                    )}`
);

content = content.replace(
  /<div>\s*<label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الهاتف \*\<\/label>[\s\S]*?<\/div>/g,
  `{!(activePortal === "lawyers_admin" && wizardStep === 2) && (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الهاتف *</label>
                        <div className="relative">
                          <PhoneInputWithCountry
                            value={signupPhoneCode + signupPhone}
                            onChange={(full, code, num) => {
                              setSignupPhoneCode(code);
                              setSignupPhone(num);
                            }}
                          />
                        </div>
                      </div>
                    )}`
);

content = content.replace(
  /<div>\s*<label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور \*\<\/label>[\s\S]*?<\/div>/g,
  `{!(activePortal === "lawyers_admin" && wizardStep === 2) && (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور *</label>
                        <input
                          type="password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-right outline-none font-bold font-mono"
                          required
                        />
                      </div>
                    )}`
);

fs.writeFileSync('src/components/LoginView.tsx', content);
