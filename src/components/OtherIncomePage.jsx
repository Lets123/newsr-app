import { useEffect, useMemo, useState } from "react";
import { financeService } from "../data/financeService";

const incomeTypes = ["Commission", "Rental", "Capital", "Refund", "Other"];

function OtherIncomePage() {
  const [incomeItems, setIncomeItems] = useState([]);
  const [form, setForm] = useState({
    date: "2026-04-27",
    type: incomeTypes[0],
    source: "",
    amount: "",
    note: "",
  });
  const [error, setError] = useState("");

  const totalIncome = useMemo(() => incomeItems.reduce((sum, item) => sum + item.amount, 0), [incomeItems]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const loadedIncome = await financeService.getOtherIncome();
        if (!active) return;
        setIncomeItems(loadedIncome || []);
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError.message || "Could not load other income.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.source.trim()) {
      setError("Please enter income source.");
      return;
    }

    const result = await financeService.addOtherIncome({
      date: form.date,
      type: form.type,
      source: form.source,
      amount: form.amount,
      note: form.note,
    });
    if (!result.ok) {
      setError(result.error || "Could not save income.");
      return;
    }
    const loadedIncome = await financeService.getOtherIncome();
    setIncomeItems(loadedIncome || []);
    setForm((prev) => ({ ...prev, source: "", amount: "", note: "" }));
  };

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <h1 className="text-lg font-extrabold text-slate-900">Other Income</h1>
        <p className="text-sm text-slate-600">Track non-sales earnings to keep the ledger complete.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Other Income</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">${totalIncome.toFixed(2)}</p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Entries</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{incomeItems.length}</p>
        </article>
      </section>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-md border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-bold text-slate-900">Add Other Income</h2>
          <form className="mt-2 space-y-2" onSubmit={handleSubmit}>
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            />
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            >
              {incomeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Source"
              value={form.source}
              onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            />
            {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
            <button className="w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Save Income
            </button>
          </form>
        </section>

        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-3">
            <h2 className="text-sm font-bold text-slate-900">Income History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {incomeItems.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{item.date}</td>
                    <td className="px-3 py-2">{item.type}</td>
                    <td className="px-3 py-2">{item.source}</td>
                    <td className="px-3 py-2 font-semibold text-emerald-700">${item.amount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-slate-600">{item.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default OtherIncomePage;
