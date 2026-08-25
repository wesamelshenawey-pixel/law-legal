import React, { useState, useMemo } from "react";
import { 
  SessionRecord, 
  UserRole, 
  PlatformUser, 
  CaseRecord, 
  ClientProfile,
  FeeTransfer
} from "../types";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  PlusCircle, 
  CheckCircle, 
  ListFilter, 
  AlertTriangle, 
  Printer, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  FileText, 
  DollarSign, 
  ShieldAlert, 
  ClipboardList, 
  CheckSquare, 
  ArrowUpRight, 
  Sparkles, 
  X, 
  Send,
  Download,
  AlertCircle
} from "lucide-react";

export interface AdministrativeTask {
  id: string;
  title: string;
  court: string;
  assignedTo: string;
  deadline: string;
  priority: "high" | "normal" | "urgent";
  status: "pending" | "in_progress" | "completed";
  notes?: string;
  createdAt: string;
}

export interface PoliceReportItem {
  id: string;
  reportNumber: string;
  station: string;
  prosecutionOffice: string;
  clientName: string;
  opponentName: string;
  subject: string;
  followUpDate: string;
  status: "waiting_prosecution" | "in_investigation" | "referred_to_court" | "closed";
  notes?: string;
  createdAt: string;
}

interface SessionsViewProps {
  sessions: SessionRecord[];
  onUpdateSessionStatus: (id: string, nextDate: string, adjournmentReason: string) => void;
  currentUser: PlatformUser;
  cases?: CaseRecord[];
  clients?: ClientProfile[];
  fees?: FeeTransfer[];
  onAddFeePayment?: (fee: FeeTransfer) => void;
  onAddSession?: (newSession: SessionRecord) => void;
}

