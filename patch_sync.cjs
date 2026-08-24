const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const updated_sync = `
  const performCloudSync = async () => {
    const tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) return;

    setIsCloudSyncing(true);
    try {
      const allData: any = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("law_")) {
          allData[key] = localStorage.getItem(key);
        }
      }
      
      const jsonData = JSON.stringify(allData);
      const base64Data = btoa(unescape(encodeURIComponent(jsonData)));
      const mimeType = "application/json";

      // Check if file already exists to overwrite/delete old ones
      const existingFiles = await fetchGoogleDriveFiles(tokenState.accessToken, "name='legal_office_backup.json'", 10);
      
      // Delete old files to prevent duplication (simple cleanup)
      for (const file of existingFiles) {
         try {
            await fetch(\`https://www.googleapis.com/drive/v3/files/\${file.id}\`, {
               method: 'DELETE',
               headers: { Authorization: \`Bearer \${tokenState.accessToken}\` }
            });
         } catch (e) {
            console.error("Cleanup error", e);
         }
      }

      await uploadFileToGoogleDrive(
        tokenState.accessToken,
        "legal_office_backup.json",
        "data:application/json;base64," + base64Data,
        mimeType
      );
      setLastSyncTime(new Date());
    } catch (e) {
      console.error("Cloud Sync Error:", e);
    } finally {
      setIsCloudSyncing(false);
    }
  };
`;

content = content.replace(/const performCloudSync = async \(\) => \{[\s\S]*?setIsCloudSyncing\(false\);\n    \}\n  \};/, updated_sync.trim());

fs.writeFileSync('src/App.tsx', content);
