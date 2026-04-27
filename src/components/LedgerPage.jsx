import { useEffect, useMemo, useState } from "react";
import { financeService } from "../data/financeService";

const formatMoney = (amount) => `$${amount.toFixed(2)}`;

function LedgerPage() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const loadedEntries = await financeService.getLedgerEntries();
        if (!active) return;
        setEntries(loadedEntries || []);
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError.message || "Could not load ledger.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    entries.forEach((item) => {
      if (item.direction === "in") inflow += item.amount;
      else outflow += item.amount;
    });
    return { inflow, outflow, net: inflow - outflow };
  }, [entries]);

  const withRunningBalance = useMemo(() => {
    let running = 0;
    return [...entries]
      .reverse()
      .map((item) => {
        running += item.direction === "in" ? item.amount : -item.amount;
        return { ...item, runningBalance: running };
      })
      .reverse();
  }, [entries]);

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <h1 className="text-lg font-extrabold text-slate-900">Ledger</h1>
        <p className="text-sm text-slate-600">
          Unified timeline across collections, expenses, and other income.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Inflow</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">{formatMoney(totals.inflow)}</p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Outflow</p>
          <p className="mt-1 text-2xl font-extrabold text-red-700">{formatMoney(totals.outflow)}</p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Net</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatMoney(totals.net)}</p>
        </article>
      </section>

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-3">
          <h2 className="text-sm font-bold text-slate-900">Ledger Entries</h2>
        </div>
        {error ? <p className="px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Party</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {withRunningBalance.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-3 py-2">{item.date}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{item.type}</td>
                  <td className="px-3 py-2">{item.reference}</td>
                  <td className="px-3 py-2">{item.party}</td>
                  <td className="px-3 py-2">{item.method}</td>
                  <td
                    className={[
                      "px-3 py-2 font-semibold",
                      item.direction === "in" ? "text-emerald-700" : "text-red-700",
                    ].join(" ")}
                  >
                    {item.direction === "in" ? "+" : "-"} {formatMoney(item.amount)}
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{formatMoney(item.runningBalance)}</td>
                </tr>
              ))}
              {withRunningBalance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-500">
                    No ledger activity yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default LedgerPage;
