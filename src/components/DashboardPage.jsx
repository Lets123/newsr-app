import { ReceiptText, Boxes, Wallet, AlertTriangle } from "lucide-react";

const kpis = [
  { label: "Today Sales", value: "$4,860", icon: ReceiptText, tone: "text-sky-800 bg-sky-100" },
  { label: "Orders", value: "129", icon: ReceiptText, tone: "text-emerald-800 bg-emerald-100" },
  { label: "SKUs", value: "534", icon: Boxes, tone: "text-amber-800 bg-amber-100" },
  { label: "Cash in Hand", value: "$1,420", icon: Wallet, tone: "text-violet-800 bg-violet-100" },
];

const lowStock = [
  { sku: "RFL-103", name: "Whole Wheat Flour 2kg", qty: 9 },
  { sku: "RFL-110", name: "Cooking Salt 1kg", qty: 7 },
  { sku: "RFL-124", name: "Brown Sugar 1kg", qty: 6 },
];

function DashboardPage() {
  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <h1 className="text-lg font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Daily store pulse with billing and inventory highlights.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-md border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-600">{item.label}</h2>
                <div className={`rounded-md p-1.5 ${item.tone}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{item.value}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600" />
          <h2 className="text-sm font-bold text-slate-900">Low Stock Alerts</h2>
        </div>
        <div className="space-y-2">
          {lowStock.map((item) => (
            <article
              key={item.sku}
              className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-2 py-1.5"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-600">{item.sku}</p>
              </div>
              <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-red-700">
                {item.qty} left
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
