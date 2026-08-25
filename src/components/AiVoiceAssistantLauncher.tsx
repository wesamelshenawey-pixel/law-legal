import React, { useState } from 'react';
import { Mic, Sparkles, X, ChevronUp, FileText, BrainCircuit } from 'lucide-react';

interface AiVoiceAssistantLauncherProps {
  onOpenAiAssistant: () => void;
  onOpenLegalAnalysis: () => void;
  onOpenSmartOcr: () => void;
  language: "ar" | "en";
}

export default function AiVoiceAssistantLauncher({ onOpenAiAssistant, onOpenLegalAnalysis, onOpenSmartOcr, language }: AiVoiceAssistantLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const toggleListen = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        onOpenAiAssistant();
        setIsOpen(false);
      }, 2000);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans" dir={language === "ar" ? "rtl" : "ltr"}>
      {isOpen && (
        <div className="absolute bottom-16 left-0 mb-4 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-bold">{t("المساعدين الصوتيين والذكاء الاصطناعي", "AI & Voice Assistants")}</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-2 flex flex-col gap-1">
            <button
              onClick={toggleListen}
              className={`flex items-center gap-3 p-3 w-full text-right rounded-xl transition-all ${isListening ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
            >
              <div className={`p-2 rounded-full ${isListening ? "bg-red-100 dark:bg-red-900/50 animate-pulse" : "bg-slate-100 dark:bg-slate-800"}`}>
                <Mic className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">{isListening ? t("جاري الاستماع...", "Listening...") : t("التحدث للمستشار الصوتي", "Talk to Voice Assistant")}</span>
                <span className="text-xs opacity-70">{t("انقر للتحدث المباشر", "Tap to speak directly")}</span>
              </div>
            </button>

            <button
              onClick={() => { onOpenAiAssistant(); setIsOpen(false); }}
              className="flex items-center gap-3 p-3 w-full text-right rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all"
            >
              <div className="p-2 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">{t("المستشار الذكي (شات)", "AI Legal Assistant (Chat)")}</span>
              </div>
            </button>

            <button
              onClick={() => { onOpenLegalAnalysis(); setIsOpen(false); }}
              className="flex items-center gap-3 p-3 w-full text-right rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all"
            >
              <div className="p-2 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">{t("محلل المستندات والثغرات", "Document & Flaw Analyzer")}</span>
              </div>
            </button>
            
          </div>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${isOpen ? "bg-slate-800 text-white" : "bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950"}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>
    </div>
  );
}
