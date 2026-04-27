import { TrendingUp } from "lucide-react";

function RevenueCard({ amount, growth }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Revenue</h3>
        <TrendingUp size={16} className="text-emerald-700" />
      </div>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">${amount.toLocaleString()}</p>
      <p className="text-xs text-emerald-700">{growth}% vs last month</p>
    </article>
  );
}

export default RevenueCard;
