import React, { useState } from "react";
import { CaseRecord as Case, ClientProfile as Client } from "../types";
import { Bell, Calendar as CalendarIcon, Clock, DollarSign, CheckCircle2, MoreHorizontal, Settings, MessageSquare } from "lucide-react";

interface SmartNotificationsViewProps {
  cases: Case[];
  clients: Client[];
  language: "ar" | "en";
}

export default function SmartNotificationsView({ cases, clients, language }: SmartNotificationsViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "sessions" | "tasks" | "fees">("all");

  const notifications = [
    { id: 1, type: "session", title: "جلسة مرافعة قادمة", desc: "قضية رقم 1402/2026 - استئناف عالي", date: "2026-08-30", time: "09:00 AM", status: "pending" },
    { id: 2, type: "fee", title: "استحقاق دفعة أتعاب", desc: "القسط الثاني للقضية 3891/2025 بمبلغ 25,000 ج.م", date: "2026-08-28", time: "", status: "pending" },
    { id: 3, type: "task", title: "تجديد توكيل رسمي", desc: "توكيل رقم 450 ينتهي خلال 7 أيام", date: "2026-09-02", time: "", status: "pending" },
    { id: 4, type: "session", title: "جلسة خبراء", desc: "قضية رقم 512/2026 - معاينة عقار", date: "2026-08-26", time: "11:00 AM", status: "pending" },
  ];

  const filteredNotifs = notifications.filter(n => {
    if (activeTab === "all") return true;
    if (activeTab === "sessions") return n.type === "session";
    if (activeTab === "tasks") return n.type === "task";
    if (activeTab === "fees") return n.type === "fee";
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "session": return <CalendarIcon className="w-5 h-5 text-blue-500" />;
      case "fee": return <DollarSign className="w-5 h-5 text-emerald-500" />;
      case "task": return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleSendWhatsApp = (title: string, desc: string, date: string, time: string) => {
    const text = encodeURIComponent(`*تذكير من المكتب القضائي*\n\n📌 *${title}*\n📝 التفاصيل: ${desc}\n📅 التاريخ: ${date}\n⏱️ الوقت: ${time || 'غير محدد'}\n\nيرجى المتابعة والالتزام بالموعد.`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-2 hover:bg-blue-600 transition-colors cursor-pointer">
            <CalendarIcon className="w-4 h-4" />
            {language === "ar" ? "مزامنة مع Google Calendar" : "Sync with Google Calendar"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === "all" ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-900 shadow-md" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            {language === "ar" ? "الكل" : "All"}
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === "sessions" ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-900 shadow-md" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            {language === "ar" ? "الجلسات القادمة" : "Upcoming Sessions"}
          </button>
          <button
            onClick={() => setActiveTab("fees")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === "fees" ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-900 shadow-md" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            {language === "ar" ? "الاستحقاقات" : "Dues & Fees"}
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === "tasks" ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-900 shadow-md" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            {language === "ar" ? "المهام الإدارية" : "Admin Tasks"}
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="space-y-4">
            {filteredNotifs.map(n => (
              <div key={n.id} className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-amber-500/30 transition-colors">
                <div className="flex gap-4">
                  <div className="mt-1 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    {getIcon(n.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.desc}</p>
                    {(n.date || n.time) && (
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-400">
                        {n.date && <span>{n.date}</span>}
                        {n.time && <span>{n.time}</span>}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    title="إرسال عبر واتساب (API)" 
                    onClick={() => {
                      const msg = encodeURIComponent(`تذكير هام:\n${n.title}\n${n.desc}\nتاريخ: ${n.date} ${n.time}`);
                      window.open(`https://wa.me/?text=${msg}`, '_blank');
                    }}
                    className="p-2 text-slate-400 hover:text-green-500 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button title="إضافة للتقويم" className="p-2 text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <CalendarIcon className="w-4 h-4" />
                  </button>
                  <button title="تأجيل التنبيه" className="p-2 text-slate-400 hover:text-amber-500 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button title="تحديد كمنجز" className="p-2 text-slate-400 hover:text-emerald-500 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
