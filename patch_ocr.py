import sys

with open('src/components/SmartOcrStudio.tsx', 'r') as f:
    content = f.read()

target = """  useEffect(() => {
    const text = aiDraftedText || extractedOverallText;"""

replacement = """  useEffect(() => {
    try {
      const pending = localStorage.getItem("law_ocr_pending_scan");
      if (pending) {
        const parsed = JSON.parse(pending);
        if (parsed && parsed.base64 && parsed.name) {
          const itemId = "scan-" + Math.random().toString(36).substring(2, 9);
          const newItem = {
            id: itemId,
            name: parsed.name,
            previewUrl: parsed.base64,
            base64: parsed.base64,
            size: 1024 * 120,
            isProcessing: false,
            filter: "normal" as const
          };
          setScanItems(prev => [...prev, newItem]);
          setActiveItemId(itemId);
          localStorage.removeItem("law_ocr_pending_scan");
        }
      }
    } catch(e) {}
  }, []);

  useEffect(() => {
    const text = aiDraftedText || extractedOverallText;"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/SmartOcrStudio.tsx', 'w') as f:
        f.write(content)
    print("Success patch_ocr")
else:
    print("Target not found patch_ocr")
