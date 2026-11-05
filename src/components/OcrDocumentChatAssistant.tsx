import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Globe,
  Cpu,
  X,
  FileText
} from "lucide-react";

interface DocumentChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
}

interface OcrDocumentChatAssistantProps {
  documentText: string;
  documentTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function OcrDocumentChatAssistant({
  documentText,
  documentTitle = "المستند المستخرج",
  isOpen,
  onClose
}: OcrDocumentChatAssistantProps) {
  const [messages, setMessages] = useState<DocumentChatMessage[]>([
    {
      id: "initial-msg",
      sender: "bot",
      text: `مرحباً بك. أنا المساعد الذكي المخصص لفحص هذا المستند. قمت بقراءة وفهم محتوى "${documentTitle}".\nيمكنك سؤالي عن أي جزئية، أو طلب استخراج التواريخ، أو حصر التناقضات، أو فحص الثغرات القانونية وفقاً للقانون المصري.`,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<"gemini-3.8-flash" | "gemini-4-argon" | "gemini-3.1-flash-lite">("gemini-3.8-flash");
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: DocumentChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    // Build chat history for multi-turn
    const historyPayload = messages.map((m) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    const contextualPrompt = `أنت مستشار قانوني مصري خبير. المستند الحالي الذي تقوم بدراسته وفحصه هو التالي:
--- بداية المستند ---
${documentText.slice(0, 15000)}
--- نهاية المستند ---

سؤال المستخدم حول المستند:
"${query}"

أجب باللغة العربية الفصحى بدقة بالغة، مستنداً إلى بنود المستند المذكور، والقوانين المصرية ذات الصلة وأحكام محكمة النقض.`;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: contextualPrompt,
          history: historyPayload,
          model: selectedModel,
          useSearchGrounding: useSearchGrounding,
          systemRole: "lawyer"
        })
      });

      if (!res.ok) throw new Error("تعذر تحليل المستند");
      const data = await res.json();

      const botMsg: DocumentChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.text || "تم فحص الاستفسار بناءً على نص المستند.",
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      const errorMsg: DocumentChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: "حدث خطأ أثناء فحص المستند: " + e.message,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 font-sans" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl h-[650px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-950 text-white p-4 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow">
              <Bot className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-amber-400">
                  المساعد الذكي للتحاور مع المستند
                </h3>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono">
                  {selectedModel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                {documentTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Model Selector & Google Search Grounding */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold text-slate-700 dark:text-slate-300">النموذج:</span>
            <select
              value={selectedModel}
              onChange={(e: any) => setSelectedModel(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (الأسرع والأشمل)</option>
              <option value="gemini-4-argon">gemini-4-argon (الاستدلال والتأصيل العميق)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (الفائق الخفيف)</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              checked={useSearchGrounding}
              onChange={(e) => setUseSearchGrounding(e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-500 rounded"
            />
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <span>البحث الحي بالإنترنت (Google Search)</span>
          </label>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
          {[
            "ما هي التواريخ والمهل المذكورة؟",
            "استخرج التناقضات ونقاط الضعف",
            "لخص الطلبات والدفوع الجنائية",
            "هل يوجد بطلان في الإجراءات؟"
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap transition cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Thread */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  m.sender === "user"
                    ? "bg-amber-500 text-slate-950 font-black"
                    : "bg-slate-800 text-amber-400"
                }`}
              >
                {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] p-3.5 rounded-2xl relative group ${
                  m.sender === "user"
                    ? "bg-amber-500 text-slate-950 font-bold rounded-tr-none"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[10px] opacity-70">
                  <span>{m.timestamp}</span>
                  {m.sender === "bot" && (
                    <button
                      onClick={() => handleCopy(m.id, m.text)}
                      className="hover:opacity-100 transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit text-xs text-slate-600 dark:text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span>جارٍ استقراء المستند وبناء التحليل القانوني...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="اكتب استفسارك الدقيق حول هذا المستند..."
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-amber-500 font-sans"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isLoading}
            className="p-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-2xl transition disabled:opacity-40 cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
