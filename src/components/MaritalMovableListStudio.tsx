import React, { useState, useMemo } from "react";
import { ClientProfile, CaseRecord, PlatformUser } from "../types";
import { 
  ArrowRight, 
  X, 
  Plus, 
  Trash2, 
  Sparkles, 
  Printer, 
  Download, 
  FileText, 
  Coins, 
  Scan, 
  Image as ImageIcon, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  Calculator, 
  Copy, 
  Check, 
  Save, 
  Eye, 
  Layers,
  Building2,
  Calendar,
  PenTool,
  ShieldAlert
} from "lucide-react";
import LawyerSignatureSeal from "./LawyerSignatureSeal";

export interface MovableItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: "furniture" | "appliances" | "gold" | "furnishings" | "kitchen";
  pageNumber: number;
  specs: string;
  invoicePhoto?: string;
}

interface MaritalMovableListStudioProps {
  clients: ClientProfile[];
  cases?: CaseRecord[];
  currentUser: PlatformUser;
  onBack?: () => void;
  onSaveToCaseAttachments?: (caseId: string, docName: string, content: string) => void;
  language?: "ar" | "en";
}

export default function MaritalMovableListStudio({
  clients,
  cases = [],
  currentUser,
  onBack,
  onSaveToCaseAttachments,
  language = "ar"
}: MaritalMovableListStudioProps) {
  // Spouses & Basic Data
  const [husbandName, setHusbandName] = useState("");
  const [husbandNationalId, setHusbandNationalId] = useState("");
  const [husbandAddress, setHusbandAddress] = useState("جمهورية مصر العربية");
  const [husbandPhone, setHusbandPhone] = useState("");

  const [wifeName, setWifeName] = useState("");
  const [wifeNationalId, setWifeNationalId] = useState("");
  const [wifeAddress, setWifeAddress] = useState("جمهورية مصر العربية");
  const [wifePhone, setWifePhone] = useState("");

  const [listDate, setListDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  // Items State (Clean, no fake items initially)
  const [items, setItems] = useState<MovableItem[]>([]);

  // Item Form State
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<MovableItem["category"]>("furniture");
  const [newItemPage, setNewItemPage] = useState(1);
  const [newItemSpecs, setNewItemSpecs] = useState("");
  const [newItemPhoto, setNewItemPhoto] = useState<string | null>(null);

  // Handwritten Invoice OCR Modal & Loading
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrSuccess, setOcrSuccess] = useState<string | null>(null);

  // Auto-populate from selected client
  const handleClientSelect = (clientId: string) => {
    const cl = clients.find(c => c.id === clientId);
    if (!cl) return;
    setWifeName(cl.name);
    setWifeNationalId(cl.nationalId || "");
    setWifePhone(cl.phone || cl.whatsapp || "");
  };

  // Add Item Manually
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;

    const item: MovableItem = {
      id: "mov_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      name: newItemName.trim(),
      quantity: Number(newItemQty) || 1,
      price: Number(newItemPrice) || 0,
      category: newItemCategory,
      pageNumber: Number(newItemPage) || 1,
      specs: newItemSpecs.trim(),
      invoicePhoto: newItemPhoto || undefined
    };

    setItems(prev => [...prev, item]);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemSpecs("");
    setNewItemPhoto(null);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Handle Invoice Image Upload & OCR
  const handleInvoiceOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    setOcrError(null);
    setOcrSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        // Call OCR API with specialized handwritten invoice instruction
        const response = await fetch("/api/ai/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mode: "tables",
            prompt: `هذه فاتورة أو إيصال استلام مكتوب بخط اليد لشراء منقولات زوجية (موبيليا أو ذهب أو أجهزة كهربائية أو مفروشات).
استخرج بدقة جميع الأصناف المكتوبة والكميات والأسعار بالجنيه المصري.
أعد النتيجة بتنسيق JSON حصراً كالتالي:
[
  {
    "name": "اسم الصنف أو القطعة بدقة",
    "quantity": 1,
    "price": 15000,
    "category": "furniture" | "appliances" | "gold" | "furnishings" | "kitchen",
    "specs": "المواصفات والماركة والعيار إن وجد"
  }
]`
          })
        });

        const resJson = await response.json();
        if (!response.ok) {
          throw new Error(resJson.error || "فشل قراءة الفاتورة");
        }

        const rawText = resJson.text || "";
        let parsedItems: any[] = [];
        try {
          const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          parsedItems = JSON.parse(cleaned);
        } catch (e) {
          // If not pure json, extract via simple regex
          console.warn("Could not parse as pure JSON, wrapping extracted text", rawText);
        }

        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          const currentMaxPage = items.reduce((max, it) => Math.max(max, it.pageNumber), 1);
          const newMovableItems: MovableItem[] = parsedItems.map((pi, idx) => ({
            id: `mov_ocr_${Date.now()}_${idx}`,
            name: pi.name || `صنف فاتورة #${idx + 1}`,
            quantity: Number(pi.quantity) || 1,
            price: Number(pi.price) || 0,
            category: (["furniture", "appliances", "gold", "furnishings", "kitchen"].includes(pi.category) ? pi.category : "furniture"),
            pageNumber: currentMaxPage,
            specs: pi.specs || "مستخرج من فاتورة مكتوبة بخط اليد عبر الذكاء الاصطناعي",
            invoicePhoto: base64
          }));

          setItems(prev => [...prev, ...newMovableItems]);
          setOcrSuccess(`تم استخراج وإدراج ${newMovableItems.length} صنف من الفاتورة بخط اليد وحساب أسعارها تلقائياً!`);
        } else {
          setOcrError("تمت قراءة المستند لكن لم يتم التعرف على بنود جدولية واضحة. يرجى إدخال الصنف يدوياً.");
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setOcrError(err.message || "حدث خطأ أثناء معالجة الفاتورة");
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Group items by page number for calculating per-page totals
  const pagesMap = useMemo(() => {
    const map: Record<number, MovableItem[]> = {};
    items.forEach(item => {
      const p = item.pageNumber || 1;
      if (!map[p]) map[p] = [];
      map[p].push(item);
    });
    return map;
  }, [items]);

  const pageNumbers = useMemo(() => {
    const nums = Object.keys(pagesMap).map(Number).sort((a, b) => a - b);
    return nums.length > 0 ? nums : [1];
  }, [pagesMap]);

  // Totals calculations
  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  const totalsByCategory = useMemo(() => {
    const cats = {
      furniture: 0,
      appliances: 0,
      gold: 0,
      furnishings: 0,
      kitchen: 0
    };
    items.forEach(it => {
      cats[it.category] = (cats[it.category] || 0) + (it.price * it.quantity);
    });
    return cats;
  }, [items]);

  // Convert numbers to Arabic written currency
  const numberToArabicWords = (num: number) => {
    if (num <= 0) return "صفر جنيه مصري";
    return `${num.toLocaleString("ar-EG")} جنيهاً مصرياً فقط لا غير`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* TOP HEADER WITH PURE ICON BUTTONS (BACK & CLOSE) */}
      <div className="bg-gradient-to-l from-amber-500 via-amber-600 to-amber-500 text-slate-950 p-4 sm:p-5 rounded-3xl shadow-lg border border-amber-400 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="رجوع"
              title="رجوع"
              className="p-2 hover:bg-slate-950/20 active:bg-slate-950/30 text-slate-950 rounded-xl transition cursor-pointer"
            >
              <ArrowRight className="w-5 h-5 rtl:rotate-0" />
            </button>
          )}
          <div className="p-3 bg-slate-950 text-amber-400 rounded-2xl shadow-inner font-black">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-950">
                قالب ومنظومة قائمة المنقولات الزوجية الذكية (المادة ٣٤١ عقوبات)
              </h2>
              <span className="text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                حساب آلي للأوراق والذهب + OCR فواتير
              </span>
            </div>
            <p className="text-xs text-slate-900 font-medium mt-0.5">
              إضافة البنود بالصور، تفريغ الفواتير المكتوبة بخط اليد بالذكاء الاصطناعي، وجمع إجمالي مبلغ كل ورقة والإجمالي العام
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950/20 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("edit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === "edit" ? "bg-slate-950 text-amber-300 shadow-sm" : "text-slate-900 hover:text-white"
              }`}
            >
              نموذج الإدخال والفواتير
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === "preview" ? "bg-slate-950 text-amber-300 shadow-sm" : "text-slate-900 hover:text-white"
              }`}
            >
              المعاينة والطباعة الرسمية (A4)
            </button>
          </div>

          <button
            onClick={handlePrint}
            aria-label="طباعة القائمة"
            title="طباعة القائمة"
            className="p-2.5 bg-slate-950 hover:bg-slate-900 text-amber-300 rounded-xl transition shadow-md cursor-pointer"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* OCR NOTIFICATIONS */}
      {ocrError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>{ocrError}</span>
          </div>
          <button onClick={() => setOcrError(null)} aria-label="إغلاق" title="إغلاق" className="p-1 hover:bg-rose-200 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {ocrSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{ocrSuccess}</span>
          </div>
          <button onClick={() => setOcrSuccess(null)} aria-label="إغلاق" title="إغلاق" className="p-1 hover:bg-emerald-200 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {viewMode === "edit" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT 7 COLS: SPOUSES DATA & OCR INVOICE UPLOAD & ITEM FORM */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Spouses Data Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <span>👥 أطراف قائمة المنقولات الزوجية (الزوج المستلم والزوجة المالكة)</span>
                </h3>
                {clients.length > 0 && (
                  <select
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-700 font-bold"
                  >
                    <option value="">تعبئة من سجل الموكلين...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Husband (الزوج المستلم) */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-black text-blue-800 block">الطرف الأول: الزوج (المستلم والمودع لديه)</span>
                  <input
                    type="text"
                    value={husbandName}
                    onChange={(e) => setHusbandName(e.target.value)}
                    placeholder="اسم الزوج رباعي"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={husbandNationalId}
                    onChange={(e) => setHusbandNationalId(e.target.value)}
                    placeholder="الرقم القومي (14 رقم)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={husbandAddress}
                    onChange={(e) => setHusbandAddress(e.target.value)}
                    placeholder="محل الإقامة ومسكن الزوجية"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500"
                  />
                </div>

                {/* Wife (الزوجة المالكة) */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-black text-amber-800 block">الطرف الثاني: الزوجة (المالكة للمنقولات)</span>
                  <input
                    type="text"
                    value={wifeName}
                    onChange={(e) => setWifeName(e.target.value)}
                    placeholder="اسم الزوجة رباعي"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={wifeNationalId}
                    onChange={(e) => setWifeNationalId(e.target.value)}
                    placeholder="الرقم القومي (14 رقم)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={wifeAddress}
                    onChange={(e) => setWifeAddress(e.target.value)}
                    placeholder="محل إقامة الزوجة"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. HANDWRITTEN INVOICE OCR SCANNER CARD */}
            <div className="bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 p-5 rounded-2xl border-2 border-amber-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-black">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">
                      استخراج البنود من فواتير المحلات المكتوبة بخط اليد (Handwritten OCR)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      ارفع صورة فاتورة الذهب، معرض الموبيليا، أو الأجهزة لاستخراج الأسماء والأسعار فورياً
                    </p>
                  </div>
                </div>

                <label className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-amber-400 text-xs font-black rounded-xl shadow-sm cursor-pointer transition flex items-center gap-1.5">
                  {isOcrProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>مسح فاتورة بخط اليد</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleInvoiceOcrUpload}
                    disabled={isOcrProcessing}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 3. Add Item Form */}
            <form onSubmit={handleAddItem} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-500" />
                <span>إدراج صنف أو منقول جديد بالقائمة</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-1 font-bold">اسم القطعة أو الصنف</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="مثال: حجرة نوم رئيسية خشب زان"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 font-bold">العدد / الكمية</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 font-bold">القيمة التقديرية (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="مثال: 85000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-amber-800 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 font-bold">التصنيف الشرعي</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-amber-500"
                  >
                    <option value="furniture">🪑 أثاث وموبيليا</option>
                    <option value="appliances">📺 أجهزة كهربائية</option>
                    <option value="gold">💍 مصوغات وذهب</option>
                    <option value="furnishings">🧶 سجاد ومفروشات</option>
                    <option value="kitchen">🍳 أدوات مطبخ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 font-bold">رقم الورقة / الصفحة</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newItemPage}
                    onChange={(e) => setNewItemPage(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-1 font-bold">المواصفات والماركة (اختياري)</label>
                  <input
                    type="text"
                    value={newItemSpecs}
                    onChange={(e) => setNewItemSpecs(e.target.value)}
                    placeholder="مثال: سرير ٢ متر + دولاب ٦ درف + تسريحة"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <label className="text-[11px] text-slate-600 flex items-center gap-1.5 cursor-pointer hover:text-amber-600">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>{newItemPhoto ? "✓ تم إرفاق صورة القطعة" : "إرفاق صورة القطعة"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setNewItemPhoto(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  إضافة للقائمة
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT 5 COLS: LIVE SUMMARY & ITEMS AUDIT & PER-PAGE TOTALS */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Grand Total Box */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-amber-500/40 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-400 font-bold">الإجمالي العام لقائمة المنقولات:</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black">
                  {items.length} قطعة مدرجة
                </span>
              </div>

              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {grandTotal.toLocaleString("ar-EG")} <span className="text-xs font-sans text-slate-300">جنيه مصري</span>
              </div>
              <p className="text-[11px] text-slate-300">
                {numberToArabicWords(grandTotal)}
              </p>

              {/* Category Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-3 border-t border-slate-800">
                <div className="bg-slate-800/80 p-2 rounded-lg">
                  <span className="text-slate-400 block">🪑 الموبيليا والأخشاب</span>
                  <strong className="text-amber-300 font-mono font-bold">{totalsByCategory.furniture.toLocaleString()} EGP</strong>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg">
                  <span className="text-slate-400 block">📺 الأجهزة الكهربائية</span>
                  <strong className="text-sky-300 font-mono font-bold">{totalsByCategory.appliances.toLocaleString()} EGP</strong>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg">
                  <span className="text-slate-400 block">💍 المصوغات والذهب</span>
                  <strong className="text-amber-400 font-mono font-bold">{totalsByCategory.gold.toLocaleString()} EGP</strong>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg">
                  <span className="text-slate-400 block">🧶 المفروشات والمطبخ</span>
                  <strong className="text-emerald-300 font-mono font-bold">{(totalsByCategory.furnishings + totalsByCategory.kitchen).toLocaleString()} EGP</strong>
                </div>
              </div>
            </div>

            {/* Per-Page Totals Ticker */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2">
                <span>📑 جمع إجمالي مبالغ الأوراق المقسمة:</span>
                <span className="text-[10px] text-slate-500 font-bold">{pageNumbers.length} أوراق</span>
              </h4>

              <div className="space-y-2">
                {pageNumbers.map(pNum => {
                  const pItems = pagesMap[pNum] || [];
                  const pTotal = pItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
                  return (
                    <div key={pNum} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                          {pNum}
                        </span>
                        <span className="font-bold text-slate-800">إجمالي الورقة {pNum} ({pItems.length} بنود):</span>
                      </div>
                      <span className="font-mono font-black text-amber-700">
                        {pTotal.toLocaleString()} ج.م
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items List Audit */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 max-h-72 overflow-y-auto">
              <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">
                بنود القائمة الحالية ({items.length}):
              </h4>
              {items.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  لا توجد بنود مضافة بعد. أضف بنوداً يدوياً أو ارفع صورة فاتورة.
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map(it => (
                    <div key={it.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{it.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">×{it.quantity}</span>
                          <span className="text-[9px] bg-slate-200 px-1.5 py-0.2 rounded text-slate-600">ورقة {it.pageNumber}</span>
                        </div>
                        {it.specs && <p className="text-[10px] text-slate-500">{it.specs}</p>}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono font-bold text-amber-800">
                          {(it.price * it.quantity).toLocaleString()} ج.م
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          aria-label="مسح البند"
                          title="مسح البند"
                          className="p-1 hover:bg-rose-100 text-rose-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* PRINTABLE OFFICIAL A4 MULTI-PAGE VIEW (مع جمع إجمالي كل ورقة والمجموع العام) */
        /* ========================================================================= */
        <div className="space-y-8">
          {pageNumbers.map((pNum) => {
            const pageItems = pagesMap[pNum] || [];
            const pageTotal = pageItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);

            return (
              <div
                key={pNum}
                className="bg-white text-slate-950 p-8 sm:p-12 rounded-3xl border-4 border-double border-amber-600/70 shadow-2xl max-w-4xl mx-auto space-y-6 font-serif print:border-none print:shadow-none print:p-0 print:m-0"
              >
                {/* A4 Page Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4 relative">
                  <span className="absolute left-0 top-0 text-xs font-mono font-bold text-slate-500">
                    ورقة رقم ({pNum} من {pageNumbers.length})
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 font-serif">
                    قائمة استلام منقولات زوجية ومصوغات ذهبية
                  </h1>
                  <p className="text-xs font-sans text-slate-700 mt-1">
                    سند أمانة رسمي وفقاً لأحكام المادة ٣٤١ من قانون العقوبات المصري
                  </p>
                </div>

                {/* Legal Preamble (Only on Page 1) */}
                {pNum === 1 && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs leading-relaxed font-sans text-justify">
                    أقر أنا الموقع أدناه: <strong>{husbandName || "......................................................."}</strong>، 
                    المقيم في: <strong>{husbandAddress || "...................................."}</strong>، 
                    بطاقة رقم قومي: <strong className="font-mono">{husbandNationalId || ".............................."}</strong>،
                    بأنني تسلمت من زوجتي السيدة: <strong>{wifeName || "......................................................."}</strong>، 
                    المقيمة في: <strong>{wifeAddress || "...................................."}</strong>، 
                    بطاقة رقم قومي: <strong className="font-mono">{wifeNationalId || ".............................."}</strong>،
                    جميع المنقولات الزوجية والأجهزة والمصوغات الذهبية الموضحة تفصيلاً بالجدول أدناه، وتسلمتها بحالة جيدة وسليمة بعد معاينتها المعاينة التامة النافية للجهالة شرعاً وقانوناً، 
                    وأتعهد بالمحافظة عليها وردها عيناً وبحالتها أو رد قيمتها نقداً متى طُلبت مني، وإلا أكون مبدداً وخائناً للأمانة وفقاً للمادة ٣٤١ عقوبات.
                  </div>
                )}

                {/* Items Table for this Page */}
                <div className="overflow-x-auto border border-slate-900 rounded-xl">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 font-bold border-b border-slate-900 text-slate-900">
                      <tr>
                        <th className="p-2.5 border-l border-slate-300 w-12 text-center">م</th>
                        <th className="p-2.5 border-l border-slate-300">بيان الصنف والمنقولات بالتفصيل</th>
                        <th className="p-2.5 border-l border-slate-300 w-16 text-center">العدد</th>
                        <th className="p-2.5 border-l border-slate-300 w-28 text-center">القيمة (ج.م)</th>
                        <th className="p-2.5 w-36">المواصفات والماركة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pageItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            لا توجد بنود مسجلة في هذه الصفحة
                          </td>
                        </tr>
                      ) : (
                        pageItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-2.5 border-l border-slate-200 text-center font-bold">{idx + 1}</td>
                            <td className="p-2.5 border-l border-slate-200 font-bold text-slate-900">{item.name}</td>
                            <td className="p-2.5 border-l border-slate-200 text-center font-mono font-bold">{item.quantity}</td>
                            <td className="p-2.5 border-l border-slate-200 text-center font-mono font-bold text-amber-800">
                              {(item.price * item.quantity).toLocaleString()} EGP
                            </td>
                            <td className="p-2.5 text-[11px] text-slate-600">{item.specs || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal of THIS Page */}
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 flex items-center justify-between text-xs font-bold font-sans">
                  <span className="text-amber-900">
                    💰 إجمالي قيمة محتويات الورقة رقم ({pNum}):
                  </span>
                  <span className="font-mono text-sm font-black text-amber-950">
                    {pageTotal.toLocaleString()} جنيه مصري ({numberToArabicWords(pageTotal)})
                  </span>
                </div>

                {/* Grand Total Display on the Last Page */}
                {pNum === pageNumbers[pageNumbers.length - 1] && (
                  <div className="bg-slate-900 text-white p-4 rounded-xl border-2 border-amber-500 space-y-1 font-sans text-center">
                    <span className="text-xs text-amber-300 font-bold block">
                      🏛️ الإجمالي العام لكافة أوراق قائمة المنقولات الزوجية ({pageNumbers.length} أوراق):
                    </span>
                    <div className="text-xl font-mono font-black text-emerald-400">
                      {grandTotal.toLocaleString()} جنيه مصري
                    </div>
                    <p className="text-xs text-slate-300 font-serif">
                      فقط وقدره {numberToArabicWords(grandTotal)}
                    </p>
                  </div>
                )}

                {/* Signatures & Undertaking */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs font-sans">
                  <div className="text-center space-y-3">
                    <span className="font-bold block text-slate-700">توقيع المستلم (الزوج المقر بالأمانة):</span>
                    <div className="h-16 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                      <span className="text-[10px] text-slate-400">الاسم والتوقيع والبصمة</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{husbandNationalId}</span>
                  </div>

                  <div className="text-center space-y-3">
                    <span className="font-bold block text-slate-700">توقيع الشاهد الأول:</span>
                    <div className="h-16 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                      <span className="text-[10px] text-slate-400">الاسم والتوقيع والرقم القومي</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
