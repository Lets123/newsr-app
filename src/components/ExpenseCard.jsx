import { TrendingDown } from "lucide-react";

function ExpenseCard({ amount, change }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Expenses</h3>
        <TrendingDown size={16} className="text-rose-700" />
      </div>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">${amount.toLocaleString()}</p>
      <p className="text-xs text-rose-700">{change}% vs last month</p>
    </article>
  );
}

export default ExpenseCard;
