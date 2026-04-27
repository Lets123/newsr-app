import RevenueCard from "./RevenueCard";
import ExpenseCard from "./ExpenseCard";

const channels = [
  { name: "In-store POS", revenue: 14580, expense: 8630 },
  { name: "Online Orders", revenue: 7640, expense: 3920 },
  { name: "Wholesale", revenue: 5110, expense: 3020 },
];

function FinancePage() {
  const totalRevenue = channels.reduce((sum, channel) => sum + channel.revenue, 0);
  const totalExpense = channels.reduce((sum, channel) => sum + channel.expense, 0);
  const net = totalRevenue - totalExpense;
  const margin = totalRevenue ? (net / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <h1 className="text-lg font-extrabold text-slate-900">Finance</h1>
        <p className="text-sm text-slate-600">Revenue and expense snapshot with channel performance.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <RevenueCard amount={totalRevenue} growth={8.6} />
        <ExpenseCard amount={totalExpense} change={3.4} />
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Channel Breakdown</h2>
          <div className="text-sm font-semibold text-slate-700">
            Net: <span className="text-emerald-700">${net.toLocaleString()}</span> ({margin.toFixed(1)}%)
          </div>
        </div>
        <div className="space-y-2">
          {channels.map((channel) => {
            const channelNet = channel.revenue - channel.expense;
            const width = (channel.revenue / totalRevenue) * 100;

            return (
              <article key={channel.name} className="rounded-md border border-slate-200 p-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">{channel.name}</h3>
                  <div className="text-xs font-semibold text-slate-600">
                    Revenue ${channel.revenue.toLocaleString()} | Expense ${channel.expense.toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-sky-700" style={{ width: `${width}%` }} />
                </div>
                <p className="mt-1 text-xs font-semibold text-emerald-700">
                  Net Contribution: ${channelNet.toLocaleString()}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default FinancePage;
