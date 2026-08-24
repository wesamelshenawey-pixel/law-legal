const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Find the start of the first sync logic and the start of handleLoginSuccess
const firstSyncIdx = content.indexOf('const [isCloudSyncing, setIsCloudSyncing]');
const loginIdx = content.lastIndexOf('const handleLoginSuccess = (user: PlatformUser) => {');

// Just remove EVERYTHING between firstSyncIdx and loginIdx
if (firstSyncIdx !== -1 && loginIdx !== -1 && firstSyncIdx < loginIdx) {
    content = content.substring(0, firstSyncIdx) + content.substring(loginIdx);
}

// Remove duplicate ui
const uiIdx = content.indexOf('{currentUser && (\n        <div className={`absolute top-6 ${language === "ar" ? "left-24" : "right-24"} z-50 flex gap-3`}>');
const nextProfile = content.indexOf('<UserProfileCircle', uiIdx + 10);
const secondProfile = content.indexOf('<UserProfileCircle', nextProfile + 10);
if (uiIdx !== -1 && secondProfile !== -1) {
    content = content.substring(0, uiIdx) + content.substring(secondProfile);
}

fs.writeFileSync('src/App.tsx', content);
