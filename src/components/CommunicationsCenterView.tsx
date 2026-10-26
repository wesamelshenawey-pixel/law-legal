import React, { useState, useEffect } from "react";
import { MessageCircle, Facebook, Phone, Search, UserPlus, Send, Settings, User, Users, Tags } from "lucide-react";
import { ClientProfile } from "../types";

interface Message {
  id: string;
  platform: "whatsapp" | "facebook";
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  direction: "inbound" | "outbound";
}

export default function CommunicationsCenterView({ clients }: { clients: ClientProfile[] }) {
  const [activePlatform, setActivePlatform] = useState<"whatsapp" | "facebook">("whatsapp");
  const [viewMode, setViewMode] = useState<"individual" | "mass">("individual");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  
  // Mass Messaging States
  const [massCategory, setMassCategory] = useState("all");
  const [massMessage, setMassMessage] = useState("");
  
  // Truecaller / Add Contact States
  const [searchNumber, setSearchNumber] = useState("");
  const [truecallerResult, setTruecallerResult] = useState<{name: string, number: string} | null>(null);

  useEffect(() => {
    // Mock load messages
    setMessages([
      { id: "1", platform: "whatsapp", senderId: "client1", senderName: "أحمد محمد", text: "السلام عليكم، هل يمكنني معرفة موعد الجلسة؟", timestamp: new Date(Date.now() - 3600000).toISOString(), direction: "inbound" },
      { id: "2", platform: "facebook", senderId: "client2", senderName: "محمود علي", text: "استفسار بخصوص توكيل", timestamp: new Date(Date.now() - 7200000).toISOString(), direction: "inbound" },
    ]);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    // In a real app, you would make an API call to your backend which calls Meta's Graph API.
    const newMsg: Message = {
      id: Date.now().toString(),
      platform: activePlatform,
      senderId: "office",
      senderName: "المكتب",
      text: newMessage,
      timestamp: new Date().toISOString(),
      direction: "outbound"
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage("");
    
    alert(`[Simulation] Message sent via ${activePlatform} API to ${selectedContact}. \n\nNote: To enable real messaging, configure your Meta Developer App, add WhatsApp/Messenger products, and set up Webhooks in your backend.`);
  };

  const handleSendMassMessage = () => {
    if (!massMessage.trim()) return;
    alert(`[Simulation] Mass Message sent to category '${massCategory}' via WhatsApp API.\n\nNote: Requires WhatsApp Business API approval for template mass messages.`);
    setMassMessage("");
  };

  const handleTruecallerSearch = () => {
    if (!searchNumber) return;
    // Truecaller search is heavily restricted and typically requires their OAuth flow or a specific partner API.
    // For demo purposes, we mock a result.
    alert(`[Simulation] Connecting to Truecaller API to fetch data for ${searchNumber}...\n\nNote: Truecaller's public API is restricted. In production, use Truecaller SDK for Business or user verification.`);
    setTruecallerResult({
      name: "مستخدم Truecaller مقترح",
      number: searchNumber
    });
  };

  const handleAddTruecallerContact = () => {
    if (truecallerResult) {
      alert(`[Simulation] Contact ${truecallerResult.name} (${truecallerResult.number}) added to your CRM clients list!`);
      setTruecallerResult(null);
      setSearchNumber("");
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-emerald-500" />
            مركز المراسلات الموحد (OmniChannel)
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-bold">
            إدارة رسائل WhatsApp و Facebook Messenger وإضافة جهات الاتصال عبر Truecaller
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition">
          <Settings className="w-4 h-4" />
          إعدادات Meta API
        </button>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setViewMode("individual")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition ${viewMode === "individual" ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"}`}
        >
          مراسلة فردية
        </button>
        <button
          onClick={() => setViewMode("mass")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition ${viewMode === "mass" ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"}`}
        >
          رسائل جماعية (WhatsApp Mass Messaging)
        </button>
      </div>

      {/* Main Grid */}
      {viewMode === "individual" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chat Interface (2 Columns) */}
        <div className="lg:col-span-2 flex flex-col h-[700px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {/* Platform Toggle Bar */}
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setActivePlatform("whatsapp")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-black transition ${activePlatform === "whatsapp" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Business
            </button>
            <button 
              onClick={() => setActivePlatform("facebook")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-black transition ${activePlatform === "facebook" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              <Facebook className="w-5 h-5" />
              Facebook Messenger
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Contact List */}
            <div className="w-1/3 border-l border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 overflow-y-auto">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <input 
                  type="text" 
                  placeholder="بحث في المحادثات..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {messages.filter(m => m.platform === activePlatform && m.direction === "inbound").map(msg => (
                  <button 
                    key={msg.id}
                    onClick={() => setSelectedContact(msg.senderId)}
                    className={`w-full text-right p-4 hover:bg-white dark:hover:bg-slate-800 transition ${selectedContact === msg.senderId ? "bg-white dark:bg-slate-800 border-r-4 border-emerald-500" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{msg.text}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 relative">
              {selectedContact ? (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.filter(m => m.platform === activePlatform && (m.senderId === selectedContact || (m.direction === "outbound" && selectedContact))).map(msg => (
                      <div key={msg.id} className={`flex flex-col ${msg.direction === "outbound" ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.direction === "outbound" ? (activePlatform === "whatsapp" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 rounded-br-sm" : "bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 rounded-br-sm") : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm"}`}>
                          <p className="text-sm">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Input Box */}
                  <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`اكتب رسالة ${activePlatform === "whatsapp" ? "واتساب" : "فيسبوك"}...`}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500"
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <button 
                        onClick={handleSendMessage}
                        className={`p-3 rounded-xl text-white transition flex items-center justify-center ${activePlatform === "whatsapp" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-500 hover:bg-blue-600"}`}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
      ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                  {activePlatform === "whatsapp" ? <MessageCircle className="w-16 h-16 opacity-20" /> : <Facebook className="w-16 h-16 opacity-20" />}
                  <p className="font-bold text-sm">اختر محادثة للبدء</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contacts & Truecaller Sidebar (1 Column) */}
        <div className="space-y-6">
          
          {/* Truecaller Widget */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">بحث وإضافة بـ Truecaller</h3>
                <p className="text-xs text-blue-100 opacity-90">استعلم عن الأرقام الجديدة</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input 
                type="tel"
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                placeholder="أدخل رقم الهاتف..."
                className="flex-1 bg-black/20 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-blue-200 outline-none focus:border-white/50 text-left"
                dir="ltr"
              />
              <button 
                onClick={handleTruecallerSearch}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-black text-sm transition"
              >
                بحث
              </button>
            </div>

            {truecallerResult && (
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4 mt-2 space-y-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{truecallerResult.name}</p>
                    <p className="text-xs text-blue-200 font-mono" dir="ltr">{truecallerResult.number}</p>
                  </div>
                </div>
                <button 
                  onClick={handleAddTruecallerContact}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  حفظ في جهات اتصال المكتب
                </button>
              </div>
            )}
          </div>

          {/* Add WhatsApp Number Manually */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
             <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-white">إضافة رقم لـ WhatsApp</h3>
                <p className="text-xs text-slate-500 font-bold">بدء محادثة واتساب جديدة</p>
              </div>
            </div>

            <div className="space-y-3">
              <input 
                type="tel"
                placeholder="+20 100 000 0000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 text-left"
                dir="ltr"
                id="wa_new_number"
              />
              <button 
                onClick={() => {
                  const num = (document.getElementById('wa_new_number') as HTMLInputElement).value;
                  if(num) window.open(`https://wa.me/${num.replace(/[^0-9]/g, '')}`, '_blank');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition border border-slate-200 dark:border-slate-700"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                فتح في تطبيق WhatsApp
              </button>
            </div>
          </div>
        </div>

        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm max-w-3xl">
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            إرسال رسالة جماعية للموكلين
          </h2>
          <p className="text-sm text-slate-500 mb-6">قم باختيار مجموعة محددة من الموكلين بناءً على تصنيف القضية لإرسال تنبيهات وتحديثات جماعية عبر WhatsApp.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">استهداف المجموعة (Group Category)</label>
              <select 
                value={massCategory}
                onChange={(e) => setMassCategory(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-bold outline-none focus:border-emerald-500"
              >
                <option value="all">جميع الموكلين (All Clients)</option>
                <option value="civil">قضايا مدنية (Civil)</option>
                <option value="criminal">قضايا جنائية (Criminal)</option>
                <option value="family">قضايا أسرة (Family)</option>
                <option value="labor">قضايا عمالية (Labor)</option>
                <option value="administrative">قضايا إدارية (Administrative)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نص الرسالة</label>
              <textarea 
                value={massMessage}
                onChange={(e) => setMassMessage(e.target.value)}
                placeholder="اكتب الرسالة التي سيتم إرسالها لجميع الموكلين في هذه المجموعة..."
                className="w-full h-40 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 resize-none outline-none focus:border-emerald-500"
              />
            </div>
            
            <button 
              onClick={handleSendMassMessage}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-500/20"
            >
              <Send className="w-5 h-5" />
              إرسال رسالة جماعية لـ {massCategory === "all" ? "جميع الموكلين" : "هذه المجموعة"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
