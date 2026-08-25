const fs = require('fs');
let content = fs.readFileSync('src/components/TenantsAdminView.tsx', 'utf8');

// Replace the delete button with a suspend/activate toggle
content = content.replace(
  /<button onClick={\(\) => handleDelete\(tenant\.id\)}[\s\S]*?<Trash2 className="w-4 h-4" \/>\s*<\/button>/g,
  `<button onClick={() => toggleStatus(tenant.id)} className={\`px-3 py-1.5 text-[10px] font-bold rounded transition \${tenant.status === "active" ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50"}\`}>
                {tenant.status === "active" ? "إيقاف الاشتراك" : "تفعيل الاشتراك"}
              </button>
              <button onClick={() => handleDelete(tenant.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition" title="حذف المكتب">
                <Trash2 className="w-4 h-4" />
              </button>`
);

content = content.replace(
  /const handleDelete = \(id: string\) => {/g,
  `const toggleStatus = (id: string) => {
    setTenants(tenants.map(t => t.id === id ? { ...t, status: t.status === "active" ? "suspended" : "active" } : t));
  };
  const handleDelete = (id: string) => {`
);

content = content.replace(
  /<h4 className="text-sm font-black text-slate-900 dark:text-white truncate" title={tenant\.name}>{tenant\.name}<\/h4>/g,
  `<h4 className="text-sm font-black text-slate-900 dark:text-white truncate" title={tenant.name}>{tenant.name}</h4>
              {tenant.nationalIdFront && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold ml-2">مرفقات مؤمنة</span>
              )}`
);

// We should update the interface Tenant to include the documents
content = content.replace(
  /createdAt: string;\n\s*subscriptionEnd: string;\n}/,
  `createdAt: string;
  subscriptionEnd: string;
  nationalIdFront?: string;
  nationalIdBack?: string;
  lawyerCard?: string;
}`
);

fs.writeFileSync('src/components/TenantsAdminView.tsx', content);
