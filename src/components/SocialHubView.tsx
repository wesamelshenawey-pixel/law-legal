import React, { useState, useEffect } from "react";
import { TRANSLATIONS } from "../utils/translations";
import { PlatformUser, ClientProfile, UserRole } from "../types";
import { 
  PhoneCall, 
  MessageCircle, 
  Facebook, 
  MapPin, 
  Mail, 
  Send, 
  ExternalLink,
  ShieldAlert,
  Clock,
  FolderLock,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Eye,
  UserCheck,
  FileText,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Lock,
  CheckCircle,
  PlusCircle,
  Shield
} from "lucide-react";

interface SocialHubProps {
  language: "ar" | "en";
  currentUser: PlatformUser;
  clients: ClientProfile[];
  onUpdateClient: (id: string, updatedFields: Partial<ClientProfile>) => void;
}

export default function SocialHubView({ language, currentUser, clients, onUpdateClient }: SocialHubProps) {
  const t = (key: string) => TRANSLATIONS[key]?.[language] || key;
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Voice & Video Call Simulator States
  const [activeCall, setActiveCall] = useState<"none" | "voice" | "video">("none");
  const [callDuration, setCallDuration] = useState(0);
  const [callMuted, setCallMuted] = useState(false);
  const [videoDisabled, setVideoDisabled] = useState(false);
  
  // Social Account Integrations Local States
  const [linkedGoogle, setLinkedGoogle] = useState(() => currentUser.googleAccount || "wesam.elshenawey.law@gmail.com");
  const [linkedFacebook, setLinkedFacebook] = useState(() => currentUser.facebookAccount || "https://www.facebook.com/prof.wesam.elshenawy");
  const [linkedWhatsApp, setLinkedWhatsApp] = useState(() => currentUser.whatsAppAccount || "+20 1283233555");

  // Interactive Live Chat State
  const [messages, setMessages] = useState<{ sender: "user" | "office"; text: string; time: string }[]>(() => {
    const saved = localStorage.getItem(`chat_lawyer_${currentUser.phone}`);
    return saved ? JSON.parse(saved) : [
      {
        sender: "office",
        text: language === "ar" 
          ? "مرحباً بك في المحادثة المباشرة الموثقة مع ديوان الأستاذ المحامي. هنا يمكنك كتابة الاستفسارات، وسيتم الاستجابة من السكرتارية القانونية المعينة لقضيتك!"
          : "Welcome to your secure chat line with Advocate Wesam Al-Shenawey's legal staff. Post your inquiries, and the appointed legal clerks will assist you.",
        time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });
  const [textInput, setTextInput] = useState("");

  // Call duration counter ticker
  useEffect(() => {
    let timer: any;
    if (activeCall !== "none") {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  // Persist messages in local key storage
  useEffect(() => {
    localStorage.setItem(`chat_lawyer_${currentUser.phone}`, JSON.stringify(messages));
  }, [messages, currentUser.phone]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Automated Legal clerk responses for chatting scenario
  const handleSendChatMessage = () => {
    if (!textInput.trim()) return;

    const userMsg = {
      sender: "user" as const,
      text: textInput,
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    const typed = textInput;
    setTextInput("");

    // Simulate intelligent responding based on text keywords
    setTimeout(() => {
      let responseText = "";
      if (language === "ar") {
        if (typed.includes("جلس") || typed.includes("موعد")) {
          responseText = "الأستاذ وسام يتابع أجندة جلساتك بنفسه. تم جدولة جلستك القادمة وبإمكانك مراجعتها في أجندة الموكلين بملفك الشخصي.";
        } else if (typed.includes("دفع") || typed.includes("فلوس") || typed.includes("حساب") || typed.includes("أتعاب")) {
          responseText = "تسهيلاً لمعاملاتك، قمنا بتسجيل أتعابك ومقبوضات قضيتك بدقة بالقسم المالي، تفضل بمراجعة قسم المقبوضات للتأكد.";
        } else if (typed.includes("توكيل") || typed.includes("رقم")) {
          responseText = "توثيق توكيلك محرز بملف الأمان لدينا بالخارج بوزارة العدل. لا تقلق، كافة الدفاعات معتمدة.";
        } else {
          responseText = "نشكرك على رسالتك. تلقى الأستاذ المحامي والسكرتارية القانونية ملحوظتك، وسيتم اتخاذ الإجراء اللازم في جلسة المراجعة اليومية.";
        }
      } else {
        responseText = "Advocate Wesam and the staff received your input. We will verify your case folder and get back to you shortly.";
      }

      setMessages(prev => [...prev, {
        sender: "office" as const,
        text: responseText,
        time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
      }]);
    }, 1200);
  };

  const handleUpdateSocialIntegrations = () => {
    if (currentUser.role === UserRole.CLIENT && clientProfile) {
      onUpdateClient(clientProfile.id, {
        email: linkedGoogle,
        facebook: linkedFacebook,
        whatsapp: linkedWhatsApp
      });
      alert(language === "ar" 
        ? "تمت مزامنة وربط حسابات Google و WhatsApp و Facebook بنجاح وعرضها بسجلك المكتبي المعتمد!" 
        : "Google, WhatsApp, and Facebook secure accounts successfully synced with your official client dossier!");
    } else {
      alert(language === "ar"
        ? "تم حفظ وتحديث روابط الحسابات الخاصة بك محلياً بنجاح!"
        : "Your social connections profiles updated successfully!");
    }
  };

  // Find the logged in client profile
  const clientProfile = currentUser.role === UserRole.CLIENT 
    ? clients.find(c => c.whatsapp === currentUser.phone)
    : null;

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      if (clientProfile) {
        const newDoc = {
          id: "doc-" + Date.now(),
          name: file.name,
          fileBase64: base64,
          addedAt: new Date().toISOString()
        };

        const existingDocs = clientProfile.personalDocuments || [];
        onUpdateClient(clientProfile.id, {
          personalDocuments: [...existingDocs, newDoc]
        });

        alert(language === "ar" ? "تم رفع مستندك بنجاح وحفظه بمجلد القضية الآمن بالخادم!" : "Your custom document was successfully uploaded to your secure server folder!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocDelete = (docId: string) => {
    if (!clientProfile) return;
    if (!confirm(language === "ar" ? "هل تريد بالتأكيد حذف هذا المستند الرسمي من خزنتك؟" : "Confirm deleting this document entry permanently?")) return;

    const existingDocs = clientProfile.personalDocuments || [];
    onUpdateClient(clientProfile.id, {
      personalDocuments: existingDocs.filter(d => d.id !== docId)
    });
  };

  const socialLinks = [
    {
      id: "whatsapp",
      title: t("whatsapp_chat"),
      desc: language === "ar" ? "دردشة مشفرة مباشرة للاستشارات العاجلة" : "Encrypted fast-track messaging for urgent consultations.",
      color: "bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800",
      icon: <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      link: "https://wa.me/201283233555",
      badge: language === "ar" ? "رد سريع (خلال ساعة)" : "Replies within 1 hr"
    },
    {
      id: "phone",
      title: t("direct_call"),
      desc: language === "ar" ? "الاتصال الهاتفي المباشر بالأستاذ المحامي" : "Place a direct voice call to Advocate Wesam Al-Shenawey.",
      color: "bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800",
      icon: <PhoneCall className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      link: "tel:+201283233555",
      badge: language === "ar" ? "متاح للاتصالات الرسمية" : "Available During Office Hours"
    },
    {
      id: "facebook",
      title: t("facebook_page"),
      desc: language === "ar" ? "الصفحة الرسمية الموثقة لنشر مرئيات الأحكام" : "Official verified legal fanpage publishing latest court wins.",
      color: "bg-blue-50 text-blue-950 border-blue-300 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800",
      icon: <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      link: "https://www.facebook.com/prof.wesam.elshenawy",
      badge: language === "ar" ? "متابعة الأحكام اليومية" : "Daily Updates"
    },
  ];

  return (
    <div className="space-y-8 text-right font-sans" dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* Title block */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
            <FolderLock className="w-5 h-5" />
          </span>
          <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
            {language === "ar" ? "الملف الشخصي وخزنة المستندات المحمية" : "Private Profile & Secure Locker"}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{language === "ar" ? "الدعم السحابي لعام ٢٠٢٦" : "Secure Cloud Sync - 2026"}</span>
        </div>
      </div>

      {/* 2. MAIN SECURE CLIENT GALLERY & DOCUMENTS DEPOSIT */}
      {clientProfile ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs">
          
          {/* Side Profile Card Column */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-amber-500/10 rounded-full text-amber-600 dark:text-amber-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="text-right">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{clientProfile.name}</h3>
                <span className="text-[10px] text-slate-400">رقم المسلسل المكتبي: #{clientProfile.serialNumber}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-right text-slate-650 dark:text-slate-300">
              <p className="flex justify-between">
                <span className="text-slate-455">الرقم القومي:</span>
                <strong className="text-slate-900 dark:text-white font-mono">{clientProfile.nationalId}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-455">التوكيل المودع:</span>
                <strong className="text-emerald-700 dark:text-emerald-450">{clientProfile.poaNumber} {clientProfile.poaLetter} لعام {clientProfile.poaYear}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-455">مكتب التوثيق:</span>
                <span className="text-slate-800 dark:text-slate-400">{clientProfile.poaOffice}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-455">القضية الحالية:</span>
                <span className="text-blue-700 dark:text-blue-400">رقم {clientProfile.caseNumber}</span>
              </p>
              <p className="flex justify-between col-span-2">
                <span className="text-slate-455">باقي الأتعاب المعلقة:</span>
                <strong className="text-amber-600 font-extrabold">{clientProfile.remainingFees} EGP</strong>
              </p>
            </div>

            {/* Drag & Drop Click File Uploading panel */}
            <div className="border border-dashed border-amber-500/30 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100/50 dark:bg-slate-950/40 dark:hover:bg-slate-950 transition relative cursor-pointer">
              <input
                id="cabinet-file-uploader"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleDocUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-7 h-7 text-amber-500 mx-auto mb-1 animate-pulse" />
              <p className="text-[11px] font-bold text-slate-800 dark:text-amber-400">اضغط لرفع مستند أو صورة قضيتك</p>
              <p className="text-[9px] text-slate-400 mt-1">يجرى ضغطها وتشفيرها داخل خزانة المستندات فوراً</p>
            </div>
          </div>

          {/* Secure Photo Document Storage Gallery Grid */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              📂 معرض المستندات وصور القضايا الجنائية والمدنية الآمن
            </h3>

            {(!clientProfile.personalDocuments || clientProfile.personalDocuments.length === 0) ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FolderLock className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs">خزنتك فارغة حالياً. لا يمكن لأحد رؤية هذا الملف سوى إدارة المكتب وأنت فقط.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {clientProfile.personalDocuments.map((docItem) => {
                  const isImage = docItem.fileBase64.startsWith("data:image/");
                  return (
                    <div key={docItem.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col justify-between shadow-sm relative group">
                      
                      {/* Image Thumbnail Preview or fallback file icon */}
                      {isImage ? (
                        <div className="aspect-[4/3] w-full relative bg-slate-200 overflow-hidden">
                          <img 
                            src={docItem.fileBase64} 
                            alt={docItem.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-2">
                            <button
                              id={`view-doc-${docItem.id}`}
                              onClick={() => setLightboxImg(docItem.fileBase64)}
                              className="p-1.5 bg-amber-500 rounded-lg text-slate-950 font-bold hover:bg-amber-600 cursor-pointer"
                              title="عرض بالحجم الكامل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-doc-${docItem.id}`}
                              onClick={() => handleDocDelete(docItem.id)}
                              className="p-1.5 bg-red-650 rounded-lg text-white hover:bg-red-700 cursor-pointer"
                              title="حذف المستند"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[4/3] w-full flex flex-col items-center justify-center bg-amber-500/5 text-amber-600 dark:text-amber-400 p-4 text-center">
                          <FileText className="w-8 h-8 mb-1" />
                          <span className="text-[10px] truncate max-w-full font-mono">{docItem.name}</span>
                        </div>
                      )}

                      {/* File Card Title block */}
                      <div className="p-2 border-t border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 text-right space-y-0.5">
                        <p className="font-extrabold truncate text-slate-800 dark:text-slate-200" title={docItem.name}>{docItem.name}</p>
                        <p className="text-[9px] text-slate-400 font-sans">{new Date(docItem.addedAt).toLocaleDateString("ar-EG")}</p>
                      </div>

                      {/* Fallback actions if touch device where hover actions don't display well */}
                      <div className="flex md:hidden border-t border-slate-100 dark:border-slate-800 p-1 justify-between bg-slate-50 dark:bg-slate-900 text-xs">
                        <button
                          id={`view-touch-${docItem.id}`}
                          onClick={() => isImage && setLightboxImg(docItem.fileBase64)}
                          className="px-2 py-0.5 bg-amber-500/10 text-amber-700 hover:bg-amber-550 rounded font-bold cursor-pointer"
                        >
                          تصفح
                        </button>
                        <button
                          id={`delete-touch-${docItem.id}`}
                          onClick={() => handleDocDelete(docItem.id)}
                          className="px-2 py-0.5 bg-red-600/10 text-red-650 rounded font-bold cursor-pointer"
                        >
                          حذف
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      ) : null}

      {/* 3. COMPACT CONTACT HUBS GRID (3 Cards in one row side-by-side) */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-amber-500 flex items-center gap-1.5 justify-start">
          <MessageCircle className="w-4 h-4 text-amber-500" />
          {language === "ar" ? "قنوات التواصل السريع المفتوحة مع الأستاذ وسام" : "Fast-Track Channels with Office clerks"}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-xs text-right">
          {socialLinks.map((item) => (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[140px] dark:bg-slate-950 dark:border-slate-800 dark:hover:border-slate-700 shadow-sm ${item.color}`}
            >
              <div>
                <div className="flex justify-between items-center gap-2">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-xs">
                    {item.icon}
                  </div>
                  <span className="text-[9px] font-black tracking-tight px-2 py-0.5 bg-white/90 dark:bg-slate-900/90 rounded-full border border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-sans">
                    {item.badge}
                  </span>
                </div>

                <div className="mt-2.5 space-y-1 text-right">
                  <h4 className={`text-xs font-black flex items-center gap-1 justify-start ${language === "ar" ? "text-right" : "text-left"}`}>
                    {item.title}
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </h4>
                  <p className={`text-[10.5px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2 ${language === "ar" ? "text-right" : "text-left"}`}>
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className={`mt-2.5 border-t border-slate-200/50 dark:border-slate-800/80 pt-2 text-[9.5px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1 ${language === "ar" ? "justify-start" : "justify-end"}`}>
                <span>{language === "ar" ? "اضغط لفتح الملحق الرقمي الآمن" : "Click to launch secure channel"} &rarr;</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 📞 INTEGRATED VOICE, VIDEO & CHAT COMMUNICATION HUB */}
      <h3 className="text-sm font-extrabold text-slate-900 dark:text-amber-500 flex items-center gap-1.5 justify-start">
        <PhoneCall className="w-4 h-4 text-amber-500" />
        {language === "ar" ? "ديوان الاستدعاء وغرفة الاتصال المرئي والكتابي الآمن" : "Secure Digital Caller & Interactive Chat Portal"}
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Calling and Account linkage controls (1/3 width) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="text-right">
            <h4 className="text-xs font-black text-slate-800 dark:text-amber-500 uppercase tracking-wider mb-1">🔗 ربط ومزامنة حساباتك الرقمية</h4>
            <p className="text-[10px] text-slate-500 leading-normal">اربط حسابات Google، WhatsApp، و Facebook الخاصة بك لتأكيد هويتك واستلام الإشعارات والدعوات التلقائية.</p>
          </div>

          <div className="space-y-3.5 text-right text-xs">
            {/* Google Account input */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300">أولاً: بريد Google المتلقي للإشعارات:</label>
              <div className="relative">
                <input
                  type="email"
                  value={linkedGoogle}
                  onChange={(e) => setLinkedGoogle(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-left text-xs outline-none focus:border-amber-500 font-sans"
                />
                <span className="absolute right-2.5 top-2.5 text-slate-400 font-bold font-sans">G</span>
              </div>
            </div>

            {/* WhatsApp account phone */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300">ثانياً: هاتف WhatsApp لرسائل التذكير:</label>
              <div className="relative">
                <input
                  type="text"
                  value={linkedWhatsApp}
                  onChange={(e) => setLinkedWhatsApp(e.target.value)}
                  placeholder="+20 128 323 3555"
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-left text-xs outline-none focus:border-amber-500 font-sans"
                />
                <span className="absolute right-2.5 top-2 ml-1 text-emerald-600 block">💬</span>
              </div>
            </div>

            {/* Facebook account identity */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300">ثالثاً: رابط الهوية على Facebook:</label>
              <div className="relative">
                <input
                  type="text"
                  value={linkedFacebook}
                  onChange={(e) => setLinkedFacebook(e.target.value)}
                  placeholder="facebook.com/username"
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-left text-xs outline-none focus:border-amber-500 font-sans"
                />
                <span className="absolute right-2.5 top-2.5 text-blue-600 block"><Facebook className="w-3.5 h-3.5" /></span>
              </div>
            </div>

            <button
              onClick={handleUpdateSocialIntegrations}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg transition text-[11px] cursor-pointer shadow-sm"
            >
              🔄 حفظ وتأكيد هويتي الاجتماعية
            </button>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-amber-500 text-right">📶 بوابة مكالمات الطوارئ الافتراضية</h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <button
                onClick={() => setActiveCall("voice")}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300 rounded-xl transition duration-150 flex flex-col items-center justify-center gap-1 font-bold shadow-sm cursor-pointer"
              >
                <PhoneCall className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px]">اتصال صوتي مؤمن</span>
              </button>

              <button
                onClick={() => setActiveCall("video")}
                className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-250 text-blue-950 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300 rounded-xl transition duration-150 flex flex-col items-center justify-center gap-1 font-bold shadow-sm cursor-pointer"
              >
                <Video className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span className="text-[10px]">اتصال مرئي HD</span>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 leading-normal text-right">💡 ميزة مكالمات الصوت والفيديو تعمل ببروتوكول Peer-To-Peer آمن لتشفير محادثات المحقق والموكل.</p>
          </div>
        </div>

        {/* Real-time Interactive Text Chat Console (2/3 width) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between h-[380px] text-right">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 justify-start">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-xs font-black text-slate-900 dark:text-white">المكتب الرئيسي للأستاذ المحامي (نشط الآن)</span>
            </div>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-850 rounded text-[9px] text-slate-500 font-mono">2026-06-08</span>
          </div>

          {/* Messages list container */}
          <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-3 max-h-[220px]">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === "user" 
                    ? "bg-slate-900 text-white rounded-tr-none mr-auto text-left" 
                    : "bg-slate-50 text-slate-800 border border-slate-200/70 rounded-tl-none ml-auto text-right dark:bg-slate-950 dark:border-slate-850 dark:text-slate-300"
                }`}
              >
                <p className="font-medium whitespace-pre-line">{msg.text}</p>
                <span className="text-[8px] text-slate-400 mt-1 block font-sans text-right">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Typing Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
              placeholder="اكتب استشارتك أو رسالتك وسيرد عليك ممثل السكرتارية القانونية فوراً..."
              className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-amber-500"
            />
            <button
              onClick={handleSendChatMessage}
              disabled={!textInput.trim()}
              className="p-2 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 hover:scale-105 disabled:opacity-50 disabled:scale-100 rounded-xl transition duration-150 cursor-pointer shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

      {/* FULLSCREEN POPUP CALL IN PROGRESS OVERLAY */}
      {activeCall !== "none" && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-8 max-w-sm w-full text-center space-y-6 animate-scale-up shadow-2xl">
            {/* Visual Call Header */}
            <div className="space-y-2">
              <div className="relative mx-auto w-24 h-24 rounded-full overflow-hidden border-4 border-amber-500 animate-pulse bg-slate-850 flex items-center justify-center">
                <span className="text-3xl font-extrabold text-amber-500">⚖️</span>
              </div>
              <h3 className="text-lg font-black text-amber-500">مكتب المستشار المحامي</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                {activeCall === "video" ? "اتصال مرئي مشفر HD" : "اتصال صوتي عالي النقاء والأمان"}
              </p>
            </div>

            {/* Video Face simulation screen or Sound Waves simulation */}
            {activeCall === "video" && !videoDisabled ? (
              <div className="aspect-video w-full rounded-2xl bg-black border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2.5 text-right text-[10px]">
                  <p className="text-white font-bold">بث حي لغرفة الاستشارة الجنائية</p>
                  <p className="text-emerald-400">✔️ جودة الإرسال ممتازة (1080p)</p>
                </div>
                {/* Simulated Camera placeholder displaying active avatar */}
                <div className="text-center space-y-1 animate-pulse">
                  <Video className="w-8 h-8 text-amber-500 mx-auto" />
                  <span className="text-[10px] text-slate-500 font-mono">Wesam Al-Shenawey HD</span>
                </div>
              </div>
            ) : (
              <div className="h-20 w-full flex items-center justify-center gap-1 bg-slate-950 rounded-2xl border border-slate-800 px-4">
                {/* Simulated dynamic voice waveforms */}
                {!callMuted ? (
                  <div className="flex items-end gap-1 h-12">
                    <span className="w-1.5 bg-amber-500 rounded animate-pulse h-10"></span>
                    <span className="w-1.5 bg-amber-500 rounded animate-pulse h-6"></span>
                    <span className="w-1.5 bg-amber-500 rounded animate-pulse h-12"></span>
                    <span className="w-1.5 bg-amber-500 rounded animate-pulse h-8"></span>
                    <span className="w-1.5 bg-amber-500 rounded animate-pulse h-11"></span>
                    <span className="w-1.5 bg-amber-500 rounded animate-pulse h-5"></span>
                    <span className="w-1.5 bg-amber-500 rounded animate-pulse h-9"></span>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 font-bold">📢 تم كتم كارت الصوت والميكروفون</p>
                )}
              </div>
            )}

            {/* Counter */}
            <div className="space-y-1 text-center font-mono">
              <p className="text-lg font-black text-white">{formatDuration(callDuration)}</p>
              <p className="text-[9px] text-emerald-400 font-bold tracking-widest flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                قيد التشفير العسكري AES-256
              </p>
            </div>

            {/* Controls */}
            <div className="flex gap-4 items-center justify-center pt-2">
              <button
                type="button"
                onClick={() => setCallMuted(!callMuted)}
                className={`p-3.5 rounded-full transition cursor-pointer flex items-center justify-center ${
                  callMuted ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="كتم الصوت / إلغاء الكتم"
              >
                {callMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {activeCall === "video" && (
                <button
                  type="button"
                  onClick={() => setVideoDisabled(!videoDisabled)}
                  className={`p-3.5 rounded-full transition cursor-pointer flex items-center justify-center ${
                    videoDisabled ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  title="إيقاف المقطع / تشغيل"
                >
                  {videoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveCall("none")}
                className="p-4 bg-red-600 hover:bg-red-750 text-white rounded-full transition cursor-pointer shadow-lg float-left animate-pulse flex items-center justify-center"
                title="قطع وإغلاق المكالمة"
              >
                <PhoneOff className="w-6 h-6 animate-pulse" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Accreditation */}
      <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-4 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
        <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-full">
          <ShieldAlert className="w-8 h-8 text-amber-500" />
        </div>
        <div className="text-right space-y-1">
          <p className="text-sm font-black text-slate-900 dark:text-amber-500">
            {language === "ar" ? "حماية وخصوصية الموكل والخدمة" : "Evidentiary Privacy & Shield"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
            {language === "ar" ? 
              "الروابط وسجلات المجموعات تدار مباشرة بواسطة الأستاذ وسام، وهي مشفرة بالكامل طبقاً لمعايير نقابة المحامين وأمن الاتصال الرقمي بمصر لعام ٢٠٢٦." : 
              "All communication routing is managed directly by Attorney Wesam, completely encrypted as regulated by the Egyptian Bar Syndicate."}
          </p>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX POPUP MODAL */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button 
              id="close-lightbox"
              onClick={() => setLightboxImg(null)}
              className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-full w-8 h-8 flex items-center justify-center shadow-lg text-lg cursor-pointer transition"
            >
              ×
            </button>
            <img 
              src={lightboxImg} 
              alt="Lightbox Full Preview" 
              className="max-w-full max-h-[80vh] object-contain rounded-xl border border-slate-850 shadow-2xl bg-slate-900/40"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

    </div>
  );
}
