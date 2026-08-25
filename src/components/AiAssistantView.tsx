import React, { useState, useEffect } from "react";
import { PlatformUser, UserRole } from "../types";
import { Cpu, Brain, FileText, FileUp, Languages, Lock, CheckCircle, HelpCircle, Image as ImageIcon, X } from "lucide-react";
import { LEGAL_PROMPTS } from "../utils/prompts";
import { requestWorkspaceAuth, getStoredWorkspaceToken, fetchGooglePhotos, GooglePhoto } from "../utils/workspaceService";

interface AiAssistantProps {
  currentUser: PlatformUser;
  onUpdateUserSubscription?: (phone: string, status: boolean) => void;
}

export default function AiAssistantView({ currentUser, onUpdateUserSubscription }: AiAssistantProps) {
  // Subscription simulator
  const [isSubscribed, setIsSubscribed] = useState(currentUser.phone === "01283233555"); // Admin auto subscribed
  const [showPayModal, setShowPayModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // AI Tool Selection
  const [activeTool, setActiveTool] = useState<"document-analyzer" | "briefs" | "loopholes" | "contracts" | "chat" | "ocr" | "prompts">("prompts");

  // Inputs
  const [caseDetails, setCaseDetails] = useState("");
  const [courtType, setCourtType] = useState("جنح ههيا");
  const [subject, setSubject] = useState("تبديد منقولات زوجية");
  const [clientName, setClientName] = useState(currentUser.name);
  const [opponentName, setOpponentName] = useState("رشا جابر عبد الرحمن");

  const [contractType, setContractType] = useState("عقد بيع شقة سكنية");
  const [contractParties, setContractParties] = useState("الطرف الأول: أحمد محمد (بائع)، الطرف الثاني: علي حسن (مشتري)");
  const [contractConditions, setContractConditions] = useState("الثمن 500 ألف جنيه، والتسليم فوري.");

  const [selectedPromptId, setSelectedPromptId] = useState("p1");

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([
    { role: "model", text: "أهلاً بك! أنا مساعدك القانوني الذكي المدرب تحت رعاية الأستاذ المحامي. كيف يمكنني إفادتك اليوم؟" }
  ]);

  const [ocrImageStr, setOcrImageStr] = useState<string | null>(null);
  
  const [ocrImages, setOcrImages] = useState<{ id: string; url: string; textResult: string; isProcessing: boolean }[]>(() => {
    const saved = localStorage.getItem('law_ocr_drafts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('law_ocr_drafts', JSON.stringify(ocrImages));
  }, [ocrImages]);

  const [ocrTextResult, setOcrTextResult] = useState("");

  const [poaDocuments, setPoaDocuments] = useState<{ id: string; clientName: string; textResult: string; url: string; date: string; isProcessing: boolean }[]>(() => {
    const saved = localStorage.getItem('law_poa_docs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('law_poa_docs', JSON.stringify(poaDocuments));
  }, [poaDocuments]);

  const handlePoaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    files.forEach(file => {
      const id = 'poa-' + Math.random().toString(36).substring(2, 9);
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        setPoaDocuments(prev => [{ id, url: base64, clientName: 'جاري الاستخراج...', textResult: '', date: new Date().toISOString(), isProcessing: true }, ...prev]);
        
        try {
          // You can also use a specialized backend endpoint if desired, but here we reuse the existing one
          // By giving the AI a hint to extract POA info.
          // Since the backend uses a fixed prompt, we'll extract the name client-side using regex on the returned text.
          const res = await fetch('/api/ai/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64 })
          });
          const data = await res.json();
          const resultText = data.text || '';
          
          // Try to extract client name from text: "حضر السيد / [Name]" or "أقر أنا / [Name]"
          let extractedName = 'موكل غير معروف';
          const nameMatch = resultText.match(/(?:حضر السيد|حضر السيد\/|حضر|أقر أنا|أقر السيد|توكيل رسمي عام من)\s*[\/:]?\s*([^،\n\-:0-9]+)/i);
          if (nameMatch && nameMatch[1]) {
            extractedName = nameMatch[1].trim();
          }

          setPoaDocuments(prev => prev.map(doc => 
            doc.id === id ? { ...doc, textResult: resultText, clientName: extractedName, isProcessing: false } : doc
          ));
        } catch (err) {
          console.error(err);
          setPoaDocuments(prev => prev.map(doc => 
            doc.id === id ? { ...doc, textResult: 'فشل استخراج النص.', clientName: 'خطأ', isProcessing: false } : doc
          ));
        }
      };
      reader.readAsDataURL(file);
    });
  };


  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [googlePhotos, setGooglePhotos] = useState<GooglePhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  // Document Analyzer States
  const [docFileName, setDocFileName] = useState("");
  const [extractedDocText, setExtractedDocText] = useState("");
  const [docAnalysisOutput, setDocAnalysisOutput] = useState("");
  const [docFeesOutput, setDocFeesOutput] = useState<{minEgp:string, maxEgp:string, minUsd:string, maxUsd:string, recommendation:string} | null>(null);

  // Outputs
  const [aiOutput, setAiOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSimulatePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsSubscribed(true);
      setIsProcessingPayment(false);
      setShowPayModal(false);
      alert("تم تأكيد دفع قيمة الاشتراك بنجاح (100 جنيه / 50 دولار) عبر المحفظة / InstaPay! تم فتح مميزات الذكاء الاصطناعي لكافة أدوات مكتب المحامي.");
    }, 1500);
  };

  // 1. Generate defense brief
  const handleGenerateDefenseBrief = async () => {
    if (!caseDetails) {
      alert("الرجاء تعبئة سياق وتفاصيل القضية.");
      return;
    }
    setIsGenerating(true);
    setAiOutput("");
    try {
      const res = await fetch("/api/ai/defense-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: caseDetails,
          courtType,
          subject,
          clientName,
          opponentName
        })
      });
      const data = await res.json();
      setAiOutput(data.text || "لم نتمكن من الحصول على عريضة قانونية مناسبة.");
    } catch (e) {
      console.error(e);
      setAiOutput("عذراً، تعذر صياغة المذكرة مؤقتاً. يرجى مراجعة اتصال الخادم.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Extract loopholes
  const handleExtractLoopholes = async () => {
    if (!caseDetails) {
      alert("الرجاء تعبئة سياق وتفاصيل الواقعة لاستخراج الثغرات.");
      return;
    }
    setIsGenerating(true);
    setAiOutput("");
    try {
      const res = await fetch("/api/ai/loopholes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: caseDetails,
          courtType,
          subject
        })
      });
      const data = await res.json();
      setAiOutput(data.text || "لم يكتشف محرك التحليل ثغرات واضحة.");
    } catch (e) {
      console.error(e);
      setAiOutput("فشل خادم الاستشارة الذكي في معالجة الواقعة.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Draft contract
  const handleDraftContract = async () => {
    if (!contractType) {
      alert("الرجاء تعيين نوع العقد أولاً.");
      return;
    }
    setIsGenerating(true);
    setAiOutput("");
    try {
      const res = await fetch("/api/ai/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractType,
          partiesDetails: contractParties,
          conditions: contractConditions
        })
      });
      const data = await res.json();
      setAiOutput(data.text || "فشلت صياغة ثنايا العقد المدني.");
    } catch (e) {
      console.error(e);
      setAiOutput("حدث خطأ أثناء تحرير العقد سحابياً.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePrompt = () => {
    const promptDef = LEGAL_PROMPTS.find(p => p.id === selectedPromptId);
    if (!promptDef) return;

    let text = promptDef.template;
    text = text.replace(/\[نوع_القضية\]/g, subject || "القضية");
    text = text.replace(/\[الوقائع\]/g, caseDetails || "يتم كتابة الوقائع هنا...");
    text = text.replace(/\[اسم_الموكل\]/g, clientName || "الموكل");
    text = text.replace(/\[الخصم\]/g, opponentName || "الخصم");
    text = text.replace(/\[المحكمة\]/g, courtType || "المحكمة المختصة");

    setAiOutput(text);
  };

  // 4. Chat with AI
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: chatHistory
        })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: "model", text: data.text || "لم أفهم سؤالك بالشكل الكامل، يُرجى إعادة الصياغة." }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: "model", text: "أجندة الخادم غير متوفرة حالياً، يرجى إعادة الإرسال لاحقاً." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Google Photos Integration
  const handleOpenGooglePhotosModal = () => {
    let tokenState = getStoredWorkspaceToken();
    if (!tokenState.accessToken) {
      requestWorkspaceAuth((newState) => {
        loadPhotosWithToken(newState.accessToken!);
      }, (err) => {
        alert("تعذر الاتصال بـ Google Photos. يرجى التأكد من الموافقة على الأذونات.");
      });
      return;
    }
    loadPhotosWithToken(tokenState.accessToken);
  };

  const loadPhotosWithToken = async (token: string) => {
    setIsLoadingPhotos(true);
    setShowPhotosModal(true);
    try {
      const photos = await fetchGooglePhotos(token);
      setGooglePhotos(photos);
    } catch (e: any) {
      console.error(e);
      alert("خطأ في استيراد صور Google: " + (e.message || e));
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const handleSelectGooglePhoto = async (photo: GooglePhoto) => {
    setShowPhotosModal(false);
    const id = "photo-g-" + Math.random().toString(36).substring(2, 9);
    
    // We need to fetch the actual image bytes to send it to the OCR endpoint
    // Google Photos API URLs need =d at the end to download or =w1024 to get a sized version
    const url = `${photo.baseUrl}=w1024`;
    
    setOcrImages(prev => [...prev, { id, url, textResult: "", isProcessing: true }]);
    
    try {
      // We'll just pass the URL to our backend or we can fetch the blob client side and convert to base64
      // Since it might have CORS, let's try fetching the blob client side first
      const resp = await fetch(url);
      const blob = await resp.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch("/api/ai/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 })
          });
          const data = await res.json();
          const resultText = data.text || "لم يتم العثور على كلمات مطبوعة أو يدوية مقروءة.";
          
          setOcrImages(prev => prev.map(img => 
            img.id === id ? { ...img, textResult: resultText, isProcessing: false } : img
          ));
        } catch (err) {
          console.error(err);
          setOcrImages(prev => prev.map(img => 
            img.id === id ? { ...img, textResult: "فشلت عملية المسح الضوئي.", isProcessing: false } : img
          ));
        }
      };
      reader.readAsDataURL(blob);
      
    } catch (err) {
      console.error(err);
      setOcrImages(prev => prev.map(img => 
        img.id === id ? { ...img, textResult: "فشل تحميل الصورة من Google Photos.", isProcessing: false } : img
      ));
    }
  };

  // 5. Hand Writing OCR
  const handleOcrImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    files.forEach(file => {
      const id = Math.random().toString(36).substring(2, 9);
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        setOcrImages(prev => [...prev, { id, url: base64, textResult: "", isProcessing: true }]);
        
        try {
          const res = await fetch("/api/ai/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 })
          });
          const data = await res.json();
          const resultText = data.text || "لم يتم العثور على كلمات مطبوعة أو يدوية مقروءة.";
          
          setOcrImages(prev => prev.map(img => 
            img.id === id ? { ...img, textResult: resultText, isProcessing: false } : img
          ));
        } catch (err) {
          console.error(err);
          setOcrImages(prev => prev.map(img => 
            img.id === id ? { ...img, textResult: "فشلت عملية المسح الضوئي.", isProcessing: false } : img
          ));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // 6. Comprehensive Document Analysis
  const handleDocAnalyzerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocFileName(file.name);
    setExtractedDocText("");
    setDocAnalysisOutput("");
    setDocFeesOutput(null);
    setIsGenerating(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/ai/extract-document-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileBase64: base64, mimeType: file.type, fileName: file.name })
        });
        const data = await res.json();
        setExtractedDocText(data.text || "لم يتم العثور على نصوص.");
      } catch (err) {
        console.error(err);
        setExtractedDocText("فشل استخراج النصوص من المستند المرفوع.");
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocIdentifyWeaknesses = async () => {
    if (!extractedDocText) return;
    setIsGenerating(true);
    setDocAnalysisOutput("");
    setDocFeesOutput(null);
    try {
      const res = await fetch("/api/ai/loopholes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: extractedDocText,
          courtType: "غير محدد",
          subject: "مستند تم رفعه للتحليل"
        })
      });
      const data = await res.json();
      setDocAnalysisOutput(data.text || "لم يتم التعرف على ثغرات محددة.");
    } catch (err) {
      setDocAnalysisOutput("حدث خطأ أثناء استخراج الثغرات من المستند.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDocGenerateDraft = async (type: "defense" | "contract") => {
    if (!extractedDocText) return;
    setIsGenerating(true);
    setDocAnalysisOutput("");
    setDocFeesOutput(null);
    try {
      const endpoint = type === "defense" ? "/api/ai/defense-brief" : "/api/ai/contract";
      const body = type === "defense" 
        ? { details: extractedDocText, courtType: "المحكمة المختصة", subject: "صياغة مستند دفاع بناءً على المرفق", clientName: "طرف 1", opponentName: "طرف 2" }
        : { contractType: "صياغة عقد مبني على المستند المرفق", partiesDetails: "الأطراف المذكورة بالمستند", conditions: extractedDocText };
        
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setDocAnalysisOutput(data.text || "فشلت صياغة المستند.");
    } catch (err) {
      setDocAnalysisOutput("حدث خطأ أثناء محاولة الصياغة القانونية.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDocEstimateFees = async () => {
    if (!extractedDocText) return;
    setIsGenerating(true);
    setDocAnalysisOutput("");
    setDocFeesOutput(null);
    try {
      const res = await fetch("/api/ai/fees-estimator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: extractedDocText,
          courtType: "غير محدد",
          subject: "تحليل القضية المرفقة لتحديد الأتعاب"
        })
      });
      const data = await res.json();
      setDocFeesOutput(data);
    } catch (err) {
      console.error("Estimator error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 text-right font-sans text-slate-800" dir="rtl">
      
      {/* Title banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-sm flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">مجمع ومستشار المساعد القانوني بالذكاء الاصطناعي (AI)</h2>
          <p className="text-xs text-slate-500 mt-1">
            صياغة لوائح، استخراج ثغرات القانون المصري، تحرير العقود النموذجية وتحليل الصور يدوية خطية بدقة متناهية.
          </p>
        </div>
        
        {/* Toggle Subscription state indicator */}
        <div className="flex items-center gap-2">
          {isSubscribed ? (
            <span className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              الاشتراك القضائي الذكي نشط
            </span>
          ) : (
            <button
              id="unlock-ai-btn"
              onClick={() => setShowPayModal(true)}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-sm animate-pulse"
            >
              <Lock className="w-3.5 h-3.5" />
              تفعيل الاشتراك (100 ج بالشرقية)
            </button>
          )}
        </div>
      </div>

      {/* CORE SUBSCRIPTION LOCK COVER */}
      {!isSubscribed ? (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-amber-300 text-center space-y-4 shadow-sm">
          <Brain className="w-12 h-12 text-amber-550 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-slate-900">تنبيه بالاشتراك السنوي لخدمات الذكاء الاصطناعي (AI Studio)</h3>
          <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
            للحصول على الصلاحية وصياغة لوائح مذكرات المحكمة والتحاليل الجرمية، يتطلب البرنامج اشتراكاً سنوياً بقيمة:
            <span className="text-amber-800 font-extrabold mx-1">100 جنيه مصري</span> للأرقام المصرية، أو 
            <span className="text-amber-800 font-extrabold mx-1">50 دولار أمريكي</span> للأرقام الدولية.
          </p>

          <div className="p-4 bg-slate-50 max-w-md mx-auto rounded-xl border border-slate-200 text-xs space-y-1.5">
            <p className="text-slate-700 font-bold">طرق سداد وتفعيل الإقرار السريع:</p>
            <p className="text-slate-650 text-slate-600">● المحفظة الإلكترونية لربيع الشناوي: <strong className="text-amber-800 font-mono">01555477755</strong></p>
            <p className="text-slate-650 text-slate-600">● InstaPay الخاص بمكتب الإدارة: <strong className="text-amber-800 font-mono">01283233555</strong></p>
          </div>

          <button
            id="pay-activate-ai"
            onClick={() => setShowPayModal(true)}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-600 font-black text-slate-900 rounded-lg text-xs transition cursor-pointer shadow-md inline-block"
          >
            تفعيل الاشتراك السريع للذكاء الاصطناعي بنقرة واحدة
          </button>
        </div>
      ) : (
        /* SUBSCRIBED COMPONENT UNLOCKED */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Right Sidebar options selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1 shadow-sm h-fit">
            <p className="text-[10px] text-slate-400 font-bold pr-1 mb-2">أدوات الذكاء المقنن</p>
            
            <button
              id="ai-tool-document-analyzer"
              onClick={() => { setActiveTool("document-analyzer"); setAiOutput(""); }}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTool === "document-analyzer" ? "bg-amber-500 text-slate-900 font-black shadow-sm" : "text-slate-705 hover:bg-slate-50"}`}
            >
              <span>المحلل القانوني الشامل</span>
              <FileUp className="w-4 h-4 text-slate-500" />
            </button>

            <button
              id="ai-tool-briefs"
              onClick={() => { setActiveTool("briefs"); setAiOutput(""); }}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTool === "briefs" ? "bg-amber-500 text-slate-900 font-black shadow-sm" : "text-slate-705 hover:bg-slate-50"}`}
            >
              <span>تحرير مذكرات دفاع جنائية</span>
              <FileText className="w-4 h-4 text-slate-500" />
            </button>

            <button
              id="ai-tool-loopholes"
              onClick={() => { setActiveTool("loopholes"); setAiOutput(""); }}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTool === "loopholes" ? "bg-amber-500 text-slate-900 font-black shadow-sm" : "text-slate-705 hover:bg-slate-50"}`}
            >
              <span>استنباط الثغرات القانونية</span>
              <HelpCircle className="w-4 h-4 text-slate-500" />
            </button>

            <button
              id="ai-tool-contracts"
              onClick={() => { setActiveTool("contracts"); setAiOutput(""); }}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTool === "contracts" ? "bg-amber-500 text-slate-900 font-black shadow-sm" : "text-slate-705 hover:bg-slate-50"}`}
            >
              <span>صياغة عقود مدنية وتجارية</span>
              <Languages className="w-4 h-4 text-slate-500" />
            </button>

            <button
              id="ai-tool-ocr"
              onClick={() => { setActiveTool("ocr"); setAiOutput(""); }}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTool === "ocr" ? "bg-amber-500 text-slate-900 font-black shadow-sm" : "text-slate-705 hover:bg-slate-50"}`}
            >
              <span>فك نصوص خطوط اليد (OCR)</span>
              <FileUp className="w-4 h-4 text-slate-500" />
            </button>

            <button
              id="ai-tool-prompts"
              onClick={() => { setActiveTool("prompts"); setAiOutput(""); }}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTool === "prompts" ? "bg-amber-500 text-slate-900 font-black shadow-sm" : "text-slate-705 hover:bg-slate-50"}`}
            >
              <span>مكتبة البرومبتات القانونية</span>
              <FileText className="w-4 h-4 text-slate-500" />
            </button>

            <button
              id="ai-tool-chat"
              onClick={() => { setActiveTool("chat"); setAiOutput(""); }}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTool === "chat" ? "bg-amber-500 text-slate-900 font-black shadow-sm" : "text-slate-705 hover:bg-slate-50"}`}
            >
              <span>محادثة المستشار والمحاور الذكي</span>
              <Brain className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Left panel Interactive Forms + outputs */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* 0. DOCUMENT ANALYZER */}
            {activeTool === "document-analyzer" && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm animate-fade-in">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-amber-550" />
                  تحليل المستندات المتقدم (Word, PDF, صور)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  قم برفع المستند لاستخراج نصوصه، ثم اختر الإجراء الذكي المطلوب (استخراج ثغرات، صياغة مذكرات/عقود، أو تقدير الأتعاب بناءً على التشريع المصري).
                </p>

                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 relative hover:border-amber-500/40 cursor-pointer transition">
                  <input
                    id="doc-analyzer-file"
                    type="file"
                    accept=".pdf,.docx,.doc,image/*"
                    onChange={handleDocAnalyzerUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileUp className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-pulse" />
                  <span className="text-xs text-slate-500 font-semibold block">اسحب ملف (PDF, Word, Image) أو اضغط للرفع وبدء الاستخراج</span>
                </div>

                {isGenerating && (
                  <p className="text-xs text-amber-700 text-center animate-pulse font-bold">جاري معالجة المستند بالذكاء الاصطناعي...</p>
                )}

                {extractedDocText && !isGenerating && (
                  <div className="space-y-4 mt-4 animate-fade-in">
                    <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-emerald-800">النص المستخرج من {docFileName}:</p>
                        <button onClick={() => setExtractedDocText("")} className="text-[10px] text-red-600 hover:underline">مسح وإعادة تحميل</button>
                      </div>
                      <p className="text-xs text-slate-800 font-sans whitespace-pre-line text-right max-h-32 overflow-y-auto bg-white p-3 rounded-lg border border-emerald-200 leading-relaxed">
                        {extractedDocText}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={handleDocIdentifyWeaknesses}
                        className="px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg cursor-pointer transition text-center"
                      >
                        استخراج الثغرات ونقاط الضعف
                      </button>
                      <button
                        onClick={() => handleDocGenerateDraft("defense")}
                        className="px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg cursor-pointer transition text-center"
                      >
                        صياغة مذكرة دفاع
                      </button>
                      <button
                        onClick={() => handleDocGenerateDraft("contract")}
                        className="px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg cursor-pointer transition text-center"
                      >
                        صياغة عقد مبدئي
                      </button>
                      <button
                        onClick={handleDocEstimateFees}
                        className="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-[11px] rounded-lg cursor-pointer transition text-center"
                      >
                        تقدير الأتعاب المتوسطة
                      </button>
                    </div>
                  </div>
                )}

                {docFeesOutput && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3 animate-fade-in">
                    <h4 className="text-xs font-bold text-blue-900 border-b border-blue-100 pb-1">تقدير الأتعاب العادلة للمحامي</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-blue-100 text-center">
                        <p className="text-[10px] text-slate-500">بالجنيه المصري (EGP)</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">{docFeesOutput.minEgp} - {docFeesOutput.maxEgp}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-blue-100 text-center">
                        <p className="text-[10px] text-slate-500">بالدولار الأمريكي (USD)</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">{docFeesOutput.minUsd} - {docFeesOutput.maxUsd}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-blue-100 mt-2">
                      <strong className="text-blue-800">توصية: </strong>{docFeesOutput.recommendation}
                    </p>
                  </div>
                )}

                {docAnalysisOutput && (
                  <div className="mt-4 space-y-2 animate-fade-in">
                    <p className="text-xs font-bold text-slate-800">النتيجة والتحليل القانوني:</p>
                    <textarea
                      readOnly
                      rows={12}
                      value={docAnalysisOutput}
                      className="w-full p-4 bg-slate-50 text-slate-900 font-sans text-xs rounded-xl border border-slate-250 leading-relaxed text-right outline-none whitespace-pre-wrap select-all shadow-inner"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 1. DEFENSE BRIEFS */}
            {activeTool === "briefs" && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm animate-fade-in">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1.5">صياغة محكمة لمذكرات دفاع مصرية رصينة</h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1" htmlFor="tool-court">نوع المحكمة</label>
                    <input id="tool-court" type="text" value={courtType} onChange={(e) => setCourtType(e.target.value)} className="w-full bg-slate-50 text-slate-905 border border-slate-200 p-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1" htmlFor="tool-subject">الموضوع / التهمة</label>
                    <input id="tool-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-slate-50 text-slate-905 border border-slate-200 p-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1" htmlFor="tool-client">اسم الموكل</label>
                    <input id="tool-client" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-slate-50 text-slate-905 border border-slate-200 p-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1" htmlFor="tool-opponent">اسم الخصم</label>
                    <input id="tool-opponent" type="text" value={opponentName} onChange={(e) => setOpponentName(e.target.value)} className="w-full bg-slate-50 text-slate-905 border border-slate-200 p-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-705 text-xs mb-1 font-bold" htmlFor="tool-details">ملخص تفاصيل المحضر والمجريات الجنائية المزعومة</label>
                  <textarea
                    id="tool-details"
                    rows={4}
                    value={caseDetails}
                    onChange={(e) => setCaseDetails(e.target.value)}
                    placeholder="مثال: اتهمت النيابة العامة موكلنا بتبديد منقولات زوجية بمحضر ههيا النموذجي واستخراج حكم غيابي حبس سنة."
                    className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded text-right text-xs outline-none focus:bg-white focus:border-amber-500 transition"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    id="generate-brief-btn"
                    onClick={handleGenerateDefenseBrief}
                    disabled={isGenerating}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold text-xs rounded cursor-pointer transition shadow-sm"
                  >
                    {isGenerating ? "جاري البناء والصياغة..." : "صياغة مذكرة الدفاع بالذكاء الاصطناعي"}
                  </button>
                </div>
              </div>
            )}

            {/* 2. LOOPHOLES */}
            {activeTool === "loopholes" && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm animate-fade-in">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1.5">تحليل واستخراج ثغرات المحاضر والقضايا (Egyptian Law)</h3>
                <div>
                  <label className="block text-slate-705 text-xs mb-1 font-bold" htmlFor="loophole-details">انسخ تفاصيل محضر التحقيق، الاعترافات، أو عريضة الاتهام</label>
                  <textarea
                    id="loophole-details"
                    rows={5}
                    value={caseDetails}
                    onChange={(e) => setCaseDetails(e.target.value)}
                    placeholder="الصق تفاصيل المحاضر لمعرفة الدفوع الشكلية كبطلان الإذن أو الدفوع الموضوعية كهروب التسليم الفعلي..."
                    className="w-full p-3 bg-slate-50 text-slate-905 border border-slate-200 rounded text-right text-xs outline-none focus:bg-white focus:border-amber-500 transition"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    id="extract-loopholes-btn"
                    onClick={handleExtractLoopholes}
                    disabled={isGenerating}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold text-xs rounded cursor-pointer transition shadow-sm"
                  >
                    {isGenerating ? "جاري تفتيش عيوب الصحيفة..." : "استخلاص الدفوع والثغرات المدعمة"}
                  </button>
                </div>
              </div>
            )}

            {/* 3. CONTRACTS */}
            {activeTool === "contracts" && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm animate-fade-in">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1.5">تحرير عقود مدنية وتجارية متكاملة البنود</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1" htmlFor="contract-type-input">نوع العقد المراد صياغته</label>
                    <input id="contract-type-input" type="text" value={contractType} onChange={(e) => setContractType(e.target.value)} placeholder="عقد بيع شقة، شراكة، إيجار..." className="w-full bg-slate-50 text-slate-900 p-2 border border-slate-200 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1" htmlFor="parties-input">أطراف وهويات العاقدين</label>
                    <input id="parties-input" type="text" value={contractParties} onChange={(e) => setContractParties(e.target.value)} placeholder="بيانات الطرفين الرباعية والرقم قومي..." className="w-full bg-slate-50 text-slate-900 p-2 border border-slate-200 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-705 text-xs mb-1 font-bold" htmlFor="conditions-textarea">شروط وبنود استثنائية (إن وجدت)</label>
                  <textarea
                    id="conditions-textarea"
                    rows={3}
                    value={contractConditions}
                    onChange={(e) => setContractConditions(e.target.value)}
                    placeholder="مثال: دفع ربع الثمن مقدم والباقي على قسطين لمدة سنة كاملة بنسبة التزام..."
                    className="w-full p-3 bg-slate-50 text-slate-905 border border-slate-200 rounded text-right text-xs outline-none focus:bg-white focus:border-amber-500 transition"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    id="draft-contract-btn"
                    onClick={handleDraftContract}
                    disabled={isGenerating}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold text-xs rounded cursor-pointer transition shadow-sm"
                  >
                    {isGenerating ? "جاري التحرير المدني الرصين..." : "صياغة العقد المدني بالكامل"}
                  </button>
                </div>
              </div>
            )}

            {/* 4. HANDWRITING OCR INPUT */}
            {activeTool === "ocr" && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm animate-fade-in">
                <h3 className="text-sm font-bold text-slate-900 pb-1 border-b border-slate-100">تحويل خطوط اليد والمذكرات المصورة لنصوص قابلة للتعديل</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  قم بتحميل صورة لمستند رسمي، توكيل رسمي أو ملاحظات يدوية مكتوبة لكشط الكلمات وتصفيتها كلياً بالـ AI.
                </p>

                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 relative hover:border-amber-500/40 cursor-pointer transition">
                  <input
                    id="ocr-file-chooser"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleOcrImageFile}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileUp className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-pulse" />
                  <span className="text-xs text-slate-500 font-semibold block">اسحب ملفات صور أو اضغط للرفع فوراً وبدء استخلاص الكلمات</span>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleOpenGooglePhotosModal}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-2 border border-blue-200 transition"
                  >
                    <ImageIcon className="w-4 h-4" />
                    استيراد من Google Photos
                  </button>
                </div>


                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 pb-1 mb-4">استخراج التوكيلات تلقائياً (POA Extraction)</h3>
                  
                  <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 text-center bg-blue-50 relative hover:border-blue-500/40 cursor-pointer transition mb-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePoaUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <span className="text-xs text-blue-700 font-bold block">رفع صور التوكيلات لاستخراج اسم الموكل وحفظها تلقائياً</span>
                  </div>

                  {poaDocuments.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {poaDocuments.map(doc => (
                        <div key={doc.id} className="p-3 bg-white border border-slate-200 rounded-xl flex gap-3 shadow-sm">
                          <img src={doc.url} alt="POA" className="w-16 h-16 object-cover rounded border border-slate-200" />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold text-blue-900 mb-1 truncate">
                              {doc.isProcessing ? (
                                <span className="animate-pulse text-blue-600">جاري استخراج البيانات...</span>
                              ) : (
                                <span>اسم الموكل: {doc.clientName}</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500 mb-1">
                              تاريخ الإضافة: {new Date(doc.date).toLocaleDateString('ar-EG')}
                            </p>
                            {!doc.isProcessing && (
                              <div className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 max-h-12 overflow-y-auto">
                                {doc.textResult || "لا يوجد نص"}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {ocrImages.length > 0 && (
                  <div className="space-y-4">
                    {ocrImages.map(img => (
                      
                      <div key={img.id} className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl flex gap-4 shadow-sm relative">
                        <button onClick={() => setOcrImages(prev => prev.filter(i => i.id !== img.id))} className="absolute top-2 left-2 p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition" title="حذف المسودة">
                           <X className="w-3.5 h-3.5" />
                        </button>
                        <img src={img.url} alt="OCR Preview" className="w-24 h-24 object-cover rounded-lg border border-emerald-200 shadow-sm" />
                        <div className="flex-1 space-y-2">
                          <p className="text-xs font-bold text-emerald-800 mb-1">
                            {img.isProcessing ? (
                              <span className="animate-pulse text-amber-700">جاري تفريغ وفك ترميز الكلمات...</span>
                            ) : "النص المستخرج (مسودة قابلة للتعديل):"}
                          </p>
                          {!img.isProcessing && (
                            <textarea
                               value={img.textResult}
                               onChange={(e) => setOcrImages(prev => prev.map(i => i.id === img.id ? { ...i, textResult: e.target.value } : i))}
                               className="w-full text-xs text-slate-800 font-sans whitespace-pre-line text-right h-32 bg-white p-3 rounded-lg border border-emerald-200 leading-relaxed outline-none focus:ring-2 focus:ring-emerald-400 resize-y"
                            />
                          )}
                          {!img.isProcessing && (
                            <div className="flex gap-2 pt-2 border-t border-emerald-100">
                               <button onClick={() => alert("سيتم ترحيل البيانات المستخرجة لإنشاء ملف موكل جديد.")} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold">إضافة كموكل</button>
                               <button onClick={() => alert("سيتم ترحيل البيانات المستخرجة لإنشاء ملف خصم جديد.")} className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold">إضافة كخصم</button>
                               <button onClick={() => alert("سيتم ربط المستند لإنشاء دعوى/قضية جديدة.")} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold">إضافة كقضية</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTool === "prompts" && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm animate-fade-in">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <span>حزمة البرومبتات (50 برومبت قانوني مصري)</span>
                </h3>
                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1" htmlFor="prompt-select">اختر التصنيف والبرومبت</label>
                    <select
                      id="prompt-select"
                      value={selectedPromptId}
                      onChange={(e) => setSelectedPromptId(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 border border-slate-200 p-2.5 rounded-lg text-right outline-none focus:bg-white focus:border-amber-500 transition"
                    >
                      {Array.from(new Set(LEGAL_PROMPTS.map(p => p.category))).map(cat => (
                        <optgroup key={cat} label={cat}>
                          {LEGAL_PROMPTS.filter(p => p.category === cat).map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1" htmlFor="prompt-subject">موضوع القضية</label>
                      <input id="prompt-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="مثال: إيصال أمانة" className="w-full bg-slate-50 text-slate-905 border border-slate-200 p-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1" htmlFor="prompt-court">المحكمة</label>
                      <input id="prompt-court" type="text" value={courtType} onChange={(e) => setCourtType(e.target.value)} placeholder="جنح مستأنف" className="w-full bg-slate-50 text-slate-905 border border-slate-200 p-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1" htmlFor="prompt-client">اسم الموكل</label>
                      <input id="prompt-client" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-slate-50 text-slate-905 border border-slate-200 p-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1" htmlFor="prompt-opponent">اسم الخصم</label>
                      <input id="prompt-opponent" type="text" value={opponentName} onChange={(e) => setOpponentName(e.target.value)} className="w-full bg-slate-50 text-slate-905 border border-slate-200 p-2 rounded text-right outline-none focus:bg-white focus:border-amber-500 transition" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1" htmlFor="prompt-details">ملخص الوقائع (سيتم دمجه بالبرومبت)</label>
                    <textarea
                      id="prompt-details"
                      rows={3}
                      value={caseDetails}
                      onChange={(e) => setCaseDetails(e.target.value)}
                      placeholder="اكتب هنا تفاصيل ووقائع الدعوى أو العقد..."
                      className="w-full p-2 bg-slate-50 text-slate-905 border border-slate-200 rounded-lg text-right text-xs outline-none focus:bg-white focus:border-amber-500 transition"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleGeneratePrompt}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg cursor-pointer transition shadow-sm"
                    >
                      توليد النص القانوني
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. INTERACTIVE LEGAL CHATBOT */}
            {activeTool === "chat" && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm animate-fade-in">
                <h3 className="text-sm font-bold text-slate-900 flex items-center justify-start gap-1 pb-1 border-b border-slate-100">
                  <Brain className="w-4 h-4 text-amber-550 animate-pulse" />
                  استشارة قانونية فورية تفاعلية
                </h3>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-64 overflow-y-auto space-y-3 flex flex-col text-xs leading-relaxed">
                  {chatHistory.map((h, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl max-w-sm font-sans ${
                        h.role === "user" 
                          ? "bg-amber-550 bg-amber-500 text-slate-900 self-end font-bold text-right shadow-sm" 
                          : "bg-white text-slate-800 border border-slate-150 self-start text-right shadow-sm"
                      }`}
                    >
                      {h.text}
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="bg-white text-amber-800 border border-amber-200 self-start p-2 rounded-xl animate-pulse font-bold">
                      المستشار يفكر في المواد القضائية والرد المناسب...
                    </div>
                  )}
                </div>

                <form onSubmit={handleChatSubmit} className="flex gap-2 text-xs">
                  <input
                    id="chat-message-input"
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="اكتب استشارتك للمحامي المحامي هنا..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg outline-none text-right focus:bg-white focus:border-amber-500 transition"
                  />
                  <button
                    id="chat-submit-btn"
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg cursor-pointer transition shadow-sm"
                  >
                    اسأل المستشار
                  </button>
                </form>
              </div>
            )}

            {/* DYNAMIC TEXTAREA WITH COMPILABLE OUTPUT FOR DRILLS AND TEMPLATES */}
            {activeTool !== "chat" && activeTool !== "ocr" && aiOutput && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-sm animate-fade-in">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 flex-wrap gap-2">
                  <button
                    id="copy-ai-output"
                    onClick={() => {
                      navigator.clipboard.writeText(aiOutput);
                      alert("تم نسخ الملف القانوني بنجاح إلى الحافظة!");
                    }}
                    className="text-amber-800 hover:underline text-[11px] font-bold cursor-pointer transition"
                  >
                    نسخ النص القانوني للذاكرة
                  </button>
                  <span className="text-xs font-bold text-emerald-800">العريضة أو العقد المحكم المدون:</span>
                </div>
                <textarea
                  id="ai-output-area"
                  rows={15}
                  value={aiOutput}
                  onChange={(e) => setAiOutput(e.target.value)}
                  className="w-full p-4 bg-slate-50 text-slate-900 font-sans text-xs rounded-xl border border-slate-250 leading-relaxed text-right outline-none whitespace-pre-wrap focus:bg-white focus:border-amber-500 transition select-all shadow-inner"
                />
              </div>
            )}

          </div>
        </div>
      )}

      {/* MANUAL FAST PAYMENT SIMULATED SCREEN DIALOG */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-md w-full text-right space-y-4 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-slate-900 pb-1 border-b border-slate-100">سداد رسوم فك تشفير وتفعيل الذكاء الاصطناعي</h3>
            <p className="text-xs text-slate-505 text-slate-500">
              لتفعيل الخصائص، يرجى سداد قيمة الاشتراك السنوي المقررة كالتالي:
            </p>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl text-xs text-slate-800 border border-slate-150">
              <p>● أرقام خطوط مصرية: <strong className="text-emerald-700">100 جنيه مصري فقط</strong></p>
              <p>● أرقام خطوط دولية: <strong className="text-amber-800">50 دولار أمريكي فقط</strong></p>
              <p className="border-t border-slate-200 pt-2 text-slate-500 text-[11px] leading-relaxed">
                أرسل المبلغ مرقمًا إلى فودافون كاش: <strong>01555477755</strong> أو InstaPay على: <strong>01283233555</strong>
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3 text-xs">
              <button
                id="close-pay-modal"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded cursor-pointer transition"
              >
                إلغاء الأمر
              </button>
              <button
                id="confirm-pay-modal"
                onClick={handleSimulatePayment}
                disabled={isProcessingPayment}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-extrabold rounded cursor-pointer transition shadow-sm"
              >
                {isProcessingPayment ? "جاري مراجعة التحويل السحابي..." : "لقد قمت بالتحويل، تفعيل الآن"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Google Photos Modal */}
      {showPhotosModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800">صور Google Photos</h2>
                  <p className="text-[11px] text-slate-500 font-medium">اختر صورة لاستخراج النصوص منها عبر الذكاء الاصطناعي</p>
                </div>
              </div>
              <button
                onClick={() => setShowPhotosModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {isLoadingPhotos ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold animate-pulse">جاري سحب الصور من حسابك...</p>
                </div>
              ) : googlePhotos.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm font-semibold">
                  لم يتم العثور على صور في الحساب
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {googlePhotos.map((photo: any) => (
                    <button
                      key={photo.id}
                      onClick={() => handleSelectGooglePhoto(photo)}
                      className="aspect-square relative rounded-xl overflow-hidden group border border-slate-200 hover:border-blue-500 hover:shadow-md transition focus:outline-none"
                    >
                      <img src={`${photo.baseUrl}=w400`} alt={photo.filename} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/20 transition flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-white text-blue-700 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                          اختيار الصورة
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