export default function SessionsView({ 
  sessions, 
  onUpdateSessionStatus, 
  currentUser,
  cases = [],
  clients = [],
  fees = [],
  onAddFeePayment,
  onAddSession
}: SessionsViewProps) {
  // View mode switcher
  const [activeTab, setActiveTab] = useState<"calendar" | "agenda" | "dashboard" | "admin_tasks" | "police_records">("calendar");

  // Selected Session for Details / Postponement Modal
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "morning" | "evening">("all");
  const [courtFilter, setCourtFilter] = useState<string>("all");

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 5, 1)); // Default June 2026

  // Postponement Modal Fields
  const [nextDate, setNextDate] = useState("2026-07-15");
  const [adjournmentReason, setAdjournmentReason] = useState("");

  // Quick Print Modal State
  const [showQuickPrintModal, setShowQuickPrintModal] = useState(false);
  const [quickPrintDateFilter, setQuickPrintDateFilter] = useState<"today" | "tomorrow" | "all" | "custom">("today");
  const [quickPrintCustomDate, setQuickPrintCustomDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [quickPrintCourtFilter, setQuickPrintCourtFilter] = useState<string>("all");

  // Add Session Modal
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newCaseYear, setNewCaseYear] = useState(2026);
  const [newCourt, setNewCourt] = useState("محكمة استئناف المنصورة");
  const [newCircuit, setNewCircuit] = useState("الدائرة الثالثة مدني");
  const [newClientName, setNewClientName] = useState("");
  const [newOpponentName, setNewOpponentName] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newSessionDate, setNewSessionDate] = useState("2026-06-20");
  const [newTimeType, setNewTimeType] = useState<"morning" | "evening">("morning");
  const [newRequiredWork, setNewRequiredWork] = useState("");

  // Administrative tasks state
  const [adminTasks, setAdminTasks] = useState<AdministrativeTask[]>(() => {
    const saved = localStorage.getItem("law_admin_tasks_list");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "adm-1",
        title: "استخراج شهادة رسمية من الجدول برقم الدعوى",
        court: "محكمة شبين الكوم الكلية",
        assignedTo: "الأستاذ سعد الدين هلال",
        deadline: "2026-06-18",
        priority: "urgent",
        status: "pending",
        notes: "ضرورية لتقديمها في جلسة الخبير السبت القادم",
        createdAt: "2026-06-01"
      },
      {
        id: "adm-2",
        title: "سداد أمانة الخبير القضائي في خزينة المحكمة",
        court: "محكمة جنوب القاهرة الابتدائية",
        assignedTo: "الأستاذ المحامي",
        deadline: "2026-06-22",
        priority: "high",
        status: "in_progress",
        notes: "مبلغ 3000 جنيه خزينة الدائرة",
        createdAt: "2026-06-02"
      },
      {
        id: "adm-3",
        title: "إعلان الخصم بالصيغة التنفيذية وقرار الإلزام",
        court: "قلم محضري محكمة الدقي",
        assignedTo: "محامي الجدول",
        deadline: "2026-06-25",
        priority: "normal",
        status: "pending",
        notes: "تسليم أصل الصيغة التنفيذية لمحضرين الدقي",
        createdAt: "2026-06-03"
      }
    ];
  });

  // Police reports state
  const [policeReports, setPoliceReports] = useState<PoliceReportItem[]>(() => {
    const saved = localStorage.getItem("law_police_reports_list");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "pr-1",
        reportNumber: "4125 / 2026 جنح أول المنصورة",
        station: "قسم شرطة أول المنصورة",
        prosecutionOffice: "نيابة قسم أول المنصورة الجزئية",
        clientName: "أحمد محمد محمود عبد العال",
        opponentName: "سامي عادل الخولي",
        subject: "محضر جنحة تبديد إيصال أمانة بمبلغ 450,000 جنيه",
        followUpDate: "2026-06-19",
        status: "waiting_prosecution",
        notes: "تم ورود تحريات المباحث بانتظار تصرف السيد وكيل النيابة",
        createdAt: "2026-06-01"
      },
      {
        id: "pr-2",
        reportNumber: "8920 / 2026 إداري الدقي",
        station: "قسم شرطة الدقي",
        prosecutionOffice: "نيابة الدقي الكلية",
        clientName: "فاطمة الزهراء إبراهيم حسن",
        opponentName: "شركة الفرسان للاستثمار",
        subject: "شكوى نزاع ملكية ووضع يد على مقر تجاري",
        followUpDate: "2026-06-23",
        status: "in_investigation",
        notes: "ميعاد سماع شهود الإثبات ومعاينة محل النزاع",
        createdAt: "2026-06-02"
      }
    ];
  });

  // Save tasks and police reports
  const saveTasks = (tasks: AdministrativeTask[]) => {
    setAdminTasks(tasks);
    localStorage.setItem("law_admin_tasks_list", JSON.stringify(tasks));
  };

  const saveReports = (reports: PoliceReportItem[]) => {
    setPoliceReports(reports);
    localStorage.setItem("law_police_reports_list", JSON.stringify(reports));
  };

  // New Admin Task Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCourt, setTaskCourt] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("الأستاذ المحامي");
  const [taskDeadline, setTaskDeadline] = useState("2026-06-25");
  const [taskPriority, setTaskPriority] = useState<"high" | "normal" | "urgent">("high");
  const [taskNotes, setTaskNotes] = useState("");

  // New Police Report Modal State
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [repNumber, setRepNumber] = useState("");
  const [repStation, setRepStation] = useState("");
  const [repPros, setRepPros] = useState("");
  const [repClient, setRepClient] = useState("");
  const [repOpponent, setRepOpponent] = useState("");
  const [repSubject, setRepSubject] = useState("");
  const [repDate, setRepDate] = useState("2026-06-25");

  // Collect distinct courts
  const courtsList = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach(s => {
      if (s.caseInfo?.competentCourt) set.add(s.caseInfo.competentCourt);
    });
    return Array.from(set);
  }, [sessions]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      // Time filter
      if (timeFilter !== "all" && s.timeType !== timeFilter) return false;
      // Court filter
      if (courtFilter !== "all" && s.caseInfo?.competentCourt !== courtFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          s.caseInfo?.caseNumber?.toLowerCase().includes(q) ||
          s.caseInfo?.clientName?.toLowerCase().includes(q) ||
          s.caseInfo?.opponentName?.toLowerCase().includes(q) ||
          s.caseInfo?.competentCourt?.toLowerCase().includes(q) ||
          s.caseInfo?.subject?.toLowerCase().includes(q) ||
          s.caseInfo?.circuit?.toLowerCase().includes(q) ||
          s.date?.includes(q) ||
          s.decision?.toLowerCase().includes(q) ||
          s.requiredWork?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions, timeFilter, courtFilter, searchQuery]);

  // Calendar Calculation Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday
  // Convert to Saturday start (Saturday = 0, Sunday = 1, ... Friday = 6)
  const saturdayStartOffset = (firstDayIndex + 1) % 7;
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

  const calendarGrid = useMemo(() => {
    const days = [];
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(i).padStart(2, "0");
      const dateKey = `${year}-${monthStr}-${dayStr}`;
      const daySessions = sessions.filter(s => s.date === dateKey);
      days.push({
        dayNum: i,
        dateStr: dateKey,
        sessions: daySessions
      });
    }
    return days;
  }, [year, month, daysInCurrentMonth, sessions]);

  // Upcoming Alert Calculations
  const upcomingTodayAndTomorrow = useMemo(() => {
    const todayStr = "2026-06-15"; // Baseline simulation
    const tomorrowStr = "2026-06-16";
    const thisWeekEndStr = "2026-06-22";

    const todaySessions = sessions.filter(s => s.date === todayStr);
    const tomorrowSessions = sessions.filter(s => s.date === tomorrowStr);
    const thisWeekSessions = sessions.filter(s => s.date >= todayStr && s.date <= thisWeekEndStr);

    return {
      today: todaySessions,
      tomorrow: tomorrowSessions,
      thisWeek: thisWeekSessions
    };
  }, [sessions]);

  // Upcoming Due Fees
  const upcomingFeesDue = useMemo(() => {
    return clients
      .filter(c => (c.remainingFees || 0) > 0)
      .map(c => ({
        clientId: c.id,
        clientName: c.name,
        phone: c.phone || "",
        caseNumber: c.caseNumber || "قضية معتمدة",
        remainingFees: c.remainingFees,
        dueDate: "2026-06-20",
        court: c.competentCourt || "المحكمة المختصة"
      }))
      .slice(0, 5);
  }, [clients]);

  // Handle Postponement Submit
  const handleUpdateSubmit = (id: string) => {
    if (!adjournmentReason) {
      alert("الرجاء إدخال سبب التأجيل أو القرار المتخذ بالجلسة.");
      return;
    }
    onUpdateSessionStatus(id, nextDate, adjournmentReason);
    setSelectedSession(null);
    setAdjournmentReason("");
  };

  // Handle Quick Add Session
  const handleAddSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber || !newClientName || !newSessionDate) {
      alert("يرجى تعبئة الحقول الإلزامية رقم القضية، اسم الموكل، وتاريخ الجلسة.");
      return;
    }

    const newSess: SessionRecord = {
      id: "sess-" + Date.now(),
      caseId: "case-manual-" + Date.now(),
      date: newSessionDate,
      timeType: newTimeType,
      caseInfo: {
        caseNumber: newCaseNumber,
        caseYear: newCaseYear,
        competentCourt: newCourt,
        subject: newSubject || "متابعة قضائية",
        clientName: newClientName,
        opponentName: newOpponentName || "ضد مجهول / خصم",
        circuit: newCircuit
      },
      requiredWork: newRequiredWork || "حضور الجلسة وتقديم المستندات والمرافعة",
      status: "pending"
    };

    if (onAddSession) {
      onAddSession(newSess);
    } else {
      sessions.unshift(newSess);
    }

    setShowAddSessionModal(false);
    // Reset form
    setNewCaseNumber("");
    setNewClientName("");
    setNewOpponentName("");
    setNewSubject("");
    setNewRequiredWork("");
    alert("تمت جدولة الجلسة بنجاح في الأجندة والتقويم القضائي.");
  };

  // Print Court Docket
  const handlePrintDocket = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & UNIFIED VIEW CONTROLS                                    */}
      {/* ========================================================================= */}
      <div className="flex justify-end items-center gap-4 mb-4">

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            id="btn-quick-print-today"
            onClick={() => {
              setQuickPrintDateFilter("today");
              setShowQuickPrintModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl text-xs font-black shadow-md transition cursor-pointer"
            title="طباعة فورية وسريعة لكشف ورول جلسات اليوم مع كافة تفاصيل القضايا"
          >
            <Printer className="w-4 h-4 text-emerald-200" />
            <span>طباعة سريعة لجلسات اليوم (Quick Print)</span>
          </button>

          <button
            onClick={() => setShowAddSessionModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-xs font-black shadow-sm transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة جلسة جديدة</span>
          </button>

          <button
            onClick={handlePrintDocket}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700"
            title="طباعة رول الجلسات والأجندة"
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">طباعة الأجندة</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION TABS (Calendar / Agenda / Alerts Dashboard / Admin / Police) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeTab === "calendar"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>التقويم الشهري التفاعلي</span>
        </button>

        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeTab === "dashboard"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>لوحة التنبيهات والمتابعة الشاملة</span>
          {upcomingTodayAndTomorrow.today.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("agenda")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeTab === "agenda"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>سرود وأجندة الجلسات اليومية ({filteredSessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("admin_tasks")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeTab === "admin_tasks"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>الأعمال والطلبات الإدارية ({adminTasks.filter(t => t.status !== "completed").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("police_records")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeTab === "police_records"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>المحاضر والشكاوى ({policeReports.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: INTERACTIVE MONTHLY CALENDAR VIEW                               */}
      {/* ========================================================================= */}
      {activeTab === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Monthly Calendar Box */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
            
            {/* Month / Year Navigator */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  title="الشهر السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  {monthNames[month]} {year} م
                </h3>

                <button
                  onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  title="الشهر القادم"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  أيام بها جلسات
                </span>
                <button
                  onClick={() => setCurrentDate(new Date(2026, 5, 1))}
                  className="text-xs text-slate-500 hover:text-amber-600 font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  اليوم
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((w, index) => (
                <div key={index} className="py-2.5 font-black text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                  {w}
                </div>
              ))}

              {/* Leading Empty Offset Days */}
              {Array.from({ length: saturdayStartOffset }).map((_, i) => (
                <div key={`offset-${i}`} className="min-h-16 py-2 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl border border-dashed border-slate-200/50 dark:border-slate-800/40" />
              ))}

              {/* Active Calendar Days */}
              {calendarGrid.map((d) => {
                const hasSessions = d.sessions.length > 0;
                const isSelected = selectedSession && selectedSession.date === d.dateStr;

                return (
                  <div
                    key={d.dayNum}
                    onClick={() => {
                      if (hasSessions) {
                        setSelectedSession(d.sessions[0]);
                      }
                    }}
                    className={`min-h-18 p-2 rounded-2xl flex flex-col justify-between items-center transition-all relative cursor-pointer outline-none border ${
                      hasSessions
                        ? "bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500 text-amber-950 dark:text-amber-200 font-black shadow-xs hover:scale-102 hover:shadow-md"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    } ${isSelected ? "ring-2 ring-amber-600 ring-offset-2" : ""}`}
                  >
                    <span className="text-sm font-mono font-black">{d.dayNum}</span>
                    
                    {hasSessions && (
                      <div className="w-full text-center space-y-0.5 mt-1">
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black block truncate">
                          {d.sessions.length} {d.sessions.length === 1 ? "جلسة" : "جلسات"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Panel: Chronological Session Details & Docket Actions */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm flex flex-col justify-between">

              {/* Time Filters */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 mt-3">
                <button
                  onClick={() => setTimeFilter("all")}
                  className={`flex-1 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                    timeFilter === "all" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setTimeFilter("morning")}
                  className={`flex-1 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                    timeFilter === "morning" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  صباحية (٩ ص)
                </button>
                <button
                  onClick={() => setTimeFilter("evening")}
                  className={`flex-1 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                    timeFilter === "evening" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  مسائية (١٢ م)
                </button>
              </div>

              {/* Sessions List Scroll */}
              <div className="space-y-3 mt-4 max-h-[420px] overflow-y-auto pl-1">
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-10 space-y-2 text-slate-400">
                    <CalendarIcon className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">لا يوجد جلسات مجدولة وفقاً لهذا الاختيار.</p>
                  </div>
                ) : (
                  filteredSessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSession(s)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 text-right ${
                        selectedSession?.id === s.id
                          ? "bg-amber-500/10 border-amber-500 shadow-md"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-400"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[11px]">
                        <span className={`px-2 py-0.5 rounded-lg font-black ${
                          s.timeType === "morning" ? "bg-emerald-100 text-emerald-900 border border-emerald-200" : "bg-blue-100 text-blue-900 border border-blue-200"
                        }`}>
                          {s.timeType === "morning" ? "صباحي ٩ ص" : "مسائي ١٢ م"}
                        </span>
                        <span className="text-amber-800 dark:text-amber-400 font-mono font-black">{s.date}</span>
                      </div>


                      <div className="text-[11px] flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="font-bold text-amber-700 dark:text-amber-400 truncate max-w-[140px]">
                          الموكل: {s.caseInfo.clientName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {s.status === "done" ? "تم الفصل" : s.status === "adjourned" ? "مؤجلة" : "قيد الانتظار"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowAddSessionModal(true)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إدراج جلسة جديدة بالرول</span>
              </button>
            </div>

          </div>

      )}

      {/* ========================================================================= */}
      {/* 4. TAB 2: UNIFIED DASHBOARD PANEL (Upcoming Sessions, Admin, Police, Fees)*/}
      {/* ========================================================================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          
          {/* 4 Cards Grid Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Today & Tomorrow Sessions */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                  <CalendarIcon className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-black">
                  {upcomingTodayAndTomorrow.today.length + upcomingTodayAndTomorrow.tomorrow.length} جلسة عاجلة
                </span>
              </div>
            </div>

            {/* Card 2: Administrative Tasks */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="p-2 bg-indigo-500 text-white rounded-xl font-bold">
                  <ClipboardList className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-xs font-black">
                  {adminTasks.filter(t => t.status !== "completed").length} مهام نشطة
                </span>
              </div>
            </div>

            {/* Card 3: Police Reports */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="p-2 bg-red-500 text-white rounded-xl font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-800 dark:text-red-300 text-xs font-black">
                  {policeReports.length} محضر قيد المتابعة
                </span>
              </div>
            </div>

            {/* Card 4: Upcoming Due Fees */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="p-2 bg-emerald-500 text-white rounded-xl font-bold">
                  <DollarSign className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                  {upcomingFeesDue.length} موكل بمستحقات
                </span>
              </div>
            </div>

          </div>

          {/* Detailed 4-Section Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SECTION 1: UPCOMING COURT SESSIONS WIDGET */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  تنبيهات الجلسات القريبة العاجلة
                </h3>
                <button
                  onClick={() => setActiveTab("agenda")}
                  className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  عرض كامل الأجندة ←
                </button>
              </div>

              <div className="space-y-3">
                {upcomingTodayAndTomorrow.thisWeek.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">لا يوجد جلسات خلال هذا الأسبوع.</p>
                ) : (
                  upcomingTodayAndTomorrow.thisWeek.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                            {s.date}
                          </span>
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                            قضية {s.caseInfo.caseNumber}/{s.caseInfo.caseYear}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {s.caseInfo.competentCourt} | الموكل: <strong className="text-slate-800 dark:text-slate-200">{s.caseInfo.clientName}</strong>
                        </p>
                        {s.requiredWork && (
                          <p className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold">
                            العمل المطلوب: {s.requiredWork}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setSelectedSession(s)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-xs transition"
                        >
                          تأجيل / قرار
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECTION 2: REQUIRED ADMINISTRATIVE TASKS WIDGET */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-indigo-500" />
                  الأعمال والطلبات الإدارية بالمحاكم
                </h3>
                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold border border-indigo-200"
                >
                  + مهمة جديدة
                </button>
              </div>

              <div className="space-y-3">
                {adminTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-start gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          t.priority === "urgent" ? "bg-red-100 text-red-800" : "bg-indigo-100 text-indigo-800"
                        }`}>
                          {t.priority === "urgent" ? "عاجل جداً" : "مهم"}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{t.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {t.court} | المسؤول: {t.assignedTo} | موعد الإنجاز: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{t.deadline}</span>
                      </p>
                      {t.notes && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          {t.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const updated = adminTasks.map(task => 
                          task.id === t.id ? { ...task, status: task.status === "completed" ? "pending" : "completed" } : task
                        );
                        saveTasks(updated as AdministrativeTask[]);
                      }}
                      className={`p-1.5 rounded-xl border transition ${
                        t.status === "completed" 
                          ? "bg-emerald-500 text-white border-emerald-600" 
                          : "bg-white dark:bg-slate-900 text-slate-400 border-slate-300 hover:text-emerald-500"
                      }`}
                      title={t.status === "completed" ? "تم الإنجاز" : "تحديد كمكتمل"}
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: POLICE REPORTS & COMPLAINTS WIDGET */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  المحاضر والشكاوى المطلوب متابعتها
                </h3>
                <button
                  onClick={() => setShowAddReportModal(true)}
                  className="text-xs px-2.5 py-1 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg font-bold border border-red-200"
                >
                  + محضر جديد
                </button>
              </div>

              <div className="space-y-3">
                {policeReports.map((pr) => (
                  <div
                    key={pr.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-red-700 dark:text-red-400">
                        {pr.reportNumber}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        {pr.station}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {pr.subject}
                    </p>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <span>الشاكي: {pr.clientName}</span>
                      <span className="font-mono text-red-600 font-bold">المتابعة: {pr.followUpDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 4: UPCOMING DUE FEES WIDGET */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  الأتعاب والمستحقات القريبة للدعاوي
                </h3>
                <span className="text-xs text-emerald-600 font-bold">متابعة التحصيل</span>
              </div>

              <div className="space-y-3">
                {upcomingFeesDue.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">لا يوجد متأخرات أتعاب مسجلة حالياً.</p>
                ) : (
                  upcomingFeesDue.map((feeItem, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex justify-between items-center gap-3"
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{feeItem.clientName}</h4>
                        <p className="text-[11px] text-slate-500">
                          {feeItem.caseNumber} | {feeItem.court}
                        </p>
                        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                          باقي مستحق: {feeItem.remainingFees.toLocaleString()} جنيه
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          const paidAmount = prompt(`أدخل المبلغ المحصل من الموكل (${feeItem.clientName}):`, String(feeItem.remainingFees));
                          if (paidAmount && !isNaN(Number(paidAmount)) && Number(paidAmount) > 0) {
                            if (onAddFeePayment) {
                              onAddFeePayment({
                                id: "fee-" + Date.now(),
                                clientName: feeItem.clientName,
                                amount: Number(paidAmount),
                                currency: "EGP",
                                type: "cash",
                                date: new Date().toISOString().split("T")[0],
                                notes: "تحصيل دفعة مرتبطة بالجلسة القضائية"
                              });
                              alert("تم تسجيل التحصيل وتحديث الخزينة بنجاح!");
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition"
                      >
                        تحصيل الآن
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: FULL DAILY COURT AGENDA & DOCKET TABLE                         */}
      {/* ========================================================================= */}
      {activeTab === "agenda" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          
          {/* Filters and Search Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم القضية، الموكل، المحكمة، أو التاريخ..."
                className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={courtFilter}
                onChange={(e) => setCourtFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none"
              >
                <option value="all">جميع المحاكم</option>
                {courtsList.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none"
              >
                <option value="all">السرود كاملة (صباحي + مسائي)</option>
                <option value="morning">صباحي (٩ ص)</option>
                <option value="evening">مسائي (١٢ م)</option>
              </select>
            </div>
          </div>

          {/* Agenda Sessions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black">
                  <th className="py-3 px-3">التاريخ والتوقيت</th>
                  <th className="py-3 px-3">رقم القضية والدائرة</th>
                  <th className="py-3 px-3">المحكمة المختصة</th>
                  <th className="py-3 px-3">الموكل / الخصم</th>
                  <th className="py-3 px-3">موضوع الدعوى</th>
                  <th className="py-3 px-3">العمل المطلوب بالجلسة</th>
                  <th className="py-3 px-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      لا يوجد جلسات مطابقة لمعايير البحث والتصفية.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-black text-amber-700 dark:text-amber-400 block">{s.date}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold inline-block mt-0.5 ${
                          s.timeType === "morning" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {s.timeType === "morning" ? "صباحي ٩ ص" : "مسائي ١٢ م"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                        {s.caseInfo.caseNumber} {s.caseInfo.caseYear && `لسنة ${s.caseInfo.caseYear}`}
                        {s.caseInfo.circuit && (
                          <span className="block text-[11px] text-slate-400 font-normal">{s.caseInfo.circuit}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                        {s.caseInfo.competentCourt}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{s.caseInfo.clientName}</span>
                        <span className="text-[11px] text-slate-400">ضد: {s.caseInfo.opponentName || "غير محدد"}</span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                        {s.caseInfo.subject}
                      </td>

                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 max-w-[220px]">
                        {s.requiredWork || s.decision || "حضور ومرافعة"}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedSession(s)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-[11px] transition cursor-pointer shadow-xs"
                        >
                          تأجيل / قرار
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 4: ADMINISTRATIVE TASKS FULL VIEW                                  */}
      {/* ========================================================================= */}
      {activeTab === "admin_tasks" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة عمل إداري جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {adminTasks.map((t) => (
              <div
                key={t.id}
                className={`p-4 rounded-2xl border transition space-y-2.5 ${
                  t.status === "completed"
                    ? "bg-slate-50 dark:bg-slate-950 border-slate-200 opacity-60"
                    : "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50 shadow-sm hover:border-indigo-400"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                    t.priority === "urgent" ? "bg-red-100 text-red-800" : "bg-indigo-100 text-indigo-800"
                  }`}>
                    {t.priority === "urgent" ? "عاجل جداً" : "عادي"}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-bold">
                    آخر موعد: {t.deadline}
                  </span>
                </div>

                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{t.title}</h4>
                <p className="text-[11px] text-slate-500">المحكمة: {t.court}</p>
                <p className="text-[11px] text-slate-500">المكلف بالمتابعة: {t.assignedTo}</p>

                {t.notes && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    {t.notes}
                  </p>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      const updated = adminTasks.map(item => 
                        item.id === t.id ? { ...item, status: item.status === "completed" ? "pending" : "completed" } : item
                      );
                      saveTasks(updated as AdministrativeTask[]);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      t.status === "completed"
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-indigo-100 text-indigo-900 hover:bg-indigo-200"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{t.status === "completed" ? "مكتمل بنجاح" : "تأكيد الإنجاز"}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("هل تريد حذف هذه المهمة الإدارية؟")) {
                        saveTasks(adminTasks.filter(item => item.id !== t.id));
                      }
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 5: POLICE RECORDS FULL VIEW                                       */}
      {/* ========================================================================= */}
      {activeTab === "police_records" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowAddReportModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل محضر / شكوى جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {policeReports.map((pr) => (
              <div
                key={pr.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 shadow-sm space-y-2.5"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 px-2.5 py-1 rounded-xl border border-red-200">
                    {pr.reportNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                    {pr.station}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{pr.subject}</h4>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                  <p><strong className="text-slate-700 dark:text-slate-300">الشاكي/المجني عليه:</strong> {pr.clientName}</p>
                  <p><strong className="text-slate-700 dark:text-slate-300">المشكو في حقه:</strong> {pr.opponentName || "غير محدد"}</p>
                  <p><strong className="text-slate-700 dark:text-slate-300">النيابة المختصة:</strong> {pr.prosecutionOffice}</p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-mono text-red-600 font-bold">تاريخ المتابعة: {pr.followUpDate}</span>
                  <button
                    onClick={() => {
                      if (confirm("هل تريد حذف هذا المحضر من السجل؟")) {
                        saveReports(policeReports.filter(item => item.id !== pr.id));
                      }
                    }}
                    className="text-red-500 hover:underline"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: POSTPONE & RECORD COURT DECISION                               */}
      {/* ========================================================================= */}
      {selectedSession && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedSession(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 absolute top-4 left-4"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <CalendarIcon className="w-5 h-5 text-amber-500" />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <p><strong className="text-slate-700 dark:text-slate-300">المحكمة:</strong> {selectedSession.caseInfo.competentCourt}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">تاريخ الجلسة الحالية:</strong> <span className="font-mono font-bold text-amber-700">{selectedSession.date}</span></p>
              <p><strong className="text-slate-700 dark:text-slate-300">موضوع الدعوى:</strong> {selectedSession.caseInfo.subject}</p>
            </div>

            <div className="space-y-3">

            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleUpdateSubmit(selectedSession.id)}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition shadow-sm"
              >
                ترحيل الجلسة وتوثيق القرار
              </button>

              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: ADD NEW SESSION                                                */}
      {/* ========================================================================= */}
      {showAddSessionModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddSessionModal(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 absolute top-4 left-4"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <PlusCircle className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                إدراج جلسة قضائية جديدة بالتقويم
              </h3>
            </div>

            <form onSubmit={handleAddSessionSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
              </div>



              <div className="grid grid-cols-2 gap-3">
              </div>

              <div className="grid grid-cols-2 gap-3">
              </div>



              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  حفظ وإدراج الجلسة بالرول
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL: ADD ADMIN TASK                                                 */}
      {/* ========================================================================= */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowAddTaskModal(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 absolute top-4 left-4"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                إضافة عمل إداري قضائي جديد
              </h3>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!taskTitle || !taskCourt) {
                  alert("يرجى إدخال اسم المهمة والمحكمة المختصة.");
                  return;
                }
                const newTask: AdministrativeTask = {
                  id: "adm-" + Date.now(),
                  title: taskTitle,
                  court: taskCourt,
                  assignedTo: taskAssignedTo,
                  deadline: taskDeadline,
                  priority: taskPriority,
                  status: "pending",
                  notes: taskNotes,
                  createdAt: new Date().toISOString().split("T")[0]
                };
                saveTasks([newTask, ...adminTasks]);
                setShowAddTaskModal(false);
                setTaskTitle("");
                setTaskCourt("");
                setTaskNotes("");
              }}
              className="space-y-3 text-xs"
            >


              <div className="grid grid-cols-2 gap-3">
              </div>



              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition"
                >
                  حفظ العمل الإداري
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. MODAL: ADD POLICE REPORT                                             */}
      {/* ========================================================================= */}
      {showAddReportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowAddReportModal(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 absolute top-4 left-4"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                تسجيل محضر شرطة / شكوى نيابة
              </h3>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!repNumber || !repStation || !repClient) {
                  alert("يرجى تعبئة رقم المحضر، قسم الشرطة، واسم الشاكي.");
                  return;
                }
                const newRep: PoliceReportItem = {
                  id: "pr-" + Date.now(),
                  reportNumber: repNumber,
                  station: repStation,
                  prosecutionOffice: repPros || "النيابة المختصة",
                  clientName: repClient,
                  opponentName: repOpponent || "غير محدد",
                  subject: repSubject || "شكوى وبلاغ رسمي",
                  followUpDate: repDate,
                  status: "waiting_prosecution",
                  createdAt: new Date().toISOString().split("T")[0]
                };
                saveReports([newRep, ...policeReports]);
                setShowAddReportModal(false);
                setRepNumber("");
                setRepStation("");
                setRepClient("");
                setRepOpponent("");
                setRepSubject("");
              }}
              className="space-y-3 text-xs"
            >

              <div className="grid grid-cols-2 gap-3">
              </div>

              <div className="grid grid-cols-2 gap-3">
              </div>



              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs transition"
                >
                  حفظ المحضر بالسجل
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddReportModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK PRINT MODAL: CLEAN PRINTER-FRIENDLY SUMMARY OF DAY'S COURT SESSIONS  */}
      {/* ========================================================================= */}
      {showQuickPrintModal && (() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().slice(0, 10);

        let targetDateStr = todayStr;
        if (quickPrintDateFilter === "tomorrow") targetDateStr = tomorrowStr;
        else if (quickPrintDateFilter === "custom") targetDateStr = quickPrintCustomDate;

        let filteredForPrint = sessions.filter(s => {
          if (quickPrintDateFilter === "all") return true;
          return s.date === targetDateStr;
        });

        // If today has 0 sessions in demo data, check if upcomingTodayAndTomorrow has sessions or show all upcoming
        if (filteredForPrint.length === 0 && quickPrintDateFilter === "today") {
          // Check if there are sessions on upcoming today or fallback to first available active sessions
          if (upcomingTodayAndTomorrow.today.length > 0) {
            filteredForPrint = upcomingTodayAndTomorrow.today;
          } else if (sessions.length > 0) {
            // Fallback gracefully to upcoming sessions
            filteredForPrint = sessions.slice(0, 10);
          }
        }

        if (quickPrintCourtFilter !== "all") {
          filteredForPrint = filteredForPrint.filter(s => (s.caseInfo?.competentCourt || "") === quickPrintCourtFilter);
        }

        const uniqueCourts = Array.from(new Set(sessions.map(s => s.caseInfo?.competentCourt).filter(Boolean))) as string[];

        const handleDirectBrowserPrint = () => {
          window.print();
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              
              {/* Modal Top Bar (Hidden in Print) */}
              <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-xl font-bold">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">طباعة سريعة لرول الجلسات القضائية (Quick Print)</h3>
                    <p className="text-xs text-slate-300">تجهيز كشف ورول طباعة رسمي مجهز لتقديمه بالمحاكم أو الأرشيف</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDirectBrowserPrint}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black rounded-xl text-xs shadow-md cursor-pointer transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة الكشف الآن (Ctrl + P)</span>
                  </button>
                  <button
                    onClick={() => setShowQuickPrintModal(false)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter Controls (Hidden in Print) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-700 dark:text-slate-300">نطاق التاريخ:</span>
                  <button
                    onClick={() => setQuickPrintDateFilter("today")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      quickPrintDateFilter === "today"
                        ? "bg-emerald-600 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    جلسات اليوم ({todayStr})
                  </button>
                  <button
                    onClick={() => setQuickPrintDateFilter("tomorrow")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      quickPrintDateFilter === "tomorrow"
                        ? "bg-emerald-600 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    جلسات الغد ({tomorrowStr})
                  </button>
                  <button
                    onClick={() => setQuickPrintDateFilter("all")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      quickPrintDateFilter === "all"
                        ? "bg-emerald-600 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    كامل رول الجلسات
                  </button>
                  <button
                    onClick={() => setQuickPrintDateFilter("custom")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      quickPrintDateFilter === "custom"
                        ? "bg-emerald-600 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    تاريخ مخصص
                  </button>
                  {quickPrintDateFilter === "custom" && (
                    <input
                      type="date"
                      value={quickPrintCustomDate}
                      onChange={(e) => setQuickPrintCustomDate(e.target.value)}
                      className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">المحكمة:</span>
                  <select
                    value={quickPrintCourtFilter}
                    onChange={(e) => setQuickPrintCourtFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="all">كافة المحاكم ({uniqueCourts.length})</option>
                    {uniqueCourts.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Printable Document Area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white text-slate-900 print:p-0 print:overflow-visible" id="quick-print-area">
                
                {/* Formal Court Header */}
                <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center space-y-1">
                  <div className="flex justify-between items-center text-xs text-slate-600 font-bold border-b border-slate-200 pb-1">
                    <span>جمهورية مصر العربية</span>
                    <span>نقابة المحامين المصرية</span>
                    <span>تاريخ الإصدار: {todayStr}</span>
                  </div>
                  <h1 className="text-xl font-black text-slate-950 pt-2 tracking-wide">
                    مكتب الأستاذ / وسام الشناوي
                  </h1>
                  <p className="text-xs font-bold text-slate-700">
                    المحامي بالنقض والدستورية العليا والإدارية العليا
                  </p>
                  <div className="inline-block bg-slate-900 text-white font-black text-xs px-4 py-1 rounded-md mt-1">
                    كشف ورول جلسات المحاكم ليوم: {targetDateStr} (العدد: {filteredForPrint.length} جلسة)
                  </div>
                </div>

                {/* Print Sessions Table */}
                {filteredForPrint.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-2xl my-6">
                    <p className="text-sm font-bold text-slate-500">لا توجد جلسات مسجلة في هذا التاريخ المحدد ({targetDateStr})</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 border-2 border-slate-900 font-black">
                          <th className="p-2.5 border border-slate-900 w-8 text-center">م</th>
                          <th className="p-2.5 border border-slate-900 w-28">رقم القضية / السنة</th>
                          <th className="p-2.5 border border-slate-900 w-36">المحكمة والدائرة</th>
                          <th className="p-2.5 border border-slate-900 w-36">الموكل (الصفة)</th>
                          <th className="p-2.5 border border-slate-900 w-36">الخصم (الصفة)</th>
                          <th className="p-2.5 border border-slate-900">موضوع الدعوى</th>
                          <th className="p-2.5 border border-slate-900">المطلوب بالجلسة</th>
                          <th className="p-2.5 border border-slate-900 w-32">قرار المحكمة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredForPrint.map((s, idx) => (
                          <tr key={s.id || idx} className="border border-slate-400 hover:bg-slate-50">
                            <td className="p-2 border border-slate-400 text-center font-bold font-mono">{idx + 1}</td>
                            <td className="p-2 border border-slate-400 font-mono font-bold text-slate-950">
                              {s.caseInfo?.caseNumber ? `${s.caseInfo.caseNumber} لسنة ${s.caseInfo.caseYear || ""}` : "غير محدد"}
                            </td>
                            <td className="p-2 border border-slate-400 font-bold text-slate-800">
                              <div>{s.caseInfo?.competentCourt || "المحكمة المختصة"}</div>
                              {s.caseInfo?.circuit && <span className="text-[10px] text-slate-500 font-normal block">دائرة: {s.caseInfo.circuit}</span>}
                            </td>
                            <td className="p-2 border border-slate-400 font-bold text-emerald-900">
                              {s.caseInfo?.clientName || "غير مسجل"}
                            </td>
                            <td className="p-2 border border-slate-400 text-slate-700">
                              {s.caseInfo?.opponentName || "غير محدد"}
                            </td>
                            <td className="p-2 border border-slate-400 text-slate-800">
                              {s.caseInfo?.subject || "نظر الدعوى والمرافعة"}
                            </td>
                            <td className="p-2 border border-slate-400 text-amber-900 font-medium">
                              {s.requiredWork || s.decision || "حضور ومرافعة وتقديم المذكرات والمستندات"}
                            </td>
                            <td className="p-2 border border-slate-400 text-center bg-slate-50/50">
                              <span className="text-[10px] text-slate-400 block pb-4">{s.decision || ""}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer Signing & Stamp Section */}
                <div className="mt-8 pt-4 border-t-2 border-slate-900 flex justify-between items-center text-xs font-bold text-slate-900">
                  <div className="text-right space-y-1">
                    <p>ملاحظات السكرتارية القانونية:</p>
                    <p className="text-[10px] text-slate-500 font-normal">تمت المراجعة والتدقيق مع رول المحاكم وجداول الجلسات</p>
                  </div>
                  <div className="text-center space-y-4">
                    <p>توقيع وخاتم المحامي المسؤول</p>
                    <div className="w-32 border-b border-dashed border-slate-600 mx-auto pt-4"></div>
                  </div>
                </div>

              </div>

              {/* Modal Bottom Actions (Hidden in Print) */}
              <div className="p-3 bg-slate-100 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs print:hidden">
                <span className="text-slate-500 dark:text-slate-400">
                  إجمالي الجلسات في هذا الكشف: <strong className="text-slate-900 dark:text-slate-100 font-mono">{filteredForPrint.length}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDirectBrowserPrint}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة</span>
                  </button>
                  <button
                    onClick={() => setShowQuickPrintModal(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
