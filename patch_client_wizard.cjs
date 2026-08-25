const fs = require('fs');
let content = fs.readFileSync('src/components/AddClientWizardModal.tsx', 'utf8');

// Add facebook state
if (!content.includes('const [facebookUrl, setFacebookUrl] = useState("");')) {
  content = content.replace(
    /const \[whatsappPhone, setWhatsappPhone\] = useState\(""\);/,
    'const [whatsappPhone, setWhatsappPhone] = useState("");\n  const [facebookUrl, setFacebookUrl] = useState("");'
  );
}

// Add to the returned object
content = content.replace(
  /whatsapp: effectiveWhatsapp,/,
  'whatsapp: effectiveWhatsapp,\n      facebook: facebookUrl,'
);

// Add input field in UI
content = content.replace(
  /\{samePhoneForWhatsapp \? "مطابق لرقم الهاتف الأول" : "رقم واتساب مخصص"\}/,
  '{samePhoneForWhatsapp ? "مطابق لرقم الهاتف الأول" : "رقم واتساب مخصص"}'
);

content = content.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* POWER OF ATTORNEY/,
  `</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رابط حساب فيسبوك (اختياري)
                  </label>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans focus:ring-2 focus:ring-amber-500 focus:outline-none text-left dir-ltr"
                  />
                </div>
              </div>

              {/* POWER OF ATTORNEY`
);

fs.writeFileSync('src/components/AddClientWizardModal.tsx', content);
