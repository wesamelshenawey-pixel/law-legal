import sys

with open('src/components/SmartOcrStudio.tsx', 'r') as f:
    content = f.read()

target1 = "  const [scanItems, setScanItems] = useState<UploadedScanItem[]>([]);"
replacement1 = "  const [scanItems, setScanItems] = useState<UploadedScanItem[]>([]);\n  const [autoTriggerOcr, setAutoTriggerOcr] = useState(false);"

target2 = """          setActiveItemId(itemId);
          localStorage.removeItem("law_ocr_pending_scan");"""
replacement2 = """          setActiveItemId(itemId);
          localStorage.removeItem("law_ocr_pending_scan");
          setAutoTriggerOcr(true);"""

target3 = """  useEffect(() => {
    const text = aiDraftedText || extractedOverallText;"""
replacement3 = """  useEffect(() => {
    if (autoTriggerOcr && scanItems.length > 0) {
      handleBatchOcr();
      setAutoTriggerOcr(false);
    }
  }, [autoTriggerOcr, scanItems]);

  useEffect(() => {
    const text = aiDraftedText || extractedOverallText;"""

if target1 in content and target2 in content and target3 in content:
    content = content.replace(target1, replacement1)
    content = content.replace(target2, replacement2)
    content = content.replace(target3, replacement3)
    with open('src/components/SmartOcrStudio.tsx', 'w') as f:
        f.write(content)
    print("Success auto ocr")
else:
    print("Targets not found auto ocr")
