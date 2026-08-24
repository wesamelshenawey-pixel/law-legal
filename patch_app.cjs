const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const updated_sync = `
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

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

      const existingFiles = await fetchGoogleDriveFiles(tokenState.accessToken, "name='legal_office_backup.json'", 10);
      
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

  const handleManualCloudSync = () => {
    let tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) {
      requestWorkspaceAuth((newState) => {
        performCloudSync();
      }, (err) => {
        alert("Cloud Backup Failed: Please approve permissions.");
      });
    } else {
      performCloudSync();
    }
  };

  const handleRestoreFromCloud = async () => {
    let tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) {
      requestWorkspaceAuth(async (newState) => {
         await doRestore(newState.accessToken!);
      });
      return;
    }
    await doRestore(tokenState.accessToken);
  };

  const doRestore = async (token: string) => {
    setIsCloudSyncing(true);
    try {
      const files = await fetchGoogleDriveFiles(token, "name='legal_office_backup.json'", 1);
      if (files.length > 0) {
        const file = files[0];
        const { base64 } = await downloadGoogleDriveFileAsBase64(token, file.id);
        const jsonData = decodeURIComponent(escape(atob(base64)));
        
        alert("تم استرجاع البيانات بنجاح من جوجل درايف! يرجى إعادة تحميل الصفحة لتطبيق التغييرات.");
        const parsed = JSON.parse(jsonData);
        for (const key in parsed) {
          localStorage.setItem(key, parsed[key]);
        }
        window.location.reload();
      } else {
        alert("لا يوجد نسخة احتياطية محفوظة على جوجل درايف.");
      }
    } catch (e) {
      console.error(e);
      alert("فشل استرجاع النسخة الاحتياطية.");
    } finally {
      setIsCloudSyncing(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      const token = getStoredWorkspaceToken();
      if (token.accessToken) {
         performCloudSync();
      }
    }, 120000); // 2 mins
    return () => clearInterval(interval);
  }, [currentUser]);

`;

content = content.replace('  const handleLoginSuccess = (user: PlatformUser) => {', updated_sync + '\n  const handleLoginSuccess = (user: PlatformUser) => {');

fs.writeFileSync('src/App.tsx', content);
