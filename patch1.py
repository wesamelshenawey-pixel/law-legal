import sys

with open('src/components/AttachmentsView.tsx', 'r') as f:
    content = f.read()

# Add import for Camera and OcrCameraScannerModal
content = content.replace('import { \n  Paperclip,', 'import OcrCameraScannerModal from "./OcrCameraScannerModal";\nimport { \n  Camera,\n  Paperclip,')

# Add state
content = content.replace('  const [showUploadModal, setShowUploadModal] = useState(false);', '  const [showUploadModal, setShowUploadModal] = useState(false);\n  const [showCameraModal, setShowCameraModal] = useState(false);')

# Add camera capture handler
capture_handler = """  const handleCameraCapture = (base64: string, name: string) => {
    setUploadName(name);
    setFileSizeStr("صورة ملتقطة");
    setDetectedType("image");
    setFileBase64(base64);
    setUploadCategory("other");
    setShowCameraModal(false);
    
    // Save to localStorage so SmartOcrStudio can pick it up
    try {
      localStorage.setItem("law_ocr_pending_scan", JSON.stringify({ base64, name }));
    } catch(e) {}
    
    // Automatically trigger OCR processing by navigating to SmartOcrStudio
    if (onNavigateToOcr) {
      onNavigateToOcr();
    } else {
      setShowUploadModal(true);
    }
  };
"""

content = content.replace('  // Submit New Attachment', capture_handler + '\n  // Submit New Attachment')

# Add button to trigger camera
button_target = """          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>رفع مرفق ومستند جديد ✦</span>
          </button>"""

button_replacement = """          <button
            onClick={() => setShowCameraModal(true)}
            className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>تصوير مستند ✦</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>رفع مرفق ومستند جديد ✦</span>
          </button>"""

content = content.replace(button_target, button_replacement)

# Add Modal
modal_target = """      {/* Upload/Add Attachment Modal */}"""

modal_replacement = """      {/* Camera Scanner Modal */}
      <OcrCameraScannerModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />

      {/* Upload/Add Attachment Modal */}"""

content = content.replace(modal_target, modal_replacement)

with open('src/components/AttachmentsView.tsx', 'w') as f:
    f.write(content)

print("AttachmentsView patched")
