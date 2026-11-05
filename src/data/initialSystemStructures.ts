import { SystemStructureSection } from "../types";

export const INITIAL_SYSTEM_STRUCTURES: SystemStructureSection[] = [
  {
    id: "struct-legal",
    code: "struct-legal",
    title: "الإدارة القانونية والقضايا",
    description: "إدارة متكاملة للدعاوى بأنواعها ورول الجلسات والمحضرين",
    badge: "قانوني وقضائي",
    statusBadge: "نشط ومتوسع",
    iconName: "scale",
    subInterfaces: [
      {
        id: "sub-legal-1",
        code: "CIVIL_CASES",
        title: "الدعاوى المدنية والتجارية",
        fieldsCount: 12,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-legal",
        description: "جدول شامل لبيانات صحف الدعاوى المدنية، المحكمة المختصة، التعويضات، وأسماء الخصوم والطلبات الختامية.",
        fields: [
          { id: "f1", name: "caseNumber", label: "رقم القضية", type: "text", placeholder: "مثال: 1402 / 2026" },
          { id: "f2", name: "court", label: "المحكمة المختصة", type: "text", placeholder: "محكمة جنوب القاهرة الابتدائية" },
          { id: "f3", name: "client", label: "اسم الموكل", type: "text", placeholder: "أحمد محمود المنشاوي" },
          { id: "f4", name: "opponent", label: "الخصم", type: "text", placeholder: "شركة النور للمقاولات" },
          { id: "f5", name: "claimValue", label: "قيمة المطالبة", type: "number", placeholder: "250,000 ج.م" },
          { id: "f6", name: "status", label: "حالة الدعوى", type: "status" }
        ],
        sampleData: [
          { id: "1", caseNumber: "1402 / 2026", court: "جنوب القاهرة الابتدائية", client: "أحمد محمود المنشاوي", opponent: "شركة النور للمقاولات", claimValue: "250,000 ج.م", status: "متداولة بالجلسات" },
          { id: "2", caseNumber: "883 / 2026", court: "محكمة ههيا الكلية", client: "إبراهيم الدسوقي", opponent: "بنك مصر", claimValue: "180,000 ج.م", status: "محجوزة للحكم" },
          { id: "3", caseNumber: "450 / 2025", court: "شمال الجيزة التجارية", client: "مؤسسة الأهرام للخدمات", opponent: "سعيد عبد الفتاح", claimValue: "95,000 ج.م", status: "ندب خبير" }
        ]
      },
      {
        id: "sub-legal-2",
        code: "CRIMINAL_CASES",
        title: "الدعاوى الجنائية والجنح",
        fieldsCount: 15,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-legal",
        description: "بطاقات تفاعلية لقضايا الجنح والجنايات، أرقام محاضر الشرطة، قرارات النيابة العامة، ومواعيد المعارضة والاستئناف.",
        fields: [
          { id: "f1", name: "caseNo", label: "رقم الجنحة / الجناية", type: "text" },
          { id: "f2", name: "policeStation", label: "قسم الشرطة المختص", type: "text" },
          { id: "f3", name: "charge", label: "التهمة المنسوبة", type: "text" },
          { id: "f4", name: "appealDeadline", label: "ميعاد المعارضة / الاستئناف", type: "date" }
        ],
        sampleData: [
          { id: "1", caseNo: "11234 / 2026 جنح قصر النيل", policeStation: "قسم قصر النيل", charge: "تبديد إيصال أمانة", appealDeadline: "2026-09-15", status: "جلسة معارضة" },
          { id: "2", caseNo: "5420 / 2026 جنايات الزقازيق", policeStation: "قسم أول الزقازيق", charge: "استعراض قوة وإتلاف", appealDeadline: "2026-10-02", status: "تحقيق نيابة" }
        ]
      },
      {
        id: "sub-legal-3",
        code: "FAMILY_CASES",
        title: "دعاوى الأسرة والأحوال",
        fieldsCount: 10,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-legal",
        description: "إدارة دعاوى محاكم الأسرة، النفقات، الحضانة، إثبات الزواج العرفي، والرؤية والخلع.",
        fields: [
          { id: "f1", name: "caseNo", label: "رقم دعوى الأسرة", type: "text" },
          { id: "f2", name: "caseType", label: "نوع الدعوى (نفقة/خلع/إثبات زواج)", type: "select" },
          { id: "f3", name: "settlementDate", label: "جلسة مكتب تسوية المنازعات", type: "date" }
        ]
      },
      {
        id: "sub-legal-4",
        code: "CORP_CASES",
        title: "تأسيس وقضايا الشركات",
        fieldsCount: 18,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-legal",
        description: "متابعة عقود التأسيس، السجلات التجارية، الجمعيات العمومية، وتصفية الشركات والنزاعات الاستثمارية."
      },
      {
        id: "sub-legal-5",
        code: "SESSIONS_ROLL",
        title: "أجندة الجلسات (الرول)",
        fieldsCount: 8,
        displayType: "أجندة زمنية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-legal",
        description: "الرول اليومي والأسبوعي للجلسات القضائية وتوثيق قرارات المحكمة ومذكرات الدفاع المطلوبة."
      },
      {
        id: "sub-legal-6",
        code: "CONSULTATIONS",
        title: "الاستشارات القانونية",
        fieldsCount: 6,
        displayType: "نموذج إدخال",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-legal",
        description: "سجل الرأي القانوني والمذكرات الشفهية والتحريرية المقدمة لعملاء المكتب."
      },
      {
        id: "sub-legal-7",
        code: "CONTRACTS_DRAFT",
        title: "صياغة العقود والاتفاقيات",
        fieldsCount: 7,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-legal",
        description: "صياغة وتدقيق عقود البيع، الإيجار، العمل، التوريدات، والاتفاقيات الدولية."
      },
      {
        id: "sub-legal-8",
        code: "BAILIFFS_WORK",
        title: "أعمال المحضرين والإعلانات",
        fieldsCount: 5,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-legal",
        description: "تسليم واستلام الصحف وإعلانات أصل العريضة وإعادة الإعلانات والتنفيذ الجبري."
      },
      {
        id: "sub-legal-9",
        code: "EXPERTS_TASKS",
        title: "متابعة مأموريات الخبراء",
        fieldsCount: 6,
        displayType: "أجندة زمنية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-legal",
        description: "جلسات مكتب خبراء وزارة العدل، سداد الأمانات، وتقديم حوافظ المستندات الحسابية والهندسية."
      },
      {
        id: "sub-legal-10",
        code: "POLICE_DEPTS",
        title: "النيابات وأقسام الشرطة",
        fieldsCount: 5,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-legal",
        description: "تتبع محاضر الإداري والعرائض والشكاوى لدى النيابات الكلية والجزئية."
      },
      // AI GENERATED (Green badges as in screenshot)
      {
        id: "sub-legal-ai-1",
        code: "AUTO_MANZ",
        title: "تقييم مخاطر لـ الإدارة",
        fieldsCount: 10,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-legal",
        description: "محرك تنبؤي ذكي يقيم احتمالية كسب أو خسارة الدعوى القضائية بناءً على الدفوع والمستندات."
      },
      {
        id: "sub-legal-ai-2",
        code: "AUTO_NVD4",
        title: "لوحة مراقبة لـ الإدارة",
        fieldsCount: 12,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-legal",
        description: "مؤشرات بيانية في الوقت الفعلي لحركة الدعاوى والأحكام الصادرة ونسب الإنجاز."
      },
      {
        id: "sub-legal-ai-3",
        code: "AUTO_XH12",
        title: "مؤشرات أداء لـ الإدارة",
        fieldsCount: 4,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-legal",
        description: "قياس كفاءة إعداد الصحف ومعدل حضور الجلسات وسرعة الحصول على الصيغ التنفيذية."
      },
      {
        id: "sub-legal-ai-4",
        code: "AUTO_SY66",
        title: "تتبع آلي لـ الإدارة",
        fieldsCount: 5,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-legal",
        description: "روبوت استعلام ذاتي عن رول الجلسات والأحكام المودعة من بوابات وزارة العدل المصرية."
      },
      {
        id: "sub-legal-ai-5",
        code: "AUTO_THCN",
        title: "سجل استباقي لـ الإدارة",
        fieldsCount: 3,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-legal",
        description: "تنبؤ استباقي بالمواعيد القانونية لسقوط الحق أو انقضاء الدعوى الجنائية أو التقادم المدني."
      },
      {
        id: "sub-legal-ai-6",
        code: "AUTO_RPGA",
        title: "تنبيهات مبكرة لـ الإدارة",
        fieldsCount: 12,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-legal",
        description: "إشعارات ذكية فورية عبر WhatsApp وSMS باقتراب مواعيد الطعون وإيداع الأمانات."
      },
      {
        id: "sub-legal-ai-7",
        code: "AUTO_C14Z",
        title: "مؤشرات أداء لـ الإدارة",
        fieldsCount: 10,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-legal",
        description: "تحليل مالي وزمني لكل قضية لمقارنة التكاليف الفعلية بالأتعاب المحصلة."
      }
    ]
  },
  {
    id: "struct-clients",
    code: "struct-clients",
    title: "إدارة الموكلين والعلاقات",
    description: "قاعدة بيانات الموكلين الأفراد والشركات والتوكيلات",
    badge: "علاقات موكلين",
    statusBadge: "نشط ومتوسع",
    iconName: "users",
    subInterfaces: [
      {
        id: "sub-cl-1",
        code: "CLIENTS_INDIV",
        title: "سجل الموكلين - أفراد",
        fieldsCount: 9,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-clients",
        description: "سجل متكامل للبيانات الشخصية والرقم القومي وأرقام الهواتف ومحل الإقامة للموكلين الطبيعيين."
      },
      {
        id: "sub-cl-2",
        code: "CLIENTS_CORP",
        title: "سجل الموكلين - شركات",
        fieldsCount: 11,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-clients",
        description: "بيانات الشركات والممثلين القانونيين والسجل التجاري والبطاقة الضريبية وحجم التعاملات."
      },
      {
        id: "sub-cl-3",
        code: "POA_MANAGE",
        title: "إدارة التوكيلات والصفات",
        fieldsCount: 6,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-clients",
        description: "أرقام التوكيلات الرسمية العامة والخاصة بمكاتب التوثيق ومطابقتها وصلاحيات المحامي."
      },
      {
        id: "sub-cl-4",
        code: "CLIENT_PORTAL",
        title: "بوابة دخول الموكلين",
        fieldsCount: 4,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-clients",
        description: "متابعة الموكلين لحالة قضاياهم ومستنداتهم عبر البوابة المؤمنة ورموز QR."
      },
      // AI GENERATED
      {
        id: "sub-cl-ai-1",
        code: "AUTO_W928",
        title: "سجل حركات لـ إدارة",
        fieldsCount: 9,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-clients",
        description: "تتبع نشاط الموكل وسجل الزيارات والمكالمات والتحديثات المستلمة تلقائياً."
      },
      {
        id: "sub-cl-ai-2",
        code: "AUTO_RNVX",
        title: "أرشيف احتياطي لـ إدارة",
        fieldsCount: 12,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-clients",
        description: "نسخ احتياطي سحابي مشفر لكافة وثائق وإثباتات شخصية الموكلين."
      },
      {
        id: "sub-cl-ai-3",
        code: "AUTO_VZS7",
        title: "تدقيق ذكي لـ إدارة",
        fieldsCount: 8,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-clients",
        description: "فحص آلي لعدم وجود تعارض مصالح (Conflict of Interest) مع أي موكل أو خصم سابق."
      },
      {
        id: "sub-cl-ai-4",
        code: "AUTO_XKZ4",
        title: "لوحة مراقبة لـ إدارة",
        fieldsCount: 6,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-clients",
        description: "تحليل رضا الموكلين ومعدل تجديد الاستشارات واستقبال المراجعين."
      },
      {
        id: "sub-cl-ai-5",
        code: "AUTO_NX8Q",
        title: "تتبع آلي لـ إدارة",
        fieldsCount: 3,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-clients",
        description: "إرسال رسائل تهنئة وتذكيرات دورية بالمستندات المنتهية صلاحيتها."
      },
      {
        id: "sub-cl-ai-6",
        code: "AUTO_01AK",
        title: "تتبع آلي لـ إدارة",
        fieldsCount: 4,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-clients",
        description: "متابعة تواصل الموكلين عبر منصات الواتساب والبريد والتطبيق."
      },
      {
        id: "sub-cl-ai-7",
        code: "AUTO_GVD8",
        title: "سجل استباقي لـ إدارة",
        fieldsCount: 5,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-clients",
        description: "توقع احتياجات الموكل القانونية المستقبلية بناءً على سجل القضايا السابقة."
      }
    ]
  },
  {
    id: "struct-finance",
    code: "struct-finance",
    title: "الماليات والحسابات",
    description: "إدارة الفواتير، المصروفات، الأتعاب، والتقارير المالية",
    badge: "مالي وإداري",
    statusBadge: "نشط ومتوسع",
    iconName: "dollar",
    subInterfaces: [
      {
        id: "sub-fin-1",
        code: "INVOICES_REQ",
        title: "الفواتير والمطالبات",
        fieldsCount: 8,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-finance",
        description: "إصدار فواتير إلكترونية ومطالبات أتعاب رسمية للموكلين والشركات."
      },
      {
        id: "sub-fin-2",
        code: "RECEIPTS_IN",
        title: "سندات القبض",
        fieldsCount: 5,
        displayType: "نموذج إدخال",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-finance",
        description: "سندات تحصيل مبالغ نقدية أو شيكات أو تحويلات بنكية مع رقم إيصال فريد."
      },
      {
        id: "sub-fin-3",
        code: "RECEIPTS_OUT",
        title: "سندات الصرف والمصروفات",
        fieldsCount: 5,
        displayType: "نموذج إدخال",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-finance",
        description: "توثيق مصروفات قيد الدعاوى، رسوم الخزينة، أمانات الخبراء، والمصروفات الإدارية."
      },
      {
        id: "sub-fin-4",
        code: "TAXES_VAT",
        title: "الضرائب والقيمة المضافة",
        fieldsCount: 6,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-finance",
        description: "حساب ضريبة الجدول والقيمة المضافة وضريبة الدخل السنوية وخصم المنبع."
      },
      {
        id: "sub-fin-5",
        code: "LAWYERS_FEES",
        title: "أتعاب ومستحقات المحامين",
        fieldsCount: 7,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-finance",
        description: "توزيع نسب ومكافآت السادة المحامين والباحثين وفق كل دعوى منجزة."
      },
      {
        id: "sub-fin-6",
        code: "FIN_REPORTS",
        title: "التقارير والميزانية",
        fieldsCount: 4,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-finance",
        description: "قائمة الدخل، الأرباح الصافية، والتدفقات النقدية الشهرية والسنوية للمكتب."
      },
      // AI GENERATED
      {
        id: "sub-fin-ai-1",
        code: "AUTO_7C10",
        title: "مؤشرات أداء لـ الماليات",
        fieldsCount: 6,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-finance",
        description: "تحليل نسبة التحصيل الفعلي مقابل الأتعاب المقدرة واكتشاف الديون المتأخرة."
      },
      {
        id: "sub-fin-ai-2",
        code: "AUTO_SLA6",
        title: "تنبيهات مبكرة لـ الماليات",
        fieldsCount: 4,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-finance",
        description: "إشعارات تلقائية للأقساط والمطالبات المستحقة خلال 48 ساعة."
      },
      {
        id: "sub-fin-ai-3",
        code: "AUTO_18Z4",
        title: "تقييم مخاطر لـ الماليات",
        fieldsCount: 9,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-finance",
        description: "تصنيف الملاءة المالية للموكلين وتحديد نسب الأتعاب المؤجلة الآمنة."
      },
      {
        id: "sub-fin-ai-4",
        code: "AUTO_8ZQU",
        title: "مؤشرات أداء لـ الماليات",
        fieldsCount: 9,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-finance",
        description: "مقارنة عوائد التخصصات القانونية (مدني، جنائي، شركات) لتوجيه خطة المكتب."
      }
    ]
  },
  {
    id: "struct-hr",
    code: "struct-hr",
    title: "الموارد البشرية والمهام",
    description: "إدارة فريق العمل والتكليفات والحضور",
    badge: "مالي وإداري",
    statusBadge: "نشط ومتوسع",
    iconName: "user-check",
    subInterfaces: [
      {
        id: "sub-hr-1",
        code: "HR_STAFF",
        title: "إدارة فريق العمل",
        fieldsCount: 10,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-hr",
        description: "ملفات السادة المحامين، الباحثين القانونيين، المحاسبين، وطاقم السكرتارية."
      },
      {
        id: "sub-hr-2",
        code: "HR_TASKS",
        title: "توزيع المهام والتكليفات",
        fieldsCount: 6,
        displayType: "أجندة زمنية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-hr",
        description: "تكليف المحامين بحضور الجلسات، كتابة المذكرات، ومأموريات المحاكم والشهر العقاري."
      },
      {
        id: "sub-hr-3",
        code: "HR_ATTEND",
        title: "سجل الحضور والانصراف",
        fieldsCount: 4,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-hr",
        description: "تسجيل أوقات الدوام والمأموريات الميدانية والعمل عن بعد."
      },
      {
        id: "sub-hr-4",
        code: "HR_EVAL",
        title: "تقييم الأداء والإنتاجية",
        fieldsCount: 5,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-hr",
        description: "تقييم جودة المذكرات، الالتزام بمواعيد الجلسات، وتحقيق النتائج الإيجابية."
      },
      {
        id: "sub-hr-ai-1",
        code: "AUTO_HR_LEAV",
        title: "أتمتة سجل الإجازات والمأموريات",
        fieldsCount: 6,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-hr",
        description: "موافقة فورية وجدولة بدلاء للجلسات أثناء إجازات المحامين لضمان عدم فوات أي موعد."
      },
      {
        id: "sub-hr-ai-2",
        code: "AUTO_HR_KPIS",
        title: "مؤشرات إنتاجية المحامين",
        fieldsCount: 8,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-hr",
        description: "تحليل ذكي لعدد الساعات والدعاوى المنجزة لكل عضو في الفريق."
      },
      {
        id: "sub-hr-ai-3",
        code: "AUTO_HR_COMP",
        title: "تدقيق الامتثال الإداري والجزاءات",
        fieldsCount: 5,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-hr",
        description: "التحقق من توثيق كافة الإجراءات وفق لائحة العمل الداخلية وميثاق شرف المحاماة."
      }
    ]
  },
  {
    id: "struct-archive",
    code: "struct-archive",
    title: "الأرشيف الرقمي والتوثيق الإلكتروني",
    description: "خزينة الوثائق الرقمية، المستندات الرسمية، والباركود والأحكام القضائية",
    badge: "أرشيف إلكتروني",
    statusBadge: "نشط ومتوسع",
    iconName: "archive",
    subInterfaces: [
      {
        id: "sub-arch-1",
        code: "COURT_JUDGMENTS",
        title: "مستودع الأحكام والطعون",
        fieldsCount: 8,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-archive",
        description: "أرشيف أحكام محكمة النقض، المحكمة الإدارية العليا، ومحاكم الاستئناف."
      },
      {
        id: "sub-arch-2",
        code: "DOCS_VAULT",
        title: "حافظة المستندات الرقمية",
        fieldsCount: 6,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-archive",
        description: "حفظ صور العقود والمستندات الأصلية بحجم فائق الجودة مع تشفير كامل."
      },
      {
        id: "sub-arch-3",
        code: "NOTARY_REG",
        title: "سجل التوثيقات والشهر العقاري",
        fieldsCount: 7,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-archive",
        description: "تتبع دفاتر التوثيق والتصديق على التوقيعات وإشهار العقارات."
      },
      {
        id: "sub-arch-4",
        code: "BARCODE_TRACK",
        title: "الباركود والتتبع الميداني للملفات",
        fieldsCount: 5,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-archive",
        description: "طباعة ملصقات الباركود على دوسيهات القضايا الورقية لتتبع حركتها في المكتب."
      },
      {
        id: "sub-arch-ai-1",
        code: "AUTO_SMART_INDEX",
        title: "الفهرسة الذكية والبحث الصوتي",
        fieldsCount: 9,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-archive",
        description: "محرك OCR وبحث دلالي متقدم داخل ملفات الـ PDF والصور الممسوحة ضوئياً."
      }
    ]
  },
  {
    id: "struct-ai-automation",
    code: "struct-ai-automation",
    title: "استوديو الذكاء الاصطناعي والأتمتة القانونية",
    description: "محركات التوليد الآلي للعقود، التدقيق القانوني، والمساعد الذكي للدعاوى",
    badge: "ذكاء اصطناعي وأتمتة",
    statusBadge: "نشط ومتوسع",
    iconName: "bot",
    subInterfaces: [
      {
        id: "sub-ai-1",
        code: "AI_MEMO_DRAFT",
        title: "الصياغة الآلية للمذكرات والدفوع",
        fieldsCount: 10,
        displayType: "نموذج إدخال",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-ai-automation",
        description: "توليد مذكرات دفاع شاملة مستندة إلى نصوص القانون وأحكام النقض الحديثة."
      },
      {
        id: "sub-ai-2",
        code: "AI_FLAW_PREDICT",
        title: "تحليل الثغرات والتنبؤ بالأحكام",
        fieldsCount: 8,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-ai-automation",
        description: "اكتشاف العيوب الشكلية والموضوعية في صحف دعاوى ومذكرات الخصوم."
      },
      {
        id: "sub-ai-3",
        code: "AI_LEGAL_BOT",
        title: "الروبوت القانوني للمحادثة الذكية",
        fieldsCount: 6,
        displayType: "بطاقات تفاعلية",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-ai-automation",
        description: "مساعد رقمي متاح للمحامي للإجابة الفورية عن تكييف الوقائع القانونية المعقدة."
      },
      {
        id: "sub-ai-4",
        code: "AI_DOC_COMPARE",
        title: "المقارنة التلقائية بين النسخ",
        fieldsCount: 7,
        displayType: "جدول بيانات",
        status: "نشط",
        isAiGenerated: false,
        sectionId: "struct-ai-automation",
        description: "مقارنة نسختين من العقود والمذكرات وتظليل التغييرات القانونية الدقيقة."
      },
      {
        id: "sub-ai-ai-1",
        code: "AUTO_SELF_EXPAND",
        title: "محرك التوسعة الذاتية للأقسام",
        fieldsCount: 12,
        displayType: "لوحة تحليلية",
        status: "نشط",
        isAiGenerated: true,
        sectionId: "struct-ai-automation",
        description: "تحليل الاحتياجات البرمجية تلقائياً وتوليد واجهات وقواعد بيانات إضافية عند الطلب."
      }
    ]
  }
];
