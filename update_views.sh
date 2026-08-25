#!/bin/bash
sed -i 's/<div className="bg-gradient-to-l from-slate-900 to-slate-950 p-6 rounded-2xl border border-amber-500\/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">/<div className="flex flex-col md:flex-row md:items-center justify-end gap-6 mb-4">/' src/components/DashboardView.tsx
sed -i '/<h2 className="text-2xl font-bold text-amber-400">لوحة المراقبة والإشراف الإلكتروني<\/h2>/,+4d' src/components/DashboardView.tsx

sed -i 's/<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center flex-wrap gap-4">/<div className="flex justify-end items-center flex-wrap gap-4 mb-4">/' src/components/CasesView.tsx
sed -i '/<h2 className="text-xl font-bold text-slate-900">ملفات وطلبات الصحف القضائية/,+5d' src/components/CasesView.tsx

sed -i 's/<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center flex-wrap gap-4">/<div className="flex justify-end items-center flex-wrap gap-4 mb-4">/' src/components/ClientsView.tsx
sed -i '/<h2 className="text-xl font-bold text-slate-900">منظومة الموكلين والعملاء الموحدة<\/h2>/,+3d' src/components/ClientsView.tsx

