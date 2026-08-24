const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const importStr = `import { requestWorkspaceAuth, getStoredWorkspaceToken, uploadFileToGoogleDrive, fetchGoogleDriveFiles, downloadGoogleDriveFileAsBase64 } from "./utils/workspaceService";
`;

content = content.replace('import { TRANSLATIONS } from "./utils/translations";', 'import { TRANSLATIONS } from "./utils/translations";\n' + importStr);
fs.writeFileSync('src/App.tsx', content);
